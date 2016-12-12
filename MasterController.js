
var NodeRSA = require('node-rsa');
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster('couchbase://127.0.0.1');
var stewards_bucket = cluster.openBucket('openmoney_stewards');
var openmoney_bucket = cluster.openBucket('openmoney_global');
var async = require('async');
var crypto = require('crypto');
var scrypt = require("scrypt");
var scryptParameters = scrypt.paramsSync(0.5);
var nodemailer = require('nodemailer');

require('dotenv').load();

var smtpConfig = process.env.SMTP_CONFIG;

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(smtpConfig);

function sendmail(to, cc, bcc, subject, messageHTML, callback){
  var messageText = messageHTML.replace(/<\/?[^>]+(>|$)/g, "");
  console.log('send email to', to, cc, bcc, subject, messageText);

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"Openmoney Network" <openmoney.network@gmail.com>', // sender address
      subject: subject, // Subject line
      text: messageText, // plaintext body
      html: messageHTML // html body
  };
  if(to != null){
    mailOptions.to = to;
  }
  if(cc != null){
    mailOptions.cc = cc;
  }
  if(bcc != null){
    mailOptions.bcc = bcc;
  }

  if(typeof smtpConfig == 'undefined' || smtpConfig == ''){
    console.log('smtpConfig is undefined, ignoring sending emails...');
  } else {

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        callback(error, info);
        // if(error){
        //     return console.log(error);
        // }
        // console.log('Message sent: ' + info.response);
    });
  }
}

function getRandomstring(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function getSymetricKey(key){
    //console.log(key.getMaxMessageSize());
    //var symetric_key = getRandomstring(key.getMaxMessageSize());
    //console.log(symetric_key);
    //console.log(symetric_key.length);
    var randomRange = getRandomArbitrary(key.getMaxMessageSize()/2, key.getMaxMessageSize()-1);
    return getRandomstring(randomRange);
    //return getRandomstring();
}

function encryptSymetricKey(key, symetricKey) {
    //var encryptedSymetricKeyData = key.encrypt(symetric_key, 'base64', 'utf8');
    //console.log(encryptedSymetricKeyData);
    return key.encrypt(symetricKey, 'base64', 'utf8');
}

function getHash(value) {
    return crypto.createHash('sha256').update(value).digest('base64');
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var crypto = require('crypto');
//    algorithm = 'aes-256-gcm',
//    password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY',
//// do not use a global iv for production,
//// generate a new one for each encryption
//    iv = '60iP0h6vJoEa'

function encrypt(text, algorithm, password, iv) {
    var cipher = crypto.createCipheriv(algorithm, password, iv);
    var encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag
    };
}

function decrypt(encrypted, algorithm, password, iv) {
    var decipher = crypto.createDecipheriv(algorithm, password, iv);
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
}

//Compare arrays: http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


function union_arrays (x, y) {
    var obj = {};
    for (var i = x.length-1; i >= 0; -- i)
        obj[x[i]] = x[i];
    for (var i = y.length-1; i >= 0; -- i)
        obj[y[i]] = y[i];
    var res = []
    for (var k in obj) {
        if (obj.hasOwnProperty(k))  // <-- optional
            res.push(obj[k]);
    }
    return res;
}

exports.setStatus = function(err){
    var result = 400;
    if(err.code < 1000 && err.code != 13) {
        console.log("Server Error: " + JSON.stringify(err));
        result = 500;
    } else if(err.code == 13){
        result = 404;
    } else if(typeof err.status != 'undefined') {
        result = err.status;
    }
    return result;
};

exports.authorize = function(stewardname, authorizeHeader, authorizeCallback) {
    if(authorizeHeader.match(/Basic /i)){
        authorizeHeader = authorizeHeader.replace(/Basic /i,'');
        var basic = new Buffer(authorizeHeader, 'base64').toString('ascii');
        basic = basic.split(":");
        var stewardnamebasic = basic[0];
        var password = basic[1];
        openmoney_bucket.get("stewards~" + stewardnamebasic.toLowerCase(), function(err, doc){
            if(err){
                authorizeCallback(err, false);
            } else {
                //check if resource path matches credentials
                if(stewardname !== null && doc.value.stewardname.toLowerCase() !== stewardname.toLowerCase()){
                    var error = {};
                    error.status = 401;
                    error.code = 1002;
                    error.message = "Stewardname did not match.";
                    authorizeCallback(error, false);
                } else {
                    //password is verified in passport
                    authorizeCallback(null, doc.value.publicKey);
                }
            }
        });
    } else {
        if(authorizeHeader.match(/Bearer /i)){
            authorizeHeader = authorizeHeader.replace(/Bearer /i,'');
        }
        openmoney_bucket.get("session~" + authorizeHeader, function (err, doc) {
            if (err) {
                authorizeCallback(err, false);
            } else {
                if (stewardname !== null && doc.value.stewardname != stewardname) {
                    var error = {};
                    error.status = 401;
                    error.code = 1002;
                    error.message = "Stewardname did not match.";
                    authorizeCallback(error, false);
                } else if (doc.value.expires < new Date().getTime()) {
                    var error = {};
                    error.status = 401;
                    error.code = 1003;
                    error.message = "Access token has expired.";
                    authorizeCallback(error, false);
                } else {
                    authorizeCallback(null, doc.value.publicKey);
                }
            }
        });
    }
};

exports.isStewardOfPublicKey = function(stewardname, publicKey, cb) {
    openmoney_bucket.get(getHash(publicKey), function(err, doc){
        if(err) {
            cb(err, false);
        } else {
            cb(null, doc.value.stewardname == stewardname);
        }
    });
};

exports.accessTokenPost = function(request, accessTokenPostCallback) {
    console.log(" in accessTokenPost: (request: ");
    console.log(request);
    console.log(")");

    if(request.grant_type.toLowerCase() === 'password'){
        //password has been verified earlier
        //verify client credentials

    }

    openmoney_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,publicKeyDoc){
        if(err) {
            accessTokenPostCallback(err, false);
        } else {
            console.log(publicKeyDoc);

            var session = {};
            session.id = "session~" + getHash(request.proof_token);
            session.token = request.proof_token;
            session.expires = new Date().getTime() + 3600;
            session.publicKey = request.publicKey;

            openmoney_bucket.upsert(session.id, session, function(err, res){
                if(err) {
                    accessTokenPostCallback(err, false);
                } else {
                    var response = {};
                    response.token = getHash(request.proof_token);
                    response.expires = publicKeyDoc.value.expires;
                    response.scopes = ['read:stewards', 'write:stewards', 'read:accounts', 'write:accounts', 'read:currencies',
                        'write:currencies', 'manage:currencies', 'read:spaces', 'write:spaces', 'manage:spaces', 'read:journals', 'write:journals'];
                    response.token_type = 'password';
                    accessTokenPostCallback(null, response);
                }
            });

        }
    });
};

exports.authorizePost = function(request, authorizePostCallback) {

    //check that public key exsits.
    openmoney_bucket.get(getHash(request.publicKey), function(err,publicKeyDoc){
        if(err) {
            authorizePostCallback({status: 401, code: 1005, message: "That public key is not registered."}, false);
        } else {
            //encrypt random string with public key
            var key = new NodeRSA();

            key.importKey(request.publicKey, 'pkcs8-public');

            if (!key.isPublic()) {

                var err = {
                    "status": 401,
                    "code": 1004,
                    "message": 'Failed public key evaluation!'
                };
                authorizePostCallback(err, false);

            } else {

                var isSessionValid = false;

                if (typeof publicKeyDoc != 'undefined' && typeof publicKeyDoc.value != 'undefined' && typeof publicKeyDoc.value.access_token_expiry != 'undefined' && typeof publicKeyDoc.value.access_token != 'undefined') {
                    if (publicKeyDoc.value.access_token_expiry > new Date().getTime()) {
                        //if access token still has time left re-issue the same token
                        isSessionValid = true;
                    }
                    if (publicKeyDoc.value.access_token_expiry <= new Date().getTime()) {
                        // session has expired
                        // delete session
                    }
                }

                if (isSessionValid) {
                    //return current session
                    var encryptedSymetricKey = encryptSymetricKey(key, publicKeyDoc.value.access_token);
                    var response = {};
                    response.challenge_token = encryptedSymetricKey;
                    response.cors_token = request.cors_token;
                    //response.session = publicKeyDoc.value.access_token;

                    authorizePostCallback(null, response);
                } else {
                    var symetrickey = getSymetricKey(key);
                    var encryptedSymetricKey = encryptSymetricKey(key, symetrickey);

                    publicKeyDoc.value.access_token = symetrickey;
                    publicKeyDoc.value.access_token_expiry = new Date().getTime() + ( 15 * 60 * 1000 ); //fifteen minutes

                    openmoney_bucket.upsert(getHash(request.publicKey), publicKeyDoc.value, function (err, result) {
                        if (err) {
                            authorizePostCallback(err, false);
                        } else {
                            var response = {};
                            response.challenge_token = encryptedSymetricKey;
                            response.cors_token = request.cors_token;

                            var session = {};
                            session.id = "session~" + getHash(publicKeyDoc.value.access_token);
                            session.access_token = publicKeyDoc.value.access_token;
                            session.access_token_expiry = publicKeyDoc.value.access_token_expiry;
                            session.stewardname = publicKeyDoc.value.stewardname;
                            session.publicKey = request.publicKey;

                            openmoney_bucket.upsert(session.id, session, function(err, res){
                                if(err) {
                                    authorizePostCallback(err, false);
                                } else {
                                    authorizePostCallback(null, response);
                                }
                            });
                        }
                    });
                }
            }
        }
    });
};

