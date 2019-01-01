'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/namespaces', function() {
    describe('get', function() {
        it('should respond with 200 List of namespaces', function(done) {
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
                            "maxProperties": 8,
                            "required": [
                                "namespace",
                                "parent_namespace",
                                "stewards"
                            ],
                            "properties": {
                                "namespace": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_.-]+$"
                                },
                                "parent_namespace": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_.-]*$"
                                },
                                "created": {
                                    "type": "integer",
                                    "description": "timestamp in milliseconds since epoch"
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
                }
            };

            /*eslint-enable*/
            run.api.get('/V2/stewards/' + run.steward.stewardname + '/namespaces')
                .query({
                    parent_namespace: 'cc'
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
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

            var space = {
                namespace: run.steward.stewardname + "2.cc" ,
                parent_namespace: 'cc',
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    run.expect(results).to.be.true;
                    done();
                });
        });


        it('namespace exists should respond with default error payload', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "status": {
                        "type" : "integer"
                    },
                    "code": {
                        "type": "integer"
                    },
                    "message": {
                        "type": "string"
                    }
                }
            };

            var space = {
                namespace: run.steward.stewardname + ".cc" ,
                parent_namespace: 'cc',
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        it('no parent should respond with default error payload', function(done) {
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

            var space = {
                namespace: "cc" ,
                parent_namespace: '',
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        it('parent does not exist should respond with default error payload', function(done) {
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

            var space = {
                namespace: run.steward.stewardname + ".canada",
                parent_namespace: '.canada',
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    run.expect(run.validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
    });
});