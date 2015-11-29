'use strict';

var url = require('url');


var Currencies = require('./CurrenciesService');


module.exports.discoveryCurrenciesGet = function discoveryCurrenciesGet (req, res, next) {
  Currencies.discoveryCurrenciesGet(req.swagger.params, res, next);
};

module.exports.syncCurrenciesGet = function syncCurrenciesGet (req, res, next) {
  Currencies.syncCurrenciesGet(req.swagger.params, res, next);
};

module.exports.syncCurrenciesPost = function syncCurrenciesPost (req, res, next) {
  Currencies.syncCurrenciesPost(req.swagger.params, res, next);
};

module.exports.syncCurrenciesIdGet = function syncCurrenciesIdGet (req, res, next) {
  Currencies.syncCurrenciesIdGet(req.swagger.params, res, next);
};

module.exports.syncCurrenciesIdPut = function syncCurrenciesIdPut (req, res, next) {
  Currencies.syncCurrenciesIdPut(req.swagger.params, res, next);
};

module.exports.syncCurrenciesIdDelete = function syncCurrenciesIdDelete (req, res, next) {
  Currencies.syncCurrenciesIdDelete(req.swagger.params, res, next);
};
