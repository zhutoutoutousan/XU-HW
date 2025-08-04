# Marketing Analysis Strategy Department - Startup Script
# PowerShell script to start the graph-based agent network

Write-Host "🚀 Starting Marketing Analysis Strategy Department..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Navigate to project directory
Set-Location $PSScriptRoot

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Create necessary directories if they don't exist
$directories = @(
    "orchestrator",
    "agents/research",
    "agents/analysis", 
    "agents/strategy",
    "agents/report",
    "web_interface"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Created directory: $dir" -ForegroundColor Yellow
    }
}

# Start the services
Write-Host "🐳 Starting Docker Compose services..." -ForegroundColor Yellow

try {
    docker-compose up -d
    Write-Host "✅ Services started successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start services. Check the error messages above." -ForegroundColor Red
    exit 1
}

# Wait for services to initialize
Write-Host "⏳ Waiting for services to initialize (this may take 5-10 minutes on first run)..." -ForegroundColor Yellow

$maxAttempts = 60
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "✅ Orchestrator is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Service not ready yet
    }
    
    $attempt++
    Write-Progress -Activity "Waiting for services" -Status "Attempt $attempt/$maxAttempts" -PercentComplete (($attempt / $maxAttempts) * 100)
    Start-Sleep -Seconds 10
}

if ($attempt -ge $maxAttempts) {
    Write-Host "⚠️  Services may still be starting. Check logs with: docker-compose logs" -ForegroundColor Yellow
}

# Display service URLs
Write-Host ""
Write-Host "🎯 Service URLs:" -ForegroundColor Cyan
Write-Host "   • Neo4j Browser: http://localhost:7474 (neo4j/password)" -ForegroundColor White
Write-Host "   • Orchestrator API: http://localhost:8000" -ForegroundColor White
Write-Host "   • Ollama API: http://localhost:11434" -ForegroundColor White

Write-Host ""
Write-Host "📊 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "   • Check agent status: curl http://localhost:8000/agents" -ForegroundColor White
Write-Host "   • Create analysis task: curl -X POST http://localhost:8000/task -H 'Content-Type: application/json' -d '{\"task_type\": \"marketing_analysis\", \"target_url\": \"https://bettercalldominik.com/\", \"analysis_scope\": [\"content\", \"structure\", \"links\", \"metadata\"], \"priority\": \"high\"}'" -ForegroundColor White
Write-Host "   • View logs: docker-compose logs -f" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "   • Stop services: docker-compose down" -ForegroundColor White
Write-Host "   • Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   • View logs: docker-compose logs [service_name]" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Marketing Analysis Strategy Department is ready!" -ForegroundColor Green
Write-Host "   The system is now analyzing the BCD website and generating comprehensive reports." -ForegroundColor White 