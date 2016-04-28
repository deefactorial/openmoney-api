'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var port = process.env.PORT || 8080;
var api = supertest('http://localhost:' + port); // supertest init;
var expect = chai.expect;
var NodeRSA = require('node-rsa');

//require('dotenv').load();

function getRandomstring(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function getHash(value) {
    var crypto = require('crypto');
    return crypto.createHash('sha256').update(value).digest('base64');
}

var steward = {};
if(typeof process.env.STEWARDNAME == 'undefined' || process.env.STEWARDNAME.match(/test/)){
    steward.stewardname = 'test' + new Date().getTime();
} else {
    steward.stewardname = process.env.STEWARDNAME;
}

//generate public key
var key = new NodeRSA({b: 1024});
steward.publicKey = key.exportKey('pkcs8-public-pem');

if(typeof process.env.PASSWORD == 'undefined'){
    steward.password = getRandomstring(40);
} else {
    steward.password = process.env.PASSWORD;
}

console.log(steward);

if(typeof process.env.OPENMONEY_API_KEY == 'undefined'){
    process.env.OPENMONEY_API_KEY = 'q0LfZKmhvd0H9jXZK56TVJvZM+9tm5zBG0/P60ZPXz/MVh0+/vryhZ5z/X23tME3d0HuzhlB/lRouNauFroLrGmweoXCIHDPqZ19p2EHSCT3JVXQgsQHiyNPDEZiS8b1fl++o5qwFoVx62hx0eO2djFUfTkk9kR+paiyIZLs7jrjwxUVl1J+qmQF0ZPSYdyZSc8KhD7cYITFFp2N2Y9r+A==';
}

//generate public key
var new_key = new NodeRSA({b: 1024});
var testing_publicKey = new_key.exportKey('pkcs8-public-pem');

describe('/stewards', function () {

    describe('post', function () {

        //console.log(steward);

        it('should respond with 200 Registration Success', function (done) {
            this.timeout(3000);
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "minProperties": 4,
                "maxProperties": 4,
                "required": [
                    "stewards",
                    "accounts",
                    "currencies",
                    "namespaces"
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
                                    "minProperties": 2,
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
            api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(steward)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;

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
            api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(steward)
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //steward.stewardname = "test" + new Date().getTime();
        //console.log(steward.stewardname)

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
            api.post('/V2/stewards')
                .set('Accept', 'application/json')
                .send(steward)
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true; // non-json response or no schema
                    done();
                });
        });

    });
});

describe('/stewards/{stewardname}/login', function() {
    describe('get', function() {
        it('should respond with 200 A login page for the...', function(done) {
            var schema = {};

            api.get('/V2/stewards/' + steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    //console.log(res.body);
                    //expect(res.body).to.equal({}); // non-json response or no schema
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true; // non-json response or no schema
                    done();

                });
        });

    });

    describe('post', function() {
        it('should respond with 302 Redirect to account page', function(done) {

            var schema = {};
            api.post('/V2/stewards/' + steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + new Buffer(steward.stewardname + ":" + steward.password).toString("base64"))
                .send({
                })
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true; // non-json response or no schema
                    done();
                    //expect(res.body).to.equal({}); // non-json response or no schema
                    //done();
                });
        });

        it('should respond with 302 Redirect to account page', function(done) {
            var schema = {};
            api.post('/V2/stewards/' + steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + new Buffer(steward.stewardname + ":" + steward.password).toString("base64"))
                .send({
                })
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true; // non-json response or no schema
                    done();
                });
        });
    });
});


