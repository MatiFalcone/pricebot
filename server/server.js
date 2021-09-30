// Requires
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
const mongoose = require("mongoose");
const uuidv4 = require("uuid/v4");
const path = require("path");
const { Server } = require("socket.io");
const { getBotConfigAndUpdate } = require("../functions/bot")

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

module.exports.io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
require("../functions/sockets");

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
const url = process.env.URLDB;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (error, respuesta) => {

if (error) throw error;

console.log("Database ONLINE");

});

// Serve static content
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile("index.html");
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
const { addBot, editBot, getBotStats } = require("../functions/bot");

app.use(express.json());
const rthw = `/bot${process.env.TELEGRAM_API_KEY}`;

app.post(rthw, async (req, res) => {
  
  let body = req.body;

  if (body.hasOwnProperty("message")) {

    if (body.message.hasOwnProperty("new_chat_members")) {
      // Sumar uno al grupo
      let groupMembers = await bot.getChatMemberCount(body.message.chat.id);
      // Get bot configuration
      let update = { groupMembers: groupMembers };
      await getBotConfigAndUpdate(body.message.chat.id, update);

    }

    if (body.message.hasOwnProperty("left_chat_member")) {
      // Restar uno al grupo
      let groupMembers = await bot.getChatMemberCount(body.message.chat.id);
      // Get bot configuration
      let update = { groupMembers: groupMembers };
      await getBotConfigAndUpdate(body.message.chat.id, update);
    }

    if(body.message.hasOwnProperty("text")) {
      let pieces = body.message.text.split(" ");
      let command = pieces[0];
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
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(200);
  }

});

//app.post("/addBot", verifyToken, async (req, res) => {
app.post("/addBot", async (req, res) => {
  
  // Here I receive all the parameters from the generated bot on the front-end
  let body = req.body;

  let chart = body.chart;
  let chartType = body.chartType; // "Candlestick" | "Line"
  let network = body.network;
  let swap = body.swap;
  let message = body.message;
  let tokenAddress = body.tokenAddress;
  let tokenSymbol = body.symbol;
  let tokenPrice = body.price;
  let tokensPerNative = body.tokenNative;
  let circulatingSupply = body.circulatingSupply;
  let totalSupply = body.totalSupply;
  let marketCap = body.marketCap;
  let liquidity = body.liquidity;
  let dailyChange = body.dailyChange;
  let dailyVolume = body.dailyVolume;
  let totalValueLocked = body.tvl;

  // Generate API Key
  let apiKey = uuidv4();

  const botAdded = await addBot(apiKey, chart, chartType, network, swap, message, tokenAddress, tokenSymbol, tokenPrice, tokensPerNative,
    circulatingSupply, totalSupply, marketCap, liquidity, dailyChange, dailyVolume,
    totalValueLocked);

  if(botAdded) {
    return res.status(200).json({botID: apiKey});
  } else {
    res.sendStatus(400);
  }

});

//app.post("/editBot", verifyToken, async (req, res) => {
app.post("/editBot", async (req, res) => {
  
  // Here I receive all the parameters from the generated bot on the front-end
  let body = req.body;
    
  let chatId = body.chatId;
  let chart = body.chart;
  let chartType = body.chartType; // "Candlestick" | "Line"
  let tokenAddress = body.tokenAddress;
  let tokenSymbol = body.symbol;
  let tokenPrice = body.price;
  let tokensPerNative = body.tokenNative;
  let circulatingSupply = body.circulatingSupply;
  let totalSupply = body.totalSupply;
  let marketCap = body.marketCap;
  let liquidity = body.liquidity;
  let dailyChange = body.dailyChange;
  let dailyVolume = body.dailyVolume;
  let totalValueLocked = body.tvl;
  let active = body.active;
  
  const botEdited = await editBot(chatId, chart, chartType, tokenAddress, tokenSymbol, tokenPrice, tokensPerNative,
    circulatingSupply, totalSupply, marketCap, liquidity, dailyChange, dailyVolume,
    totalValueLocked, active);
  
  console.log(botEdited);
  
  if(botEdited) {
    return res.status(200).json({botUpdated: chatId});
  } else {
    res.sendStatus(400);
  }
  
});

//app.post("/editBot", verifyToken, async (req, res) => {
app.get("/botStats", async (req, res) => {
   
  const botStats = await getBotStats();
  
  if(botStats.ok === true) {
    return res.status(200).json({botStats: botStats});
  } else {
    res.sendStatus(400);
  }
  
});

// LISTEN
server.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`);

});