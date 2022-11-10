
const data = require('../../animals.json')

module.exports = function (req, res){
  const index = data.findIndex(({id})=>id===req.params.petId)
  console.log(index)
  if(-1 === index){
    res.status(404).json({
      type:req.originalUrl,
      title:`No pet with ${req.params.petId} was found`
    })
    return;
  }
  res.setHeader("x-next",`/pets${data[1+index] ? "/"+data[1+index].id : ""}`)
  res.json(data[index])
}
