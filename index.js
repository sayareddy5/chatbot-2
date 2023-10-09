const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const _ = require('underscore');

const port = process.env.PORT || parseInt(process.argv.pop()) || 3002;

server.listen(port, function () {
  console.log("Server listening at port %d", port);
});

const ShwarmaOrder = require("./ShawarmaOrder");
const e = require('express');
const { exception } = require('console');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("www"));

let oSockets = {};
let oOrders = {};
app.post("/payment/:phone", (req, res) => {
  
  sFrom = req.params.phone;
  console.log("in payment .phone")
  const aReply = oOrders[sFrom].handleInput(req.body);
  const oSocket = oSockets[sFrom];
  for (let n = 0; n < aReply.length; n++) {
    if (oSocket) {
      const data = {
        message: aReply[n]
      };
      oSocket.emit('receive message', data);
    } else {
      throw new Exception("twilio code would go here");
    }
  }
  if (oOrders[sFrom].isDone()) {
    delete oOrders[sFrom];
    delete oSockets[sFrom];
  }
  res.end("ok");
});

app.get("/payment/:phone", (req, res) => {
  
  const sFrom = req.params.phone;
  if (!oOrders.hasOwnProperty(sFrom)) {
    res.end("order already complete");
  } else {
    
    // console.log("indose pament/number");
    const title = oOrders[sFrom].selectedItem;
    const price = oOrders[sFrom].totalPrice;
    // console.log("title and price", title, price)
    res.end(oOrders[sFrom].renderForm(title,price));
  }
});

app.post("/payment", (req, res) => {
  // console.log('inside payment');
  const sFrom = req.body.telephone;
  console.log("sfrokm",sFrom)
  console.log("in just payment")
  // console.log(req.params)
  oOrders[sFrom] = new ShwarmaOrder(sFrom);
  console.log(req.body)
  res.end(oOrders[sFrom].renderForm(req.body.title, req.body.price));
});

app.post("/sms", (req, res) => {
  let sFrom = req.body.From || req.body.from;
  let sUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.headers.host}${req.baseUrl}`;
  if (!oOrders.hasOwnProperty(sFrom)) {
    oOrders[sFrom] = new ShwarmaOrder(sFrom, sUrl);
  }
  if (oOrders[sFrom].isDone()) {
    delete oOrders[sFrom];
  }
  let sMessage = req.body.Body || req.body.body;
  // console.log("s message: ", sMessage)
  let aReply = oOrders[sFrom].handleInput(sMessage);
  res.setHeader('content-type', 'text/xml');
  let sResponse = "<Response>";
  for (let n = 0; n < aReply.length; n++) {
    sResponse += "<Message>";
    sResponse += aReply[n];
    sResponse += "</Message>";
  }
  res.end(sResponse + "</Response>");
});

io.on('connection', function (socket) {

  socket.on('receive message', function (data) {
    const sFrom = _.escape(data.from);
    oSockets[sFrom] = socket;
  });
});
