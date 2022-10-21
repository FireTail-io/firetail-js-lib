const data = require('../animals.json')
module.exports = function (req, res){
  console.log(typeof req.body, req.body)
//  data.push()
  res.json(req.body)
}
