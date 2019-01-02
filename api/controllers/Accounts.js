'use strict';

const AccountsList = require('./Accounts/AccountsList');
const AccountsPost = require('./Accounts/AccountsPost');
const AccountsGet = require('./Accounts/AccountsGet');
const AccountsPut = require('./Accounts/AccountsPut');
const AccountsDelete = require('./Accounts/AccountsDelete');
const AccountsDiscovery = require('./Accounts/AccountsDiscovery');

module.exports.accountsDiscovery = function accountsDiscovery (req, res, next) {
  AccountsDiscovery.accountsDiscovery(req, res, next);
};

module.exports.accountsGet = function accountsGet (req, res, next) {
  AccountsGet.accountsGet(req, res, next);
};

module.exports.accountsPut = function accountsPut (req, res, next) {
  AccountsPut.accountsPut(req, res, next);
};

module.exports.accountsDelete = function accountsDelete (req, res, next) {
  AccountsDelete.accountsDelete(req, res, next);
};

module.exports.accountsList = function accountsList (req, res, next) {
  AccountsList.accountsList(req, res, next);
};

module.exports.accountsPost = function accountsPost (req, res, next) {
  AccountsPost.accountsPost(req, res, next);
};
