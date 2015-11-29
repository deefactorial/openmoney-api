var couchbase = require('couchbase');
var cluster = new couchbase.Cluster('couchbase://127.0.0.1');
var bucket = cluster.openBucket('default');

bucket.upsert('testdoc', {name:'Frank'}, function(err, result) {
    if (err) throw err;

    bucket.get('testdoc', function(err, result) {
        if (err) throw err;

        console.log(result.value);
        // {name: Frank}
    });
});


//bucket.get(users.id, function (err, result) {
//    if (err) {
//        res.setHeader('Content-Type', 'application/json');
//        res.end(JSON.stringify(err || {}, null, 2));
//    } else {
//        examples['application/json'].users = result.value;
//        if (Object.keys(examples).length > 0) {
//            res.setHeader('Content-Type', 'application/json');
//            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
//        }
//        else {
//            res.end();
//        }
//    }
//});