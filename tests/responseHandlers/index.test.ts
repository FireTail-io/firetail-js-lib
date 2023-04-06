/* eslint-disable-next-line */
// @ts-nocheck
import applyResponseHandlers from "../../src/responseHandlers";

import onEnd from "../../src/responseHandlers/onEnd";

jest.mock("../../src/responseHandlers/onEnd", () => jest.fn());

const TYPE = "firetail.handler.error";
const STATUS = 666;
const ERROR = {
    status: STATUS,
    error: {
        type: TYPE,
    },
};

const END = jest.fn(() => null);
const NO_PROXY = jest.fn(() => null);
/**
 * The jest mock function must have the correct name to work
 */
Object.defineProperty(END, "name", {
    value: "end",
    writable: false,
});
const DUMMY = () => null;
const RES = {
    noProxy: NO_PROXY,
    end: END,
    json: DUMMY,
    jsonp: DUMMY,
    send: R("send"),
    header: R("header"),
    status: R("status"),
    setHeader: R("setHeader"),
    firetailContext: {
        intercepted: false,
        observations: [],
    },
};
function R() {
    return () => RES;
}
const sendSpy = jest.spyOn(RES, "send");
const statusSpy = jest.spyOn(RES, "status");

describe("The response handler applicator should", () => {
    onEnd.mockImplementation(() => ({}));
    test("correctly insert proxies", () => {
        expect(() => applyResponseHandlers(RES)).not.toThrow();
    });
});
describe("The proxied response methods should", () => {
    test("work with sync response handlers", () => {
        RES.end();
        expect(END).toHaveBeenCalledTimes(1);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });
    test("pass through non-proxied methods", () => {
        RES.noProxy();
        expect(NO_PROXY).toHaveBeenCalledTimes(1);
    });
    test("work with async response handlers", async () => {
        END.mockClear();
        onEnd.mockClear();
        onEnd.mockImplementationOnce(() => Promise.resolve({}));
        await RES.end();
        expect(END).toHaveBeenCalledTimes(1);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });
    test("intercept when sync response handler returns and error", () => {
        END.mockClear();
        onEnd.mockClear();
        onEnd.mockImplementationOnce(() => ERROR);
        RES.end();
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalledWith(ERROR.error);
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
    });
    test("intercept when async response handler returns and error", async () => {
        END.mockClear();
        onEnd.mockClear();
        onEnd.mockImplementationOnce(() => Promise.resolve(ERROR));
        await RES.end();
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalledWith(ERROR.error);
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
    });
    test("catch and observe sync response handler that throws", () => {
        onEnd.mockClear();
        onEnd.mockImplementationOnce(() => {
            throw new Error();
        });
        expect(() => RES.end()).not.toThrow();
        expect(onEnd).toHaveBeenCalledTimes(1);
        const o = RES.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.response.handler.failed");
    });
    test("catch and observe async response handler that throws", () => {
        onEnd.mockClear();
        onEnd.mockImplementationOnce(() => Promise.reject(new Error()));
        expect(async () => await RES.end()).not.toThrow();
        expect(onEnd).toHaveBeenCalledTimes(1);
        const o = RES.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.response.handler.failed");
    });
});
