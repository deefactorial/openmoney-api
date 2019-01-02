'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/namespaces/{namespace}', function() {
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
                        "minProperties": 2,
                        "maxProperties": 8,
                        "required": [
                            "namespace",
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
                            "created_by": {
                                "type": "string"
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
            run.api.get('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

    });

    describe('put', function() {
        it('namespace change should respond with 403 OK', function(done) {
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
                id: "namespaces~" + run.steward.stewardname + "1.cc",
                namespace: run.steward.stewardname + "1.cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

        it('stewards change should respond with 200 OK', function(done) {
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
                id: "namespaces~" + run.steward.stewardname + ".cc",
                namespace: run.steward.stewardname + ".cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + run.steward.stewardname, "stewards~admin" ]
            };

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

        it('change back should respond with 200 OK', function(done) {
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
                id: "namespaces~" + run.steward.stewardname + ".cc",
                namespace: run.steward.stewardname + ".cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
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

            var space = {
                id: "namespaces~" + run.steward.stewardname + ".cc",
                namespace: run.steward.stewardname + ".ccc" ,
                parent_namespace: "ccc",
                stewards: [ "stewards~" + run.steward.stewardname ]
            };

            /*eslint-enable*/
            run.api.put('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + ".cc")
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
            run.api.del('/V2/stewards/' + run.steward.stewardname + '/namespaces/' + run.steward.stewardname + '.cc')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.error(errors);
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });
    });
});