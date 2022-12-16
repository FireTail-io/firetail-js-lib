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
var checkParameters = require("./checkParameters");
var validate = require('jsonschema').validate;
module.exports = function validateBody(schema, isIncoming, dev) {
    //console.log(schema)
    var propertiesNames = Object.keys(schema.properties);
    var blocked = propertiesNames.reduce(function (all, key) {
        if (schema.properties[key].readOnly) {
            all.push(key);
        }
        return all;
    }, []);
    var required = schema.required.filter(function (name) { return !blocked.includes(name); })
        .map(function (name) { return (__assign(__assign({}, schema.properties[name]), { name: name })); });
    var optional = propertiesNames.reduce(function (all, key) {
        if (!blocked.includes(key)
            && !required.find(function (_a) {
                var name = _a.name;
                return name === key;
            })) {
            all.push(__assign(__assign({}, schema.properties[key]), { name: key }));
        }
        return all;
    }, []);
    //=====================================================
    //============================================= body fn
    //=====================================================
    return function (body) {
        /*
        console.log(body)
        if(isIncoming && dev){
          try{
            console.log(validate(body,schema))
          }catch(err){
            console.error(err)
          }
        }
        */
        //++++++++++++++++++++++++++ check for disallowed keys
        //+++++++++++++++++++++++++++++++++++++++ in its a req
        if (isIncoming)
            blocked.forEach(function (block) {
                if (body[block]) {
                    if (dev)
                        throw {
                            firetail: "forbidenReqBodyKey",
                            val: block,
                            status: 401
                        }; // END throw
                    //TODO: Log that the client to send readonly key
                    delete body[block];
                } // END if
            }); // END forEach
        //console.log(1)
        //+++++++++++++++++++++++++++++++++++++ check required
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        required.forEach(function (scrm) {
            //  console.log(typeof body,body,new Error())
            //  console.log(scrm)
            //  console.log(`undefined === body[${scrm.name}]`,undefined === body[scrm.name])
            if (undefined === body[scrm.name]) {
                throw {
                    firetail: "missingReqBodyKey",
                    val: scrm.name,
                    status: isIncoming ? 404 : 500
                }; // END throw
            }
            checkParameters(body[scrm.name], scrm);
        }); // END required.forEach
        //  console.log(2)
        //+++++++++++++++++++++++++++++++++++++ check optional
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        optional.forEach(function (scrm) {
            if (undefined !== body[scrm.name]) {
                checkParameters(body[scrm.name], scrm);
            }
        }); // END optional.forEach
        //+++++++++++++++++++++++++++++++++++++++++ filter out
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        // CHECKOUT "additionalProperties"
        // https://swagger.io/docs/specification/data-models/dictionaries/
        /*
              if(isIncoming)
              Object.keys(body).forEach(propName=>{
                if( ! propertiesNames.includes(propName)){
                  if(dev){
                    throw {
                      firetail:"valueForbidden",
                      val:propName,
                      status:403
                    } // END throw
                  } // END if dev
                  else {
        
                  }
                } // END if ! propertiesNames
              }) // END forEach
        */
        return propertiesNames.reduce(function (n, key) {
            if (key in body)
                n[key] = body[key];
            return n;
        }, {});
    }; // END body
}; // END validateBody
//# sourceMappingURL=validateBody.js.map