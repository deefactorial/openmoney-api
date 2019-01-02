const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');
const util = require('../../helpers/util.helper');
const async = require('async');

exports.stewardsList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * authroization (String)
     **/

    var examples = {};

    examples['application/json'] = "";

    stewardsList(req.user, function (err, result) {
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

const stewardsList = function(request, stewardsGetCallback){
    db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            stewardsGetCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.stewards.forEach(function(stewardID){
                parallelTasks[stewardID] = function(callback) {
                    db.openmoney_bucket.get(stewardID,function(err,steward){
                        if(err) {
                            callback(err, false);
                        } else {
                            //don't return the password hash;
                            delete(steward.value.password);
                            callback(null,steward.value);
                        }
                    })
                };
            });
            async.parallel(parallelTasks, function(err, results){
                if(err) {
                    stewardsGetCallback(err, false);
                } else {
                    var response = [];
                    for (var key in results) {
                        if (results.hasOwnProperty(key)) {
                            response.push(results[key]);
                        }
                    }
                    stewardsGetCallback(null, response);
                }
            });
        }
    });

    //var N1qlQuery = couchbase.N1qlQuery;
    ////var myBucket = stewards_bucket.openBucket();
    //stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE META().id like "' + getHash(request.publicKey) + 'stewards~%";';
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        stewardsGetCallback(err,false);
    //    } else {
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        stewardsGetCallback(null, response);
    //    }
    //});
};