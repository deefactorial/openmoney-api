const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');
const util = require('../../helpers/util.helper');

exports.stewardsGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * authorization (String)
     **/


    //stewardsGetByName
    var examples = {};

    examples['application/json'] = "";

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;
    request.user = req.user;

    stewardsGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            examples['application/json'] = result;
            res.end(result);
        }

    });

};


const stewardsGet = function(request, stewardsGetCallback){

    db.openmoney_bucket.get('stewards~' + request.stewardname.toLowerCase(), function(err, results) {
        if (err) {
            stewardsGetCallback(err,null);
        } else {
            //remove password and private key before returning result
            if(request.stewardname.toLowerCase() != request.user.stewardname.toLowerCase()){
              delete(results.value.password);
              delete(results.value.privateKey);
            }
            //add id to steward_bucket if it doesn't exist yet.
            db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function (err, steward_bucket) {
                if (err) {
                    stewardsGetCallback(err);
                } else {
                    if(steward_bucket.value.stewards.indexOf(results.value.id.toLowerCase()) !== -1){
                      stewardsGetCallback(null, results.value);
                    } else {
                      steward_bucket.value.stewards.push(results.value.id.toLowerCase());
                      //add stewards of currency to users stewards list
                      db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                          if (err) {
                              stewardsGetCallback(err);
                          } else {
                              stewardsGetCallback(null, results.value);
                          }
                      });
                    }
                }
            });
        }
    });
};