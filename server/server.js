// Requires
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const https = require("https");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
//const server = http.createServer(app);
const mongoose = require("mongoose");

const server = https.createServer({
  key: fs.readFileSync("./cert/key.pem", "utf8"),
  cert: fs.readFileSync("./cert/server.crt", "utf8")
} , app);

const verifyToken = require("../middlewares/authentication");
const bot = require("./query/pricebot");
const bodyParser = require("body-parser");

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

console.log("Database ONLINE.");

});

// Process ID
console.log(process.pid);

const io = new Server(server);

// All active connections go in this object
const clients = {};

/////////////////////////////
// INICIO MANEJO DE SOCKETS//
/////////////////////////////

// CONNECTION
io.on("connection", (client) => {

  const userID = getUniqueID();
  
  console.log((new Date()) + ": Received a new connection from origin " + client.id + ".");
  // You can rewrite this part of the code to accept only the requests from allowed origin
  //const connection = io.accept(null, socket.origin);
  clients[userID] = client;
  console.log("Connected: " + userID + " in " + Object.getOwnPropertyNames(clients))

  // Send initial message to client


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

////////////////////////////
// INICIO API REST TOKENS //
////////////////////////////
const getTokenInfo = require("./query/token_info");
const getLastTrades = require("./query/token_last_trades");
const getCandleData = require("./query/ohlc");
const getPairData = require("./query/pair_mint_burn_swap");
const getPairInfoAt = require("./query/pair_info");
const getBlockNumber = require("./query/blocks");

// Retrieves the information of the token address specified in :token using WMATIC as quote currency
app.get("/tokenInfo", async (req, res) => {

  let tokenAddress = req.query.token;
  let exchangeAddress = req.query.exchange;

  const tokenInfo = await getTokenInfo(tokenAddress, exchangeAddress);

  res.json({
    ok: true,
    tokenInfo
  });

});

// Retrieves the last 5 QuickSwap trades of the token address specified in :token
app.get("/lastTrades", async (req, res) => {

  let tokenAddress = req.query.token;
  let exchangeAddress = req.query.exchange;

  const tokenLastTrades = await getLastTrades(tokenAddress, exchangeAddress);

  res.json({
    ok: true,
    tokenLastTrades
  });

});

// Retrieves OHLC data 
app.get("/ohlc", async (req, res) => {

  let base = req.query.baseToken;
  let quote = req.query.quoteCurrency;
  let since = req.query.since;
  let until = req.query.until;
  let window = req.query.window;
  let limit = req.query.limit;

  const dataOHLC = await getCandleData(base, quote, since, until, window, limit);

  res.json({
    ok: true,
    dataOHLC
  });

});

// Retrieves the information of a Pair
app.get("/pairData", async (req, res) => {

  let pairAddress = req.query.pair;

  const pairData = await getPairData(pairAddress);

  res.json({
    ok: true,
    pairData
  });

});

// Retrieves the block number at the last height of the MATIC network 
app.get("/pairInfo", async (req, res) => {

  let pairAddress = req.query.pair;

  let timestamp = Math.floor(Date.now() / 1000);

  const blockData = await getBlockNumber(timestamp);

  let blockNumber = parseInt(blockData.data.blocks[0].number);

  const pairInfo = await getPairInfoAt(blockNumber, pairAddress);

  res.json({
    ok: true,
    pairInfo
  });

});

// PRICEBOT MANAGEMENT
const addBot = require("./functions/bot");

app.use(express.json());
const rthw = `/bot${process.env.TELEGRAM_API_KEY}`;

app.post(rthw, (req, res) => {
  
  console.log(req.body);

  // Parse text from the user
  let pieces = req.body.message.text.split(" ");
  let command = pieces[0];

  // If it's a private conversation, I tell the user to register the bot
  if(req.body.message.chat.type === "private") {
    // Capture the "/register" command to provide more information
    if(command === "/register") {
      bot.sendMessage(req.body.message.chat.id, `Please, add me to your group and use this same command there. Keep in mind you need to have Admin rights.`);
      res.sendStatus(200);
    } else {
      bot.sendMessage(req.body.message.chat.id, `Please, register your bot.`);
      res.sendStatus(200);
    }
  } else {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  }
})

app.post("/registerBot", async (req, res) => {
  
  // Here I receive all the parameters from the generated bot on the front-end
  let body = req.body;

  let apiKey = req.apiKey;
  let chart = req.chart;
  let chartType = req.chartType; // "Candlestick" | "Line"
  let tokenSymbol = req.symbol;
  let tokenPrice = req.price;
  let tokensPerMatic = req.tokenMatic;
  let circulatingSupply = req.circulatingSupply;
  let totalSupply = req.totalSupply;
  let marketCap = req.marketCap;
  let liquidity = req.liquidity;
  let lpValue = req.lpValue;
  let dailyChange = req.dailyChange;
  let dailyVolume = req.dailyVolume;
  let totalValueLocked = req.tvl;
  let holders = req.holders;

  let botAdded = await addBot(apiKey, chart, chartType, tokenSymbol, tokenPrice, tokensPerMatic,
    circulatingSupply, totalSupply, marketCap, liquidity, lpValue, dailyChange, dailyVolume,
    totalValueLocked, holders);

  if(botAdded === true) {

  } else {

  }
  
  /*
  Options for the BOT (Free)
- Price Chart: Candlestick | Line
- Symbol
- Token Price
- Tokens/Matic
- Circulating Supply
- Total Supply
- Market Cap
- Liquidity
- LP Value

Options for the BOT (Staking $50 Acura)
- 24Hr Change
- 24Hr Volume
- Total Value Locked
- Total Holders
*/

  if(req.body.message.chat.type === "private") {
    bot.sendMessage(req.body.message.chat.id, `Please, register your bot.`);
    res.sendStatus(200);
  } else {
    bot.processUpdate(req.body);
    console.log(req.body);
    res.sendStatus(200);
  }

})


// LISTEN
server.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`);

});