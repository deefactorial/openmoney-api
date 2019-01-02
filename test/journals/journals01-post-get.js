'use strict';
const run = require('../test-runner');
const util = require('../util.js');

describe('/stewards/{stewardname}/namespaces/{namespace}/accounts/{account}/journals', function() {
    describe('post', function() {
        it('should respond with 200 OK', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "required": [
                    "id",
                    "ok"
                ],
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "ok": {
                        "type": "boolean"
                    }
                }
            };

            var journal = {};
            journal.to_account = run.steward.stewardname;
            journal.to_account_namespace = 'cc';
            journal.amount = 0;
            journal.payload = { key: 'value'};

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts/' + run.steward.stewardname + '/journals/' + 'cc')
                .query({
                    currency_namespace: ''
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(journal)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        console.info(res.body);
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });
    });

    // describe('get', function() {
    //     it('should respond with 200 OK', function(done) {
    //         /*eslint-disable*/
    //         var schema = {
    //             "type": "array",
    //             "items": {
    //                 "type": "object",
    //                 "properties": {
    //                     "id": {
    //                         "type": "string"
    //                     },
    //                     "type": {
    //                         "type": "string"
    //                     },
    //                     "algorithm": {
    //                         "type": "string"
    //                     },
    //                     "publicKeyEncryptedSymetricKey": {
    //                         "type": "string"
    //                     },
    //                     "initializationVector": {
    //                         "type": "string"
    //                     },
    //                     "encryptedJournal": {
    //                         "type": "object",
    //                         "properties": {
    //                             "content": {
    //                                 "type": "string"
    //                             },
    //                             "tag": {
    //                                 "type": "object"
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         };

    //         var journal_schema = {
    //             "type": "array",
    //             "items": {
    //                 "allOf": [
    //                     {
    //                         "type": "object",
    //                         "required": [
    //                             "id"
    //                         ],
    //                         "properties": {
    //                             "id": {
    //                                 "type": "string"
    //                             }
    //                         }
    //                     },
    //                     {
    //                         "type": "object",
    //                         "minProperties": 8,
    //                         "maxProperties": 12,
    //                         "required": [
    //                             "to_account",
    //                             "to_account_namespace",
    //                             "from_account",
    //                             "from_account_namespace",
    //                             "currency",
    //                             "currency_namespace",
    //                             "amount",
    //                             "created",
    //                             "created_by"
    //                         ],
    //                         "properties": {
    //                             "to_account": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_-]+$"
    //                             },
    //                             "to_account_namespace": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_.-]+$"
    //                             },
    //                             "from_account": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_-]+$"
    //                             },
    //                             "from_account_namespace": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_.-]+$"
    //                             },
    //                             "currency": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_-]+$"
    //                             },
    //                             "currency_namespace": {
    //                                 "type": "string",
    //                                 "maxLength": 255,
    //                                 "pattern": "^[A-Za-z0-9_.-]*$"
    //                             },
    //                             "amount": {
    //                                 "type": "number",
    //                                 "minimum": 0
    //                             },
    //                             "created": {
    //                                 "type": "integer"
    //                             },
    //                             "created_by": {
    //                                 "type": "string"
    //                             }
    //                         }
    //                     }
    //                 ]
    //             }
    //         };


    //         /*eslint-enable*/
    //         run.api.get('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts/' + run.steward.stewardname + '/journals/cc')
    //             .query({
    //                 offset: 0, range: 20
    //             })
    //             .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
    //             .set('Accept', 'application/json')
    //             .expect(200)
    //             .end(function(err, res) {
    //                 if (err) return done(err);

    //                 var results = run.validator.validate(res.body, schema);
    //                 if (!results) {
    //                     console.info(res.body);
    //                     var errors = JSON.stringify(run.validator.getLastErrors());
    //                     console.error(errors);
    //                 }
    //                 run.expect(results).to.be.true;

    //                 var encryptedJournal = res.body[0];
    //                 var symetricKey = run.key.decrypt(encryptedJournal.publicKeyEncryptedSymetricKey, 'utf8');
             
    //                 var resultsArray = [];
    //                 res.body.forEach(function(journalEntry){
    //                     journalEntry.encryptedJournal.tag = new Buffer(journalEntry.encryptedJournal.tag.data);
    //                     var journal = util.decrypt(encryptedJournal.encryptedJournal, encryptedJournal.algorithm, symetricKey, encryptedJournal.initializationVector);
    //                     resultsArray.push(journal);
    //                 });

    //                 var results = run.validator.validate(resultsArray, journal_schema);
    //                 if (!results) {
    //                     console.info(resultsArray);
    //                     var errors = JSON.stringify(run.validator.getLastErrors());
    //                     console.error(errors);
    //                 }
    //                 run.expect(results).to.be.true;
    //                 done();
    //             });
    //     });
    // });
});