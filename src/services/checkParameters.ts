
module.exports = function checkParameters(val: string,schema){

  let isErr = ""

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
  switch(schema.type) {
    case "number":
    case "integer":
      let isok = true
      //format: int64
      const parcedVal = +val
      if(`${parcedVal}`!== val){
        isErr = `${val} is not a value number`
      }

      if( ! isErr
      && "minimum" in schema
      && schema.minimum > parcedVal){
        isErr = `${val} is below the minimum value`
      }

      if( ! isErr
      && "maximum" in schema
      && schema.maximum < parcedVal){
        isErr = `${val} is above the maximum value`
      }

      if( ! isErr
      && "integer" === schema.type
      && 0 < parcedVal % 1){
        isErr = `${val} is not a whole number`
      }

      if( ! isErr){
        return parcedVal
      }
      break;
    case "string":

      if( ! val){
        isErr = "No a valid string:"+JSON.stringify(val)
      }

      if( ! isErr
      &&   schema.enum
      && ! schema.enum.includes(val)){
        isErr = `"${val}" in the in the range of ${schema.enum.join()}`
      }

      if( ! isErr
      && schema.pattern){
        const patternRg = new RegExp(schema.pattern);
        if( ! patternRg.text(val)){
          isErr = `"${val}" didn't match ${schema.pattern}`
        }
      } // END pattern

      if(isok
      && schema.minLength
      && schema.minLength > val.length){
        isErr = `"${val}" is to shot.`
      }

      if(isok
      && schema.maxLength
      && schema.maxLength < val.length){
        isErr = `"${val}" is to long.`
      }

      // TODO: check schema.format //i.e. email, uuid ...

      if(! isErr){
        return val
      }

      break;
    case "boolean":
      if("string" === typeof val && ["false","true"].includes(val.toLowerCase()))
        return "true" === val.toLowerCase()
      break;
    case "object":

  //    break;
    case "array":
    // schema.items.type: string
  //    break;
    default:
      isErr = "Unknowen type: "+schema.type
      // code block
  }// END switch

  throw new Error(isErr)
}
