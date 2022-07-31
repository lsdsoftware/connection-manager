"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
class Connection {
    constructor() {
        this.close = jest.fn();
        this.once = jest.fn();
    }
}
let conMgr;
let connect;
beforeEach(() => {
    connect = jest.fn();
    conMgr = new index_1.ConnectionManager({ connect, retryDelay: 1000 });
});
afterEach(() => {
    conMgr.shutdown();
});
test("connect", async () => {
    const con = new Connection();
    const con2 = new Connection();
    connect.mockRejectedValueOnce("Fail 1")
        .mockRejectedValueOnce("Fail 2")
        .mockResolvedValueOnce(con)
        .mockRejectedValueOnce("Fail 3")
        .mockResolvedValueOnce(con2);
    //check connect() not called until needed
    await new Promise(f => setTimeout(f, 1000));
    expect(connect.mock.calls.length).toBe(0);
    //check get() returns new connection 'con' after 2 retries
    await expect(conMgr.get()).resolves.toBe(con);
    expect(connect.mock.calls.length).toBe(3);
    //check get() returns the current connection without creating new
    await expect(conMgr.get()).resolves.toBe(con);
    expect(connect.mock.calls.length).toBe(3);
    //close the current connection
    expect(con.once.mock.calls.length).toBe(1);
    expect(con.once.mock.calls[0][0]).toBe("close");
    con.once.mock.calls[0][1]();
    //check get() returns new connection 'con2' after 1 retry
    await expect(conMgr.get()).resolves.toBe(con2);
    expect(connect.mock.calls.length).toBe(5);
    //check shutdown sequence
    expect(con2.close.mock.calls.length).toBe(0);
    conMgr.shutdown();
    expect(con2.close.mock.calls.length).toBe(1);
    await expect(conMgr.get()).rejects.toThrow("Shutting down");
});