describe('/stewards/{stewardname}/oauth/token', function() {
    describe('post', function() {
        it('should respond with 200 Acess Token is returned', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "object",
                "minProperties": 5,
                "maxProperties": 6,
                "required": [
                    "access_token",
                    "refresh_token",
                    "expires",
                    "scope",
                    "token_type"
                ],
                "properties": {
                    "access_token": {
                        "type": "string",
                        "minLength": 32,
                        "pattern": "^[A-Za-z0-9=/+]+$",
                        "description": "This is the access token used to authenticate successive requests."
                    },
                    "refresh_token": {
                        "type": "string",
                        "minLength": 32,
                        "pattern": "^[A-Za-z0-9=/+]+$",
                        "description": "This is the refresh token used to refresh access tokens."
                    },
                    "expires": {
                        "type": "string",
                        "description": "time when token expires"
                    },
                    "scope": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "minLength": 5,
                            "maxLength": 32
                        }
                    },
                    "token_type": {
                        "type": "string",
                        "pattern": "^Bearer$"
                    }
                }
            };
            /*eslint-enable*/

            var request = {};
            request.grant_type = "password";
            //request.client_id = "openmoney-api";
            //request.client_secret = process.env.OPENMONEY_API_KEY;
            request.username = steward.stewardname;
            request.password = steward.password;

            var basic = new Buffer("openmoney-api" + ":" + process.env.OPENMONEY_API_KEY).toString("base64");
            //console.log(basic);
            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/oauth/token')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + basic)
                .send(request)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    process.env.BEARER_TOKEN = res.body.access_token;
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        //console.log(JSON.stringify(res.headers));
                        console.log(JSON.stringify(res));
                        console.log(res.text);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true; // non-json response or no schema
                    done();
                });
        });

        //it('should respond with 200 Acess Token is returned', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/oauth/token')
        //        .set('Authorization', 'Basic ' + process.env.PASSWORD)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            access_token_request: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default Error', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/oauth/token')
        //        .set('Authorization', 'Basic ' + process.env.PASSWORD)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            access_token_request: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default Error', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/oauth/token')
        //        .set('Authorization', 'Basic ' + process.env.PASSWORD)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            access_token_request: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});


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

            //console.log(process.env.BEARER_TOKEN);

            /*eslint-enable*/
            api.get('/V2/stewards')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .set({})
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 List of stewards', function (done) {
        //    api.get('/V2/stewards')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({})
        //        .expect(200)
        //        .end(function (err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
            api.get('/V2/stewards')
                //.set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
                .set('Accept', 'application/json')
                .set({})
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
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
            api.get('/V2/stewards')
                .set('Authorization', 'Bearer ' + getRandomstring(96))
                .set('Accept', 'application/json')
                .set({})
                .expect(403)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
    });
});

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
            api.get('/V2/stewards/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .set({})
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    //expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 steward', function(done) {
        //  api.get('/V2/stewards/' + steward.stewardname)
        //      .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //      .set('Accept', 'application/json')
        //      .set({})
        //      .expect(200)
        //      .end(function(err, res) {
        //        if (err) return done(err);
        //        expect(res.body).to.equal(null); // non-json response or no schema
        //        done();
        //      });
        //});

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
            api.get('/V2/stewards/' + getRandomstring(20))
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .set({})
                .expect(404)
                .end(function (err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with default error payload', function(done) {
        //  api.get('/V2/stewards/{stewardname PARAM GOES HERE}')
        //      .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //      .set('Accept', 'application/json')
        //      .set({
        //        'Authorization': 'DATA GOES HERE'
        //      })
        //      .expect('DEFAULT RESPONSE CODE HERE')
        //      .end(function(err, res) {
        //        if (err) return done(err);
        //
        //        expect(res.body).to.equal(null); // non-json response or no schema
        //        done();
        //      });
        //});

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

            //console.log(steward);

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(steward)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    //expect(validator.validate(res.body, schema)).to.be.true;
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
            change_name.publicKey = steward.publicKey;
            change_name.password = steward.password;

            api.put('/V2/stewards/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(change_name)
                .expect(503)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(validator.validate(res.body, schema)).to.be.true;
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

            var change_publicKey = {};
            change_publicKey.stewardname = steward.stewardname;
            change_publicKey.publicKey = testing_publicKey;
            change_publicKey.password = steward.password;

            api.put('/V2/stewards/' + change_publicKey.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(change_publicKey)
                .expect(503)
                .end(function (err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

    });

    describe('delete', function () {
        //it('should respond with 200 steward', function(done) {
        //  /*eslint-disable*/
        //  var schema = {
        //    "type": "object",
        //    "required": [
        //      "id",
        //      "ok"
        //    ],
        //    "properties": {
        //      "id": {
        //        "type": "string"
        //      },
        //      "ok": {
        //        "type": "boolean"
        //      }
        //    }
        //  };
        //
        //  /*eslint-enable*/
        //  api.del('/V2/stewards/{stewardname PARAM GOES HERE}')
        //      .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //      .set('Accept', 'application/json')
        //      .set({
        //        'Authorization': 'DATA GOES HERE'
        //      })
        //      .expect(200)
        //      .end(function(err, res) {
        //        if (err) return done(err);
        //
        //        expect(validator.validate(res.body, schema)).to.be.true;
        //        done();
        //      });
        //});
        //
        //it('should respond with 200 steward', function(done) {
        //  api.del('/V2/stewards/{stewardname PARAM GOES HERE}')
        //      .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //      .set('Accept', 'application/json')
        //      .set({
        //        'Authorization': 'DATA GOES HERE'
        //      })
        //      .expect(200)
        //      .end(function(err, res) {
        //        if (err) return done(err);
        //
        //        expect(res.body).to.equal(null); // non-json response or no schema
        //        done();
        //      });
        //});

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
            api.del('/V2/stewards/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function (err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    //expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with default error payload', function(done) {
        //  api.del('/V2/stewards/{stewardname PARAM GOES HERE}')
        //      .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //      .set('Accept', 'application/json')
        //      .set({
        //        'Authorization': 'DATA GOES HERE'
        //      })
        //      .expect('DEFAULT RESPONSE CODE HERE')
        //      .end(function(err, res) {
        //        if (err) return done(err);
        //
        //        expect(res.body).to.equal(null); // non-json response or no schema
        //        done();
        //      });
        //});

    });

});


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
                            "maxProperties": 6,
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
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces')
                .query({
                    parent_namespace: 'cc'
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 List of namespaces', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces')
        //        .query({
        //            parent_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces')
        //        .query({
        //            parent_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces')
        //        .query({
        //            parent_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
                namespace: steward.stewardname + ".cc" ,
                parent_namespace: 'cc',
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        return done(err);
                    }

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
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
                namespace: steward.stewardname + ".cc" ,
                parent_namespace: 'cc',
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .send({
        //            space: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
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
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
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
                namespace: steward.stewardname + ".canada",
                parent_namespace: '.canada',
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(403)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //
        //it('should respond with default error payload', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .send({
        //            space: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});


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
                        "maxProperties": 7,
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
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('put', function() {
        it('namespace change should respond with 200 OK', function(done) {
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
                id: "namespaces~" + steward.stewardname + "1.cc",
                namespace: steward.stewardname + "1.cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
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
                id: "namespaces~" + steward.stewardname + "1.cc",
                namespace: steward.stewardname + "1.cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + steward.stewardname, "stewards~deefactorial" ]
            };

            /*eslint-enable*/

            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + "1.cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
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
                id: "namespaces~" + steward.stewardname + ".cc",
                namespace: steward.stewardname + ".cc" ,
                parent_namespace: "cc",
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/

            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + "1.cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
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
                id: "namespaces~" + steward.stewardname + ".cc",
                namespace: steward.stewardname + ".ccc" ,
                parent_namespace: "ccc",
                stewards: [ "stewards~" + steward.stewardname ]
            };

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + ".cc")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(space)
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with default error payload', function(done) {
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            space: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('delete', function() {
        //it('should respond with 200 Delete success', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "id",
        //            "ok"
        //        ],
        //        "properties": {
        //            "id": {
        //                "type": "string"
        //            },
        //            "ok": {
        //                "type": "boolean"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with 200 Delete success', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
            api.del('/V2/stewards/' + steward.stewardname + '/namespaces/' + steward.stewardname + '.cc')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with default error payload', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
    });
});

describe('/stewards/{stewardname}/namespaces/{namespace}/currencies', function() {
    describe('get', function() {
        it('should respond with 200 List of currencies', function(done) {
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
                                        "pattern": "^[A-Za-z0-9_.~-]+$"
                                    }
                                }
                            }
                        }
                    ]
                }
            };

            /*eslint-enable*/
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/' + 'cc' + '/currencies')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 List of currencies', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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

            var currency = {};
            currency.currency = steward.stewardname;
            currency.currency_namespace = 'cc';
            currency.stewards = [ "stewards~" + steward.stewardname ];
            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces/' + 'cc' + '/currencies')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(currency)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currency: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currency: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currency: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});

describe('/stewards/{stewardname}/namespaces/{namespace}/currencies/{currency}', function() {
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
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/cc/currencies/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('put', function() {
        //it('should respond with 200 OK', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "id",
        //            "ok"
        //        ],
        //        "properties": {
        //            "id": {
        //                "type": "string"
        //            },
        //            "ok": {
        //                "type": "boolean"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currencies: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});

        //it('should respond with 200 OK', function(done) {
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currencies: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
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

            var currency = {};
            currency.currency = steward.stewardname;
            currency.currency_namespace = 'cc';
            currency.stewards = [ "stewards~" + steward.stewardname ];

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/cc/currencies/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(currency)
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
        //
        //it('should respond with default error payload', function(done) {
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            currencies: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('delete', function() {
        //it('should respond with 200 OK', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "id",
        //            "ok"
        //        ],
        //        "properties": {
        //            "id": {
        //                "type": "string"
        //            },
        //            "ok": {
        //                "type": "boolean"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});

        //it('should respond with 200 OK', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
            api.del('/V2/stewards/' + steward.stewardname + '/namespaces/cc/currencies/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });

        //it('should respond with default error payload', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/currencies/{currency PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});


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
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts')
                .query({
                    currency: 'cc', currency_namespace: ''
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 List of accounts', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
            account.account = steward.stewardname + "2";
            account.account_namespace = 'cc';
            account.currency = 'cc';
            account.currency_namespace = '';
            account.stewards = [ "stewards~" + steward.stewardname ];

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts')
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            account: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };

        //var account = {};
        //account.account = steward.stewardname;
        //account.account_namespace = 'cc';
        //account.currency = 'cc'
        //account.currency_namespace = '';
        //account.stewards = [ "stewards~" + steward.stewardname ];
        //
        //    /*eslint-enable*/
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            account: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            account: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});


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
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts/' + steward.stewardname)
                .query({
                    currency: 'cc', currency_namespace: ''
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .query({
        //            currency: 'DATA GOES HERE',currency_namespace: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

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
            account_change.account = steward.stewardname + "3";
            account_change.account_namespace = 'cc';
            account_change.currency = 'cc';
            account_change.currency_namespace = '';
            account_change.stewards = [ "stewards~" + steward.stewardname ];

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/' + 'cc' + '/accounts/' + steward.stewardname + "2")
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account_change)
                .expect(200)
                .end(function(err, res) {
                    //console.log(res.body);
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            accounts: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
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
            account_change.account = steward.stewardname + '3';
            account_change.account_namespace = 'cc';
            account_change.currency = 'ccc';
            account_change.currency_namespace = '';
            account_change.stewards = [ "stewards~" + steward.stewardname, "stewards~test1451600055471" ];

            /*eslint-enable*/
            api.put('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(account_change)
                .expect(404)
                .end(function(err, res) {
                    //console.log(res.body);
                    if (err) {
                        //console.log(err);
                        return done(err);
                    }

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });
        //
        //it('should respond with default error payload', function(done) {
        //    api.put('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            accounts: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('delete', function() {
        //it('should respond with 200 OK', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "id",
        //            "ok"
        //        ],
        //        "properties": {
        //            "id": {
        //                "type": "string"
        //            },
        //            "ok": {
        //                "type": "boolean"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});

        //it('should respond with 200 OK', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
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
            api.del('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts/' + steward.stewardname)
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(503)
                .end(function(err, res) {
                    if (err) return done(err);

                    expect(validator.validate(res.body, schema)).to.be.true;
                    done();
                });
        });
        //
        //it('should respond with default error payload', function(done) {
        //    api.del('/V2/stewards/{stewardname PARAM GOES HERE}/space/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

});


var crypto = require('crypto');
//    algorithm = 'aes-256-gcm',
//    password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY',
//// do not use a global iv for production,
//// generate a new one for each encryption
//    iv = '60iP0h6vJoEa'

function encrypt(text, algorithm, password, iv) {
    var cipher = crypto.createCipheriv(algorithm, password, iv);
    var encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag
    };
}

function decrypt(encrypted, algorithm, password, iv) {
    var decipher = crypto.createDecipheriv(algorithm, password, iv);
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
}

var created = null;

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
            journal.to_account = steward.stewardname;
            journal.to_account_namespace = 'cc';
            journal.amount = 0;

            /*eslint-enable*/
            api.post('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts/' + steward.stewardname + '/journals/' + 'cc')
                .query({
                    currency_namespace: ''
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .send(journal)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;
                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            journal: 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            journal: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.post('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .send({
        //            journal: 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});

    });

    describe('get', function() {
        it('should respond with 200 OK', function(done) {
            /*eslint-disable*/
            var schema = {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string"
                        },
                        "type": {
                            "type": "string"
                        },
                        "algorithm": {
                            "type": "string"
                        },
                        "publicKeyEncryptedSymetricKey": {
                            "type": "string"
                        },
                        "initializationVector": {
                            "type": "string"
                        },
                        "encryptedJournal": {
                            "type": "object",
                            "properties": {
                                "content": {
                                    "type": "string"
                                },
                                "tag": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            };

            var journal_schema = {
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
                            "minProperties": 8,
                            "maxProperties": 11,
                            "required": [
                                "to_account",
                                "to_account_namespace",
                                "from_account",
                                "from_account_namespace",
                                "currency",
                                "currency_namespace",
                                "amount",
                                "created",
                                "created_by"
                            ],
                            "properties": {
                                "to_account": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_-]+$"
                                },
                                "to_account_namespace": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_.-]+$"
                                },
                                "from_account": {
                                    "type": "string",
                                    "maxLength": 255,
                                    "pattern": "^[A-Za-z0-9_-]+$"
                                },
                                "from_account_namespace": {
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
                                "amount": {
                                    "type": "number",
                                    "minimum": 0
                                },
                                "created": {
                                    "type": "integer"
                                },
                                "created_by": {
                                    "type": "string"
                                }
                            }
                        }
                    ]
                }
            };


            /*eslint-enable*/
            api.get('/V2/stewards/' + steward.stewardname + '/namespaces/cc/accounts/' + steward.stewardname + '/journals/cc')
                .query({
                    offset: 0, range: 20
                })
                .set('Authorization', 'Bearer ' + process.env.BEARER_TOKEN)
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    //console.log(res.body);

                    var results = validator.validate(res.body, schema);
                    if (!results) {
                        console.log(res.body);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;

                    var encryptedJournal = res.body[0];
                    var symetricKey = key.decrypt(encryptedJournal.publicKeyEncryptedSymetricKey, 'utf8');
                    //console.log(symetricKey);
                    //console.log(res.body[0].encryptedJournal.tag);
                    var resultsArray = [];
                    res.body.forEach(function(journalEntry){
                        journalEntry.encryptedJournal.tag = new Buffer(journalEntry.encryptedJournal.tag.data);
                        var journal = decrypt(encryptedJournal.encryptedJournal, encryptedJournal.algorithm, symetricKey, encryptedJournal.initializationVector);
                        //created = journal.created;
                        resultsArray.push(journal);
                    });

                    var results = validator.validate(resultsArray, journal_schema);
                    if (!results) {
                        console.log(resultsArray);
                        var errors = JSON.stringify(validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    expect(results).to.be.true;

                    done();
                });
        });

        //it('should respond with 200 OK', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .query({
        //            offset: 'DATA GOES HERE',range: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect(200)
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    /*eslint-disable*/
        //    var schema = {
        //        "type": "object",
        //        "required": [
        //            "code",
        //            "message"
        //        ],
        //        "properties": {
        //            "code": {
        //                "type": "integer",
        //                "format": "int32"
        //            },
        //            "message": {
        //                "type": "string"
        //            }
        //        }
        //    };
        //
        //    /*eslint-enable*/
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .query({
        //            offset: 'DATA GOES HERE',range: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(validator.validate(res.body, schema)).to.be.true;
        //            done();
        //        });
        //});
        //
        //it('should respond with default error payload', function(done) {
        //    api.get('/V2/stewards/{stewardname PARAM GOES HERE}/namespaces/{namespace PARAM GOES HERE}/accounts/{account PARAM GOES HERE}/journals')
        //        .query({
        //            offset: 'DATA GOES HERE',range: 'DATA GOES HERE'
        //        })
        //        .set('Authorization', 'Bearer ' + process.env.OPENMONEY_APPLICATION)
        //        .set('Accept', 'application/json')
        //        .set({
        //            'Authorization': 'DATA GOES HERE'
        //        })
        //        .expect('DEFAULT RESPONSE CODE HERE')
        //        .end(function(err, res) {
        //            if (err) return done(err);
        //
        //            expect(res.body).to.equal(null); // non-json response or no schema
        //            done();
        //        });
        //});
    });
});

