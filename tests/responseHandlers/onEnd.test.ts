/* eslint-disable-next-line */
// @ts-nocheck
import onEnd from "../../src/responseHandlers/onEnd";

import logResponse from "../../src/firetailLogger";
jest.mock("../../src/firetailLogger", () => jest.fn());

const response = {
    firetailContext: {
        logged: false,
        finishedAt: null,
    },
};

const DATE_NOW = Date.now();

describe("The onEnd Proxy handler should", () => {
    logResponse.mockImplementation(() => ({}));
    Date.now = jest.fn(() => DATE_NOW);

    test("set the correct context flags", () => {
        onEnd("end", response);
        expect(response.firetailContext.logged).toBe(true);
        expect(response.firetailContext.finishedAt).toBe(DATE_NOW);

        logResponse.mockClear();
    });
    test("call the log response function", () => {
        response.firetailContext.logged = false;
        onEnd("end", response);

        expect(logResponse).toHaveBeenCalledTimes(1);
        logResponse.mockClear();
    });
});
