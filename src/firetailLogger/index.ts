import { EOL } from "os";
import fetch from "node-fetch";
import sumBy from "lodash/sumBy";

import { FTResponse } from "../";

import createLogEntry from "./createLogEntry";

import Stream from "stream";

const logBuffer: string[] = [];
let logSize = 0;
let logIntervalId;

export const BYTES_PER_UTF16 = 4; /* This is realistically much closer to 2. */
export const MIN_MAX_SIZE = 100_000;
export const MIN_MAX_ITEMS = 100;
export const MIN_MAX_TIME_MS = 1000;
let LOG_MAX_SIZE = 950_000;
let LOG_MAX_ITEMS = 1000;
let LOG_MAX_TIME_MS = 5 * 1000;

let API_KEY;
let API_ENDPOINT;

export default function logResponse(res: FTResponse) {
    const ctx = res.firetailContext;
    /**
     * Set up internal copies of the API config
     */
    if (!API_KEY || API_KEY !== ctx?.firetailAPIKey) {
        API_KEY = ctx?.firetailAPIKey;
        if (!API_KEY) {
            throw new Error(
                JSON.stringify({
                    type: "firetail.logger.api.key.missing",
                    title: "Missing API key.",
                })
            );
        }
    }
    if (!API_ENDPOINT || API_ENDPOINT !== ctx?.firetailAPIHost) {
        let url;
        try {
            url = new URL(`${ctx?.firetailAPIHost}/logs/bulk`);
        } catch (error) {
            throw new Error(
                JSON.stringify({
                    type: "firetail.logger.api.endpoint.incorrect",
                    title: "Failed to construct the API endpoint URL.",
                    details: {
                        error,
                    },
                })
            );
        }
        API_ENDPOINT = url.toString();
    }

    /**
     * Set up an interval to flush the log every LOG_MAX_TIME_MS milliseconds
     */
    if (!logIntervalId) {
        logIntervalId = setInterval(() => {
            if (!logBuffer.length) return;
            _flushLogBuffer();
        }, LOG_MAX_TIME_MS);
    }

    const entry = createLogEntry(res);

    /**
     * Flush logs before adding the entry, if adding log entry would
     * exceed the max log size
     *
     * TODO: do we want to calculate exact size in bytes here, e.g. via
     * (new TextEncoder().encode('foo')).length. Easier way is to assume
     * 2 bytes / char and have a lower buffer limit.
     */
    logSize += entry.length * BYTES_PER_UTF16;
    if (logSize >= LOG_MAX_SIZE) _flushLogBuffer();

    /**
     * Add entry and flush if log has more items than LOG_MAX_ITEMS
     */
    logBuffer.push(entry);
    if (logBuffer.length >= LOG_MAX_ITEMS) _flushLogBuffer();
}

/**
 * This is exported to allow testing
 */
export const _flushLogBuffer = () => {
    /**
     * Set up the POST request to the logging backend
     */
    const stream = new Stream.Readable();
    fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "content-type": "application/x-ndjson",
            "x-ft-api-key": API_KEY,
        },
        body: stream,
    })
        .then(() => console.log("Logs flushed"))
        .catch(e => console.log("Error flushing logs ", e));
    /**
     * Push each log item into the stream separated by newlines.
     * Push null to close the stream.
     *
     * TODO: while is still blocking, figure out how to make consuming the
     * buffer non-blocking with e.g. setInteval
     */
    while (logBuffer.length) stream.push(logBuffer.shift() + EOL);
    stream.push(null);
    logSize = sumBy(logBuffer, "length");
};

/**
 * This is exported to allow testing
 */
export function _logConfig(key, value) {
    /**
     * We enforce sane minimum values.
     */
    switch (key) {
        case "LOG_MAX_SIZE":
            LOG_MAX_SIZE = Math.max(value, MIN_MAX_SIZE);
            break;
        case "LOG_MAX_ITEMS":
            LOG_MAX_ITEMS = Math.max(value, MIN_MAX_ITEMS);
            break;
        case "LOG_MAX_TIME_MS":
            LOG_MAX_TIME_MS = Math.max(value, MIN_MAX_TIME_MS);
            if (logIntervalId) {
                clearInterval(logIntervalId);
                logIntervalId = setInterval(() => {
                    if (!logBuffer.length) return;
                    _flushLogBuffer();
                }, LOG_MAX_TIME_MS);
            }
            break;
    }
}
