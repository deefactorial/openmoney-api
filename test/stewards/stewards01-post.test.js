'use strict';
const run = require('../test-runner');

describe('/stewards', function () {

    describe('post', function () {

        it('should respond with 200 Registration Success', function (done) {
            this.timeout(3000);
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "minProperties": 1,
                "maxProperties": 4,
                "required": [
                    "stewards"
                ],
                "properties": {
                    "stewards": {
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
                                            "type": "string",
                                            "pattern": "^[A-Za-z0-9_.~-]+$"
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "minProperties": 1,
                                    "maxProperties": 10,
                                    "required": [
                                        "stewardname"
                                    ],
                                    "properties": {
                                        "stewardname": {
                                            "type": "string",
                                            "maxLength": 255,
                                            "pattern": "^[A-Za-z0-9_.-]+$"
                                        },
                                        "password": {
                                            "type": "string",
                                            "minLength": 4,
                                            "maxLength": 1024
                                        },
                                        "publicKey": {
                                            "type": "string",
                                            "minLength": 266,
                                            "maxLength": 800,
                                            "pattern": "^-----BEGIN PUBLIC KEY-----[A-Za-z0-9\\\\\\s/=+]+-----END PUBLIC KEY-----$"
                                        },
                                        "email": {
                                            "type": "string",
                                            "format": "email",
                                            "maxLength": 255,
                                            "pattern": "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$"
                                        },
                                        "email_notifications": {
                                            "type": "boolean"
                                        },
                                        "created": {
                                            "type": "integer",
                                            "description": "timestamp in milliseconds since epoch"
                                        },
                                        "created_by": {
                                            "type": "string",
                                            "description": "stewardname of steward who made change"
                                        },
                                        "modifications": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "modified": {
                                                        "type": "integer",
                                                        "description": "timestamp in milliseconds since epoch"
                                                    },
                                                    "modified_by": {
                                                        "type": "string",
                                                        "description": "stewardname of steward who made modification"
                                                    },
                                                    "modification": {
                                                        "type": "string",
                                                        "description": "human readable description of modification"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    "accounts": {
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
                                            "type": "string",
                                            "pattern": "^[A-Za-z0-9_.~-]+$"
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
                                        "created": {
                                            "type": "integer",
                                            "description": "timestamp in milliseconds since epoch"
                                        },
                                        "created_by": {
                                            "type": "string",
                                            "description": "stewardname of steward who made change"
                                        },
                                        "modifications": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "modified": {
                                                        "type": "integer",
                                                        "description": "timestamp in milliseconds since epoch"
                                                    },
                                                    "modified_by": {
                                                        "type": "string",
                                                        "description": "stewardname of steward who made modification"
                                                    },
                                                    "modification": {
                                                        "type": "string",
                                                        "description": "human readable description of modification"
                                                    }
                                                }
                                            }
                                        },
                                        "stewards": {
                                            "type": "array",
                                            "items": {
                                                "type": "string",
                                                "maxLength": 512,
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
                    },
                    "currencies": {
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
                                            "type": "string",
                                            "pattern": "^[A-Za-z0-9_.~-]+$"
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
                                        "created": {
                                            "type": "integer",
                                            "description": "timestamp in milliseconds since epoch"
                                        },
                                        "created_by": {
                                            "type": "string",
                                            "description": "stewardname of steward who made change"
                                        },
                                        "modifications": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "modified": {
                                                        "type": "integer",
                                                        "description": "timestamp in milliseconds since epoch"
                                                    },
                                                    "modified_by": {
                                                        "type": "string",
                                                        "description": "stewardname of steward who made modification"
                                                    },
                                                    "modification": {
                                                        "type": "string",
                                                        "description": "human readable description of modification"
                                                    }
                                                }
                                            }
                                        },
                                        "stewards": {
                                            "type": "array",
                                            "items": {
                                                "type": "string",
                                                "maxLength": 512,
                                                "pattern": "^stewards~[A-Za-z0-9_.-]+$"
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    "namespaces": {
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
                                            "type": "string",
                                            "pattern": "^[A-Za-z0-9_.~-]+$"
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "minProperties": 3,
                                    "maxProperties": 7,
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
                                        "created_by": {
                                            "type": "string",
                                            "description": "stewardname of who created space"
                                        },
                                        "modifications": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "modified": {
                                                        "type": "integer",
                                                        "description": "timestamp in milliseconds since epoch"
                                                    },
                                                    "modified_by": {
                                                        "type": "string",
                                                        "description": "stewardname of steward who made modification"
                                                    },
                                                    "modification": {
                                                        "type": "string",
                                                        "description": "human readable description of modification"
                                                    }
                                                }
                                            }
                                        },
                                        "stewards": {
                                            "type": "array",
                                            "items": {
                                                "type": "string",
                                                "maxLength": 512,
                                                "pattern": "^stewards~[A-Za-z0-9_.-]+$"
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            };

            /*eslint-enable*/
            run.api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(run.steward)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                    }
                    run.expect(results).to.be.true;

                    done();
                });
        });

        it('should respond with default Error', function (done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "Ststus": {
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
            run.api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(run.steward)
                .expect(400)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                    }
                    run.expect(results).to.be.true;
                    done();
                });
        });

        it('should respond with default Error', function (done) {
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
            run.api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(run.steward)
                .expect(400)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                    }
                    run.expect(results).to.be.true; // non-json response or no schema
                    done();
                });
        });

    });
});