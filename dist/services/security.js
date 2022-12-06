// for Basic, Bearer and other HTTP authentications schemes
function http(schemes, headers, authCb, decodedJwt) {
    var authHeader = headers.authorization;
    if (!authHeader) {
        throw {
            firetail: "missingJWTtoken",
            status: 401
        }; // END throw
    } // if ! headers.authorization
    var bearerFormat = schemes.bearerFormat;
    if ("jwt" === bearerFormat.toLowerCase()) {
        return jwt(schemes, headers, authCb, decodedJwt);
    }
    var _a = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':'), user = _a[0], pass = _a[1];
    try {
        return authCb({
            user: user,
            pass: pass,
            scope: schemes.scopes
        }, headers);
    }
    catch (err) {
        //    console.error(err)
        throw {
            firetail: "authenticationFailed",
            message: err.message || err,
            headers: [['WWW-Authenticate', 'Basic']],
            status: 401
        };
    }
} // END http
function jwt(schemes, headers, authCb, decodedJwt) {
    var authHeader = headers.authorization;
    if (!headers.authorization.toLowerCase().startsWith("bearer")) {
        throw {
            firetail: "notJWTBearer",
            status: 401
        }; // END throw
    }
    var result = null;
    if ("function" === typeof decodedJwt) {
        result = authCb({
            authorization: authHeader,
            decoded: decodedJwt(headers),
            scope: schemes.scopes
        }, headers);
    }
    else if (true === decodedJwt) {
        var token = headers.authorization.split(" ").pop().replace(/['"]+/g, '');
        var tokenDecodablePart = token.split('.')[1];
        var decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
        result = authCb({
            authorization: authHeader,
            decoded: JSON.parse(decoded),
            token: token,
            scope: schemes.scopes
        }, headers);
    }
    else {
        result = authCb({
            authorization: authHeader,
            token: headers.authorization.split(" ").pop(),
            scope: schemes.scopes
        }, headers);
    } // END else
    if ("object" !== typeof result) {
        throw {
            firetail: "badJWTFunctionOutput",
            status: 401
        }; // END throw
    } // END if
    return result;
} // END jwt
// for API keys and cookie authentication
function apiKey(schemes, headers, authCb, decodedJwt) {
    var token = headers[schemes.name.toLowerCase()];
    if ("query" === schemes.in) {
        var query = this.query;
        token = query[schemes.name];
    }
    if (!token) {
        throw {
            firetail: "missingJWTtoken",
            status: 403
        };
    }
    var scopes = schemes.scopes
        || schemes.flows &&
            schemes.flows.implicit &&
            schemes.flows.implicit.scopes
        || {};
    return authCb({
        authorization: token,
        scopes: scopes
    }, headers);
} // END apikey
// Implicit Grant ~ https://circuit.github.io/oauth.html#implicit
function oauth2(schemes, headers, authCb, decodedJwt) {
    var authHeader = headers.authorization;
    if (!authHeader) {
        throw {
            firetail: "missingJWTtoken",
            status: 401
        }; // END throw
    } // if ! headers.authorization
    var scopes = schemes.scopes
        || schemes.flows &&
            schemes.flows.implicit &&
            schemes.flows.implicit.scopes
        || {};
    return authCb({
        authorization: authHeader.split(" ").pop(),
        scopes: scopes
    }, headers);
} // END oauth2
function openid() {
} // END openid
//for OpenID Connect Discovery
function openIdConnect() {
} // END openIdConnect
var securityType = { http: http, oauth2: oauth2, openid: openid, apiKey: apiKey };
//jwt, oauth, openid, apikey, basic
//=====================================================
//======================== validate security controller
//=====================================================
function security(_a) {
    var authCallbacks = _a.authCallbacks, scamaVerb = _a.scamaVerb, operationsFn = _a.operationsFn, securitySchemes = _a.securitySchemes, headers = _a.headers, decodedJwt = _a.decodedJwt, req = _a.req, secName = _a.secName;
    //++++++++ check caller has the right security headers
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    return new Promise(function (resolve, reject) {
        if (!secName) {
            return resolve(true);
        }
        try {
            var scheme = securitySchemes[secName];
            if (!authCallbacks) {
                throw {
                    firetail: "missingJWTtoken",
                    status: 401
                };
            } // END if
            var authCb = authCallbacks[secName];
            if ("function" !== typeof authCb) {
                throw {
                    firetail: "missingJWTFunction",
                    status: 401
                };
            } // END if
            var result = securityType[scheme.type].call(req, scheme, headers, authCb, decodedJwt);
            resolve(result);
        }
        catch (err) {
            reject(err.firetail ? err : {
                message: "Security Function \"".concat(scheme.type, "\" failed with:").concat(err.message || err),
                status: 401
            }); // END reject
        } // END catch
    }); // END Promise
}
security.getSecName = function (_a, securitySchemes) {
    var security = _a.security;
    var foundSecName;
    if (security) {
        security.forEach(function (sec) {
            Object.keys(sec).forEach(function (secName) {
                if (securitySchemes[secName]) {
                    foundSecName = secName;
                }
            });
        });
    }
    return foundSecName;
}; // END getSecName
module.exports = security;
//# sourceMappingURL=security.js.map