const scrypt = require('scrypt');
const crypto = require('crypto');

exports.scryptParameters = scrypt.paramsSync(0.5);

exports.randomBytes = crypto.randomBytes;

exports.getSymetricKey = function(key){
    //console.log(key.getMaxMessageSize());
    //var symetric_key = getRandomstring(key.getMaxMessageSize());
    //console.log(symetric_key);
    //console.log(symetric_key.length);
    var randomRange = getRandomArbitrary(key.getMaxMessageSize()/2, key.getMaxMessageSize()-1);
    return getRandomstring(randomRange);
    //return getRandomstring();
}

exports.encryptSymetricKey = function(key, symetricKey) {
    //var encryptedSymetricKeyData = key.encrypt(symetric_key, 'base64', 'utf8');
    //console.log(encryptedSymetricKeyData);
    return key.encrypt(symetricKey, 'base64', 'utf8');
}

exports.getHash = function(value) {
    return crypto.createHash('sha256').update(value).digest('base64');
}

//    algorithm = 'aes-256-gcm',
//    password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY',
//// do not use a global iv for production,
//// generate a new one for each encryption
//    iv = '60iP0h6vJoEa'

exports.encrypt = function(text, algorithm, password, iv) {
    var cipher = crypto.createCipheriv(algorithm, password, iv);
    var encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag
    };
}

exports.decrypt = function(encrypted, algorithm, password, iv) {
    var decipher = crypto.createDecipheriv(algorithm, password, iv);
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
}