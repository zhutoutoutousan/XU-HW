import { PoolClient } from 'pg';
declare class Database {
    private pool;
    connected: boolean;
    constructor();
    testConnection(): Promise<void>;
    getClient(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<any>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
export declare const database: Database;
export {};
//# sourceMappingURL=database.d.ts.map