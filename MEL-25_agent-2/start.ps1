# MEL-25 Agent-2 Startup Script
# PowerShell script to start the complete system

Write-Host "🚀 Starting MEL-25 Agent-2: BCD Marketing Strategy Research System" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
Write-Host "📋 Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
$directories = @(
    "data/raw",
    "data/processed", 
    "data/research",
    "data/output",
    "latex/output",
    "n8n/data",
    "api/logs"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

# Start the services
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Test API health
Write-Host "🔍 Testing API health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 10
    Write-Host "✅ API is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API health check failed. Services may still be starting..." -ForegroundColor Yellow
}

# Display access information
Write-Host ""
Write-Host "🎉 MEL-25 Agent-2 is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Information:" -ForegroundColor Cyan
Write-Host "   API: http://localhost:8000" -ForegroundColor White
Write-Host "   n8n: http://localhost:5678 (admin/secure_password)" -ForegroundColor White
Write-Host "   Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "📚 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "   Start BCD Research:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:8000/api/agents/bcd-research/run -H 'Content-Type: application/json' -d '{\"researchType\": \"full\"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "   Generate Strategy Document:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:8000/api/latex/generate-bcd-strategy -H 'Content-Type: application/json' -d '{\"title\": \"BCD Marketing Strategy Research\"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "   Stop services: docker-compose down" -ForegroundColor Gray
Write-Host "   Restart API: docker-compose restart api" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For more information, see README.md" -ForegroundColor Cyan 