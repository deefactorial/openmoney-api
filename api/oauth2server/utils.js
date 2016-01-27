/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
var crypto = require('crypto');

exports.uid = function(len, callback) {
  //TODO: replace with JWT
  //crypto.randomBytes(len, function (ex, buffer) {
  //  if (ex) return callback(error('server_error'));
  //  return buffer.toString('base64');
  //});
  crypto.randomBytes(len, function (ex, buffer) {
    if (ex) return callback(error('server_error'));

    var token = crypto
        .createHash('sha256')
        .update(buffer)
        .digest('base64');

    callback(false, token);
  });
  //var buf = []
  //  , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  //  , charlen = chars.length;
  //
  //for (var i = 0; i < len; ++i) {
  //  buf.push(chars[getRandomInt(0, charlen - 1)]);
  //}
  //
  //return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
