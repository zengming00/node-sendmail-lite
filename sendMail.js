"use strict";

var dns = require('dns');
var net = require('net');
var readline = require('readline');

var ExecList = require('./ExecList');

function base64_encode(str) {
  return new Buffer(str).toString('base64');
}

/**
 * 发送utf8格式的html邮件
 * @param $senderName   发送者名字
 * @param $sender       发送者地址
 * @param $to           收件人地址
 * @param $subject      邮件标题
 * @param $content      邮件内容（只支持html）
 * @param cb  function(err) 成功则不带参数，失败带一个err参数
 */
function sendMail($senderName, $sender, $to, $subject, $content, callback) {
  var debug = false;
  var execList = new ExecList();
  var $toHostname = $to.substr($to.indexOf('@') + 1);

  dns.resolveMx($toHostname, function (e, addrs) {
    var addr = addrs[0] && addrs[0].exchange;
    if (!addr) {
      return callback(new Error('can not find MxRecord'));
    }

    //建立连接
    var socket = net.connect(25, addr);
    socket.setEncoding('utf8');
    socket.setTimeout(1000 * 10, function () {
      execList.terminated();
      socket.destroy();
      callback(new Error('timeout'));
    });
    socket.on('error', function (err) {
      execList.terminated();
      callback(err)
    });

    execList.pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 220) {
        next(new Error(line));
      } else {
        var $senderHost = $sender.substr($sender.indexOf('@') + 1);
        socket.write("HELO " + $senderHost + "\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 250) {
        next(new Error(line));
      } else {
        socket.write("MAIL FROM: <" + $sender + ">\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 250) {
        next(new Error(line));
      } else {
        socket.write("RCPT TO: <" + $to + ">\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 250) {
        next(new Error(line));
      } else {
        socket.write("DATA\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 354) {
        next(new Error(line));
      } else {
        socket.write("From: =?utf8?B?" + base64_encode($senderName) + "?= <" + $sender + ">\r\n");
        socket.write("To: " + $to + "\r\n");
        socket.write("Subject: =?utf8?B?" + base64_encode($subject) + "?=\r\n");
        socket.write("Date: " + new Date() + "\r\n");
        socket.write("MIME-Version: 1.0\r\n");
        socket.write("Content-Type: text/html; charset=\"utf8\"\r\n");
        socket.write("Content-Transfer-Encoding: base64\r\n");
        socket.write("X-Priority: 3\r\n");
        socket.write("X-Mailer: Node.js Mail Sender\r\n");
        socket.write("\r\n");
        socket.write(base64_encode($content));
        socket.write("\r\n.\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) == 550) {
        next(new Error("Mail is intercepted: " + line));
      } else if (parseInt(line) != 250) {
        next(new Error(line));
      } else {
        socket.write("QUIT\r\n");
        next();
      }
    }).pending(function (line, next) {
      debug && console.log(line);
      if (parseInt(line) != 221) {
        next(new Error(line));
      } else {
        socket.end();
        // 完成
        callback(null)
      }
    }).catch(function (err) {
      execList.terminated();
      socket.end();
      callback(err);
    });

    var rl = readline.createInterface({ input: socket });
    rl.on('line', function (line) {
      execList.exec(line);
    });
  })
}


module.exports = sendMail;