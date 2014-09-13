"use strict"

var temp = require("temp").track()
var ncp = require("ncp")
var assert = require("assert")
var fs = require("fs")

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
})