exports.stewardsForgotPost = function(forgot_request, forgotPostCallback){
    console.log("stewardsForgotPost", forgot_request);

    var parallelTasks = {};

    if(typeof forgot_request.email != 'undefined'){
      //do a lookup on stewards with email address
      parallelTasks.email_global = function(callback) {
        openmoney_bucket.get("stewards_emailList~" + forgot_request.email.toLowerCase(), function(err, list){
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
                openmoney_bucket.get("stewards~" + steward, function (err, res) {
                    if (err) {
                      // steward already exists
                      callback({status:400,code:1099, message: "Steward not found with stewardname: " + steward});
                    } else {
                      //found steward generate token and save
                      res.value.forgot_token = crypto.randomBytes(32).toString('base64');
                      openmoney_bucket.replace("stewards~" + steward, res.value, {cas: res.cas} , function(err, ok){
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
                    console.log(key + " -> " + results[key]);
                    messageHTML += '<div>Your stewardname is ' + key + '; Reset Password Link: <a href="https://openmoney.network/#stewards/' + key + '/reset/' + encodeURIComponent(results[key]) + '">https://openmoney.network/#stewards/' + key + '/reset/' + encodeURIComponent(results[key]) + '</a>.</div>';
                  }
                }

                messageHTML += '<h5>If you have not made this request you can safely ignore this email.</h5>';
                sendmail(to, null, null, subject, messageHTML, callback);
              }
            })
          }
        })
      }
    } else if (typeof forgot_request.stewardname != 'undefined'){
      //do a lookup on stewards with stewardname

      parallelTasks.steward_global = function(callback) {
          openmoney_bucket.get("stewards~" + forgot_request.stewardname.toLowerCase(), function (err, res) {
              if (err) {
                // steward already exists
                callback({status:400,code:1099, message: "Steward not found with stewardname: " + forgot_request.stewardname.toLowerCase()});
              } else {
                //found steward generate token and save
                res.value.forgot_token = crypto.randomBytes(32).toString('base64');
                openmoney_bucket.replace("stewards~" + forgot_request.stewardname.toLowerCase(), res.value, {cas: res.cas} , function(err, ok){
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
                    messageHTML += 'Your stewardname is ' + res.value.stewardname + '; Reset Password Link: <a href="https://openmoney.network/#stewards/' + res.value.stewardname + '/reset/' + encodeURIComponent(res.value.forgot_token) + '">https://openmoney.network/#stewards/' + res.value.stewardname + '/reset/' + encodeURIComponent(res.value.forgot_token) + '</a>.';
                    messageHTML += '<h5>If you have not made this request you can safely ignore this email.</h5>';
                    sendmail(to, null, null, subject, messageHTML, callback);
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
        console.log('parallelTask results:',results);
        //generate random token
        //write email
        //send email
        forgotPostCallback(null, {ok: true});
      }
    })
};

exports.stewardsResetPost = function(reset_request, resetPostCallback){
    console.log("stewardsResetPost", reset_request);


    var series = {};
    series.stewardsReset = function(callback){
      openmoney_bucket.get("stewards~" + reset_request.stewardname.toLowerCase(), function (err, steward) {
        if(err){
          callback(err);
        } else {
          if(steward.value.forgot_token != reset_request.forgot_token){
            callback({status:400,code:1097, message: "Forgot token did not match: " + reset_request.forgot_token});
          } else {
            steward.value.password = scrypt.kdfSync(reset_request.password, scryptParameters).toString('base64');
            openmoney_bucket.replace("stewards~" + reset_request.stewardname.toLowerCase(), steward.value, {cas: steward.cas}, function (err, ok) {
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



exports.stewardsPost = function(steward_request, registerPostCallback){
    console.log("stewardsPost");

    var stewards = [];
    var spaces = [];
    var currencies = [];
    var accounts = [];



    var steward = {};
    steward.password = scrypt.kdfSync(steward_request.password, scryptParameters).toString('base64');
    steward.publicKey = steward_request.publicKey;
    steward.stewardname = steward_request.stewardname.toLowerCase();
    if(typeof steward_request.email != 'undefined')
    steward.email = steward_request.email;
    if(typeof steward_request.email_notifications != 'undefined')
    steward.email_notifications = steward_request.email_notifications;

    if(steward.publicKey == null){
        //generate one for the steward
        var key = new NodeRSA({b: 1024});
        steward.publicKey = key.exportKey('pkcs8-public-pem');
        steward.privateKey = key.exportKey('pkcs8-private-pem');
    }

    steward.id = 'stewards~' + steward.stewardname.toLowerCase();
    stewards.push(steward);

    var steward_bucket = {};
    steward_bucket.stewards = [ steward.id ];
    steward_bucket.namespaces = [];
    steward_bucket.currencies = [];
    steward_bucket.accounts = [];
    steward_bucket.type = "steward_bucket";
    steward_bucket.id = steward_bucket.type + "~" + getHash(steward.publicKey);

    // stewards view of default accounts

    var deefactorial = {};
    // deefactorial.stewardname = 'deefactorial';
    // //deefactorial.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuoreAzUFyumy3TxoohvkSrukPSX994GUxMg0u1K03m+kI+Uscl+aCJ9y9gtEIxRfZ9fGcDceAZDBA0neZS0aUHu7tH9oI9NzJPhl9A9ORMovdGOrFLqDaSKY6FvDxxQAWT0CbAGfUDGB20Y1793j4bqd1iQHSdo+oVM8bv54THCwFIpjcNW0llbO910t1FE32CWt2Y1kGheMrt0w8du3gFUNIykGoCau2E4q7iDbnID2gl7jNHQQbZbHJX42ywTgFd6a9RuH6c/0vUO2M4u6qXaabOML67uMIpOo77YYEe7VzhL1rqavAvLO4weV0FZ76E8GWMsu9jeKLG4f88OVrFd3QgF55FU8dgbypboeI/e048sNeuEVDRYg4tZUjbzONSSPUk4ZNKbYnhcgYoPWs/DBYFXSssYnQzl5dWgAc8yuYREhqy0Uhr4EzuOBjf/j161UPRrz622jUztN95+idIXwc+sbP76tW4w+8Jm3Z1By+I+2JCRPhcdJYywsH41nDMekKs8xV85mpIkLABompZ5llpKeJkyZboMgF3ynziCMZt7T1zk5dROeHE7GtyhM2Q3BJD+VGteRV1WUmBC1Y9CWTR7/qn4lk6Fa4QNymdx8IfM1uEINFLhAHr+AALwotwHwISjnN2mx8X+mjxXX+w85u3uO1clzPzBLGzrZ/IcCAwEAAQ==-----END PUBLIC KEY-----';
    // deefactorial.publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCPZW00qqHACVN6sLFiv1nYoACG\np1aFBsfMehWCa8YJVnQwgGjI4vAgaocKz68RyDpd43A8NyzrPBOm3DedrQUxnVl/\nTdrFs9dsNCeaiJISPU7u2EdIxpg0IpIU/YPDJtPxGDbJR5zF1EPb40jVhuGM/5/b\nXLn9tsx7zFHWL4d7wQIDAQAB\n-----END PUBLIC KEY-----';
    // deefactorial.email = 'deefactorial@gmail.com';
    // deefactorial.email_notifications = true;
    // deefactorial.type = "stewards";
    deefactorial.id = 'stewards~deefactorial';
    steward_bucket.stewards.push(deefactorial.id);
    //stewards.push(deefactorial);

    var michael = {};
    // michael.stewardname = 'mwl';
    // //michael.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5JW4L83dOXtWhlQ64F3DAcdckwabV+kYDUIYVSSPxFcPPHAVTDOBwk0NANiEfZQs/uFZgQMfjtz3QGy9LIOp7hVQYhCXtNnL+40iCBFo2uVUrcr5oQpIzQmEuNO1t5d46kRKTMDhg5nWuoPgF5EkLhaUnw0jRuKbM7b4enEijyOFJm9aYWYl/0Czp15bdwhm/q9Et3gvR5ag30GLViTi5dJakV+LI1rTR9SP9Z2wkViy1t3nO7De5dUsIOra67XClUtqCt9x4R8+yEllFMalb02fzgXpSL01lMa6naIIg3LjcP+pmGY1pZcbZj8NBr+Mg9PKOjz4YfHSB66Q73zCvHt+uoeEE0p8+v67pWleZlnckPVSRk0jRY095wNVw4mgso08XtJ4pO/TcmfsI/SgH6LjRPpakyfHVrwm2uBjK+u2HtKSq53UcuxoENP5PJodIt+6a+GqvdHuqE37np77+51lbFC7A4oJT13py/cDng3X0l+glLNJaxm67pVa4CgR9n7aPXaCcHLN/lvHkzctUa5k30uuAoZB2TiWcq1gWyGJYl1FKcxNxniYwpu9WJ05VwwVHoW1FvKVz/hpKEN4febifqOR/+JhpxkyrsDfmaWabXgMZygAlAGW9hCxfi5OagrslMNyuF8OTyrg6VQtNKO6QYcflReHRPDzUz/54UsCAwEAAQ==-----END PUBLIC KEY-----';
    // michael.publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCm6zZlBo5P4pgtxYAFpI7BrwT9\nSWncAmQs6Eiuzm/Db6hEdjat+lThTIW8FRdNabivnHbb5hOYKEXQfAIeWM00dJtk\nZYSEBtyzJ/ygjEjh99fEixlvOmX/ttgYoM9j9sew3BRJ/8OoCra7zPoHmC1UtIjf\n0Y3p03sucWhUv+fCOQIDAQAB\n-----END PUBLIC KEY-----';
    // michael.email = 'michael.linton@gmail.com';
    // michael.email_notifications = true;
    // michael.type = "stewards";
    michael.id = 'stewards~mwl';
    steward_bucket.stewards.push(michael.id);
    //stewards.push(michael);

    var les = {};
    // les.stewardname = 'les';
    // //les.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAss/XIJKfafrpWizysIaxz8yp/92mnu+bP24f+OOXcZfo6LVHFUNnWABCWvui5c4/I68SvKDcjr/WCGlfRVmiRCdoGAt4JT3biaBJUkO3ng4JYi6l17PKnMUDw/d525gnU/uFQJ1HlzovT7GNJ1pUS9vy9attgNgkrGce5n9W03wSU5CAwWD5iZnMKK7TzBrwWO1AEh272vvyomgNO9sKU+g86B0Zj0HuP4feTJQ1RPXNZd5LYFjrtrfqi1lw+/fLPWhB4TfV7nFE/tSvrigA5f8pxPzeunUgh2JZlubtC/3fwOMI2WXNtvkUaGE/bbRGCEFwxdk4U20MQ2G4goEvMsMZZNmD3mygHmXRPTSOQvbT6Iamoxq1qhzzWBXCO7NoJyARw/RpVy+wjXIWXtm1BtrEF2j9JsbDorFQy1jkDijVdAGB6DXi0YhK5mjggIp77RClN1ulpaG8Tdso9Xp3xh490AnoQDSvIsEIG9WuYEhWZEbTGSkESf76ll7qff1d3Hy1sl+9iCPIfCcNu58jGclLw8xjX25Z8SJMJBlAXPPEEj5sBzgpQ+Q6jaVTfkxnopkq6CsSsSzcdhLv2oAijLdjmevDiYy5KsFLSFai3GkkCZk9K3PCdgPv3uf8N2vjkWp+gTmL+PUXM9uZItOPhpZVPEtZjqgzX9166qnybqkCAwEAAQ==-----END PUBLIC KEY-----';
    // les.publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCDn45uqLb6NUSOiZGffl1H5ToG\ncNJpHjDkJLSV/ra+cHjTZdZHBPAAlF8d47ePPtb00KhXlOsZfdL0TL3hPElDZcJi\nE5QUxLHA6MFSj9jAcGvx42L+GNsm674J8krqK2P/Rl+Z4e5r53IAiCENWrKYT+6w\nS6yk3Cn9Cxl9hSS25QIDAQAB\n-----END PUBLIC KEY-----';
    // les.email = 'les.moore@commonresource.net';
    // les.email_notificaitons = true;
    // les.type = "stewards";
    les.id = 'stewards~les';


    var space_root = "cc";
    var stewards_space = "cc";
    var space_currency = "cc";
    console.info(steward);
    if(steward.stewardname.indexOf('.') !== -1){
        console.info('has dot in stewardname');

        //this is buggy
        //var numberOfSpaces = (steward.stewardname.match(new RegExp(".", "g")) || []).length;
        var spaces_array = steward.stewardname.toLowerCase().split('.');
        var numberOfSpaces = spaces_array.length;

        space_root = steward.stewardname.toLowerCase().substring(steward.stewardname.toLowerCase().indexOf('.') + 1, steward.stewardname.toLowerCase().length);
        console.info('namespaces array', spaces_array);
        console.info('numberOfSpaces', numberOfSpaces);
        console.info('space root:' + space_root);

        // all root spaces are hard coded to start with.
        if(space_root == 'cc'){
            // these are the pre-programmed root spaces that are allowed.

            //iterate through the spaces starting with the root.
            for(var i = spaces_array.length; i > 0; i--) {

                var space_parent = ''; //steward.stewardname.toLowerCase().substring(indexOf(steward.stewardname, '.'), steward.stewardname.length);
                //build the parent space
                for (var j = i; j < spaces_array.length; j++){
                    space_parent += '.' + spaces_array[j]
                }
                //remove leading dot.
                space_parent = space_parent.substring(1,space_parent.length);

                //update the stewards space variable for their main cc account.
                stewards_space = space_parent;

                if (space_parent == 'cc') {
                    //this case is handled below
                }

                if (space_parent == 'cv.ca') {
                  steward_bucket.namespaces.push('namespaces~ca');
                  steward_bucket.namespaces.push('namespaces~cv.ca');
                }

                if (space_parent == 'nan.ca') {
                  steward_bucket.namespaces.push('namespaces~ca');
                  steward_bucket.namespaces.push('namespaces~nan.ca');
                }

                if (space_parent == 'ca') {
                  steward_bucket.namespaces.push('namespaces~ca');
                }

                if (space_parent == 'uk') {
                  steward_bucket.namespaces.push('namespaces~uk');
                  //push les on the knowns stewards on this stewards bucket
                  steward_bucket.stewards.push(les.id);
                }

                var steward_space = {};
                //get middle part of steward name .myname.thispart.cc
                steward_space.namespace = steward.stewardname.toLowerCase();
                steward_space.parent_namespace = space_parent.toLowerCase();
                steward_space.created = new Date().getTime();
                steward_space.stewards = [ steward.id ];
                steward_space.type = "namespaces";
                steward_space.id = 'namespaces~' + steward_space.namespace;
                steward_space.private = true;
                steward_space.disabled = false;
                spaces.push( steward_space );
                steward_bucket.namespaces.push(steward_space.id);

                space_currency = steward_space.parent_namespace;
                //check if currency exists with the same space name
                //if exists add currency and account
                //this is a blocking operation because it involves a lookup, so this has to be done before submit.
            }//for spaces
        } else {
          //TODO: through error
          console.error('should not get here. trying to register for a non registerable space root:' + space_root);
          return registerPostCallback({status:400,code:1050, message: 'trying to register for a non registerable namespace root:' + space_root});
        }
    } else { // else dot in stewardname
      console.info('does not have dot in stewardname');

      var steward_space = {};
      steward_space.namespace = steward.stewardname.toLowerCase() + '.cc';
      steward_space.parent_namespace = 'cc';
      steward_space.created = new Date().getTime();
      steward_space.stewards = [ steward.id ];
      steward_space.type = "namespaces";
      steward_space.id = 'namespaces~' + steward_space.namespace;
      steward_space.private = true;
      steward_space.disabled = false;
      spaces.push( steward_space );
      steward_bucket.namespaces.push(steward_space.id);
    }

    //The root space cc stands for community currency or creative commons. It is the root namespace each steward gets in an account.
    var space = {};
    // space.namespace = "cc";
    // space.parent_namespace = ""; //references the parent space building a tree graph from the root.
    // space.created = new Date().getTime(); //static
    // space.stewards = [ deefactorial.id, michael.id ];
    // space.type = "namespaces";
    space.id = 'namespaces~cc';
    //spaces.push( space );
    steward_bucket.namespaces.push(space.id);

    //This is the community currency all stewards get an account in this currency when they use the register api.
    var currency = {};
    currency.currency = "cc";
    currency.currency_namespace = ""; //currencies have thier own spaces as well cc is the root.
    currency.created = new Date().getTime(); //static
    currency.stewards = [ deefactorial.id , michael.id ];
    currency.type = "currencies";
    currency.id = 'currencies~' + currency.currency;
    currencies.push( currency );
    steward_bucket.currencies.push(currency.id);

    //accounts don't store journal entries, journal entries reference accounts.
    var account = {};
    if(steward.stewardname.toLowerCase().indexOf('.') !== -1){
      account.account = steward.stewardname.toLowerCase().substring(0, steward.stewardname.toLowerCase().indexOf('.'));
    } else {
      account.account = steward.stewardname.toLowerCase();
    }
    account.account_namespace = stewards_space;
    account.currency = "cc";
    account.currency_namespace = "";
    account.stewards = [ steward.id ];
    account.type = "accounts";
    account.id = 'accounts~' + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase() + '~' + account.currency.toLowerCase();
    accounts.push(account);
    steward_bucket.accounts.push(account.id);

    //access doc to get listing of accounts under that account name and space.
    var accounts_list = {};
    accounts_list.id = 'accountsList~' + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase();
    accounts_list.type = "accountsList";
    accounts_list.list = [ account.id ];

    var key = new NodeRSA();

    //key.importKey(steward.publicKey, 'pkcs8-public');
    key.importKey(steward.publicKey);

    if(!key.isPublic()) {

        var err = {
            "status": 401,
            "code": 1004,
            "message": 'Failed public key evaluation!'
        };
        registerPostCallback(err, false);

    } else {

        //Check all assumptions with models:
        var parallelTasks = {};
        parallelTasks.steward_global = function(callback) {
            openmoney_bucket.get("stewards~" + steward.stewardname.toLowerCase(), function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // steward already exists
                    callback({status:400,code:1010, message: "Steward exists with stewardname: " + steward.stewardname.toLowerCase()}, true);
                }
            });
        };
        parallelTasks.steward_local = function(callback) {
            stewards_bucket.get("steward_bucket~" + getHash(steward.publicKey), function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // steward already exists
                    callback({status:400,code:1011, message: "You already submitted your registration."}, true);
                }
            });
        };
        parallelTasks.stewards_publicKey = function(callback) {
            openmoney_bucket.get("steward_bucket~" + getHash(steward.publicKey), function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // Steward already exists
                    callback({status:400, code:1012, message: "Public key exists: " + steward.publicKey}, true);
                }
            });
        };


        spaces.forEach(function(space){
            if(space.id != 'namespaces~cc' && space.id != 'namespaces~uk' && space.id != 'namespaces~ca') {
                parallelTasks[space.id] = function (callback) {
                    openmoney_bucket.get(space.id, function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // space already exists through error
                            callback({status: 400, code: 1013, message: "A space exists with the name: " + space.id}, true);
                        }
                    });
                };
            }
        });
        currencies.forEach(function(currency){
            if(currency.id != 'currencies~cc') {
                parallelTasks[currency.currency] = function (callback) {
                    openmoney_bucket.get(currency.id, function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // doc already exists through error
                            callback({
                                status: 400,
                                code: 1014,
                                message: "A currency exists with the name: " + currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase()
                            }, true);
                        }
                    });
                };
            }
        });

        if (space_currency != 'cc') {
            parallelTasks[space_currency] = function (callback) {
                openmoney_bucket.get("currencies~" + space_currency.toLowerCase(), function (err, res) {
                    if (err) {
                        // doc doesn't exist insert it.
                        callback(null, false);
                    } else {

                        //no error just add the result the stewards list of known currencies and add an account in that currency.
                        var currency = res.value;
                        currencies.push(currency);
                        steward_bucket.currencies.push(currency.id);

                        var account = {};
                        account.account = steward.stewardname.toLowerCase();
                        account.account_namespace = stewards_space;
                        account.currency = space_currency.toLowerCase().substring(0,indexOf(space_currency,"."));
                        account.currency_namespace = space_currency.toLowerCase().substring(indexOf(space_currency,"."),space_currency.length);
                        account.stewards = [ steward.id ];
                        account.type = "accounts";
                        account.id = 'accounts~' + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase() + '~' + account.currency.toLowerCase() + '.' + account.currency_namespace.toLowerCase();
                        accounts.push(account);
                        steward_bucket.accounts.push(account.id);

                        callback(null, false);
                    }
                });
            };
        }
        accounts.forEach(function(account){
            if(account.stewards[0] == steward.id) {
                var account_currency = account.currency_namespace == '' ? account.currency.toLowerCase() : account.currency.toLowerCase() + "." + account.currency_namespace.toLowerCase();
                parallelTasks[account.account] = function (callback) {
                    openmoney_bucket.get("accounts~" + account.account.toLowerCase() + "." + account.account_namespace.toLowerCase() + "~" + account_currency , function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // doc already exists through error
                            callback({status:400, code:1015, message: "Account exists with the name: " + account.account.toLowerCase() + "." + account.account_namespace.toLowerCase() + "~" + account_currency}, true);
                        }
                    });
                };
            }
        });

        async.parallel(parallelTasks,
            function(err, results) {
                // results is now equals to: {steward: false, spacename: false}
                if(err) {

                    registerPostCallback(err);

                } else {
                    //we are a go to insert the records.
                    var insertTasks = {};

                    insertTasks.stewards_emailList = function(callback){
                        openmoney_bucket.get("stewards_emailList~" + steward.email.toLowerCase(), function(err, emailList){
                          if(err){
                            if(err.code == 13){
                              //not found create the doc.
                              var emailList = {};
                              emailList.type = 'stewards_emailList';
                              emailList.email = steward.email.toLowerCase();
                              emailList.stewards = [ steward.stewardname.toLowerCase() ];
                              emailList.id = emailList.type + '~' + emailList.email.toLowerCase();
                              openmoney_bucket.insert(emailList.id, emailList, function(err, ok){
                                callback(err, ok);
                              })
                            } else {
                              callback(err);
                            }
                          } else {
                            //found update the doc.
                            emailList.value.stewards.push(steward.stewardname.toLowerCase());
                            openmoney_bucket.replace(emailList.value.id, emailList.value, {cas: emailList.cas}, function(err, ok){
                              if(err){
                                if(err.code == 12){
                                  //retry
                                  insertTasks.stewards_emailList(callback);
                                } else {
                                  callback(err);
                                }
                              } else {
                                callback(null, ok);
                              }
                            })
                          }
                        })
                    };

                    var value_references = {};
                    value_references.type = "value_reference";
                    value_references.documents = ["steward_bucket~" + getHash(steward.publicKey)];

                    //update stewards
                    steward_bucket.stewards.forEach(function(stewardID){
                        insertTasks[stewardID + "val_ref"] = function(callback) {
                            stewards_bucket.get(stewardID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = stewardID;
                                        stewards_bucket.insert(stewardID, value_references, function(err, ok){
                                            if(err) {
                                                callback(err, false);
                                            } else {
                                                callback(null, ok);
                                            }
                                        });
                                    } else {
                                        callback(err, false);
                                    }
                                } else {
                                    val_ref.value.documents.push("steward_bucket~" + getHash(steward.publicKey));
                                    stewards_bucket.replace(stewardID, val_ref.value, {cas: val_ref.cas}, function(err, ok){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            callback(null, ok);
                                        }
                                    });
                                }
                            })
                        };
                    });

                    //update namespaces
                    steward_bucket.namespaces.forEach(function(namespaceID){
                        insertTasks[namespaceID + "val_ref"] = function(callback) {
                            stewards_bucket.get(namespaceID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = namespaceID;
                                        stewards_bucket.insert(namespaceID, value_references, function(err, ok){
                                            if(err) {
                                                callback(err, false);
                                            } else {
                                                callback(null, ok);
                                            }
                                        });
                                    } else {
                                        callback(err, false);
                                    }
                                } else {
                                    val_ref.value.documents.push("steward_bucket~" + getHash(steward.publicKey));
                                    stewards_bucket.replace(namespaceID, val_ref.value, {cas: val_ref.cas}, function(err, ok){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            callback(null, ok);
                                        }
                                    });
                                }
                            })
                        };
                    });

                    //update currencies
                    steward_bucket.currencies.forEach(function(currencyID){
                        insertTasks[currencyID + "val_ref"] = function(callback) {
                            stewards_bucket.get(currencyID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = currencyID;
                                        stewards_bucket.insert(currencyID, value_references, function(err, ok){
                                            if(err) {
                                                callback(err);
                                            } else {
                                                callback(null, ok);
                                            }
                                        });
                                    } else {
                                        callback(err);
                                    }
                                } else {
                                    val_ref.value.documents.push("steward_bucket~" + getHash(steward.publicKey));
                                    stewards_bucket.replace(currencyID, val_ref.value, {cas: val_ref.cas},function(err, ok){
                                        if(err) {
                                            callback(err);
                                        } else {
                                            callback(null, ok);
                                        }
                                    });
                                }
                            })
                        };
                    });

                    //update accounts
                    steward_bucket.accounts.forEach(function(accountID){
                        insertTasks[accountID + "val_ref"] = function(callback) {
                            stewards_bucket.get(accountID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = accountID;
                                        stewards_bucket.insert(accountID, value_references, function(err, ok){
                                            if(err) {
                                                callback(err);
                                            } else {
                                                callback(null, ok);
                                            }
                                        });

                                    } else {
                                        callback(err, false);
                                    }
                                } else {
                                    val_ref.value.documents.push("steward_bucket~" + getHash(steward.publicKey));
                                    stewards_bucket.replace(accountID, val_ref.value, {cas : val_ref.cas}, function(err, ok){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            callback(null, ok);
                                        }
                                    });
                                }
                            })
                        };
                    });

                    //access doc to get listing of accounts under that account name and space.
                    insertTasks.accounts_list = function(callback) {
                        openmoney_bucket.insert(accounts_list.id, accounts_list, function(err, res){
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, res);
                            }
                        })
                    };

                    insertTasks.stewards_global = function(callback) {
                        var steward_global = clone(steward);
                        steward_global.id = "stewards~" + steward.stewardname.toLowerCase();
                        openmoney_bucket.insert(steward_global.id, steward_global, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };

                    insertTasks.steward_publicKey = function(callback) {
                        var steward_publicKey = {};
                        steward_publicKey.id = "steward_bucket~" + getHash(steward.publicKey);
                        steward_publicKey.type = "steward_bucket";
                        steward_publicKey.stewardname = steward.stewardname;
                        if(steward.privateKey != null){
                            steward_publicKey.privateKey = steward.privateKey;
                        }
                        openmoney_bucket.insert(steward_publicKey.id, steward_publicKey, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };

                    // persist the stewards view of steward accounts
                    insertTasks.steward_bucket = function(callback) {
                        //insert the steward account
                        stewards_bucket.insert("steward_bucket~" + getHash(steward.publicKey) , steward_bucket, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };


                    // persist the spaces, currencies, and accounts for the steward.
                    spaces.forEach(function(space){
                        if(space.id != 'namespaces~cc' && space.id != 'namespaces~uk' && space.id != 'namespaces~ca') {
                            insertTasks[space.id] = function (callback) {
                                openmoney_bucket.insert(space.id, space, function (err, res) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        // success
                                        callback(null, res);
                                    }
                                });
                            };
                        }
                    });
                    currencies.forEach(function(currency) {
                        if(currency.id != 'currencies~cc') {
                            insertTasks[currency.id] = function (callback) {
                                openmoney_bucket.insert(currency.id, currency, function (err, res) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        // success
                                        callback(null, res);
                                    }
                                });
                            };
                        }
                    });
                    accounts.forEach(function(account){
                        insertTasks[account.id] = function(callback) {
                            openmoney_bucket.insert(account.id, account, function (err, res) {
                                if (err) {
                                    callback(err);
                                } else {
                                    // success
                                    callback(null, res);
                                }
                            });
                        };
                    });

                    async.parallel(insertTasks,
                        function(err, results) {
                            // results is now equals to: {stewards: false, spacename: false}
                            if (err) {
                                console.log(err);
                                console.log(results);
                                registerPostCallback(err, false);

                            } else {
                                console.log(results);
                                //success

                                //send the response to the steward

                                var response = {
                                  ok: true,
                                  stewards: {}
                                };

                                // var response = {
                                //     "accounts": {},
                                //     "currencies": {},
                                //     "namespaces": {},
                                //     "stewards": {}
                                // };

                                for(var i = 0; i < stewards.length; i++){
                                    delete(stewards[i].password);
                                    //need to return the privateKey in order to decrypt journals
                                    if(stewards[i].stewardname != steward.stewardname){
                                      delete(stewards[i].privateKey);
                                    }
                                }

                                response.stewards = stewards;
                                // response.namespaces = spaces;
                                // response.currencies = currencies;
                                // response.accounts = accounts;


                                console.log("response:",response);


                                var to = '"' + steward.stewardname + '"<' + steward.email + '>';
                                if(!steward.email_notifications){
                                  to = null;
                                }

                                var subject = 'Welcome to Openmoney Network: "' + steward.stewardname + '"<' + steward.email + '>';
                                var messageHTML = '<h3>Welcome to Openmoney Network: "' + steward.stewardname + '"&lt;' + steward.email + '&gt;.</h3>';
                                messageHTML += '<b>Your stewardname is "' + steward.stewardname + '". You can log in here: <a href="https://openmoney.network#login">https://openmoney.network/#login</a></b> .';
                                messageHTML += '<h5>If you forgot your password you can reset it here: <a href="https://openmoney.network/#forgot">https://openmoney.network/#forgot</a>.</h5>';
                                sendmail(to, null, ['"Dominique Legault"<deefactorial+ON@gmail.com>', '"Michael Linton"<michael.lington+ON@gmail.com>'], subject, messageHTML, function(err, ok){
                                  console.log('sendmail:', err, ok);
                                  registerPostCallback(null, response);
                                });
                            }
                        });
                }
            });
    }
};

