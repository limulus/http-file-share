"use strict"

var http = require("http")
var path = require("path")
var httpFileShare = require("../index.js")  // require("http-file-share")

var sharePath = path.join(__dirname, "public")
var shareRequestHandler = httpFileShare(sharePath, /^\/shared/)
var server = http.createServer(shareRequestHandler)

server.listen(8000, "127.0.0.1", function () {
  console.log("Sharing on http://127.0.0.1:8000/shared/")
})
