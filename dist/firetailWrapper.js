var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function genReq(override) {
    if (override === void 0) { override = {}; }
    var req = {
        method: 'GET',
        originalUrl: "/",
        params: {},
        query: {},
        get: function (key) {
            //'Content-Type'
        }
    };
    var headers = {};
    Object.assign(req, override);
    req.headers = headers;
    Object.assign(req.headers, override && override.headers);
    return req; // END return
} // END req
function genRes(override) {
    var res = {
        setHeader: function () { },
        removeHeader: function () { },
        __data: undefined,
        statusCode: 200,
        status: function (statusCode) {
            res.statusCode = statusCode;
            return res;
        },
        end: function () { return res; },
        send: function (x) {
            res.__data = res.__data || x;
            return res;
        },
        json: function (x) {
            res.__data = x;
            return res;
        }
    };
    // middleware references then but Lamdba never calls them..
    // but Jest will not see they a re every run
    res.end();
    res.send();
    res.json();
    return Object.assign(res, override);
} // END genRes
function firetailWrapper(next) {
    firetailMiddleware = this;
    return function (event, context) {
        return new Promise(function (resolve, reject) {
            var protocol = event.requestContext.http ? "http" : "https";
            var ip = event.requestContext.identity ? event.requestContext.identity.sourceIp
                : event.requestContext[protocol].sourceIp;
            var req = genReq({
                method: event.httpMethod || event.requestContext.http.method,
                originalUrl: event.rawPath || event.resource,
                body: event.body,
                headers: event.headers,
                params: event.pathParameters || {},
                query: event.queryStringParameters || {},
                httpVersion: (event.requestContext.protocol || event.requestContext[protocol].protocol).split("/").pop(),
                protocol: protocol,
                hostname: event.headers.host,
                ip: ip,
                lambdaEvent: event
            }), res = genRes({
                end: function () {
                    if (callHasErrored) /* istanbul ignore next */
                        resolve({
                            statusCode: res.statusCode,
                            body: JSON.stringify(res.__data)
                        });
                    //setTimeout(()=>resolve(res.__data))
                }
            });
            var callHasErrored = true;
            firetailMiddleware(req, res, function () {
                var result = next(event, context);
                if (!result.then) {
                    result = Promise.resolve(result);
                }
                result.then(function (val) {
                    callHasErrored = false;
                    if (val) {
                        if (val.headers) {
                            Object.keys(val.headers)
                                .forEach(function (key) {
                                res.setHeader(key, val.headers[key]);
                            });
                        } // END if
                        if (val.statusCode) {
                            res.status(val.statusCode);
                        }
                    }
                    try {
                        var bodyObj = JSON.parse(val.body);
                        res.json(bodyObj);
                    }
                    catch (err) {
                        res.send(val.body);
                    }
                    var payload = __assign(__assign({}, val), { body: "string" === typeof res.__data ? res.__data
                            : JSON.stringify(res.__data) });
                    setTimeout(function () { return resolve(payload); });
                });
            }); // END firetailMiddleware
        }); // END Promise
    };
} // END firetailWrapper
module.exports = firetailWrapper;
//# sourceMappingURL=firetailWrapper.js.map