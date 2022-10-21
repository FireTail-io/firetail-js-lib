
const data = require('../../animals.json')

module.exports = function (req, res){
  res.json(data.find(({id})=>id===req.params.petId))
}
