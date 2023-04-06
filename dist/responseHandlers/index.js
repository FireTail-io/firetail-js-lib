"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const onEnd_1 = __importDefault(require("./onEnd"));
const onStatus_1 = __importDefault(require("./onStatus"));
const onResponse_1 = __importDefault(require("./onResponse"));
const responseHandlers = {
    send: onResponse_1.default,
    json: onResponse_1.default,
    jsonp: onResponse_1.default,
    status: onStatus_1.default,
    end: onEnd_1.default,
};
const INTERCEPT_RESPONSE_METHODS = [
    "end",
    "json",
    "jsonp",
    "send",
    "status",
];
function applyResponseHandlers(res) {
    INTERCEPT_RESPONSE_METHODS.forEach(m => {
        res[m] = new Proxy(res[m], { apply });
    });
}
exports.default = applyResponseHandlers;
function apply(method, res, args) {
    const handler = responseHandlers[method.name];
    if (!handler)
        return Reflect.apply(method, res, args);
    let result;
    try {
        result = handler(method, res, args);
    }
    catch (error) {
        res.firetailContext.observations.push({
            type: "firetail.response.handler.failed",
            title: "Response handler threw an error",
            details: error,
        });
        return Reflect.apply(method, res, args);
    }
    if (typeof result.then === "function") {
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
    }
    else {
        const { status, error } = result;
        if (error) {
            res.firetailContext.intercepted = true;
            res.setHeader("content-type", "application/problem+json");
            return res.status(status).send(error);
        }
        return Reflect.apply(method, res, args);
    }
}
//# sourceMappingURL=index.js.map