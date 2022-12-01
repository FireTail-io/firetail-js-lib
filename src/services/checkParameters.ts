
module.exports = function checkParameters(val: string,schema){

  let isErr = null

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
      if(`${parcedVal}`!== val && "string" === typeof val){
        isErr = { firetail:"notANumber", val }
      }

      if( ! isErr
      && "minimum" in schema
      && schema.minimum > parcedVal){
        isErr = { firetail:"belowMinimum", val }
      }

      if( ! isErr
      && "maximum" in schema
      && schema.maximum < parcedVal){
        isErr = { firetail:"aboveMaximum", val }
      }

      if( ! isErr
      && "integer" === schema.type
      && 0 < parcedVal % 1){
        isErr = { firetail:"notAWholeNumber", val }
      }

      if( ! isErr){
        return parcedVal
      }
      break;
    case "string":

      if( ! val){
        isErr = { firetail:"notValidString", val }
      }

      if( ! isErr
      &&   schema.enum
      && ! schema.enum.includes(val)){
        isErr = {
          firetail:"enumNotFound",
          val:{
            val,
            list:schema.enum.join()
          }
        }
      }

      if( ! isErr
      && schema.pattern){
        const patternRg = new RegExp(schema.pattern);
        if( ! patternRg.text(val)){
          isErr = {
            firetail:"patternNotMatch",
            val:{
              val,
              pattern:schema.pattern
            }
          }
        }
      } // END pattern

      if(isok
      && schema.minLength
      && schema.minLength > val.length){
        isErr = { firetail:"toShort", val }
      }

      if(isok
      && schema.maxLength
      && schema.maxLength < val.length){
        isErr = { firetail:"toLong", val }
      }

      // TODO: check schema.format //i.e. email, uuid ...

      if(! isErr){
        return val
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
  }// END switch

  throw { ...isErr, status:400 }
}
