const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.accountsPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     * account (Accounts)
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
    request.publicKey = req.user.publicKey;

    accountsPost(request, function (err, result) {
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

const accountsPost = function(request, accountsPostCallback) {
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
    parallelTasks.namespace_check = function(callback) {
        db.openmoney_bucket.get("namespaces~" + request.account.account_namespace.toLowerCase(), function(err, namespace){
            if(err){
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
        db.openmoney_bucket.get("currencies~" + currency, function(err, currencydoc){
            if(err) {
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
            db.openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                if (err) {
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
        db.openmoney_bucket.get("accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, accountList){
            if(err){
                if(err.code == 13) {
                    callback(null, true);
                } else {
                    callback(err, null);
                }
            } else {
                //there are accounts with that name
                var parallelAccountTasks = {};
                //check who is the steward of the accounts if this is the steward then allow.
                accountList.value.list.forEach(function(accountID){
                    parallelAccountTasks[accountID] = function(callback) {
                        db.openmoney_bucket.get(accountID, function(err, thisAccount){
                            if(err) {
                                callback(err, null);
                            } else {
                                var is_steward = false;
                                thisAccount.value.stewards.forEach(function(steward){
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
        db.openmoney_bucket.get("namespaces~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, namespace){
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
        db.openmoney_bucket.get("currencies~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, currency){
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
            db.stewards_bucket.get("AccountsPublicKey~" + crypto.getHash(account.publicKey), function (err, doc) {
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
            accountsPostCallback(err, null);
        } else {
            //create the account

            var parallelInsertTasks = {};
            parallelInsertTasks.account = function(callback){
                db.openmoney_bucket.insert(account.id, account, function(err, ok){
                    if(err){
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                })
            };

            //add the account to an account list
            parallelInsertTasks.accountList = function(callback){
                db.openmoney_bucket.get("accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase(), function(err, accountsList){
                    if(err){
                        if(err.code==13){
                            //insert doc
                            var accountsList = {};
                            accountsList.id = "accountsList~" + request.account.account.toLowerCase() + '.' + request.account.account_namespace.toLowerCase();
                            accountsList.type = "accountsList";
                            accountsList.list = [ account.id ];
                            db.openmoney_bucket.insert(accountsList.id, accountsList, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            })
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        accountsList.value.list.push(account.id);
                        db.openmoney_bucket.upsert(accountsList.value.id, accountsList.value, {cas: accountsList.cas}, function(err, ok){
                            if(err){
                              if(err.code == 12){
                                parallelInsertTasks.accountList(callback);
                              } else {
                                callback(err, null);
                              }
                            } else {
                                callback(null, ok);
                            }
                        })
                    }
                });
            };

            //add the account to an currency account list
            parallelInsertTasks.currencyAccountList = function(callback){
                db.openmoney_bucket.get("currencyAccountList~" + request.account.currency.toLowerCase() + '.' + request.account.currency_namespace.toLowerCase(), function(err, accountsList){
                    if(err){
                        if(err.code==13){
                            //insert doc
                            var accountsList = {};
                            accountsList.id = "currencyAccountList~" + request.account.currency.toLowerCase() + '.' + request.account.currency_namespace.toLowerCase();
                            accountsList.type = "currencyAccountList";
                            accountsList.list = [ account.id ];
                            db.openmoney_bucket.insert(accountsList.id, accountsList, function(err, ok){
                                if(err){
                                    callback(err, null);
                                } else {
                                    callback(null, ok);
                                }
                            })
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //update the doc
                        accountsList.value.list.push(account.id);
                        db.openmoney_bucket.upsert(accountsList.value.id, accountsList.value, {cas: accountsList.cas}, function(err, ok){
                            if(err){
                              if(err.code == 12){
                                parallelInsertTasks.currencyAccountList(callback);
                              } else {
                                callback(err, null);
                              }
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
                    publicKeyDoc.id = publicKeyDoc.type + "~" + crypto.getHash(account.publicKey);
                    publicKeyDoc.account = account.id;
                    db.openmoney_bucket.insert(publicKeyDoc.id, publicKeyDoc, function(err, ok){
                        if(err){
                            callback(err, null);
                        } else {
                            callback(null, ok);
                        }
                    })
                };
            }

            var value_reference = {};
            value_reference.type = "value_reference";
            value_reference.documents = ["steward_bucket~" + crypto.getHash(request.publicKey) ];
            value_reference.id = account.id;
            parallelInsertTasks.value_reference = function(callback) {
                db.stewards_bucket.insert(value_reference.id, value_reference, function(err, ok){
                    if(err) {
                        callback(err, null);
                    } else {
                        callback(null, value_reference.id);
                    }
                });
            };

            var stewardsList = [];

            account.stewards.forEach(function(steward){
              if(stewardsList.indexOf(steward) === -1){
                stewardsList.push(steward);
              }
            });

            results.currency_check.value.stewards.forEach(function(steward){
              if(stewardsList.indexOf(steward) === -1){
                stewardsList.push(steward);
              }
            });

            results.namespace_check.value.stewards.forEach(function(steward){
              if(stewardsList.indexOf(steward) === -1){
                stewardsList.push(steward);
              }
            });

            //update the account, currency and namespace stewards the list of known accounts, currencies, namespaces and stewards
            stewardsList.forEach(function(steward){

                parallelInsertTasks[steward.toLowerCase()] = function(callback) {
                    db.openmoney_bucket.get(steward.toLowerCase(), function(err, stewardDoc){
                        if(err){
                            callback(err, null);
                        } else {
                            db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function(err, steward_bucket) {
                                if(err) {
                                    callback(err, null);
                                } else {
                                    //add the account to the list of known accounts
                                    steward_bucket.value.accounts.push(account.id);
                                    //create currency array if it doesn't exist
                                    if(typeof steward_bucket.value.currencies == 'undefined'){
                                      steward_bucket.value.currencies = [];
                                    }
                                    //add currency if it doesn't exist
                                    if(steward_bucket.value.currencies.indexOf("currencies~" + currency) === -1){
                                      steward_bucket.value.currencies.push("currencies~" + currency);
                                    }

                                    //create namespace array if it doesn't exist
                                    if(typeof steward_bucket.value.namespaces == 'undefined'){
                                      steward_bucket.value.namespaces = [];
                                    }

                                    //add namespace if it doesn't exist
                                    if(steward_bucket.value.namespaces.indexOf("namespaces~" + request.account.account_namespace.toLowerCase()) === -1){
                                      steward_bucket.value.namespaces.push("namespaces~" + request.account.account_namespace.toLowerCase());
                                    }

                                    //create stewards array if it doesn't exist
                                    if(typeof steward_bucket.value.stewards == 'undefined'){
                                      steward_bucket.value.stewards = [];
                                    }

                                    //add stewards if they don't exist
                                    account.stewards.forEach(function(steward){
                                      if(steward_bucket.value.stewards.indexOf(steward) === -1){
                                        steward_bucket.value.stewards.push(steward.toLowerCase());
                                      }
                                    });
                                    db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function(err, ok){
                                        if(err) {
                                            if(err.code == 12){
                                              //call this
                                              parallelInsertTasks[steward.toLowerCase()](callback);
                                            } else {
                                              callback(err, null);
                                            }
                                        } else {
                                            //get value reference doc and update
                                            db.stewards_bucket.get(account.id, function(err, valRefDoc){
                                                if(err) {
                                                    callback(err, null);
                                                } else {
                                                    //if this reference doesn't exist add it
                                                    var index = valRefDoc.value.documents.indexOf("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey));
                                                    if( index === -1){
                                                        valRefDoc.value.documents.push("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey));
                                                        db.stewards_bucket.upsert(account.id, valRefDoc.value, {cas: valRefDoc.cas},function(err, ok){
                                                            if(err){
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
                    db.openmoney_bucket.get("account_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        if(err){
                            if(err.code == 13){
                                //create a document for this parents namespaces children
                                var children_reference = {};
                                children_reference.type = "account_namespaces_children";
                                children_reference.children = [ account.id ];
                                children_reference.id = children_reference.type + "~" + parent;
                                db.openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                                    if(err){
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
                            db.openmoney_bucket.replace("account_namespaces_children~" + parent, parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
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
                        }
                    });
                };
            });

            //parallel causes issues with document updates on the same document.
            async.series(parallelInsertTasks, function(err, ok){
                if(err) {
                    accountsPostCallback(err, null);
                } else {
                    //TODO: notify the stewards
                    var response = {};
                    response.ok = true;
                    response.id = account.id;
                    accountsPostCallback(null, response);
                }
            })
        }
    });
};