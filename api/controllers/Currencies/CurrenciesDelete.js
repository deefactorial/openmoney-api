const util = require('../../helpers/util.helper');

exports.currenciesDelete = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currencyname (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.publicKey = req.user.publicKey;

    currenciesDelete(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {

            res.end(result)
        }

    });

};

const currenciesDelete = function(request, currenciesDeleteCallback) {
    var error = {};
    error.status = 503;
    error.code = 3001;
    error.message = 'method not implemented at this time.';

    currenciesDeleteCallback(error, null);
};