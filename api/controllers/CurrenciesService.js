'use strict';

var MasterController = require('../../MasterController');

exports.currenciesList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = "";

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.publicKey = req.user.publicKey;

    MasterController.currenciesList(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            //examples['application/json'] = result;
            res.end(result);
        }
    });
}
exports.currenciesPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     * currency (Currencies)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.publicKey = req.user.publicKey;

    MasterController.currenciesPost(request, function (err, result) {
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

exports.currenciesGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currency (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = "";


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.publicKey = req.user.publicKey;

    MasterController.currenciesGet(request, function (err, result) {
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
exports.currenciesPut = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currencyname (String)
     * authorization (String)
     * currencies (Currencies)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.currencies = req.swagger.params.currencies.value;
    request.publicKey = req.user.publicKey;

    MasterController.currenciesPut(request, function (err, result) {
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

exports.currenciesDelete = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currencyname (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.publicKey = req.user.publicKey;

    MasterController.currenciesDelete(request, function (err, result) {
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
