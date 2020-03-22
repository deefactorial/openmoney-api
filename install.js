/**
 * Created by deefactorial on 28/01/16.
 */
require('dotenv').config();

if(typeof process.env.COUCHBASE_ADMIN_USERNAME === 'undefined'){
    console.error("Did you forget to set the COUCHBASE_ADMIN_USERNAME environment variable?");
    process.exit(1);
}
if(typeof process.env.COUCHBASE_ADMIN_PASSWORD === 'undefined'){
    console.error("Did you forget to set the COUCHBASE_ADMIN_PASSWORD environment variable?");
    process.exit(1);
}
if(typeof process.env.COUCHBASE_LO === 'undefined'){
    console.error("Did you forget to set the COUCHBASE_LO environment variable?");
    process.exit(1);
}

const couchbase = require('couchbase');
const async = require('async');
const tasks = {};
const model = require('./installData');

tasks.insert_initial_data = function(callback){
    const insertTasks = {};
    const cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}?detailed_errcodes=1`);
    cluster.authenticate(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD);
    const openmoney_bucket = cluster.openBucket('openmoney_global');
    const stewards_bucket = cluster.openBucket('openmoney_stewards');

    Object.keys(model.openmoney_bucket_data).forEach(function (key) {
        var value = model.openmoney_bucket_data[key];
        insertTasks[value.id] = function(cb){
            openmoney_bucket.insert(value.id, value, function(err, res) {
                if(err) {
                    cb(err, null);
                } else {
                    cb(null, res);
                }
            });
        }
    });

    Object.keys(model.stewards_bucket_data).forEach(function (key) {
        var value = model.stewards_bucket_data[key];
        insertTasks[value.id] = function(cb){
            stewards_bucket.insert(value.id, value, function(err, res) {
                if(err) {
                    cb(err, null);
                } else {
                    cb(null, res);
                }
            });
        }
    });

    async.parallel(insertTasks, function(err, res){
        if(err){
            callback(err, null);
        } else {
            callback(null, res);
        }
    });
};

async.series(tasks, function(err, results){
    if(err){
        console.error(err);
        process.exit(1);
    } else {
        console.info("successfully installed");
        console.info(results);
        process.exit();
    }
});
