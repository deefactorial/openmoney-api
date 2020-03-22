const model = {};
const couchbase = require('couchbase');
const cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}`);
      cluster.authenticate(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD);
const oauth2Server = cluster.openBucket('oauth2Server');
var async = require('async');

//var tokens = {};

exports.find = function(key, done) {
  model.getAccessToken(key, done);
  //var token = tokens[key];
  //return done(null, token);
};

exports.save = function(token, refreshToken, userID, clientID, scopes, expires, done) {
  model.saveAccessToken(token, refreshToken, userID, clientID, scopes, expires, done);
  //tokens[token] = { userID: userID, clientID: clientID };
  //return done(null);
};

exports.findRefresh = function (refreshToken, done) {
  model.getRefreshToken(refreshToken, done);
  //var rtoken = refreshTokens[refreshToken];
  //if ( !rtoken ) { return done(new Error("Refresh token not found")); }
  //return done(null, rtoken);
};

exports.delete = function(token, done) {
  model.removeAccessToken(token, done);
  //delete tokens[token];
  //return done(null);
};


/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
  console.log('getAccessToken', bearerToken)
  oauth2Server.get('atkn::' + bearerToken, function(err, token){
    if(err){
      if(err.code == 13){
        callback(null, null);
      } else {
        callback(err, null);
      }
    } else {
      if(typeof token.value.expires != 'undefined' && token.value.expires != null){
        token.value.expires = new Date(token.value.expires);
      }
      callback(null, token.value);
    }
  });
};

model.getRefreshToken = function (bearerToken, callback) {
  oauth2Server.get('rtkn::' + bearerToken, function(err, token){
    if(err){
      if(err.code == 13){
        callback(null, null);
      } else {
        callback(err, null);
      }
    } else {
      if(typeof token.value.expires != 'undefined' && token.value.expires != null){
        token.value.expires = new Date(token.value.expires);
      }
      callback(null, token.value);
    }
  });
};

// db will do cleanup of the document when it expires
model.saveAccessToken = function (accessToken, refreshToken, userId, clientId, scopes, expires, callback) {
  console.log('saveAccessToken', accessToken)
  var oauthAccessToken = {};
  oauthAccessToken.accessToken = accessToken;
  oauthAccessToken.refreshToken = refreshToken;
  oauthAccessToken.clientId = clientId;
  if(typeof userId !== 'undefined' && typeof userId.id !== 'undefined' ){
    oauthAccessToken.user = userId;
  } else {
    oauthAccessToken.userId = userId;
  }
  oauthAccessToken.scopes = scopes;
  oauthAccessToken.expires = expires;

  var parallel = {};
  parallel.atkn = function(cb){
    oauth2Server.insert('atkn::' + accessToken, oauthAccessToken, { expires: expires }, function(err, ok){
      if(err){
        cb(err, null);
      } else {
        cb(null, ok);
      }
    });
  };

  parallel.rtkn = function(cb){
    var refresh = {};
    refresh.accessToken = accessToken;
    refresh.expires = expires;
    oauth2Server.insert('rtkn::' + refreshToken, refresh, { expires: expires }, function(err, ok){
      if(err){
        cb(err, null);
      } else {
        cb(null, ok);
      }
    });
  };

  async.parallel(parallel, function(err, ok){
    if(err){
      callback(err);
    } else {
      callback(null);
    }
  })
};

model.removeAccessToken = function(token, callback) {
  oauth2Server.get("atkn::" + token, function(err, tokenDoc){
    if(err){
      callback(err);
    } else {
      var parallel = {};
      parallel.atkn = function(cb){
        oauth2Server.remove("atkn::" + token, {cas: tokenDoc.cas}, function(err, ok){
          if(err){
            cb(err, null);
          } else {
            cb(null, ok);
          }
        });
      };
      parallel.rtkn = function(cb) {
        oauth2Server.remove("rtkn::" + tokenDoc.value.refreshToken, function (err, ok) {
          if (err) {
            cb(err, null);
          } else {
            cb(null, ok);
          }
        });
      };
      async.parallel(parallel, function(err, ok){
        if(err){
          callback(err);
        } else {
          callback(null);
        }
      });
    }
  })
};