'use strict';

const StewardsPost = require('./Stewards/StewardsPost');
const StewardsList = require('./Stewards/StewardsList');
const StewardsPut = require('./Stewards/StewardsPut');
const StewardsDelete = require('./Stewards/StewardsDelete');
const StewardsGet = require('./Stewards/StewardsGet');
const StewardsReset = require('./Stewards/StewardsReset');
const StewardsForgot = require('./Stewards/StewardsForgot');

module.exports.stewardsList = function stewardsList (req, res, next) {
  StewardsList.stewardsList(req, res, next);
};

module.exports.stewardsPost = function stewardsPost (req, res, next) {
  StewardsPost.stewardsPost(req.swagger.params, res, next);
};

module.exports.stewardsGet = function stewardsGet (req, res, next) {
  StewardsGet.stewardsGet(req, res, next);
};

module.exports.stewardsPut = function stewardsPut (req, res, next) {
  StewardsPut.stewardsPut(req, res, next);
};

module.exports.stewardsDelete = function stewardsDelete (req, res, next) {
  StewardsDelete.stewardsDelete(req, res, next);
};

module.exports.stewardsForgotPost = function stewardsForgotPost (req, res, next) {
  StewardsForgot.stewardsForgotPost(req.swagger.params, res, next);
};

module.exports.stewardsResetPost = function stewardsResetPost (req, res, next) {
  StewardsReset.stewardsResetPost(req.swagger.params, res, next);
};
