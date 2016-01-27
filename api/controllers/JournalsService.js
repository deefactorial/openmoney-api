'use strict';

var MasterController = require('../../MasterController');

exports.journalsList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * currency (string)
     * currency_namespace (string)
     * authorization (String)
     * offset (Integer)
     * range (Integer)
     **/

    var examples = {};

    examples['application/json'] = "";

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.offset = req.swagger.params.offset.value;
    request.range = req.swagger.params.range.value;
    request.publicKey = req.user.publicKey;

    MasterController.journalsList(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result)
        }

    });


};
exports.journalsPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * authorization (String)
     * journal (Journals)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.journal = req.swagger.params.journal.value;
    request.publicKey = req.user.publicKey;

    MasterController.journalsPost(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result)
        }

    });


}
exports.journalsGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * receiver (String)
     * timestamp (Integer)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = "";


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.created = req.swagger.params.created.value;
    request.publicKey = req.user.publicKey;

    MasterController.journalsGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result);
        }

    });


};
