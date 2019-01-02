const db = require('../../helpers/db.helper');
const scrypt = require('scrypt');
const util = require('../../helpers/util.helper');
const crypto = require('../../helpers/crypto.helper');
const async = require('async');

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

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;
    request.steward = req.swagger.params.steward.value;

    stewardsPut(request, function (err, result) {
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

//verify the integrity of the document
//update local document
//update global document
//search for other stewards who have this document and update them.
const stewardsPut = function(request, stewardsPutCallback){

    db.openmoney_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function(err, publicKeyDoc) {
        if (err) {
            stewardsPutCallback(err,false);
        } else {

          if(request.stewardname.toLowerCase() != publicKeyDoc.value.stewardname.toLowerCase() || request.stewardname.toLowerCase() != request.steward.stewardname) {
              //change stewardname
              var error = {};
              error.status = 503;
              error.code = 1016;
              error.message = "Cannot change your stewardname, register for a new account.";
              stewardsPutCallback(error,false);
              //search for all occurances of stewardname and replace them with the new name
          } else {

            //parallel tasks
            var parallelInsertTasks = {};

            parallelInsertTasks.openmoney_bucket = function(callback) {

              db.openmoney_bucket.get('stewards~' + request.stewardname.toLowerCase(), function(err, steward){
                if(err){
                  callback(err);
                } else {

                  //change in password
                  if (typeof request.steward.password != 'undefined' && scrypt.verifyKdfSync(new Buffer(steward.value.password, 'base64'), request.steward.password) !== true){

                     //encrypt the new password
                     steward.value.password = scrypt.kdfSync(request.steward.password, crypto.scryptParameters).toString('base64');

                    //  parallelInsertTasks.invalidate_session = function(callback) {
                    //    //check that public key exsits.
                    //    db.openmoney_bucket.get(getHash(request.publicKey), function(err,publicKeyDoc){
                    //        if(err) {
                    //            callback({status: 401, code: 1005, message: "That public key is not registered."}, false);
                    //        } else {
                    //            //remove session
                    //            delete(publicKeyDoc.value.access_token);
                    //            delete(publicKeyDoc.value.access_token_expiry);
                    //            db.openmoney_bucket.put(getHash(request.publicKey), publicKeyDoc.value, publicKeyDoc.cas, function(err, ok){
                    //              callback(err, ok);
                    //            })
                    //        }//else errs
                    //    });//get publicKey
                    //  };
                  }
                  if (request.steward.email != steward.value.email) {
                     // email update
                     steward.value.email = request.steward.email;
                  }
                  if (request.steward.email_notifications != steward.value.email_notifications){
                     steward.value.email_notifications = request.steward.email_notifications;
                  }
                  if (request.steward.theme != steward.value.theme){
                     steward.value.theme = request.steward.theme;
                  }

                  db.openmoney_bucket.replace('stewards~' + request.stewardname.toLowerCase(), steward.value, steward.cas, function(err, results) {
                     if (err) {
                       if(err.code == 12){
                         parallelInsertTasks.openmoney_bucket(callback);
                       } else {
                         callback(err);
                       }
                     } else {
                         var response = {};
                         response = results.value;
                         callback(null, response);
                     }
                  });
                 }
              });
            };

            async.parallel(parallelInsertTasks,
                function(err, results) {
                    if (err) {
                        stewardsPutCallback(err, false);
                    } else {
                        stewardsPutCallback(null, {id: "stewards~" + request.stewardname.toLowerCase(), ok: true});
                    }
                });
          }
        }
    });
};