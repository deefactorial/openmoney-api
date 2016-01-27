'use strict';

var url = require('url');


var Journals = require('./JournalsService');


module.exports.journalsList = function journalsList (req, res, next) {
  Journals.journalsList(req, res, next);
};

module.exports.journalsPost = function journalsPost (req, res, next) {
  Journals.journalsPost(req, res, next);
};
