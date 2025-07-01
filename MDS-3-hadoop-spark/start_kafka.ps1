# Start Kafka services
$KAFKA_HOME = "D:\big_data\kafka"

# Verify Kafka installation
if (-not (Test-Path $KAFKA_HOME)) {
    Write-Host "Error: Kafka installation not found at $KAFKA_HOME" -ForegroundColor Red
    Write-Host "Please run setup_environment.ps1 first" -ForegroundColor Yellow
    Exit 1
}

# Kill any existing Java processes that might be running Kafka or ZooKeeper
Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*\kafka\*" } | Stop-Process -Force

# Clean up Kafka and ZooKeeper data
Write-Host "Cleaning up Kafka and ZooKeeper data..." -ForegroundColor Cyan
Remove-Item -Path "$KAFKA_HOME\logs\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$KAFKA_HOME\zookeeper\version-2" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$KAFKA_HOME\zookeeper\*" -Exclude "myid" -Recurse -Force -ErrorAction SilentlyContinue

# Create necessary directories
$directories = @(
    "$KAFKA_HOME\logs",
    "$KAFKA_HOME\zookeeper"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating directory: $dir" -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Update ZooKeeper configuration
Write-Host "Updating ZooKeeper configuration..." -ForegroundColor Cyan
$zookeeperConfig = Get-Content "$KAFKA_HOME\config\zookeeper.properties"
$zookeeperConfig = $zookeeperConfig | Where-Object { -not $_.StartsWith("jute.maxbuffer=") }
$zookeeperConfig += "jute.maxbuffer=1073741824"
Set-Content -Path "$KAFKA_HOME\config\zookeeper.properties" -Value $zookeeperConfig

# Update Kafka configuration
Write-Host "Updating Kafka configuration..." -ForegroundColor Cyan
$kafkaConfig = Get-Content "$KAFKA_HOME\config\server.properties"
$kafkaConfig = $kafkaConfig | Where-Object { 
    -not $_.StartsWith("message.max.bytes=") -and
    -not $_.StartsWith("replica.fetch.max.bytes=") -and
    -not $_.StartsWith("fetch.message.max.bytes=") -and
    -not $_.StartsWith("socket.request.max.bytes=") -and
    -not $_.StartsWith("socket.send.buffer.bytes=") -and
    -not $_.StartsWith("socket.receive.buffer.bytes=") -and
    -not $_.StartsWith("max.request.size=")
}
$kafkaConfig += @(
    "# Message size configurations",
    "message.max.bytes=1000000000",
    "replica.fetch.max.bytes=1000000000",
    "fetch.message.max.bytes=1000000000",
    "max.request.size=1000000000",
    "",
    "# Socket configurations",
    "socket.request.max.bytes=1000000000",
    "socket.send.buffer.bytes=1000000000",
    "socket.receive.buffer.bytes=1000000000"
)
Set-Content -Path "$KAFKA_HOME\config\server.properties" -Value $kafkaConfig

# Start ZooKeeper with increased memory
Write-Host "Starting ZooKeeper..." -ForegroundColor Cyan
$env:KAFKA_HEAP_OPTS = "-Xmx1G -Xms1G"
$zookeeperProcess = Start-Process -FilePath "$KAFKA_HOME\bin\windows\zookeeper-server-start.bat" `
                                 -ArgumentList "$KAFKA_HOME\config\zookeeper.properties" `
                                 -NoNewWindow -PassThru

# Wait for ZooKeeper to start
Write-Host "Waiting for ZooKeeper to start..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$started = $false

while ($attempt -lt $maxAttempts -and -not $started) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 2181)
        $tcp.Close()
        $started = $true
        Write-Host "ZooKeeper is now listening on port 2181" -ForegroundColor Green
    } catch {
        Write-Host ("Waiting for ZooKeeper to start (attempt {0} of {1})..." -f $attempt, $maxAttempts) -ForegroundColor Cyan
    }
}

if (-not $started) {
    Write-Host "Error: ZooKeeper failed to start within the expected time" -ForegroundColor Red
    Exit 1
}

# Start Kafka with increased heap size
Write-Host "Starting Kafka..." -ForegroundColor Cyan
$env:KAFKA_HEAP_OPTS = "-Xmx1G -Xms1G"
$kafkaProcess = Start-Process -FilePath "$KAFKA_HOME\bin\windows\kafka-server-start.bat" `
                             -ArgumentList "$KAFKA_HOME\config\server.properties" `
                             -NoNewWindow -PassThru

# Wait for Kafka to start
Write-Host "Waiting for Kafka to start..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$started = $false

while ($attempt -lt $maxAttempts -and -not $started) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 9092)
        $tcp.Close()
        $started = $true
        Write-Host "Kafka is now listening on port 9092" -ForegroundColor Green
    } catch {
        Write-Host ("Waiting for Kafka to start (attempt {0} of {1})..." -f $attempt, $maxAttempts) -ForegroundColor Cyan
    }
}

if (-not $started) {
    Write-Host "Error: Kafka failed to start within the expected time" -ForegroundColor Red
    Exit 1
}

# Create our topic if it doesn't exist
Start-Sleep -Seconds 5
Write-Host "Creating Kafka topic 'opensensemap_temperature'..." -ForegroundColor Cyan

$maxAttempts = 5
$attempt = 0
$success = $false

while ($attempt -lt $maxAttempts -and -not $success) {
    $attempt++
    try {
        $result = & "$KAFKA_HOME\bin\windows\kafka-topics.bat" --create --if-not-exists `
            --bootstrap-server localhost:9092 `
            --replication-factor 1 `
            --partitions 3 `
            --topic opensensemap_temperature `
            --config max.message.bytes=1073741824 `
            --config retention.bytes=10737418240
        
        if ($LASTEXITCODE -eq 0) {
            $success = $true
            Write-Host "Topic 'opensensemap_temperature' created successfully" -ForegroundColor Green
        } else {
            Write-Host ("Attempt {0}: Failed to create topic. Retrying in 5 seconds..." -f $attempt) -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    } catch {
        Write-Host ("Attempt {0}: Error creating topic - {1}" -f $attempt, $_.Exception.Message) -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}

if (-not $success) {
    Write-Host "Failed to create topic after $maxAttempts attempts" -ForegroundColor Red
    Exit 1
}

Write-Host "`nKafka services started successfully!" -ForegroundColor Green
Write-Host "ZooKeeper is running on port 2181" -ForegroundColor Cyan
Write-Host "Kafka broker is running on port 9092" -ForegroundColor Cyan
Write-Host "`nTo verify the services are running, try using kafka-topics.bat to list topics" -ForegroundColor Yellow 