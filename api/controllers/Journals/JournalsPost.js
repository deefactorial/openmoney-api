const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');
const NodeRSA = require('node-rsa');

exports.journalsPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * authorization (String)
     * journal (Journals)
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
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.journal = req.swagger.params.journal.value;
    request.publicKey = req.user.publicKey;

    journalsPost(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result)
        }
    });
}

const journalsPost = function(request, journalsPostCallback) {
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
        db.openmoney_bucket.get(from_account_id, function(err, from_account){
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
                      callback(error);
                    } else if (typeof from_account.value.currency_disabled != 'undefined' && from_account.value.currency_disabled){
                      var error = {};
                      error.status = 403;
                      error.code = 5014;
                      error.message = "Your account is disabled by the currency stewards. Contact your currency stewards for more information.";
                      callback(error);
                    } else if (typeof from_account.value.namespace_disabled != 'undefined' && from_account.value.namespace_disabled){
                      var error = {};
                      error.status = 403;
                      error.code = 5024;
                      error.message = "Your account is disabled by the namespace stewards. Contact your namespace stewards for more information.";
                      callback(error);
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
    var fromNamespaceList = [];
    var fromNamespace = request.namespace.toLowerCase();
    while(fromNamespace.indexOf('.') !== -1){
      fromNamespaceList.push(fromNamespace);
      fromNamespace = fromNamespace.substring(fromNamespace.indexOf('.') + 1, fromNamespace.length);
    }
    if(fromNamespace != ''){
      fromNamespaceList.push(fromNamespace);
    }

    fromNamespaceList.forEach(function(namespace){
        parallelTasks['from_namespace_' + namespace] = function(callback){
          db.openmoney_bucket.get("namespaces~" + namespace, function(err, namespaceDoc){
            if(err){
                if(err.code == 13){
                  var err = {};
                  err.status = 404;
                  err.code = 5006;
                  err.message = "`" + namespace + "` namespace does not exist.";
                  callback(err);
                } else {
                  callback(err);
                }
            } else {
                //check that request.namespace is not disabled
                if(typeof namespaceDoc.value.disabled != 'undefined' && namespaceDoc.value.disabled){
                  var err = {};
                  err.status = 403;
                  err.code = 5007;
                  err.message = "Your account namespace; `" + namespace + "` is disabled.";
                  callback(err);
                } else if(typeof namespaceDoc.value.namespace_disabled != 'undefined' && namespaceDoc.value.namespace_disabled){
                  var err = {};
                  err.status = 403;
                  err.code = 5017;
                  err.message = "Your account namespace; `" + namespace + "` is namespace disabled.";
                  callback(err);
                } else {
                  callback(null, namespaceDoc.value);
                }
            }
          })
        }
    });

    //check that request.journal.to_account exists
    parallelTasks.to_account_exists = function(callback) {
        var to_account_id = "accounts~" + request.journal.to_account.toLowerCase() + '.' + request.journal.to_account_namespace.toLowerCase() + '~' + currency;
        db.openmoney_bucket.get(to_account_id, function(err, to_account){
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
                  callback(error);
                } else if (typeof to_account.value.currency_disabled != 'undefined' && to_account.value.currency_disabled){
                  var error = {};
                  error.status = 403;
                  error.code = 5019;
                  error.message = "Their account is disabled by the currency stewards. Contact the currency stewards for more information.";
                  callback(error);
                } else if (typeof to_account.value.namespace_disabled != 'undefined' && to_account.value.namespace_disabled){
                  var error = {};
                  error.status = 403;
                  error.code = 5029;
                  error.message = "Their account is disabled by the namespace stewards. Contact the namespace stewards for more information.";
                  callback(error);
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

    //check that request.journal.to_account_namespace exist
    var toNamespaceList = [];
    var toNamespace = request.journal.to_account_namespace.toLowerCase();
    while(toNamespace.indexOf('.') !== -1){
      toNamespaceList.push(toNamespace);
      toNamespace = toNamespace.substring(toNamespace.indexOf('.') + 1, toNamespace.length);
    }
    if(toNamespace != ''){
      toNamespaceList.push(toNamespace);
    }

    toNamespaceList.forEach(function(namespace){
      parallelTasks['to_namespace_' + namespace] = function(callback){
          db.openmoney_bucket.get("namespaces~" + namespace, function(err, namespaceDoc){
              if(err){
                  if(err.code == 13){
                    var err = {};
                    err.status = 404;
                    err.code = 5011;
                    err.message = "Their account namespace `" + namespace + "` does not exist.";
                    callback(err);
                  } else {
                    callback(err);
                  }
              } else {
                  //check that request.journal.to_account_namespace is not disabled
                  if(typeof namespaceDoc.value.disabled != 'undefined' && namespaceDoc.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "Their account namespace; `" + namespace + "` is disabled.";
                    callback(err);
                  } else if(typeof namespaceDoc.value.namespace_disabled != 'undefined' && namespaceDoc.value.namespace_disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "Their account namespace; `" + namespace + "` is namespace disabled.";
                    callback(err);
                  } else {
                    callback(null, namespaceDoc.value);
                  }
              }
          })
      };
    });

    //check that request.currency exists
    parallelTasks.currency_exists = function(callback) {
        db.openmoney_bucket.get("currencies~" + currency, function(err, currency){
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
                  callback(err);
                } else if(typeof currency.value.namespace_disabled != 'undefined' && currency.value.namespace_disabled){
                  var err = {};
                  err.status = 403;
                  err.code = 5024;
                  err.message = "The currency is namespace disabled.";
                  callback(err);
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
                          db.openmoney_bucket.get('namespaces~' + namespace, function(err, namespaceDoc){
                            if(err){
                              callback(err, null);
                            } else {
                              if(namespaceDoc.value.disabled === true){
                                var err = {};
                                err.status = 403;
                                err.code = 5015;
                                err.message = "The currency namespace " + namespaceDoc.value.namespace + " is disabled.";
                                callback(err);
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

    //check that request.journal.currency_namespace exist
    var currencyNamespaceList = [];
    var currencyNamespace = journal.currency_namespace;
    while(currencyNamespace.indexOf('.') !== -1){
      currencyNamespaceList.push(currencyNamespace);
      currencyNamespace = currencyNamespace.substring(currencyNamespace.indexOf('.') + 1, currencyNamespace.length);
    }
    if(currencyNamespace != ''){
      currencyNamespaceList.push(currencyNamespace);
    }

    currencyNamespaceList.forEach(function(namespace){
      parallelTasks['currency_namespace_' + namespace] = function(callback){
          db.openmoney_bucket.get("namespaces~" + namespace, function(err, namespaceDoc){
              if(err){
                  if(err.code == 13){
                    var err = {};
                    err.status = 404;
                    err.code = 5011;
                    err.message = "the currency namespace `" + namespace + "` does not exist.";
                    callback(err);
                  } else {
                    callback(err);
                  }
              } else {
                  //check that request.journal.to_account_namespace is not disabled
                  if(typeof namespaceDoc.value.disabled != 'undefined' && namespaceDoc.value.disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "the currency namespace; `" + namespace + "` is disabled.";
                    callback(err);
                  } else if(typeof namespaceDoc.value.namespace_disabled != 'undefined' && namespaceDoc.value.namespace_disabled){
                    var err = {};
                    err.status = 403;
                    err.code = 5012;
                    err.message = "the currency namespace; `" + namespace + "` is namespace disabled.";
                    callback(err);
                  } else {
                    callback(null, namespaceDoc.value);
                  }
              }
          })
      };
    });

    //if the to_account name is the same as the to account parent namespace name only the steward of the to account namespace is allowed to post that account.
    parallelTasks.account_namespace_check = function(callback){
      if(request.journal.to_account.toLowerCase() == request.journal.to_account_namespace.toLowerCase().split('.')[0]){
        db.openmoney_bucket.get("namespaces~" + request.journal.to_account_namespace.toLowerCase(), function(err, namespace){
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
            //if all checks pass create the journal entry

            var parallelInsertTasks = {};

            if(journal.from_account == journal.to_account && journal.from_account_namespace == journal.to_account_namespace){
              parallelInsertTasks.fromAccountUpdate = function(callback){
                db.openmoney_bucket.get('accounts~' + journal.from_account + '.' + journal.from_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.volume += journal.amount + journal.amount;
                    db.openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      if(err && err.code == 12){
                        parallelInsertTasks.fromAccountUpdate(callback);
                      } else {
                        callback(err, ok);
                      }
                    });
                  }
                });
              };
            } else {
              parallelInsertTasks.fromAccountUpdate = function(callback){
                db.openmoney_bucket.get('accounts~' + journal.from_account + '.' + journal.from_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.balance -= journal.amount;
                    account.value.volume += journal.amount;
                    db.openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      if(err && err.code == 12){
                        parallelInsertTasks.fromAccountUpdate(callback);
                      } else {
                        callback(err, ok);
                      }
                    });
                  }
                });
              };

              parallelInsertTasks.toAccountUpdate = function(callback){
                db.openmoney_bucket.get('accounts~' + journal.to_account + '.' + journal.to_account_namespace + '~' + currency, function(err, account){
                  if(err){
                    callback(err);
                  } else {
                    if(typeof account.value.balance == 'undefined'){
                      account.value.balance = 0;
                      account.value.volume = 0;
                    }
                    account.value.balance += journal.amount;
                    account.value.volume += journal.amount;
                    db.openmoney_bucket.replace(account.value.id, account.value, {cas: account.cas}, function(err, ok){
                      if(err && err.code == 12){
                        parallelInsertTasks.toAccountUpdate(callback);
                      } else {
                        callback(err, ok);
                      }
                    })
                  }
                });
              };
            }

            //insert into from account stewards journals
            results.from_account_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    db.openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err) {
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = crypto.getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = util.getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = crypto.encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = util.getRandomstring(12);
                            encryptedDoc.encryptedJournal = crypto.encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            db.stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
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
                db.stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            db.stewards_bucket.insert(journalsListDoc.id, journalsListDoc, function(err, ok){
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

                        db.stewards_bucket.upsert(journalsList.value.id, journalsList.value, {cas: journalsList.cas}, function(err, ok){
                            if(err) {
                              if(err.code == 12){
                                parallelInsertTasks.fromJournalList(callback);
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

            //insert into to account stewards journals
            results.to_account_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    db.openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err) {
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = crypto.getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = util.getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = crypto.encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = util.getRandomstring(12);
                            encryptedDoc.encryptedJournal = crypto.encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            db.stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
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
                db.stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            db.stewards_bucket.upsert(journalsListDoc.id, journalsListDoc, function(err, ok){
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

                        db.stewards_bucket.upsert(journalsList.value.id, journalsList.value, {cas: journalsList.cas}, function(err, ok){
                            if(err) {
                              if(err.code == 12){
                                parallelInsertTasks.toJournalList(callback);
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

            //insert into currency stewards journals
            results.currency_exists.stewards.forEach(function(steward){
                //insert their encrypted version into their entry list
                parallelInsertTasks[steward] = function(callback) {
                    db.openmoney_bucket.get(steward, function(err, stewardDoc){
                        if(err){
                            callback(err, null);
                        } else {
                            //encrypt the journal entry for each steward using their public key.
                            var key = new NodeRSA();
                            key.importKey(stewardDoc.value.publicKey);

                            var encryptedDoc = {};
                            encryptedDoc.id = crypto.getHash(stewardDoc.value.publicKey) + journal.id;
                            encryptedDoc.type = "encryptedJournals";
                            encryptedDoc.algorithm = 'aes-256-gcm';
                            var symetrickey = util.getRandomstring(32);
                            encryptedDoc.publicKeyEncryptedSymetricKey = crypto.encryptSymetricKey(key, symetrickey);
                            encryptedDoc.initializationVector = util.getRandomstring(12);
                            encryptedDoc.encryptedJournal = crypto.encrypt(journal, encryptedDoc.algorithm, symetrickey, encryptedDoc.initializationVector);

                            db.stewards_bucket.insert(encryptedDoc.id, encryptedDoc, function(err, ok){
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
                db.stewards_bucket.get(journalsListDoc.id, function(err, journalsList){
                    if(err) {
                        if(err.code == 13) {
                            //insert the doc
                            journalsListDoc.list = [ journal.id ];

                            db.stewards_bucket.insert(journalsListDoc.id, journalsListDoc, function(err, ok){
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
                        db.stewards_bucket.upsert(journalsList.value.id, journalsList.value, {cas: journalsList.cas}, function(err, ok){
                            if(err) {
                              if(err.code == 12){
                                parallelInsertTasks.currencyjournalList(callback);
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

            async.series(parallelInsertTasks, function(err, ok){
                if(err) {
                    journalsPostCallback(err, null);
                } else {
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