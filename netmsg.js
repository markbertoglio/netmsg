var util = require('util');
var EventEmitter = require('events').EventEmitter;
var net = require('net');


var server = function(port) {
  var self = this;
  self.connections = {};

  var netServer = net.createServer(onNewConnection);
  netServer.listen(port); 

  function onNewConnection(sock) {
    var connAddr = sock.address();
    self.connections[connAddr] = {sock: sock, rxData: ''};
    sock.setEncoding('utf8');
   
    self.emit('connectionOpened', connAddr);

    sock.on('data', function(data) {
      msgs = processRxData(self.connections[connAddr], data) || [];
      msgs.forEach(function(msg) {
        self.emit('newMessage', connAddr, msg);
      });
    });

    sock.on('end', function() {
      self.connections[connAddr] = null;
      self.emit('connectionClosed', connAddr);
    });
  }


  netServer.on('listening', function() {
    self.emit('accepting')
  });

  function close() {
    netServer.close(function() {
      self.emit('closed');
    });
  }

}

var client = function(options) {
  var self = this;
  var sock = net.connect(options);
  self.connection = {sock: sock, rxData: ''}
  sock.setEncoding('utf8');

  sock.on('connect', function() {
    self.emit('connected');
  });

  sock.on('end', function() {
    self.emit('closed');
  });

  sock.on('error', function(err) {
    self.emit('closed', err);
  });

  sock.on('data', function(data) {
    var msgs = processRxData(self.connection, data) || [];
    msgs.forEach(function(msg) {
      self.emit('newMessage', msg);
    });
  });
}

util.inherits(server, EventEmitter);
util.inherits(client, EventEmitter);


client.prototype.send = function(msg) {
  var self = this;
  self.connection.sock.write(msg, function(err, result) {
    self.emit('sendCompleted', err, result);
  });
}

server.prototype.send = function(connAddr, msg) {
  var self = this;
  var connection = self.connections[connAddr];
  if (!connection) return self.emit('connectionError', connAddr, "invalid connection");
  connection.sock.write(msg, function(err, result) {
    self.emit('sendCompleted', connAddr);
  });
}

function processRxData(connection, data) {
  if (!connection) return;
  connection.rxData += data;
  var newMsgs = [];
  while (true) {
    var eol = '\r\n';
    if (connection.rxData.indexOf(eol) < 0) {
      eol = '\n';
      if (connection.rxData.indexOf(eol) < 0) {
        // no full command string yet
        break;
      }
    }
    var parts = connection.rxData.split(eol);
    if (parts.length < 1) return;
    newMsgStr = parts[0];
    newMsg = {};
    newMsgStr.split(',').forEach(function(msgParam) {
      var paramParts = msgParam.split(':');
      newMsg[paramParts[0]] = paramParts[1];
    });
    newMsgs.push(newMsg);
    parts.shift();
    connection.rxData = parts.join(eol);
  }
  return newMsgs;
}


module.exports = {
  client: client,
  server: server
};

