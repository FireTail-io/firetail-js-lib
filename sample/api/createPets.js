module.exports = function (req, res){
  console.log(req.params)
  res.send('FOO '+ JSON.stringify(req.params)+ JSON.stringify(req.jwt))
}
