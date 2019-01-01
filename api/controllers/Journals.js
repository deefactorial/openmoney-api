'use strict';

const JournalsList = require('./Journals/JournalsList');
const JournalsPost = require('./Journals/JournalsPost');
// const JournalsGet = require('./Journals/JournalsGet');

module.exports.journalsList = function journalsList (req, res, next) {
  JournalsList.journalsList(req, res, next);
};

module.exports.journalsPost = function journalsPost (req, res, next) {
  JournalsPost.journalsPost(req, res, next);
};

// module.exports.journalsGet = function journalsGet (req, res, next) {
//   JournalsGet.journalsGet(req, res, next);
// };
