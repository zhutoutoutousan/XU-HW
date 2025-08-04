declare class NetworkAnalyzer {
    private _isRunning;
    start(): Promise<void>;
    stop(): Promise<void>;
    isRunning(): boolean;
}
export declare const networkAnalyzer: NetworkAnalyzer;
export {};
//# sourceMappingURL=networkAnalyzer.d.ts.map