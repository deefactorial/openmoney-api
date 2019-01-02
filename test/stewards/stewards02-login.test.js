'use strict';
const run = require('../test-runner');

describe('/stewards/{stewardname}/login', function() {
    describe('get', function() {
        it('should respond with 200 A login page for the...', function(done) {
            var schema = {};

            run.api.get('/V2/stewards/' + run.steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
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

    describe('post', function() {
        it('should respond with 302 Redirect to account page', function(done) {

            var schema = {};
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + new Buffer(run.steward.stewardname + ":" + run.steward.password).toString("base64"))
                .send({
                })
                .expect(302)
                .end(function(err, res) {
                    if (err) return done(err);
                    var results = run.validator.validate(res.body, schema);
                    if (!results) {
                        var errors = JSON.stringify(run.validator.getLastErrors());
                    }
                    run.expect(results).to.be.true; // non-json response or no schema
                    done();
                });
        });

        it('should respond with 302 Redirect to account page', function(done) {
            var schema = {};
            run.api.post('/V2/stewards/' + run.steward.stewardname + '/login')
                .set('Accept', 'application/json')
                .set('Authorization', 'Basic ' + new Buffer(run.steward.stewardname + ":" + run.steward.password).toString("base64"))
                .send({
                })
                .expect(302)
                .end(function(err, res) {
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
