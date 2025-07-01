import json
import time
import random
from datetime import datetime
from confluent_kafka import Producer

# Kafka configuration
conf = {
    'bootstrap.servers': 'localhost:9092',
    'message.max.bytes': 1000000000  # 1GB (maximum allowed value)
}

# Create Producer instance
producer = Producer(conf)

def delivery_callback(err, msg):
    if err:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

def generate_sensor_data():
    return {
        'timestamp': datetime.now().isoformat(),
        'temperature': round(random.uniform(-10, 40), 2),
        'humidity': round(random.uniform(0, 100), 2),
        'pressure': round(random.uniform(980, 1020), 2),
        'location': {
            'latitude': round(random.uniform(-90, 90), 6),
            'longitude': round(random.uniform(-180, 180), 6)
        }
    }

def main():
    print("Starting OpenSenseMap data producer...")
    
    try:
        while True:
            data = generate_sensor_data()
            message = json.dumps(data)
            
            # Produce message
            producer.produce(
                'opensensemap_temperature',
                value=message.encode('utf-8'),
                callback=delivery_callback
            )
            
            # Flush to ensure delivery
            producer.poll(0)
            producer.flush()
            
            print(f"Sent data: {message}")
            time.sleep(1)  # Wait for 1 second before next message
            
    except KeyboardInterrupt:
        print("\nStopping producer...")
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        # Clean up resources
        producer.flush()
        print("Producer stopped.")

if __name__ == "__main__":
    main() 