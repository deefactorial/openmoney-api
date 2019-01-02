const util = require('../../helpers/util.helper');

exports.stewardsDelete = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.publicKey = req.user.publicKey;

    stewardsDelete(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
        } else {
            examples['application/json'] = result;
        }
        res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    });

};

const stewardsDelete = function(request, stewardsDeleteCallback) {
    var error = {};
    error.status = 503;
    error.code = 1018;
    error.message = 'method not implemented at this time.';
    stewardsDeleteCallback(error, false);
};