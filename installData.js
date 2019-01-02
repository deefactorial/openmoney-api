/**
 * Created by deefactorial on 28/01/16.
 */

/*
 * These are the initial stewards of the root spaces and currencies.
 */

const scrypt = require('scrypt');
const scryptParameters = scrypt.paramsSync(0.5);
const NodeRSA = require('node-rsa');
const crypto = require('./api/helpers/crypto.helper');


if(typeof process.env.ADMIN_USERNAME === 'undefined'){
    console.error("Did you forget to set the ADMIN_USERNAME environment variable?");
    process.exit(1);
}

if(typeof process.env.ADMIN_PASSWORD === 'undefined'){
    console.error("Did you forget to set the ADMIN_PASSWORD environment variable?");
    process.exit(1);
}

if(typeof process.env.ROOT_SPACE === 'undefined'){
    console.error("Did you forget to set the ROOT_SPACE environment variable?");
    process.exit(1);
}

if(typeof process.env.ROOT_CURRENCY === 'undefined'){
    console.error("Did you forget to set the ROOT_CURRENCY environment variable?");
    process.exit(1);
}

const openmoney_bucket_data = {}

openmoney_bucket_data.admin = {};
openmoney_bucket_data.admin.stewardname = process.env.ADMIN_USERNAME;
openmoney_bucket_data.admin.password = scrypt.kdfSync(process.env.ADMIN_PASSWORD, scryptParameters).toString('base64');
if (process.env.ADMIN_PUBLICKEY) {
    openmoney_bucket_data.admin.publicKey = process.env.ADMIN_PUBLICKEY; 
} else {
    //generate one for the steward
    var key = new NodeRSA({b: 1024});
    openmoney_bucket_data.admin.publicKey = key.exportKey('pkcs8-public-pem');
    openmoney_bucket_data.admin.privateKey = key.exportKey('pkcs8-private-pem');
}
openmoney_bucket_data.admin.email = process.env.ADMIN_EMAIL;
openmoney_bucket_data.admin.email_notifications = true;
openmoney_bucket_data.admin.type = "stewards";
openmoney_bucket_data.admin.id = 'stewards~' + openmoney_bucket_data.admin.stewardname.toLowerCase();

//The root space cc stands for community currency or creative commons. It is the root namespace each steward gets an account in.
openmoney_bucket_data.cc_space = {};
openmoney_bucket_data.cc_space.namespace = process.env.ROOT_SPACE;
openmoney_bucket_data.cc_space.parent_namespace = ""; //references the parent space building a tree graph from the root.
openmoney_bucket_data.cc_space.created = new Date().getTime(); //static
openmoney_bucket_data.cc_space.stewards = [ openmoney_bucket_data.admin.id ];
openmoney_bucket_data.cc_space.type = "namespaces";
openmoney_bucket_data.cc_space.id = 'namespaces~' + openmoney_bucket_data.cc_space.namespace;

//This is the community currency all stewards get an account in this currency when they use the register api.
openmoney_bucket_data.cc_currency = {};
openmoney_bucket_data.cc_currency.currency = process.env.ROOT_CURRENCY;
openmoney_bucket_data.cc_currency.currency_namespace = ""; //currencies have their own spaces as well cc is the root.
openmoney_bucket_data.cc_currency.created = new Date().getTime(); //static
openmoney_bucket_data.cc_currency.stewards = [ openmoney_bucket_data.admin.id ];
openmoney_bucket_data.cc_currency.type = "currencies";
openmoney_bucket_data.cc_currency.id = 'currencies~' + openmoney_bucket_data.cc_currency.currency;

//This is the admin default account.
openmoney_bucket_data.account = {};
if(openmoney_bucket_data.admin.stewardname.toLowerCase().indexOf('.') !== -1){
    openmoney_bucket_data.account.account = openmoney_bucket_data.admin.stewardname.toLowerCase().substring(0, openmoney_bucket_data.admin.stewardname.toLowerCase().indexOf('.'));
} else {
    openmoney_bucket_data.account.account = openmoney_bucket_data.admin.stewardname.toLowerCase();
}
openmoney_bucket_data.account.account_namespace = openmoney_bucket_data.cc_space.namespace;
openmoney_bucket_data.account.currency = openmoney_bucket_data.cc_currency.currency;
openmoney_bucket_data.account.currency_namespace = "";
openmoney_bucket_data.account.stewards = [ openmoney_bucket_data.admin.id ];
openmoney_bucket_data.account.type = "accounts";
openmoney_bucket_data.account.id = 'accounts~' + openmoney_bucket_data.account.account.toLowerCase() + '.' + openmoney_bucket_data.account.account_namespace.toLowerCase() + '~' + openmoney_bucket_data.account.currency.toLowerCase();

exports.openmoney_bucket_data = openmoney_bucket_data;

const stewards_bucket_data = {};

stewards_bucket_data.steward_bucket = {};
stewards_bucket_data.steward_bucket.stewards = [ openmoney_bucket_data.admin.id ];
stewards_bucket_data.steward_bucket.namespaces = [ openmoney_bucket_data.cc_space.id ];
stewards_bucket_data.steward_bucket.currencies = [ openmoney_bucket_data.cc_currency.id ];
stewards_bucket_data.steward_bucket.accounts = [ openmoney_bucket_data.account.id ];
stewards_bucket_data.steward_bucket.type = "steward_bucket";
stewards_bucket_data.steward_bucket.id = stewards_bucket_data.steward_bucket.type + "~" + crypto.getHash(openmoney_bucket_data.admin.publicKey);

exports.stewards_bucket_data = stewards_bucket_data