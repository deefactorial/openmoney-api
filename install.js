/**
 * Created by deefactorial on 28/01/16.
 */


if(typeof process.env.COUCHBASE_ADMIN_USERNAME == 'undefined'){
    console.error("Did you forget to set the COUCHBASE_ADMIN_USERNAME environment variable?");
}
if(typeof process.env.COUCHBASE_ADMIN_PASSWORD == 'undefined'){
    console.error("Did you forget to set the COUCHBASE_ADMIN_PASSWORD environment variable?");
}

var couchbase = require('couchbase'),
    serverAddress = '127.0.0.1',
    cluster = new couchbase.Cluster('couchbase://' + serverAddress),
    clusterManager = cluster.manager(process.env.COUCHBASE_ADMIN_USERNAME, process.env.COUCHBASE_ADMIN_PASSWORD),
    //N1qlQuery = couchbase.N1qlQuery,
    async = require('async'),
    tasks = {},
    openmoney_global = null,
    model = require('./installData');

tasks.create_bucket_oauth2Server = function(callback){
    //Create the bucket
    clusterManager.createBucket('oauth2Server', {}, function(err, results){
        if(err){
            callback("CREATE oauth2Server BUCKET ERROR: (does the bucket already exist ?) :" + err, null);
        } else {
            callback(null,"Successfully created oauth2Server bucket.");
        }
    });
};

// tasks.create_index_oauth2Server = function(callback){
//     //give couchbase a couple seconds to initialize the db.
//     setTimeout(function(){
//
//         //Open the bucket
//         var oauth2Server = cluster.openBucket('oauth2Server');
//         oauth2Server.enableN1ql(['http://' + serverAddress + ':8093/']);
//
//         Create the primary index on the bucket to query the bucket for model.dump
//         var queryString = "CREATE PRIMARY INDEX `#primary` ON `oauth2Server` USING GSI;";
//         var query = N1qlQuery.fromString(queryString);
//         oauth2Server.query(query, function(err, doc){
//             if(err) {
//                 callback("CREATE PRIMARY INDEX ERROR:" + err, null);
//             } else {
//                 callback(null, "Successfully created index.");
//             }
//         });
//     }, 3000);
// };

tasks.create_bucket_openmoney_global = function(callback){
    //Create the bucket
    clusterManager.createBucket('openmoney_global', {}, function(err, results){
        if(err){
            callback("CREATE openmoney_global BUCKET ERROR:" + err, null);
        } else {
            callback(null,"Successfully created openmoney_global bucket.");
        }
    });
};

// tasks.create_index_openmoney_global = function(callback){
//     //give couchbase a couple seconds to initialize the db.
//     setTimeout(function(){
//
//         //Open the bucket
//         openmoney_global = cluster.openBucket('openmoney_global');
//         openmoney_global.enableN1ql(['http://' + serverAddress + ':8093/']);
//
//         Create the primary index on the bucket to query the bucket for model.dump
//         var queryString = "CREATE PRIMARY INDEX `#primary` ON `openmoney_global` USING GSI;";
//         var query = N1qlQuery.fromString(queryString);
//         openmoney_global.query(query, function(err, doc){
//             if(err) {
//                 callback("CREATE PRIMARY INDEX ERROR:" + err, null);
//             } else {
//                 callback(null, "Successfully created index.");
//             }
//         });
//     }, 3000);
// };

tasks.create_bucket_openmoney_stewards = function(callback){
    //Create the bucket
    clusterManager.createBucket('openmoney_stewards', {}, function(err, results){
        if(err){
            callback("CREATE openmoney_stewards BUCKET ERROR:" + err, null);
        } else {
            callback(null,"Successfully created openmoney_stewards bucket.");
        }
    });
};

// tasks.create_index_openmoney_stewards = function(callback){
//     //give couchbase a couple seconds to initialize the db.
//     setTimeout(function(){
//
//         //Open the bucket
//         var openmoney_stewards = cluster.openBucket('openmoney_stewards');
//         openmoney_stewards.enableN1ql(['http://' + serverAddress + ':8093/']);
//
//         Create the primary index on the bucket to query the bucket for model.dump
//         var queryString = "CREATE PRIMARY INDEX `#primary` ON `openmoney_stewards` USING GSI;";
//         var query = N1qlQuery.fromString(queryString);
//         openmoney_stewards.query(query, function(err, doc){
//             if(err) {
//                 callback("CREATE PRIMARY INDEX ERROR:" + err, null);
//             } else {
//                 callback(null, "Successfully created index.");
//             }
//         });
//     }, 3000);
// };

tasks.insert_initial_data = function(callback){

    //give some time for the buckets to initialize
    setTimeout(function(){
      if(openmoney_global == null){
          openmoney_global = cluster.openBucket('openmoney_global');
      }
      var insertTasks = {};

      Object.keys(model).forEach(function (key) {
          var value = model[key];
          insertTasks[value.id] = function(cb){
              openmoney_global.insert(value.id, value, function(err, res) {
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
    }, 3000);
};

async.series(tasks, function(err, results){
    if(err){
        console.log(err);
    } else {
        console.log("successfully installed");
        console.log(results);
    }
    process.exit();
});
