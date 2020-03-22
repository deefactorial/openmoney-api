require('dotenv').config();
const couchbase = require('couchbase');
const cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}`);
cluster.authenticate(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD);
exports.stewards_bucket = cluster.openBucket('openmoney_stewards');
exports.openmoney_bucket = cluster.openBucket('openmoney_global');