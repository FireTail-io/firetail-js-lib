/* eslint-disable-next-line */
// @ts-nocheck
import middleware from "../../src/services/middleware";

import apiRoutes from "../../src/services/apiRoutes";
import getContext from "../../src/services/getContext";
import matchRequest from "../../src/requestHandlers/matchRequest";
import validateRequest from "../../src/requestHandlers/validateRequest";
import authenticateRequest from "../../src/requestHandlers/authenticateRequest";
import applyResponseProxies from "../../src/responseHandlers";

jest.mock("../../src/services/apiRoutes", () => jest.fn());
jest.mock("../../src/services/getContext", () => jest.fn());
jest.mock("../../src/requestHandlers/matchRequest", () => jest.fn());
jest.mock("../../src/requestHandlers/validateRequest", () => jest.fn());
jest.mock("../../src/requestHandlers/authenticateRequest", () => jest.fn());
jest.mock("../../src/responseHandlers", () => jest.fn());

const OPTIONS = {
    apiSpecPromise: {
        then: cb => cb(),
    },
};

const OBSERVATIONS = [];

const TYPE = "firetail.test.error";
const STATUS = 666;
const ERROR = {
    status: STATUS,
    error: {
        type: TYPE,
    },
};
const REQ = {};
const NEXT = jest.fn(() => null);

/**
 * Mock response object that can chain methods and tracks headers etc.
 */
const RES = {
    send: R("send"),
    header: R("header"),
    status: R("status"),
    setHeader: R("setHeader"),
    hdr: {},
    sent: null,
    stat: null,
};
function R() {
    return () => RES;
}
const sendSpy = jest.spyOn(RES, "send");
const statusSpy = jest.spyOn(RES, "status");
// const headerSpy = jest.spyOn(RES, "header");
// const setHeaderSpy = jest.spyOn(RES, "setHeader");

let mw;

describe("The middleware setup function should", () => {
    apiRoutes.mockImplementation(() => ({}));
    getContext.mockImplementation(() => ({
        observations: OBSERVATIONS,
        intercepted: false,
    }));
    matchRequest.mockImplementation(() => ({}));
    validateRequest.mockImplementation(() => ({}));
    authenticateRequest.mockImplementation(async () => ({}));
    applyResponseProxies.mockImplementation(() => ({}));

    mw = middleware(OPTIONS);
    test("return a middleware function", () => {
        expect(typeof mw).toBe("function");
    });
});

describe("Calling the middleware function should", () => {
    test("call all the correct handler functions and next()", async () => {
        await mw(REQ, RES, NEXT);
        await mw(REQ, RES, NEXT);
        expect(applyResponseProxies).toHaveBeenCalledTimes(2);
        expect(getContext).toHaveBeenCalledTimes(2);
        expect(matchRequest).toHaveBeenCalledTimes(2);
        expect(validateRequest).toHaveBeenCalledTimes(2);
        expect(authenticateRequest).toHaveBeenCalledTimes(2);
        expect(NEXT).toHaveBeenCalledTimes(2);
        expect(RES.firetailContext.intercepted).toBe(false);
    });
});

describe("When a match can't be found, the middleware function should", () => {
    test("intercept, set the response status and send an error", async () => {
        matchRequest.mockClear();
        matchRequest.mockImplementationOnce(() => ERROR);
        await mw(REQ, RES, NEXT);
        expect(matchRequest).toHaveBeenCalledTimes(1);
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalledWith(ERROR.error);
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
    });
});

describe("When the request can't be validated, the middleware function should", () => {
    test("intercept, set the response status and send an error", async () => {
        validateRequest.mockClear();
        validateRequest.mockImplementationOnce(() => ERROR);
        await mw(REQ, RES, NEXT);
        expect(validateRequest).toHaveBeenCalledTimes(1);
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalledWith(ERROR.error);
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
    });
});

describe("When the request can't be authenticated, the middleware function should", () => {
    test("intercept, set the response status and send an error", async () => {
        authenticateRequest.mockClear();
        authenticateRequest.mockImplementationOnce(() => ERROR);
        await mw(REQ, RES, NEXT);
        expect(authenticateRequest).toHaveBeenCalledTimes(1);
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalledWith(ERROR.error);
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
    });
});

describe("If any of the request handlers throws, the middleware function should", () => {
    test("intercept, set the response status, send an error and log an observation", async () => {
        matchRequest.mockClear();
        matchRequest.mockImplementationOnce(() => {
            throw ERROR;
        });
        await mw(REQ, RES, NEXT);
        expect(matchRequest).toHaveBeenCalledTimes(1);
        expect(RES.firetailContext.intercepted).toBe(true);
        expect(sendSpy).toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(STATUS);
        expect(RES.firetailContext.observations).toHaveLength(1);
        expect(RES.firetailContext.observations[0].type).toBe(TYPE);
        expect(RES.firetailContext.observations[0].status).toBe(STATUS);
    });
});
