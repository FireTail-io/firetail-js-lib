/* eslint-disable-next-line */
// @ts-nocheck
import matchRequest from "../../src/requestHandlers/matchRequest";

const SCHEMA = "Dummy schema";
const VALID_METHOD = "put";
const MISSING_METHOD = "get";
const NO_SCHEMA_METHOD = "patch";
const NO_MATCH_METHOD = "options";
const MATCH = {
    schema: {
        [VALID_METHOD]: SCHEMA,
    },
};
const NO_SCHEMA_MATCH = {};
const NO_MATCH = null;

const MATCH_REQ = jest.fn(r => {
    switch (r.firetailContext.method) {
        case NO_SCHEMA_METHOD:
            return NO_SCHEMA_MATCH;
        case NO_MATCH_METHOD:
            return NO_MATCH;
        default:
            return MATCH;
    }
});

const routes = {
    matchReq: MATCH_REQ,
};

describe("The route matcher should", () => {
    test("call the matching function and set match result", () => {
        const validRequest = {
            firetailContext: {
                method: VALID_METHOD,
                observations: [],
            },
        };
        const result = matchRequest(validRequest, routes);
        expect(result).toMatchObject({});
        expect(MATCH_REQ).toHaveBeenCalledWith(validRequest);
        expect(validRequest.firetailContext.match).toMatchObject(MATCH);
    });
    test("return a 405 error when schema is missing", () => {
        const invalidRequest = {
            firetailContext: {
                method: NO_SCHEMA_METHOD,
                observations: [],
            },
        };
        const result = matchRequest(invalidRequest, routes);
        expect(result.status).toBe(405);
        expect(result.error.type).toBe("firetail.method.not.found");
        const o = invalidRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
    test("return a 405 error when method is missing in schema", () => {
        const missingRequest = {
            firetailContext: {
                method: MISSING_METHOD,
                observations: [],
            },
        };
        const result = matchRequest(missingRequest, routes);
        expect(result.status).toBe(405);
        expect(result.error.type).toBe("firetail.method.not.found");
        const o = missingRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
    test("return a 404 error when match is missing", () => {
        const brokenRequest = {
            firetailContext: {
                method: NO_MATCH_METHOD,
                observations: [],
            },
        };
        const result = matchRequest(brokenRequest, routes);
        expect(result.status).toBe(404);
        expect(result.error.type).toBe("firetail.route.not.found");
        const o = brokenRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
});
