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
        end: function () {
            return res;
        },
        send: function (x) {
            res.__data = x;
            return res;
        },
        json: function (x) {
            res.__data = x;
            return res;
        }
    };
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
            }), res = genRes();
            firetailMiddleware(req, res, function () {
                var result = next(event, context);
                //  console.log("--->>>",typeof result,result)
                if (!result.then) {
                    result = Promise.resolve(result);
                }
                result.then(function (val) {
                    res.json(JSON.parse(val.body));
                    //  console.log(" --- ",res.__data)
                    var payload = __assign(__assign({}, val), { body: JSON.stringify(res.__data) });
                    //  console.log(" -+- ",payload)
                    setTimeout(function () { return resolve(payload); });
                });
            }); // END firetailMiddleware
        }); // END Promise
    };
} // END firetailWrapper
module.exports = firetailWrapper;
//# sourceMappingURL=firetailWrapper.js.map