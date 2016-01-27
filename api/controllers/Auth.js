'use strict';

var url = require('url');
var Auth = require('./AuthService');






module.exports.accountGet = function accountGet (req, res, next) {
  //site.account.forEach(function(func){
  //  func(req, res, next);
  //});
  //Auth.accountGet(req.swagger.params, res, next);
};

module.exports.loginGet = function loginGet (req, res, next) {
  //site.loginForm(req, res, next);
  //  console.log(res.statusCode);
  //Auth.loginGet(req.swagger.params, res, next);
};

module.exports.loginPost = function loginPost (req, res, next) {
  //site.login(req, res, next);
  //Auth.loginPost(req.swagger.params, res, next);
};

module.exports.logoutPost = function logoutPost (req, res, next) {
  //site.logout(req, res, next);
  //Auth.logoutPost(req.swagger.params, res, next);
};

module.exports.oauthApplicationPost = function oauthApplicationPost (req, res, next) {
  Auth.oauthApplicationPost(req.swagger.params, res, next);
};

module.exports.oauthAuthorizeGet = function oauthAuthorizeGet (req, res, next) {
  Auth.oauthAuthorizeGet(req.swagger.params, res, next);
};

module.exports.oauthAuthorizePost = function oauthAuthorizePost (req, res, next) {
  Auth.oauthAuthorizePost(req.swagger.params, res, next);
};

module.exports.oauthDialogeGet = function oauthDialogeGet (req, res, next) {
  //oauth2.authorization(req, res, next);
  //Auth.oauthDialogeGet(req.swagger.params, res, next);
};

module.exports.oauthDialogePost = function oauthDialogePost (req, res, next) {
  //oauth2.decision(req, res, next);
  //Auth.oauthDialogePost(req.swagger.params, res, next);
};

module.exports.oauthAccessTokenPost = function oauthAccessTokenPost (req, res, next){
  //oauth2.token.forEach(function(func){
  //    func(req, res, next);
  //});
    console.log(res.statusCode);
    console.log(JSON.stringify(res.headers));
    console.log(res.body);
    //next();
  //Auth.oauthAccessTokenPost(req.swagger.params, res, next);
};
