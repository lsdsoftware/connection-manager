
interface Closeable {
  close(): void
  once(event: "close", callback: Function): void
}

interface Options<T> {
  connect(): Promise<T>
  retryDelay: number
}


export class ConnectionManager<T extends Closeable> {
  private promise?: Promise<T>
  private shutdownFlag = false

  constructor(private readonly opts: Options<T>) {
  }

  get() {
    if (!this.promise) {
      this.promise = new Promise(fulfill => {
        let firstTime = true
        this.keepAlive(promise => {
          if (firstTime) {
            fulfill(promise)
            firstTime = false
          }
          else {
            this.promise = promise
          }
        })
      })
    }
    return this.promise
  }

  private async keepAlive(onUpdate: (promise: Promise<T>) => void): Promise<void> {
    try {
      while (true) {
        const promise = this.connectUntilSucceed()
        onUpdate(promise)
        const connection = await promise
        await new Promise(f => connection.once("close", f))
      }
    }
    catch(err) {
    }
  }

  private async connectUntilSucceed() {
    while (true) {
      if (this.shutdownFlag) throw new Error("Shutting down")
      try {
        return await this.opts.connect()
      }
      catch(err) {
        await new Promise(f => setTimeout(f, this.opts.retryDelay))
      }
    }
  }

  shutdown() {
    this.shutdownFlag = true
    this.promise
      ?.then(con => con.close())
      .catch(err => "OK")
  }
}
