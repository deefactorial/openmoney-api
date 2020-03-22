const util = require('../../helpers/util.helper');
const db = require('../../helpers/db.helper');
const mail = require('../../helpers/mail.helper');
const crypto = require('../../helpers/crypto.helper');
const scrypt = require("scrypt");
const NodeRSA = require('node-rsa');
const async = require('async');
require('dotenv').config();
const ROOT_SPACE = process.env.ROOT_SPACE;
const ROOT_CURRENCY = process.env.ROOT_CURRENCY;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

exports.stewardsPost = function (args, res, next) {
    /**
     * parameters expected in the args:
     * registerRequest (Register_request)
     **/

    var examples = {};

    examples['application/json'] = {
        "spaces": "",
        "accounts": "",
        "stewards": "",
        "currencies": ""
    };

    var request = {};
    request.stewardname = args.register_request.value.stewardname;
    request.password = args.register_request.value.password;
    request.publicKey = args.register_request.value.publicKey;
    if (typeof args.register_request.value.email != 'undefined') {
        request.email = args.register_request.value.email;
    }
    if (typeof args.register_request.value.email_notifications != 'undefined') {
        request.email_notifications = args.register_request.value.email_notifications;
    }

    handleStewardsPost(request, function (err, result) {
        if (err) {
            // throw error
            var examples = {};
            examples['application/json'] = err;
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(result);
        }
    });
};

