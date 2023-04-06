/* eslint-disable-next-line */
// @ts-nocheck

import logResponse, * as logger from "../../src/firetailLogger";
import createLogEntry from "../../src/firetailLogger/createLogEntry";

/**
 * This is weird Jest magic where we first mock the module here with a dummy
 * factory, and only later in the test switch to the actual implementation.
 *
 * https://stackoverflow.com/questions/53484219/how-can-i-mock-fetch-function-in-node-js-by-jest
 */
import fetch from "node-fetch";
jest.mock("node-fetch", () => jest.fn());

const firetailContext = {
    firetailAPIKey: "AA-BB-CC",
    firetailAPIHost: "http://localhost:8888",
    responseSanitised: false,
    responseBody: "{}",
    originalResponseBody: "{}",
    intercepted: false,
    finishedAt: 5,
    startedAt: 0,
    observations: [],
    match: {
        openAPIPath: "",
    },
    method: "",
    originalStatusCode: 0,
};

const req = {
    protocol: "http",
    originalUrl: "",
    get: () => "localhost",
    socket: {
        remoteAddress: "",
    },
    httpVersion: "",
    body: "{}",
    hostname: "",
};

const response = {
    statusCode: 0,
    getHeaders: () => ({}),
    firetailContext: firetailContext,
    req: req,
};

const entry = createLogEntry(response);
const ENTRY_SIZE = entry.length * logger.BYTES_PER_UTF16;

const TOO_FEW_ITEMS = 5;
const TOO_SHORT_TIME = 5;
const TOO_SMALL_SIZE = 5;

const LONG_ENOUGH_TIME = logger.MIN_MAX_TIME_MS * 2;

const spy = jest.spyOn(logger, "_flushLogBuffer");

describe("The FireTail logger should", () => {
    /**
     * Mock all the network calls and silence the console during the tests.
     */
    fetch.mockImplementation(() => Promise.resolve({}));
    console.log = jest.fn(() => undefined);

    test("flush the logs when minimum time has elapsed", () => {
        logger._logConfig("LOG_MAX_TIME_MS", TOO_SHORT_TIME);

        logResponse(response);
        expect(spy).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(logger.MIN_MAX_TIME_MS - 1);
        expect(spy).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(2);
        expect(spy).toHaveBeenCalledTimes(1);

        logger._logConfig("LOG_MAX_TIME_MS", LONG_ENOUGH_TIME);
        spy.mockClear();
    });
    test("flush the logs when desired time has elapsed", () => {
        logger._logConfig("LOG_MAX_TIME_MS", LONG_ENOUGH_TIME);

        logResponse(response);
        expect(spy).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(LONG_ENOUGH_TIME - 1);
        expect(spy).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(2);
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockClear();
    });
    test("will not flush the log when no new items have been added", () => {
        expect(spy).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(LONG_ENOUGH_TIME + 1);
        expect(spy).toHaveBeenCalledTimes(0);

        spy.mockClear();
    });
    test("flush the logs when minimum number of entries have been added", () => {
        logger._logConfig("LOG_MAX_ITEMS", TOO_FEW_ITEMS);

        let itemsAdded = 0;
        while (++itemsAdded < logger.MIN_MAX_ITEMS) logResponse(response);
        expect(spy).toHaveBeenCalledTimes(0);
        logResponse(response);
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockClear();
    });
    test("flush the logs when reaching minimum size", () => {
        logger._logConfig("LOG_MAX_SIZE", TOO_SMALL_SIZE);

        let sizeAdded = 0;
        while ((sizeAdded += ENTRY_SIZE) < logger.MIN_MAX_SIZE) {
            logResponse(response);
        }
        expect(spy).toHaveBeenCalledTimes(0);
        logResponse(response);
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockClear();
    });
    test("throw an error if api host is not a url", () => {
        const incorrectHost = {
            ...response,
            firetailContext: {
                ...firetailContext,
                firetailAPIHost: "$$$$$",
            },
        };
        expect(() => logResponse(incorrectHost)).toThrow();
    });
    test("throw an error if api host is missing", () => {
        const incorrectHost = {
            ...response,
            firetailContext: {
                ...firetailContext,
                firetailAPIHost: undefined,
            },
        };
        expect(() => logResponse(incorrectHost)).toThrow();
    });
    test("throw an error if api key is missing", () => {
        const incorrectHost = {
            ...response,
            firetailContext: {
                ...firetailContext,
                firetailAPIKey: undefined,
            },
        };
        expect(() => logResponse(incorrectHost)).toThrow();
    });

    test("silently fail on API endpoint error", () => {
        fetch.mockImplementation(() => Promise.reject(new Error("Test error")));
        expect(() => {
            logResponse(response);
            jest.advanceTimersByTime(LONG_ENOUGH_TIME + 1);
        }).not.toThrow();
    });

    jest.clearAllTimers();
});
