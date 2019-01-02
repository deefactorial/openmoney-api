const util = require('../../helpers/util.helper');
const db = require('../../helpers/db.helper');
const async = require('async');

//Compare arrays: http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

exports.spacesPut = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     * space (Spaces)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.space = req.swagger.params.space.value;
    request.publicKey = req.user.publicKey;

    spacesPut(request, function (err, result) {
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

const spacesPut = function(request, spacesPutCallback) {
    //change space name.
    request.space.id = "namespaces~" + request.space.namespace;

    //check what has changed
    db.openmoney_bucket.get("namespaces~" + request.namespace, function (err, olddoc) {
        if (err) {
            spacesPutCallback(err);
        } else {
            var parallelTasks = {};

            var calculatedParent = request.space.namespace.substring(request.space.namespace.indexOf('.') + 1, request.space.namespace.length);
            if(request.space.namespace.indexOf('.') === -1 || calculatedParent != request.space.parent_namespace){
              parallelTasks.root_check = function(callback){

                //the only ones who can post in the root namespace are the cc namespace stewards.
                db.openmoney_bucket.get('namespaces~cc', function(err, cc){
                  if(err){
                    spacesPutCallback(err);
                  } else {
                    if(cc.value.stewards.indexOf('stewards~' + request.stewardname.toLowerCase()) === -1){
                      var error = {};
                      error.status = 403;
                      error.code = 2002;
                      error.message = "Parent namespace is not found.";
                      callback(error);
                    } else {
                      callback(null, cc);
                    }
                  }
                })
              };
            }

            parallelTasks.steward_check = function(callback){
              //check that old steward is steward of this space.
              if(olddoc.value.stewards.indexOf("stewards~" + request.stewardname.toLowerCase()) === -1) {
                //check if this is the parent namespace steward
                db.openmoney_bucket.get('namespaces~' + request.space.namespace.substring(request.space.namespace.indexOf('.') + 1, request.space.namespace.length), function(err, parent_namespace){
                  if(err){
                    callback(err);
                  } else {
                    if(parent_namespace.value.stewards.indexOf("stewards~" + request.stewardname.toLowerCase()) === -1){
                      var error = {};
                      error.status = 403;
                      error.code = 2006;
                      error.message = "You are not the steward of this namespace.";
                      callback(error);
                    } else {
                      callback(null, parent_namespace);
                    }
                  }
                });
              } else {
                callback(null, true);
              }
            };

            var namespace_change = false;
            //namespace change
            //namespace change should only be allowed if there are no transactions in the accounts and currencies that are under it.
            if (olddoc.value.namespace != request.space.namespace) {
              var error = {};
              error.status = 403;
              error.code = 2026;
              error.message = "You cannot change the namespace name.";
              return spacesPutCallback(error);
                // namespace_change = true;
                // //check if the namespace exists
                // parallelTasks.namespace = function (callback) {
                //     db.openmoney_bucket.get("namespaces~" + request.space.namespace, function (err, doc) {
                //         if (err) {
                //             if (err.code == 13) {
                //                 callback(null, true);
                //             } else {
                //                 callback(err);
                //             }
                //         } else {
                //
                //             var error = {};
                //             error.status = 403;
                //             error.code = 2004;
                //             error.message = "namespace exists with that name.";
                //             callback(error, false);
                //         }
                //     });
                // };
                // //check that the name isn't taken by another currency or account
                // parallelTasks.currency = function (callback) {
                //     db.openmoney_bucket.get("currencies~" + request.space.namespace, function (err, doc) {
                //         if (err) {
                //             if (err.code == 13) {
                //                 callback(null, true);
                //             } else {
                //                 callback(err);
                //             }
                //         } else {
                //             var is_steward = false;
                //             doc.value.stewards.forEach(function(steward){
                //               if(steward == 'stewards~' + request.stewardname){
                //                 is_steward = true;
                //               }
                //             });
                //
                //             if(is_steward){
                //               callback(null, true);
                //             } else {
                //               var error = {};
                //               error.status = 403;
                //               error.code = 2005;
                //               error.message = "Currency already exists with the same name.";
                //               callback(error);
                //             }
                //         }
                //     });
                // };
                // //
                // parallelTasks.account = function (callback) {
                //
                //     //get accountsList~
                //     db.openmoney_bucket.get("accountsList~" + request.space.namespace.toLowerCase(), function(err, accountList){
                //         if(err) {
                //             if(err.code == 13){
                //                 callback(null, "no account found with that namespace name");
                //             } else {
                //                 callback(err, null);
                //             }
                //         } else {
                //             //go through each account
                //             //if the account is not this stewards through a 2007 error
                //             //there are accounts with that name
                //             var parallelAccountTasks = {};
                //             //check who is the steward of the accounts if this is the steward then allow.
                //             accountList.value.list.forEach(function(accountID){
                //                 parallelAccountTasks[accountID] = function(cb) {
                //                     ('get', accountID);
                //                     db.openmoney_bucket.get(accountID, function(err, account){
                //                         if(err) {
                //                             cb(err, null);
                //                         } else {
                //                             var is_steward = false;
                //                             account.value.stewards.forEach(function(steward){
                //                                 if(steward == "stewards~" + request.stewardname) {
                //                                     is_steward = true;
                //                                 }
                //                             });
                //                             if(is_steward) {
                //                                 cb(null, account);
                //                             } else {
                //                                 var error = {};
                //                                 error.status = 403;
                //                                 error.code = 2007;
                //                                 error.message = 'There is an account with that namespace name.';
                //                                 cb(error, null);
                //                             }
                //                         }
                //                     })
                //                 };
                //             });
                //
                //             async.parallel(parallelAccountTasks, function(err, ok){
                //                 callback(err, ok);
                //             });
                //         }
                //     });
                // };
            }

            //parent_namespace change
            if (olddoc.value.parent_namespace != request.space.parent_namespace) {
                //check parent namespace exists
                var error = {};
                error.status = 403;
                error.code = 2036;
                error.message = "You cannot change the parent namespace name.";
                return spacesPutCallback(error);
                // parallelTasks.namespace = function (callback) {
                //     db.openmoney_bucket.get("namespaces~" + request.space.parent_namespace, function (err, doc) {
                //         if (err) {
                //             if (err.code == 13) {
                //                 var error = {};
                //                 error.status = 404;
                //                 error.code = 2003;
                //                 error.message = "Parent namespace does not exist.";
                //                 callback(error, false);
                //             } else {
                //                 callback(err, false);
                //             }
                //         } else {
                //             callback(null, doc);
                //         }
                //     });
                // }
            }
            var steward_change = false;
            //stewards change
            if (olddoc.value.stewards.equals(request.space.stewards) === false) {
                //check that stewards exist
                request.space.stewards.forEach(function (steward) {
                    parallelTasks[steward] = function (callback) {
                        db.openmoney_bucket.get(steward, function (err, doc) {
                            if (err) {
                                if (err.code == 13) {
                                    var error = {};
                                    error.status = 404;
                                    error.code = 2008;
                                    error.message = "Steward does not exist.";
                                    callback(error, false);
                                } else {
                                    callback(err, false);
                                }
                            } else {
                                callback(null, doc);
                            }
                        })
                    };
                });
                steward_change = true;
            }

            var private_change = false;
            if (typeof olddoc.value.private == 'undefined'){
              if (typeof request.space.private != 'undefined'){
                private_change = true;
              }
            } else {
              if (typeof request.space.private != 'undefined' && request.space.private != olddoc.value.private){
                private_change = true;
              }
            }

            var disabled_change = false;
            if (typeof olddoc.value.disabled == 'undefined'){
              if (typeof request.space.disabled != 'undefined'){
                disabled_change = true;
              }
            } else {
              if (typeof request.space.disabled != 'undefined' && request.space.disabled != olddoc.value.disabled){
                disabled_change = true;
              }
            }

            var namespace_disabled = false;
            if(typeof olddoc.value.namespace_disabled == 'undefined' && typeof request.space.namespace_disabled != 'undefined'){
              namespace_disabled = true;
            }
            if(typeof olddoc.value.namespace_disabled != 'undefined' && typeof request.space.namespace_disabled != 'undefined' && request.space.namespace_disabled != olddoc.value.namespace_disabled){
              namespace_disabled = true;
            }

            //find all instances where space exists, check currencies and accounts that use them
            var changed_documents = {};
            changed_documents.namespaces = {};
            changed_documents.currencies = {};
            changed_documents.accounts = {};
            var steward_notification_list = [];
            var parallelUpdateTasks = {};
            var re = new RegExp("" + olddoc.value.namespace + "$", "i");
            var mod = {};
            mod.modified = new Date().getTime();
            mod.modified_by = request.stewardname;
            mod.modification = '';
            if (namespace_change) {
                mod.modification += "Namespace change From " + olddoc.value.namespace + " to " + request.space.namespace + ". ";
            }
            if (steward_change) {
                mod.modification += "Stewards changed from [";
                olddoc.value.stewards.forEach(function (steward) {
                    mod.modification += steward.replace("stewards~", '') + ", ";
                });
                mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                mod.modification += "] to [";
                request.space.stewards.forEach(function (steward) {
                    mod.modification += steward.replace("stewards~", '') + ", ";
                });
                mod.modification = mod.modification.substring(0, mod.modification.length - 2);
                mod.modification += "]. ";
            }
            if (private_change){
                mod.modification += "Private Change from " + olddoc.value.private + " to " + request.space.private + ".";
            }
            if (disabled_change){
                mod.modification += "Disabled Change from " + olddoc.value.disabled + " to " + request.space.disabled + ".";
            }
            if(namespace_disabled){
              mod.modification += "Namespace Disabled Change from " + olddoc.value.namespace_disabled + " to " + request.space.namespace_disabled + ".";
            }

            //change this namespace document
            var doc = olddoc.value;
            doc.stewards.forEach(function(steward){
                steward_notification_list.push(steward);
            });
            if (typeof doc.modifications == 'undefined') {
                doc.modifications = [];
            }
            doc.modifications.push(mod);
            //if steward change and this is the doc changing
            if (steward_change && doc.namespace.toLowerCase() == request.space.namespace.toLowerCase()) {
                doc.stewards = request.space.stewards;
            }
            var olddoc_id = util.clone(doc.id);

            if (namespace_change) {

                //replace the id, and namespaces with the new namespace.
                doc.id = doc.id.replace(olddoc.value.namespace, request.space.namespace.toLowerCase());
                changed_documents.namespaces[olddoc_id] = doc.id; //log the change
                doc.namespace = doc.namespace.replace(re, request.space.namespace);
                doc.parent_namespace = doc.parent_namespace.replace(re, request.space.namespace);
                parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                    db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                        cb(err, result);
                    });
                };
            }

            if (private_change) {
              doc.private = request.space.private;
            }

            if (disabled_change) {
              doc.disabled = request.space.disabled;
            }

            if(namespace_disabled){
              doc.namespace_disabled = request.space.namespace_disabled;
            }

            parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                db.openmoney_bucket.upsert(doc.id, doc, {cas: olddoc.cas}, function (err, result) {
                    cb(err, result);
                });
            };

            //look for references then que update tasks
            parallelTasks.update_namespace_children = function (callback) {

                //Get all childeren namespaces of this parent namespace.
                db.openmoney_bucket.get("namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                    if (err) {
                        if (err.code == 13) {
                            callback(null, "No Children found.");
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //children found
                        var childTasks = {};
                        childrenDoc.value.children.forEach(function (child) {
                            childTasks[child] = function(callback){
                                db.openmoney_bucket.get(child, function (err, namespaceDoc) {
                                    if (err) {
                                        callback(err, null);
                                    } else {
                                        var doc = namespaceDoc.value;
                                        doc.stewards.forEach(function (steward) {
                                            steward_notification_list.push(steward);
                                        });
                                        if (typeof doc.modifications == 'undefined') {
                                            doc.modifications = [];
                                        }
                                        doc.modifications.push(mod);

                                        var olddoc_id = util.clone(doc.id);

                                        if (namespace_change) {

                                            //replace the id, and namespaces with the new namespace.
                                            doc.id = doc.id.replace(olddoc.value.namespace, request.space.namespace.toLowerCase());
                                            changed_documents.namespaces[olddoc_id] = doc.id; //log the change
                                            doc.namespace = doc.namespace.replace(olddoc.value.namespace, request.space.namespace.toLowerCase());
                                            doc.parent_namespace = doc.parent_namespace.replace(olddoc.value.namespace, request.space.namespace.toLowerCase());
                                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                    if (err) {
                                                        cb(err, false);
                                                    } else {
                                                        cb(null, result);
                                                    }
                                                });
                                            };
                                        }

                                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                            db.openmoney_bucket.upsert(doc.id, doc, {cas: namespaceDoc.cas} ,function (err, result) {
                                                if (err) {
                                                    if(err.code == 12){
                                                      childTasks[child](cb);
                                                    } else {
                                                      cb(err, false);
                                                    }
                                                } else {
                                                    cb(null, result);
                                                }
                                            });
                                        };

                                        callback(null, namespaceDoc);
                                    }//else err
                                });//get
                            };//child function
                        });//childrenDoc

                        async.parallel(childTasks, function(err, results){
                            callback(err, results);
                        });
                    }//else err
                });//get
            };//update_namespace_children


            //look for references then que update tasks
            parallelTasks.update_currencies_references_global = function (callback) {
                //change this currency namespace document
                db.openmoney_bucket.get("currencies~" + olddoc.value.namespace.toLowerCase(), function(err, currency_namespaceDoc){
                    if (err) {
                        if (err.code == 13) {
                            callback(null, "Currency Not Found");
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //currency with the same namespace found
                        var doc = currency_namespaceDoc.value;
                        doc.stewards.forEach(function (steward) {
                            steward_notification_list.push(steward);
                        });
                        if (typeof doc.modifications == 'undefined') {
                            doc.modifications = [];
                        }
                        doc.modifications.push(mod);

                        var olddoc_id = util.clone(doc.id);

                        if (namespace_change) {
                            //replace the id, and namespaces with the new namespace.
                            doc.id = doc.id.replace(olddoc.value.namespace, request.space.namespace.toLowerCase());
                            changed_documents.currencies[olddoc_id] = doc.id; //log the change
                            doc.currency_namespace = doc.currency_namespace.replace(olddoc.value.namespace, request.space.namespace);
                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                                    cb(err, result);
                                });
                            };
                        }

                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                            db.openmoney_bucket.upsert(doc.id, doc, {cas: currency_namespaceDoc.cas}, function (err, result) {
                              if(err && err.code == 12){
                                parallelTasks.update_currencies_references_global(callback);
                              } else {
                                cb(err, result);
                              }
                            });
                        };

                        callback(null, currency_namespaceDoc);
                    }//else err
                });//get
            };//update_currencies_references_global

            parallelTasks.update_currencies_namespaces_children = function (callback) {

                //Get all childeren namespaces of this parent namespace.
                db.openmoney_bucket.get("currency_namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                    if (err) {
                        if (err.code == 13) {
                            callback(null, "No Currency Children found.");
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //children found
                        var childTasks = {};

                        childrenDoc.value.children.forEach(function (child) {
                            childTasks[child] = function(callback){
                                db.openmoney_bucket.get(child, function (err, namespaceDoc) {
                                    if (err) {
                                        callback(err, null);
                                    } else {
                                        var doc = namespaceDoc.value;
                                        doc.stewards.forEach(function (steward) {
                                            steward_notification_list.push(steward);
                                        });
                                        if (typeof doc.modifications == 'undefined') {
                                            doc.modifications = [];
                                        }
                                        doc.modifications.push(mod);

                                        var olddoc_id = util.clone(doc.id);

                                        if (namespace_change) {

                                            //replace the id, and namespaces with the new namespace.
                                            doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                            changed_documents.currencies[olddoc_id] = doc.id; //log the change
                                            doc.currency_namespace = doc.currency_namespace.replace(re, request.space.namespace);
                                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                    cb(err, result);
                                                });
                                            };
                                        }

                                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                            db.openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                                cb(err, result);
                                            });
                                        };

                                        callback(null, namespaceDoc);
                                    }//else err
                                })//get
                            };//function
                        });//childrenDoc

                        async.parallel(childTasks, function(err, results){
                          callback(err, results);
                        });
                    }//else err
                });//get
            };//update_currencies_namespaces_children


            //look for references then que update tasks
            parallelTasks.update_accounts_references_global = function (callback) {
                //get accounts
                db.openmoney_bucket.get("accounts~" + olddoc.value.namespace.toLowerCase(), function(err, namespaceDoc){
                    if (err) {
                        if (err.code == 13) {
                            callback(null, "No Accounts Found");
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //currency namespace document found

                        var doc = namespaceDoc.value;
                        doc.stewards.forEach(function (steward) {
                            steward_notification_list.push(steward);
                        });
                        if (typeof doc.modifications == 'undefined') {
                            doc.modifications = [];
                        }
                        doc.modifications.push(mod);

                        var olddoc_id = util.clone(doc.id);

                        if (namespace_change) {

                            //replace the id, and namespaces with the new namespace.
                            doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                            changed_documents.accounts[olddoc_id] = doc.id; //log the change
                            doc.account_namespace = doc.account_namespace.replace(re, request.space.namespace);
                            parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                                    cb(err, result);
                                });
                            };
                        }

                        parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                            db.openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                cb(err, result);
                            });
                        };

                        callback(null, namespaceDoc);
                    }//else err
                });//get
            };//update_accounts_references_global

            parallelTasks.update_accounts_namespaces_children = function (callback) {

                //Get all childeren namespaces of this parent namespace.
                db.openmoney_bucket.get("account_namespaces_children~" + olddoc.value.namespace.toLowerCase(), function (err, childrenDoc) {
                    if (err) {
                        if (err.code == 13) {
                            callback(null, "No Account Children Found.");
                        } else {
                            callback(err, null);
                        }
                    } else {
                        //children found
                        var childTasks = {};

                        childrenDoc.value.children.forEach(function (child) {
                            if(child != null){
                                childTasks[child] = function(callback){
                                    db.openmoney_bucket.get(child, function(err, namespaceDoc){
                                        if (err) {
                                            callback(err, null);
                                        } else {
                                            var doc = namespaceDoc.value;
                                            doc.stewards.forEach(function (steward) {
                                                steward_notification_list.push(steward);
                                            });
                                            if (typeof doc.modifications == 'undefined') {
                                                doc.modifications = [];
                                            }
                                            doc.modifications.push(mod);

                                            var olddoc_id = util.clone(doc.id);

                                            if (namespace_change) {

                                                //replace the id, and namespaces with the new namespace.
                                                doc.id = doc.id.replace(re, request.space.namespace.toLowerCase());
                                                changed_documents.accounts[olddoc_id] = doc.id; //log the change
                                                doc.account_namespace = doc.account_namespace.replace(re, request.space.namespace);
                                                parallelUpdateTasks[olddoc_id + "_global"] = function (cb) {
                                                    db.openmoney_bucket.remove(olddoc_id, function (err, result) {
                                                        cb(err, result);
                                                    });
                                                };
                                            }

                                            parallelUpdateTasks[doc.id + "_global"] = function (cb) {
                                                db.openmoney_bucket.upsert(doc.id, doc, function (err, result) {
                                                    cb(err, result);
                                                });
                                            };

                                            callback(null, namespaceDoc);
                                        }//else err
                                    });//get
                                };//function
                            }//child not null
                        });//childrenDoc

                        async.parallel(childTasks, function(err, results){
                          callback(err, results);
                        });
                    }//else err
                });//get
            };//update_accounts_namespaces_children

            async.series(parallelTasks, function(err, results) {
                if (err) {
                    spacesPutCallback(err, false);
                } else {
                    //all the checks passed so update all the instances

                    //check if anything changed first
                    if(steward_change || namespace_change || private_change || disabled_change || namespace_disabled) {

                        //get the value references for the changed namespaces
                        for (var key in changed_documents.namespaces) {
                            if (changed_documents.namespaces.hasOwnProperty(key)) {
                                parallelUpdateTasks[key] = function(callback) {
                                    db.stewards_bucket.get(key, function(err, doc){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            doc.value.id = changed_documents.namespaces[key];
                                            var parallelDocumentTasks = {};
                                            //update the references to the document
                                            doc.value.documents.forEach(function(steward_bucket){
                                                parallelDocumentTasks[steward_bucket] = function(callback){
                                                    db.stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                        if(err) {
                                                            callback(err, false);
                                                        } else {
                                                            var index = steward_bucket_doc.value.namespaces.indexOf(key);
                                                            if(index !== -1){
                                                                steward_bucket_doc.value.namespaces[index] = changed_documents.namespaces[key];
                                                            }
                                                            db.stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                callback(err, ok);
                                                            })
                                                        }
                                                    })
                                                };
                                            });
                                            //update the value_reference document
                                            parallelDocumentTasks.update_document = function(callback) {
                                                db.stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                    callback(err, ok);
                                                });
                                            };

                                            async.parallel(parallelDocumentTasks, function(err, ok){
                                                callback(err, ok)
                                            });
                                        }//else err
                                    });//get
                                }//function
                            }//in
                        }//for namepsaces
                        //currencies value references
                        for (var key in changed_documents.currencies) {
                            if (changed_documents.currencies.hasOwnProperty(key)) {
                                //alert(key + " -> " + p[key]);
                                parallelUpdateTasks[key] = function(callback) {
                                    db.stewards_bucket.get(key, function(err, doc){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            doc.value.id = changed_documents.currencies[key];
                                            var parallelDocumentTasks = {};
                                            //update the references to the document
                                            doc.value.documents.forEach(function(steward_bucket){
                                                parallelDocumentTasks[steward_bucket] = function(callback){
                                                    db.stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                        if(err) {
                                                            callback(err, false);
                                                        } else {
                                                            var index = steward_bucket_doc.value.currencies.indexOf(key);
                                                            if(index !== -1){
                                                                steward_bucket_doc.value.currencies[index] = changed_documents.currencies[key];
                                                            }
                                                            db.stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                callback(err, ok);
                                                            })
                                                        }
                                                    })
                                                };
                                            });
                                            //update the value_reference document
                                            parallelDocumentTasks.update_document = function(callback) {
                                                db.stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                    callback(err, ok);
                                                });
                                            };

                                            async.parallel(parallelDocumentTasks, function(err, ok){
                                                callback(err, ok);
                                            });
                                        }
                                    });
                                };//function
                            }//in
                        }//for currencies

                        //accounts value references
                        for (var key in changed_documents.accounts) {
                            if (changed_documents.accounts.hasOwnProperty(key)) {
                                //alert(key + " -> " + p[key]);
                                parallelUpdateTasks[key] = function(callback) {
                                    db.stewards_bucket.get(key, function(err, doc){
                                        if(err) {
                                            callback(err, false);
                                        } else {
                                            //why does it re-assign id
                                            doc.value.id = changed_documents.accounts[key];
                                            var parallelDocumentTasks = {};
                                            //update the references to the document
                                            doc.value.documents.forEach(function(steward_bucket){
                                                parallelDocumentTasks[steward_bucket] = function(callback){
                                                    db.stewards_bucket.get(steward_bucket, function(err, steward_bucket_doc){
                                                        if(err) {
                                                            callback(err, false);
                                                        } else {
                                                            var index = steward_bucket_doc.value.accounts.indexOf(key);
                                                            if(index !== -1){
                                                                steward_bucket_doc.value.accounts[index] = changed_documents.accounts[key];
                                                            }
                                                            db.stewards_bucket.upsert(steward_bucket, steward_bucket_doc.value, {cas: steward_bucket_doc.cas}, function(err, ok){
                                                                callback(err, ok);
                                                            })
                                                        }
                                                    })
                                                };
                                            });
                                            //update the value_reference document
                                            parallelDocumentTasks.update_document = function(callback) {
                                                db.stewards_bucket.upsert(doc.value.id, doc.value, function (err, ok) {
                                                    callback(err, ok);
                                                });
                                            };

                                            async.parallel(parallelDocumentTasks, function(err, ok){
                                                callback(err, ok);
                                            });
                                        }//else err
                                    });//get
                                }//function
                            }//in
                        }//for

                        async.parallel(parallelUpdateTasks, function(err, results) {
                                if (err) {
                                    spacesPutCallback(err, false);
                                } else {
                                    var response = {};
                                    response.id = request.space.id;
                                    response.ok = true;
                                    spacesPutCallback(null, response);
                                }
                            });
                    } else {
                        var response = {};
                        response.id = request.space.id;
                        response.ok = true;
                        spacesPutCallback(null, response);
                    }//else if changed
                }//else err
            });//parallelTasks
        }//else err
    });//get namespace
};