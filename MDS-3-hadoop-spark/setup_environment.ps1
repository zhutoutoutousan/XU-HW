# Setup script for Hadoop and Kafka on Windows
# Requires PowerShell running as Administrator

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    Exit 1
}

# Create directories for installations
$INSTALL_DIR = "D:\big_data"
$HADOOP_HOME = "$INSTALL_DIR\hadoop"
$KAFKA_HOME = "$INSTALL_DIR\kafka"
$JAVA_HOME = "$INSTALL_DIR\java"
$TEMP_DIR = "$INSTALL_DIR\temp"
$DOWNLOAD_DIR = "$INSTALL_DIR\downloads"  # Persistent download directory

# Create installation directories
New-Item -ItemType Directory -Force -Path $INSTALL_DIR
New-Item -ItemType Directory -Force -Path $TEMP_DIR
New-Item -ItemType Directory -Force -Path $DOWNLOAD_DIR

# Function to download file if not exists
function Download-FileIfNotExists {
    param (
        [string]$url,
        [string]$outputPath
    )
    
    if (-not (Test-Path $outputPath)) {
        Write-Host "Downloading $url to $outputPath..."
        try {
            Invoke-WebRequest -Uri $url -OutFile $outputPath
            if (-not (Test-Path $outputPath)) {
                throw "Download failed: File not created"
            }
        }
        catch {
            Write-Host "Error downloading file: $_" -ForegroundColor Red
            throw
        }
    } else {
        Write-Host "File already exists: $outputPath" -ForegroundColor Yellow
    }
}

# Install 7-Zip if not present
if (-not (Test-Path "C:\Program Files\7-Zip\7z.exe")) {
    Write-Host "Installing 7-Zip..."
    $7zipUrl = "https://7-zip.org/a/7z2301-x64.exe"
    $7zipInstaller = "$DOWNLOAD_DIR\7z-installer.exe"
    Download-FileIfNotExists -url $7zipUrl -outputPath $7zipInstaller
    Start-Process -FilePath $7zipInstaller -ArgumentList "/S" -Wait
    # Don't remove the installer in case we need it again
}