exports.stewardsList = function(request, stewardsGetCallback){
    console.log(request);

    stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            stewardsGetCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.stewards.forEach(function(stewardID){
                console.log("stewardID:" + stewardID);
                parallelTasks[stewardID] = function(callback) {
                    openmoney_bucket.get(stewardID,function(err,steward){
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
                    console.log(results);
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
    //console.log(queryString);
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        stewardsGetCallback(err,false);
    //    } else {
    //        console.log( results);
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        stewardsGetCallback(null, response);
    //    }
    //});
};

exports.stewardsGet = function(request, stewardsGetCallback){

    openmoney_bucket.get('stewards~' + request.stewardname.toLowerCase(), function(err, results) {
        if (err) {
            stewardsGetCallback(err,null);
        } else {
            //remove password and private key before returning result
            if(request.stewardname.toLowerCase() != request.user.stewardname.toLowerCase()){
              delete(results.value.password);
              delete(results.value.privateKey);
            }
            //add id to steward_bucket if it doesn't exist yet.
            stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function (err, steward_bucket) {
                if (err) {
                    stewardsGetCallback(err);
                } else {
                    if(steward_bucket.value.stewards.indexOf(results.value.id.toLowerCase()) !== -1){
                      stewardsGetCallback(null, results.value);
                    } else {
                      steward_bucket.value.stewards.push(results.value.id.toLowerCase());
                      //add stewards of currency to users stewards list
                      stewards_bucket.replace("steward_bucket~" + getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                          if (err) {
                              stewardsGetCallback(err);
                          } else {
                              stewardsGetCallback(null, results.value);
                          }
                      });
                    }
                }
            });

            //console.log(results.value);
            // stewardsGetCallback(null, results.value);
        }
    });
};


exports.stewardsGetByPublicKey = function(publicKey, cb) {
    openmoney_bucket.get("steward_bucket~" + getHash(publicKey), function(err, doc){
        if(err) {
            cb(err, null);
        } else {
            exports.stewardsGet(doc.value, function(err, steward){
                if(err){
                    cb(err, null);
                } else {
                    //console.log(steward);
                    cb(null, steward);
                }
            });
        }
    });
};

exports.stewardsPut = function(request, stewardsPutCallback){
    console.log(request);
    //verify the integrity of the document
    //update local document
    //update global document
    //search for other stewards who have this document and update them.
    openmoney_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err, publicKeyDoc) {
        if (err) {
            stewardsPutCallback(err,false);
        } else {

          if(request.stewardname.toLowerCase() != publicKeyDoc.value.stewardname.toLowerCase() || request.stewardname.toLowerCase() != request.steward.stewardname) {
              //change stewardname
              var error = {};
              error.status = 503;
              error.code = 1016;
              error.message = "Cannot change your stewardname at this time.";
              stewardsPutCallback(error,false);
              //search for all occurances of stewardname and replace them with the new name
          } else {
            openmoney_bucket.get('stewards~' + request.stewardname.toLowerCase(), function(err, steward){
              if(err){
                stewardsPutCallback(err,false);
              } else {

                //parallel tasks
                //var parallelTasks = {};
                var parallelInsertTasks = {};

                if (!scrypt.verifyKdfSync(new Buffer(steward.value.password, 'base64'), request.steward.password )){

                   //encrypt the new password
                   steward.value.password = scrypt.kdfSync(request.steward.password, scryptParameters).toString('base64');

                  //  parallelInsertTasks.invalidate_session = function(callback) {
                  //    //check that public key exsits.
                  //    openmoney_bucket.get(getHash(request.publicKey), function(err,publicKeyDoc){
                  //        if(err) {
                  //            callback({status: 401, code: 1005, message: "That public key is not registered."}, false);
                  //        } else {
                  //            //remove session
                  //            delete(publicKeyDoc.value.access_token);
                  //            delete(publicKeyDoc.value.access_token_expiry);
                  //            openmoney_bucket.put(getHash(request.publicKey), publicKeyDoc.value, publicKeyDoc.cas, function(err, ok){
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
                   steward.value.email_notifications = steward.value.email_notifications;
                }



                   parallelInsertTasks.openmoney_bucket = function(callback) {
                       openmoney_bucket.replace('stewards~' + request.stewardname.toLowerCase(), steward.value, steward.cas, function(err, results) {
                           if (err) {
                               callback(err,false);
                           } else {
                               console.log( results);
                               var response = {};
                               response = results.value;
                               callback(null, response);
                           }
                       });
                   };

                    async.parallel(parallelInsertTasks,
                        function(err, results) {
                            if (err) {
                                stewardsPutCallback(err, false);
                            } else {
                                console.log(results);
                                stewardsPutCallback(null, {id: "stewards~" + request.stewardname.toLowerCase(), ok: true});
                            }
                        });

               }

            });
          }




        }
    });
};

exports.stewardsDelete = function(request, stewardsDeleteCallback) {
    console.log(request);
    var error = {};
    error.status = 503;
    error.code = 1018;
    error.message = 'method not implemented at this time.';
    stewardsDeleteCallback(error, false);
};

exports.spacesList = function(request, spacesGetCallback){
    console.log(request);

    //var query = ViewQuery.from('beer', 'by_name').skip(6).limit(3);;
    //myBucket.query(query, function(err, results) {
    //    for(i in results) {
    //        console.log('Row:', results[i]);
    //    }
    //});

    stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            spacesGetCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.namespaces.forEach(function(spaceID){
                //console.log("spaceID:" + spaceID);
                parallelTasks[spaceID] = function(callback) {
                    openmoney_bucket.get(spaceID,function(err,namespace){
                        if(err) {
                            callback(err, false);
                        } else {
                            callback(null,namespace.value);
                        }
                    })
                };
            });
            async.parallel(parallelTasks, function(err, results){
                if(err) {
                    spacesGetCallback(err, false);
                } else {
                    console.log(results);
                    var response = [];
                    for (var key in results) {
                        if (results.hasOwnProperty(key)) {
                            response.push(results[key]);
                        }
                    }
                    spacesGetCallback(null, response);
                }
            });
        }
    });

    //var N1qlQuery = couchbase.N1qlQuery;
    //stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + getHash(request.publicKey) + 'spaces~%";';
    //console.log(queryString);
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        spacesGetCallback(err,false);
    //    } else {
    //        console.log( results);
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        spacesGetCallback(null, response);
    //    }
    //});

    //var query = couchbase.ViewQuery.from('dev_spaces', 'spaces');
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        spacesGetCallback(err,false);
    //    } else {
    //        var response = [];
    //        for(i in results) {
    //            //console.log('Row:', results[i]);
    //            response.push(results[i].value);
    //        }
    //        spacesGetCallback(null, response);
    //    }
    //});
};

exports.spacesPost = function(request, spacesPostCallback) {
    console.log(request);
    //check for properly formed document
    request.space.id = "namespaces~" + request.space.namespace;
    request.space.created = new Date().getTime();
    request.space.created_by = request.stewardname;
    request.space.type = "namespaces";

    var namespace = {};
    namespace.id = "namespaces~" + request.space.namespace;
    namespace.type = "namespaces";
    namespace.namespace = request.space.namespace;
    namespace.parent_namespace = request.space.parent_namespace;
    namespace.stewards = request.space.stewards;
    namespace.created = new Date().getTime();
    namespace.created_by = request.stewardname;

    if(request.space.namespace.indexOf('.') === -1 && request.space.parent_namespace != ''){
        var error = {};
        error.status = 403;
        error.code = 2001;
        error.message = "Cannot create namespace in the root, your namespace must contain a dot character.";
        spacesPostCallback(error, false);
    } else {
        var calculatedParent = request.space.namespace.substring(request.space.namespace.indexOf('.')+1, request.space.namespace.length);
        if(calculatedParent != request.space.parent_namespace) {
            var error = {};
            error.status = 403;
            error.code = 2002;
            error.message = "Parent namespace is not parent of namespace " + calculatedParent + " != " + request.space.parent_namespace + ", format: namespace.parent_namespace";
            spacesPostCallback(error, false);
        } else {

            var parallelTasks = {};
            var parallelInsertTasks = {};

            namespace.stewards.forEach(function(steward){
                parallelTasks[steward] = function(callback) {
                    openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err){
                            if(err.code == 13){
                                err.status = 404;
                                err.code = 2008;
                                err.message = "Steward does not exist.";
                                callback(err, null);
                            } else {
                                callback(err, null);
                            }
                        } else {
                            callback(null, stewardDoc.value);
                        }
                    });
                    //stewards_bucket.get(getHash(request.publicKey), function(err, steward_bucket){
                    //    if(err) {
                    //        callback(err, false);
                    //    } else {
                    //        console.log("steward_bucket" + JSON.stringify(steward_bucket));
                    //        steward_bucket.value.namespaces.push(request.space.id);
                    //        parallelInsertTasks.local_space = function(callback) {
                    //            stewards_bucket.upsert(getHash(request.publicKey), steward_bucket.value , function (err, ok){
                    //                if(err) {
                    //                    callback(err, false);
                    //                } else {
                    //                    callback(null, ok);
                    //                }
                    //            });
                    //        };
                    //        callback(null,steward_bucket);
                    //    }
                    //})
                };
            });


            parallelTasks.parent_namespace = function(callback) {
                //check if parent namespace exists
                openmoney_bucket.get("namespaces~" + request.space.parent_namespace, function (err, doc){
                    if(err) {
                        callback({status:403, code:2003, message: "Parent namespace does not exist."}, true);
                    } else {
                        //parent space exists
                        callback(null, doc);
                    }
                });
            };
            parallelTasks.namespace = function(callback) {
                //check if namespace exists
                openmoney_bucket.get("namespaces~" + request.space.namespace, function (err, doc){
                    if(err) {
                        if(err.code == 13) {
                            //namespace does not exist so create it
                            callback(null, false);
                        } else {
                            callback(err, false);
                        }
                    } else {
                        //namespace exists
                        var error = {};
                        error.status = 403;
                        error.code = 2004;
                        error.message = "namespace exists with that name.";
                        callback(error, true);
                    }
                });
            };

            parallelTasks.currency = function(callback) {
                //check if namespace exists
                openmoney_bucket.get("currencies~" + request.space.namespace, function (err, currency){
                    if(err) {
                        if(err.code == 13) {
                            //currency does not exist so create it
                            callback(null, true);
                        } else {
                            callback(err, false);
                        }
                    } else {
                        //check if they are the owner
                        var is_steward;
                        currency.value.stewards.forEach(function(steward){
                            if(steward == "stewards~" + request.stewardname){
                                is_steward = true;
                            }
                        });
                        if(is_steward){
                            callback(null, currency);
                        } else {
                            //namespace exists
                            var error = {};
                            error.status = 403;
                            error.code = 2005;
                            error.message = "Currency exists with that name.";
                            callback(error, true);
                        }
                    }
                });
            };


            parallelTasks.accounts_exists_check = function(callback){
                openmoney_bucket.get("accountsList~" + namespace.namespace.toLowerCase(), function(err, accountList){
                    if(err){
                        if(err.code == 13) {
                            callback(null, true);
                        } else {
                            callback(err, null);
                        }
                    } else {
                        console.log("There are accounts with that name");
                        //there are accounts with that name
                        var parallelAccountTasks = {};
                        //check who is the steward of the accounts if this is the steward then allow.
                        accountList.value.list.forEach(function(accountID){
                            parallelAccountTasks[accountID] = function(callback) {
                                openmoney_bucket.get(accountID, function(err, account){
                                    if(err) {
                                        callback(err, null);
                                    } else {
                                        var is_steward = false;
                                        account.value.stewards.forEach(function(steward){
                                            if(steward == "stewards~" + request.stewardname) {
                                                is_steward = true;
                                            }
                                        });
                                        if(is_steward) {
                                            callback(null, account);
                                        } else {
                                            var error = {};
                                            error.status = 403;
                                            error.code = 2007;
                                            error.message = 'Account exists with that name.';
                                            callback(error, null);
                                        }
                                    }
                                });
                            };
                        });

                        async.parallel(parallelAccountTasks, function(err, ok){
                            if(err){
                                callback(err, null);
                            } else {
                                callback(null, ok);
                            }
                        });
                    }
                });
            };

            async.parallel(parallelTasks,
                function(err, results) {
                    if(err) {
                        spacesPostCallback(err,false);
                    } else {
                        console.log("All checks pass insert the space.")
                        console.log(results);
                        //insert the space

                        parallelInsertTasks.space = function(callback) {
                            openmoney_bucket.insert(namespace.id, namespace , function (err, ok){
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        };

                        //find all the parents of this namespace and insert this namespace into their children document.
                        //grandchild.child.parent.grandparent
                        //child.parent.grandparent
                        //parent.grandparent
                        //grandparent
                        var parents = namespace.namespace.toLowerCase().split('.');
                        for(var i = 1; i < parents.length ;i++ ){ // start with second item
                            for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                                parents[i] += "." + parents[j];
                            }
                        }
                        parents.shift(); //remove this namespace at the head of the list
                        parents.forEach(function(parent){
                            parallelInsertTasks["parent" + parent] = function(callback){
                                 openmoney_bucket.get("namespaces_children~" + parent, function(err, parentChildrenDoc){
                                     if(err){
                                         if(err.code == 13){
                                             //create a document for this parents namespaces children
                                             var children_reference = {};
                                             children_reference.type = "namespaces_children";
                                             children_reference.children = [ namespace.id ];
                                             children_reference.id = children_reference.type + "~" + parent;
                                             openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                                                 if(err){
                                                    if(err.code == 12){
                                                      parallelInsertTasks["parent" + parent](callback);
                                                    } else {
                                                      callback(err, null);
                                                    }
                                                 } else {
                                                   callback(null, ok);
                                                 }
                                             });

                                         } else {
                                             callback(err, null);
                                         }
                                     } else {
                                       if(parentChildrenDoc.value.children.indexOf(namespace.id) === -1){
                                         parentChildrenDoc.value.children.push( namespace.id );
                                         openmoney_bucket.replace("namespaces_children~" + parent, parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
                                            if(err){
                                                if(err.code == 12){
                                                  //try again
                                                  parallelInsertTasks["parent" + parent](callback);
                                                } else {
                                                  callback(err, null);
                                                }
                                            } else {
                                                callback(null, ok);
                                            }
                                         });
                                       } else {
                                         callback(null, parentChildrenDoc);
                                       }
                                     }
                                 });
                            };
                        });

                        var value_reference = {};
                        value_reference.type = "value_reference";
                        value_reference.documents = [ "steward_bucket~" + getHash(request.publicKey) ];
                        value_reference.id = namespace.id;
                        parallelInsertTasks.value_reference = function(callback) {
                            stewards_bucket.insert(value_reference.id, value_reference, function(err, ok){
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        };

                        namespace.stewards.forEach(function(steward){
                            parallelInsertTasks[steward] = function(callback) {
                                openmoney_bucket.get(steward, function(err, stewardDoc){
                                    if(err){
                                        callback(err, null);
                                    } else {
                                        stewards_bucket.get("steward_bucket~" + getHash(stewardDoc.value.publicKey), function(err, steward_bucket) {
                                            if(err) {
                                                callback(err, null);
                                            } else {
                                                if(steward_bucket.value.namespaces.indexOf(namespace.id) !== -1){
                                                  callback(null, steward_bucket.value);
                                                } else {
                                                  steward_bucket.value.namespaces.push(namespace.id);
                                                  stewards_bucket.upsert("steward_bucket~" + getHash(stewardDoc.value.publicKey), steward_bucket.value, { cas: steward_bucket.cas }, function(err, ok){
                                                      if(err) {
                                                          if(err.code == 12){
                                                            //try again
                                                            parallelInsertTasks[steward](callback);
                                                          } else {
                                                            callback(err, null);
                                                          }
                                                      } else {
                                                          //get value reference doc and update
                                                          stewards_bucket.get(namespace.id, function(err, valRefDoc){
                                                              if(err) {
                                                                  callback(err, null);
                                                              } else {
                                                                  //if this reference doesn't exist add it
                                                                  if(valRefDoc.value.documents.indexOf("steward_bucket~" + getHash(stewardDoc.value.publicKey)) === -1){
                                                                      valRefDoc.value.documents.push("steward_bucket~" + getHash(stewardDoc.value.publicKey));
                                                                      stewards_bucket.upsert(namespace.id, valRefDoc.value, { cas: valRefDoc.cas }, function(err, ok){
                                                                          if(err){
                                                                              if(err.code == 12){
                                                                                //try again
                                                                                parallelInsertTasks[steward](callback);
                                                                              } else {
                                                                                callback(err, null);
                                                                              }
                                                                          } else {
                                                                              callback(null, ok);
                                                                          }
                                                                      });
                                                                  } else {
                                                                      callback(null, ok);
                                                                  }
                                                              }
                                                          });
                                                      }
                                                  });
                                                }
                                            }
                                        });
                                    }
                                });
                            };
                        });

                        async.series(parallelInsertTasks,
                            function(err, results) {
                                if (err) {
                                    spacesPostCallback(err, false);
                                } else {
                                    console.log(results);
                                    var response = {};
                                    response.ok = true;
                                    response.id = request.space.id;
                                    spacesPostCallback(null,response);
                                }
                            });
                    }
                });
        }
    }
};

exports.spacesGet = function(request, spacesGetCallback) {
    console.log(request);
    openmoney_bucket.get('namespaces~' + request.namespace.toLowerCase(), function(err, results) {
        if (err) {
            spacesGetCallback(err,false);
        } else {
            console.log(results);
            if(results.value.private) {
              var error = {};
              error.status = 403;
              error.code = 2009;
              error.message = 'Cannot add a private namespace.';
              spacesGetCallback(error);
            } else {
              stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function (err, steward_bucket) {
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
                        stewards_bucket.replace("steward_bucket~" + getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                            if (err) {
                                spacesGetCallback(err);
                            } else {
                                spacesGetCallback(null, results.value);
                            }
                        });
                      }
                  }
              });
            }
        }
    });
};


