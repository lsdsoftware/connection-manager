"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const rxjs = require("rxjs");
class ConnectionManager {
    constructor(opts) {
        this.shutdownSubject = new rxjs.BehaviorSubject(false);
        this.connectionObservable = this.shutdownSubject
            .pipe(rxjs.distinctUntilChanged(), rxjs.switchMap(shutdown => {
            if (shutdown) {
                return rxjs.throwError(() => new Error("Shutting down"));
            }
            else {
                let con;
                return rxjs.defer(opts.connect)
                    .pipe(rxjs.retry({ delay: opts.retryDelay }), rxjs.tap(value => con = value), rxjs.concatMap(con => new rxjs.Observable(sub => {
                    sub.next(con);
                    con.once("close", () => sub.error(new Error("Connection closed")));
                })), rxjs.finalize(() => con.close()));
            }
        }), rxjs.shareReplay({ bufferSize: 1, refCount: false }));
    }
    get() {
        return rxjs.firstValueFrom(this.connectionObservable);
    }
    shutdown() {
        this.shutdownSubject.next(true);
    }
}
exports.ConnectionManager = ConnectionManager;
