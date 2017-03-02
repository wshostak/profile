const util = require('util');
const express = require('express');
const app = express();
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const config = require('./config');

aws.config.loadFromPath('aws_config.json');
  
const ses = new aws.SES({apiVersion: '2010-12-01'});

app.listen(3000, function() {

  console.log('listening on 3000');
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname + '/'));

app.post('/contactme', function (req, res) {

  // this sends the email
  ses.sendEmail( { 
    Source: config.email, 
    Destination: {
      ToAddresses: [config.email]
    },
    Message: {
      Subject: {
        Data: config.subject
      },
      Body: {
        Text: {
         Data: util.format(config.body, req.body.name, req.body.email, req.body.phone, req.body.message),
        }
      }
    }
  }, function(err, data) {
    if(err) throw err
  });

  res.send('Message sent')
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});