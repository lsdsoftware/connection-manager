import * as rxjs from "rxjs"

interface Closeable {
  close(): void
  once(event: "close", callback: Function): void
}

interface Options<T> {
  connect(): Promise<T>
  retryDelay: number
}


export class ConnectionManager<T extends Closeable> {
  private readonly connectionObservable: rxjs.Observable<T>
  private readonly shutdownSubject = new rxjs.BehaviorSubject(false)

  constructor(opts: Options<T>) {
    this.connectionObservable = this.shutdownSubject
      .pipe(
        rxjs.distinctUntilChanged(),
        rxjs.switchMap(shutdown => {
          if (shutdown) {
            return rxjs.throwError(() => new Error("Shutting down"))
          }
          else {
            let con: T
            return rxjs.defer(opts.connect)
              .pipe(
                rxjs.retry({ delay: opts.retryDelay }),
                rxjs.tap(value => con = value),
                rxjs.concatMap(con => new rxjs.Observable<T>(sub => {
                  sub.next(con)
                  con.once("close", () => sub.error(new Error("Connection closed")))
                })),
                rxjs.finalize(() => con.close())
              )
          }
        }),
        rxjs.shareReplay({ bufferSize: 1, refCount: false })
      )
  }

  get() {
    return rxjs.firstValueFrom(this.connectionObservable)
  }

  shutdown() {
    this.shutdownSubject.next(true)
  }
}
