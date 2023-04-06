/* eslint-disable-next-line */
// @ts-nocheck
import firetail from "../src";

import middleware from "../src/services/middleware";
import SwaggerParser from "@apidevtools/swagger-parser";

jest.mock("../src/services/middleware", () => jest.fn());
const spy = jest.spyOn(SwaggerParser, "validate");

describe("The firetail function should", () => {
    middleware.mockImplementation(() => ({}));
    test("throw when apiDoc path is missing", () => {
        expect(() =>
            firetail({
                apiDocPath: "",
            })
        ).toThrow();
    });
    test("throw when apiDoc path is not a string", () => {
        expect(() =>
            firetail({
                apiDocPath: 5,
            })
        ).toThrow();
    });
    test("throw when apiDoc path does not point to a file", () => {
        expect(() =>
            firetail({
                apiDocPath: "tests/artifacts/not-found.yaml",
            })
        ).toThrow();
    });
    test("parse the file defined by apiDocPath", () => {
        firetail({
            apiDocPath: "tests/artifacts/test.yaml",
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    test("read the apiDocPath from process.env", () => {
        spy.mockClear();
        process.env.API_DOC_PATH = "tests/artifacts/test.yaml";
        firetail({
            apiDocPath: undefined,
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
