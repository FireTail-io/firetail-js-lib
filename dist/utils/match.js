var TEN_MINUTES = 600000;
var cache = {};
var clearCache = function () {
    var now = Date.now();
    Object.keys(cache)
        .forEach(function (url) {
        var _a = cache[url], result = _a.result, lastReqNu = _a.lastReqNu;
        if (result
            && ((lastReqNu + TEN_MINUTES) < now)) {
            delete cache[url];
        }
    });
};
// FOR code covage
cache["test"] = { result: true, lastReqNu: Number.NEGATIVE_INFINITY };
clearCache();
setInterval(clearCache, TEN_MINUTES);
//=====================================================
//=========================================== match Url
//=====================================================
function matchUrl(url, apiPaths) {
    //console.log(url, apiPaths, cache)
    if (cache[url]) {
        return cache[url].result;
    }
    //++++++++++++++++++++++++++++ check each path in yaml
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var scores = {};
    for (var pathIndex = 0; pathIndex < apiPaths.length; pathIndex++) {
        var apiPath = apiPaths[pathIndex];
        //console.log(apiPath, pathIndex)
        //+++++++++++++++++++++ dones this path have fragments
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        if (apiPath.includes("{")) {
            var reduceUrl = url;
            var params = {};
            var lastStep = null;
            var totalLeng = 0;
            //+++++++++++++++++++++++++++++++++++++++++ Split path
            //++++++++++++++++++++++++++++++++++++++++++++++++++++
            // split yaml path - /a/{b}
            var pathFragments = apiPath.split(/\{|\}/gi)
                .filter(function (x) { return x; });
            //console.log(pathFragments)
            for (var fragmentIndex = 0; fragmentIndex < pathFragments.length; fragmentIndex++) {
                var fragment = pathFragments[fragmentIndex];
                //console.log("fragment",fragment)
                //+++++++++++++++++++++++++++++++ Skip for placeholder
                //++++++++++++++++++++++++++++++++++++++++++++++++++++
                if (fragmentIndex % 2 == 1) {
                    if (fragmentIndex === pathFragments.length - 1) {
                        if (reduceUrl.includes("/")) {
                            lastStep = null;
                            break;
                        }
                        params[fragment] = reduceUrl;
                    }
                    lastStep.fragment = fragment;
                    continue;
                } // END if
                else {
                    totalLeng += fragment.length;
                }
                var start = reduceUrl.indexOf(fragment);
                var end = fragment.length;
                //++++++++++ If fragment was not found in remaning url
                //++++++++++++++++++++++++++++++ try next path in list
                if (-1 === start // the status part of the URL could not be found
                    || (fragmentIndex === pathFragments.length - 1 // the is the END of the loop
                        && end < (reduceUrl.length - start))) { // BUT the path is longer
                    lastStep = null;
                    break;
                }
                //++++++++++++++++++++ Process fragment from last step
                //++++++++++++++++++++++++++++++++++++++++++++++++++++
                if (0 < fragmentIndex) {
                    var param = reduceUrl.slice(0, start);
                    // DO WE NEED THIS ??
                    /*if(param.includes("/")){
                      lastStep=null
                      break;
                    }*/
                    params[lastStep.fragment] = param;
                    // CUT Placehold fragment from the previce step
                    reduceUrl = reduceUrl.slice(start);
                    // CUT fragment from URL for this step
                    reduceUrl = reduceUrl.slice(end);
                    //++++++++++++++++++++++++ Else this is the first step
                    //++++++++++++++++++++++++++++++++++++++++++++++++++++
                }
                else {
                    reduceUrl = reduceUrl.slice(end);
                } // END else
                lastStep = { start: start, end: end };
            } // END for
            //console.log("lastStep",lastStep)
            if (lastStep) {
                scores[totalLeng] = { path: apiPath, params: params };
            }
            //++++++++++++++++ exist match if the path is the same
            //++++++++++++++++++++++++++++++++++++++++++++++++++++
        }
        else if (url === apiPath) {
            return { path: apiPath, params: {} };
        }
    } // END for apiPaths in YAML
    var topScore = Object.keys(scores)
        .map(function (score) { return +score; });
    if (topScore.length) {
        var result = scores[Math.max.apply(null, topScore)];
        cache[url] = { result: result, lastReqNu: Date.now() };
        return result;
    }
    cache[url] = { result: null, lastReqNu: Date.now() };
    return null;
} // END matchUrl
module.exports = matchUrl;
//# sourceMappingURL=match.js.map