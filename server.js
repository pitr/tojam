var http  = require('http');
var sys   = require('sys');
var fs    = require('fs');

// Connected clients of type {url1: [client1, client2], url2: [client1, client5]}
var clients = {};

var log = fs.createWriteStream('log');

http.createServer(function (request, response){

  request.on('data', function(chunk){
    log.write('Got data on '+request.url+', pushing to clients!');
    for (client in clients[request.url]) {
      clients[request.url][client].write(chunk);
    }
  });

  // request.on('end', function(){
  //   for (client in clients[request.url]) {
  //     if (clients[request.url][client] == response) {
  //       delete clients[request.url][client];
  //     }
  //   }
  //   if (clients[request.url].length = 0) {
  //     delete clients[request.url];
  //   }
  //   console.log('Somebody disconnected, result: ' + sys.inspect(clients))
  // });

  // Add the response to the clients array to receive streaming
  if (clients[request.url] == undefined) {
    log.write('#1 Client connected to '+ request.url +'; streaming');
    clients[request.url] = [response];
  } else {
    log.write('#'+(clients[request.url].length+1)+' Client connected to '+ request.url +'; streaming');
    log.write('Result: ' + sys.inspect(clients))
    clients[request.url].push(response);
  }
  response.writeHead(200,{
    "Content-Type": "audio/mpeg",
    // "Content-Type": "html/text",
    'Transfer-Encoding': 'chunked'
  });

}).listen(80);
