'use strict';

var url = require('url');


var Stewards = require('./StewardsService');


module.exports.stewardsList = function stewardsList (req, res, next) {
  Stewards.stewardsList(req, res, next);
};

module.exports.stewardsPost = function stewardsPost (req, res, next) {
  Stewards.stewardsPost(req.swagger.params, res, next);
};

module.exports.stewardsGet = function stewardsGet (req, res, next) {
  Stewards.stewardsGet(req, res, next);
};

module.exports.stewardsPut = function stewardsPut (req, res, next) {
  Stewards.stewardsPut(req, res, next);
};

module.exports.stewardsDelete = function stewardsDelete (req, res, next) {
  Stewards.stewardsDelete(req, res, next);
};

module.exports.stewardsForgotPost = function stewardsForgotPost (req, res, next) {
  Stewards.stewardsForgotPost(req.swagger.params, res, next);
};

module.exports.stewardsResetPost = function stewardsResetPost (req, res, next) {
  Stewards.stewardsResetPost(req.swagger.params, res, next);
};
