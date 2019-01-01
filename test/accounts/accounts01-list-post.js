'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/namespaces/{namespace}/accounts', function() {
    describe('get', function() {
        it('should respond with 200 List of accounts', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "array",
                "items": {
                    "allOf": [
                        {
                            "type": "object",
                            "required": [
                                "id"
                            ],
                            "properties": {
                                "id": {
                                    "type": "string"
                                }
                            }
                        },
                        {
                            "type": "object",
                            "minProperties": 5,
                            "maxProperties": 10,
                            "required": [
                                "account",
                                "account_namespace",
                                "currency",
                                "currency_namespace",
                                "stewards"
                            ],
                            "properties": {
                                "account": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_-]+$"
                                },
                                "account_namespace": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_.-]+$"
                                },
                                "currency": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_-]+$"
                                },
                                "currency_namespace": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_.-]*$"
                                },
                                "stewards": {
                                    "type": "array",
                                    "items": {
                                        "type": "string",
                                        "maxLength": 255,
                                        "pattern": "^stewards~[A-Za-z0-9_.-]+$"
                                    }
                                },
                                "publicKey": {
                                    "type": "string",
                                    "minLength": 266,
                                    "maxLength": 800,
                                    "pattern": "^-----BEGIN PUBLIC KEY-----[A-Za-z0-9\\\\\\s/=+]+-----END PUBLIC KEY-----$"
                                }
                            }
                        }
                    ]
                }
            };

            /*eslint-enable*/
            run.api.get('/V2/stewards/' + run.steward.stewardname + '/accounts')
                .query({
                    currency: 'cc', 
                    currency_namespace: '',
                    namespace: 'cc'
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
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

            var account = {};
            account.account = run.steward.stewardname + "2";
            account.account_namespace = 'cc';
            account.currency = 'cc';
            account.currency_namespace = '';
            account.stewards = [ "stewards~" + run.steward.stewardname ];

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account)
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
});