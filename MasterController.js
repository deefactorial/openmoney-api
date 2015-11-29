
var NodeRSA = require('node-rsa');
var couchbase = require('couchbase');
var cluster = new couchbase.Cluster('couchbase://127.0.0.1');
var users_bucket = cluster.openBucket('openmoney_user');
var openmoney_bucket = cluster.openBucket('openmoney_global');
var async = require('async');

function getRandomstring(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getSymetricKey(key){
    //console.log(key.getMaxMessageSize());
    //var symetric_key = getRandomstring(key.getMaxMessageSize());
    //console.log(symetric_key);
    //console.log(symetric_key.length);
    //return getRandomstring(key.getMaxMessageSize()-10);
    return getRandomstring(39);
}

function encryptSymetricKey(key, symetricKey) {
    //var encryptedSymetricKeyData = key.encrypt(symetric_key, 'base64', 'utf8');
    //console.log(encryptedSymetricKeyData);
    return key.encrypt(symetricKey, 'base64', 'utf8');
}

function getHash(value) {
    var crypto = require('crypto');
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

exports.accessTokenPost = function(request, accessTokenPostCallback) {

    //request.proof_token
    openmoney_bucket.get(getHash(request.publicKey), function(err,publicKeyDoc){
        if(err) {
            accessTokenPostCallback(err, false);
        } else {
            if(request.proof_token != publicKeyDoc.value.access_token) {
                var err = {};
                err.code = 402;
                err.message = "Tokens did not match.";
                accessTokenPostCallback(err, false);
            } else {
                //tokens match
                console.log("accessTokenExpiry:" + publicKeyDoc.value.access_token_expiry);
                console.log("currentTime:" + new Date().getTime());

                //check if token has expired
                if( publicKeyDoc.value.access_token_expiry < new Date().getTime() ){
                    //Token has expired through an error
                    var err = {};
                    err.code = 401;
                    err.message = "Token has expired retry authorize.";
                    accessTokenPostCallback(err, false);
                } else {
                    //token is still valid issue a session

                    var session = {};
                    session.id = "session~" + getHash(request.proof_token);
                    session.access_token = request.proof_token;
                    session.access_token_expiry = publicKeyDoc.value.access_token_expiry;
                    session.publicKey = request.publicKey;

                    openmoney_bucket.upsert(session.id, session, function(err, res){
                        if(err) {
                            accessTokenPostCallback(err, false);
                        } else {

                            var response = {};

                            response.access_token = getHash(request.proof_token);
                            response.access_token_expiry = publicKeyDoc.value.access_token_expiry;
                            response.scope = ['read:users', 'write:users', 'read:accounts', 'write:accounts', 'read:currencies',
                                'write:currencies', 'read:spaces', 'write:spaces', 'read:journals', 'write:journals'];
                            response.token_type = 'openmoney';

                            accessTokenPostCallback(null, response);
                        }
                    });
                }
            }
        }
    });

};

exports.authorizePost = function(request, authorizePostCallback) {

    //check that public key exsits.
    openmoney_bucket.get(getHash(request.publicKey), function(err,publicKeyDoc){
        if(err) {
            authorizePostCallback({code: 401, message: "That public key is not registered."}, false);
        }
        //encrypt random string with public key
        var key = new NodeRSA();

        key.importKey(request.publicKey, 'pkcs8-public');

        if(!key.isPublic()) {

            var err = {
                "code": 400,
                "message": 'Failed public key evaluation!'
            };
            authorizePostCallback(err, false);

        } else {

            var isSessionValid = false;

            if ( typeof publicKeyDoc.value != 'undefined' && typeof publicKeyDoc.value.access_token_expiry != 'undefined' && typeof publicKeyDoc.value.access_token != 'undefined') {
                if( publicKeyDoc.value.access_token_expiry > new Date().getTime()) {
                    //if access token still has time left re-issue the same token
                    isSessionValid = true;
                }
                if( publicKeyDoc.value.access_token_expiry <= new Date().getTime()) {
                    // session has expired

                }
            }

            if (isSessionValid) {
                //return current session
                var encryptedSymetricKey = encryptSymetricKey(key, publicKeyDoc.value.access_token);
                var response = {};
                response.access_token = encryptedSymetricKey;
                response.cors_token = request.cors_token;

                authorizePostCallback(null, response);
            } else {
                var symetrickey = getSymetricKey(key);
                var encryptedSymetricKey = encryptSymetricKey(key, symetrickey);

                publicKeyDoc.value.access_token = symetrickey;
                publicKeyDoc.value.access_token_expiry = new Date().getTime() +  ( 15 * 60 * 1000 ); //fifteen minutes

                openmoney_bucket.upsert(getHash(request.publicKey), publicKeyDoc.value, function(err, result) {
                    if(err){
                        authorizePostCallback(err, false);
                    } else {
                        var response = {};
                        response.access_token = encryptedSymetricKey;
                        response.cors_token = request.cors_token;

                        authorizePostCallback(null, response);
                    }
                });
            }
        }

    });
};


exports.registerPost = function(user, registerPostCallback){

    var users = [];
    var spaces = [];
    var currencies = [];
    var accounts = [];

    var installation = false;

    user.id = getHash(user.publicKey) + 'users~' + user.username.toLowerCase();

    users.push(user);

// user's view of default accounts

    var deefactorial = {};
    deefactorial.username = 'deefactorial';
    deefactorial.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuoreAzUFyumy3TxoohvkSrukPSX994GUxMg0u1K03m+kI+Uscl+aCJ9y9gtEIxRfZ9fGcDceAZDBA0neZS0aUHu7tH9oI9NzJPhl9A9ORMovdGOrFLqDaSKY6FvDxxQAWT0CbAGfUDGB20Y1793j4bqd1iQHSdo+oVM8bv54THCwFIpjcNW0llbO910t1FE32CWt2Y1kGheMrt0w8du3gFUNIykGoCau2E4q7iDbnID2gl7jNHQQbZbHJX42ywTgFd6a9RuH6c/0vUO2M4u6qXaabOML67uMIpOo77YYEe7VzhL1rqavAvLO4weV0FZ76E8GWMsu9jeKLG4f88OVrFd3QgF55FU8dgbypboeI/e048sNeuEVDRYg4tZUjbzONSSPUk4ZNKbYnhcgYoPWs/DBYFXSssYnQzl5dWgAc8yuYREhqy0Uhr4EzuOBjf/j161UPRrz622jUztN95+idIXwc+sbP76tW4w+8Jm3Z1By+I+2JCRPhcdJYywsH41nDMekKs8xV85mpIkLABompZ5llpKeJkyZboMgF3ynziCMZt7T1zk5dROeHE7GtyhM2Q3BJD+VGteRV1WUmBC1Y9CWTR7/qn4lk6Fa4QNymdx8IfM1uEINFLhAHr+AALwotwHwISjnN2mx8X+mjxXX+w85u3uO1clzPzBLGzrZ/IcCAwEAAQ==-----END PUBLIC KEY-----';
    deefactorial.email = 'deefactorial@gmail.com';
    deefactorial.email_notifications = true;
    deefactorial.id = getHash(deefactorial.publicKey) + 'users~' + deefactorial.username.toLowerCase();
    if (installation) {
        openmoney_bucket.insert(deefactorial.id, deefactorial, function(err, res) {
            if(err) throw err;
            console.log(res);
        });
    }
    deefactorial.id = getHash(user.publicKey) + 'users~' + deefactorial.username.toLowerCase();
    users.push(deefactorial);

    var michael = {};
    michael.username = 'mwl';
    michael.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5JW4L83dOXtWhlQ64F3DAcdckwabV+kYDUIYVSSPxFcPPHAVTDOBwk0NANiEfZQs/uFZgQMfjtz3QGy9LIOp7hVQYhCXtNnL+40iCBFo2uVUrcr5oQpIzQmEuNO1t5d46kRKTMDhg5nWuoPgF5EkLhaUnw0jRuKbM7b4enEijyOFJm9aYWYl/0Czp15bdwhm/q9Et3gvR5ag30GLViTi5dJakV+LI1rTR9SP9Z2wkViy1t3nO7De5dUsIOra67XClUtqCt9x4R8+yEllFMalb02fzgXpSL01lMa6naIIg3LjcP+pmGY1pZcbZj8NBr+Mg9PKOjz4YfHSB66Q73zCvHt+uoeEE0p8+v67pWleZlnckPVSRk0jRY095wNVw4mgso08XtJ4pO/TcmfsI/SgH6LjRPpakyfHVrwm2uBjK+u2HtKSq53UcuxoENP5PJodIt+6a+GqvdHuqE37np77+51lbFC7A4oJT13py/cDng3X0l+glLNJaxm67pVa4CgR9n7aPXaCcHLN/lvHkzctUa5k30uuAoZB2TiWcq1gWyGJYl1FKcxNxniYwpu9WJ05VwwVHoW1FvKVz/hpKEN4febifqOR/+JhpxkyrsDfmaWabXgMZygAlAGW9hCxfi5OagrslMNyuF8OTyrg6VQtNKO6QYcflReHRPDzUz/54UsCAwEAAQ==-----END PUBLIC KEY-----';
    michael.email = 'michael.linton@gmail.com';
    michael.email_notifications = true;
    michael.id = getHash(michael.publicKey) + 'users~' + michael.username.toLowerCase();
    if (installation) {
        openmoney_bucket.insert(michael.id, michael, function(err, res) {
            if(err) throw err;
            console.log(res);
        });
    }
    michael.id = getHash(user.publicKey) + 'users~' + michael.username.toLowerCase();
    users.push(michael);

    var les = {};
    les.username = 'les';
    les.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAss/XIJKfafrpWizysIaxz8yp/92mnu+bP24f+OOXcZfo6LVHFUNnWABCWvui5c4/I68SvKDcjr/WCGlfRVmiRCdoGAt4JT3biaBJUkO3ng4JYi6l17PKnMUDw/d525gnU/uFQJ1HlzovT7GNJ1pUS9vy9attgNgkrGce5n9W03wSU5CAwWD5iZnMKK7TzBrwWO1AEh272vvyomgNO9sKU+g86B0Zj0HuP4feTJQ1RPXNZd5LYFjrtrfqi1lw+/fLPWhB4TfV7nFE/tSvrigA5f8pxPzeunUgh2JZlubtC/3fwOMI2WXNtvkUaGE/bbRGCEFwxdk4U20MQ2G4goEvMsMZZNmD3mygHmXRPTSOQvbT6Iamoxq1qhzzWBXCO7NoJyARw/RpVy+wjXIWXtm1BtrEF2j9JsbDorFQy1jkDijVdAGB6DXi0YhK5mjggIp77RClN1ulpaG8Tdso9Xp3xh490AnoQDSvIsEIG9WuYEhWZEbTGSkESf76ll7qff1d3Hy1sl+9iCPIfCcNu58jGclLw8xjX25Z8SJMJBlAXPPEEj5sBzgpQ+Q6jaVTfkxnopkq6CsSsSzcdhLv2oAijLdjmevDiYy5KsFLSFai3GkkCZk9K3PCdgPv3uf8N2vjkWp+gTmL+PUXM9uZItOPhpZVPEtZjqgzX9166qnybqkCAwEAAQ==-----END PUBLIC KEY-----';
    les.email = 'les.moore@commonresource.net';
    les.email_notificaitons = true;
    les.id = getHash(les.publicKey) + 'users~' + les.username.toLowerCase();
    if (installation) {
        openmoney_bucket.insert(les.id, les, function(err, res) {
            if(err) throw err;
            console.log(res);
        });
    }
    les.id = getHash(user.publicKey) + 'users~' + les.username.toLowerCase();

    var space_root = "cc";
    var users_space = "cc";
    var space_currency = "cc";
    if((new RegExp('.')).test(user.username)){
        var numberOfSpaces = (user.username.match(new RegExp(".", "g")) || []).length;
        var spaces_array = user.username.toLowerCase().split(".");

        space_root = spaces_array[numberOfSpaces-1];

        // all root spaces are hard coded to start with.
        if(space_root == 'ca' || space_root == 'uk' || space_root == 'cc'){
            // these are the pre-programmed root spaces that are allowed.

            //iterate through the spaces starting with the root.
            for(var i = numberOfSpaces-1; i < spaces_array.length; i--) {

                var space_parent = ''; //user.username.toLowerCase().substring(indexOf(user.username, '.'), user.username.length);
                //build the space
                for (var j = i; j < spaces_array.length; j++){
                    space_parent += '.' + spaces_array[j]
                }
                //remove leading dot.
                space_parent = space_parent.substring(1,space_parent.length);

                //update the users space variable for their main cc account.
                users_space = space_parent;

                if (space_parent == 'cc') {
                    //this case is handled below
                }

                if (space_parent == 'ca') {
                    var space = {};
                    space.space = "ca";
                    space.space_parent = "";
                    space.created = new Date().getTime(); //static
                    space.stewards = [deefactorial.id, michael.id];
                    space.id = getHash(user.publicKey) + 'space~' + space.space;
                    spaces.push( space );
                }

                if (space_parent == 'uk') {
                    var space = {};
                    space.space = "uk";
                    space.space_parent = "";
                    space.created = new Date().getTime(); //static
                    space.stewards = [les.id];
                    space.id = getHash(user.publicKey) + 'space~' + space.space;
                    spaces.push( space );

                    //push this user account onto the users stack of accounts known
                    users.push(les);
                }

                var user_space = {};
                user_space.space = user.username.toLowerCase().substring(0, indexOf(user.username, '.'));
                user_space.space_parent = space_parent.toLowerCase();
                user_space.created = new Date().getTime();
                user_space.stewards = [user.id];
                user_space.id = getHash(user.publicKey) + 'space~' + user_space.space + "." + user_space.space_parent;
                spaces.push( space );

                var space_currency = space_parent;
                //check if currency exists with the same space name
                //if exists add currency and account
                //this is a blocking operation because it involves a lookup, so this has to be done before submit.
            }
        }
    }

    var space = {};
    space.space = "cc";
    space.space_parent = "";
    space.created = new Date().getTime(); //static
    space.stewards = [deefactorial.id, michael.id];
    space.id = getHash(user.publicKey) + 'space~' + space.space;
    spaces.push( space );


    var currency = {};
    currency.currency = "cc";
    currency.currency_space = "";
    currency.created = new Date().getTime(); //static
    currency.stewards = [ deefactorial.id , michael.id ];
    currency.id = getHash(user.publicKey) + 'currency~' + currency.currency;
    currencies.push(currency);


    var account = {};
    account.account = user.username.toLowerCase();
    account.account_space = users_space;
    account.currency = "cc";
    account.currency_space = "";
    account.stewards = [ user.id ];
    account.id = getHash(user.publicKey) + 'account~' + account.account.toLowerCase() + '.' + account.account_space.toLowerCase() + '~' + account.currency.toLowerCase();
    accounts.push(account);


    var key = new NodeRSA();

    //key.importKey(user.publicKey, 'pkcs8-public');
    key.importKey(user.publicKey);

    if(!key.isPublic()) {

        var err = {
            "code": 400,
            "message": 'Failed public key evaluation!'
        };
        registerPostCallback(err, false);


    } else {

        var parallelTasks = {};
        parallelTasks.user_global = function(callback) {
            openmoney_bucket.get("users~" + user.username.toLowerCase(), function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // user already exists
                    callback({code:499, message: "User exists with username: " + user.username.toLowerCase()}, true);
                }
            });
        };
        parallelTasks.user_local = function(callback) {
            users_bucket.get(user.id, function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // user already exists
                    callback({code:498, message: "You already submitted your registration."}, true);
                }
            });
        };
        parallelTasks.user_publicKey = function(callback) {
            openmoney_bucket.get(getHash(user.publicKey), function (err, res) {
                if (err) {
                    // doc doesn't exist insert it.
                    callback(null, false);
                } else {
                    // user already exists
                    callback({code:495, message: "Public key exists: " + user.publicKey}, true);
                }
            });
        };
        spaces.forEach(function(space){
            if(space.stewards[0] == user.id) {
                parallelTasks[space.space] = function (callback) {
                    openmoney_bucket.get("space~" + space.space.toLowerCase() + '.' + space.parent_space.toLowerCase(), function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // soace already exists through error
                            callback({code:497, message: "A space exists with the name: " + space.space.toLowerCase() + '.' + space.parent_space.toLowerCase()}, true);
                        }
                    });
                };
            }
        });

        currencies.forEach(function(currency){
            if(currency.stewards[0] == user.id) {
                parallelTasks[currency.currency] = function (callback) {
                    openmoney_bucket.get("currency~" + currency.currency.toLowerCase() + "." + currency.currency_space.toLowerCase(), function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // doc already exists through error
                            callback({code:496, message: "A currency exists with the name: " + currency.currency.toLowerCase() + "." + currency.currency_space.toLowerCase()}, true);
                        }
                    });
                };
            }
        });

        if (space_currency != 'cc') {
            parallelTasks[space_currency] = function (callback) {
                openmoney_bucket.get("currency~" + space_currency.toLowerCase(), function (err, res) {
                    if (err) {
                        // doc doesn't exist insert it.
                        callback(null, false);
                    } else {

                        //no error just add the result the users list of known currencies and add an account in that currency.
                        var currency = res.value;
                        currency.id = getHash(user.publicKey) + currency.id;
                        currencies.push(currency);

                        var account = {};
                        account.account = user.username.toLowerCase();
                        account.account_space = users_space;
                        account.currency = space_currency.toLowerCase().substring(0,indexOf(space_currency,"."));
                        account.currency_space = space_currency.toLowerCase().substring(indexOf(space_currency,"."),space_currency.length);
                        account.stewards = [ user.id ];
                        account.id = getHash(user.publicKey) + 'account~' + account.account.toLowerCase() + '.' + account.account_space.toLowerCase() + '~' + account.currency.toLowerCase() + '.' + account.currency_space.toLowerCase();
                        accounts.push(account);

                        callback(null, false);
                    }
                });
            };
        }
        accounts.forEach(function(account){
            if(account.stewards[0] == user.id) {
                var account_currency = account.currency_space == '' ? account.currency.toLowerCase() : account.currency.toLowerCase() + "." + account.currency_space.toLowerCase();
                parallelTasks[account.account] = function (callback) {
                    openmoney_bucket.get("account~" + account.account.toLowerCase() + "." + account.account_space.toLowerCase() + "~" + account_currency , function (err, res) {
                        if (err) {
                            // doc doesn't exist insert it.
                            callback(null, false);
                        } else {
                            // doc already exists through error
                            callback({code:496, message: "Account exists with the name: " + account.account.toLowerCase() + "." + account.account_space.toLowerCase() + "~" + account_currency}, true);
                        }
                    });
                };
            }
        });

        async.parallel(parallelTasks,
            function(err, results) {
                // results is now equals to: {user: false, spacename: false}
                if(err) {

                    registerPostCallback(err, false);

                } else {
                    //we are a go to insert the records.

                    var insertTasks = {};

                    insertTasks.user_local = function(callback) {
                        //insert the user account
                        users_bucket.insert(user.id, user, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err, false);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };

                    insertTasks.user_global = function(callback) {
                        var user_global = clone(user);
                        user_global.id = "users~" + user.username.toLowerCase();
                        openmoney_bucket.insert(user_global.id, user_global, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err, false);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };

                    insertTasks.user_publicKey = function(callback) {
                        var user_publicKey = {};
                        user_publicKey.id = getHash(user.publicKey);
                        user_publicKey.username = user.username;
                        openmoney_bucket.insert(user_publicKey.id, user_publicKey, function (err, res) {
                            if (err) {
                                // doc doesn't exist insert it.
                                callback(err, false);
                            } else {
                                // success
                                callback(null, res);
                            }
                        });
                    };

                    // persist the spaces, currencies, and accounts for the user.
                    spaces.forEach(function(space){
                        insertTasks[space.id] = function(callback) {
                            users_bucket.insert(space.id, space, function( err, res) {
                                if (err) {
                                    callback(err, false);
                                } else {
                                    // success
                                    callback(null, res);
                                }
                            });
                        };
                        if (space.stewards[0] == user.id) {

                            var space_global = clone(space);
                            space_global.id = "spaces~" + space.space.toLowerCase() + '.' + space.space_parent.toLowerCase();
                            insertTasks[space_global.id] = function(callback) {
                                openmoney_bucket.insert(space_global.id, space_global, function (err, res) {
                                    if (err) {
                                        callback(err, false);
                                    } else {
                                        // success
                                        callback(null, res);
                                    }
                                });
                            };
                        }
                    });
                    currencies.forEach(function(currency) {
                        insertTasks[currency.id] = function(callback) {
                            users_bucket.insert(currency.id, currency, function (err, res) {
                                if (err) {
                                    callback(err, false);
                                } else {
                                    // success
                                    callback(null, res);
                                }
                            });
                        };
                        if (currency.stewards[0] == user.id) {
                            var currency_global = clone(currency);
                            currency_global.id = "currencies~" + currency_global.currency.toLowerCase() + "." + currency_global.currency_space.toLowerCase();
                            insertTasks[currency_global.id] = function(callback) {
                                openmoney_bucket.insert(currency_global.id, currency_global, function (err, res) {
                                    if (err) {
                                        callback(err, false);
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
                            users_bucket.insert(account.id, account, function (err, res) {
                                if (err) {
                                    callback(err, false);
                                } else {
                                    // success
                                    callback(null, res);
                                }
                            });
                        };
                        var account_global = clone(account);
                        var account_currency = account.currency_space == '' ? account.currency.toLowerCase() : account.currency.toLowerCase() + "." + account.currency_space.toLowerCase();
                        account_global.id = "accounts~" + account_global.account.toLowerCase() + "." + account_global.account_space.toLowerCase() + "~" + account_currency;
                        insertTasks[account_global.id] = function(callback) {
                            openmoney_bucket.insert(account_global.id, account_global, function (err, res) {
                                if (err) {
                                    callback(err, false);
                                } else {
                                    // success
                                    callback(null, res);
                                }
                            });
                        };
                    });

                    async.parallel(insertTasks,
                        function(err, results) {
                            // results is now equals to: {user: false, spacename: false}
                            if (err) {

                                registerPostcallback(err, false);

                            } else {

                                //success

                                //send the response to the user

                                var response = {
                                    "accounts": {},
                                    "currencies": {},
                                    "spaces": {},
                                    "users": {}
                                };

                                response.users = users;
                                response.spaces = spaces;
                                response.currencies = currencies;
                                response.accounts = accounts;

                                registerPostCallback(null, response);
                            }
                        });
                }
            });
    }
};


