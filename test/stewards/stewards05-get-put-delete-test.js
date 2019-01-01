'use strict';
const run = require('../test-runner');
const util = require('../util');

describe('/stewards/{stewardname}', function () {
    describe('get', function () {
        it('should respond with 200 steward', function (done) {
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
                        "minProperties": 2,
                        "maxProperties": 5,
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
            };

            //console.log(steward.stewardname);
            /*eslint-enable*/
            run.api.get('/V2/stewards/' + run.steward.stewardname)
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
            run.api.get('/V2/stewards/' + util.getRandomstring(20))
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .set({})
                .expect(404)
                .end(function (err, res) {
                    if (err) return done(err);
                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

    });

    describe('put', function () {
        it('should respond with 200 steward', function (done) {
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

            run.steward.password = 'new password';
            run.steward.email = 'example@example.com'
            run.steward.email_notifications = false;

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(run.steward)
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

            var change_name = {};
            change_name.stewardname = 'testing' + new Date().getTime();
            change_name.publicKey = run.steward.publicKey;
            change_name.password = run.steward.password;

            run.api.put('/V2/stewards/' + run.steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(change_name)
                .expect(503)
                .end(function (err, res) {
                    if (err) return done(err);
                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

    });

    describe('delete', function () {

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
            run.api.del('/V2/stewards/' + run.steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    run.expect(results).to.be.true;
                    done();
                });
        });

    });

});