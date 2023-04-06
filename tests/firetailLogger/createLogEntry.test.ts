/* eslint-disable-next-line */
// @ts-nocheck

import createLogEntry, {
    LOG_ACTION_BLOCKED,
    LOG_ACTION_INFORMED,
    LOG_ACTION_MODIFIED,
    VERSION,
} from "../../src/firetailLogger/createLogEntry";

const HOST = "localhost:3003";
const ORIGINAL_URL = "/path/7";
const OPEN_API_PATH = "/path/{id}";
const START_TIME = 0;
const FINISH_TIME = 5;
const METHOD = "put";
const STATUS_CODE = 404;
const ORIGINAL_STATUS_CODE = 200;
const REMOTE_ADDRESS = "1.1.1.1";
const FORWARDED_FOR_HEADER = "0.0.0.0";
const REQ_GET = {
    host: HOST,
    "x-forwarded-for": FORWARDED_FOR_HEADER,
};
const HTTP_VERSION = "1.1";
const REQUEST_BODY = {};
const RESPONSE_BODY = {};
const ORIGINAL_RESPONSE_BODY = {};
const PROTOCOL = "http";
const HOSTNAME = "localhost";
const OBSERVATION = {
    type: "type",
    title: "title",
    status: 200,
    details: {
        detail: "interesting",
    },
};

const OBSERVATIONS = [OBSERVATION];

const firetailContext = {
    responseSanitised: false,
    responseBody: RESPONSE_BODY,
    originalResponseBody: ORIGINAL_RESPONSE_BODY,
    intercepted: false,
    finishedAt: FINISH_TIME,
    startedAt: START_TIME,
    observations: OBSERVATIONS,
    match: {
        openAPIPath: OPEN_API_PATH,
    },
    method: METHOD,
    originalStatusCode: ORIGINAL_STATUS_CODE,
};

const req = {
    protocol: PROTOCOL,
    originalUrl: ORIGINAL_URL,
    get: jest.fn(key => REQ_GET[key]),
    socket: {
        remoteAddress: REMOTE_ADDRESS,
    },
    httpVersion: HTTP_VERSION,
    body: REQUEST_BODY,
    hostname: HOSTNAME,
};

const baseResponse = {
    statusCode: STATUS_CODE,
    getHeaders: jest.fn(() => ({})),
    firetailContext: firetailContext,
    req: req,
};

describe("The log entry creator should", () => {
    const entry = createLogEntry(baseResponse);
    let json;
    test("return a stringified JSON", () => {
        expect(typeof entry === "string").toBe(true);
    });
    test("which parses correctly", () => {
        json = JSON.parse(entry);
        expect(typeof json === "object").toBe(true);
    });
    test("and which has correct base properties", () => {
        expect(json.version).toBe(VERSION);
        expect(json.logAction).toBe(LOG_ACTION_INFORMED);
        expect(json.executionTime).toBe(FINISH_TIME - START_TIME);
    });
    test("and which has a correct request", () => {
        expect(json.request.httpProtocol).toBe(`HTTP/${HTTP_VERSION}`);
        expect(json.request.uri).toBe(`${PROTOCOL}://${HOST}${ORIGINAL_URL}`);
        expect(json.request.resource).toBe(OPEN_API_PATH);
        expect(json.request.headers).toMatchObject({});
        expect(json.request.method).toBe(METHOD.toUpperCase());
        expect(json.request.body).toBe(JSON.stringify(REQUEST_BODY));
        expect(json.request.ip).toBe(FORWARDED_FOR_HEADER);
    });
    test("and which has a correct response", () => {
        expect(json.response.statusCode).toBe(STATUS_CODE);
        expect(json.response.originalStatusCode).toBe(ORIGINAL_STATUS_CODE);
        expect(json.response.body).toMatchObject(RESPONSE_BODY);
        expect(json.response.originalBody).toMatchObject(
            ORIGINAL_RESPONSE_BODY
        );
        expect(json.response.headers).toMatchObject({});
    });
    test("and which has correct observations", () => {
        expect(json.observations).toHaveLength(OBSERVATIONS.length);
        expect(json.observations[0].type).toBe(OBSERVATION.type);
        expect(json.observations[0].title).toBe(OBSERVATION.title);
        expect(json.observations[0].status).toBe(OBSERVATION.status);
        expect(json.observations[0].details).toBe(
            JSON.stringify(OBSERVATION.details)
        );
    });
});

describe("For a modified request, the log entry creator should", () => {
    const modified = JSON.parse(
        createLogEntry({
            ...baseResponse,
            firetailContext: {
                ...firetailContext,
                responseSanitised: true,
                responseBody: { modified: true },
            },
        })
    );
    test("have the MODIFIED logAction", () => {
        expect(modified.logAction).toBe(LOG_ACTION_MODIFIED);
    });
});

describe("For an intercepted request, the log entry creator should", () => {
    const blocked = JSON.parse(
        createLogEntry({
            ...baseResponse,
            firetailContext: {
                ...firetailContext,
                intercepted: true,
            },
        })
    );
    test("have the BLOCKED logAction", () => {
        expect(blocked.logAction).toBe(LOG_ACTION_BLOCKED);
    });
});
