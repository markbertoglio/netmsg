var expect = require('expect.js')
var netmsg = require('../netmsg');

describe('netmsg', function () {
  it('should run', basic);
});

function basic(done) {
  var server = new netmsg.server(8080);
  done();
}
