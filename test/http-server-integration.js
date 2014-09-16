"use strict"

var http = require("http")
var path = require("path")
var assert = require("assert")
var fs = require("fs")
var portfinder = require("portfinder")
var request = require("request")

var createFileShare = require("../index.js")
var sharePath = path.join(__dirname, "data")

describe("http-server-integration", function () {
  var server, port

  beforeEach(function (done) {
    server = http.createServer(createFileShare(sharePath, /^\/foo/))
    portfinder.getPort(function (err, thePort) {
      assert.ifError(err)

      port = thePort
      server.listen(port, "127.0.0.1", function () {
        return done()
      })
    })
  })

  afterEach(function (done) {
    server.close(function () {
      return done()
    })
  })

  it("should be able to successfully get a file from the test server", function (done) {
    var fileContent = fs.readFileSync(path.join(sharePath, "/1/b.json")).toString()
    request("http://127.0.0.1:"+port+"/foo/1/b.json", function (err, res, body) {
      assert.ifError(err)
      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.headers["content-type"], "application/json")
      assert.strictEqual(body, fileContent)
      return done()
    })
  })

  it("should not respond when requested URL does not match route", function (done) {
    server.on("request", function (req, res) {
      if (req.url.match(/^\/bar/)) {
        res.writeHead(418)
        res.end()
      }
    })

    request("http://127.0.0.1:"+port+"/bar/a.json", function (err, res) {
      assert.ifError(err)
      assert.strictEqual(res.statusCode, 418)
      return done()
    })
  })
})
