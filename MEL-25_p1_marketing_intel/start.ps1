# Marketing Intelligence AI Agent Startup Script

Write-Host "Starting Marketing Intelligence AI Agent System..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "Please edit .env file and add your DeepSeek API key" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

# Build and start the containers
Write-Host "Building and starting containers..." -ForegroundColor Green
docker-compose up --build -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "Checking service status..." -ForegroundColor Green
docker-compose ps

# Show API endpoints
Write-Host "`nAPI Endpoints:" -ForegroundColor Cyan
Write-Host "  - Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host "  - API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Competitors: http://localhost:8000/competitors" -ForegroundColor White
Write-Host "  - Research Status: http://localhost:8000/status" -ForegroundColor White

Write-Host "`nSystem is ready!" -ForegroundColor Green
Write-Host "You can now access the API at http://localhost:8000" -ForegroundColor White 