'use strict';

var url = require('url');


var Accounts = require('./AccountsService');


module.exports.discoveryAccountsGet = function discoveryAccountsGet (req, res, next) {
  Accounts.discoveryAccountsGet(req.swagger.params, res, next);
};

module.exports.syncAccountsGet = function syncAccountsGet (req, res, next) {
  Accounts.syncAccountsGet(req.swagger.params, res, next);
};

module.exports.syncAccountsPost = function syncAccountsPost (req, res, next) {
  Accounts.syncAccountsPost(req.swagger.params, res, next);
};

module.exports.syncAccountsIdGet = function syncAccountsIdGet (req, res, next) {
  Accounts.syncAccountsIdGet(req.swagger.params, res, next);
};

module.exports.syncAccountsIdPut = function syncAccountsIdPut (req, res, next) {
  Accounts.syncAccountsIdPut(req.swagger.params, res, next);
};

module.exports.syncAccountsDelete = function syncAccountsDelete (req, res, next) {
  Accounts.syncAccountsDelete(req.swagger.params, res, next);
};
