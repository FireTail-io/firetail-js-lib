import { FTResponse, FTRequest } from "../";

import getSanitisedHeaders from "./getSanitisedHeaders";

export const VERSION = "1.0.0-alpha";
export const LOG_ACTION_BLOCKED = "blocked";
export const LOG_ACTION_MODIFIED = "modified";
export const LOG_ACTION_INFORMED = "informed";

export default function createLogEntry(res: FTResponse): string {
    const ctx = res.firetailContext;
    /**
     * This is "forcing" the type of req to be FTRequest instead of the one it
     * has from express, which is IncomingMessage. This way we do not need to
     * repeatedly @ts-ignore res.req property access in this file because
     * IncomingMessage is missing many of the things that are in (FT)Request.
     *
     */ /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    const req: FTRequest = res.req;

    let logAction = LOG_ACTION_INFORMED;
    if (
        ctx.responseSanitised &&
        ctx.originalResponseBody !== ctx.responseBody
    ) {
        logAction = LOG_ACTION_MODIFIED;
    }
    if (ctx.intercepted) {
        logAction = LOG_ACTION_BLOCKED;
    }

    const executionTime = ctx.finishedAt - ctx.startedAt;

    const nodeName = process.release.name;
    const nodeVersion =
        process.version ||
        process.versions.node ||
        process.release.libUrl?.match?.(/\/release\/([^/]*)/)?.[0];

    const urlObject = new URL(
        `${req.protocol}://${req.get("host")}${req.originalUrl}`
    );

    const ip = req.get("x-forwarded-for") || req.socket?.remoteAddress;

    const { requestHeaders, responseHeaders } = getSanitisedHeaders(res);

    const observations = ctx.observations.map(o => ({
        type: o.type,
        title: o.title,
        status: o.status,
        details:
            typeof o.details === "string"
                ? o.details
                : JSON.stringify(o.details),
    }));

    return JSON.stringify({
        version: VERSION,
        logAction: logAction,
        dateCreated: Date.now(),
        executionTime: executionTime,
        request: {
            httpProtocol: `HTTP/${req.httpVersion}`,
            uri: urlObject.toString(),
            resource: ctx.match.openAPIPath,
            headers: requestHeaders,
            method: ctx.method.toUpperCase(),
            body: JSON.stringify(req.body) || "",
            ip: ip,
        },
        response: {
            statusCode: res.statusCode,
            originalStatusCode: ctx.originalStatusCode,
            body: ctx.responseBody || "",
            originalBody: ctx.originalResponseBody || "",
            headers: responseHeaders,
        },
        metadata: {
            libraryVersion: "0.5.2",
            softwareVersion: `${nodeName} ${nodeVersion}`,
            hostname: req.hostname,
            localPort: req.get("host")?.split?.(":")?.[1],
        },
        observations: observations,
    });
}
