//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================
function acceptTypes(acceptSt) {
    return acceptSt.split(",")
        .map(function (type) { return type.split(";")[0]; });
    // TODO: Add support for "relative quality factor"
    /* The example
    ' Accept: audio/*; q=0.2, audio/basic '
    SHOULD be interpreted as "I prefer audio/basic, but send me any audio type if it is the best available after an 80% mark-down in quality."
    */
} // END acceptTypes
//=====================================================
//============================= find Accept Content Key
//=====================================================
function findAcceptContentKey(acceptTypes, acceptContent) {
    // TODO: check for "something/*"
    for (var _i = 0, acceptTypes_1 = acceptTypes; _i < acceptTypes_1.length; _i++) {
        var acceptType = acceptTypes_1[_i];
        if ("*/*" === acceptType) {
            return acceptContent[0];
        }
        if (acceptContent.includes(acceptType)) {
            return acceptType;
        }
    } // END for
    return false;
} // END findAcceptContentKey
module.exports = { acceptTypes: acceptTypes, findAcceptContentKey: findAcceptContentKey };
