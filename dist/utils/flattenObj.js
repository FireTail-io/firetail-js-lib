module.exports = function flattenObj(ob) {
    // The object which contains the
    // final result
    var result = {};
    // loop through the object "ob"
    for (var i in ob) {
        // We check the type of the i using
        // typeof() function and recursively
        // call the function again
        if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
            var temp = flattenObj(ob[i]);
            for (var j in temp) {
                // Store temp in result
                result[i + '.' + j] = temp[j];
            }
        }
        // Else store ob[i] in result directly
        else {
            result[i] = ob[i];
        }
    }
    return result;
};
//# sourceMappingURL=flattenObj.js.map