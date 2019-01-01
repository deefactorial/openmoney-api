const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.currenciesPut = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currencyname (String)
     * authorization (String)
     * currencies (Currencies)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.currencies = req.swagger.params.currencies.value;
    request.publicKey = req.user.publicKey;

    currenciesPut(request, function (err, result) {
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

const currenciesPut = function(request, currenciesPutCallback) {

    request.currencies.id = "currencies~" + request.currencies.currency.toLowerCase();
    if(request.currencies.currency_namespace.toLowerCase() != ''){
      request.currencies.id += "." + request.currencies.currency_namespace.toLowerCase();
    }
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
    if(typeof request.currencies.namespace_disabled != 'undefined'){
      currency.namespace_disabled = request.currencies.namespace_disabled;
    }

    var old_currency = {};
    old_currency.id = "currencies~" + request.currency.toLowerCase();

    db.openmoney_bucket.get(old_currency.id, function(err, oldCurrency){
        if(err) {
            currenciesPutCallback(err);
        } else {

              var change = false;
              var stewards_change = false;
              if(oldCurrency.value.currency != currency.currency){
                change = true;
              }
              if(oldCurrency.value.currency_namespace != currency.currency_namespace){
                change = true;
              }
              // if (oldCurrency.value.stewards.equals(currency.stewards) === false) {
              //   change = true;
              // }
              if(change){
                //TODO: implement currency name change, currency_namepsace change, and stewards change.
                var error = {};
                error.status = 503;
                error.code = 3001;
                error.message = 'method not implemented at this time.';
                currenciesPutCallback(error, null);
              } else {

                var parallelTasks = {};

                var isNamespaceSteward = false;

                parallelTasks.isStewardCheck = function(callback){
                  var is_steward = false;
                  oldCurrency.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname.toLowerCase()){
                      is_steward = true;
                    }
                  });
                  if(!is_steward){

                    if(oldCurrency.value.currency_namespace != ''){
                      //get the currency_namespace doc and check if this is one of those stewards, they can update namespace disabled
                      db.openmoney_bucket.get('namespaces~' + oldCurrency.value.currency_namespace, function(err, currency_namespace){
                        if(err){
                          callback(err)
                        } else {
                          if(currency_namespace.value.stewards.indexOf("stewards~" + request.stewardname.toLowerCase()) === -1){
                            var error = {};
                            error.status = 403;
                            error.code = 3000;
                            error.message = "You are not the steward of this currency.";
                            callback(error);
                          } else {
                            isNamespaceSteward = true;
                            callback(null, currency_namespace);
                          }
                        }
                      });
                    } else {
                      var error = {};
                      error.status = 403;
                      error.code = 3000;
                      error.message = "You are not the steward of this currency.";
                      callback(error);
                    }
                  } else {
                    callback(null, is_steward)
                  }
                }

                if(oldCurrency.value.stewards.equals(currency.stewards) === false){

                  //check stewards exist
                  currency.stewards.forEach(function(steward){
                      parallelTasks[steward] = function(callback) {
                          db.openmoney_bucket.get(steward.toLowerCase(), function (err, steward) {
                              if (err) {
                                  callback(err);
                              } else {
                                  callback(null, steward);
                              }
                          });
                      };
                  });

                  //update oldCurrency stewards
                  change = true;
                  stewards_change = true;
                  oldCurrency.value.stewards = currency.stewards;

                }

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

                if(typeof request.currencies.namespace_disabled != 'undefined'){

                }

                var namespace_disabled_changed = false;
                if(typeof currency.namespace_disabled != 'undefined' && typeof oldCurrency.value.namespace_disabled != 'undefined' && currency.namespace_disabled != oldCurrency.value.namespace_disabled){
                    //account namepsace disabled has changed
                    namespace_disabled_changed = true;
                    oldCurrency.value.namespace_disabled = currency.namespace_disabled;
                }
                if(typeof currency.namespace_disabled != 'undefined' && typeof oldCurrency.value.namespace_disabled == 'undefined'){
                    //account namespace disabled is added
                    namespace_disabled_changed = true;
                    oldCurrency.value.namespace_disabled = currency.namespace_disabled;
                }
                if(typeof currency.namespace_disabled == 'undefined' && typeof oldCurrency.value.namespace_disabled != 'undefined'){
                    //account namespace disabled is retained.
                    currency.namespace_disabled = oldCurrency.value.namespace_disabled;
                }
                if(namespace_disabled_changed){
                  change = true;
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

                parallelTasks.namespace_check = function(callback) {
                    db.openmoney_bucket.get("namespaces~" + currency.currency_namespace.toLowerCase(), function(err, namespace){
                        if(err) {
                          if(err.code == 13){
                            db.openmoney_bucket.get('namespaces~cc', function(err, cc){
                              if(err){
                                callback(err);
                              } else {
                                if(cc.value.stewards.indexOf('stewards~' + request.stewardname.toLowerCase()) === -1){
                                  var error = {};
                                  error.status = 403;
                                  error.code = 3022;
                                  error.message = "Currency namespace not found.";
                                  callback(error);
                                } else {
                                  callback(null, cc);
                                }
                              }
                            })
                          } else {
                            callback(err);
                          }
                        } else {
                            callback(null,namespace);
                        }
                    });
                };
                //
                // //check stewards exist
                // currency.stewards.forEach(function(steward){
                //     parallelTasks[steward] = function(callback) {
                //         db.openmoney_bucket.get(steward.toLowerCase(), function (err, steward) {
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
                //     db.openmoney_bucket.get(currency.id.toLowerCase(), function(err, currency){
                //         if(err){
                //             if(err.code == 13){
                //                 callback(null,true);
                //             } else {
                //                 callback(err, null);
                //             }
                //         } else {
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
                //     db.openmoney_bucket.get("namespaces~" + currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase(), function(err, space){
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
                //     db.openmoney_bucket.get("accountsList~" + currency.currency.toLowerCase() + "." + currency.currency_namespace.toLowerCase(), function(err, accountsList){
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
                //                     db.openmoney_bucket.get(accountID, function(err, account){
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
                        currenciesPutCallback(err);
                    } else {
                        //create the currency
                        var parallelInsertTasks = {};
                        parallelInsertTasks.update_currency = function(callback) {
                            db.openmoney_bucket.replace(oldCurrency.value.id, oldCurrency.value, {cas: oldCurrency.cas}, function(err, ok) {
                                if(err) {
                                    callback(err);
                                } else {
                                    callback(null, ok);
                                }
                            });
                        };

                        if(stewards_change){

                          //each account stewards gets the currency stewards added to their list of known stewards
                          parallelInsertTasks['update_accounts_stewards_bucket'] = function(callback) {
                            db.openmoney_bucket.get("currencyAccountList~" + currency.currency.toLowerCase() + '.' + currency.currency_namespace.toLowerCase(), function(err, accountsList){
                              if(err && err.code != 13){
                                callback(err)
                              } else {
                                //hack for empty currency accountsList
                                if(err && err.code == 13){
                                  var accountsList = {};
                                  accountsList.value = {};
                                  accountsList.value.list = [];
                                }

                                var stewardsTasks = {};
                                accountsList.value.list.forEach(function(accountId){
                                  stewardsTasks[accountId] = function(callback){
                                    db.openmoney_bucket.get(accountId, function(err, account){
                                      if(err){
                                        callback(err);
                                      } else {
                                        callback(null, account.value.stewards)
                                      }
                                    })
                                  }
                                })

                                async.parallel(stewardsTasks, function(err, accountStewardsList){
                                  if(err){
                                    callback(err);
                                  } else {
                                    var stewardsList = [];

                                    for (var key in accountStewardsList) {
                                      if (accountStewardsList.hasOwnProperty(key)) {
                                        accountStewardsList[key].forEach(function(steward){
                                          if(stewardsList.indexOf(steward) === -1){
                                            stewardsList.push(steward);
                                          }
                                        });
                                      }
                                    }

                                    var seriesUpdate = {};
                                    stewardsList.forEach(function(steward){
                                      seriesUpdate[steward] = function(callback){
                                        db.openmoney_bucket.get(steward, function (err, stewardDoc) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                      //account owners know about currency and currency_namespace already

                                                      //add list of currency stewards to known stewards list
                                                      currency.stewards.forEach(function(currency_steward) {
                                                        if(steward_bucket.value.stewards.indexOf(currency_steward) === -1){
                                                          steward_bucket.value.stewards.push(currency_steward);
                                                        }
                                                      });
                                                      db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                                                          if (err) {
                                                              if(err.code == 12){
                                                                //retry
                                                                seriesUpdate[steward](callback);
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

                                    results.namespace_check.value.stewards.forEach(function(steward){
                                      seriesUpdate[steward] = function(callback){
                                        db.openmoney_bucket.get(steward, function (err, stewardDoc) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {

                                                      //add currency to the currency stewards list of known currencies
                                                      if(steward_bucket.value.currencies.indexOf(currency.id.toLowerCase()) === -1){
                                                        steward_bucket.value.currencies.push(currency.id.toLowerCase());
                                                      }

                                                      //add list of currency stewards to known stewards list
                                                      currency.stewards.forEach(function(currency_steward) {
                                                        if(steward_bucket.value.stewards.indexOf(currency_steward) === -1){
                                                          steward_bucket.value.stewards.push(currency_steward);
                                                        }
                                                      });
                                                      db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                                                          if (err) {
                                                              if(err.code == 12){
                                                                //retry
                                                                seriesUpdate[steward](callback);
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

                                    //each currency stewards gets the lists of account stewards added to their list of known stewards
                                    currency.stewards.forEach(function(currency_steward) {
                                        seriesUpdate[currency_steward] = function(callback) {

                                          db.openmoney_bucket.get(currency_steward.toLowerCase(), function (err, stewardDoc) {
                                              if (err) {
                                                  callback(err);
                                              } else {
                                                  db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                                                      if (err) {
                                                          callback(err);
                                                      } else {

                                                          //add currency accounts to currency stewards list of known accounts
                                                          accountsList.value.list.forEach(function(accountId){
                                                            if(steward_bucket.value.accounts.indexOf(accountId) === -1){
                                                              steward_bucket.value.accounts.push(accountId);
                                                            }
                                                            //add all sub namespaces of accounts to list of known namespaces
                                                            var namespace = accountId.substring(0,accountId.indexOf('~'));
                                                            while(namespace.indexOf('.') !== -1){
                                                              namespace = namespace.substring(namespace.indexOf('.')+1, namespace.length);
                                                              if(steward_bucket.value.namespaces.indexOf('namespaces~' + namespace) === -1){
                                                                steward_bucket.value.namespaces.push('namespaces~' + namespace);
                                                              }
                                                            }
                                                          })

                                                          //add currency to the currency stewards list of known currencies
                                                          if(steward_bucket.value.currencies.indexOf(currency.id.toLowerCase()) === -1){
                                                            steward_bucket.value.currencies.push(currency.id.toLowerCase());
                                                          }

                                                          //add currency stewards to the other currency stewards list of known stewards (peers)
                                                          currency.stewards.forEach(function(steward){
                                                            if(steward_bucket.value.stewards.indexOf(steward) === -1){
                                                              steward_bucket.value.stewards.push(steward);
                                                            }
                                                          });

                                                          //add the currency namespace to currency stewards list of known namespaces
                                                          if(currency.currency_namespace != '' && steward_bucket.value.namespaces.indexOf('namespaces~' + currency.currency_namespace.toLowerCase()) === -1){
                                                            steward_bucket.value.namespaces.push('namespaces~' + currency.currency_namespace.toLowerCase());

                                                            //add all sub namespaces
                                                            var namespace = currency.currency_namespace.toLowerCase();
                                                            while(namespace.indexOf('.') !== -1){
                                                              namespace = namespace.substring(namespace.indexOf('.')+1, namespace.length);
                                                              if(steward_bucket.value.namespaces.indexOf('namespaces~' + namespace) === -1){
                                                                steward_bucket.value.namespaces.push('namespaces~' + namespace);
                                                              }
                                                            }
                                                          }

                                                          //add the list of account stewards to the currency stewards bucket
                                                          stewardsList.forEach(function(steward){
                                                            if(steward_bucket.value.stewards.indexOf(steward) === -1){
                                                              steward_bucket.value.stewards.push(steward);
                                                            }
                                                          });

                                                          db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                                                              if (err) {
                                                                  if(err.code == 12){
                                                                    //retry
                                                                    seriesUpdate[currency_steward](callback);
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

                                    async.parallel(seriesUpdate, function(err, ok){
                                      callback(err, ok);
                                    })
                                  }
                                });
                              }
                          });
                        }
                      }


                        //No curency steward change so this is not nessesary
                        // parallelInsertTasks.insert_currency_in_db.stewards_bucket = function(callback) {
                        //     request.currency.stewards.forEach(function(steward) {
                        //         db.openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                        //             if (err) {
                        //                 callback(err, null);
                        //             } else {
                        //                 db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                        //                     if (err) {
                        //                         callback(err, null);
                        //                     } else {
                        //                         steward_bucket.value.currencies.push(request.currency.id.toLowerCase());
                        //                         db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
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
                        //         db.openmoney_bucket.get("currency_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        //             if(err){
                        //                 if(err.code == 13){
                        //                     //create a document for this parents namespaces children
                        //                     var children_reference = {};
                        //                     children_reference.type = "currency_namespaces_children";
                        //                     children_reference.children = [ request.currency.id.toLowerCase() ];
                        //                     children_reference.id = children_reference.type + "~" + parent;
                        //                     children_reference.id = children_reference.id.toLowerCase();
                        //                     db.openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
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
                        //                 db.openmoney_bucket.replace("currency_namespaces_children~" + parent.toLowerCase(), parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
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

                        async.series(parallelInsertTasks, function(err, ok) {
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
            }//else steward
        }//oldCreency else
    });//get oldcreency
};