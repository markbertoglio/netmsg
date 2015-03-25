var expect = require('expect.js')
var netmsg = require('../netmsg');

describe('netmsg', function () {
  it('should run', basic);
});

function basic(done) {
  var server = new netmsg.server(8080);
  var connection;
  
  server.on('accepting', function() {
    var client = new netmsg.client({port: 8080}); 
 
   client.on('connected', function() {
      console.log("connected");
      client.send("test:one,two:three\nanother:one\n");
    });

    client.on('closed', function(err) {
      console.log("closed", err);
    });

    client.on('sendCompleted', function(err, result) {
      console.log("Send completed", err, result);
    });
  });

  server.on('connectionOpened', function(conn) {
    connection = conn;
  });

  server.on('connectionClosed', function(conn) {
  });

  server.on('newMessage', function(conn, msg) {
    console.log("NEW MSG", conn, msg);
  });
}
