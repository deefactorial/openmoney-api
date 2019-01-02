const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.currenciesPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     * currency (Currencies)
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
    request.publicKey = req.user.publicKey;

    currenciesPost(request, function (err, result) {
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

const currenciesPost = function(request, currenciesPostCallback) {
    //check that currency is formed properly
    //request.stewardname
    //request.namespace
    //request.currency
    request.currency.created = new Date().getTime();
    request.currency.created_by = request.stewardname.toLowerCase();
    if(request.currency.currency_namespace.toLowerCase() == ''){
      request.currency.id = "currencies~" + request.currency.currency.toLowerCase()
    } else {
      request.currency.id = "currencies~" + request.currency.currency.toLowerCase() + "." + request.currency.currency_namespace.toLowerCase();
    }
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
        db.openmoney_bucket.get("namespaces~" + request.currency.currency_namespace.toLowerCase(), function(err, namespace){
            if(err) {
              if(err.code == 13){
                db.openmoney_bucket.get('namespaces~cc', function(err, cc){
                  if(err){
                    callback(err);
                  } else {
                    if(cc.value.stewards.indexOf('stewards~' + request.stewardname) === -1){
                      var error = {};
                      error.status = 403;
                      error.code = 3021;
                      error.message = "Currency namespace not found.";
                      callback(error);
                    } else {
                      callback(null, cc)
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

    //check stewards exist
    request.currency.stewards.forEach(function(steward){
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

    //check that currency doesn't exist
    parallelTasks.currency_check = function(callback) {
        db.openmoney_bucket.get(currency.id.toLowerCase(), function(err, currency){
            if(err){
                if(err.code == 13){
                    callback(null,true);
                } else {
                    callback(err);
                }
            } else {
                var error = {};
                error.status = 403;
                error.code = 3001;
                error.message = "Currency Exists.";
                callback(error);
            }
        })
    };

    //check that there isn't another space or account that exists with the same name in the space
    parallelTasks.space_check = function(callback) {
        var space = request.currency.currency.toLowerCase();
        if(request.currency.currency_namespace.toLowerCase() != ''){
          space += "." + request.currency.currency_namespace.toLowerCase();
        }
        db.openmoney_bucket.get("namespaces~" + space, function(err, space){
            if(err){
                if(err.code == 13){
                    callback(null,true);
                } else {
                    callback(err);
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
                    callback(error);
                }
            }
        })
    };

    //check that there isn't another space or account that exists with the same name in the space
    parallelTasks.accounts_check = function(callback) {
        var account = request.currency.currency.toLowerCase();
        if(request.currency.currency_namespace.toLowerCase() != ''){
          account += "." + request.currency.currency_namespace.toLowerCase();
        }
        db.openmoney_bucket.get("accountsList~" + account, function(err, accountsList){
            if(err){
                if(err.code == 13){
                    callback(null, true);
                } else {
                    callback(err);
                }
            } else {
                var getListTasks = {};
                accountsList.value.list.forEach(function(accountID) {
                    getListTasks[accountID] = function(cb) {
                        db.openmoney_bucket.get(accountID, function(err, account){
                            if(err) {
                                if(err.code == 13) {
                                    cb(null, true);
                                } else {
                                    cb(err);
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
                                    callback(error);
                                }
                            }
                        })
                    }
                });

                async.parallel(getListTasks, function(err, results){
                    if(err) {
                        callback(err);
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

            //create the currency
            var parallelInsertTasks = {};
            parallelInsertTasks.insert_currency = function(callback) {
                db.openmoney_bucket.insert(currency.id, currency, function(err, ok) {
                    if(err) {
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                });
            };

            var stewardsList = [];

            currency.stewards.forEach(function(steward){
              stewardsList.push(steward);
            })

            results.namespace_check.value.stewards.forEach(function(steward){
              if(stewardsList.indexOf(steward) === -1){
                stewardsList.push(steward);
              }
            });

            stewardsList.forEach(function(steward) {
                parallelInsertTasks['insert_currency_in_stewards_bucket' + steward] = function(callback) {
                    db.openmoney_bucket.get(steward.toLowerCase(), function (err, stewardDoc) {
                        if (err) {
                            callback(err, null);
                        } else {
                            db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function (err, steward_bucket) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    //add currency namespace to known namespaces
                                    if(currency.currency_namespace != '' && steward_bucket.value.namespaces.indexOf('namespaces~' + currency.currency_namespace) === -1){
                                      steward_bucket.value.namespaces.push('namespaces~' + currency.currency_namespace);

                                      //add all sub namespaces
                                      var namespace = currency.currency_namespace;
                                      while(namespace.indexOf('.') !== -1){
                                        namespace = namespace.substring(namespace.indexOf('.')+1, namespace.length);
                                        if(steward_bucket.value.namespaces.indexOf('namespaces~' + namespace) === -1){
                                          steward_bucket.value.namespaces.push('namespaces~' + namespace);
                                        }
                                      }
                                    }

                                    //add currency to list of known currencies
                                    if(steward_bucket.value.currencies.indexOf(request.currency.id.toLowerCase()) === -1){
                                      steward_bucket.value.currencies.push(request.currency.id.toLowerCase());
                                    }

                                    //add currency stewards to list of known stewards
                                    currency.stewards.forEach(function(steward){
                                      if(steward_bucket.value.stewards.indexOf(steward) === -1){
                                        steward_bucket.value.stewards.push(steward);
                                      }
                                    })

                                    db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
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
            var currency_namespace = request.currency.currency.toLowerCase()
            if(request.currency.currency_namespace.toLowerCase() != ''){
              currency_namespace += "." + request.currency.currency_namespace.toLowerCase();
            }
            var parents = currency_namespace.toLowerCase().split('.');
            for(var i = 1; i < parents.length ;i++ ){ // start with second item
                for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                    parents[i] += "." + parents[j];
                }
            }
            parents.shift(); //remove this namespace at the head of the list
            parents.forEach(function(parent){
                parallelInsertTasks["parent" + parent] = function(callback){
                    db.openmoney_bucket.get("currency_namespaces_children~" + parent, function(err, parentChildrenDoc){
                        if(err){
                            if(err.code == 13){
                                //create a document for this parents namespaces children
                                var children_reference = {};
                                children_reference.type = "currency_namespaces_children";
                                children_reference.children = [ request.currency.id.toLowerCase() ];
                                children_reference.id = children_reference.type + "~" + parent;
                                children_reference.id = children_reference.id.toLowerCase();
                                db.openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
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
                              db.openmoney_bucket.replace("currency_namespaces_children~" + parent.toLowerCase(), parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
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
                    //TODO: notify the space steward
                    var response = {};
                    response.ok = true;
                    response.id = request.currency.id.toLowerCase();
                    currenciesPostCallback(null, response);
                }
            });
        }
    });
};