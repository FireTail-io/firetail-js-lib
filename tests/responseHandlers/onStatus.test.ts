/* eslint-disable-next-line */
// @ts-nocheck
import onStatus from "../../src/responseHandlers/onStatus";

const response = {
    firetailContext: {
        originalStatusCode: null,
    },
};

const CODE = 200;
const OTHER_CODE = 404;

describe("The onStatus response handler should", () => {
    test("set the original status code in the context if it is not yet set", () => {
        expect(response.firetailContext.originalStatusCode).toBeNull();
        onStatus("status", response, [CODE]);
        expect(response.firetailContext.originalStatusCode).toBe(CODE);
    });
    test("not set the original status code in the context if it is set", () => {
        onStatus("status", response, [OTHER_CODE]);
        expect(response.firetailContext.originalStatusCode).toBe(CODE);
    });
});
