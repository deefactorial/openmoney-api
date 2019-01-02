const util = require('../../helpers/util.helper');
const db = require('../../helpers/db.helper');

exports.accountsGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
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
    request.publicKey = req.user.publicKey;

    accountsGet(request, function (err, result) {
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

const accountsGet = function(request, accountsGetCallback) {
    var currency = request.currency_namespace == '' ? request.currency.toLowerCase() : request.currency.toLowerCase() + '.' + request.currency_namespace.toLowerCase();
    db.openmoney_bucket.get('accounts~' + request.account.toLowerCase() + '.' + request.namespace.toLowerCase() + '~' + currency, function(err, results) {
        if (err) {
            accountsGetCallback(err,false);
        } else {
            accountsGetCallback(null, results.value);
        }
    });
};