# Function to extract archives
function Extract-Archive {
    param (
        [string]$archivePath,
        [string]$destinationPath
    )
    
    Write-Host "Extracting $archivePath to $destinationPath..." -ForegroundColor Cyan
    if (-not (Test-Path $archivePath)) {
        throw "Archive not found: $archivePath"
    }
    
    if ($archivePath.EndsWith(".zip")) {
        Expand-Archive -Path $archivePath -DestinationPath $destinationPath -Force
    } else {
        # Create a temporary directory for extraction
        $tempExtractPath = Join-Path $TEMP_DIR "extract_temp"
        New-Item -ItemType Directory -Force -Path $tempExtractPath | Out-Null
        
        try {
            # First extract the .tar.gz to .tar
            $result = & "C:\Program Files\7-Zip\7z.exe" x $archivePath "-o$tempExtractPath" -y
            if ($LASTEXITCODE -ne 0) {
                throw "7-Zip extraction failed with exit code $LASTEXITCODE"
            }
            
            # Find the .tar file
            $tarFile = Get-ChildItem -Path $tempExtractPath -Filter "*.tar" | Select-Object -First 1
            if ($tarFile) {
                # Extract the .tar file
                $result = & "C:\Program Files\7-Zip\7z.exe" x $tarFile.FullName "-o$destinationPath" -y
                if ($LASTEXITCODE -ne 0) {
                    throw "7-Zip extraction failed with exit code $LASTEXITCODE"
                }
            } else {
                throw "No .tar file found after extracting $archivePath"
            }
        }
        finally {
            # Clean up temp directory
            Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Function to copy directory with long path support
function Copy-DirectoryWithLongPaths {
    param (
        [string]$Source,
        [string]$Destination,
        [array]$ExcludeDirs = @('doc', 'docs', 'documentation')
    )
    
    Write-Host "Copying from $Source to $Destination..." -ForegroundColor Cyan
    
    # Create the destination directory if it doesn't exist
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    }
    
    # Get all items from source
    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $targetPath = $_.FullName.Replace($Source, $Destination)
        
        # Skip excluded directories
        $skipFile = $false
        foreach ($excludeDir in $ExcludeDirs) {
            if ($_.FullName -like "*\$excludeDir\*") {
                $skipFile = $true
                break
            }
        }
        
        if (-not $skipFile) {
            if ($_.PSIsContainer) {
                # Create directory
                if (-not (Test-Path $targetPath)) {
                    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
                }
            } else {
                # Copy file
                try {
                    $targetDir = Split-Path -Parent $targetPath
                    if (-not (Test-Path $targetDir)) {
                        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
                    }
                    Copy-Item -Path $_.FullName -Destination $targetPath -Force -ErrorAction Stop
                } catch {
                    Write-Host "Warning: Could not copy $($_.FullName). Error: $_" -ForegroundColor Yellow
                }
            }
        }
    }
}

# Download and install Java
Write-Host "Setting up Java..."
$JAVA_URL = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u392-b08/OpenJDK8U-jdk_x64_windows_hotspot_8u392b08.zip"
$JAVA_ZIP = "$DOWNLOAD_DIR\openjdk.zip"
if (-not (Test-Path $JAVA_HOME)) {
    Download-FileIfNotExists -url $JAVA_URL -outputPath $JAVA_ZIP
    Extract-Archive -archivePath $JAVA_ZIP -destinationPath $INSTALL_DIR
    if (Test-Path "$INSTALL_DIR\jdk8u392-b08") {
        Move-Item "$INSTALL_DIR\jdk8u392-b08" $JAVA_HOME -Force
    }
} else {
    Write-Host "Java already installed at $JAVA_HOME" -ForegroundColor Yellow
}

# Download and install Hadoop
Write-Host "Setting up Hadoop..."
$HADOOP_URL = "https://archive.apache.org/dist/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz"
$HADOOP_TAR = "$DOWNLOAD_DIR\hadoop.tar.gz"

# Clean up existing Hadoop installation if it exists
if (Test-Path $HADOOP_HOME) {
    Write-Host "Removing existing Hadoop installation..." -ForegroundColor Yellow
    Remove-Item -Path $HADOOP_HOME -Recurse -Force
}

# Create base Hadoop directory
New-Item -ItemType Directory -Force -Path $HADOOP_HOME | Out-Null

# Create all necessary directories first
$dirs = @(
    "$HADOOP_HOME\bin",
    "$HADOOP_HOME\etc\hadoop",
    "$HADOOP_HOME\logs",
    "$HADOOP_HOME\data\namenode",
    "$HADOOP_HOME\data\datanode"
)
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Download and extract Hadoop
Download-FileIfNotExists -url $HADOOP_URL -outputPath $HADOOP_TAR
$tempExtractPath = Join-Path $TEMP_DIR "hadoop_extract"
New-Item -ItemType Directory -Force -Path $tempExtractPath | Out-Null

try {
    Extract-Archive -archivePath $HADOOP_TAR -destinationPath $tempExtractPath
    
    # Copy files from the extracted directory to HADOOP_HOME
    $extractedHadoopDir = Join-Path $tempExtractPath "hadoop-3.3.6"
    if (Test-Path $extractedHadoopDir) {
        Write-Host "Copying Hadoop files..." -ForegroundColor Cyan
        
        # Copy essential directories first
        $essentialDirs = @(
            "bin",
            "etc",
            "include",
            "lib",
            "libexec",
            "sbin"
        )
        
        foreach ($dir in $essentialDirs) {
            $sourcePath = Join-Path $extractedHadoopDir $dir
            $destPath = Join-Path $HADOOP_HOME $dir
            if (Test-Path $sourcePath) {
                Copy-DirectoryWithLongPaths -Source $sourcePath -Destination $destPath
            }
        }
        
        # Copy share directory without documentation
        $shareSource = Join-Path $extractedHadoopDir "share"
        $shareTarget = Join-Path $HADOOP_HOME "share"
        if (Test-Path $shareSource) {
            Copy-DirectoryWithLongPaths -Source $shareSource -Destination $shareTarget -ExcludeDirs @('doc', 'docs', 'documentation')
        }
    } else {
        throw "Hadoop files not found in extracted directory"
    }
}
finally {
    # Clean up temporary directory
    Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Download winutils separately
Write-Host "Downloading Windows utilities for Hadoop..."

# Define multiple version fallbacks
$versions = @("3.3.6", "3.3.5", "3.3.1")
$sources = @(
    "https://github.com/cdarlint/winutils/raw/master/hadoop-{0}/bin",
    "https://github.com/kontext-tech/winutils/raw/master/hadoop-{0}/bin",
    "https://github.com/steveloughran/winutils/raw/master/hadoop-{0}/bin"
)

$files = @("winutils.exe", "hadoop.dll", "hdfs.dll")
$success = @{}

foreach ($file in $files) {
    $success[$file] = $false
    foreach ($version in $versions) {
        if (-not $success[$file]) {
            foreach ($sourceTemplate in $sources) {
                try {
                    $source = $sourceTemplate -f $version
                    Write-Host "Attempting to download $file from $source..."
                    $webClient = New-Object System.Net.WebClient
                    $webClient.DownloadFile("$source/$file", "$env:HADOOP_HOME\bin\$file")
                    Write-Host "Successfully downloaded $file"
                    $success[$file] = $true
                    break
                }
                catch {
                    Write-Host "Failed to download from $source : $_"
                    continue
                }
            }
        }
    }
}

# Check if any files failed to download
$failedFiles = $success.Keys | Where-Object { -not $success[$_] }
if ($failedFiles) {
    Write-Host "Warning: The following files could not be downloaded: $($failedFiles -join ', ')"
    Write-Host "Attempting to compile missing files from source..."
    
    # Here we would add logic to compile from source if needed
    # For now, just warn the user
    Write-Host "Compilation from source not yet implemented. Some Hadoop functionality may be limited."
}

# Create hdfs.cmd if it doesn't exist
$HDFS_CMD = @"
@echo off
"%~dp0hadoop.cmd" org.apache.hadoop.hdfs.tools.DFSAdmin %*
"@
Set-Content -Path "$HADOOP_HOME\bin\hdfs.cmd" -Value $HDFS_CMD -Force
    
# Create hadoop.cmd if it doesn't exist
$HADOOP_CMD = @"
@echo off
setlocal enabledelayedexpansion

set HADOOP_BIN_PATH=%~dp0

for %%i in ("%HADOOP_BIN_PATH%") do set HADOOP_HOME=%%~dpi
set HADOOP_HOME=%HADOOP_HOME:~0,-1%

set HADOOP_CONF_DIR=%HADOOP_HOME%\etc\hadoop
set HADOOP_OPTS=-Djava.library.path=%HADOOP_HOME%\bin
set PATH=%HADOOP_HOME%\bin;%PATH%

"%HADOOP_HOME%\bin\hadoop.exe" %*
"@
Set-Content -Path "$HADOOP_HOME\bin\hadoop.cmd" -Value $HADOOP_CMD -Force

# Add HADOOP_OPTS environment variable for Windows
[System.Environment]::SetEnvironmentVariable("HADOOP_OPTS", "-Djava.library.path=$HADOOP_HOME\bin", [System.EnvironmentVariableTarget]::Machine)

# Create hadoop.env file for Windows-specific settings
$HADOOP_ENV = @"
set HADOOP_HOME=$HADOOP_HOME
set HADOOP_CONF_DIR=%HADOOP_HOME%\etc\hadoop
set YARN_CONF_DIR=%HADOOP_HOME%\etc\hadoop
set PATH=%HADOOP_HOME%\bin;%PATH%
set HADOOP_OPTS=-Djava.library.path=%HADOOP_HOME%\bin
"@
Set-Content -Path "$HADOOP_HOME\etc\hadoop\hadoop.env" -Value $HADOOP_ENV -Force

# Download and install Kafka
Write-Host "Setting up Kafka..."
$KAFKA_URL = "https://archive.apache.org/dist/kafka/3.6.1/kafka_2.13-3.6.1.tgz"
$KAFKA_TAR = "$DOWNLOAD_DIR\kafka.tgz"
if (-not (Test-Path $KAFKA_HOME)) {
    Download-FileIfNotExists -url $KAFKA_URL -outputPath $KAFKA_TAR
    Extract-Archive -archivePath $KAFKA_TAR -destinationPath $TEMP_DIR
    if (Test-Path "$TEMP_DIR\kafka.tar") {
        Extract-Archive -archivePath "$TEMP_DIR\kafka.tar" -destinationPath $TEMP_DIR
    }
    if (Test-Path "$TEMP_DIR\kafka_2.13-3.6.1") {
        Move-Item "$TEMP_DIR\kafka_2.13-3.6.1" $KAFKA_HOME -Force
    }
} else {
    Write-Host "Kafka already installed at $KAFKA_HOME" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "Setting environment variables..."
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $JAVA_HOME, [System.EnvironmentVariableTarget]::Machine)
[System.Environment]::SetEnvironmentVariable("HADOOP_HOME", $HADOOP_HOME, [System.EnvironmentVariableTarget]::Machine)
[System.Environment]::SetEnvironmentVariable("KAFKA_HOME", $KAFKA_HOME, [System.EnvironmentVariableTarget]::Machine)

# Update PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$newPaths = @(
    "$JAVA_HOME\bin",
    "$HADOOP_HOME\bin",
    "$KAFKA_HOME\bin\windows"
)
$pathsToAdd = $newPaths | Where-Object { $currentPath -notlike "*$_*" }
if ($pathsToAdd) {
    $newPath = $currentPath + ";" + ($pathsToAdd -join ";")
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
}

# Create Hadoop configuration files
Write-Host "Configuring Hadoop..."
New-Item -ItemType Directory -Force -Path "$HADOOP_HOME\etc\hadoop"

# core-site.xml
$coresiteXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
    </property>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>$($HADOOP_HOME.Replace('\','/'))/data</value>
    </property>
</configuration>
"@
Set-Content -Path "$HADOOP_HOME\etc\hadoop\core-site.xml" -Value $coresiteXml -Force

# hdfs-site.xml
$hdfssiteXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>$($HADOOP_HOME.Replace('\','/'))/data/namenode</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>$($HADOOP_HOME.Replace('\','/'))/data/datanode</value>
    </property>
</configuration>
"@
Set-Content -Path "$HADOOP_HOME\etc\hadoop\hdfs-site.xml" -Value $hdfssiteXml -Force

# Create directories for NameNode and DataNode
New-Item -ItemType Directory -Force -Path "$HADOOP_HOME\data\namenode"
New-Item -ItemType Directory -Force -Path "$HADOOP_HOME\data\datanode"

# Configure Kafka
Write-Host "Configuring Kafka..."
New-Item -ItemType Directory -Force -Path "$KAFKA_HOME\config"

# Create server.properties if it doesn't exist
$serverProperties = @"
# Kafka configuration
broker.id=0
listeners=PLAINTEXT://localhost:9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=$($KAFKA_HOME.Replace('\','/'))/logs
num.partitions=1
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
zookeeper.connect=localhost:2181
zookeeper.connection.timeout.ms=18000
group.initial.rebalance.delay.ms=0
"@
Set-Content -Path "$KAFKA_HOME\config\server.properties" -Value $serverProperties -Force

# Create zookeeper.properties
$zookeeperProperties = @"
# ZooKeeper configuration
dataDir=$($KAFKA_HOME.Replace('\','/'))/zookeeper
clientPort=2181
maxClientCnxns=0
admin.enableServer=false
"@
Set-Content -Path "$KAFKA_HOME\config\zookeeper.properties" -Value $zookeeperProperties -Force

# Create Kafka logs and ZooKeeper directories
New-Item -ItemType Directory -Force -Path "$KAFKA_HOME\logs"
New-Item -ItemType Directory -Force -Path "$KAFKA_HOME\zookeeper"

# Clean up temp directory but keep downloads
Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Setup complete! Please follow the README for next steps." -ForegroundColor Green
Write-Host "NOTE: You may need to restart your PowerShell session for environment variables to take effect." -ForegroundColor Yellow
Write-Host "Downloaded files are preserved in $DOWNLOAD_DIR for future use." -ForegroundColor Cyan 