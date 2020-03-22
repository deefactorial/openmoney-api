var NodeRSA = require('node-rsa');
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}`);
    cluster.authenticate(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD);
var openmoney_bucket = cluster.openBucket('openmoney_global');
var crypto = require('crypto');

require('dotenv').config();

if(typeof process.env.API_HOST === 'undefined'){
  process.env.API_HOST = 'http://localhost';
}

if(typeof process.env.COUCHBASE_LO === 'undefined'){
    console.error("Did you forget to set the COUCHBASE_LO environment variable?");
    process.exit(1);
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
    var randomRange = getRandomArbitrary(key.getMaxMessageSize()/2, key.getMaxMessageSize()-1);
    return getRandomstring(randomRange);
}

function encryptSymetricKey(key, symetricKey) {
    return key.encrypt(symetricKey, 'base64', 'utf8');
}

function getHash(value) {
    return crypto.createHash('sha256').update(value).digest('base64');
}

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


    if(request.grant_type.toLowerCase() === 'password'){
        //password has been verified earlier
        //verify client credentials

    }

    openmoney_bucket.get("steward_bucket~" + getHash(request.publicKey), function(err,publicKeyDoc){
        if(err) {
            accessTokenPostCallback(err, false);
        } else {
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

exports.stewardsGetByPublicKey = function(publicKey, cb) {
    openmoney_bucket.get("steward_bucket~" + getHash(publicKey), function(err, doc){
        if(err) {
            cb(err, null);
        } else {
            exports.stewardsGet(doc.value, function(err, steward){
                if(err){
                    cb(err, null);
                } else {
                    cb(null, steward);
                }
            });
        }
    });
};