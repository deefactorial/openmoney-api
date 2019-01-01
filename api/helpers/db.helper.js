const couchbase = require('couchbase');
const cluster = new couchbase.Cluster(`couchbase://${process.env.COUCHBASE_LO}`);
exports.stewards_bucket = cluster.openBucket('openmoney_stewards');
exports.openmoney_bucket = cluster.openBucket('openmoney_global');