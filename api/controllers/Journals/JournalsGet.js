const util = require('../../helpers/util.helper');

exports.journalsGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * receiver (String)
     * timestamp (Integer)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = "";


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.created = req.swagger.params.created.value;
    request.publicKey = req.user.publicKey;

    journalsGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result);
        }
    });
};

const journalsGet = function(request, journalsGetCallback) {
    var error = {};
    error.status = 503;
    error.code = 5001;
    error.message = 'method not implemented at this time.';
    journalsGetCallback(error, false);
};