exports.spacesPut = function(request, spacesPutCallback) {
    console.log(request);
    //change space name.
    request.space.id = "namespaces~" + request.space.namespace;

    //check parent_namespace is parent of namespace
    if(request.space.namespace.indexOf('.') === -1 && request.space.parent_namespace != ''){
        var error = {};
        error.status = 403;
        error.code = 2001;
        error.message = "Cannot create namespace in the root, your namespace must contain a dot character.";
        spacesPutCallback(error, false);
    } else {
        var calculatedParent = request.space.namespace.substring(request.space.namespace.indexOf('.') + 1, request.space.namespace.length);
        if (calculatedParent != request.space.parent_namespace) {
            var error = {};
            error.status = 403;
            error.code = 2002;
            error.message = "Parent namespace is not found.";
            spacesPutCallback(error, false);
        } else {
            //check what has changed
            openmoney_bucket.get("namespaces~" + request.namespace, function (err, olddoc) {
                if (err) {
                    spacesPutCallback(err, false);
                } else {
                    console.log("olddoc:" + JSON.stringify(olddoc));
                    //check that old steward is steward of this space.
                    var is_steward = false;
                    olddoc.value.stewards.forEach(function(steward){
                        if(steward == "stewards~" + request.stewardname){
                            is_steward = true;
                        }
                    });
                    if(!is_steward) {
                        var error = {};
                        error.status = 403;
                        error.code = 2006;
                        error.message = "You are not the steward of this namespace.";
                        spacesPutCallback(error, false);
                    } else {
                        console.log('isSteward', is_steward);
                        var parallelTasks = {};

                        var namespace_change = false;
                        //namespace change
                        if (olddoc.value.namespace != request.space.namespace) {
                            namespace_change = true;
                            //check if the namespace exists
                            parallelTasks.namespace = function (callback) {
                                openmoney_bucket.get("namespaces~" + request.space.namespace, function (err, doc) {
                                    if (err) {
                                        if (err.code == 13) {
                                            callback(null, true);
                                        } else {
                                            callback(err, false);
                                        }
                                    } else {
                                        console.log("namespace exists with that name:");
                                        console.log(doc);
                                        var error = {};
                                        error.status = 403;
                                        error.code = 2004;
                                        error.message = "namespace exists with that name.";
                                        callback(error, false);
                                    }
                                });
                            };
                            //check that the name isn't taken by another currency or account
                            parallelTasks.currency = function (callback) {
                                openmoney_bucket.get("currencies~" + request.space.namespace, function (err, doc) {
                                    if (err) {
                                        if (err.code == 13) {
                                            callback(null, true);
                                        } else {
                                            callback(err, false);
                                        }
                                    } else {
                                        var error = {};
                                        error.status = 403;
                                        error.code = 2005;
                                        error.message = "Currency already exists with the same name.";
                                        callback(error, false);
                                    }
                                });
                            };
                            //
                            parallelTasks.account = function (callback) {

                                //get accountsList~
                                openmoney_bucket.get("accountsList~" + request.space.namespace.toLowerCase(), function(err, accountList){
                                    if(err) {
                                        if(err.code == 13){
                                            callback(null, "no account found with that namespace name");
                                        } else {
                                            callback(err, null);
                                        }
                                    } else {
                                        //go through each account
                                        //if the account is not this stewards through a 2007 error
                                        console.log("There are accounts with that namespace name", accountList);
                                        //there are accounts with that name
                                        var parallelAccountTasks = {};
                                        //check who is the steward of the accounts if this is the steward then allow.
                                        accountList.value.list.forEach(function(accountID){
                                            parallelAccountTasks[accountID] = function(cb) {
                                                console.log('get', accountID);
                                                openmoney_bucket.get(accountID, function(err, account){
                                                    console.log('get result of', accountID, err, account);
                                                    if(err) {
                                                        cb(err, null);
                                                    } else {
                                                        var is_steward = false;
                                                        account.value.stewards.forEach(function(steward){
                                                            if(steward == "stewards~" + request.stewardname) {
                                                                is_steward = true;
                                                            }
                                                        });
                                                        console.log('is_steward', is_steward);
                                                        if(is_steward) {
                                                            cb(null, account);
                                                        } else {
                                                            var error = {};
                                                            error.status = 403;
                                                            error.code = 2007;
                                                            error.message = 'There is an account with that namespace name.';
                                                            cb(error, null);
                                                        }
                                                    }
                                                })
                                            };
                                        });

                                        async.parallel(parallelAccountTasks, function(err, ok){
                                            console.log('parallelAccountTasks', err, ok);
                                            callback(err, ok);
                                        });
                                    }
                                });
                            };
                        }

                        //parent_namespace change
                        if (olddoc.value.parent_namespace != request.space.parent_namespace) {
                            //check parent namespace exists
                            parallelTasks.namespace = function (callback) {
                                console.log('parent namespace check', request.space.parent_namespace);
                                openmoney_bucket.get("namespaces~" + request.space.parent_namespace, function (err, doc) {
                                    if (err) {
                                        if (err.code == 13) {
                                            var error = {};
                                            error.status = 404;
                                            error.code = 2003;
                                            error.message = "Parent namespace does not exist.";
                                            callback(error, false);
                                        } else {
                                            callback(err, false);
                                        }
                                    } else {
                                        callback(null, doc);
                                    }
                                });
                            }
                        }
                        var steward_change = false;
                        //stewards change
                        if (olddoc.value.stewards.equals(request.space.stewards) === false) {
                            //check that stewards exist
                            request.space.stewards.forEach(function (steward) {
                                parallelTasks[steward] = function (callback) {
                                    openmoney_bucket.get(steward, function (err, doc) {
                                        if (err) {
                                            if (err.code == 13) {
                                                var error = {};
                                                error.status = 404;
                                                error.code = 2008;
                                                error.message = "Steward does not exist.";
                                                callback(error, false);
                                            } else {
                                                callback(err, false);
                                            }
                                        } else {
                                            callback(null, doc);
                                        }
                                    })
                                };
                            });
                            steward_change = true;
                        }

                        var private_change = false;
                        if (typeof olddoc.value.private == 'undefined'){
                          if (typeof request.space.private != 'undefined'){
                            private_change = true;
                          }
                        } else {
                          if (typeof request.space.private != 'undefined' && request.space.private != olddoc.value.private){
                            private_change = true;
                          }
                        }

                        var disabled_change = false;
                        if (typeof olddoc.value.disabled == 'undefined'){
                          if (typeof request.space.disabled != 'undefined'){
                            disabled_change = true;
                          }
                        } else {
                          if (typeof request.space.disabled != 'undefined' && request.space.disabled != olddoc.value.disabled){
                            disabled_change = true;
                          }
                        }


                        //find all instances where space exists, check currencies and accounts that use them

                        var changed_documents = {};
                        changed_documents.namespaces = {};
                        changed_documents.currencies = {};
                        changed_documents.accounts = {};
                        var steward_notification_list = [];
                        var parallelUpdateTasks = {};
                        var re = new RegExp("" + olddoc.value.namespace + "$", "i");
                        var mod = {};
                        mod.modified = new Date().getTime();
                        mod.modified_by = request.stewardname;
                        mod.modification = '';
                        if (namespace_change) {
                            mod.modification += "Namespace change From " + olddoc.value.namespace + " to " + request.space.namespace + ". ";
                        }
                        if (steward_change) {
                            mod.modification += "Stewards changed from [";
                            olddoc.value.stewards.forEach(function (steward) {
                                mod.modification += steward.replace("stewards~", '') + ", ";
                            });
                            mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                            mod.modification += "] to [";
                            request.space.stewards.forEach(function (steward) {
                                mod.modification += steward.replace("stewards~", '') + ", ";
                            });
                            mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                            mod.modification += "]. ";
                        }
                        if (private_change){
                            mod.modification += "Private Change from " + olddoc.value.private + " to " + request.space.private + ".";
                        }
                        if (disabled_change){
                            mod.modification += "Disabled Change from " + olddoc.value.disabled + " to " + request.space.disabled + ".";
                        }

                        console.log('modifications', mod);

                        //change this namespace document
                        var doc = olddoc.value;
                        doc.stewards.forEach(function (steward) {
                            steward_notification_list.push(steward);
                        });
                        if (typeof doc.modifications == 'undefined') {
                            doc.modifications = [];
                        }
                        doc.modifications.push(mod);
                        //if steward change and this is the doc changing
                        if (steward_change && doc.namespace.toLowerCase() == request.space.namespace.toLowerCase()) {
                            doc.stewards = request.space.stewards;
                        }
                        var olddoc_id = clone(doc.id);

                        if (namespace_change) {

                            //replace the id, and namespaces with the new namespace.
                            doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                            changed_documents.namespaces[olddoc_id] = doc.id; //log the change
                            doc.namespace = doc.namespace.replace(re, request.space.namespace);
                            doc.parent_namespace = doc.parent_namespace.replace(re, request.space.namespace);
                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                openmoney_bucket.remove(olddoc_id, function (err, result) {
                                    cb(err, result);
                                });
                            };
                        }

                        if (private_change) {
                          doc.private = request.space.private;
                        }

                        if (disabled_change) {
                          doc.disabled = request.space.disabled;
                        }

                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                            console.log('update', doc.id, doc);
                            openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                cb(err, result);
                            });
                        };

                        //look for references then que update tasks
                        parallelTasks.update_namespace_children = function (callback) {

                            //Get all childeren namespaces of this parent namespace.
                            openmoney_bucket.get("namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                                if (err) {
                                    if (err.code == 13) {
                                        callback(null, "No Children found.");
                                    } else {
                                        callback(err, null);
                                    }
                                } else {
                                    //children found
                                    var childTasks = {};
                                    childrenDoc.value.children.forEach(function (child) {
                                        childTasks[child] = function(callback){
                                            openmoney_bucket.get(child, function (err, namespaceDoc) {
                                                if (err) {
                                                    callback(err, null);
                                                } else {
                                                    var doc = namespaceDoc.value;
                                                    doc.stewards.forEach(function (steward) {
                                                        steward_notification_list.push(steward);
                                                    });
                                                    if (typeof doc.modifications == 'undefined') {
                                                        doc.modifications = [];
                                                    }
                                                    doc.modifications.push(mod);

                                                    var olddoc_id = clone(doc.id);

                                                    if (namespace_change) {

                                                        //replace the id, and namespaces with the new namespace.
                                                        doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                                        changed_documents.namespaces[olddoc_id] = doc.id; //log the change
                                                        doc.namespace = doc.namespace.replace(re, request.space.namespace);
                                                        doc.parent_namespace = doc.parent_namespace.replace(re, request.space.namespace);
                                                        parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                            openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                                if (err) {
                                                                    cb(err, false);
                                                                } else {
                                                                    cb(null, result);
                                                                }
                                                            });
                                                        };
                                                    }

                                                    parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                                        openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                                            if (err) {
                                                                cb(err, false);
                                                            } else {
                                                                cb(null, result);
                                                            }
                                                        });
                                                    };

                                                    callback(null, namespaceDoc);
                                                }//else err
                                            });//get
                                        };//child function
                                    });//childrenDoc

                                    async.parallelTasks(childTasks, function(err, results){
                                        callback(err, results);
                                    });
                                }//else err
                            });//get
                        };//update_namespace_children


                        //look for references then que update tasks
                        parallelTasks.update_currencies_references_global = function (callback) {
                            //change this currency namespace document
                            openmoney_bucket.get("currencies~" + olddoc.value.namespace.toLowerCase(), function(err, currency_namespaceDoc){
                                if (err) {
                                    if (err.code == 13) {
                                        callback(null, "Currency Not Found");
                                    } else {
                                        callback(err, null);
                                    }
                                } else {
                                    //currency namespace document found

                                    var doc = currency_namespaceDoc.value;
                                    doc.stewards.forEach(function (steward) {
                                        steward_notification_list.push(steward);
                                    });
                                    if (typeof doc.modifications == 'undefined') {
                                        doc.modifications = [];
                                    }
                                    doc.modifications.push(mod);

                                    var olddoc_id = clone(doc.id);

                                    if (namespace_change) {
                                        //replace the id, and namespaces with the new namespace.
                                        doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                        changed_documents.currencies[olddoc_id] = doc.id; //log the change
                                        doc.currency_namespace = doc.currency_namespace.replace(re, request.space.namespace);
                                        parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                            openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                cb(err, result);
                                            });
                                        };
                                    }

                                    parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                        openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                            cb(err, result);
                                        });
                                    };

                                    callback(null, currency_namespaceDoc);
                                }//else err
                            });//get
                        };//update_currencies_references_global

                        parallelTasks.update_currencies_namespaces_children = function (callback) {

                            //Get all childeren namespaces of this parent namespace.
                            openmoney_bucket.get("currency_namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                                if (err) {
                                    if (err.code == 13) {
                                        callback(null, "No Currency Children found.");
                                    } else {
                                        callback(err, null);
                                    }
                                } else {
                                    //children found
                                    var childTasks = {};

                                    childrenDoc.value.children.forEach(function (child) {
                                        childTasks[child] = function(callback){
                                            openmoney_bucket.get(child, function (err, namespaceDoc) {
                                                if (err) {
                                                    callback(err, null);
                                                } else {
                                                    var doc = namespaceDoc.value;
                                                    doc.stewards.forEach(function (steward) {
                                                        steward_notification_list.push(steward);
                                                    });
                                                    if (typeof doc.modifications == 'undefined') {
                                                        doc.modifications = [];
                                                    }
                                                    doc.modifications.push(mod);

                                                    var olddoc_id = clone(doc.id);

                                                    if (namespace_change) {

                                                        //replace the id, and namespaces with the new namespace.
                                                        doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                                        changed_documents.currencies[olddoc_id] = doc.id; //log the change
                                                        doc.currency_namespace = doc.currency_namespace.replace(re, request.space.namespace);
                                                        parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                            openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                                cb(err, result);
                                                            });
                                                        };
                                                    }

                                                    parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                                        openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                                            cb(err, result);
                                                        });
                                                    };

                                                    callback(null, namespaceDoc);
                                                }//else err
                                            })//get
                                        };//function
                                    });//childrenDoc

                                    async.parallel(childTasks, function(err, results){
                                      callback(err, results);
                                    });
                                }//else err
                            });//get
                        };//update_currencies_namespaces_children


                        //look for references then que update tasks
                        parallelTasks.update_accounts_references_global = function (callback) {
                            //get accounts
                            openmoney_bucket.get("accounts~" + olddoc.value.namespace.toLowerCase(), function(err, namespaceDoc){
                                if (err) {
                                    if (err.code == 13) {
                                        callback(null, "No Accounts Found");
                                    } else {
                                        callback(err, null);
                                    }
                                } else {
                                    //currency namespace document found

                                    var doc = namespaceDoc.value;
                                    doc.stewards.forEach(function (steward) {
                                        steward_notification_list.push(steward);
                                    });
                                    if (typeof doc.modifications == 'undefined') {
                                        doc.modifications = [];
                                    }
                                    doc.modifications.push(mod);

                                    var olddoc_id = clone(doc.id);

                                    if (namespace_change) {

                                        //replace the id, and namespaces with the new namespace.
                                        doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                        changed_documents.accounts[olddoc_id] = doc.id; //log the change
                                        doc.account_namespace = doc.account_namespace.replace(re, request.space.namespace);
                                        parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                            openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                cb(err, result);
                                            });
                                        };
                                    }

                                    parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                        openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                            cb(err, result);
                                        });
                                    };

                                    callback(null, namespaceDoc);
                                }//else err
                            });//get
                        };//update_accounts_references_global

                        parallelTasks.update_accounts_namespaces_children = function (callback) {

                            //Get all childeren namespaces of this parent namespace.
                            openmoney_bucket.get("account_namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                                if (err) {
                                    if (err.code == 13) {
                                        callback(null, "No Account Children Found.");
                                    } else {
                                        callback(err, null);
                                    }
                                } else {
                                    //children found
                                    console.log('childrenDoc', childrenDoc);
                                    var childTasks = {};

                                    childrenDoc.value.children.forEach(function (child) {
                                        if(child != null){
                                            console.log('child', child);
                                            childTasks[child] = function(callback){
                                                openmoney_bucket.get(child, function(err, namespaceDoc){
                                                    if (err) {
                                                        callback(err, null);
                                                    } else {
                                                        var doc = namespaceDoc.value;
                                                        doc.stewards.forEach(function (steward) {
                                                            steward_notification_list.push(steward);
                                                        });
                                                        if (typeof doc.modifications == 'undefined') {
                                                            doc.modifications = [];
                                                        }
                                                        doc.modifications.push(mod);

                                                        var olddoc_id = clone(doc.id);

                                                        if (namespace_change) {

                                                            //replace the id, and namespaces with the new namespace.
                                                            doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                                            changed_documents.accounts[olddoc_id] = doc.id; //log the change
                                                            doc.account_namespace = doc.account_namespace.replace(re, request.space.namespace);
                                                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                                openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                                    cb(err, result);
                                                                });
                                                            };
                                                        }

                                                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                                            openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                                                cb(err, result);
                                                            });
                                                        };

                                                        callback(null, namespaceDoc);
                                                    }//else err
                                                });//get
                                            };//function
                                        }//child not null
                                    });//childrenDoc

                                    async.parallel(childTasks, function(err, results){
                                      callback(err, results);
                                    });
                                }//else err
                            });//get
                        };//update_accounts_namespaces_children

                        console.log('async parallel', parallelTasks);
                        async.parallel(parallelTasks, function(err, results) {
                            if (err) {
                                console.log('parallelTasks error', err);
                                spacesPutCallback(err, false);
                            } else {
                                console.log('parallelTasks results',results);
                                //all the checks passed so update all the instances

                                //check if anything changed first
                                if(steward_change || namespace_change || private_change || disabled_change) {

                                    console.log("changed_documents: ");
                                    console.log(changed_documents);
                                    //get the value references for the changed namespaces
                                    for (var key in changed_documents.namespaces) {
                                        if (changed_documents.namespaces.hasOwnProperty(key)) {
                                            parallelUpdateTasks[key] = function(callback) {
                                                console.log("get key:" + key);
                                                stewards_bucket.get(key, function(err, doc){
                                                    if(err) {
                                                        callback(err, false);
                                                    } else {
                                                        console.log("got key:" + JSON.stringify(doc.value));
                                                        doc.value.id = changed_documents.namespaces[key];
                                                        var parallelDocumentTasks = {};
                                                        //update the references to the document
                                                        doc.value.documents.forEach(function(steward_bucket){
                                                            parallelDocumentTasks[steward_bucket] = function(callback){
                                                                console.log("get steward_bucket: " + steward_bucket);
                                                                stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                                    if(err) {
                                                                        callback(err, false);
                                                                    } else {
                                                                        var index = steward_bucket_doc.value.namespaces.indexOf(key);
                                                                        if(index !== -1){
                                                                            steward_bucket_doc.value.namespaces[index] = changed_documents.namespaces[key];
                                                                        }
                                                                        stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                            callback(err, ok);
                                                                        })
                                                                    }
                                                                })
                                                            };
                                                        });
                                                        //update the value_reference document
                                                        parallelDocumentTasks.update_document = function(callback) {
                                                            stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                                callback(err, ok);
                                                            });
                                                        };

                                                        async.parallel(parallelDocumentTasks, function(err, ok){
                                                            callback(err, ok)
                                                        });
                                                    }//else err
                                                });//get
                                            }//function
                                        }//in
                                    }//for namepsaces
                                    //currencies value references
                                    for (var key in changed_documents.currencies) {
                                        if (changed_documents.currencies.hasOwnProperty(key)) {
                                            //alert(key + " -> " + p[key]);
                                            parallelUpdateTasks[key] = function(callback) {
                                                stewards_bucket.get(key, function(err, doc){
                                                    if(err) {
                                                        callback(err, false);
                                                    } else {
                                                        doc.value.id = changed_documents.currencies[key];
                                                        var parallelDocumentTasks = {};
                                                        //update the references to the document
                                                        doc.value.documents.forEach(function(steward_bucket){
                                                            parallelDocumentTasks[steward_bucket] = function(callback){
                                                                stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                                    if(err) {
                                                                        callback(err, false);
                                                                    } else {
                                                                        var index = steward_bucket_doc.value.currencies.indexOf(key);
                                                                        if(index !== -1){
                                                                            steward_bucket_doc.value.currencies[index] = changed_documents.currencies[key];
                                                                        }
                                                                        stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                            callback(err, ok);
                                                                        })
                                                                    }
                                                                })
                                                            };
                                                        });
                                                        //update the value_reference document
                                                        parallelDocumentTasks.update_document = function(callback) {
                                                            stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                                callback(err, ok);
                                                            });
                                                        };

                                                        async.parallel(parallelDocumentTasks, function(err, ok){
                                                            callback(err, ok);
                                                        });
                                                    }
                                                });
                                            };//function
                                        }//in
                                    }//for currencies

                                    //accounts value references
                                    for (var key in changed_documents.accounts) {
                                        if (changed_documents.accounts.hasOwnProperty(key)) {
                                            //alert(key + " -> " + p[key]);
                                            parallelUpdateTasks[key] = function(callback) {
                                                stewards_bucket.get(key, function(err, doc){
                                                    if(err) {
                                                        callback(err, false);
                                                    } else {
                                                        //why does it re-assign id
                                                        doc.value.id = changed_documents.accounts[key];
                                                        var parallelDocumentTasks = {};
                                                        //update the references to the document
                                                        doc.value.documents.forEach(function(steward_bucket){
                                                            parallelDocumentTasks[steward_bucket] = function(callback){
                                                                stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                                    if(err) {
                                                                        callback(err, false);
                                                                    } else {
                                                                        var index = steward_bucket_doc.value.accounts.indexOf(key);
                                                                        if(index !== -1){
                                                                            steward_bucket_doc.value.accounts[index] = changed_documents.accounts[key];
                                                                        }
                                                                        stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                            callback(err, ok);
                                                                        })
                                                                    }
                                                                })
                                                            };
                                                        });
                                                        //update the value_reference document
                                                        parallelDocumentTasks.update_document = function(callback) {
                                                            stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                                callback(err, ok);
                                                            });
                                                        };

                                                        async.parallel(parallelDocumentTasks, function(err, ok){
                                                            callback(err, ok);
                                                        });
                                                    }//else err
                                                });//get
                                            }//function
                                        }//in
                                    }//for

                                    async.parallel(parallelUpdateTasks, function(err, results) {
                                            if (err) {
                                                spacesPutCallback(err, false);
                                            } else {
                                                console.log(results);
                                                var response = {};
                                                response.id = request.space.id;
                                                response.ok = true;
                                                console.log(response);
                                                spacesPutCallback(null, response);
                                            }
                                        });
                                } else {
                                    var response = {};
                                    response.id = request.space.id;
                                    response.ok = true;
                                    spacesPutCallback(null, response);
                                }//else if changed

                            }//else err
                        });//parallelTasks
                    }//issteward
                }//else err
            });//get namespace
        }//parent not found
    }//else root
};//spacesPut

exports.spacesDelete = function(request, spacesDeleteCallback) {
    console.log(request);
    //this essentially removes yourself from stewardship of the space
    //check that namespace exists
    //check if there are any currencies or accounts using this space
    //delete space globally
    //delete space locally
    //notify those affected
    var error = {};
    error.status = 503;
    error.code = 2009;
    error.message = 'method not implemented at this time.';
    spacesDeleteCallback(error, false);
};

