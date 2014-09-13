"use strict"

var path = require("path")
var fs = require("fs")

var Share = module.exports = function (sharePath) {
  this._path = path.normalize(sharePath)
}

Share.prototype.handleRequest = function (req, res) {
  var filePath = path.join(this._path, req.url)

  var stream = fs.createReadStream(filePath)
  stream.on("error", this._readFileErrorHandler.bind(this, req, res))
  stream.on("open", this._readFileOpenHandler.bind(this, req, res, stream))
}

Share.prototype._readFileOpenHandler = function (req, res, stream) {
  res.writeHead(200)
  stream.pipe(res)
}

Share.prototype._readFileErrorHandler = function (req, res, err) {
  switch (err.code) {
    case "ENOENT":
      res.writeHead(404)
      res.end()
      break

    default:
      res.writeHead(500)
      res.end()
      break
  }
}
