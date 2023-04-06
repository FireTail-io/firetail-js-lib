/* eslint-disable-next-line */
// @ts-nocheck
import getContext from "../../src/services/getContext";

const KEY = "foo";
const VALUE = "bar";
const options = {
    [KEY]: VALUE,
};

const PATH = "/foo";
const METHOD = "PUT";
const ORIGINAL_URL = "/bar";

const REQ = {
    method: METHOD,
};

const DATE_NOW = Date.now();

describe("The context object returned by the getContext module should", () => {
    Date.now = jest.fn(() => DATE_NOW);
    const req = {
        ...REQ,
        route: {
            path: PATH,
        },
    };
    const ctx = getContext(req, options);
    test("contain the correct start time", () => {
        expect(ctx.startedAt).toBe(DATE_NOW);
    });
    test("contain the correct method", () => {
        expect(ctx.method).toBe(METHOD.toLowerCase());
    });
    test("contain the correct start time", () => {
        expect(ctx.path).toBe(PATH);
    });
});

describe("The context object returned by the getContext module should", () => {
    const req = {
        ...REQ,
        originalUrl: ORIGINAL_URL,
    };
    const ctx = getContext(req, options);
    test("contain the correct start time", () => {
        expect(ctx.path).toBe(ORIGINAL_URL);
    });
});
