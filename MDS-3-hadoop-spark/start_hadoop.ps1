# Start Hadoop services
$HADOOP_HOME = "D:\big_data\hadoop"

# Verify Hadoop installation
if (-not (Test-Path $HADOOP_HOME)) {
    Write-Host "Error: Hadoop installation not found at $HADOOP_HOME" -ForegroundColor Red
    Write-Host "Please run setup_environment.ps1 first" -ForegroundColor Yellow
    Exit 1
}

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int]$Port
    )
    
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        return $false
    }
    catch {
        return $true
    }
    finally {
        if ($listener) {
            $listener.Stop()
        }
    }
}

# Check if required ports are available
$requiredPorts = @(9000, 9864, 9866, 9867, 9870)
$portsInUse = @()
foreach ($port in $requiredPorts) {
    if (Test-PortInUse -Port $port) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "Error: The following ports are already in use: $($portsInUse -join ', ')" -ForegroundColor Red
    Write-Host "Please stop any running Hadoop services or processes using these ports." -ForegroundColor Yellow
    Exit 1
}

# Download winutils if not present
if (-not (Test-Path "$HADOOP_HOME\bin\winutils.exe")) {
    Write-Host "Downloading Windows utilities for Hadoop..." -ForegroundColor Cyan
    
    # Create bin directory if it doesn't exist
    if (-not (Test-Path "$HADOOP_HOME\bin")) {
        New-Item -ItemType Directory -Path "$HADOOP_HOME\bin" -Force | Out-Null
    }
    
    $version = "3.3.6"
    $files = @("winutils.exe", "hadoop.dll", "hdfs.dll")
    $baseUrl = "https://github.com/cdarlint/winutils/raw/master/hadoop-$version/bin"
    
    foreach ($file in $files) {
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile("$baseUrl/$file", "$HADOOP_HOME\bin\$file")
            Write-Host "Successfully downloaded $file" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to download $file from primary source, trying backup..." -ForegroundColor Yellow
            try {
                $backupUrl = "https://github.com/kontext-tech/winutils/raw/master/hadoop-$version/bin/$file"
                $webClient.DownloadFile($backupUrl, "$HADOOP_HOME\bin\$file")
                Write-Host "Successfully downloaded $file from backup source" -ForegroundColor Green
            }
            catch {
                Write-Host "Failed to download $file. Hadoop may not work correctly on Windows." -ForegroundColor Red
            }
        }
    }
}

if (-not (Test-Path "$HADOOP_HOME\bin\hdfs.cmd")) {
    Write-Host "Error: Hadoop Windows binaries not found" -ForegroundColor Red
    Write-Host "Please run setup_environment.ps1 again to fix Windows binaries" -ForegroundColor Yellow
    Exit 1
}

# Set required environment variables
$env:HADOOP_HOME = $HADOOP_HOME
$env:HADOOP_OPTS = "-Djava.library.path=$HADOOP_HOME\bin"
$env:Path = "$HADOOP_HOME\bin;${env:Path}"
$env:JAVA_HOME = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")

# Kill any existing Java processes that might be running Hadoop
Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*\hadoop\*" } | Stop-Process -Force

# Clean up existing data directories
Write-Host "Cleaning up existing Hadoop data directories..." -ForegroundColor Cyan
Remove-Item -Path "$HADOOP_HOME\data" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$HADOOP_HOME\logs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$HADOOP_HOME\tmp" -Recurse -Force -ErrorAction SilentlyContinue

# Create necessary Hadoop directories with proper permissions
$directories = @(
    "$HADOOP_HOME\data",
    "$HADOOP_HOME\data\namenode",
    "$HADOOP_HOME\data\namenode\edits",
    "$HADOOP_HOME\data\namenode\checkpoint",
    "$HADOOP_HOME\data\datanode",
    "$HADOOP_HOME\logs",
    "$HADOOP_HOME\etc\hadoop",
    "$HADOOP_HOME\tmp"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating directory: $dir" -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Set full permissions using winutils
    if (Test-Path "$HADOOP_HOME\bin\winutils.exe") {
        & "$HADOOP_HOME\bin\winutils.exe" chmod 777 $dir
    }
}

