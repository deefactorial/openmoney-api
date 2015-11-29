'use strict';

var url = require('url');


var Spaces = require('./SpacesService');


module.exports.discoverySpacesGet = function discoverySpacesGet (req, res, next) {
  Spaces.discoverySpacesGet(req.swagger.params, res, next);
};

module.exports.syncSpacesGet = function syncSpacesGet (req, res, next) {
  Spaces.syncSpacesGet(req.swagger.params, res, next);
};

module.exports.syncSpacesPost = function syncSpacesPost (req, res, next) {
  Spaces.syncSpacesPost(req.swagger.params, res, next);
};

module.exports.syncSpacesIdGet = function syncSpacesIdGet (req, res, next) {
  Spaces.syncSpacesIdGet(req.swagger.params, res, next);
};

module.exports.syncSpacesIdPut = function syncSpacesIdPut (req, res, next) {
  Spaces.syncSpacesIdPut(req.swagger.params, res, next);
};

module.exports.syncSpacesIdDelete = function syncSpacesIdDelete (req, res, next) {
  Spaces.syncSpacesIdDelete(req.swagger.params, res, next);
};
