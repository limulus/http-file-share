"use strict"

var path = require("path")
var fs = require("fs")
var crypto = require("crypto")
var rimraf = require("rimraf")
var subdir = require("subdir")
var mime = require("mime")

var Share = module.exports = function (sharePath, baseRoute, contentTypeMapper) {
  this.setBasePath(sharePath)
  this.setBaseRoute(baseRoute || /^\//)

  if (contentTypeMapper) {
    this.setContentTypeMappingFunction(contentTypeMapper)
  }
}


Share.prototype.handleRequest = function (req, res) {
  var filePath = this._resolvePathFromRequest(req)

  if (! subdir(this._path, filePath)) {
    res.writeHead(403)
    res.end()
    return
  }

  switch (req.method) {
    case "GET":
      this._handleGetRequest(filePath, req, res)
      break

    case "DELETE":
      this._handleDeleteRequest(filePath, req, res)
      break

    case "PUT":
      this._handlePutRequest(filePath, req, res)
      break

    default:
      res.writeHead(501)
      res.end()
      break
  }
}

Share.prototype.setBasePath = function (basePath) {
  this._path = path.normalize(basePath)
}

Share.prototype.setBaseRoute = function (baseRoute) {
  if (baseRoute instanceof RegExp) {
    this._baseRoute = baseRoute
  }
  else {
    throw new Error("baseRoute must be of type RegExp")
  }
}

Share.prototype.setContentTypeMappingFunction = function (fn) {
  this._contentTypeMapper = fn
}


Share.prototype._determineContentType = function (filePath) {
  if (this._contentTypeMapper === undefined) {
    var mime = require("mime")
    this._contentTypeMapper = mime.lookup.bind(mime)
  }
  return this._contentTypeMapper(filePath)
}


Share.prototype._resolvePathFromRequest = function (req) {
  var resolvedUrlPath = req.url.replace(this._baseRoute, "/").replace(/^\/*/, "/")
  var joinedFileSystemPath = path.join(this._path, resolvedUrlPath)
  var resolvedFileSystemPath = path.resolve(joinedFileSystemPath)
  return resolvedFileSystemPath
}


Share.prototype._handleGetRequest = function (filePath, req, res) {
  var stream = fs.createReadStream(filePath)
  stream.on("error", this._fileErrorHandler.bind(this, req, res))
  stream.on("open", this._readFileOpenHandler.bind(this, req, res, filePath, stream))
}

Share.prototype._readFileOpenHandler = function (req, res, filePath, stream) {
  res.writeHead(200, {
    "content-type": this._determineContentType(filePath)
  })
  stream.pipe(res)
}


Share.prototype._handleDeleteRequest = function (filePath, req, res) {
  fs.stat(filePath, function (err) {
    if (err) {
      return this._fileErrorHandler(req, res, err)
    }

    rimraf(filePath, function (err) {
      if (err) {
        return this._fileErrorHandler(req, res, err)
      }

      res.writeHead(204)
      res.end()
    }.bind(this))
  }.bind(this))
}


Share.prototype._handlePutRequest = function (filePath, req, res) {
  crypto.pseudoRandomBytes(16, function (err, rand) {
    // Ignoring err becuse supposedly pseudoRandomBytes never returns an error

    var tmpFilePath = filePath + "-" + rand.toString("hex")
    var stream = fs.createWriteStream(tmpFilePath)
    stream.on("error", this._fileErrorHandler.bind(this, req, res))
    stream.on("finish", this._writeFileFinishHandler.bind(this, filePath, tmpFilePath, req, res, stream))
    req.pipe(stream)
  }.bind(this))
}

Share.prototype._writeFileFinishHandler = function (filePath, tmpFilePath, req, res, stream) {
  fs.rename(tmpFilePath, filePath, function (err) {
    if (err) {
      return this._fileErrorHandler(req, res, err)
    }

    res.writeHead(204)
    res.end()
  }.bind(this))
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