# Create core-site.xml
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
        <value>$($HADOOP_HOME.Replace('\','/'))/tmp</value>
    </property>
    <property>
        <name>io.file.buffer.size</name>
        <value>131072</value>
    </property>
</configuration>
"@
Set-Content -Path "$HADOOP_HOME\etc\hadoop\core-site.xml" -Value $coresiteXml -Force

# Create hdfs-site.xml
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
        <value>file:///$($HADOOP_HOME.Replace('\','/'))/data/namenode</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>file:///$($HADOOP_HOME.Replace('\','/'))/data/datanode</value>
    </property>
    <property>
        <name>dfs.permissions.enabled</name>
        <value>false</value>
    </property>
    <property>
        <name>dfs.namenode.datanode.registration.ip-hostname-check</name>
        <value>false</value>
    </property>
    <property>
        <name>dfs.namenode.edits.dir</name>
        <value>file:///$($HADOOP_HOME.Replace('\','/'))/data/namenode/edits</value>
    </property>
    <property>
        <name>dfs.namenode.checkpoint.dir</name>
        <value>file:///$($HADOOP_HOME.Replace('\','/'))/data/namenode/checkpoint</value>
    </property>
    <property>
        <name>dfs.namenode.edits.journal-plugin.file</name>
        <value>org.apache.hadoop.hdfs.server.namenode.FileJournalManager</value>
    </property>
</configuration>
"@
Set-Content -Path "$HADOOP_HOME\etc\hadoop\hdfs-site.xml" -Value $hdfssiteXml -Force

# Format namenode
Write-Host "Formatting NameNode..." -ForegroundColor Cyan
try {
    # Create a temporary script to run the format command
    $formatScript = @"
@echo off
set HADOOP_HOME=$HADOOP_HOME
set JAVA_HOME=$env:JAVA_HOME
set PATH=%HADOOP_HOME%\bin;%JAVA_HOME%\bin;%PATH%
call %HADOOP_HOME%\bin\hdfs.cmd namenode -format -force
"@
    $formatScriptPath = "$HADOOP_HOME\tmp\format_namenode.cmd"
    Set-Content -Path $formatScriptPath -Value $formatScript -Force
    
    # Run the format script
    $formatProcess = Start-Process -FilePath $formatScriptPath -NoNewWindow -Wait -PassThru
    if ($formatProcess.ExitCode -ne 0) {
        Write-Host "Error formatting NameNode. Exit code: $($formatProcess.ExitCode)" -ForegroundColor Red
        Exit 1
    }
} catch {
    Write-Host "Error formatting NameNode: $($_)" -ForegroundColor Red
    Exit 1
}

# Function to start a Hadoop service
function Start-HadoopService {
    param (
        [string]$ServiceName,
        [string]$Arguments
    )
    
    Write-Host "Starting ${ServiceName}..." -ForegroundColor Cyan
    try {
        # Create a temporary script to run the service
        $serviceScript = @"
@echo off
set HADOOP_HOME=$HADOOP_HOME
set JAVA_HOME=$env:JAVA_HOME
set PATH=%HADOOP_HOME%\bin;%JAVA_HOME%\bin;%PATH%
call %HADOOP_HOME%\bin\hdfs.cmd $Arguments
"@
        $serviceScriptPath = "$HADOOP_HOME\tmp\start_${ServiceName}.cmd"
        Set-Content -Path $serviceScriptPath -Value $serviceScript -Force
        
        $process = Start-Process -FilePath $serviceScriptPath -NoNewWindow -PassThru
        
        # Wait longer for service to start and verify it's running
        $maxAttempts = 30
        $attempt = 0
        $started = $false
        
        while ($attempt -lt $maxAttempts -and -not $started) {
            Start-Sleep -Seconds 2
            $attempt++
            
            if ($process.HasExited) {
                Write-Host "Error: ${ServiceName} failed to start. Exit code: $($process.ExitCode)" -ForegroundColor Red
                return $false
            }
            
            # For NameNode, check if port 9000 is responding
            if ($ServiceName -eq "NameNode") {
                try {
                    $tcp = New-Object System.Net.Sockets.TcpClient
                    $tcp.Connect("localhost", 9000)
                    $tcp.Close()
                    $started = $true
                } catch {}
            } else {
                # For DataNode, check if port 9866 is responding
                try {
                    $tcp = New-Object System.Net.Sockets.TcpClient
                    $tcp.Connect("localhost", 9866)
                    $tcp.Close()
                    $started = $true
                } catch {}
            }
            
            Write-Host "Waiting for ${ServiceName} to start (attempt $attempt of $maxAttempts)..." -ForegroundColor Cyan
        }
        
        if (-not $started) {
            Write-Host "Error: ${ServiceName} did not start within the expected time" -ForegroundColor Red
            return $false
        }
        
        return $true
    } catch {
        Write-Host "Error starting ${ServiceName}: $($_)" -ForegroundColor Red
        return $false
    }
}

# Start NameNode
$namenodeSuccess = Start-HadoopService -ServiceName "NameNode" -Arguments "namenode"
if (-not $namenodeSuccess) {
    Exit 1
}

# Start DataNode
$datanodeSuccess = Start-HadoopService -ServiceName "DataNode" -Arguments "datanode"
if (-not $datanodeSuccess) {
    Exit 1
}

Write-Host "`nHadoop services started successfully!" -ForegroundColor Green
Write-Host "NameNode Web UI available at http://localhost:9870" -ForegroundColor Cyan
Write-Host "DataNode Web UI available at http://localhost:9864" -ForegroundColor Cyan
Write-Host "`nTo verify the services are running, try opening the Web UIs in your browser" -ForegroundColor Yellow 