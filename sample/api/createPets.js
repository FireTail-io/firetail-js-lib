const data = require('../animals.json')
module.exports = function (req, res){
  const id = data.reduce((max, curren) => max.id > curren.id ? max : curren).id +1
  const newItem = {...req.body,id}
  data.push(newItem)
  res.status(201).json(newItem)
}
