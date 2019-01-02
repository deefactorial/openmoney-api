const util = require('../../helpers/util.helper');

exports.spacesDelete = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = {
        "id": "aeiou",
        "ok": true
    };


    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.publicKey = req.user.publicKey;

    spacesDelete(request, function (err, result) {
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
}

const spacesDelete = function(request, spacesDeleteCallback) {
    //this essentially removes yourself from stewardship of the space
    //check that namespace exists
    //check if there are any currencies or accounts using this space
    //delete space globally
    //delete space locally
    //notify those affected
    var error = {};
    error.status = 503;
    error.code = 2009;
    error.message = 'method not implemented at this time.';
    spacesDeleteCallback(error, false);
};