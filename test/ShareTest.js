"use strict"

var temp = require("temp").track()
var ncp = require("ncp")
var assert = require("assert")
var fs = require("fs")
var httpMocks = require("node-mocks-http")
var EventEmitter = require("events").EventEmitter

var Share = require("../lib/Share.js")

describe("Share", function () {
  var share, tempDirPath

  beforeEach(function (done) {
    temp.mkdir("http-file-share-test", function (err, path) {
      assert.ifError(err)

      tempDirPath = path

      ncp("./test/data/", tempDirPath + "/", function (err) {
        err && err.forEach(console.error)
        assert.ifError(err)

        share = new Share(tempDirPath)

        return done()
      })
    })
  })

  afterEach(function (done) {
    temp.cleanup(function (err, stats) {
      assert.ifError(err)
      return done()
    })
  })

  it("should construct an object", function () {
    assert.ok(share)
  })

  it("should successfully copy files to temporary directory", function (done) {
    fs.exists(tempDirPath + "/a.json", function (result) {
      assert.ok(result)
      return done()
    })
  })

  describe(".prototype.handleRequest", function () {
    var response

    var get = function (url) {
      return httpMocks.createRequest({
        "method": "GET",
        "url": url
      })
    }

    beforeEach(function () {
      response = httpMocks.createResponse({
        "eventEmitter": EventEmitter
      })
    })

    it("should respond with a 404 for a nonexistent file", function (done) {
      var request = get("/does-not-exist.txt")

      response.on("end", function () {
        assert.strictEqual(response.statusCode, 404)
        return done()
      })

      share.handleRequest(request, response)
    })

    it("should respond with a 200 for a file that exists", function (done) {
      var request = get("/a.json")

      response.on("end", function () {
        assert.strictEqual(response.statusCode, 200)
        return done()
      })

      share.handleRequest(request, response)
    })

    it("should respond with the contents of the requested file", function (done) {
      var request = get("/a.json")

      response.on("end", function () {
        var fileContent = fs.readFileSync(tempDirPath + "/a.json")
        assert.ok(JSON.parse(fileContent))
        assert.ok(JSON.parse(response._getData()))
        assert.strictEqual(response._getData().toString(), fileContent.toString())
        return done()
      })

      share.handleRequest(request, response)
    })
  })
})
