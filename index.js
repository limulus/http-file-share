"use strict"

var Share = require("./lib/Share.js")

module.exports = function (sharePath, baseRoute, contentTypeMapper) {
  var share = new Share(sharePath, baseRoute, contentTypeMapper)
  return share.handleRequest.bind(share)
}

module.exports.Share = Share
