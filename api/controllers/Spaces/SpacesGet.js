const util = require('../../helpers/util.helper');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.spacesGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     **/

    var examples = {};

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.publicKey = req.user.publicKey;

    spacesGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
        } else {
            examples['application/json'] = result;
        }
        res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    });
};

const spacesGet = function(request, spacesGetCallback) {
    db.openmoney_bucket.get('namespaces~' + request.namespace.toLowerCase(), function(err, results) {
        if (err) {
            spacesGetCallback(err,false);
        } else {
            // if (results.value.private) {
            //   var error = {};
            //   error.status = 403;
            //   error.code = 2009;
            //   error.message = 'Cannot add a private namespace.';
            //   spacesGetCallback(error);
            // } else {
              db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function (err, steward_bucket) {
                  if (err) {
                      spacesGetCallback(err);
                  } else {
                      if(steward_bucket.value.namespaces.indexOf(results.value.id.toLowerCase()) !== -1){
                        spacesGetCallback(null, results.value);
                      } else {
                        steward_bucket.value.namespaces.push(results.value.id.toLowerCase());
                        //add stewards of currency to users stewards list
                        results.value.stewards.forEach(function(steward){
                          if(steward_bucket.value.stewards.indexOf(steward) === -1){
                            steward_bucket.value.stewards.push(steward);
                          }
                        });
                        db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                            if (err) {
                                spacesGetCallback(err);
                            } else {
                                spacesGetCallback(null, results.value);
                            }
                        });
                      }
                  }
              });
            // }
        }
    });
};