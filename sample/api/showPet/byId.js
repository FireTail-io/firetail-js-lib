
const data = require('../../animals.json')

module.exports = function (req, res){
  const index = data.findIndex(({id})=>id===req.params.petId)
  res.setHeader("x-next",`/pets${data[1+index] ? "/"+data[1+index].id : ""}`)
  res.json(data[index])
}
