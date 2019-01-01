'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/namespaces/{namespace}/accounts/{account}', function() {
    describe('get', function() {
        it('should respond with 200 OK', function(done) {
            /*eslint-disable*/
            var schema = {
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
            };

            /*eslint-enable*/
            run.api.get('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts/' + run.steward.stewardname)
                .query({
                    currency: 'cc', currency_namespace: ''
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

    describe('put', function() {
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

            var account_change = {};
            account_change.account = run.steward.stewardname + "3";
            account_change.account_namespace = 'cc';
            account_change.currency = 'cc';
            account_change.currency_namespace = '';
            account_change.stewards = [ "stewards~" + run.steward.stewardname ];

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + 'cc' + '/accounts/' + run.steward.stewardname + "2")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account_change)
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

        it('should respond with default error payload', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "status": {
                        "type": "integer"
                    },
                    "code": {
                        "type": "integer"
                    },
                    "message": {
                        "type": "string"
                    }
                }
            };

            var account_change = {};
            account_change.account = run.steward.stewardname + '3';
            account_change.account_namespace = 'cc';
            account_change.currency = 'ccc';
            account_change.currency_namespace = '';
            account_change.stewards = [ "stewards~" + run.steward.stewardname, "stewards~test1451600055471" ];

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts/' + run.steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account_change)
                .expect(404)
                .end(function(err, res) {
                    if (err) {
                        return done(err);
                    }
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

    describe('delete', function() {
        it('should respond with default error payload', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "status": {
                        "type": "integer"
                    },
                    "code": {
                        "type": "integer"
                    },
                    "message": {
                        "type": "string"
                    }
                }
            };

            /*eslint-enable*/
            run.api.del('/V2/stewards/' + run.steward.stewardname + '/namespaces/cc/accounts/' + run.steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);
                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
    });
});