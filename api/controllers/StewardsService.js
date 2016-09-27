'use strict';

exports.stewardsList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * authroization (String)
     **/

    var examples = {};

    examples['application/json'] = "";

    //console.log(req.swagger.params);
    //console.log(req.user);

    var MasterController = require('../../MasterController');

    MasterController.stewardsList(req.user, function (err, result) {
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

};
exports.stewardsPost = function (args, res, next) {
    /**
     * parameters expected in the args:
     * registerRequest (Register_request)
     **/

    var examples = {};

    examples['application/json'] = {
        "spaces": "",
        "accounts": "",
        "stewards": "",
        "currencies": ""
    };


    //registerPost

    var MasterController = require('../../MasterController');

    var request = {};
    request.stewardname = args.register_request.value.stewardname;
    request.password = args.register_request.value.password;
    request.publicKey = args.register_request.value.publicKey;
    if (typeof args.register_request.value.email != 'undefined') {
        request.email = args.register_request.value.email;
    }
    if (typeof args.register_request.value.email_notifications != 'undefined') {
        request.email_notifications = args.register_request.value.email_notifications;
    }

    MasterController.stewardsPost(request, function (err, result) {
        if (err) {
            // throw error
            var examples = {};
            examples['application/json'] = err;
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            var examples = {};
            //examples['application/json'] = result;

            res.setHeader('Content-Type', 'application/json');
            //res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
            res.end(result);
        }
    });


};
exports.stewardsGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * authorization (String)
     **/


    //stewardsGetByName
    var examples = {};

    examples['application/json'] = "";

    //console.log(args);

    var MasterController = require('../../MasterController');

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;
    console.log('req.user', req.user);
    request.user = req.user;

    MasterController.stewardsGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            examples['application/json'] = result;
            res.end(result);
        }

    });

};
exports.stewardsPut = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    //console.log(args);

    var MasterController = require('../../MasterController');

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;
    request.steward = req.swagger.params.steward.value;

    console.info("Request: ", request);

    MasterController.stewardsPut(request, function (err, result) {
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
exports.stewardsDelete = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    //console.log(args);

    var MasterController = require('../../MasterController');

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;

    MasterController.stewardsDelete(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = MasterController.setStatus(err);
        } else {
            examples['application/json'] = result;
        }
        res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    });

};