// Currencies
exports.currenciesList = function(request, currenciesListCallback) {
    console.log(request);

    //TODO: filter by namespace

    stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            currenciesListCallback(err, false);
        } else {
            var parallelTasks = {};
            steward_bucket.value.currencies.forEach(function(currencyID){
                //console.log("currencyID:" + currencyID);
                parallelTasks[currencyID] = function(callback) {
                    openmoney_bucket.get(currencyID,function(err,currency){
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
                    console.log(results);
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
    //stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + getHash(request.publicKey) + 'currencies~%";';
    //console.log(queryString);
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        currenciesListCallback(err,false);
    //    } else {
    //        console.log( results);
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        currenciesListCallback(null, response);
    //    }
    //});
};

exports.currenciesPost = function(request, currenciesPostCallback) {
    //console.log(request);
    //check that currency is formed properly
    //request.stewardname
    //request.namespace
    //request.currency
    request.currency.created = new Date().getTime();
    request.currency.created_by = request.stewardname.toLowerCase();
    request.currency.id = "currencies~" + request.currency.currency.toLowerCase() + "." + request.currency.currency_namespace.toLowerCase();
    request.currency.type = "currencies";

    var currency = {};
    currency.currency = request.currency.currency.toLowerCase();
    currency.currency_namespace = request.currency.currency_namespace.toLowerCase();
    for(var i = 0; i < request.currency.stewards.length; i++){
      request.currency.stewards[i] = request.currency.stewards[i].toLowerCase();
    }
    currency.stewards = request.currency.stewards;
    currency.type = 'currencies';
    currency.id = request.currency.id;
    currency.disabled = false;
    currency.private = false;
    if(typeof request.currency.disabled != 'undefined'){
      currency.disabled = request.currency.disabled;
    }
    if(typeof request.currency.currency_name != 'undefined'){
      currency.currency_name = request.currency.currency_name;
    }
    if(typeof request.currency.currency_color != 'undefined'){
      currency.currency_color = request.currency.currency_color;
    }
    if(typeof request.currency.contributionPerPatron != 'undefined'){
      currency.contributionPerPatron = request.currency.contributionPerPatron;
    }
    if(typeof request.currency.default != 'undefined'){
      currency.default = request.currency.default;
    }
    if(typeof request.currency.private != 'undefined'){
      currency.private = request.currency.private;
    }


    //check namespace exists
    var parallelTasks = {};
    parallelTasks.namespace_check = function(callback) {
        openmoney_bucket.get("namespaces~" + request.currency.currency_namespace.toLowerCase(), function(err, namespace){
            if(err) {
                callback(err, null);
            } else {
                callback(null,namespace);
            }
        });
    };

    //check stewards exist
    request.currency.stewards.forEach(function(steward){
        parallelTasks[steward] = function(callback) {
            openmoney_bucket.get(steward.toLowerCase(), function (err, steward) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, steward);
                }
            });
        };
    });

    //check that currency doesn't exist
    parallelTasks.currency_check = function(callback) {
        openmoney_bucket.get(currency.id.toLowerCase(), function(err, currency){
            if(err){
                if(err.code == 13){
                    callback(null,true);
                } else {
                    callback(err, null);
                }
            } else {
                console.log(currency);

                var error = {};
                error.status = 403;
                error.code = 3001;
                error.message = "Currency Exists.";
                callback(error, null);
            }
        })
    };

    //check that there isn't another space or account that exists with the same name in the space
    parallelTasks.space_check = function(callback) {
        openmoney_bucket.get("namespaces~" + request.currency.currency.toLowerCase() + "." + request.currency.currency_namespace.toLowerCase(), function(err, space){
            if(err){
                if(err.code == 13){
                    callback(null,true);
                } else {
                    callback(err, null);
                }
            } else {
                //check this space is the steward
                var is_steward = false;
                space.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname.toLowerCase()){
                        is_steward = true;
                    }
                });
                if(is_steward) {
                    callback(null, space.value);
                } else {
                    var error = {};
                    error.status = 403;
                    error.code = 3002;
                    error.message = "Space exists with that currency name.";
                    callback(error, null);
                }
            }
        })
    };

    //check that there isn't another space or account that exists with the same name in the space
    parallelTasks.accounts_check = function(callback) {
        openmoney_bucket.get("accountsList~" + request.currency.currency.toLowerCase() + "." + request.currency.currency_namespace.toLowerCase(), function(err, accountsList){
            if(err){
                if(err.code == 13){
                    callback(null, true);
                } else {
                    callback(err, null);
                }
            } else {
                var getListTasks = {};
                accountsList.value.list.forEach(function(accountID) {
                    getListTasks[accountID] = function(cb) {
                        openmoney_bucket.get(accountID, function(err, account){
                            if(err) {
                                if(err.code == 13) {
                                    cb(null, true);
                                } else {
                                    cb(err, null);
                                }
                            } else {
                                //check this account is the steward
                                var is_steward = false;
                                account.value.stewards.forEach(function(steward){
                                    if(steward == "stewards~" + request.stewardname.toLowerCase()){
                                        is_steward = true;
                                    }
                                });
                                if(is_steward) {
                                    cb(null, account.value);
                                } else {
                                    var error = {};
                                    error.status = 403;
                                    error.code = 3002;
                                    error.message = "Account exists with that currency name.";
                                    callback(error, null);
                                }
                            }
                        })
                    }
                });

                async.parallel(getListTasks, function(err, results){
                    if(err) {
                        callback(err, null);
                    } else {
                        callback(null, results);
                    }
                })
            }
        })
    };

    async.parallel(parallelTasks, function(err, results){
        if(err) {
            currenciesPostCallback(err, null);
        } else {
            console.log(results);

            //create the currency
            var parallelInsertTasks = {};
            parallelInsertTasks.insert_currency = function(callback) {
                console.info('insert currency:')
                console.info(currency);
                openmoney_bucket.insert(currency.id, currency, function(err, ok) {
                    if(err) {
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                });
            };

            request.currency.stewards.forEach(function(steward) {
                parallelInsertTasks['insert_currency_in_stewards_bucket' + steward] = function(callback) {
                    openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                        if (err) {
                            callback(err, null);
                        } else {
                            stewards_bucket.get("steward_bucket~" + getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    if(steward_bucket.value.currencies.indexOf(request.currency.id.toLowerCase()) === -1){
                                      steward_bucket.value.currencies.push(request.currency.id.toLowerCase());
                                    }
                                    stewards_bucket.replace("steward_bucket~" + getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                                        if (err) {
                                            if(err.code == 12){
                                              //retry
                                              parallelInsertTasks['insert_currency_in_stewards_bucket' + steward](callback);
                                            } else {
                                              callback(err, null);
                                            }
                                        } else {
                                            callback(null, ok);
                                        }
                                    });
                                }
                            });
                        }
                    });
                };
            });


            //find all the parents of this curreny namespace and insert this namespace into their children document.
            //grandchild.child.parent.grandparent
            //child.parent.grandparent
            //parent.grandparent
            //grandparent
            var currency_namespace = request.currency.currency.toLowerCase() + "." + request.currency.currency_namespace.toLowerCase();
            var parents = currency_namespace.toLowerCase().split('.');
            for(var i = 1; i < parents.length ;i++ ){ // start with second item
                for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                    parents[i] += "." + parents[j];
                }
            }
            parents.shift(); //remove this namespace at the head of the list
            parents.forEach(function(parent){
                parallelInsertTasks["parent" + parent] = function(callback){
                    openmoney_bucket.get("currency_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        if(err){
                            if(err.code == 13){
                                //create a document for this parents namespaces children
                                var children_reference = {};
                                children_reference.type = "currency_namespaces_children";
                                children_reference.children = [ request.currency.id.toLowerCase() ];
                                children_reference.id = children_reference.type + "~" + parent;
                                children_reference.id = children_reference.id.toLowerCase();
                                openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                                    if(err){
                                       if(err.code == 12){
                                          //try again
                                          parallelInsertTasks["parent" + parent](callback);
                                       } else {
                                         callback(err, null);
                                       }
                                    } else {
                                        callback(null, ok);
                                    }
                                });
                            } else {
                                callback(err, null);
                            }
                        } else {
                            if(parentChildrenDoc.value.children.indexOf(request.currency.id.toLowerCase()) === -1){
                              parentChildrenDoc.value.children.push( request.currency.id.toLowerCase() );
                              openmoney_bucket.replace("currency_namespaces_children~" + parent.toLowerCase(), parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
                                  if(err){
                                      if(err.code == 12){
                                        //try again
                                        parallelInsertTasks["parent" + parent](callback);
                                      } else {
                                        callback(err, null);
                                      }
                                  } else {
                                      callback(null, ok);
                                  }
                              });
                            } else {
                              callback(null, parentChildrenDoc.value);
                            }
                        }
                    });
                };
            });

            async.series(parallelInsertTasks, function(err, ok) {
                if(err) {
                    currenciesPostCallback(err, null);
                } else {
                    console.log(ok);
                    //TODO: notify the space steward
                    var response = {};
                    response.ok = true;
                    response.id = request.currency.id.toLowerCase();
                    currenciesPostCallback(null, response);
                }
            });

        }
    });

    //var error = {};
    //error.status = 503;
    //error.code = 3001;
    //error.message = 'method not implemented at this time.';
    //currenciesPostCallback(error, false);
};

//when you get a specific currency if found it adds it to your known currencies.
exports.currenciesGet = function(request, currenciesGetCallback) {
    console.log(request);
    openmoney_bucket.get('currencies~' + request.currency.toLowerCase() + '.' + request.namespace.toLowerCase(), function(err, results) {
        if (err) {
            currenciesGetCallback(err);
        } else {
            console.log(results);
            if(results.value.private) {
              var error = {};
              error.status = 403;
              error.code = 2009;
              error.message = 'Cannot add a private currency.';
              currenciesGetCallback(error);
            } else {
              stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function (err, steward_bucket) {
                  if (err) {
                      currenciesGetCallback(err);
                  } else {
                      if(steward_bucket.value.currencies.indexOf(results.value.id.toLowerCase()) !== -1){
                        currenciesGetCallback(null, results.value);
                      } else {

                        steward_bucket.value.currencies.push(results.value.id.toLowerCase());

                        //add stewards of currency to users stewards list
                        results.value.stewards.forEach(function(steward){
                          if(steward_bucket.value.stewards.indexOf(steward) === -1){
                            steward_bucket.value.stewards.push(steward);
                          }
                        });

                        stewards_bucket.replace("steward_bucket~" + getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                            if (err) {
                                callcurrenciesGetCallbackback(err);
                            } else {
                                currenciesGetCallback(null, results.value);
                            }
                        });
                      }
                  }
              });
            }
        }
    });
};

