function isDeepEqual(object1, object2) {
    if (object1 === object2) {
        return true;
    }
    if (!object1
        || !object2
        || typeof object1 !== typeof object2) {
        return false;
    }
    var objKeys1 = Object.keys(object1);
    var objKeys2 = Object.keys(object2);
    if (objKeys1.length !== objKeys2.length)
        return false;
    for (var _i = 0, objKeys1_1 = objKeys1; _i < objKeys1_1.length; _i++) {
        var key = objKeys1_1[_i];
        var value1 = object1[key];
        var value2 = object2[key];
        var isObjects = isObject(value1) && isObject(value2);
        if ((isObjects && !isDeepEqual(value1, value2)) ||
            (!isObjects && value1 !== value2)) {
            return false;
        }
    }
    return true;
}
;
function isObject(object) {
    return object != null && typeof object === "object";
}
;
module.exports = isDeepEqual;
//# sourceMappingURL=isDeepEqual.js.map