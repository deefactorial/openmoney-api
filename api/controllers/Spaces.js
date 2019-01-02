'use strict';
const SpacesList = require('./Spaces/SpacesList');
const SpacesPost = require('./Spaces/SpacesPost');
const SpacesGet = require('./Spaces/SpacesGet');
const SpacesPut = require('./Spaces/SpacesPut');
const SpacesDelete = require('./Spaces/SpacesDelete');

module.exports.spacesList = function spacesList (req, res, next) {
  SpacesList.spacesList(req, res, next);
};

module.exports.spacesPost = function spacesPost (req, res, next) {
  SpacesPost.spacesPost(req, res, next);
};

module.exports.spacesGet = function spacesGet (req, res, next) {
  SpacesGet.spacesGet(req, res, next);
};

module.exports.spacesPut = function spacesPut (req, res, next) {
  SpacesPut.spacesPut(req, res, next);
};

module.exports.spacesDelete = function spacesDelete (req, res, next) {
  SpacesDelete.spacesDelete(req, res, next);
};
