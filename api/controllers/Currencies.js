'use strict';

var url = require('url');


var Currencies = require('./CurrenciesService');


module.exports.currenciesList = function currenciesList (req, res, next) {
  Currencies.currenciesList(req, res, next);
};

module.exports.currenciesPost = function currenciesPost (req, res, next) {
  Currencies.currenciesPost(req, res, next);
};

module.exports.currenciesGet = function currenciesGet (req, res, next) {
  Currencies.currenciesGet(req, res, next);
};

module.exports.currenciesPut = function currenciesPut (req, res, next) {
  Currencies.currenciesPut(req, res, next);
};

module.exports.currenciesDelete = function currenciesDelete (req, res, next) {
  Currencies.currenciesDelete(req, res, next);
};
