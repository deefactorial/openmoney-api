
const model = {};
const couchbase = require('couchbase');
const cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}`);
      cluster.authenticate(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD);
const oauth2Server = cluster.openBucket('oauth2Server');

//var codes = {};


exports.find = function(key, done) {
  model.getAuthCode(key, done);
  //var code = codes[key];
  //return done(null, code);
};

exports.save = function(code, clientID, redirectURI, userID, done) {
  //define expires time now.
  //var expires = (new Date()).setSeconds((new Date()).getSeconds + 3600);
  var expires = new Date();
  expires.setSeconds(expires.getSeconds() + 60 * 15); //15 minutes

  model.saveAuthCode(code, clientID, expires, userID, redirectURI, done);
  //codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
  //return done(null);
};



/*
 * Required to support auth Code Grant Type
 */

model.saveAuthCode = function (authCode, clientId, expires, user, redirect_uri, callback) {
  var code = {};
  code.code = authCode;
  code.clientID = clientId;
  code.expires = expires;
  code.userID = user;
  code.redirectURI = redirect_uri;
  oauth2Server.insert('acode::' + authCode, code, {expires: expires}, function(err, ok){
    if(err){
      callback(err);
    } else {
      callback(null);
    }
  });
};

model.getAuthCode = function(code, callback){
  oauth2Server.get('acode::' + code, function(err, authCode){
    if(err){
      if(err.code == 13){
        callback(false, null);
      } else {
        callback(err, null);
      }
    } else {
      //if the authCode has expired return null for expires
      if(typeof authCode.value.expires != 'undefined' && new Date(authCode.value.expires).getTime() < new Date()){
        authCode.value.expires = null;
      } else if(typeof authCode.value.expires != 'undefined') {
        authCode.value.expires = new Date(authCode.value.expires);
      }
      callback(null, authCode.value);
    }
  });
};
