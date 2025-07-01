# Big Data Starter Project

A comprehensive starter project for big data processing using Apache Hadoop, Apache Kafka, and Python. This project provides a foundation for building distributed data processing systems with proper configurations for Windows environments.

## 🚀 Features

- Pre-configured Hadoop and Kafka setup for Windows
- Producer-Consumer architecture for data streaming
- Automated environment setup scripts
- Detailed documentation for parallel computing concepts
- Production-ready configuration files

## 📋 Project Structure

```
big-data-starter/
├── setup_environment.ps1    # Automated environment setup script
├── start_hadoop.ps1         # Hadoop services startup script
├── start_kafka.ps1          # Kafka services startup script
├── producer.py             # Data producer implementation
├── consumer.py             # Data consumer with processing logic
├── requirements.txt        # Python dependencies
└── ParallelComputing.md    # Detailed architecture documentation
```

## 🛠 Prerequisites

1. Windows 10/11 with PowerShell 5.1+
2. Python 3.8 or higher
3. Administrator privileges for initial setup
4. PowerShell execution policy set to allow scripts:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## 🔧 Installation

1. Clone this repository:
   ```powershell
   git clone <repository-url>
   cd big-data-starter
   ```

2. Run the automated setup script (as Administrator):
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup_environment.ps1
   ```
   This script will:
   - Install OpenJDK 8
   - Set up Hadoop 3.3.6
   - Configure Kafka 3.6.1
   - Set required environment variables
   - Download necessary Windows utilities

3. Create and activate Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

## 🚀 Starting the Services

1. Start Hadoop:
   ```powershell
   .\start_hadoop.ps1
   ```
   Verify at: http://localhost:9870

2. Start Kafka:
   ```powershell
   .\start_kafka.ps1
   ```

## 💻 Running the Application

1. Start the producer:
   ```powershell
   python producer.py
   ```

2. Start the consumer:
   ```powershell
   python consumer.py
   ```

## 🔍 Verification Steps

1. Hadoop verification:
   - Navigate to http://localhost:9870
   - Check DataNodes status
   - Verify HDFS functionality

2. Kafka verification:
   ```powershell
   # List topics
   kafka-topics.bat --list --bootstrap-server localhost:9092
   
   # Monitor messages
   kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic your_topic --from-beginning
   ```

## 📚 Documentation

For detailed information about the system architecture and parallel computing concepts, refer to `ParallelComputing.md`. This document includes:

- System architecture diagrams
- Kafka configuration details
- Message processing strategies
- Spark integration guidelines
- HDFS architecture overview

## 🔧 Troubleshooting

1. Hadoop Issues:
   - Check logs in hadoop/logs directory
   - Verify JAVA_HOME setting
   - Ensure proper permissions

2. Kafka Issues:
   - Verify ZooKeeper is running
   - Check for port conflicts (9092)
   - Clear ZooKeeper data if corrupted

3. Common Solutions:
   - Run PowerShell as Administrator
   - Check port availability (9000, 9092, 9870)
   - Verify environment variables

## 🛑 Stopping Services

1. Stop Kafka:
   - Press Ctrl+C in Kafka window
   - Press Ctrl+C in ZooKeeper window

2. Stop Hadoop:
   - Press Ctrl+C in NameNode window
   - Press Ctrl+C in DataNode window

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Apache Hadoop community
- Apache Kafka community
- Contributors to the parallel computing documentation 