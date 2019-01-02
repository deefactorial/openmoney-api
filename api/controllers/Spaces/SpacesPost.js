const util = require('../../helpers/util.helper');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');
const async = require('async');

exports.spacesPost = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * createRequest (Spaces)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.space = req.swagger.params.space.value;
    request.publicKey = req.user.publicKey;

    spacesPost(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
        } else {
            examples['application/json'] = result;
        }
        res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    });

};


const spacesPost = function(request, spacesPostCallback) {
    //check for properly formed document
    request.space.id = "namespaces~" + request.space.namespace;
    request.space.created = new Date().getTime();
    request.space.created_by = request.stewardname;
    request.space.type = "namespaces";

    var namespace = {};
    namespace.id = "namespaces~" + request.space.namespace;
    namespace.type = "namespaces";
    namespace.namespace = request.space.namespace;
    namespace.parent_namespace = request.space.parent_namespace;
    namespace.stewards = request.space.stewards;
    namespace.created = new Date().getTime();
    namespace.created_by = request.stewardname;

    var parallelTasks = {};
    var parallelInsertTasks = {};

    var calculatedParent = request.space.namespace.substring(request.space.namespace.indexOf('.')+1, request.space.namespace.length);
    if(request.space.namespace.indexOf('.') === -1 || calculatedParent != request.space.parent_namespace){
      parallelTasks.root_check = function(callback){
        if(request.space.namespace == ''){
          var error = {};
          error.status = 403;
          error.code = 2032;
          error.message = "Namespace is required.";
          callback(error);
        } else {
          db.openmoney_bucket.get('namespaces~cc', function(err, cc){
            if(err){
              callback(err);
            } else {
              if(cc.value.stewards.indexOf('stewards~' + request.stewardname.toLowerCase()) === -1){
                var error = {};
                error.status = 403;
                error.code = 2002;
                error.message = "Parent namespace not found.";
                callback(error);
              } else {
                callback(null, cc);
              }
            }
          })
        }
      }
    }

    namespace.stewards.forEach(function(steward){
        parallelTasks[steward] = function(callback) {
            db.openmoney_bucket.get(steward, function(err, stewardDoc){
                if(err){
                    if(err.code == 13){
                        err.status = 404;
                        err.code = 2008;
                        err.message = "Steward does not exist.";
                        callback(err, null);
                    } else {
                        callback(err, null);
                    }
                } else {
                    callback(null, stewardDoc.value);
                }
            });

        };
    });

    parallelTasks.parent_namespace = function(callback) {
        //check if parent namespace exists
        db.openmoney_bucket.get("namespaces~" + request.space.parent_namespace, function (err, parent){
            if(err) {
              if(err.code == 13){
                db.openmoney_bucket.get('namespaces~cc', function(err, cc){
                  if(err){
                    callback(err);
                  } else {
                    if(cc.value.stewards.indexOf('stewards~' + request.stewardname.toLowerCase()) === -1){
                      callback({status:403, code:2003, message: "Parent namespace does not exist."}, true);
                    } else {
                      callback(null, cc);
                    }
                  }
                })
              } else {
                callback(err);
              }
            } else {
                //parent space exists
                if(parent.value.private){
                  if(parent.value.stewards.indexOf('stewards~' + request.stewardname.toLowerCase()) === -1){
                    var error = {};
                    error.status = 403;
                    error.code = 2024;
                    error.message = "Cannot create namespace in another stewards private namespace.";
                    callback(error);
                  } else {
                    callback(null, parent);
                  }
                } else {
                  callback(null, parent);
                }
            }
        });
    };

    var parent_namespaces = [];
    var parent_namespace = request.space.parent_namespace;
    while(parent_namespace.indexOf('.') !== -1){
      parent_namespaces.push(parent_namespace);
      parent_namespace = parent_namespace.substring(parent_namespace.indexOf('.')+1, parent_namespace.length);
    }

    parent_namespaces.forEach(function(namespace){
      parallelTasks['parent_namespace_' + namespace] = function(callback){
        //check if parent namespace exists
        db.openmoney_bucket.get("namespaces~" + namespace, function (err, parent){
            if(err) {
              if(err.code == 13){
                callback({status:403, code:2003, message: "Parent namespace does not exist."}, true);
              } else {
                callback(err);
              }
            } else {
              callback(null,parent)
            }
        });
      };
    });


    parallelTasks.namespace = function(callback) {
        //check if namespace exists
        db.openmoney_bucket.get("namespaces~" + request.space.namespace, function (err, doc){
            if(err) {
                if(err.code == 13) {
                    //namespace does not exist so create it
                    callback(null, false);
                } else {
                    callback(err, false);
                }
            } else {
                //namespace exists
                var error = {};
                error.status = 403;
                error.code = 2004;
                error.message = "namespace exists with that name.";
                callback(error);
            }
        });
    };

    parallelTasks.currency = function(callback) {
        //check if namespace exists
        db.openmoney_bucket.get("currencies~" + request.space.namespace, function (err, currency){
            if(err) {
                if(err.code == 13) {
                    //currency does not exist so create it
                    callback(null, true);
                } else {
                    callback(err, false);
                }
            } else {
                //check if they are the owner
                var is_steward;
                currency.value.stewards.forEach(function(steward){
                    if(steward == "stewards~" + request.stewardname){
                        is_steward = true;
                    }
                });
                if(is_steward){
                    callback(null, currency);
                } else {
                    //namespace exists
                    var error = {};
                    error.status = 403;
                    error.code = 2005;
                    error.message = "Currency exists with that name.";
                    callback(error, true);
                }
            }
        });
    };


    parallelTasks.accounts_exists_check = function(callback){
        db.openmoney_bucket.get("accountsList~" + namespace.namespace.toLowerCase(), function(err, accountList){
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
                        db.openmoney_bucket.get(accountID, function(err, account){
                            if(err) {
                                callback(err, null);
                            } else {
                                var is_steward = false;
                                account.value.stewards.forEach(function(steward){
                                    if(steward == "stewards~" + request.stewardname) {
                                        is_steward = true;
                                    }
                                });
                                if(is_steward) {
                                    callback(null, account);
                                } else {
                                    var error = {};
                                    error.status = 403;
                                    error.code = 2007;
                                    error.message = 'Account exists with that name.';
                                    callback(error, null);
                                }
                            }
                        });
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

    async.parallel(parallelTasks,
        function(err, results) {
            if(err) {
                spacesPostCallback(err,false);
            } else {
                //insert the space

                parallelInsertTasks.space = function(callback) {
                    db.openmoney_bucket.insert(namespace.id, namespace, function (err, ok){
                        if(err) {
                            callback(err);
                        } else {
                            callback(null, ok);
                        }
                    });
                };

                //find all the parents of this namespace and insert this namespace into their children document.
                //grandchild.child.parent.grandparent
                //child.parent.grandparent
                //parent.grandparent
                //grandparent
                var parents = namespace.namespace.toLowerCase().split('.');
                for(var i = 1; i < parents.length ;i++ ){ // start with second item
                    for(var j = i + 1; j < parents.length; j++){ //concatenate the rest
                        parents[i] += "." + parents[j];
                    }
                }
                parents.shift(); //remove this namespace at the head of the list
                parents.forEach(function(parent){
                    parallelInsertTasks["parent" + parent] = function(callback){
                         db.openmoney_bucket.get("namespaces_children~" + parent, function(err, parentChildrenDoc){
                             if(err){
                                 if(err.code == 13){
                                     //create a document for this parents namespaces children
                                     var children_reference = {};
                                     children_reference.type = "namespaces_children";
                                     children_reference.children = [ namespace.id ];
                                     children_reference.id = children_reference.type + "~" + parent;
                                     db.openmoney_bucket.insert(children_reference.id, children_reference, function(err, ok){
                                         if(err){
                                           callback(err);
                                         } else {
                                           callback(null, ok);
                                         }
                                     });
                                 } else {
                                     callback(err);
                                 }
                             } else {
                               if(parentChildrenDoc.value.children.indexOf(namespace.id) === -1){
                                 parentChildrenDoc.value.children.push( namespace.id );
                                 db.openmoney_bucket.replace("namespaces_children~" + parent, parentChildrenDoc.value, {cas: parentChildrenDoc.cas}, function(err, ok){
                                    if(err){
                                        if(err.code == 12){
                                          //try again
                                          parallelInsertTasks["parent" + parent](callback);
                                        } else {
                                          callback(err);
                                        }
                                    } else {
                                        callback(null, ok);
                                    }
                                 });
                               } else {
                                 callback(null, parentChildrenDoc);
                               }
                             }
                         });
                    };
                });

                //list of stewards that know about the namespace for namespace changes
                parallelInsertTasks.value_reference = function(callback) {
                  var value_reference = {};
                  value_reference.type = "value_reference";
                  value_reference.documents = [ "steward_bucket~" + crypto.getHash(request.publicKey) ];
                  value_reference.id = namespace.id;
                  db.stewards_bucket.insert(value_reference.id, value_reference, function(err, ok){
                      if(err) {
                          callback(err, null);
                      } else {
                          callback(null, ok);
                      }
                  });
                };

                var stewardsList = [];

                namespace.stewards.forEach(function(steward){
                  if(stewardsList.indexOf(steward) === -1){
                    stewardsList.push(steward);
                  }
                })

                //All Parents get notified of namespace creation
                // parent_namespaces.forEach(function(namespace){
                //   results['parent_namespace_' + namespace].value.stewards.forEach(function(steward){
                //     if(stewardsList.indexOf(steward) === -1){
                //       stewardsList.push(steward);
                //     }
                //   })
                // })

                if (request.space.parent_namespace && results['parent_namespace_' + request.space.parent_namespace])
                    results['parent_namespace_' + request.space.parent_namespace].value.stewards.forEach(function(steward){
                        if(stewardsList.indexOf(steward) === -1){
                            stewardsList.push(steward);
                        }
                    });

                stewardsList.forEach(function(steward){
                    parallelInsertTasks[steward] = function(callback) {
                        db.openmoney_bucket.get(steward, function(err, stewardDoc){
                            if(err){
                                callback(err);
                            } else {
                                db.stewards_bucket.get("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), function(err, steward_bucket) {
                                    if(err) {
                                        callback(err);
                                    } else {
                                        if(steward_bucket.value.namespaces.indexOf(namespace.id) !== -1){
                                          callback(null, steward_bucket.value);
                                        } else {
                                          steward_bucket.value.namespaces.push(namespace.id);

                                          namespace.stewards.forEach(function(steward){
                                            if(steward_bucket.value.stewards.indexOf(steward) === -1){
                                              steward_bucket.value.stewards.push(steward);
                                            }
                                          })
                                          db.stewards_bucket.upsert("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey), steward_bucket.value, { cas: steward_bucket.cas }, function(err, ok){
                                              if(err) {
                                                  if(err.code == 12){
                                                    //try again
                                                    parallelInsertTasks[steward](callback);
                                                  } else {
                                                    callback(err);
                                                  }
                                              } else {
                                                // //get value reference doc and update
                                                //   var valrefUpdate = function(callback){
                                                //     db.stewards_bucket.get(namespace.id, function(err, valRefDoc){
                                                //         if(err) {
                                                //             callback(err);
                                                //         } else {
                                                //             //if this reference doesn't exist add it
                                                //             if(valRefDoc.value.documents.indexOf("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey)) === -1){
                                                //                 valRefDoc.value.documents.push("steward_bucket~" + crypto.getHash(stewardDoc.value.publicKey));
                                                //                 db.stewards_bucket.upsert(namespace.id, valRefDoc.value, { cas: valRefDoc.cas }, function(err, ok){
                                                //                     if(err){
                                                //                         if(err.code == 12){
                                                //                           //try again
                                                //                           valrefUpdate(callback);
                                                //                         } else {
                                                //                           callback(err);
                                                //                         }
                                                //                     } else {
                                                //                         callback(null, ok);
                                                //                     }
                                                //                 });
                                                //             } else {
                                                //                 callback(null, ok);
                                                //             }
                                                //         }
                                                //     });
                                                //   };
                                                //
                                                //   valrefUpdate(callback);
                                                callback(null, ok);
                                              }
                                          });
                                        }
                                    }
                                });
                            }
                        });
                    };
                });

                async.series(parallelInsertTasks,
                    function(err, results) {
                        if (err) {
                            spacesPostCallback(err, false);
                        } else {
                            var response = {};
                            response.ok = true;
                            response.id = request.space.id;
                            spacesPostCallback(null,response);
                        }
                    });
            }
        });

};