declare class Redis {
    private client;
    status: string;
    constructor();
    connect(): Promise<void>;
    ping(): Promise<string>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    quit(): Promise<void>;
    cacheAgentData(agentId: string, data: any, ttl?: number): Promise<void>;
    getAgentData(agentId: string): Promise<any | null>;
    cacheNetworkSnapshot(snapshot: any, ttl?: number): Promise<void>;
    getNetworkSnapshot(): Promise<any | null>;
    publishAgentEvent(event: any): Promise<void>;
    publishNetworkUpdate(update: any): Promise<void>;
}
export declare const redis: Redis;
export {};
//# sourceMappingURL=redis.d.ts.map