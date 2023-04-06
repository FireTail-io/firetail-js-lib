/* eslint-disable-next-line */
// @ts-nocheck
import validateRequest from "../../src/requestHandlers/validateRequest";

const PATH = "/foo";
const VALID_METHOD = "put";
const INVALID_METHOD = "post";
const NON_EXISTENT_METHOD = "patch";
const INCORRECT_CONTENT_TYPE = "foo/foo";
const STATUS = 666;
const VALIDATE_TRUE = jest.fn(() => null);
const VALIDATE_FALSE = jest.fn(() => ({
    status: STATUS,
}));

const firetailContext = {
    match: {
        requestValidators: {
            [VALID_METHOD]: {
                validateRequest: VALIDATE_TRUE,
            },
            [INVALID_METHOD]: {
                validateRequest: VALIDATE_FALSE,
            },
        },
    },
    path: PATH,
};

describe("The request validation handler should", () => {
    test("call the validation function and set the validation flag", () => {
        const validRequest = {
            get: () => "application/json",
            firetailContext: {
                ...firetailContext,
                method: VALID_METHOD,
                observations: [],
                requestValidated: null,
            },
        };
        const result = validateRequest(validRequest);
        expect(result).toMatchObject({});
        expect(VALIDATE_TRUE).toHaveBeenCalledWith(validRequest);
        expect(validRequest.firetailContext.requestValidated).toBe(true);
    });
    test("return validation errors for invalid requests", () => {
        const invalidRequest = {
            get: () => "application/json",
            firetailContext: {
                ...firetailContext,
                observations: [],
                method: INVALID_METHOD,
            },
        };
        const result = validateRequest(invalidRequest);
        expect(result.status).toBe(STATUS);
        expect(result.error.type).toBe("firetail.request.validation.failed");
        const o = invalidRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
    test("return a 415 error for incorrect content type", () => {
        const incorrectRequest = {
            get: () => INCORRECT_CONTENT_TYPE,
            firetailContext: {
                ...firetailContext,
                observations: [],
            },
        };
        const result = validateRequest(incorrectRequest);
        expect(result.status).toBe(415);
        expect(result.error.type).toBe(
            "firetail.unsupported.request.content.type"
        );
        const o = incorrectRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
    test("return an error when validator is missing", () => {
        const nonExistentRequest = {
            get: () => "application/json",
            firetailContext: {
                ...firetailContext,
                observations: [],
            },
            method: NON_EXISTENT_METHOD,
        };
        validateRequest(nonExistentRequest);
        const o = nonExistentRequest.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.request.validator.missing");
    });
});
