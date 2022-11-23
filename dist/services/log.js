var https = require('https');
var version = "1.0.0-alpha";
function header2List(header) {
    return Object.keys(header).map(function (key) { return ({ key: key, val: header[key] }); });
} // END header2List
function combinHeaderListVals(headerList) {
    return headerList.reduce(function (header, _a) {
        var key = _a.key, val = _a.val;
        header[key] = header[key] || [];
        if (!header[key].includes(val)) {
            header[key].push(val);
        }
        return header;
    }, {});
} // END combinHeaderListVals
function out(req, res, data, specificScama) {
    //console.log(new Error())
    //console.log(data)
    var date1_ms = data.startedAt.getTime();
    var date2_ms = data.finishedAt.getTime();
    // Calculate the difference in milliseconds
    var executionTime = date2_ms - date1_ms;
    var uri = "".concat(req.protocol, "://").concat(req.hostname).concat(req.originalUrl);
    var payload = {
        version: version,
        dateCreated: Date.now(),
        executionTime: executionTime,
        request: {
            httpProtocol: "HTTP/".concat(req.httpVersion),
            uri: uri,
            resource: specificScama ? specificScama.resource : "",
            headers: combinHeaderListVals(header2List(req.headers)),
            method: req.method,
            body: data._reqBody || "",
            ip: req.headers['x-forwarded-for'] ||
                req.socket
                    && req.socket.remoteAddress ||
                req.ip
        },
        response: {
            statusCode: data.statusCode,
            body: "string" === typeof data.resBody ? data.resBody
                : JSON.stringify(data.resBody),
            headers: combinHeaderListVals(data.resHeaders)
        },
        oauth: {
            sub: 'user@firetail.io'
        } // END oauth
    }; // END payload
    //if(data.dev){
    console.info("Firetail.io - [".concat(data.statusCode, "] ").concat(req.method, ":").concat(req.originalUrl, " - ").concat(executionTime / 1000, "sec"));
    if (data.lambda) {
        var logExt = {
            "event": req.lambdaEvent,
            "response": {
                "statusCode": payload.response.statusCode,
                "body": payload.response.body
            },
            "execution_time": executionTime
        };
        console.log("firetail:log-ext:", logExt);
        console.log("firetail:log-ext:" + btoa(JSON.stringify(logExt)));
    }
    else {
        var options = {
            hostname: 'api.logging.eu-west-1.sandbox.firetail.app',
            port: 443,
            path: '/logs/bulk',
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': '*',
                "content-type": "application/x-ndjson",
                "x-ft-api-key": data.apiKey
            } // END headers
        }; // END options
        console.log(options, payload);
        var req_1 = https.request(options, function (res) {
            console.log("statusCode: ".concat(res.statusCode));
            res.setEncoding('utf8');
            res.on('data', function (d) {
                console.log(JSON.parse(d));
                //console.log(Buffer.isBuffer(d),d.toString('utf8'))
            });
        });
        req_1.write(JSON.stringify(payload));
        req_1.on('error', function (error) { console.error(error); });
        req_1.end();
    } // END else
    /*else {
      console.error("Missing Firetail API key!")
    }*/
} // END out
module.exports = out;
//# sourceMappingURL=log.js.map