'use strict';

var url = require('url');


var Auth = require('./AuthService');


module.exports.accessTokenPost = function accessTokenPost (req, res, next) {
  Auth.accessTokenPost(req.swagger.params, res, next);
};

module.exports.authorizePost = function authorizePost (req, res, next) {
  Auth.authorizePost(req.swagger.params, res, next);
};

module.exports.oauthAccessTokenPost = function oauthAccessTokenPost (req, res, next) {
  Auth.oauthAccessTokenPost(req.swagger.params, res, next);
};

module.exports.oauthApplicationPost = function oauthApplicationPost (req, res, next) {
  Auth.oauthApplicationPost(req.swagger.params, res, next);
};

module.exports.oauthAuthorizeGet = function oauthAuthorizeGet (req, res, next) {
  Auth.oauthAuthorizeGet(req.swagger.params, res, next);
};

module.exports.registerPost = function registerPost (req, res, next) {
  Auth.registerPost(req.swagger.params, res, next);
};

module.exports.registerOptions = function registerOptions (req, res, next) {
  Auth.registerOptions(req.swagger.params, res, next);
};
