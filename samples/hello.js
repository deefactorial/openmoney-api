var http = require('http');
var port = 7070;
var address = '127.0.0.1';
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(7070, '127.0.0.1');
console.log('Server running at http://' + address + ':' + port + '/');