exports.currenciesPut = function(request, currenciesPutCallback) {
    console.log("request:");
    console.log(request);
    // var error = {};
    // error.status = 503;
    // error.code = 3001;
    // error.message = 'method not implemented at this time.';
    // currenciesPutCallback(error, null);

    //console.log(request);
    //check that currency is formed properly
    //request.stewardname
    //request.namespace
    //request.currency
    // request.currency.modified = new Date().getTime();
    // request.currency.modified_by = request.stewardname.toLowerCase();

    request.currencies.id = "currencies~" + request.currencies.currency.toLowerCase() + "." + request.currencies.currency_namespace.toLowerCase();
    request.currencies.type = "currencies";

    var currency = {};
    currency.currency = request.currencies.currency.toLowerCase();
    currency.currency_namespace = request.currencies.currency_namespace.toLowerCase();
    for(var i = 0; i < request.currencies.stewards.length; i++){
      request.currencies.stewards[i] = request.currencies.stewards[i].toLowerCase();
    }
    currency.stewards = request.currencies.stewards;
    currency.type = 'currencies';
    currency.id = request.currencies.id;
    if(typeof request.currencies.currency_name != 'undefined'){
      currency.currency_name = request.currencies.currency_name;
    }
    if(typeof request.currencies.currency_color != 'undefined'){
      currency.currency_color = request.currencies.currency_color;
    }
    if(typeof request.currencies.contributionPerPatron != 'undefined'){
      currency.contributionPerPatron = request.currencies.contributionPerPatron;
    }
    if(typeof request.currencies.private != 'undefined'){
      currency.private = request.currencies.private;
    }
    if(typeof request.currencies.disabled != 'undefined'){
      currency.disabled = request.currencies.disabled;
    }

    var old_currency = {};
    old_currency.id = "currencies~" + request.currency.toLowerCase() + "." + request.namespace.toLowerCase();

    openmoney_bucket.get(old_currency.id, function(err, oldCurrency){
        if(err) {
            currenciesPutCallback(err);
        } else {
            var is_steward = false;
            oldCurrency.value.stewards.forEach(function(steward){
              if(steward == "stewards~" + request.stewardname.toLowerCase()){
                is_steward = true;
              }
            });
            if(!is_steward){
              var error = {};
              error.status = 403;
              error.code = 3000;
              error.message = "You are not the steward of this currency.";
              currenciesPutCallback(error, null);
            } else {
              var change = false;
              if(oldCurrency.value.currency != currency.currency){
                console.log('currency is not the same.', oldCurrency.value.currency, currency.currency);
                change = true;
              }
              if(oldCurrency.value.currency_namespace != currency.currency_namespace){
                console.log('currency_namespace is not the same.', oldCurrency.value.currency_namespace, currency.currency_namespace);
                change = true;
              }
              if (oldCurrency.value.stewards.equals(currency.stewards) === false) {
                console.log('stewards are not the same.', oldCurrency.value.stewards, currency.stewards);
                change = true;
              }
              if(change){
                //TODO: implement currency name change, currency_namepsace change, and stewards change.
                var error = {};
                error.status = 503;
                error.code = 3001;
                error.message = 'method not implemented at this time.';
                currenciesPutCallback(error, null);
              } else {

                var parallelTasks = {};

                if(typeof request.currencies.disabled != 'undefined'){
                  delete(oldCurrency.value.enabled);
                  if(typeof oldCurrency.value.disabled != 'undefined'){
                    if(oldCurrency.value.disabled != request.currencies.disabled){
                      change = true;
                      oldCurrency.value.disabled = request.currencies.disabled;//santize with swagger api to truthy
                    } else {
                      //they are the same no change
                    }
                  } else {
                    //it's not defined in the old doc
                    change = true;
                    oldCurrency.value.disabled = request.currencies.disabled;//santize with swagger api to truthy
                  }
                } else {
                  //leave it undefined
                  oldCurrency.value.disabled = false;
                  delete(oldCurrency.value.enabled);
                }

                if(typeof request.currencies.private != 'undefined'){
                  if(typeof oldCurrency.value.private != 'undefined'){
                    if(oldCurrency.value.private != request.currencies.private){
                      change = true;
                      oldCurrency.value.private = request.currencies.private;//santize with swagger api to truthy
                    } else {
                      //they are the same no change
                    }
                  } else {
                    //it's not defined in the old doc
                    change = true;
                    oldCurrency.value.private = request.currencies.private;//santize with swagger api to truthy
                  }
                } else {
                  //leave it undefined
                  oldCurrency.value.private = false;
                }

                if(typeof request.currencies.default != 'undefined'){
                  if(typeof oldCurrency.value.default != 'undefined'){
                    if(oldCurrency.value.default != request.currencies.default){
                      change = true;
                      oldCurrency.value.default = request.currencies.default;//santize with swagger api to truthy
                    } else {
                      //they are the same no change
                    }
                  } else {
                    //it's not defined in the old doc
                    change = true;
                    oldCurrency.value.default = request.currencies.default;//santize with swagger api to truthy
                  }
                } else {
                  //leave it undefined
                }


                if(typeof currency.currency_name != 'undefined' && typeof oldCurrency.value.currency_name != 'undefined'){
                  if(oldCurrency.value.currency_name != currency.currency_name){
                    change = true;
                    oldCurrency.value.currency_name = currency.currency_name;
                  }
                } else if(typeof currency.currency_name != 'undefined'){
                  change = true;
                  oldCurrency.value.currency_name = currency.currency_name;
                }

                if(typeof currency.currency_color != 'undefined' && typeof oldCurrency.value.currency_color != 'undefined'){
                  if(oldCurrency.value.currency_color != currency.currency_color){
                    change = true;
                    oldCurrency.value.currency_color = currency.currency_color;
                  }
                } else if(typeof currency.currency_color != 'undefined'){
                  change = true;
                  oldCurrency.value.currency_color = currency.currency_color;
                }

                if(typeof currency.contributionPerPatron != 'undefined' && typeof oldCurrency.value.contributionPerPatron != 'undefined'){
                  if(oldCurrency.value.contributionPerPatron != currency.contributionPerPatron){
                    change = true;
                    oldCurrency.value.contributionPerPatron = currency.contributionPerPatron;
                  }
                } else if(typeof currency.contributionPerPatron != 'undefined'){
                  change = true;
                  oldCurrency.value.contributionPerPatron = currency.contributionPerPatron;
                }

                // parallelTasks.namespace_check = function(callback) {
                //     openmoney_bucket.get("namespaces~" + currency.currency_namespace.toLowerCase(), function(err, namespace){
                //         if(err) {
                //             callback(err, null);
                //         } else {
                //             callback(null,namespace);
                //         }
                //     });
                // };
                //
                // //check stewards exist
                // currency.stewards.forEach(function(steward){
                //     parallelTasks[steward] = function(callback) {
                //         openmoney_bucket.get(steward.toLowerCase(), function (err, steward) {
                //             if (err) {
                //                 callback(err, null);
                //             } else {
                //                 callback(null, steward);
                //             }
                //         });
                //     };
                // });
                //
                // //check that currency doesn't exist
                // parallelTasks.currency_check = function(callback) {
                //     openmoney_bucket.get(currency.id.toLowerCase(), function(err, currency){
                //         if(err){
                //             if(err.code == 13){
                //                 callback(null,true);
                //             } else {
                //                 callback(err, null);
                //             }
                //         } else {
                //             console.log(currency);
                //
                //             var error = {};
                //             error.status = 403;
                //             error.code = 3001;
                //             error.message = "Currency Exists.";
                //             callback(error, null);
                //         }
                //     })
                // };
                //
                // //check that there isn't another space or account that exists with the same name in the space
                // parallelTasks.space_check = function(callback) {
                //     openmoney_bucket.get("namespaces~" + currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase(), function(err, space){
                //         if(err){
                //             if(err.code == 13){
                //                 callback(null,true);
                //             } else {
                //                 callback(err, null);
                //             }
                //         } else {
                //             //check this space is the steward
                //             var is_steward = false;
                //             space.value.stewards.forEach(function(steward){
                //                 if(steward == "stewards~" + request.stewardname.toLowerCase()){
                //                     is_steward = true;
                //                 }
                //             });
                //             if(is_steward) {
                //                 callback(null, space.value);
                //             } else {
                //                 var error = {};
                //                 error.status = 403;
                //                 error.code = 3002;
                //                 error.message = "Space exists with that currency name.";
                //                 callback(error, null);
                //             }
                //         }
                //     })
                // };
                //
                // //check that there isn't another space or account that exists with the same name in the space
                // parallelTasks.accounts_check = function(callback) {
                //     openmoney_bucket.get("accountsList~" + currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase(), function(err, accountsList){
                //         if(err){
                //             if(err.code == 13){
                //                 callback(null, true);
                //             } else {
                //                 callback(err, null);
                //             }
                //         } else {
                //             var getListTasks = {};
                //             accountsList.value.list.forEach(function(accountID) {
                //                 getListTasks[accountID] = function(cb) {
                //                     openmoney_bucket.get(accountID, function(err, account){
                //                         if(err) {
                //                             if(err.code == 13) {
                //                                 cb(null, true);
                //                             } else {
                //                                 cb(err, null);
                //                             }
                //                         } else {
                //                             //check this account is the steward
                //                             var is_steward = false;
                //                             account.value.stewards.forEach(function(steward){
                //                                 if(steward == "stewards~" + request.stewardname.toLowerCase()){
                //                                     is_steward = true;
                //                                 }
                //                             });
                //                             if(is_steward) {
                //                                 cb(null, account.value);
                //                             } else {
                //                                 var error = {};
                //                                 error.status = 403;
                //                                 error.code = 3002;
                //                                 error.message = "Account exists with that currency name.";
                //                                 callback(error, null);
                //                             }
                //                         }
                //                     })
                //                 }
                //             });
                //
                //             async.parallel(getListTasks, function(err, results){
                //                 if(err) {
                //                     callback(err, null);
                //                 } else {
                //                     callback(null, results);
                //                 }
                //             })
                //         }
                //     })
                // };

                async.parallel(parallelTasks, function(err, results){
                    if(err) {
                        currenciesPutCallback(err, null);
                    } else {
                        console.log(results);

                        //create the currency
                        var parallelInsertTasks = {};
                        parallelInsertTasks.update_currency = function(callback) {
                            console.info('update currency:')
                            console.info(oldCurrency);
                            openmoney_bucket.replace(oldCurrency.value.id, oldCurrency.value, {cas: oldCurrency.cas}, function(err, ok) {
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        };

                        //No curency steward change so this is not nessesary
                        // parallelInsertTasks.insert_currency_in_stewards_bucket = function(callback) {
                        //     request.currency.stewards.forEach(function(steward) {
                        //         openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                        //             if (err) {
                        //                 callback(err, null);
                        //             } else {
                        //                 stewards_bucket.get("steward_bucket~" + getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                        //                     if (err) {
                        //                         callback(err, null);
                        //                     } else {
                        //                         steward_bucket.value.currencies.push(request.currency.id.toLowerCase());
                        //                         stewards_bucket.replace("steward_bucket~" + getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                        //                             if (err) {
                        //                                 callback(err, null);
                        //                             } else {
                        //                                 callback(null, ok);
                        //                             }
                        //                         });
                        //                     }
                        //                 });
                        //             }
                        //         });
                        //     });
                        // };

                        // //find all the parents of this curreny namespace and insert this namespace into their children document.
                        // //grandchild.child.parent.grandparent
                        // //child.parent.grandparent
                        // //parent.grandparent
                        // //grandparent
                        // var currency_namespace = currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase();
                        // var parents = currency_namespace.toLowerCase().split('.');
                        // for(var i = 1; i < parents.length ;i++ ){ // start with second item
                        //     for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                        //         parents[i] += "." + parents[j];
                        //     }
                        // }
                        // parents.shift(); //remove this namespace at the head of the list
                        // parents.forEach(function(parent){
                        //     parallelInsertTasks["parent" + parent] = function(callback){
                        //         openmoney_bucket.get("currency_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        //             if(err){
                        //                 if(err.code == 13){
                        //                     //create a document for this parents namespaces children
                        //                     var children_reference = {};
                        //                     children_reference.type = "currency_namespaces_children";
                        //                     children_reference.children = [ request.currency.id.toLowerCase() ];
                        //                     children_reference.id = children_reference.type + "~" + parent;
                        //                     children_reference.id = children_reference.id.toLowerCase();
                        //                     openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                        //                         if(err){
                        //                             callback(err, null);
                        //                         } else {
                        //                             callback(null, ok);
                        //                         }
                        //                     });
                        //
                        //                 } else {
                        //                     callback(err, null);
                        //                 }
                        //             } else {
                        //                 parentChildrenDoc.value.children.push( request.currency.id.toLowerCase() );
                        //                 openmoney_bucket.replace("currency_namespaces_children~" + parent.toLowerCase(), parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
                        //                     if(err){
                        //                         callback(err, null);
                        //                     } else {
                        //                         callback(null, ok);
                        //                     }
                        //                 });
                        //             }
                        //         });
                        //     };
                        // });

                        async.parallel(parallelInsertTasks, function(err, ok) {
                            if(err) {
                                currenciesPutCallback(err, null);
                            } else {

                                //TODO: notify the space steward

                                var response = {};
                                response.ok = true;
                                response.id = currency.id.toLowerCase();
                                currenciesPutCallback(null, response);
                            }//else err
                        });//async
                    }//else err
                });//asnyc
              }//else core change
            }//else steward
        }//oldCreency else
    });//get oldcreency
};//currenciesPut

exports.currenciesDelete = function(request, currenciesDeleteCallback) {
    console.log(request);
    var error = {};
    error.status = 503;
    error.code = 3001;
    error.message = 'method not implemented at this time.';

    currenciesDeleteCallback(error, null);
};

// Accounts
exports.accountsList = function(request, accountsListCallback) {
    //console.log(request);

    stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,steward_bucket) {
        if(err) {
            accountsListCallback(err, false);
        } else {
            var parallelTasks = {};
            console.log('accountsList.steward_bucket_doc', steward_bucket);
            steward_bucket.value.accounts.forEach(function(accountID){
                //console.log("accountID:" + accountID);
                parallelTasks[accountID] = function(callback) {
                    openmoney_bucket.get(accountID,function(err,account){
                        if(err) {
                            console.log('accountsList.accountID', accountID, err);
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
                    //console.log(results);
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
    //stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + getHash(request.publicKey) + 'accounts~%";';
    //console.log(queryString);
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        accountsListCallback(err,false);
    //    } else {
    //        console.log( results);
    //        var response = [];
    //        for(i in results) {
    //            //console.log('Row:', results[i]);
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        accountsListCallback(null, response);
    //    }
    //});
};

exports.accountsPost = function(request, accountsPostCallback) {
    console.log("accountsPost");
    //console.log(request);
    //check the format of the request
    //request.stewardname
    //request.namespace
    //request.account
    //request.publicKey
    //request.account.created = new Date().getTime();
    //request.account.created_by = "stewards~" + request.stewardname;
    request.stewardname = request.stewardname.toLowerCase();
    var currency = request.account.currency_namespace == ''? request.account.currency.toLowerCase() : request.account.currency.toLowerCase() + "." + request.account.currency_namespace.toLowerCase();

    var account = {};
    account.id = "accounts~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase() + '~' + currency;
    account.account = request.account.account.toLowerCase();
    account.account_namespace = request.account.account_namespace.toLowerCase();
    account.currency = request.account.currency.toLowerCase();
    account.currency_namespace = typeof request.account.currency_namespace == 'undefined' ? '' : request.account.currency_namespace.toLowerCase();
    account.stewards = request.account.stewards;
    for(var i = 0; i < account.stewards.length; i++){
      account.stewards[i] = account.stewards[i].toLowerCase();
    }
    if(typeof request.account.publicKey != 'undefined'){
        account.pubicKey = request.account.publicKey;
    }
    if(typeof request.account.disabled != 'undefined') {
        account.disabled = request.account.disabled;
    }
    account.created = new Date().getTime();
    account.created_by = "stewards~" + request.stewardname.toLowerCase();

    //check that the account space exists
    var parallelTasks = {};
    parallelTasks.space_check = function(callback) {
        openmoney_bucket.get("namespaces~" + request.account.account_namespace.toLowerCase(), function(err, namespace){
            if(err){
                //console.log("spaces not found");
                var err = {};
                err.status = 404;
                err.code = 4005;
                err.message = "Account namespace does not exist.";
                callback(err, null);
            } else {
                callback(null, namespace);
            }
        });
    };

    //check that the currency exists
    parallelTasks.currency_check = function(callback) {
        openmoney_bucket.get("currencies~" + currency, function(err, currencydoc){
            if(err) {
                //console.log("currency not found");
                var err = {};
                err.status = 404;
                err.code = 4006;
                err.message = "Account currency does not exist."
                callback(err, null);
            } else {
                callback(null, currencydoc);
            }
        });
    };

    //check that stewards exists
    request.account.stewards.forEach(function(steward){
        parallelTasks[steward.toLowerCase()] = function(callback) {
            openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                if (err) {
                    console.log("stewards not found");
                    var err = {};
                    err.status = 404;
                    err.code = 4007;
                    err.message = "Account stewards do not exist.";
                    callback(err, null);
                } else {
                    callback(null, stewardDoc.value);
                }
            });
        };
    });

    //check that the account is not taken by another accounts, spaces or currencies
    parallelTasks.accounts_exists_check = function(callback){
        openmoney_bucket.get("accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, accountList){
            if(err){
                if(err.code == 13) {
                    callback(null, true);
                } else {
                    callback(err, null);
                }
            } else {
                console.info("There are accounts with that name");
                console.info(accountList.value);
                //there are accounts with that name
                var parallelAccountTasks = {};
                //check who is the steward of the accounts if this is the steward then allow.
                accountList.value.list.forEach(function(accountID){
                    parallelAccountTasks[accountID] = function(callback) {
                        openmoney_bucket.get(accountID, function(err, thisAccount){
                            if(err) {
                                callback(err, null);
                            } else {
                                var is_steward = false;
                                thisAccount.value.stewards.forEach(function(steward){
                                    console.log(steward);
                                    if(steward == "stewards~" + request.stewardname.toLowerCase()) {
                                        is_steward = true;
                                    }
                                });
                                if(is_steward) {
                                    if(thisAccount.value.currency.toLowerCase() == request.account.currency.toLowerCase() &&
                                        thisAccount.value.currency_namespace.toLowerCase() == request.account.currency_namespace.toLowerCase()){
                                        var error = {};
                                        error.status = 403;
                                        error.code = 4008;
                                        error.message = 'You already created this account.';
                                        callback(error, null);
                                    } else {
                                        callback(null, account);
                                    }
                                } else {
                                    var error = {};
                                    error.status = 403;
                                    error.code = 4009;
                                    error.message = 'There is another account with that name.';
                                    callback(error, null);
                                }
                            }
                        })
                    };
                });

                async.parallel(parallelAccountTasks, function(err, ok){
                    if(err){
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                });
            }
        });
    };

    parallelTasks.spaces_exists_check = function(callback) {
        openmoney_bucket.get("namespaces~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, namespace){
            if(err) {
                if(err.code == 13) {
                    callback(null, true);
                } else {
                    callback(err, null);
                }
            } else {
                //namespace exists check if this is steward of namespace
                var is_steward = false;
                namespace.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname.toLowerCase()) {
                        is_steward = true;
                    }
                });
                if(is_steward) {
                    callback(null, namespace);
                } else {
                    var error = {};
                    error.status = 403;
                    error.code = 4002;
                    error.message = "Namespace exists with that name.";
                    callback(err, null);
                }
            }
        })
    };

    parallelTasks.currencies_exists_check = function(callback) {
        openmoney_bucket.get("currencies~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, currency){
            if(err) {
                if(err.code == 13) {
                    callback(null, true);
                } else {
                    callback(err, null);
                }
            } else {
                //namespace exists check if this is steward of namespace
                var is_steward = false;
                currency.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname.toLowerCase()) {
                        is_steward = true;
                    }
                });
                if(is_steward) {
                    callback(null, currency);
                } else {
                    var error = {};
                    error.status = 403;
                    error.code = 4003;
                    error.message = "Currency exists with that name.";
                    callback(err, null);
                }
            }
        })
    };

    if(typeof account.publicKey != 'undefined') {
        parallelTasks.publicKey_check = function (callback) {
            stewards_bucket.get("AccountsPublicKey~" + getHash(account.publicKey), function (err, doc) {
                if (err) {
                    if (err.code == 13) {
                        //not found
                        callback(null, true);
                    } else {
                        callback(err, null);
                    }
                } else {
                    var err = {};
                    err.status = 403;
                    err.code = 4012;
                    err.message = "The public key of this account is not unique.";
                    callback(err, null);
                }
            })
        };
    }

    async.parallel(parallelTasks, function(err, results){
        if(err) {
            console.log('parallelTasks error:', err);
            accountsPostCallback(err, null);
        } else {
            console.log('parallelTasks results:',results);
            //create the account

            var parallelInsertTasks = {};
            parallelInsertTasks.account = function(callback){
                openmoney_bucket.insert(account.id, account, function(err, ok){
                    if(err){
                        console.log('account insert error', err)
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                })
            };

            //add the account to an account list
            parallelInsertTasks.accountList = function(callback){
                openmoney_bucket.get("accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, accountsList){
                    if(err){
                        if(err.code==13){
                            //insert doc
                            var accountsList = {};
                            accountsList.id = "accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase();
                            accountsList.type = "accountsList";
                            accountsList.list = [ account.id ];
                            openmoney_bucket.insert(accountsList.id, accountsList, function(err, ok){
                                if(err){
                                    console.log('insert accountsList error:', accountsList.id, err);
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            })
                        } else {
                            console.log('get ' + "accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase() + ' accountsList error', err)
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        accountsList.value.list.push(account.id);
                        openmoney_bucket.upsert(accountsList.value.id, accountsList.value, {cas: accountsList.cas}, function(err, ok){
                            if(err){
                                console.log('upsert accountslist error:', accountsList.value.id, err);
                                callback(err, null);
                            } else {
                                callback(null, ok);
                            }
                        })
                    }
                });
            };

            if(typeof account.publicKey != 'undefined'){
                parallelInsertTasks.publicKey = function(callback){
                    var publicKeyDoc = {};
                    publicKeyDoc.type = "AccountsPublicKey";
                    publicKeyDoc.id = publicKeyDoc.type + "~" + getHash(account.publicKey);
                    publicKeyDoc.account = account.id;
                    openmoney_bucket.insert(publicKeyDoc.id, publicKeyDoc, function(err, ok){
                        if(err){
                            console.log('insert account public key error', publicKeyDoc.id, err)
                            callback(err, null);
                        } else {
                            callback(null, ok);
                        }
                    })
                };
            }

            var value_reference = {};
            value_reference.type = "value_reference";
            value_reference.documents = ["steward_bucket~" + getHash(request.publicKey) ];
            value_reference.id = account.id;
            parallelInsertTasks.value_reference = function(callback) {
                stewards_bucket.insert(value_reference.id, value_reference, function(err, ok){
                    if(err) {
                        console.log('insert value_reference error', value_reference.id, err)
                        callback(err, null);
                    } else {
                        callback(null, value_reference.id);
                    }
                });
            };

            //insert the account into the known accounts of the currency stewards
            results.currency_check.value.stewards.forEach(function(steward){
                //this intentionally has the same name as the next function so that it only does it once per steward.
                parallelInsertTasks[steward.toLowerCase()] = function(callback){
                    console.log('updating', steward.toLowerCase());
                    //console.log("get Steward: " + steward);
                    openmoney_bucket.get(steward.toLowerCase(), function(err, stewardDoc){
                        if(err){
                            console.log('error getting steward doc', steward.toLowerCase(), err)
                            callback(err, null);
                        } else {
                            //console.log("get Steward bucket: " + "steward_bucket~" + getHash(stewardDoc.value.publicKey));
                            stewards_bucket.get("steward_bucket~" + getHash(stewardDoc.value.publicKey), function(err, steward_bucket) {
                                if(err) {
                                    console.log('error getting steward_bucket', getHash(stewardDoc.value.publicKey), err)
                                    callback(err, null);
                                } else {
                                    //console.log("steward bucket" + JSON.stringify(steward_bucket.value));
                                    steward_bucket.value.accounts.push(account.id);

                                    //add namespace if it doesn't exist
                                    var namespace_exists = false;
                                    if(typeof steward_bucket.value.namespaces == 'undefined'){
                                      steward_bucket.value.namespaces = [];
                                    }
                                    steward_bucket.value.namespaces.forEach(function(namespaceID){
                                      if(namespaceID == "namespaces~" + request.account.account_namespace.toLowerCase()){
                                        namespace_exists = true;
                                      }
                                    });
                                    if(!namespace_exists){
                                      steward_bucket.value.namespaces.push("namespaces~" + request.account.account_namespace.toLowerCase());
                                    }
                                    //add stewards if they don't exist
                                    if(typeof steward_bucket.value.stewards == 'undefined'){
                                      steward_bucket.value.stewards = [];
                                    }
                                    account.stewards.forEach(function(steward){
                                      var steward_exists = false;
                                      steward_bucket.value.stewards.forEach(function(stewardID){
                                        if(stewardID == steward.toLowerCase()){
                                          steward_exists = true;
                                        }
                                      });
                                      if(!steward_exists){
                                        steward_bucket.value.stewards.push(steward.toLowerCase());
                                      }
                                    });
                                    stewards_bucket.replace("steward_bucket~" + getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function(err, ok){
                                        if(err) {
                                            console.log('error replacing steward bucket', err);
                                            if(err.code == 12){
                                              //try again
                                              parallelInsertTasks[steward.toLowerCase()](callback);
                                            } else {
                                              callback(err, null);
                                            }

                                        } else {
                                            //console.log("Get account value refrence:" + account.id);
                                            //get value reference doc and update
                                            stewards_bucket.get(account.id, function(err, valRefDoc){
                                                if(err) {
                                                    callback(err, null);
                                                } else {
                                                    //if this reference doesn't exist add it
                                                    var index = valRefDoc.value.documents.indexOf("steward_bucket~" + getHash(stewardDoc.value.publicKey));
                                                    if( index === -1){
                                                        valRefDoc.value.documents.push("steward_bucket~" + getHash(stewardDoc.value.publicKey));
                                                        stewards_bucket.upsert(account.id, valRefDoc.value, {cas: valRefDoc.cas},function(err, ok){
                                                            if(err){
                                                                console.log('error updating value ref', account.id, err)
                                                                callback(err, null);
                                                            } else {
                                                                callback(null, ok);
                                                            }
                                                        });
                                                    } else {
                                                        callback(null, ok);
                                                    }
                                                }
                                            });

                                        }
                                    });
                                }
                            });
                        }
                    });
                };
            })

            //update the stewards of this account list of known accounts, currencies, namespaces and stewards
            account.stewards.forEach(function(steward){

                parallelInsertTasks[steward.toLowerCase()] = function(callback) {
                    console.log('updating', steward.toLowerCase());
                    //console.log("get Steward: " + steward);
                    openmoney_bucket.get(steward.toLowerCase(), function(err, stewardDoc){
                        if(err){
                            callback(err, null);
                        } else {
                            //console.log("get Steward bucket: " + "steward_bucket~" + getHash(stewardDoc.value.publicKey));
                            stewards_bucket.get("steward_bucket~" + getHash(stewardDoc.value.publicKey), function(err, steward_bucket) {
                                if(err) {
                                    console.log('accountsPost.error getting stewardBucket~' + getHash(stewardDoc.value.publicKey), err)
                                    callback(err, null);
                                } else {
                                    //console.log("steward bucket" + JSON.stringify(steward_bucket.value));
                                    steward_bucket.value.accounts.push(account.id);
                                    //add currency if it doesn't exist
                                    var currency_exists = false;
                                    if(typeof steward_bucket.value.currencies == 'undefined'){
                                      steward_bucket.value.currencies = [];
                                    }
                                    steward_bucket.value.currencies.forEach(function(currencyID){
                                      if(currencyID == "currencies~" + currency){
                                        currency_exists = true;
                                      }
                                    });
                                    if(!currency_exists){
                                      steward_bucket.value.currencies.push("currencies~" + currency);
                                    }
                                    //add namespace if it doesn't exist
                                    var namespace_exists = false;
                                    if(typeof steward_bucket.value.namespaces == 'undefined'){
                                      steward_bucket.value.namespaces = [];
                                    }
                                    steward_bucket.value.namespaces.forEach(function(namespaceID){
                                      if(namespaceID == "namespaces~" + request.account.account_namespace.toLowerCase()){
                                        namespace_exists = true;
                                      }
                                    });
                                    if(!namespace_exists){
                                      steward_bucket.value.namespaces.push("namespaces~" + request.account.account_namespace.toLowerCase());
                                    }
                                    //add stewards if they don't exist
                                    if(typeof steward_bucket.value.stewards == 'undefined'){
                                      steward_bucket.value.stewards = [];
                                    }
                                    account.stewards.forEach(function(steward){
                                      var steward_exists = false;
                                      steward_bucket.value.stewards.forEach(function(stewardID){
                                        if(stewardID == steward.toLowerCase()){
                                          steward_exists = true;
                                        }
                                      });
                                      if(!steward_exists){
                                        steward_bucket.value.stewards.push(steward.toLowerCase());
                                      }
                                    });
                                    stewards_bucket.replace("steward_bucket~" + getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function(err, ok){
                                        if(err) {
                                            console.log('error replacing steward bucket');
                                            if(err.code == 12){
                                              //call this
                                              parallelInsertTasks[steward.toLowerCase()](callback);
                                            } else {
                                              callback(err, null);
                                            }
                                        } else {
                                            //console.log("Get account value refrence:" + account.id);
                                            //get value reference doc and update
                                            stewards_bucket.get(account.id, function(err, valRefDoc){
                                                if(err) {
                                                    callback(err, null);
                                                } else {
                                                    //if this reference doesn't exist add it
                                                    var index = valRefDoc.value.documents.indexOf("steward_bucket~" + getHash(stewardDoc.value.publicKey));
                                                    if( index === -1){
                                                        valRefDoc.value.documents.push("steward_bucket~" + getHash(stewardDoc.value.publicKey));
                                                        stewards_bucket.upsert(account.id, valRefDoc.value, {cas: valRefDoc.cas},function(err, ok){
                                                            if(err){
                                                                console.log('error upserting value ref', account.id, err)
                                                                callback(err, null);
                                                            } else {
                                                                callback(null, ok);
                                                            }
                                                        });
                                                    } else {
                                                        callback(null, ok);
                                                    }
                                                }
                                            });

                                        }
                                    });
                                }
                            });
                        }
                    });
                };
            });

            //find all the parents of this curreny namespace and insert this namespace into their children document.
            //grandchild.child.parent.grandparent
            //child.parent.grandparent
            //parent.grandparent
            //grandparent
            var account_namespace = request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase();
            var parents = account_namespace.toLowerCase().split('.');
            for(var i = 1; i < parents.length ;i++ ){ // start with second item
                for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                    parents[i] += "." + parents[j];
                }
            }
            parents.shift(); //remove this namespace at the head of the list
            parents.forEach(function(parent){
                parallelInsertTasks["parent" + parent] = function(callback){
                    openmoney_bucket.get("account_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        if(err){
                            if(err.code == 13){
                                //create a document for this parents namespaces children
                                var children_reference = {};
                                children_reference.type = "account_namespaces_children";
                                children_reference.children = [ account.id ];
                                children_reference.id = children_reference.type + "~" + parent;
                                openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                                    if(err){
                                        console.log('error inserting children_reference doc', children_reference.id)
                                        callback(err, null);
                                    } else {
                                        callback(null, ok);
                                    }
                                });

                            } else {
                                callback(err, null);
                            }
                        } else {
                            parentChildrenDoc.value.children.push( account.id );
                            openmoney_bucket.replace("account_namespaces_children~" + parent, parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
                                if(err){
                                    console.log('error replacing account_namespaces_children', "account_namespaces_children~" + parent, err)
                                    if(err.code == 12){
                                      //try again
                                      parallelInsertTasks["parent" + parent](callback);
                                    } else {
                                      callback(err, null);
                                    }
                                } else {
                                    callback(null, ok);
                                }
                            });
                        }
                    });
                };
            });

            //parallel causes issues with document updates on the same document.
            async.series(parallelInsertTasks, function(err, ok){
                if(err) {
                    accountsPostCallback(err, null);
                } else {
                    console.log(ok);

                    //TODO: notify the stewards

                    var response = {};
                    response.ok = true;
                    response.id = account.id;
                    accountsPostCallback(null, response);
                }
            })
        }
    });

    //var error = {};
    //error.status = 503;
    //error.code = 4001;
    //error.message = 'method not implemented at this time.';
    //accountsPostCallback(error, false);
};

exports.accountsGet = function(request, accountsGetCallback) {
    console.log(request);
    var currency = request.currency_namespace == '' ? request.currency.toLowerCase() : request.currency.toLowerCase() + '.' + request.currency_namespace.toLowerCase();
    openmoney_bucket.get('accounts~' + request.account.toLowerCase() + '.' + request.namespace.toLowerCase() + '~' + currency, function(err, results) {
        if (err) {
            accountsGetCallback(err,false);
        } else {
            console.log(results);
            accountsGetCallback(null, results.value);
        }
    });
};

