'use strict';

var url = require('url');


var Spaces = require('./SpacesService');


module.exports.spacesList = function spacesList (req, res, next) {
  Spaces.spacesList(req, res, next);
};

module.exports.spacesPost = function spacesPost (req, res, next) {
  Spaces.spacesPost(req, res, next);
};

module.exports.spacesGet = function spacesGet (req, res, next) {
  Spaces.spacesGet(req, res, next);
};

module.exports.spacesPut = function spacesPut (req, res, next) {
  Spaces.spacesPut(req, res, next);
};

module.exports.spacesDelete = function spacesDelete (req, res, next) {
  Spaces.spacesDelete(req, res, next);
};
