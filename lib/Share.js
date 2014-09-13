"use strict"

var path = require("path")
var fs = require("fs")
var rimraf = require("rimraf")

var Share = module.exports = function (sharePath) {
  this._path = path.normalize(sharePath)
}

Share.prototype.handleRequest = function (req, res) {
  var filePath = path.join(this._path, req.url)

  switch (req.method) {
    case "GET":
      this._handleGetRequest(filePath, req, res)
      break

    case "DELETE":
      this._handleDeleteRequest(filePath, req, res)
      break

    default:
      res.writeHead(501)
      res.end()
      break
  }
}


Share.prototype._handleGetRequest = function (filePath, req, res) {
  var stream = fs.createReadStream(filePath)
  stream.on("error", this._fileErrorHandler.bind(this, req, res))
  stream.on("open", this._readFileOpenHandler.bind(this, req, res, stream))
}

Share.prototype._readFileOpenHandler = function (req, res, stream) {
  res.writeHead(200)
  stream.pipe(res)
}


Share.prototype._handleDeleteRequest = function (filePath, req, res) {
  rimraf(filePath, function (err) {
    if (err) {
      return this._fileErrorHandler(req, res, err)
    }

    res.writeHead(204)
    res.end()
  })
}


Share.prototype._fileErrorHandler = function (req, res, err) {
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