function handleStewardsPost(steward_request, registerPostCallback){
    var stewards = [];
    var spaces = [];
    var currencies = [];
    var accounts = [];

    var steward = {};
    steward.password = scrypt.kdfSync(steward_request.password, crypto.scryptParameters).toString('base64');
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
    steward_bucket.id = steward_bucket.type + "~" + crypto.getHash(steward.publicKey);

    // stewards view of default accounts

    var admin_steward = {
        id: `stewards~${ADMIN_USERNAME || 'admin'}`
    };

    var stewards_space = ROOT_SPACE;
    var space_currency = ROOT_CURRENCY;
    if(steward.stewardname.indexOf('.') !== -1){

        //this is buggy
        //var numberOfSpaces = (steward.stewardname.match(new RegExp(".", "g")) || []).length;
        var spaces_array = steward.stewardname.toLowerCase().split('.');
        var numberOfSpaces = spaces_array.length;

        var space_root = steward.stewardname.toLowerCase().substring(steward.stewardname.toLowerCase().indexOf('.') + 1, steward.stewardname.toLowerCase().length);

        if (space_root == ROOT_SPACE){
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

                if (space_parent.indexOf('.' === -1)){
                    stewards_bucket.namespaces.push(`namespaces~${space_parent}`);
                } else {
                    stewards_bucket.namespaces.push(`namespaces~${space_parent}`);
                    // add last item in namespace
                    const parts = space_parent.split('.');
                    stewards_bucket.namespaces.push(`namespaces~${parts[parts.length - 1]}`);
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
          return registerPostCallback({status:400,code:1050, message: 'trying to register for a non registerable namespace root:' + space_root});
        }
    } else { // else dot in stewardname
      var steward_space = {};
      steward_space.namespace = steward.stewardname.toLowerCase() + `.${ROOT_SPACE}`;
      steward_space.parent_namespace = ROOT_SPACE;
      steward_space.created = new Date().getTime();
      steward_space.stewards = [ steward.id ];
      steward_space.type = 'namespaces';
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
    // spaces.push( space );
    steward_bucket.namespaces.push(space.id);

    //This is the community currency all stewards get an account in this currency when they use the register api.
    var currency = {};
    currency.currency = "cc";
    currency.currency_namespace = ""; //currencies have thier own spaces as well cc is the root.
    currency.created = new Date().getTime(); //static
    // currency.stewards = [ deefactorial.id , michael.id ];
    currency.stewards = [ admin_steward.id ];
    currency.type = "currencies";
    currency.id = 'currencies~' + currency.currency;
    currencies.push( currency );
    steward_bucket.currencies.push(currency.id);

    // accounts don't store journal entries, journal entries reference accounts.
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
        // Check all assumptions with models:
        var parallelTasks = {};
        parallelTasks.steward_global = function(callback) {
            db.openmoney_bucket.get("stewards~" + steward.stewardname.toLowerCase(), function (err, res) {
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
            db.stewards_bucket.get("steward_bucket~" + crypto.getHash(steward.publicKey), function (err, res) {
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
            db.openmoney_bucket.get("steward_bucket~" + crypto.getHash(steward.publicKey), function (err, res) {
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
                    db.openmoney_bucket.get(space.id, function (err, res) {
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
                    db.openmoney_bucket.get(currency.id, function (err, res) {
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
                db.openmoney_bucket.get("currencies~" + space_currency.toLowerCase(), function (err, res) {
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
                    db.openmoney_bucket.get("accounts~" + account.account.toLowerCase() + "." + account.account_namespace.toLowerCase() + "~" + account_currency , function (err, res) {
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

                    if (steward.email)
                        insertTasks.stewards_emailList = function(callback){
                            db.openmoney_bucket.get("stewards_emailList~" + steward.email.toLowerCase(), function(err, emailList){
                              if(err){
                                if(err.code == 13){
                                  //not found create the doc.
                                  var emailList = {};
                                  emailList.type = 'stewards_emailList';
                                  emailList.email = steward.email.toLowerCase();
                                  emailList.stewards = [ steward.stewardname.toLowerCase() ];
                                  emailList.id = emailList.type + '~' + emailList.email.toLowerCase();
                                  db.openmoney_bucket.insert(emailList.id, emailList, function(err, ok){
                                    callback(err, ok);
                                  })
                                } else {
                                  callback(err);
                                }
                              } else {
                                //found update the doc.
                                emailList.value.stewards.push(steward.stewardname.toLowerCase());
                                db.openmoney_bucket.replace(emailList.value.id, emailList.value, {cas: emailList.cas}, function(err, ok){
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
                    value_references.documents = ["steward_bucket~" + crypto.getHash(steward.publicKey)];

                    //update stewards
                    steward_bucket.stewards.forEach(function(stewardID){
                        insertTasks[stewardID + "val_ref"] = function(callback) {
                            db.stewards_bucket.get(stewardID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = stewardID;
                                        db.stewards_bucket.insert(stewardID, value_references, function(err, ok){
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
                                    val_ref.value.documents.push("steward_bucket~" + crypto.getHash(steward.publicKey));
                                    db.stewards_bucket.replace(stewardID, val_ref.value, {cas: val_ref.cas}, function(err, ok){
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

                    // //update namespaces
                    // steward_bucket.namespaces.forEach(function(namespaceID){
                    //     insertTasks[namespaceID + "val_ref"] = function(callback) {
                    //         db.stewards_bucket.get(namespaceID, function(err, val_ref){
                    //             if(err) {
                    //                 if(err.code == "13"){
                    //                     value_references.id = namespaceID;
                    //                     db.stewards_bucket.insert(namespaceID, value_references, function(err, ok){
                    //                         if(err) {
                    //                             callback(err);
                    //                         } else {
                    //                             callback(null, ok);
                    //                         }
                    //                     });
                    //                 } else {
                    //                     callback(err);
                    //                 }
                    //             } else {
                    //                 val_ref.value.documents.push("steward_bucket~" + crypto.getHash(steward.publicKey));
                    //                 db.stewards_bucket.replace(namespaceID, val_ref.value, {cas: val_ref.cas}, function(err, ok){
                    //                     if(err) {
                    //                       if(err.code == 12){
                    //                         insertTasks[namespaceID + "val_ref"](callback);
                    //                       } else {
                    //                         callback(err);
                    //                       }
                    //                     } else {
                    //                         callback(null, ok);
                    //                     }
                    //                 });
                    //             }
                    //         })
                    //     };
                    // });

                    //update currencies
                    steward_bucket.currencies.forEach(function(currencyID){
                        insertTasks[currencyID + "val_ref"] = function(callback) {
                            db.stewards_bucket.get(currencyID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = currencyID;
                                        db.stewards_bucket.insert(currencyID, value_references, function(err, ok){
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
                                    val_ref.value.documents.push("steward_bucket~" + crypto.getHash(steward.publicKey));
                                    db.stewards_bucket.replace(currencyID, val_ref.value, {cas: val_ref.cas},function(err, ok){
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
                            db.stewards_bucket.get(accountID, function(err, val_ref){
                                if(err) {
                                    if(err.code == "13"){
                                        value_references.id = accountID;
                                        db.stewards_bucket.insert(accountID, value_references, function(err, ok){
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
                                    val_ref.value.documents.push("steward_bucket~" + crypto.getHash(steward.publicKey));
                                    db.stewards_bucket.replace(accountID, val_ref.value, {cas : val_ref.cas}, function(err, ok){
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
                        db.openmoney_bucket.insert(accounts_list.id, accounts_list, function(err, res){
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, res);
                            }
                        })
                    };

                    insertTasks.stewards_global = function(callback) {
                        var steward_global = util.clone(steward);
                        steward_global.id = "stewards~" + steward.stewardname.toLowerCase();
                        db.openmoney_bucket.insert(steward_global.id, steward_global, function (err, res) {
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
                        steward_publicKey.id = "steward_bucket~" + crypto.getHash(steward.publicKey);
                        steward_publicKey.type = "steward_bucket";
                        steward_publicKey.stewardname = steward.stewardname;
                        if(steward.privateKey != null){
                            steward_publicKey.privateKey = steward.privateKey;
                        }
                        db.openmoney_bucket.insert(steward_publicKey.id, steward_publicKey, function (err, res) {
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
                        db.stewards_bucket.insert("steward_bucket~" + crypto.getHash(steward.publicKey) , steward_bucket, function (err, res) {
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
                                db.openmoney_bucket.insert(space.id, space, function (err, res) {
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
                                db.openmoney_bucket.insert(currency.id, currency, function (err, res) {
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
                            db.openmoney_bucket.insert(account.id, account, function (err, res) {
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
                                registerPostCallback(err, false);
                            } else {
                                //send the response to the steward

                                var response = {
                                  ok: true,
                                  stewards: {}
                                };

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

                                var to = '"' + steward.stewardname + '"<' + steward.email + '>';
                                if(typeof steward.email_notifications !== 'undefined' && steward.email_notifications === false){
                                  to = null;
                                }

                                var subject = 'Welcome to Openmoney Network: "' + steward.stewardname + '"<' + steward.email + '>';
                                var messageHTML = '<h3>Welcome to Openmoney Network: "' + steward.stewardname + '"&lt;' + steward.email + '&gt;.</h3>';
                                messageHTML += '<b>Your stewardname is "' + steward.stewardname + '". You can log in here: <a href="' + process.env.API_HOST + '#login">' + process.env.API_HOST + '/#login</a></b> .';
                                messageHTML += '<h5>If you forgot your password you can reset it here: <a href="' + process.env.API_HOST + '/#forgot">' + process.env.API_HOST + '/#forgot</a>.</h5>';
                                mail.sendmail(to, null, process.env.MONITOR_ADDRESSES, subject, messageHTML, function(err, ok){
                                  console.info('sendmail:', err, ok);
                                  registerPostCallback(null, response);
                                });
                            }
                        });
                }
            });
    }
};