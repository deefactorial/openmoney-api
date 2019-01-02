const db = require('../../helpers/db.helper');
const scrypt = require('scrypt');
const util = require('../../helpers/util.helper');

exports.stewardsResetPost = function (args, res, next) {
    /**
     * parameters expected in the args:
     * registerRequest (Register_request)
     **/

    var examples = {};

    examples['application/json'] = {
        "ok": true
    };
    //forgotPost

    var request = {};

    request.stewardname = args.stewardname.value;
    request.forgot_token = args.reset_request.value.forgot_token;
    request.password = args.reset_request.value.password;

    stewardsResetPost(request, function (err, result) {
        if (err) {
            // throw error
            var examples = {};
            examples['application/json'] = err;
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            var examples = {};
            res.setHeader('Content-Type', 'application/json');
            res.end(result);
        }
    });
};

const stewardsResetPost = function(reset_request, resetPostCallback){
    var series = {};
    series.stewardsReset = function(callback){
      db.openmoney_bucket.get("stewards~" + reset_request.stewardname.toLowerCase(), function (err, steward) {
        if(err){
          callback(err);
        } else {
          if(steward.value.forgot_token != reset_request.forgot_token){
            callback({status:400,code:1097, message: "Forgot token did not match: " + reset_request.forgot_token});
          } else {
            steward.value.password = scrypt.kdfSync(reset_request.password, scryptParameters).toString('base64');
            db.openmoney_bucket.replace("stewards~" + reset_request.stewardname.toLowerCase(), steward.value, {cas: steward.cas}, function (err, ok) {
              if(err){
                if(err.code == 12){
                  //retry
                  series.stewardsReset(callback);
                } else {
                  callback(err);
                }
              } else {
                callback(null, {ok: true});
              }
            });
          }
        }
      });
    }

    async.series(series, function(err, results){
      resetPostCallback(err, results.stewardsReset);
    });
};