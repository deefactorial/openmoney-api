/*
TODO: run this every time you want to add a client then hard code them into the clients list.
 */

var scrypt = require('scrypt');
var scryptParameters = scrypt.paramsSync(0.5);
var crypto = require('crypto');
crypto.randomBytes(160, function (ex, buffer) {
    if (ex) return callback(error('server_error'));

    var client_secret = buffer;
    var client_secret_encrypted = scrypt.kdfSync(client_secret, scryptParameters).toString('base64');
    console.log('----BEGIN-CLIENT-SECRET----');
    console.log(buffer.toString('base64'));
    console.log('----END-CLIENT-SECRET----');
    console.log('----BEGIN-SCRYPT-CLIENT-SECRET----');
    console.log(client_secret_encrypted);
    console.log('----END-SCRYPT-CLIENT-SECRET----');
    process.exit();
});

