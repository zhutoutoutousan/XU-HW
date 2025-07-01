from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, window
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Table, Column, Integer, Float, String, DateTime, MetaData
from hdfs import InsecureClient
import json
from datetime import datetime
import signal
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class TemperatureConsumer:
    def __init__(self):
        logger.info("Initializing TemperatureConsumer...")
        
        # Kafka configuration
        self.kafka_broker = os.getenv('KAFKA_BROKER', 'localhost:9092')
        self.topic = 'opensensemap_temperature'
        logger.info(f"Kafka broker: {self.kafka_broker}, Topic: {self.topic}")
        
        # SQLite configuration
        self.sqlite_db = 'temperature_data.db'
        self.engine = create_engine(f'sqlite:///{self.sqlite_db}')
        logger.info(f"SQLite database: {self.sqlite_db}")
        
        # Hadoop configuration
        self.hdfs_url = os.getenv('HDFS_URL', 'http://localhost:9870')
        self.hdfs_user = os.getenv('HDFS_USER', 'hdfs')
        self.hdfs_client = InsecureClient(self.hdfs_url, user=self.hdfs_user)
        logger.info(f"HDFS URL: {self.hdfs_url}")
        
        # Spark session
        self.spark = None
        self.query = None
        
        # Initialize database
        self.init_database()
        
        # Define schema for temperature data
        self.schema = StructType([
            StructField("timestamp", TimestampType()),
            StructField("temperature", DoubleType()),
            StructField("humidity", DoubleType()),
            StructField("pressure", DoubleType()),
            StructField("location", StructType([
                StructField("latitude", DoubleType()),
                StructField("longitude", DoubleType())
            ]))
        ])
        logger.info("Schema initialized")

    def init_database(self):
        """Initialize SQLite database"""
        logger.info("Initializing SQLite database...")
        metadata = MetaData()
        
        # Create measurements table
        Table('measurements', metadata,
            Column('id', Integer, primary_key=True),
            Column('temperature', Float),
            Column('humidity', Float),
            Column('pressure', Float),
            Column('timestamp', DateTime),
            Column('latitude', Float),
            Column('longitude', Float)
        )
        
        # Create tables
        metadata.create_all(self.engine)
        logger.info("Database initialized successfully")

    def process_batch(self, df, epoch_id):
        """Process each batch of data"""
        try:
            logger.info(f"Processing batch {epoch_id}")
            
            # Convert DataFrame to rows
            rows = df.collect()
            logger.info(f"Collected {len(rows)} records")
            
            # Prepare data for SQLite
            measurements = []
            for row in rows:
                measurement = {
                    'temperature': float(row.temperature) if row.temperature else None,
                    'humidity': float(row.humidity) if row.humidity else None,
                    'pressure': float(row.pressure) if row.pressure else None,
                    'timestamp': row.timestamp,
                    'latitude': float(row.location.latitude) if row.location and row.location.latitude else None,
                    'longitude': float(row.location.longitude) if row.location and row.location.longitude else None
                }
                measurements.append(measurement)
            
            # Save to SQLite
            if measurements:
                logger.info(f"Saving {len(measurements)} records to SQLite")
                with self.engine.connect() as conn:
                    conn.execute(
                        Table('measurements', MetaData(), autoload_with=self.engine).insert(),
                        measurements
                    )
            
            # Save to Hadoop
            if rows:
                # Create timestamp-based directory
                timestamp = datetime.now().strftime('%Y-%m-%d_%H')
                hdfs_path = f'/temperature_data/{timestamp}/batch_{epoch_id}.json'
                logger.info(f"Saving data to HDFS: {hdfs_path}")
                
                # Convert data to JSON
                json_data = [row.asDict() for row in rows]
                
                # Write to HDFS
                with self.hdfs_client.write(hdfs_path, encoding='utf-8') as writer:
                    json.dump(json_data, writer)
                
            logger.info(f"Successfully processed batch {epoch_id}")
            
        except Exception as e:
            logger.error(f"Error processing batch {epoch_id}: {e}", exc_info=True)

    def cleanup(self, signum=None, frame=None):
        """Cleanup Spark resources"""
        logger.info("Cleaning up resources...")
        try:
            if self.query:
                self.query.stop()
            if self.spark:
                self.spark.stop()
            logger.info("Cleanup complete")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}", exc_info=True)
        finally:
            sys.exit(0)

    def run(self):
        """Run the Spark Streaming consumer"""
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        
        try:
            logger.info("Initializing Spark session...")
            # Initialize Spark session with proper configuration
            self.spark = SparkSession.builder \
                .appName("TemperatureConsumer") \
                .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
                .config("spark.streaming.stopGracefullyOnShutdown", "true") \
                .config("spark.sql.streaming.forceDeleteTempCheckpointLocation", "true") \
                .config("spark.executor.memory", "1g") \
                .config("spark.driver.memory", "1g") \
                .config("spark.sql.shuffle.partitions", "2") \
                .config("spark.default.parallelism", "2") \
                .config("spark.streaming.kafka.maxRatePerPartition", "100") \
                .config("spark.streaming.backpressure.enabled", "true") \
                .config("spark.streaming.kafka.consumer.cache.enabled", "false") \
                .getOrCreate()

            logger.info("Setting up Kafka source...")
            # Read from Kafka
            df = self.spark \
                .readStream \
                .format("kafka") \
                .option("kafka.bootstrap.servers", self.kafka_broker) \
                .option("subscribe", self.topic) \
                .option("startingOffsets", "latest") \
                .option("failOnDataLoss", "false") \
                .option("maxOffsetsPerTrigger", "100") \
                .load()
            
            logger.info("Setting up data parsing...")
            # Parse JSON data
            parsed_df = df.select(
                from_json(col("value").cast("string"), self.schema).alias("data")
            ).select("data.*")
            
            logger.info("Starting streaming query...")
            # Process each batch
            self.query = parsed_df \
                .writeStream \
                .foreachBatch(self.process_batch) \
                .outputMode("append") \
                .option("checkpointLocation", "./checkpoints") \
                .trigger(processingTime="5 seconds") \
                .start()
            
            logger.info("Streaming query started, waiting for data...")
            # Wait for termination
            self.query.awaitTermination()
            
        except Exception as e:
            logger.error(f"Error in Spark Streaming: {e}", exc_info=True)
            self.cleanup()

if __name__ == "__main__":
    try:
        logger.info("Starting Temperature Consumer application...")
        consumer = TemperatureConsumer()
        consumer.run()
    except Exception as e:
        logger.error(f"Fatal error in main: {e}", exc_info=True)
        sys.exit(1) 