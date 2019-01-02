const util = require('../../helpers/util.helper');

exports.accountsDiscovery = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     * publicKey (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "currency_namespace": "aeiou",
        "currency": "aeiou",
        "publicKey": "aeiou",
        "stewards": ["aeiou"],
        "account": "aeiou",
        "account_namespace": "aeiou"
    };

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namesapce.value;
    request.publicKey = req.user.publicKey;
    request.accountPublicKey = req.swagger.params.publicKey.value;

    accountsDiscovery(request, function (err, result) {
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

const accountsDiscovery = function(request, accountsDiscoveryCallback) {
    var error = {};
    error.code = '420';
    error.message = 'method not implemented at this time.';
    accountsDiscoveryCallback(error, false);
};