/**
 * This module provides the applyProxies function that will replace the methods
 * listen in INTERCEPT_RESPONSE_METHODS on the Express response class with
 * Proxies.
 *
 * This allows us to intercept calls to e.g. res.json() inside the proxy handler
 * without disturbing the original methods.
 *
 * Currently we intercept the sending of a response to do validation and authZ
 * checks. We also catch the original status by hooking into res.status().
 *
 * Logging to the SaaS platform is done by intercepting res.end().
 */
import onEnd from "./onEnd";
import onStatus from "./onStatus";
import onResponse from "./onResponse";

import { FTResponse } from "../";

const responseHandlers = {
    send: onResponse,
    json: onResponse,
    jsonp: onResponse,
    status: onStatus,
    end: onEnd,
};

const INTERCEPT_RESPONSE_METHODS = [
    // "append",
    // "attachment",
    // "cookie",
    // "clearCookie",
    // "download",
    "end",
    // "format",
    // "get",
    "json",
    "jsonp",
    // "links",
    // "location",
    // "redirect",
    // "render",
    "send",
    // "sendFile",
    // "sendStatus",
    // "set",
    "status",
    // "type",
    // "vary",
];

export default function applyResponseHandlers(res: FTResponse): void {
    INTERCEPT_RESPONSE_METHODS.forEach(m => {
        res[m] = new Proxy(res[m], { apply });
    });
}

/* eslint-disable-next-line */
function apply<T extends Function>(
    method: T,
    res: FTResponse,
    /* eslint-disable-next-line */
    args?: any[]
): T | FTResponse {
    const handler = responseHandlers[method.name];
    if (!handler) return Reflect.apply(method, res, args);

    let result;
    try {
        result = handler(method, res, args);
    } catch (error) {
        res.firetailContext.observations.push({
            type: "firetail.response.handler.failed",
            title: "Response handler threw an error",
            details: error,
        });
        return Reflect.apply(method, res, args);
    }

    if (typeof result.then === "function") {
        /**
         * Flow for async handler functions
         */
        result
            .then(r => {
                if (r.error) {
                    res.firetailContext.intercepted = true;
                    res.setHeader("content-type", "application/problem+json");
                    return res.status(r.status).send(r.error);
                }
                return Reflect.apply(method, res, args);
            })
            .catch(error => {
                res.firetailContext.observations.push({
                    type: "firetail.response.handler.failed",
                    title: "Response handler threw an error",
                    details: error,
                });
                return Reflect.apply(method, res, args);
            });
    } else {
        /**
         * Flow for sync handler functions
         */
        const { status, error } = result;
        if (error) {
            res.firetailContext.intercepted = true;
            res.setHeader("content-type", "application/problem+json");
            return res.status(status).send(error);
        }
        return Reflect.apply(method, res, args);
    }
}