exports.accountsPut = function(request, accountsPutCallback) {
    console.log("accountsPut");
    console.log(request);

    //request.stewardname
    //request.namespace
    //request.account
    //request.accounts
    //request.publicKey

    var currency = request.accounts.currency_namespace == '' ? request.accounts.currency.toLowerCase() : request.accounts.currency.toLowerCase() + "." + request.accounts.currency_namespace.toLowerCase();

    var account = {};
    account.id = "accounts~" + request.accounts.account.toLowerCase() + '.' + request.accounts.account_namespace.toLowerCase() + '~' + currency;
    account.account = request.accounts.account.toLowerCase();
    account.account_namespace = request.accounts.account_namespace.toLowerCase();
    account.currency = request.accounts.currency.toLowerCase();
    account.currency_namespace = typeof request.accounts.currency_namespace == 'undefined' ? '' : request.accounts.currency_namespace.toLowerCase();
    account.stewards = request.accounts.stewards;
    account.stewards.forEach(function(steward){
      steward = steward.toLowerCase();
    })
    if(typeof request.accounts.publicKey != 'undefined'){
        account.pubicKey = request.accounts.publicKey;
    }
    if(typeof request.accounts.disabled != 'undefined') {
        account.disabled = request.accounts.disabled;
    }
    if(typeof request.accounts.currency_disabled != 'undefined') {
        account.currency_disabled = request.accounts.currency_disabled;
    }
    if(typeof request.accounts.namespace_disabled != 'undefined') {
        account.namespace_disabled = request.accounts.namespace_disabled;
    }

    var olddoc_id = "accounts~" + request.account.toLowerCase() + "." + request.namespace.toLowerCase() + "~" + currency;
    console.log(olddoc_id);
    //get the old doc
    openmoney_bucket.get(olddoc_id, function(err, olddoc){
        if(err){
            if(err.code == 13) {
                var err = {};
                err.status = 404;
                err.code = 4010;
                err.message = "Account does not exist.";
                accountsPutCallback(err, null);
            } else {
                accountsPutCallback(err, null);
            }
        } else {
            //update the new doc
            account.created = olddoc.value.created;
            account.created_by = olddoc.value.created_by;
            if(typeof olddoc.value.modifications != 'undefined') {
                account.modifications = olddoc.value.modifications;
            }
            if(typeof olddoc.value.balance != 'undefined'){
              account.balance = olddoc.value.balance;
              account.volume = olddoc.value.volume;
            }

            if(account.currency != olddoc.value.currency || account.currency_namespace != olddoc.value.currency_namespace) {
                //currency has changed or currency namespace has changed
                //console.log(olddoc.value);
                var err = {};
                err.status = 403;
                err.code = 4011;
                err.message = "You cannot change the currency or currency namespace of an account; Create a new account.";
                accountsPutCallback(err, null);

            } else {

                var parallelCheckTasks = {};

                var account_name_change = false;
                //check what has changed
                if(account.account != olddoc.value.account || account.account_namespace != olddoc.value.account_namespace) {
                    //account name has changed or account namespace has changed
                    account_name_change = true;
                    //check that name is not taken by another currency, namespace or account.
                    //check that the account is not taken by another accounts, spaces or currencies
                    parallelCheckTasks.accounts_exists_check = function(callback){
                        openmoney_bucket.get("accountsList~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, accountList){
                            if(err){
                                if(err.code == 13) {
                                    callback(null, true);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                //console.log("There are accounts with that name");
                                //there are accounts with that name
                                var parallelAccountTasks = {};
                                //check who is the steward of the accounts if this is the steward then allow.
                                accountList.value.list.forEach(function(accountID){
                                    parallelAccountTasks[accountID] = function(callback) {
                                        openmoney_bucket.get(accountID, function(err, accountValue){
                                            if(err) {
                                                callback(err, null);
                                            } else {
                                                var is_steward = false;
                                                accountValue.value.stewards.forEach(function(steward){
                                                    if(steward == "stewards~" + request.stewardname.toLowerCase()) {
                                                        is_steward = true;
                                                    }
                                                });
                                                if(is_steward) {
                                                    if(accountValue.value.currency.toLowerCase() == account.currency.toLowerCase() &&
                                                        accountValue.value.currency_namespace.toLowerCase() == account.currency_namespace.toLowerCase()){
                                                        var error = {};
                                                        error.status = 403;
                                                        error.code = 4008;
                                                        error.message = 'You already created this account.';
                                                        callback(error, null);
                                                    } else {
                                                        callback(null, accountValue.value);
                                                    }
                                                } else {
                                                    var error = {};
                                                    error.status = 403;
                                                    error.code = 4009;
                                                    error.message = 'There is another account with that name.';
                                                    callback(error, null);
                                                }
                                            }
                                        })
                                    };
                                });

                                async.parallel(parallelAccountTasks, function(err, ok){
                                    if(err){
                                        callback(err, null);
                                    } else {
                                        callback(null, ok);
                                    }
                                });
                            }
                        });
                    };

                    parallelCheckTasks.currency = function(callback) {
                        openmoney_bucket.get("currencies~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, currency){
                            if(err){
                                if(err.code == 13){
                                    callback(null, true);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                //currency exists
                                //check if this is the steward of that currency
                                var is_steward = false;
                                currency.value.stewards.forEach(function(steward){
                                    if(steward == "stewards" + request.stewardname.toLowerCase()){
                                        is_steward = true;
                                    }
                                });
                                if(is_steward){
                                    callback(null, currency.value);
                                } else {
                                    var err = {};
                                    err.status = 403;
                                    err.code = 4003;
                                    err.message = "Currency exists with that name.";
                                    callback(err, null);
                                }
                            }
                        });
                    };

                    parallelCheckTasks.namespace = function(callback) {
                        openmoney_bucket.get("namespaces~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                                if(err.code == 13){
                                    callback(null, true);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                //namespace exists
                                //check if this is the steward of that namespace
                                var is_steward = false;
                                namespace.value.stewards.forEach(function(steward){
                                    if(steward == "stewards" + request.stewardname.toLowerCase()){
                                        is_steward = true;
                                    }
                                });
                                if(is_steward){
                                    callback(null, namespace.value);
                                } else {
                                    var err = {};
                                    err.status = 403;
                                    err.code = 4002;
                                    err.message = "Namespace exists with that name.";
                                    callback(err, null);
                                }
                            }
                        });
                    };
                }

                var account_namespace_change = false;
                if(account.account_namespace != olddoc.value.account_namespace) {
                    //account namespace change
                    account_namespace_change = true;
                    //check that the namespace exists
                    parallelCheckTasks.account_namespace = function(callback) {
                        openmoney_bucket.get("namespaces~" + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                                if(err.code == 13){
                                    var err = {};
                                    err.status = 404;
                                    err.code = 4005;
                                    err.message = "Account namespace does not exist.";
                                    callback(err, null);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                callback(null, namespace.value);
                            }
                        });
                    }
                }

                var steward_change = false;
                if (olddoc.value.stewards.equals(account.stewards) === false) {
                    //check that stewards exist
                    olddoc.value.stewards.forEach(function (steward) {
                        console.log("get steward:" + steward);
                        parallelCheckTasks[steward] = function (callback) {
                            openmoney_bucket.get(steward, function (err, doc) {
                                if (err) {
                                    if (err.code == 13) {
                                        var error = {};
                                        error.status = 404;
                                        error.code = 4007;
                                        error.message = "Account stewards do not exist.";
                                        callback(error, false);
                                    } else {
                                        callback(err, false);
                                    }
                                } else {
                                    callback(null, doc);
                                }
                            })
                        };
                    });
                    account.stewards.forEach(function (steward) {
                        console.log("get steward:" + steward);
                        parallelCheckTasks[steward] = function (callback) {
                            openmoney_bucket.get(steward, function (err, doc) {
                                if (err) {
                                    if (err.code == 13) {
                                        var error = {};
                                        error.status = 404;
                                        error.code = 4007;
                                        error.message = "Account stewards do not exist.";
                                        callback(error, false);
                                    } else {
                                        callback(err, false);
                                    }
                                } else {
                                    callback(null, doc);
                                }
                            })
                        };
                    });
                    steward_change = true;
                }


                var publicKey_change = false;
                if(typeof account.publicKey != 'undefined' && typeof olddoc.value.publicKey != 'undefined' && account.publicKey != olddoc.value.publicKey){
                    //account publickey has changed
                    publicKey_change = true;
                    //check that the public key does not exists
                    parallelCheckTasks.publicKey_change = function(callback) {
                        stewards_bucket.get("AccountsPublicKey~" + getHash(account.publicKey), function (err, doc) {
                            if (err) {
                                if (err.code == 13) {
                                    //not found
                                    callback(null, true);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                var err = {};
                                err.status = 403;
                                err.code = 4012;
                                err.message = "The public key of this account is not unique.";
                                callback(err, null);
                            }
                        })
                    };
                }
                if(typeof account.publicKey != 'undefined' && typeof olddoc.value.publicKey == 'undefined'){
                    //account publicKey is added
                    publicKey_change = true;
                    parallelCheckTasks.publicKey_change = function(callback) {
                        stewards_bucket.get("AccountsPublicKey~" + getHash(account.publicKey), function (err, doc) {
                            if (err) {
                                if (err.code == 13) {
                                    //not found
                                    callback(null, true);
                                } else {
                                    callback(err, null);
                                }
                            } else {
                                var err = {};
                                err.status = 403;
                                err.code = 4012;
                                err.message = "The public key of this account is not unique.";
                                callback(err, null);
                            }
                        })
                    };
                }
                if(typeof account.publicKey == 'undefined' && typeof olddoc.value.publicKey != 'undefined'){
                    //account publicKey is removed
                    publicKey_change = true;
                }

                var account_disabled_change = false;
                if(typeof account.disabled != 'undefined' && typeof olddoc.value.disabled != 'undefined' && account.disabled != olddoc.value.disabled){
                    //account disabled has changed
                    account_disabled_change = true;
                }
                if(typeof account.disabled != 'undefined' && typeof olddoc.value.disabled == 'undefined'){
                    //account disabled is added
                    account_disabled_change = true;
                }
                if(typeof account.disabled == 'undefined' && typeof olddoc.value.disabled != 'undefined'){
                    //account disabled is removed
                    account_disabled_change = true;
                }

                var currency_disabled_changed = false;
                if(typeof account.currency_disabled != 'undefined' && typeof olddoc.value.currency_disabled != 'undefined' && account.currency_disabled != olddoc.value.currency_disabled){
                    //account currency_disabled has changed
                    currency_disabled_changed = true;
                }
                if(typeof account.currency_disabled != 'undefined' && typeof olddoc.value.currency_disabled == 'undefined'){
                    //account currency_disabled is added
                    currency_disabled_changed = true;
                }
                if(typeof account.currency_disabled == 'undefined' && typeof olddoc.value.currency_disabled != 'undefined'){
                    //account currency_disabled is removed
                    currency_disabled_changed = true;
                }

                var namespace_disabled_changed = false;
                if(typeof account.namespace_disabled != 'undefined' && typeof olddoc.value.namespace_disabled != 'undefined' && account.namespace_disabled != olddoc.value.namespace_disabled){
                    //account namepsace disabled has changed
                    namespace_disabled_changed = true;
                }
                if(typeof account.namespace_disabled != 'undefined' && typeof olddoc.value.namespace_disabled == 'undefined'){
                    //account namespace disabled is added
                    namespace_disabled_changed = true;
                }
                if(typeof account.namespace_disabled == 'undefined' && typeof olddoc.value.namespace_disabled != 'undefined'){
                    //account namespace disabled is removed
                    namespace_disabled_changed = true;
                }


                //check if they are authorized to do the change

                if(currency_disabled_changed){
                    parallelCheckTasks.currency_disabled_check = function(callback) {
                        openmoney_bucket.get("currencies~" + currency, function(err, currency){
                            if(err){
                                callback(err, null);
                            } else {
                                var is_steward = false;
                                currency.value.stewards.forEach(function(steward){
                                    if(steward == "stewards~" + request.stewardname.toLowerCase()){
                                        is_steward = true;
                                    }
                                });
                                if(is_steward){
                                    callback(null, currency);
                                } else {
                                    var err = {};
                                    err.status = 403;
                                    err.code = 4014;
                                    err.message = "Only currency stewards can currency disable account.";
                                    callback(err, null);
                                }
                            }
                        })
                    };
                }

                if(namespace_disabled_changed){
                    parallelCheckTasks.namespace_disabled_check = function(callback) {
                        openmoney_bucket.get("namespaces~" + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                                callback(err, null);
                            } else {
                                var is_steward = false;
                                namespace.value.stewards.forEach(function(steward){
                                    if(steward == "stewards~" + request.stewardname.toLowerCase()){
                                        is_steward = true;
                                    }
                                });
                                if(is_steward){
                                    callback(null, namespace);
                                } else {
                                    var err = {};
                                    err.status = 403;
                                    err.code = 4015;
                                    err.message = "Only namespace stewards can namespace disable account.";
                                    callback(err, null);
                                }
                            }
                        })
                    };
                }

                if(account_name_change || account_namespace_change || publicKey_change || account_disabled_change || steward_change) {

                    parallelCheckTasks.stewards_check = function(callback) {
                        //check that they are the steward of the olddoc
                        var is_steward = false;
                        olddoc.value.stewards.forEach(function (steward) {
                            if (steward == "stewards~" + request.stewardname.toLowerCase()) {
                                is_steward = true;
                            }
                        });
                        if (!is_steward) {
                            var err = {};
                            err.status = 403;
                            err.code = 4013;
                            err.message = "You are not the steward of this account.";
                            callback(err, null);
                        } else {
                            callback(null, true);
                        }
                    }
                }

                async.parallel(parallelCheckTasks, function(err, results){
                    if(err) {
                        console.log('parallelCheckTasks error:', err);
                        accountsPutCallback(err, null);
                    } else {
                        console.log('parallelCheckTasks results:', results);
                        //make the change

                        if(typeof account.modifications == 'undefined'){
                            account.modifications = [];
                        }

                        var mod = {};
                        mod.modified = new Date().getTime();
                        mod.modified_by = request.stewardname.toLowerCase();
                        mod.modification = '';
                        if (account_name_change){
                            mod.modification += "Account Name change from " + olddoc.value.account + " to " + account.account + ". ";
                        }
                        if (account_namespace_change) {
                            mod.modification += "Namespace change From " + olddoc.value.account_namespace + " to " + account.account_namespace + ". ";
                        }
                        if (steward_change) {
                            mod.modification += "Stewards changed from [";
                            olddoc.value.stewards.forEach(function (steward) {
                                mod.modification += steward.replace("stewards~", '') + ", ";
                            });
                            mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                            mod.modification += "] to [";
                            account.stewards.forEach(function (steward) {
                                mod.modification += steward.replace("stewards~", '') + ", ";
                            });
                            mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                            mod.modification += "]. ";
                        }
                        if (publicKey_change){
                            mod.modification += "Account Public Key changed from " + olddoc.value.publicKey + " to " + account.publicKey + ". ";
                        }
                        if (account_disabled_change) {
                            mod.modification += "Account disabled changed from " + olddoc.value.disabled + " to " + account.disabled + ". ";
                        }
                        if (currency_disabled_changed) {
                            mod.modification += "Currency disabled changed from " + olddoc.value.currency_disabled + " to " + account.currency_disabled + ". ";
                        }
                        if (namespace_disabled_changed) {
                            mod.modification += "Namespace disabled changed from " + olddoc.value.namespace_disabled + " to " + account.namespace_disabled + ". ";
                        }

                        account.modifications.push(mod);

                        if(mod.modification)
                        console.log('modifications', mod.modification);

                        var parallelInsertTasks = {};

                        parallelInsertTasks.account = function(callback) {
                            openmoney_bucket.upsert(account.id, account, function(err, ok){
                                if(err){
                                    console.log('error updating account:', account.id, err)
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            })
                        };

                        if(account.id != olddoc.value.id){
                            parallelInsertTasks.remove_olddoc = function(callback){
                                openmoney_bucket.remove(olddoc.value.id, function(err, ok){
                                    if(err) {
                                        console.log('error removing olddoc:', olddoc.value.id, err)
                                        callback(err,null);
                                    } else {
                                        callback(null, ok);
                                    }
                                })
                            };
                        }

                        parallelInsertTasks.move_value_ref = function(callback){
                            stewards_bucket.get(olddoc.value.id, function(err, oldValRef){
                                if(err){
                                    console.log('error getting value reference doc:', olddoc.value.id, err);
                                    callback(err, null);
                                } else {
                                    console.log('oldValRef:', oldValRef);

                                    var parallelLookupTasks = {};
                                    //update the value reference accounts
                                    if(steward_change){
                                        var removed_stewards = [];
                                        var added_stewards = [];
                                        olddoc.value.stewards.forEach(function (steward) {
                                            if(account.stewards.indexOf(steward) === -1){
                                                //steward is removed
                                                removed_stewards.push(steward);
                                            }
                                        });
                                        account.stewards.forEach(function(steward){
                                            if(olddoc.value.stewards.indexOf(steward) === -1){
                                                //steward is added
                                                added_stewards.push(steward);
                                            }
                                        });
                                        removed_stewards.forEach(function(steward){
                                            var steward_hash = "steward_bucket~" + getHash(results[steward].value.publicKey);
                                            var index = oldValRef.value.documents.indexOf(steward_hash);
                                            if (index !== -1) {
                                                oldValRef.value.documents.splice(index, 1);
                                            }
                                            parallelLookupTasks[steward_hash] = function(callback){
                                                stewards_bucket.get(steward_hash, function(err, steward_bucket) {
                                                    if(err) {
                                                        console.log(steward_hash);
                                                        console.log(err);
                                                        callback(err, null);
                                                    } else {
                                                        //find old reference if exists and remove.
                                                        var index = steward_bucket.value.accounts.indexOf(olddoc.value.id);
                                                        if(index !== -1){
                                                            steward_bucket.value.accounts.splice(index, 1);
                                                        }
                                                        stewards_bucket.replace(steward_hash, steward_bucket.value, {cas: steward_bucket.cas},function(err, ok){
                                                            if(err) {
                                                                callback(err, null);
                                                            } else {
                                                                callback(null, ok);
                                                            }
                                                        });
                                                    }
                                                });
                                            };
                                        });
                                        added_stewards.forEach(function(steward){
                                            oldValRef.value.documents.push("steward_bucket~" + getHash(results[steward].value.publicKey));
                                        })
                                    }

                                    oldValRef.value.documents.forEach(function(steward_hash){
                                        parallelLookupTasks[steward_hash] = function(callback){
                                            stewards_bucket.get(steward_hash, function(err, steward_bucket) {
                                                if(err) {
                                                    console.log(steward_hash);
                                                    console.log(err);
                                                    callback(err, null);
                                                } else {
                                                    //find old reference if exists and replace with new or add
                                                    var index = steward_bucket.value.accounts.indexOf(olddoc.value.id);
                                                    if(index === -1){
                                                        steward_bucket.value.accounts.push(account.id);
                                                    } else {
                                                        steward_bucket.value.accounts[index] = account.id;
                                                    }

                                                    //add currency if it doesn't exist
                                                    var currency_exists = false;
                                                    if(typeof steward_bucket.value.currencies == 'undefined'){
                                                      steward_bucket.value.currencies = [];
                                                    }
                                                    steward_bucket.value.currencies.forEach(function(currencyID){
                                                      if(currencyID == "currencies~" + currency){
                                                        currency_exists = true;
                                                      }
                                                    });
                                                    if(!currency_exists){
                                                      steward_bucket.value.currencies.push("currencies~" + currency);
                                                    }
                                                    //add namespace if it doesn't exist
                                                    var namespace_exists = false;
                                                    if(typeof steward_bucket.value.namespaces == 'undefined'){
                                                      steward_bucket.value.namespaces = [];
                                                    }
                                                    steward_bucket.value.namespaces.forEach(function(namespaceID){
                                                      if(namespaceID == "namespaces~" + account.account_namespace){
                                                        namespace_exists = true;
                                                      }
                                                    });
                                                    if(!namespace_exists){
                                                      steward_bucket.value.namespaces.push("namespaces~" + account.account_namespace);
                                                    }
                                                    //add stewards if they don't exist
                                                    if(typeof steward_bucket.value.stewards == 'undefined'){
                                                      steward_bucket.value.stewards = [];
                                                    }
                                                    account.stewards.forEach(function(steward){
                                                      var steward_exists = false;
                                                      steward_bucket.value.stewards.forEach(function(stewardID){
                                                        if(stewardID == steward.toLowerCase()){
                                                          steward_exists = true;
                                                        }
                                                      });
                                                      if(!steward_exists){
                                                        steward_bucket.value.stewards.push(steward.toLowerCase());
                                                      }
                                                    });

                                                    stewards_bucket.replace(steward_hash, steward_bucket.value, {cas: steward_bucket.cas},function(err, ok){
                                                        if(err) {
                                                            callback(err, null);
                                                        } else {
                                                            callback(null, ok);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });

                                    parallelLookupTasks.update_value_reference = function(callback){
                                        if(oldValRef.value.id != account.id){
                                          oldValRef.value.id = account.id;
                                          console.log(oldValRef);
                                          stewards_bucket.upsert(oldValRef.value.id, oldValRef.value, function(err, ok){
                                              if(err){
                                                  callback(err, null);
                                              } else {
                                                  console.log(ok);
                                                  stewards_bucket.remove(olddoc.value.id, function(err, ok){
                                                      if(err){
                                                          callback(err, null);
                                                      } else {
                                                          callback(null, ok);
                                                      }
                                                  })
                                              }
                                          })
                                        } else {
                                          console.log(oldValRef);
                                          stewards_bucket.upsert(oldValRef.value.id, oldValRef.value, function(err, ok){
                                              if(err){
                                                  callback(err, null);
                                              } else {
                                                  console.log(ok);
                                                  callback(null, ok);
                                              }
                                          })
                                        }

                                    };

                                    async.parallel(parallelLookupTasks, function(err, results){
                                        console.log(results);
                                        if(err){
                                            callback(err, null);
                                        } else {
                                            callback(null, results);
                                        }
                                    })
                                }
                            })
                        };


                        async.parallel(parallelInsertTasks, function(err, results){

                            if(err){
                                console.log('parallelInsertTasks error:', err, results);
                                accountsPutCallback(err, null);
                            } else {
                                console.log('parallelInsertTasks results:', results);
                                //TODO: notify those affected

                                var response = {};
                                response.ok = true;
                                response.id = account.id;
                                accountsPutCallback(null, response);


                                //var error = {};
                                //error.status = 503;
                                //error.code = 4004;
                                //error.message = 'method not implemented at this time.';
                                //accountsPutCallback(error, false);
                            }
                        })




                    }
                })

            }
        }
    });



};

exports.accountsDelete = function(request, accountsDeleteCallback) {
    console.log(request);
    var error = {};
    error.status = 503;
    error.code = 4004;
    error.message = 'method not implemented at this time.';
    accountsDeleteCallback(error, false);
};

exports.accountsDiscovery = function(request, accountsDiscoveryCallback) {
    console.log(request);
    var error = {};
    error.code = '420';
    error.message = 'method not implemented at this time.';
    accountsDiscoveryCallback(error, false);
};


// Journals
exports.journalsList = function(request, journalsListCallback) {
    console.log(request);
    //request.stewardname = args.stewardname.value;
    //request.namespace = args.namespace.value;
    //request.account = args.account.value;
    //request.currency = args.currency.value;
    //request.currency_namespace = args.currency_namespace.value;
    //request.offset = args.offset.value;
    //request.range = args.range.value;
    //request.publicKey = publicKey;
    var currency;
    if(typeof request.currency != 'undefined'){
      currency = (typeof request.currency_namespace == 'undefined' || request.currency_namespace == '') ? request.currency.toLowerCase() : request.currency.toLowerCase() + '.' + request.currency_namespace.toLowerCase();
    }
    var journalList;
    if(typeof request.account != 'undefined' && request.namespace != 'undefined'){
      journalList = "journalsList~" + request.account.toLowerCase() + '.' + request.namespace.toLowerCase() + "~" + currency;
    }

    console.log(journalList);
    if(typeof journalList == 'undefined'){
      //get this stewards bucket, then get all their account journals.
      console.log('steward_bucket Lookup', getHash(request.publicKey));
      stewards_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,steward_bucket) {
          if(err) {
              accountsListCallback(err, false);
          } else {
              console.log('stewards_bucket', steward_bucket);
              var parallelTasks = {};
              steward_bucket.value.accounts.forEach(function(accountID){
                var journalList = "journalsList~" + accountID.split('~')[1] + '~' + accountID.split('~')[2];
                console.log('journals list lookup', journalList);
                parallelTasks[journalList] = function(callback){
                  getJournalList(request, journalList, function(err, journals){
                    if(err){
                      callback(err);
                    } else {
                      callback(null, journals);
                    }
                  })
                }
              });
              steward_bucket.value.currencies.forEach(function(currencyID){
                var journalList = "journalsList~" + currencyID.split('~')[1];
                console.log('journals list lookup', journalList);
                parallelTasks[journalList] = function(callback){
                  openmoney_bucket.get(currencyID, function(err, currencyDoc){
                    if(err){
                      callback(err);
                    } else {

                      //only get the currency journals if your the steward of the currency
                      var isSteward = false;
                      currencyDoc.value.stewards.forEach(function(steward){
                        if(steward == 'stewards~' + request.stewardname.toLowerCase()){
                          isSteward = true;
                        }
                      })
                      if(isSteward){
                        getJournalList(request, journalList, function(err, journals){
                          if(err){
                            callback(err);
                          } else {
                            callback(null, journals);
                          }
                        })
                      } else {
                        callback(null, []);
                      }
                    }
                  });
                }
              })
              async.parallel(parallelTasks, function(err, results){
                if(err){
                  journalsListCallback(err);
                } else {
                  //agrigate results
                  console.log('results:', results);
                  var allJournals = [];

                  for (var k in results){
                    if (results.hasOwnProperty(k)) {
                      var journals = results[k];
                      for(i = 0; i < journals.length; i++){

                        //check if each each journal is unique in the result set
                        var unique = true;
                        for(var j = 0; j < allJournals.length; j++){
                          if(allJournals[j].id == journals[i].id){
                            unique = false;
                          }
                        }
                        if(unique){
                          allJournals.push(journals[i]);
                        }
                      }
                    }
                  }
                  console.log('allJournals', allJournals);
                  journalsListCallback(null, allJournals);
                }
              })
          }
      });
    } else {
      getJournalList(request, journalList, function(err, journals){
        if(err){
          journalsListCallback(err);
        } else {
          journalsListCallback(null, journals);
        }
      })
    }




    //var N1qlQuery = couchbase.N1qlQuery;
    //stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + getHash(request.publicKey) + 'journals~%";';
    //console.log(queryString);
    //var query = N1qlQuery.fromString(queryString);
    //stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        journalsListCallback(err,false);
    //    } else {
    //        console.log( results);
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        journalsListCallback(null, response);
    //    }
    //});
};

function getJournalList(request, journalListDocID, callback){
  stewards_bucket.get(journalListDocID, function(err,journalList) {
      if(err) {
          if(err.code == 13){
            //there are no journal entries for this account
            callback(null, []);
          } else {
            console.log('could not get journals list document',journalListDocID, err);
            callback(err);
          }
      } else {
          var parallelTasks = {};
          var count = 0;
          journalList.value.list.forEach(function(journalID){
              count++;
              var is_displayed = false;
              if(typeof request.offset != 'undefined' && typeof request.range != 'undefined') {
                  if(count >= request.offset && count < request.offset + request.range) {
                      is_displayed = true;
                  }
              } else {
                  is_displayed = true;

              }
              if(is_displayed) {
                  console.log("journalID:" + journalID);
                  parallelTasks[journalID] = function (cb) {
                      stewards_bucket.get(getHash(request.publicKey) + journalID, function (err, journal) {
                          if (err) {
                              console.log('error getting journal:' + journalID, err);
                              cb(err);
                          } else {
                              cb(null, journal.value);
                          }
                      })
                  };
              }
          });
          async.parallel(parallelTasks, function(err, results){
              if(err) {
                  console.log('could not get journal document', err);
                  callback(err);
              } else {
                  console.log(results);
                  var response = [];
                  for (var key in results) {
                      if (results.hasOwnProperty(key)) {
                          response.push(results[key]);
                      }
                  }
                  callback(null, response);
              }
          });
      }
  });
}

exports.journalsPost = function(request, journalsPostCallback) {
    console.log(request);
    //request.stewardname = args.stewardname.value;
    //request.namespace = args.namespace.value;
    //request.account = args.account.value;
    //request.currency = args.currency.value;
    //request.currency_namespace = args.currency_namespace.value;
    //request.journal = args.journal.value;
    //request.publicKey = publicKey;
    request.stewardname = request.stewardname.toLowerCase();
    var journal = {};
    journal.type = "journals";
    journal.from_account = request.account.toLowerCase();
    journal.from_account_namespace = request.namespace.toLowerCase();
    journal.to_account = request.journal.to_account.toLowerCase();
    journal.to_account_namespace = request.journal.to_account_namespace.toLowerCase();
    journal.currency = request.currency.toLowerCase();
    journal.currency_namespace = typeof request.currency_namespace == 'undefined' ? '' : request.currency_namespace.toLowerCase();
    journal.amount = request.journal.amount;
    journal.created = new Date().getTime();
    journal.created_by = request.stewardname;
    if(typeof request.journal.payload != 'undefined'){
      journal.payload = request.journal.payload;
    }

    var currency = typeof request.currency_namespace == 'undefined' || request.currency_namespace == '' ? request.currency.toLowerCase() : request.currency.toLowerCase() + '.' + request.currency_namespace.toLowerCase();
    journal.id = "journals~" + journal.from_account.toLowerCase() + '.' + journal.from_account_namespace.toLowerCase() + '~' +
                            journal.to_account.toLowerCase() + '.' + journal.to_account_namespace.toLowerCase() + '~' +
                            currency + '~' + journal.created;

    var parallelTasks = {};

    //check that request.account exists
    parallelTasks.from_account_exists = function(callback) {
        var from_account_id = "accounts~" + request.account.toLowerCase() + '.' + request.namespace.toLowerCase() + '~' + currency;
        openmoney_bucket.get(from_account_id, function(err, from_account){
            if(err){
                if(err.code == 13){
                    var error = {};
                    error.status = 404;
                    error.code = 5002;
                    error.message = "From account does not exist.";
                    callback(error, null);
                } else {
                    callback(err, null);
                }
            } else {
                //check that request.account is this steward
                var is_steward = false;
                from_account.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname) {
                        is_steward = true;
                    }
                });
                if(!is_steward){
                    var error = {};
                    error.status = 403;
                    error.code = 5003;
                    error.message = "You are not the steward of this account.";
                    callback(error, null);
                } else {
                    //check that request.account is not disabled
                    if(typeof from_account.value.disabled != 'undefined' && from_account.value.disabled){
                        var error = {};
                        error.status = 403;
                        error.code = 5004;
                        error.message = "Your account is disabled.";
                        callback(error, null);
                    } else {
                        //check that request.account limits will not be exceeded by this journal entry
                        //this requires that we know the balance of the account.
                        if (typeof from_account.value.minimum != 'undefined' &&
                            typeof from_account.value.balance != 'undefined' &&
                            from_account.value.minimum > from_account.value.balance - request.amount) {
                            var error = {};
                            error.status = 403;
                            error.code = 5005;
                            error.message = "Your account minimum limit will be exceeded by this entry.";
                            callback(error, null);
                        } else {
                            callback(null, from_account.value);
                        }
                    }
                }
            }
        })
    };

    //check that request.namespace exists
    parallelTasks.from_namespace_exists = function(callback){
        openmoney_bucket.get("namespaces~" + request.namespace.toLowerCase(), function(err, namespace){
            if(err){
                if(err.code == 13){
                    var err = {};
                    err.status = 404;
                    err.code = 5006;
                    err.message = "Your account namespace does not exist.";
                    callback(err, null);
                } else {
                    callback(err, null);
                }
            } else {
                //check that request.namespace is not disabled
                if(typeof namespace.value.disabled != 'undefined' && namespace.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5007;
                    err.message = "Your account namespace is disabled.";
                    callback(err, null);
                } else {
                    callback(null, namespace.value);
                }
            }
        })
    };

    //check that request.journal.to_account exists
    parallelTasks.to_account_exists = function(callback) {
        var to_account_id = "accounts~" + request.journal.to_account.toLowerCase() + '.' + request.journal.to_account_namespace.toLowerCase() + '~' + currency;
        openmoney_bucket.get(to_account_id, function(err, to_account){
            if(err){
                if(err.code == 13){
                    var error = {};
                    error.status = 404;
                    error.code = 5008;
                    error.message = "Their account does not exist in this currency. Be sure the currencies of the accounts match.";
                    callback(error, null);
                } else {
                    callback(err, null);
                }
            } else {

                //check that request.journal.to_account is not disabled
                if(typeof to_account.value.disabled != 'undefined' && to_account.value.disabled){
                    var error = {};
                    error.status = 403;
                    error.code = 5009;
                    error.message = "Their account is disabled.";
                    callback(error, null);
                } else {
                    //check that request.journal.to_account limits will not be exceeded by this journal entry
                    //this requires that we know the balance of the account.
                    if (typeof to_account.value.maximum != 'undefined' &&
                        typeof to_account.value.balance != 'undefined' &&
                        to_account.value.maximum < to_account.value.balance + request.amount) {
                        var error = {};
                        error.status = 403;
                        error.code = 5010;
                        error.message = "Their account maximum limit will be exceeded by this entry.";
                        callback(error, null);
                    } else {
                        callback(null, to_account.value);
                    }
                }

            }
        })
    };

    //check that request.journal.to_account_namespace exists
    parallelTasks.to_namespace_exists = function(callback){
        openmoney_bucket.get("namespaces~" + request.journal.to_account_namespace.toLowerCase(), function(err, namespace){
            if(err){
                if(err.code == 13){
                    var err = {};
                    err.status = 404;
                    err.code = 5011;
                    err.message = "Their account namespace does not exist.";
                    callback(err, null);
                } else {
                    callback(err, null);
                }
            } else {
                //check that request.journal.to_account_namespace is not disabled
                if(typeof namespace.value.disabled != 'undefined' && namespace.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "Their account namespace is disabled.";
                    callback(err, null);
                } else {
                    callback(null, namespace.value);
                }
            }
        })
    };

    //check that request.currency exists
    parallelTasks.currency_exists = function(callback) {
        openmoney_bucket.get("currencies~" + currency, function(err, currency){
            if(err) {
                if(err.code == 13) {
                    var err = {};
                    err.status = 404;
                    err.code = 5013;
                    err.message = "The currency does not exist.";
                    callback(err, null);
                } else {
                    callback(err, null);
                }
            } else {
                //check that request.currency is not disabled
                if(typeof currency.value.disabled != 'undefined' && currency.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5014;
                    err.message = "The currency is disabled.";
                    callback(err, null);
                } else {
                    //check that currency namespace exists and is not disabled for all parent namespaces
                    if(currency.value.currency_namespace != ''){
                      var namespaces_check = {};
                      var currency_namespaces = currency.value.currency_namespace.split('.');
                      var namespaces = [];
                      for(var i = 0; i < currency_namespaces.length; i++){
                        namespaces[i] = '';
                        for(var j = 0; j < currency_namespaces.length; j++){
                          namespaces[i] += currency_namespaces[j] + '.';
                        }
                        //remove trailing dot.
                        namespaces[i] = namespaces[i].substr(0, namespaces[i].length - 1);
                      }
                      namespaces.forEach(function(namespace){
                        namespaces_check[namespace] = function(callback){
                          openmoney_bucket.get('namespaces~' + namespace, function(err, namespaceDoc){
                            if(err){
                              callback(err, null);
                            } else {
                              if(namespaceDoc.value.disabled === true){
                                var err = {};
                                err.status = 403;
                                err.code = 5015;
                                err.message = "The currency namespace " + namespaceDoc.value.namespace + " is disabled.";
                                callback(err, null);
                              } else {
                                callback(null, namespaceDoc);
                              }
                            }
                          })
                        }
                      })

                      async.parallel(namespaces_check, function(err, results){
                        callback(err, currency.value);
                      });
                    } else {
                      callback(null, currency.value);
                    }
                }
            }
        })
    };

    //if the to_account name is the same as the to account parent namespace name only the steward of the to account namespace is allowed to post that account.
    parallelTasks.account_namespace_check = function(callback){
      if(request.journal.to_account.toLowerCase() == request.journal.to_account_namespace.toLowerCase().split('.')[0]){
        openmoney_bucket.get("namespaces~" + request.journal.to_account_namespace.toLowerCase(), function(err, namespace){
            if(err){
                if(err.code == 13){
                    var err = {};
                    err.status = 404;
                    err.code = 5011;
                    err.message = "Their account namespace does not exist.";
                    callback(err, null);
                } else {
                    callback(err, null);
                }
            } else {
                //check that request.journal.to_account_namespace is not disabled
                if(typeof namespace.value.disabled != 'undefined' && namespace.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "Their account namespace is disabled.";
                    callback(err, null);
                } else {

                    var is_steward = false;
                    namespace.value.stewards.forEach(function(steward){
                      if(steward == "stewards~" + request.stewardname){
                        is_steward = true;
                      }
                    })

                    if(is_steward){
                      callback(null, namespace.value);
                    } else {
                      var err = {};
                      err.status = 403;
                      err.code = 5013;
                      err.message = "Cannot post to an account name that matches the parent namespace unless you are the steward of the namespace.";
                      callback(err, null);
                    }
                }
            }
        })
      } else {
        callback(null, {message: 'to_account does not match to_account_namespace parent.'});
      }
    };

    async.parallel(parallelTasks, function(err, results){
        if(err){
            journalsPostCallback(err, null);
        } else {
            console.log(results);
            //if all checks pass create the journal entry

            var parallelInsertTasks = {};

            if(journal.from_account == journal.to_account && journal.from_account_namespace == journal.to_account_namespace){
              parallelInsertTasks.fromAccountUpdate = function(callback){
                openmoney_bucket.get('accounts~' + journal.from_account + '.' + journal.from_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.volume += journal.amount + journal.amount;
                    openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      callback(err, ok);
                    });
                  }
                });
              };
            } else {
              parallelInsertTasks.fromAccountUpdate = function(callback){
                openmoney_bucket.get('accounts~' + journal.from_account + '.' + journal.from_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.balance -= journal.amount;
                    account.value.volume += journal.amount;
                    openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      callback(err, ok);
                    });
                  }
                });
              };

              parallelInsertTasks.toAccountUpdate = function(callback){
                openmoney_bucket.get('accounts~' + journal.to_account + '.' + journal.to_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.balance += journal.amount;
                    account.value.volume += journal.amount;
                    openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      callback(err, ok);
                    })
                  }
                });
              };
            }


            //insert into from account stewards journals
            results.from_account_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err) {
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = getRandomstring(12);
                            encryptedDoc.encryptedJournal = encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        }
                    })
                };
            });

            parallelInsertTasks.fromJournalList = function(callback) {
                var journalsListDoc = {};
                journalsListDoc.type = "journalsList";
                journalsListDoc.id = "journalsList~" + request.account.toLowerCase() + "." + request.namespace.toLowerCase() + "~" + currency;
                stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            stewards_bucket.insert(journalsListDoc.id, journalsListDoc, function(err, ok){
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        journalsList.value.list.push( journal.id );

                        stewards_bucket.upsert(journalsList.value.id, journalsList.value, function(err, ok){
                            if(err) {
                                callback(err, null);
                            } else {
                                callback(null, ok);
                            }
                        });
                    }
                });
            };

            //insert into to account stewards journals
            results.to_account_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err) {
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = getRandomstring(12);
                            encryptedDoc.encryptedJournal = encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        }
                    })
                };
            });

            parallelInsertTasks.toJournalList = function(callback) {
                var journalsListDoc = {};
                journalsListDoc.type = "journalsList";
                journalsListDoc.id = "journalsList~" + request.journal.to_account.toLowerCase() + "." + request.journal.to_account_namespace.toLowerCase() + "~" + currency;
                stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            stewards_bucket.upsert(journalsListDoc.id, journalsListDoc, function(err, ok){
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        journalsList.value.list.push( journal.id );

                        stewards_bucket.upsert(journalsList.value.id, journalsList.value, function(err, ok){
                            if(err) {
                                callback(err, null);
                            } else {
                                callback(null, ok);
                            }
                        });
                    }
                });
            };

            //insert into currency stewards journals
            results.currency_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err){
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = getRandomstring(12);
                            encryptedDoc.encryptedJournal = encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        }
                    });
                };
            });

            parallelInsertTasks.currencyjournalList = function(callback) {
                var journalsListDoc = {};
                journalsListDoc.type = "journalsList";
                journalsListDoc.id = "journalsList~" + currency;
                stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            stewards_bucket.insert(journalsListDoc.id, journalsListDoc, function(err, ok){
                                if(err) {
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        journalsList.value.list.push( journal.id );

                        stewards_bucket.upsert(journalsList.value.id, journalsList.value, function(err, ok){
                            if(err) {
                                callback(err, null);
                            } else {
                                callback(null, ok);
                            }
                        });
                    }
                });
            };

            async.parallel(parallelInsertTasks, function(err, ok){
                if(err) {
                    console.log(err, ok);
                    journalsPostCallback(err, null);
                } else {
                    console.log(ok);

                    //TODO: notify to stewards, from stewards and currency stewards

                    var response = {};
                    response.id = journal.id;
                    response.created = journal.created;
                    response.ok = true;
                    journalsPostCallback(null, response);
                }
            });
        }
    });
};


exports.journalsGet = function(request, journalsGetCallback) {
    console.log(request);
    var error = {};
    error.status = 503;
    error.code = 5001;
    error.message = 'method not implemented at this time.';
    journalsGetCallback(error, false);
};
