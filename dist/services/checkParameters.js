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
module.exports = function checkParameters(val, schema) {
    var isErr = null;
    /*
  
  
    Common Name	type	format	Comments
    integer	integer	int32	signed 32 bits
    long	integer	int64	signed 64 bits
    float	number	float
    double	number	double
    string	string
    byte	string	byte	base64 encoded characters
    binary	string	binary	any sequence of octets
    boolean	boolean
    date	string	date	As defined by full-date - RFC3339
    dateTime	string	date-time	As defined by date-time - RFC3339
    password	string	password	Used to hint UIs the input needs to be obscured.
  
    */
    switch (schema.type) {
        case "number":
        case "integer":
            var isok = true;
            //format: int64
            var parcedVal = +val;
            if ("".concat(parcedVal) !== val && "string" === typeof val) {
                isErr = { firetail: "notANumber", val: val };
            }
            if (!isErr
                && "minimum" in schema
                && schema.minimum > parcedVal) {
                isErr = { firetail: "belowMinimum", val: val };
            }
            if (!isErr
                && "maximum" in schema
                && schema.maximum < parcedVal) {
                isErr = { firetail: "aboveMaximum", val: val };
            }
            if (!isErr
                && "integer" === schema.type
                && 0 < parcedVal % 1) {
                isErr = { firetail: "notAWholeNumber", val: val };
            }
            if (!isErr) {
                return parcedVal;
            }
            break;
        case "string":
            if (!val) {
                isErr = { firetail: "notValidString", val: val };
            }
            if (!isErr
                && schema.enum
                && !schema.enum.includes(val)) {
                isErr = {
                    firetail: "enumNotFound",
                    val: {
                        val: val,
                        list: schema.enum.join()
                    }
                };
            }
            if (!isErr
                && schema.pattern) {
                var patternRg = new RegExp(schema.pattern);
                if (!patternRg.text(val)) {
                    isErr = {
                        firetail: "patternNotMatch",
                        val: {
                            val: val,
                            pattern: schema.pattern
                        }
                    };
                }
            } // END pattern
            if (isok
                && schema.minLength
                && schema.minLength > val.length) {
                isErr = { firetail: "toShort", val: val };
            }
            if (isok
                && schema.maxLength
                && schema.maxLength < val.length) {
                isErr = { firetail: "toLong", val: val };
            }
            // TODO: check schema.format //i.e. email, uuid ...
            if (!isErr) {
                return val;
            }
            break;
        /*  case "boolean":
            if("boolean" === typeof val)
              return val
            if("string" === typeof val && ["false","true"].includes(val.toLowerCase()))
              return "true" === val.toLowerCase()
            break;
          case "object":
      
        //    break;
          case "array":
          // schema.items.type: string
        //    break;
          default:
            isErr = { firetail:"unknownType", val:schema.type }
            */
        // code block
    } // END switch
    throw __assign(__assign({}, isErr), { status: 400 });
};
//# sourceMappingURL=checkParameters.js.map