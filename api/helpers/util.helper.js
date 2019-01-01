exports.getRandomstring = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
}

exports.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

exports.setStatus = function(err){
    var result = 400;
    if(err.code < 1000 && err.code != 13) {
        console.log("Server Error: " + JSON.stringify(err));
        result = 500;
    } else if(err.code == 13){
        result = 404;
    } else if(typeof err.status != 'undefined') {
        result = err.status;
    }
    return result;
};
