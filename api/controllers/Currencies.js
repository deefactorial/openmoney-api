'use strict';

const CurrenciesList = require('./Currencies/CurrenciesList');
const CurrenciesPost = require('./Currencies/CurrenciesPost');
const CurrenciesGet = require('./Currencies/CurrenciesGet');
const CurrenciesPut = require('./Currencies/CurrenciesPut');
const CurrenciesDelete = require('./Currencies/CurrenciesDelete');

module.exports.currenciesList = function currenciesList (req, res, next) {
  CurrenciesList.currenciesList(req, res, next);
};

module.exports.currenciesPost = function currenciesPost (req, res, next) {
  CurrenciesPost.currenciesPost(req, res, next);
};

module.exports.currenciesGet = function currenciesGet (req, res, next) {
  CurrenciesGet.currenciesGet(req, res, next);
};

module.exports.currenciesPut = function currenciesPut (req, res, next) {
  CurrenciesPut.currenciesPut(req, res, next);
};

module.exports.currenciesDelete = function currenciesDelete (req, res, next) {
  CurrenciesDelete.currenciesDelete(req, res, next);
};
