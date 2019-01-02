'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/currencies/{currency}?namespace={namespace}', function() {
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
                        "minProperties": 3,
                        "maxProperties": 7,
                        "required": [
                            "currency",
                            "currency_namespace",
                            "stewards"
                        ],
                        "properties": {
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
                            }
                        }
                    }
                ]
            };

            /*eslint-enable*/
            run.api.get('/V2/stewards/' + run.steward.stewardname + '/currencies/' + run.steward.stewardname + '.cc')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

    });

    describe('put', function() {
       
        it('should respond with default error payload', function(done) {
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

            var currency = {};
            currency.currency = run.steward.stewardname;
            currency.currency_namespace = 'cc';
            currency.stewards = [ "stewards~" + run.steward.stewardname ];

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/currencies/' + run.steward.stewardname + '.cc')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(currency)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
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
            run.api.del('/V2/stewards/' + run.steward.stewardname + '/currencies/' + run.steward.stewardname + '.cc')
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