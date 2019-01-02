'use strict';
const run = require('../test-runner');
const util = require('../util');

describe('/stewards', function () {
    describe('get', function () {
        it('should respond with 200 List of stewards', function (done) {
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
                            "minProperties": 2,
                            "maxProperties": 7,
                            "required": [
                                "stewardname",
                                "publicKey"
                            ],
                            "properties": {
                                "stewardname": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9\\.\\-\\_]*$"
                                },
                                "password":{
                                    "type": "string"
                                },
                                "publicKey": {
                                    "type": "string",
                                    "minLength": 266,
                                    "maxLength": 800,
                                    "pattern": "^-----BEGIN PUBLIC KEY-----[A-Za-z0-9/\\+=\\s]*-----END PUBLIC KEY-----$"
                                },
                                "email": {
                                    "type": "string",
                                    "format": "email",
                                    "maxLength": 255,
                                    "pattern": "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$"
                                },
                                "email_notifications": {
                                    "type": "boolean"
                                }
                            }
                        }
                    ]
                }
            };

            /*eslint-enable*/
            run.api.get('/V2/stewards')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .set({})
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    run.expect(results).to.be.true;
                    done();
                });
        });

        it('should respond with default error payload', function (done) {
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
            run.api.get('/V2/stewards')
                .set('Accept', 'application/json')
                .set({})
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

        it('should respond with default error payload', function (done) {
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
            run.api.get('/V2/stewards')
                .set('Authorization', 'Bearer ' + util.getRandomstring(96))
                .set('Accept', 'application/json')
                .set({})
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);
                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
    });
});