# MEL-25 Agent Network Setup Script
# This script sets up the complete n8n-based agent network system

Write-Host "🚀 Setting up MEL-25 Agent Network..." -ForegroundColor Green

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "Creating project directories..." -ForegroundColor Yellow
$directories = @(
    "api/src/config",
    "api/src/routes", 
    "api/src/services",
    "api/src/middleware",
    "api/src/socket",
    "frontend/src/lib/components",
    "n8n/workflows",
    "database"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Create environment file
Write-Host "Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_network
DB_USER=agent_user
DB_PASSWORD=agent_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=8000
NODE_ENV=development

# n8n Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Environment file created" -ForegroundColor Green

# Create missing API files
Write-Host "Creating missing API components..." -ForegroundColor Yellow

# Create network routes
$networkRoutes = @"
import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/relationships', async (req, res) => {
    try {
        const result = await database.query(
            'SELECT * FROM agent_relationships WHERE source_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL) AND target_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL)'
        );
        res.json({ relationships: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch relationships' });
    }
});

export { router as networkRoutes };
"@

$networkRoutes | Out-File -FilePath "api/src/routes/network.ts" -Encoding UTF8

# Create metrics routes
$metricsRoutes = @"
import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await database.query('SELECT * FROM business_metrics ORDER BY created_at DESC LIMIT 100');
        res.json({ metrics: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

export { router as metricsRoutes };
"@

$metricsRoutes | Out-File -FilePath "api/src/routes/metrics.ts" -Encoding UTF8

# Create n8n routes
$n8nRoutes = @"
import { Router } from 'express';

const router = Router();

router.post('/webhook/negotiation', async (req, res) => {
    try {
        // Handle n8n webhook for negotiations
        console.log('Negotiation webhook received:', req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process negotiation' });
    }
});

export { router as n8nRoutes };
"@

$n8nRoutes | Out-File -FilePath "api/src/routes/n8n.ts" -Encoding UTF8

# Create middleware
$errorHandler = @"
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
}
"@

$errorHandler | Out-File -FilePath "api/src/middleware/errorHandler.ts" -Encoding UTF8

$validation = @"
import { Request, Response, NextFunction } from 'express';

export function validateAgent(req: Request, res: Response, next: NextFunction) {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
    }
    next();
}

export function validateAgentUpdate(req: Request, res: Response, next: NextFunction) {
    next();
}
"@

$validation | Out-File -FilePath "api/src/middleware/validation.ts" -Encoding UTF8

# Create socket handlers
$socketHandlers = @"
import { Server } from 'socket.io';

export function setupSocketHandlers(io: Server) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}
"@

$socketHandlers | Out-File -FilePath "api/src/socket/handlers.ts" -Encoding UTF8

# Create network analyzer service
$networkAnalyzer = @"
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

class NetworkAnalyzer {
    private isRunning: boolean = false;

    async start(): Promise<void> {
        this.isRunning = true;
        logger.info('Network analyzer started');
    }

    async stop(): Promise<void> {
        this.isRunning = false;
        logger.info('Network analyzer stopped');
    }
}

export const networkAnalyzer = new NetworkAnalyzer();
"@

$networkAnalyzer | Out-File -FilePath "api/src/services/networkAnalyzer.ts" -Encoding UTF8

Write-Host "✅ API components created" -ForegroundColor Green

# Create frontend environment file
Write-Host "Creating frontend environment..." -ForegroundColor Yellow
$frontendEnv = @"
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
"@

$frontendEnv | Out-File -FilePath "frontend/.env" -Encoding UTF8

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# API dependencies
Write-Host "Installing API dependencies..." -ForegroundColor Yellow
Set-Location "api"
if (Test-Path "package.json") {
    npm install
} else {
    Write-Host "⚠️  API package.json not found, skipping npm install" -ForegroundColor Yellow
}
Set-Location ".."

# Frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"
if (Test-Path "package.json") {
    npm install
} else {
    Write-Host "⚠️  Frontend package.json not found, skipping npm install" -ForegroundColor Yellow
}
Set-Location ".."

# Build and start the system
Write-Host "Building and starting the system..." -ForegroundColor Yellow

try {
    # Stop any existing containers
    docker-compose down 2>$null
    
    # Build and start the system
    docker-compose up --build -d
    
    Write-Host "✅ System started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access the system at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   n8n: http://localhost:5678 (admin/admin123)" -ForegroundColor White
    Write-Host "   API: http://localhost:8000" -ForegroundColor White
    Write-Host "   Database: localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   README.md - Complete system documentation" -ForegroundColor White
    Write-Host "   DEVELOPMENT.md - Development setup guide" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs -f    # View logs" -ForegroundColor White
    Write-Host "   docker-compose down       # Stop system" -ForegroundColor White
    Write-Host "   docker-compose restart    # Restart system" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to start the system. Please check the error messages above." -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop" -ForegroundColor White
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Setup complete! The neuroplasticity-inspired agent network is ready." -ForegroundColor Green 