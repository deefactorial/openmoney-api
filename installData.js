/**
 * Created by deefactorial on 28/01/16.
 */

/*
 * These are the initial stewards of the root spaces and currencies.
 */

var scrypt = require('scrypt');
var scryptParameters = scrypt.paramsSync(0.5);

function getRandomstring(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var model = module.exports;

model.deefactorial = {};
model.deefactorial.stewardname = 'deefactorial';
model.deefactorial.password = scrypt.kdfSync(getRandomstring(256), scryptParameters).toString('base64'); //these will be changed manually in the db, or the forgotten password functionality will be invoked.
model.deefactorial.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuoreAzUFyumy3TxoohvkSrukPSX994GUxMg0u1K03m+kI+Uscl+aCJ9y9gtEIxRfZ9fGcDceAZDBA0neZS0aUHu7tH9oI9NzJPhl9A9ORMovdGOrFLqDaSKY6FvDxxQAWT0CbAGfUDGB20Y1793j4bqd1iQHSdo+oVM8bv54THCwFIpjcNW0llbO910t1FE32CWt2Y1kGheMrt0w8du3gFUNIykGoCau2E4q7iDbnID2gl7jNHQQbZbHJX42ywTgFd6a9RuH6c/0vUO2M4u6qXaabOML67uMIpOo77YYEe7VzhL1rqavAvLO4weV0FZ76E8GWMsu9jeKLG4f88OVrFd3QgF55FU8dgbypboeI/e048sNeuEVDRYg4tZUjbzONSSPUk4ZNKbYnhcgYoPWs/DBYFXSssYnQzl5dWgAc8yuYREhqy0Uhr4EzuOBjf/j161UPRrz622jUztN95+idIXwc+sbP76tW4w+8Jm3Z1By+I+2JCRPhcdJYywsH41nDMekKs8xV85mpIkLABompZ5llpKeJkyZboMgF3ynziCMZt7T1zk5dROeHE7GtyhM2Q3BJD+VGteRV1WUmBC1Y9CWTR7/qn4lk6Fa4QNymdx8IfM1uEINFLhAHr+AALwotwHwISjnN2mx8X+mjxXX+w85u3uO1clzPzBLGzrZ/IcCAwEAAQ==-----END PUBLIC KEY-----';
model.deefactorial.email = 'deefactorial@gmail.com';
model.deefactorial.email_notifications = true;
model.deefactorial.type = "stewards";
model.deefactorial.id = 'stewards~' + model.deefactorial.stewardname.toLowerCase();

model.michael = {};
model.michael.stewardname = 'mwl';
model.michael.password = scrypt.kdfSync(getRandomstring(256), scryptParameters).toString('base64');
model.michael.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5JW4L83dOXtWhlQ64F3DAcdckwabV+kYDUIYVSSPxFcPPHAVTDOBwk0NANiEfZQs/uFZgQMfjtz3QGy9LIOp7hVQYhCXtNnL+40iCBFo2uVUrcr5oQpIzQmEuNO1t5d46kRKTMDhg5nWuoPgF5EkLhaUnw0jRuKbM7b4enEijyOFJm9aYWYl/0Czp15bdwhm/q9Et3gvR5ag30GLViTi5dJakV+LI1rTR9SP9Z2wkViy1t3nO7De5dUsIOra67XClUtqCt9x4R8+yEllFMalb02fzgXpSL01lMa6naIIg3LjcP+pmGY1pZcbZj8NBr+Mg9PKOjz4YfHSB66Q73zCvHt+uoeEE0p8+v67pWleZlnckPVSRk0jRY095wNVw4mgso08XtJ4pO/TcmfsI/SgH6LjRPpakyfHVrwm2uBjK+u2HtKSq53UcuxoENP5PJodIt+6a+GqvdHuqE37np77+51lbFC7A4oJT13py/cDng3X0l+glLNJaxm67pVa4CgR9n7aPXaCcHLN/lvHkzctUa5k30uuAoZB2TiWcq1gWyGJYl1FKcxNxniYwpu9WJ05VwwVHoW1FvKVz/hpKEN4febifqOR/+JhpxkyrsDfmaWabXgMZygAlAGW9hCxfi5OagrslMNyuF8OTyrg6VQtNKO6QYcflReHRPDzUz/54UsCAwEAAQ==-----END PUBLIC KEY-----';
model.michael.email = 'michael.linton@gmail.com';
model.michael.email_notifications = true;
model.michael.type = "stewards";
model.michael.id = 'stewards~' + model.michael.stewardname.toLowerCase();

model.les = {};
model.les.stewardname = 'les';
model.les.password = scrypt.kdfSync(getRandomstring(256), scryptParameters).toString('base64');
model.les.publicKey = '-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAss/XIJKfafrpWizysIaxz8yp/92mnu+bP24f+OOXcZfo6LVHFUNnWABCWvui5c4/I68SvKDcjr/WCGlfRVmiRCdoGAt4JT3biaBJUkO3ng4JYi6l17PKnMUDw/d525gnU/uFQJ1HlzovT7GNJ1pUS9vy9attgNgkrGce5n9W03wSU5CAwWD5iZnMKK7TzBrwWO1AEh272vvyomgNO9sKU+g86B0Zj0HuP4feTJQ1RPXNZd5LYFjrtrfqi1lw+/fLPWhB4TfV7nFE/tSvrigA5f8pxPzeunUgh2JZlubtC/3fwOMI2WXNtvkUaGE/bbRGCEFwxdk4U20MQ2G4goEvMsMZZNmD3mygHmXRPTSOQvbT6Iamoxq1qhzzWBXCO7NoJyARw/RpVy+wjXIWXtm1BtrEF2j9JsbDorFQy1jkDijVdAGB6DXi0YhK5mjggIp77RClN1ulpaG8Tdso9Xp3xh490AnoQDSvIsEIG9WuYEhWZEbTGSkESf76ll7qff1d3Hy1sl+9iCPIfCcNu58jGclLw8xjX25Z8SJMJBlAXPPEEj5sBzgpQ+Q6jaVTfkxnopkq6CsSsSzcdhLv2oAijLdjmevDiYy5KsFLSFai3GkkCZk9K3PCdgPv3uf8N2vjkWp+gTmL+PUXM9uZItOPhpZVPEtZjqgzX9166qnybqkCAwEAAQ==-----END PUBLIC KEY-----';
model.les.email = 'les.moore@commonresource.net';
model.les.email_notificaitons = true;
model.les.type = "stewards";
model.les.id = 'stewards~' + model.les.stewardname.toLowerCase();

//The root space cc stands for community currency or creative commons. It is the root namespace each steward gets an account in.
model.cc_space = {};
model.cc_space.namespace = "cc";
model.cc_space.parent_namespace = ""; //references the parent space building a tree graph from the root.
model.cc_space.created = new Date().getTime(); //static
model.cc_space.stewards = [ model.deefactorial.id, model.michael.id ];
model.cc_space.type = "namespaces";
model.cc_space.id = 'namespaces~' + model.cc_space.namespace;

//This is the community currency all stewards get an account in this currency when they use the register api.
model.cc_currency = {};
model.cc_currency.currency = "cc";
model.cc_currency.currency_namespace = ""; //currencies have their own spaces as well cc is the root.
model.cc_currency.created = new Date().getTime(); //static
model.cc_currency.stewards = [ model.deefactorial.id , model.michael.id ];
model.cc_currency.type = "currencies";
model.cc_currency.id = 'currencies~' + model.cc_currency.currency;

model.ca_space = {};
model.ca_space.namespace = "ca";
model.ca_space.parent_namespace = "";
model.ca_space.created = new Date().getTime(); //static
model.ca_space.stewards = [model.deefactorial.id, model.michael.id];
model.ca_space.type = "namespaces";
model.ca_space.id = 'namespaces~' + model.ca_space.namespace;

model.uk_space = {};
model.uk_space.namespace = "uk";
model.uk_space.parent_namespace = "";
model.uk_space.created = new Date().getTime(); //static
model.uk_space.stewards = [model.les.id];
model.uk_space.type = "namespaces";
model.uk_space.id = 'namespaces~' + model.uk_space.namespace;
