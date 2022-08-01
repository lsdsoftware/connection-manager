interface Closeable {
    close(): void;
    once(event: "close", callback: Function): void;
}
interface Options<T> {
    connect(): Promise<T>;
    retryDelay: number;
}
export declare class ConnectionManager<T extends Closeable> {
    private readonly opts;
    private promise?;
    private shutdownFlag;
    constructor(opts: Options<T>);
    get(): Promise<T>;
    private keepAlive;
    private connectUntilSucceed;
    shutdown(): void;
}
export {};
