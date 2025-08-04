"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkAnalyzer = void 0;
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.simple(),
    transports: [new winston_1.default.transports.Console()]
});
class NetworkAnalyzer {
    constructor() {
        this._isRunning = false;
    }
    async start() {
        this._isRunning = true;
        logger.info('Network analyzer started');
    }
    async stop() {
        this._isRunning = false;
        logger.info('Network analyzer stopped');
    }
    isRunning() {
        return this._isRunning;
    }
}
exports.networkAnalyzer = new NetworkAnalyzer();
//# sourceMappingURL=networkAnalyzer.js.map