// Requires
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
const mongoose = require("mongoose");
const uuidv4 = require("uuid/v4");

let server;
if(process.env.NODE_ENV !== "production") {
  const https = require("https");
  server = https.createServer({
    key: fs.readFileSync("./cert/key.pem", "utf8"),
    cert: fs.readFileSync("./cert/server.crt", "utf8")
  } , app);
} else {
  const http = require("http");
  server = http.createServer(app);
}

//const verifyToken = require("../middlewares/authentication");
const bot = require("./pricebot");

app.use(express.urlencoded({
  extended: true
}));

//app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "*"
}));

// Connect to MongoDB
// Me conecto a la base de datos de MongoDB
mongoose.connect(process.env.URLDB, (error, respuesta) => {

if (error) throw error;

console.log("Database ONLINE");

}, { useNewUrlParser: true , useUnifiedTopology: true });

// Process ID
console.log(process.pid);

const io = new Server(server);

// All active connections go in this object
const clients = {};

// SOCKETS MANAGEMENT
io.on("connection", (client) => {

  const userID = getUniqueID();
  
  console.log((new Date()) + ": Received a new connection from origin " + client.id + ".");
  // You can rewrite this part of the code to accept only the requests from allowed origin
  //const connection = io.accept(null, socket.origin);
  clients[userID] = client;
  console.log("Connected: " + userID + " in " + Object.getOwnPropertyNames(clients))

  // DISCONNECTION
  client.on("disconnect", (reason) => {
    const disconnectedUser = userID;
    delete clients[userID];
    console.log("The client disconnected.");
  });

});

app.post("/auth", (req, res) => {

  let body = req.body;

  if(!bcrypt.compareSync(body.password, process.env.PASS)) { // PolyT00ls2021@#
    return res.status(400).json({
      ok: false,
      err: {
        message: "Incorrect authentication"
      } 
    });
  }

  let token = jwt.sign({
      user: "Correct Authentication"
  }, process.env.SEED, { expiresIn: process.env.TOKEN_EXPIRATION })

  res.json({
    ok: true,
    token
  });

})

// PRICEBOT MANAGEMENT
const { addBot } = require("../functions/bot");

app.use(express.json());
const rthw = `/bot${process.env.TELEGRAM_API_KEY}`;

app.post(rthw, (req, res) => {
  
  console.log(req.body);
  let body = req.body;

  if (body.hasOwnProperty("message")) {

    if(body.message.hasOwnProperty("text")) {
      let pieces = body.message.text.split(" ");
      let command = pieces[0];
    }
    // The update is a message
    // If it's a private conversation, I tell the user to register the bot
    if(body.message.chat.type === "private") {
      // Capture the "/register" command to provide more information
      if(command === "/register") {
        bot.sendMessage(body.message.chat.id, `Please, add me to your group and use this same command there. Keep in mind you need to have Admin rights.`);
        res.sendStatus(200);
      } else {
        bot.sendMessage(body.message.chat.id, `Please, register your bot.`);
        res.sendStatus(200);
      }
    } else {
      bot.processUpdate(body);
      res.sendStatus(200);
    }

  } else {
    console.log("update ignored");
    res.sendStatus(200);
  }

});

//app.post("/addBot", verifyToken, async (req, res) => {
app.post("/addBot", async (req, res) => {
  
  // Here I receive all the parameters from the generated bot on the front-end
  let body = req.body;

  let chart = body.chart;
  let chartType = body.chartType; // "Candlestick" | "Line"
  let tokenAddress = body.tokenAddress;
  let tokenSymbol = body.symbol;
  let tokenPrice = body.price;
  let tokensPerMatic = body.tokenMatic;
  let circulatingSupply = body.circulatingSupply;
  let totalSupply = body.totalSupply;
  let marketCap = body.marketCap;
  let liquidity = body.liquidity;
  let lpValue = body.lpValue;
  let dailyChange = body.dailyChange;
  let dailyVolume = body.dailyVolume;
  let totalValueLocked = body.tvl;
  let holders = body.holders;

  // Generate API Key
  let apiKey = uuidv4();

  const botAdded = await addBot(apiKey, chart, chartType, tokenAddress, tokenSymbol, tokenPrice, tokensPerMatic,
    circulatingSupply, totalSupply, marketCap, liquidity, lpValue, dailyChange, dailyVolume,
    totalValueLocked, holders);

  console.log(botAdded);

  if(botAdded) {
    res.sendStatus(200);
  } else {
    //console.log("Error adding the bot.");
    res.sendStatus(400);
  }

});

// LISTEN
server.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`);

});