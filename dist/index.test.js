"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class Connection {
    constructor(id) {
        this.id = id;
        this.close = jest.fn();
        this.once = jest.fn();
    }
}
let conMgr;
let connect;
beforeEach(() => {
    connect = jest.fn();
    conMgr = new index_1.ConnectionManager({ connect, retryDelay: 200 });
});
afterEach(() => {
    conMgr.shutdown();
});
test("connect", async () => {
    const con = new Connection(1);
    const con2 = new Connection(2);
    connect.mockRejectedValueOnce("Fail 1")
        .mockRejectedValueOnce("Fail 2")
        .mockResolvedValueOnce(con)
        .mockRejectedValueOnce("Fail 3")
        .mockResolvedValueOnce(con2);
    //check connect() not called until needed
    await new Promise(f => setTimeout(f, 200));
    expect(connect.mock.calls.length).toBe(0);
    //check get() returns new connection 'con' after 2 retries
    await expect(conMgr.get()).resolves.toBe(con);
    expect(connect.mock.calls.length).toBe(3);
    //check get() returns the current connection without creating new
    await expect(conMgr.get()).resolves.toBe(con);
    expect(connect.mock.calls.length).toBe(3);
    //mock connection close notification
    expect(con.once.mock.calls.length).toBe(1);
    expect(con.once.mock.calls[0][0]).toBe("close");
    con.once.mock.calls[0][1]();
    await new Promise(f => setTimeout(f));
    //check reconnect happens immediately
    expect(connect.mock.calls.length).toBe(4);
    //check get() returns new connection 'con2' after 1 retry
    await expect(conMgr.get()).resolves.toBe(con2);
    expect(connect.mock.calls.length).toBe(5);
    //check shutdown sequence
    expect(con2.close.mock.calls.length).toBe(0);
    conMgr.shutdown();
    await new Promise(f => setTimeout(f));
    expect(con2.close.mock.calls.length).toBe(1);
    //mock connection close notification
    expect(con2.once.mock.calls.length).toBe(1);
    expect(con2.once.mock.calls[0][0]).toBe("close");
    con2.once.mock.calls[0][1]();
    await new Promise(f => setTimeout(f));
    await expect(conMgr.get()).rejects.toThrow("Shutting down");
});
test("early shutdown 1", async () => {
    conMgr.shutdown();
    await expect(conMgr.get()).rejects.toThrow("Shutting down");
});
test("early shutdown 2", async () => {
    const con = new Connection(1);
    connect.mockResolvedValueOnce(con);
    //shutdown immediately after connection attempt started
    const promise = conMgr.get();
    conMgr.shutdown();
    await expect(promise).resolves.toBe(con);
    await expect(conMgr.get()).resolves.toBe(con);
    expect(con.close.mock.calls.length).toBe(1);
    //mock connection close notification
    expect(con.once.mock.calls.length).toBe(1);
    expect(con.once.mock.calls[0][0]).toBe("close");
    con.once.mock.calls[0][1]();
    await new Promise(f => setTimeout(f));
    await expect(conMgr.get()).rejects.toThrow("Shutting down");
});
