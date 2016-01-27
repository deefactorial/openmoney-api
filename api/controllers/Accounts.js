'use strict';

var url = require('url');


var Accounts = require('./AccountsService');


module.exports.accountsDiscovery = function accountsDiscovery (req, res, next) {
  Accounts.accountsDiscovery(req, res, next);
};

module.exports.accountsGet = function accountsGet (req, res, next) {
  Accounts.accountsGet(req, res, next);
};

module.exports.accountsPut = function accountsPut (req, res, next) {
  Accounts.accountsPut(req, res, next);
};

module.exports.accountsDelete = function accountsDelete (req, res, next) {
  Accounts.accountsDelete(req, res, next);
};

module.exports.accountsList = function accountsList (req, res, next) {
  Accounts.accountsList(req, res, next);
};

module.exports.accountsPost = function accountsPost (req, res, next) {
  Accounts.accountsPost(req, res, next);
};
