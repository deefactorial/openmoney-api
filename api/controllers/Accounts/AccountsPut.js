const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.accountsPut = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * authorization (String)
     * accounts (Accounts)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.accounts = req.swagger.params.accounts.value;
    request.publicKey = req.user.publicKey;

    accountsPut(request, function (err, result) {
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

const accountsPut = function(request, accountsPutCallback) {
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
    // var olddoc_id = request.accounts.id;
    //get the old doc
    db.openmoney_bucket.get(olddoc_id, function(err, olddoc){
        if(err){
            if(err.code == 13) {
                var err = {};
                err.status = 404;
                err.code = 4010;
                err.message = "Account does not exist.";
                accountsPutCallback(err);
            } else {
                accountsPutCallback(err);
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
                var err = {};
                err.status = 403;
                err.code = 4011;
                err.message = "You cannot change the currency or currency namespace of an account; Create a new account.";
                accountsPutCallback(err);

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
                        db.openmoney_bucket.get("accountsList~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, accountList){
                            if(err){
                                if(err.code == 13) {
                                    callback(null, true);
                                } else {
                                    callback(err);
                                }
                            } else {
                                //there are accounts with that name
                                var parallelAccountTasks = {};
                                //check who is the steward of the accounts if this is the steward then allow.
                                accountList.value.list.forEach(function(accountID){
                                    parallelAccountTasks[accountID] = function(callback) {
                                        db.openmoney_bucket.get(accountID, function(err, accountValue){
                                            if(err) {
                                                callback(err);
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
                                                        callback(error);
                                                    } else {
                                                        callback(null, accountValue.value);
                                                    }
                                                } else {
                                                    var error = {};
                                                    error.status = 403;
                                                    error.code = 4009;
                                                    error.message = 'There is another account with that name.';
                                                    callback(error);
                                                }
                                            }
                                        })
                                    };
                                });

                                async.parallel(parallelAccountTasks, function(err, ok){
                                  callback(err, ok);
                                });
                            }
                        });
                    };

                    parallelCheckTasks.currency = function(callback) {
                        db.openmoney_bucket.get("currencies~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, currency){
                            if(err){
                                if(err.code == 13){
                                    callback(null, true);
                                } else {
                                    callback(err);
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
                                    callback(err);
                                }
                            }
                        });
                    };

                    parallelCheckTasks.namespace = function(callback) {
                        db.openmoney_bucket.get("namespaces~" + account.account.toLowerCase() + '.' + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                                if(err.code == 13){
                                    callback(null, true);
                                } else {
                                    callback(err);
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
                                    callback(err);
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
                        db.openmoney_bucket.get("namespaces~" + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                                if(err.code == 13){
                                    var err = {};
                                    err.status = 404;
                                    err.code = 4005;
                                    err.message = "Account namespace does not exist.";
                                    callback(err);
                                } else {
                                    callback(err);
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
                        parallelCheckTasks[steward] = function (callback) {
                            db.openmoney_bucket.get(steward, function (err, doc) {
                                if (err) {
                                    if (err.code == 13) {
                                        var error = {};
                                        error.status = 404;
                                        error.code = 4007;
                                        error.message = "Account stewards do not exist.";
                                        callback(error);
                                    } else {
                                        callback(err);
                                    }
                                } else {
                                    callback(null, doc);
                                }
                            })
                        };
                    });
                    account.stewards.forEach(function (steward) {
                        parallelCheckTasks[steward] = function (callback) {
                            db.openmoney_bucket.get(steward, function (err, doc) {
                                if (err) {
                                    if (err.code == 13) {
                                        var error = {};
                                        error.status = 404;
                                        error.code = 4007;
                                        error.message = "Account stewards do not exist.";
                                        callback(error);
                                    } else {
                                        callback(err);
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
                        db.stewards_bucket.get("AccountsPublicKey~" + crypto.getHash(account.publicKey), function (err, doc) {
                            if (err) {
                                if (err.code == 13) {
                                    //not found
                                    callback(null, true);
                                } else {
                                    callback(err);
                                }
                            } else {
                                var err = {};
                                err.status = 403;
                                err.code = 4012;
                                err.message = "The public key of this account is not unique.";
                                callback(err);
                            }
                        })
                    };
                }
                if(typeof account.publicKey != 'undefined' && typeof olddoc.value.publicKey == 'undefined'){
                    //account publicKey is added
                    publicKey_change = true;
                    parallelCheckTasks.publicKey_change = function(callback) {
                        db.stewards_bucket.get("AccountsPublicKey~" + crypto.getHash(account.publicKey), function (err, doc) {
                            if (err) {
                                if (err.code == 13) {
                                    //not found
                                    callback(null, true);
                                } else {
                                    callback(err);
                                }
                            } else {
                                var err = {};
                                err.status = 403;
                                err.code = 4012;
                                err.message = "The public key of this account is not unique.";
                                callback(err);
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
                    //account disabled is retained.
                    account.disabled = olddoc.value.disabled;
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
                    account.currency_disabled = olddoc.value.currency_disabled;
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
                    //account namespace disabled is retained.
                    account.namespace_disabled = olddoc.value.namespace_disabled;
                }


                //check if they are authorized to do the change

                if(currency_disabled_changed){
                    parallelCheckTasks.currency_disabled_check = function(callback) {
                        db.openmoney_bucket.get("currencies~" + currency, function(err, currency){
                            if(err){
                                callback(err);
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
                                    callback(err);
                                }
                            }
                        })
                    };
                }

                if(namespace_disabled_changed){
                    parallelCheckTasks.namespace_disabled_check = function(callback) {
                        db.openmoney_bucket.get("namespaces~" + account.account_namespace.toLowerCase(), function(err, namespace){
                            if(err){
                              callback(err);
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
                                    callback(err);
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

                          var checks = {};

                          checks.currency = function(cb){
                            //check if you are the steward of the currency or the steward
                            var currencyId = 'currencies~' + olddoc.value.currency + '.' + olddoc.value.currency_namespace;
                            if(olddoc.value.currency_namespace === ''){
                              currencyId = 'currencies~' + olddoc.value.currency;
                            }
                            db.openmoney_bucket.get(currencyId, function(err, currency){
                              if(err){
                                cb(err);
                              } else {

                                if(currency.value.stewards.indexOf("stewards~" + request.stewardname.toLowerCase()) === -1){
                                  cb(null, false);
                                } else {
                                  cb(null, true);
                                }
                              }
                            })
                          };

                          checks.namespace = function(cb){
                            var namespaceId = 'namespaces~' + olddoc.value.account_namespace;
                            db.openmoney_bucket.get(namespaceId, function(err, namespace){
                              if(err){
                                cb(err);
                              } else {

                                if(namespace.value.stewards.indexOf("stewards~" + request.stewardname.toLowerCase()) === -1){
                                  cb(null, false);
                                } else {
                                  cb(null, true);
                                }

                              }
                            })
                          }

                          async.parallel(checks, function(err, results){
                            if(err){
                              callback(err);
                            } else {
                              if(results.currency === false && results.namespace === false){
                                var err = {};
                                err.status = 403;
                                err.code = 4013;
                                err.message = "You are not the steward of this account.";
                                callback(err);
                              } else {
                                callback(null, true);
                              }
                            }
                          })


                        } else {
                            callback(null, true);
                        }
                    }
                }

                async.parallel(parallelCheckTasks, function(err, results){
                    if(err) {
                        accountsPutCallback(err);
                    } else {
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

                        var parallelInsertTasks = {};

                        parallelInsertTasks.account = function(callback) {
                            db.openmoney_bucket.upsert(account.id, account, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            })
                        };

                        if(account.id != olddoc.value.id){
                            parallelInsertTasks.remove_olddoc = function(callback){
                                db.openmoney_bucket.remove(olddoc.value.id, function(err, ok){
                                    if(err) {
                                        callback(err,null);
                                    } else {
                                        callback(null, ok);
                                    }
                                })
                            };
                        }

                        parallelInsertTasks.move_value_ref = function(callback){
                            db.stewards_bucket.get(olddoc.value.id, function(err, oldValRef){
                                if(err){
                                    callback(err, null);
                                } else {
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
                                            var steward_hash = "steward_bucket~" + crypto.getHash(results[steward].value.publicKey);
                                            var index = oldValRef.value.documents.indexOf(steward_hash);
                                            if (index !== -1) {
                                                oldValRef.value.documents.splice(index, 1);
                                            }
                                            parallelLookupTasks[steward_hash] = function(callback){
                                                db.stewards_bucket.get(steward_hash, function(err, steward_bucket) {
                                                    if(err) {
                                                        callback(err, null);
                                                    } else {
                                                        //find old reference if exists and remove.
                                                        var index = steward_bucket.value.accounts.indexOf(olddoc.value.id);
                                                        if(index !== -1){
                                                            steward_bucket.value.accounts.splice(index, 1);
                                                        }
                                                        db.stewards_bucket.replace(steward_hash, steward_bucket.value, {cas: steward_bucket.cas},function(err, ok){
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
                                            oldValRef.value.documents.push("steward_bucket~" + crypto.getHash(results[steward].value.publicKey));
                                        })
                                    }

                                    oldValRef.value.documents.forEach(function(steward_hash){
                                        parallelLookupTasks[steward_hash] = function(callback){
                                            db.stewards_bucket.get(steward_hash, function(err, steward_bucket) {
                                                if(err) {
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

                                                    db.stewards_bucket.replace(steward_hash, steward_bucket.value, {cas: steward_bucket.cas},function(err, ok){
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
                                          db.stewards_bucket.upsert(oldValRef.value.id, oldValRef.value, function(err, ok){
                                              if(err){
                                                  callback(err, null);
                                              } else {
                                                  db.stewards_bucket.remove(olddoc.value.id, function(err, ok){
                                                      if(err){
                                                          callback(err, null);
                                                      } else {
                                                          callback(null, ok);
                                                      }
                                                  })
                                              }
                                          })
                                        } else {
                                          db.stewards_bucket.upsert(oldValRef.value.id, oldValRef.value, function(err, ok){
                                              if(err){
                                                  callback(err, null);
                                              } else {
                                                  callback(null, ok);
                                              }
                                          })
                                        }

                                    };

                                    async.parallel(parallelLookupTasks, function(err, results){
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
                                accountsPutCallback(err);
                            } else {
                                //TODO: notify those affected
                                var response = {};
                                response.ok = true;
                                response.id = account.id;
                                accountsPutCallback(null, response);
                            }
                        })
                    }
                })
            }
        }
    });
};