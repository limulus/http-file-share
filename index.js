"use strict"

var Share = require("./lib/Share.js")

module.exports = function (sharePath, baseRoute) {
  var share = new Share(sharePath, baseRoute)
  return share.handleRequest.bind(share)
}

module.exports.Share = Share
