'use strict';
const run = require('../test-runner');

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
            request.username = run.steward.stewardname;
            request.password = run.steward.password;

            var basic = new Buffer("openmoney-api" + ":" + process.env.OPENMONEY_API_KEY).toString("base64");
            //console.log(basic);
            /*eslint-enable*/
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/oauth/token')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + basic)
                .send(request)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    process.env.BEARER_TOKEN = res.body.access_token;
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        //console.log(JSON.stringify(res.headers));
                        console.log(JSON.stringify(res));
                        console.log(res.text);
                        var errors = JSON.stringify(run.validator.getLastErrors());
                        console.log("errors:" + errors);
                    }
                    run.expect(results).to.be.true; // non-json response or no schema
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
