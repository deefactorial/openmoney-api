var NodeRSA = require('node-rsa');

exports.getRandomstring = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.getHash = function(value) {
    var crypto = require('crypto');
    return crypto.createHash('sha256').update(value).digest('base64');
}

if (typeof process.env.OPENMONEY_API_KEY == 'undefined'){
    process.env.OPENMONEY_API_KEY = 'q0LfZKmhvd0H9jXZK56TVJvZM+9tm5zBG0/P60ZPXz/MVh0+/vryhZ5z/X23tME3d0HuzhlB/lRouNauFroLrGmweoXCIHDPqZ19p2EHSCT3JVXQgsQHiyNPDEZiS8b1fl++o5qwFoVx62hx0eO2djFUfTkk9kR+paiyIZLs7jrjwxUVl1J+qmQF0ZPSYdyZSc8KhD7cYITFFp2N2Y9r+A==';
}

// generate public key
const key = new NodeRSA({b: 1024});
exports.new_key = key
exports.testing_publicKey = key.exportKey('pkcs8-public-pem');

exports.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var crypto = require('crypto');
//    algorithm = 'aes-256-gcm',
//    password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY',
//// do not use a global iv for production,
//// generate a new one for each encryption
//    iv = '60iP0h6vJoEa'

exports.encrypt = function encrypt(text, algorithm, password, iv) {
    var cipher = crypto.createCipheriv(algorithm, password, iv);
    var encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag
    };
}

exports.decrypt = function decrypt(encrypted, algorithm, password, iv) {
    var decipher = crypto.createDecipheriv(algorithm, password, iv);
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
}