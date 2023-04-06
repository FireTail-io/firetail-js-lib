/**
 * This module provides a function that scrubs sensitive headers from response
 * and request objects.
 *
 * In addition to the default values, additional sensitive headers can be
 * specified in the OpenAPI spec in the x-ft-sensitive-headers key, or in
 * the setup options for the FireTail middleware.
 */
import map from "lodash/map";
import find from "lodash/find";
import forEach from "lodash/forEach";
import toLower from "lodash/toLower";
import compact from "lodash/compact";
import flattenDeep from "lodash/flattenDeep";

export const CLEAN = "*****";

export default function getSanitisedHeaders(res) {
    const ctx = res.firetailContext;
    const schema = ctx.match?.schema?.[ctx.method];

    /**
     * These headers typically contain sensitive information and should not
     * be logged by us.
     */
    const hiddenRequestHeaders = ["authorization", "proxy-authorization"];
    const hiddenResponseHeaders = ["www-authenticate", "proxy-authenticate"];

    /**
     * Customers can specify global sensitive headers in the config options
     * for the middleware.
     */
    const headersFromConfig = ctx.sensitiveHeaders;
    if (headersFromConfig?.length) {
        hiddenRequestHeaders.push(...headersFromConfig);
        hiddenResponseHeaders.push(...headersFromConfig);
    }

    /**
     * Customers can specify per-route sensitive headers in the OpenAPI
     * spec via the x-ft-sensitive-headers vendor extension.
     */
    const headersFromSchema = schema?.["x-ft-sensitive-headers"];
    if (headersFromSchema?.length) {
        hiddenRequestHeaders.push(...headersFromSchema);
        hiddenResponseHeaders.push(...headersFromSchema);
    }

    /**
     * The ApiKey security schema can specify the header that contains the
     * authentication token. If that is the case we add the header to the
     * list of sensitive headers.
     */
    const schemes = flattenDeep(
        ctx.match?.securityHandlers?.[ctx.method]?.securitySets
    );
    const headersFromSecurity = compact(
        map(schemes, s => {
            return s.definition?.in === "header" ? s.definition.name : null;
        })
    );
    if (headersFromSecurity?.length) {
        hiddenRequestHeaders.push(...headersFromSecurity);
        hiddenResponseHeaders.push(...headersFromSecurity);
    }

    /**
     * Prepare objects containing the sanitised headers for the request and
     * response.
     */
    const requestHeaders = {};
    const responseHeaders = {};
    forEach(res.req.headers, (value, key) => {
        if (!requestHeaders[key]) {
            requestHeaders[key] = [];
        }

        let clean = CLEAN;
        if (!find(hiddenRequestHeaders, h => toLower(key) === toLower(h))) {
            clean = value;
        }

        requestHeaders[key].push(clean);
    });
    forEach(res.getHeaders(), (value, key) => {
        if (!responseHeaders[key]) {
            responseHeaders[key] = [];
        }

        let clean = CLEAN;
        if (!find(hiddenResponseHeaders, h => toLower(key) === toLower(h))) {
            clean = value;
        }

        responseHeaders[key].push(clean);
    });

    return {
        requestHeaders,
        responseHeaders,
    };
}
