// lang`StatusCode ${statusCode} was not found. Available codes are ${Object.keys(specificScama.responses)}`
const combineTample = require("../utils/combineTample")

module.exports = function lang(strings,...vals){
  switch (JSON.stringify(strings)) {
    case               '["StatusCode ",                        " was not found. Available codes are "]'
    const replaceWith = ["No se encontró el código de estado ",". Los códigos disponibles son "]
      return combineTample(replaceWith,vals)
      break;
    default:
      return combineTample(strings,vals)
  }
}
