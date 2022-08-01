"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
class ConnectionManager {
    constructor(opts) {
        this.opts = opts;
        this.shutdownFlag = false;
    }
    get() {
        if (!this.promise) {
            this.promise = new Promise(fulfill => {
                let firstTime = true;
                this.keepAlive(promise => {
                    if (firstTime) {
                        fulfill(promise);
                        firstTime = false;
                    }
                    else {
                        this.promise = promise;
                    }
                });
            });
        }
        return this.promise;
    }
    async keepAlive(onUpdate) {
        try {
            while (true) {
                const promise = this.connectUntilSucceed();
                onUpdate(promise);
                const connection = await promise;
                await new Promise(f => connection.once("close", f));
            }
        }
        catch (err) {
        }
    }
    async connectUntilSucceed() {
        while (true) {
            if (this.shutdownFlag)
                throw new Error("Shutting down");
            try {
                return await this.opts.connect();
            }
            catch (err) {
                await new Promise(f => setTimeout(f, this.opts.retryDelay));
            }
        }
    }
    shutdown() {
        var _a;
        this.shutdownFlag = true;
        (_a = this.promise) === null || _a === void 0 ? void 0 : _a.then(con => con.close()).catch(err => "OK");
    }
}
exports.ConnectionManager = ConnectionManager;
