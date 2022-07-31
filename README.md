# Connection Manager

Maintaining connection state is a royal pain in the behind.  This utility class takes a `connect()` method and:
- Only call it to create a connection when needed
- Automatically retry on failure
- Automatically reconnect if the previous connection was closed
- Properly handle shutdown sequence


## Usage

```typescript
const conMgr = new ConnectionManager({
  async connect() {
    //...
    return connection
  },
  retryDelay: 10*1000
})

//wherever you need the connection
const connection = await conMgr.get()

//shutdown
conMgr.shutdown()
```
