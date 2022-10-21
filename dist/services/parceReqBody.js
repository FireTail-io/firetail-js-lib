module.exports = function (bodyText, scamaForEndPoint, data) {
    var verb = data.verb, headers = data.headers;
    var contentType = headers["content-type"];
    //console.log(Object.keys(scamaForEndPoint))
    var scamaVerb = scamaForEndPoint[verb];
    console.log(scamaVerb.requestBody);
    if (scamaVerb.requestBody
        && scamaVerb.requestBody.content[contentType]) {
        console.log(contentType, scamaVerb.requestBody.content[contentType]);
    }
    else {
        try {
            console.log(bodyText);
            return JSON.parse(bodyText);
        }
        catch (err) {
            console.log(err);
            return bodyText;
        }
    }
};
