const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

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

    currenciesList(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            //examples['application/json'] = result;
            res.end(result);
        }
    });
}

const currenciesList = function(request, currenciesListCallback) {
    //TODO: filter by namespace
    db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function(err, steward_bucket) {
        if(err) {
            currenciesListCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.currencies.forEach(function(currencyID){
                parallelTasks[currencyID] = function(callback) {
                    db.openmoney_bucket.get(currencyID,function(err,currency){
                        if(err) {
                            callback(err, false);
                        } else {
                            callback(null,currency.value);
                        }
                    })
                };
            });
            async.parallel(parallelTasks, function(err, results){
                if(err) {
                    currenciesListCallback(err, false);
                } else {
                    var response = [];
                    for (var key in results) {
                        if (results.hasOwnProperty(key)) {
                            response.push(results[key]);
                        }
                    }
                    currenciesListCallback(null, response);
                }
            });
        }
    });
    //get a list of all currencies in stewards bucket
    //var N1qlQuery = couchbase.N1qlQuery;
    //db.stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + crypto.getHash(request.publicKey) + 'currencies~%";';
    //var query = N1qlQuery.fromString(queryString);
    //db.stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        currenciesListCallback(err,false);
    //    } else {
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        currenciesListCallback(null, response);
    //    }
    //});
};