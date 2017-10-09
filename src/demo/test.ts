import { sendMail } from '../sendMail';

const content = '\
<table style="width:100%;height:100%;">\
    <tr><td style="text-align: center;">\
    <div style="display: inline-block; padding:30px; color:red; ">\
    <img src="https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png"/>\
    <h1>helloworld，这是一封测试邮件,' + new Date() + '</h1>\
    <a style="text-decoration: none; color: #ffffff" href="http://serverjs.cn" target="_blank">\
    <div style="font-family:\'微软雅黑\';font-size: 18px; text-decoration: none; white-space: nowrap; color: #ffffff; padding-bottom: 10px; text-align: center; padding-top: 10px; padding-left: 25px; margin: 0px; padding-right: 25px; background-color: #cc0001; border-radius: 3px">马上激活 </div>\
    </a>\
    </div>\
    </td></tr>\
</table>\
';

// 收不到邮件是因为被邮箱拦截了
// 只测试了163和QQ邮箱，测试时请反下面的邮箱地址换成你自己的
// to = "15679700245@163.com";
const to = '243786753@qq.com';

const senderName = '这是发件人';
const sender = 'admin@zengming.me';
const subject = '这是邮件标题';

// tslint:disable:no-console
sendMail(senderName, sender, to, subject, content, function (err) {
  if (err) {
    return console.log(err);
  }
  console.log('发送成功');
});



