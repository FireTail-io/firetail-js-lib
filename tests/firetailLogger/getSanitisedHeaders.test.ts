/* eslint-disable-next-line */
// @ts-nocheck

import getSanitisedHeaders, {
    CLEAN,
} from "../../src/firetailLogger/getSanitisedHeaders";

const METHOD = "PUT";
const SECRET = "SECRET";
const PUBLIC = "PUBLIC";

const AUTHORIZATION_HEADER = "authorization";
const PROXY_AUTHORIZATION_HEADER = "proxy-authorization";
const WWW_AUTHENTICATE_HEADER = "www-authenticate";
const PROXY_AUTHENTICATE_HEADER = "proxy-authenticate";

const PUBLIC_HEADER = "X-Publix-Header";
const CONFIG_HEADER = "X-Config-Header";
const SCHEMA_HEADER = "X-Schema-Header";
const SECURITY_HEADER = "X-Security-Header";

const firetailContext = {
    sensitiveHeaders: [CONFIG_HEADER],
    method: METHOD,
    match: {
        schema: {
            [METHOD]: {
                "x-ft-sensitive-headers": [SCHEMA_HEADER],
            },
        },
        securityHandlers: {
            [METHOD]: {
                securitySets: [
                    {
                        definition: {
                            name: SECURITY_HEADER,
                            in: "header",
                        },
                    },
                ],
            },
        },
    },
};

const baseResponse = {
    firetailContext: firetailContext,
    req: {
        headers: {
            [AUTHORIZATION_HEADER]: SECRET,
            [PROXY_AUTHORIZATION_HEADER]: SECRET,
            [CONFIG_HEADER]: SECRET,
            [SCHEMA_HEADER]: SECRET,
            [SECURITY_HEADER]: SECRET,
            [PUBLIC_HEADER]: PUBLIC,
        },
    },
    getHeaders: jest.fn(() => ({
        [WWW_AUTHENTICATE_HEADER]: SECRET,
        [PROXY_AUTHENTICATE_HEADER]: SECRET,
        [CONFIG_HEADER]: SECRET,
        [SCHEMA_HEADER]: SECRET,
        [SECURITY_HEADER]: SECRET,
        [PUBLIC_HEADER]: PUBLIC,
    })),
};

const { requestHeaders, responseHeaders } = getSanitisedHeaders(baseResponse);

describe("The header parser should", () => {
    test("return requestHeaders and responseHeaders objects", () => {
        expect(typeof requestHeaders === "object").toBe(true);
        expect(typeof responseHeaders === "object").toBe(true);
    });
});

describe("The parsed request headers should", () => {
    test("have sensitive headers cleaned", () => {
        expect(requestHeaders[AUTHORIZATION_HEADER][0]).toBe(CLEAN);
        expect(requestHeaders[PROXY_AUTHORIZATION_HEADER][0]).toBe(CLEAN);
        expect(requestHeaders[CONFIG_HEADER][0]).toBe(CLEAN);
        expect(requestHeaders[SCHEMA_HEADER][0]).toBe(CLEAN);
        expect(requestHeaders[SECURITY_HEADER][0]).toBe(CLEAN);
    });
    test("have public headers untouched", () => {
        expect(requestHeaders[PUBLIC_HEADER][0]).toBe(PUBLIC);
    });
});

describe("The parsed response headers should", () => {
    test("have sensitive headers cleaned", () => {
        expect(responseHeaders[WWW_AUTHENTICATE_HEADER][0]).toBe(CLEAN);
        expect(responseHeaders[PROXY_AUTHENTICATE_HEADER][0]).toBe(CLEAN);
        expect(responseHeaders[CONFIG_HEADER][0]).toBe(CLEAN);
        expect(responseHeaders[SCHEMA_HEADER][0]).toBe(CLEAN);
        expect(responseHeaders[SECURITY_HEADER][0]).toBe(CLEAN);
    });
    test("have public headers untouched", () => {
        expect(responseHeaders[PUBLIC_HEADER][0]).toBe(PUBLIC);
    });
});
