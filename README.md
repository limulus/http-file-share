# http-file-share   [![Build Status](https://travis-ci.org/limulus/http-file-share.svg?branch=master)](https://travis-ci.org/limulus/http-file-share)

Read and write files under a directory over HTTP


## Synopsis

Provides a REST-like interface for GET-ing, PUT-ing and DELETE-ing static files on a server. No attempts at authentication are made, so do not use this module without the appropriate logic to intercept non-authenticated requests — or only ever use it on single-user workstations.

Ultimately, a WebDAV server may be a more complete solution for you if that’s what you need. On the other hand, if you need something quick, simple and doesn’t rely on a bunch of broken modules, this might be your ticket.


## Installation

```shell
npm install http-file-share
```


## Usage

The following creates an HTTP server that listens on localhost port 8000 and shares the contents of the `public` directory under the `/shared/` URL.

```javascript
var http = require("http")
var path = require("path")
var httpFileShare = require("http-file-share")

var sharePath = path.join(__dirname, "public")
var shareRequestHandler = httpFileShare(sharePath, /^\/shared/)
var server = http.createServer(shareRequestHandler)

server.listen(8000, "127.0.0.1", function () {
  console.log("Sharing on http://127.0.0.1:8000/shared/")
})
```


## Exports

### httpFileShare(sharePath, [baseRoute], [contentTypeMappingFunction])

Convenience function that returns a request handler. See the `Share` constructor below for argument descriptions.


### httpFileShare.Share


#### new Share(sharePath, [baseRoute], [contentTypeMappingFunction])

Constructor for a shared directory.

  - `sharePath` is the path to the directory you want to share.
  - `baseRoute` is a regular expression that matches URLs you want this handler to respond to. The default is `/^\//`.
  - `contentTypeMappingFunction` is used to specify a function for mapping file paths to Content-type header values. The default is to use the `lookup` method of the <a href="https://www.npmjs.org/package/mime">mime</a> module.


#### Share.prototype.handleRequest(request, response)

Handle a request.

  - `request` is an `http.IncomingMessage` object.
  - `response` is an `http.ServerResponse` object.
