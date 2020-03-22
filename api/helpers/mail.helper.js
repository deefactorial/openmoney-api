// create reusable transporter object using the default SMTP transport
require('dotenv').config();

const nodemailer = require('nodemailer');
const smtpConfig = process.env.SMTP_CONFIG;
let transporter;
if (smtpConfig)
  transporter = nodemailer.createTransport(smtpConfig);

exports.sendmail = function(to, cc, bcc, subject, messageHTML, callback){

  var messageText = messageHTML.replace(/<\/?[^>]+(>|$)/g, "");

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: process.env.SENDER_ADDRESS, // sender address
      subject: subject, // Subject line
      text: messageText, // plaintext body
      html: messageHTML // html body
  };
  if(to != null){
    mailOptions.to = to;
  }
  if(cc != null){
    mailOptions.cc = cc;
  }
  if(bcc != null){
    mailOptions.bcc = bcc;
  }

  if(typeof smtpConfig == 'undefined' || smtpConfig == ''){
    console.info('smtpConfig is undefined, ignoring sending emails...');
    callback(null, {ok:true});
  } else {

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        callback(error, info);
        // if(error){
        //     return console.log(error);
        // }
        // console.log('Message sent: ' + info.response);
    });
  }
}