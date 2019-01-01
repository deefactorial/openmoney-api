const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.accountsList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currency (String)
     * currencyNamespace (String)
     **/

    var examples = {};

    examples['application/json'] = "";


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.publicKey = req.user.publicKey;

    accountsList(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result);
        }
    });
};

const accountsList = function(request, accountsListCallback) {
    db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            accountsListCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.accounts.forEach(function(accountID){
                parallelTasks[accountID] = function(callback) {
                    db.openmoney_bucket.get(accountID,function(err,account){
                        if(err) {
                            callback(err, false);
                        } else {
                            callback(null,account.value);
                        }
                    })
                };
            });
            async.parallel(parallelTasks, function(err, results){
                if(err) {
                    accountsListCallback(err, false);
                } else {
                    var response = [];
                    for (var key in results) {
                        if (results.hasOwnProperty(key)) {
                            response.push(results[key]);
                        }
                    }
                    accountsListCallback(null, response);
                }
            });
        }
    });

    //var N1qlQuery = couchbase.N1qlQuery;
    //db.stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + crypto.getHash(request.publicKey) + 'accounts~%";';
    //var query = N1qlQuery.fromString(queryString);
    //db.stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        accountsListCallback(err,false);
    //    } else {
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        accountsListCallback(null, response);
    //    }
    //});
};