interface Closeable {
    close(): void;
    once(event: "close", callback: Function): void;
}
interface Options<T> {
    connect(): Promise<T>;
    retryDelay: number;
}
export declare class ConnectionManager<T extends Closeable> {
    private readonly connectionObservable;
    private readonly shutdownSubject;
    constructor(opts: Options<T>);
    get(): Promise<T>;
    shutdown(): void;
}
export {};
