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
function sendMail($senderName, $sender, $to, $subject, $content, cb) {
    var debug = false;
    var $toHostname = $to.substr($to.indexOf('@') + 1);
    dns.resolveMx($toHostname, function (e, addrs) {
        var addr = addrs[0] && addrs[0].exchange;
        if (!addr) return cb('无法找到目标邮箱主机');

        //建立连接
        var socket = net.connect(25, addr);
        socket.setEncoding('utf8');
        socket.on('error', cb).setTimeout(10000, function () {
            cb('超时');
            socket.destroy();
        });

        var list = new ExecList();
        list.pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 220) {
                    next(p);
                } else {
                    var $senderHost = $sender.substr($sender.indexOf('@') + 1);
                    socket.write("HELO " + $senderHost + "\r\n");
                    next();
                }
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 250) {
                    next(p);
                } else {
                    socket.write("MAIL FROM: <" + $sender + ">\r\n");
                    next();
                }
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 250) {
                    next(p);
                } else {
                    socket.write("RCPT TO: <" + $to + ">\r\n");
                    next();
                }
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 250) {
                    next(p);
                } else {
                    socket.write("DATA\r\n");
                    next();
                }
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 354) {
                    next(p);
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
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) == 550) {
                    next("邮件被拦截:" + p);
                } else if (parseInt(p) != 250) {
                    next(p);
                } else {
                    socket.write("QUIT\r\n");
                    next();
                }
            }
        ).pending(
            function foo(p, next) {
                debug && console.log(p);
                if (parseInt(p) != 221) {
                    next(p);
                } else {
                    socket.end();
                    cb(null)
                }
            }
        ).catch(function (e) {
            socket.end();
            cb(e);
        });

        var rl = readline.createInterface({input: socket});
        rl.on('line', function (line) {
            list.exec(line);
        });
    })
}


module.exports = sendMail;