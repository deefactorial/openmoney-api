'use strict';

var url = require('url');


var Journals = require('./JournalsService');


module.exports.syncJournalsGet = function syncJournalsGet (req, res, next) {
  Journals.syncJournalsGet(req.swagger.params, res, next);
};

module.exports.syncJournalsPost = function syncJournalsPost (req, res, next) {
  Journals.syncJournalsPost(req.swagger.params, res, next);
};

module.exports.syncJournalsIdGet = function syncJournalsIdGet (req, res, next) {
  Journals.syncJournalsIdGet(req.swagger.params, res, next);
};
