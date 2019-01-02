'use strict';
const chai = require('chai');
const ZSchema = require('z-schema');
exports.validator = new ZSchema({});
const supertest = require('supertest');
const port = process.env.PORT || 8080;
exports.api = supertest('http://localhost:' + port); // supertest init;
exports.expect = chai.expect;
const NodeRSA = require('node-rsa');

var util = require('./util');

var steward = {};
if(typeof process.env.STEWARDNAME == 'undefined' || process.env.STEWARDNAME.match(/test/)){
    steward.stewardname = 'test' + new Date().getTime();
} else {
    steward.stewardname = process.env.STEWARDNAME;
}

// generate public key
const key = new NodeRSA({b: 1024});
steward.publicKey = key.exportKey('pkcs8-public-pem');
exports.key = key;

if (typeof process.env.PASSWORD == 'undefined'){
    steward.password = util.getRandomstring(40);
} else {
    steward.password = process.env.PASSWORD;
}

exports.steward = steward;

if(typeof process.env.OPENMONEY_API_KEY == 'undefined'){
    process.env.OPENMONEY_API_KEY = 'q0LfZKmhvd0H9jXZK56TVJvZM+9tm5zBG0/P60ZPXz/MVh0+/vryhZ5z/X23tME3d0HuzhlB/lRouNauFroLrGmweoXCIHDPqZ19p2EHSCT3JVXQgsQHiyNPDEZiS8b1fl++o5qwFoVx62hx0eO2djFUfTkk9kR+paiyIZLs7jrjwxUVl1J+qmQF0ZPSYdyZSc8KhD7cYITFFp2N2Y9r+A==';
}

//generate public key
var new_key = new NodeRSA({b: 1024});
exports.new_key = new_key
exports.testing_publicKey = new_key.exportKey('pkcs8-public-pem');