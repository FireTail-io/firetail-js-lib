const data = require('../animals.json')
module.exports = function (req, res){
  const id = data.reduce((max, curren) => max.id > curren.id ? max : curren).id +1
  const newItem = {...req.body,id}
  data.push(newItem)
  res.status(201)
     .setHeader("Content-Type", "application/xml")
     .send(`<?xml version="1.0" encoding="UTF-8"?>
            <Pet>${
              Object.keys(newItem)
                      .map(key=>`<${key}>${newItem[key]}</${key}>`)
                      .join("")
            }</Pet>`)
                  //.json(newItem)
}
