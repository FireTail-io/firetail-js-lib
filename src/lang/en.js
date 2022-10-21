// lang`StatusCode ${statusCode} was not found. Available codes are ${Object.keys(specificScama.responses)}`
const combineTample = require("../utils/combineTample")

module.exports = function lang(strings,...vals){
  switch (JSON.stringify(strings)) {
    case '["StatusCode "," was not found. Available codes are "]'
      return combineTample(strings,vals)
      break;
    default:
      return combineTample(strings,vals)
  }
}
