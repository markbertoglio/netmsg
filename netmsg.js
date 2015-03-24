var util = require('util');
var EventEmitter = require('events').EventEmitter;
var net = require('net');

var server = function(port) {
  var self = this;
  var connections = {};

  var netServer = net.createServer(function(sock) {
    var connAddr = sock.address();
    connections[connAddr] = {sock: sock, addr: connAddr, data: ''};
    sock.setEncoding('utf8');
   
    self.emit('connectionOpened', connAddr);

    sock.on('data', function(data) {
      var msgs = processRxData(connections[connAddr], data);
      (msgs || []).forEach(function(msg) {
        self.emit('newMessage', connAddr, msg);
      });
    });

    sock.on('end', function() {
      connections[connAddr] = null;
      self.emit('connectionClosed', connAddr);
    });
  });

  netServer.listen(port, function() { //'listening' listener
  });  

  function close() {
    netServer.close(function() {
      self.emit('closed');
    });
  }
}

function processRxData(connection, data) {
  if (!connection) return;
  connection.data += data;
  var newMsgs = [];
  while (true) {
    var eol = '\r\n';
    if (connection.data.indexOf(eol) < 0) {
      eol = '\n';
      if (connection.data.indexOf(eol) < 0) {
        // no full command string yet
        break;
      }
    }
    var parts = connection.data.split(eol);
    if (parts.length < 1) return;
    newMsgStr = parts[0];
    newMsg = {};
    newMsgStr.split(',').forEach(function(msgParam) {
      var paramParts = msgParam.split(':');
      newMsg[paramParts[0]] = paramParts[1];
    });
    newMsgs.push(newMsg);
    parts.shift();
    connection.data = parts.join(eol);
  }
  return newMsgs;
}

util.inherits(server, EventEmitter);
//util.inherits(client, EventEmitter);

module.exports = {
//  client: client,
  server: server
};


