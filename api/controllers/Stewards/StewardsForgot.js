const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');
const mail = require('../../helpers/mail.helper');
const util = require('../../helpers/util.helper');
require('dotenv').config();

exports.stewardsForgotPost = function (args, res, next) {
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
    if (typeof args.forgot_request.value.stewardname != 'undefined') {
      request.stewardname = args.forgot_request.value.stewardname;
    }
    if (typeof args.forgot_request.value.email != 'undefined') {
      request.email = args.forgot_request.value.email;
    }

    stewardsForgotPost(request, function (err, result) {
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


const stewardsForgotPost = function(forgot_request, forgotPostCallback){
    var parallelTasks = {};

    if(typeof forgot_request.email != 'undefined'){
      //do a lookup on stewards with email address
      parallelTasks.email_global = function(callback) {
        db.openmoney_bucket.get("stewards_emailList~" + forgot_request.email.toLowerCase(), function(err, list){
          if(err){
            if(err.code == 13){
              callback({status:400,code:1098, message: "Steward not found with email: " + forgot_request.email.toLowerCase()})
            } else {
              callback(err);
            }
          } else {

            var parallelStewardTasks = {};
            //found the list of stewards
            list.value.stewards.forEach(function(steward){
              parallelStewardTasks[steward] = function(callback){
                db.openmoney_bucket.get("stewards~" + steward, function (err, res) {
                    if (err) {
                      // steward already exists
                      callback({status:400,code:1099, message: "Steward not found with stewardname: " + steward});
                    } else {
                      //found steward generate token and save
                      res.value.forgot_token = crypto.randomBytes(32).toString('base64');
                      db.openmoney_bucket.replace("stewards~" + steward, res.value, {cas: res.cas} , function(err, ok){
                        if(err){
                          if(err.code == 12){
                            //retry
                            parallelStewardTasks[steward](callback);
                          } else {
                            callback(err);
                          }
                        } else {
                          callback(null, res.value.forgot_token);
                        }
                      });
                    }
                });
              }
            })

            async.parallel(parallelStewardTasks, function(err, results){
              if(err){
                callback(err);
              } else {

                //token saved now send email.
                var to = forgot_request.email.toLowerCase();
                var subject = 'Forgot Password Request';
                var messageHTML = '<h3>A forgot password request has been made for your account. </h3>';

                for (var key in results) {
                  if (results.hasOwnProperty(key)) {
                    messageHTML += '<div>Your stewardname is ' + key + '; Reset Password Link: <a href="' + process.env.API_HOST + '/#stewards/' + key + '/reset/' + encodeURIComponent(results[key]) + '">' + process.env.API_HOST + '/#stewards/' + key + '/reset/' + encodeURIComponent(results[key]) + '</a>.</div>';
                  }
                }

                messageHTML += '<h5>If you have not made this request you can safely ignore this email.</h5>';
                mail.sendmail(to, null, null, subject, messageHTML, callback);
              }
            })
          }
        })
      }
    } else if (typeof forgot_request.stewardname != 'undefined'){
      //do a lookup on stewards with stewardname

      parallelTasks.steward_global = function(callback) {
          db.openmoney_bucket.get("stewards~" + forgot_request.stewardname.toLowerCase(), function (err, res) {
              if (err) {
                // steward already exists
                callback({status:400,code:1099, message: "Steward not found with stewardname: " + forgot_request.stewardname.toLowerCase()});
              } else {
                //found steward generate token and save
                res.value.forgot_token = crypto.randomBytes(32).toString('base64');
                db.openmoney_bucket.replace("stewards~" + forgot_request.stewardname.toLowerCase(), res.value, {cas: res.cas} , function(err, ok){
                  if(err){
                    if(err.code == 12){
                      //retry
                      parallelTasks.steward_global(callback);
                    } else {
                      callback(err);
                    }
                  } else {
                    //token saved now send email.
                    var to = res.value.email;
                    var subject = 'Forgot Password Request';
                    var messageHTML = '<h3>A forgot password request has been made for your account.</h3>';
                    messageHTML += 'Your stewardname is ' + res.value.stewardname + '; Reset Password Link: <a href="' + process.env.API_HOST + '/#stewards/' + res.value.stewardname + '/reset/' + encodeURIComponent(res.value.forgot_token) + '">' + process.env.API_HOST + '/#stewards/' + res.value.stewardname + '/reset/' + encodeURIComponent(res.value.forgot_token) + '</a>.';
                    messageHTML += '<h5>If you have not made this request you can safely ignore this email.</h5>';
                    mail.sendmail(to, null, null, subject, messageHTML, callback);
                  }
                });
              }
          });
      };
    }

    async.parallel(parallelTasks, function(err, results){
      if(err){
        forgotPostCallback(err);
      } else {
        //generate random token
        //write email
        //send email
        forgotPostCallback(null, {ok: true});
      }
    })
};