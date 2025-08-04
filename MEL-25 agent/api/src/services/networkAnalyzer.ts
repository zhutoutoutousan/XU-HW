import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

class NetworkAnalyzer {
    private _isRunning: boolean = false;

    async start(): Promise<void> {
        this._isRunning = true;
        logger.info('Network analyzer started');
    }

    async stop(): Promise<void> {
        this._isRunning = false;
        logger.info('Network analyzer stopped');
    }

    isRunning(): boolean {
        return this._isRunning;
    }
}

export const networkAnalyzer = new NetworkAnalyzer();
