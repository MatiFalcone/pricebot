const TelegramBot = require("node-telegram-bot-api");
const getTokenInfo = require("./token_info");
const getTokenPriceIn = require("./token_price");
const getTokenLiquidityAt = require("./token_liquidity");
//const getBlockNumber = require("./blocks");
const getTokenTotalSupply = require("./token_total_supply");
const getTokenCirculatingSupply = require("./token_circulating_supply");
const getMaticPrice = require("./matic_price");


// Redis Instance
const Redis = require("ioredis");
let redis;
// Redis instance
if(process.env.NODE_ENV !== "production") {
  redis = new Redis({
    "port":6379,
    "host":"localhost"
  })
} else {
  redis = new Redis(process.env.REDIS_URL);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, {polling: true});

// User favorite tokens
const tokens = [];

bot.onText(/\/start/, async (msg) => {

    console.log(msg);
    bot.sendMessage(msg.chat.id, `Hi ${msg.from.first_name}! 😀\n\nWelcome to the Acura Network Price Bot 🔥\n\nDo you wanna know the commands❓\n\nType /help to see how they work!`);    

});

bot.onText(/\/help/, async (msg) => {

    bot.sendMessage(msg.chat.id, `I understand the following commands: \n\n`);

});

/* Set the address of the token and the name
 - Example: "/set_token 0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4 Solana"
 - In the above command, the user sets "Solana" as name for "0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4" token address 
 - If the user specifies no name for the token, the default name will be the token ticker ("SOL" in this example)
*/
bot.onText(/\/set_token/, async (msg) => {

    // Parse text from the user
    let pieces = msg.text.split(" ");
    let tokenAddress = pieces[1];
    let tokenName = pieces[2];

    console.log("address: ", tokenAddress);
    console.log("name: ", tokenName);

    if(tokenAddress === undefined) {
        bot.sendMessage(msg.chat.id, "Please, specify the address of the token you want to add. You can also add a name after the address (optional).");
        return;
    }

    // Get the information of the token
    const tokenInfo = await getTokenInfo(tokenAddress, "QuickSwap");

    //console.log(tokenInfo.data.ethereum);
    //console.log("query name: ", tokenInfo.data.ethereum.dexTrades[0].baseCurrency.name);
    // Check for errors
    if(tokenInfo.errors === undefined) {
        // If no token name specified by the user, we get the ticker from the contract
        if(tokenName === undefined) {
            tokenName = tokenInfo.data.ethereum.dexTrades[0].baseCurrency.symbol;
        }
        // Get the quantity of tokens already registered
        let quantity = tokens.length;

        // Search the list to see if the token address is already registered
        let object = tokens.find(e => e.tokenAddress === tokenAddress);

        if(object === undefined) {
            let newToken = {
                id: quantity+1,
                tokenName,
                tokenAddress
            }

            tokens.push(newToken);
            // send back the matched "whatever" to the chat
            bot.sendMessage(msg.chat.id, `The token ${tokenName} has been successfully added to your list of favorite tokens.`); 
        } else {
            bot.sendMessage(msg.chat.id, `The token address ${tokenAddress} is already listed as a favorite token.`);
        }
    } else {
        bot.sendMessage(msg.chat.id, "Please, specify a correct address for the token in Polygon (MATIC) network.");
        return;
    }
     
});

// Checks the list of registered tokens
bot.onText(/\/tokens/, (msg) => {
  
    // send back the matched "whatever" to the chat
    bot.sendMessage(msg.chat.id, `This is the list of favorite tokens: ${JSON.stringify(tokens)}`);
  
});

// Deletes the token with the address specified.
bot.onText(/\/del_token/, (msg) => {
  
    // Parse text from the user
    let pieces = msg.text.split(" ");
    let tokenAddress = pieces[1];

    let filtered = tokens.filter(function(elem) { return elem.tokenAddress != tokenAddress; })
    console.log("filtrado: ", filtered);
    tokens.splice(0, tokens.length, ...filtered);
    
    // Renumber the tokens list
    
    bot.sendMessage(msg.chat.id, `This is the new list of favorite tokens: ${JSON.stringify(tokens)}`);
  
});

/* Get the following information of the token
 - Token Symbol
 - Token Price in USD
 - MATIC Price in USD
 - MATIC Price in BTC
 - Token/MATIC Rate
 - Token Total Supply
 - Token Circulating Supply
 - Token Market Cap (USD Price * Circulating Supply)
*/
bot.onText(/\/price/, async (msg) => {

    let pieces = msg.text.split(" ");
    let tokenName = pieces[1];
    let USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

    // Data to retrieve
    let tokenSymbol;
    let tokenPriceUSDC;
    let MATICPriceUSD;
    let MATICPriceBTC;
    let MATICRate;
    let totalSupply;
    let circulatingSupply;
    let marketCap;

    if(tokens.length == 0) {
        bot.sendMessage(msg.chat.id, "The list of tokens is empty. Add the first one by typing /set_token followed by a token address.");
        return;
    }

    if(tokenName === undefined) {
        bot.sendMessage(msg.chat.id, "You need to specify a token name after price. Type /tokens if you want to see the list of available tokens.");
        return;
    }

    // Search for the token address in the "favorite tokens" array
    let object = tokens.find(e => e.tokenName === tokenName);

    if(object === undefined) {
        bot.sendMessage(msg.chat.id, `No token registered by the name of ${tokenName}. Add it by typing /set_token followed by the token address or type /tokens to see the list of available tokens.`);
        return;
    } else {
        // Get the token price and the MATIC Price
        const tokenPrice = await getTokenPriceIn(object.tokenAddress, USDC);
        const maticPrice = await getMaticPrice();
        //const tokenChart = await getTokenChart();
        //console.log("MATIC/USD: ", maticPrice.result.maticusd);
        //console.log("MATIC/BTC: ", maticPrice.result.maticbtc);

        if(tokenPrice.data.ethereum.dexTrades.length == 1) {
            
            // Get MATIC block number
            //let timestamp = Math.floor(Date.now() / 1000);
            //const blockData = await getBlockNumber(timestamp);          
            //let blockNumber = tokenPrice.data.ethereum.dexTrades[0].block.height;
            //console.log("block number: ", blockNumber);
            //const tokenLiquidity = await getTokenLiquidityAt(blockNumber, object.tokenAddress);
            const tokenTotalSupply = await getTokenTotalSupply(object.tokenAddress);
            totalSupply = (parseInt(tokenTotalSupply.result, 10) / 1000000000000000000).toLocaleString();
            const tokenCirculatingSupply = await getTokenCirculatingSupply(object.tokenAddress);
            circulatingSupply = parseInt(tokenCirculatingSupply.result, 10) / 1000000000000000000;
            editedCirculatingSupply = (parseInt(tokenCirculatingSupply.result, 10) / 1000000000000000000).toLocaleString();
            //totalLiquidity = parseInt(tokenLiquidity.data.tokens[0].totalLiquidity, 10) * parseInt(tokenPrice.data.ethereum.dexTrades[0].quotePrice, 10);            console.log("liquidity: ", totalLiquidity);

            // Show data
            tokenSymbol = tokenPrice.data.ethereum.dexTrades[0].baseCurrency.symbol
            tokenPriceUSDC = tokenPrice.data.ethereum.dexTrades[0].quotePrice.toFixed(2);
            MATICPriceUSD = maticPrice.result.maticusd;
            MATICPriceBTC = maticPrice.result.maticbtc;
            MATICRate = (MATICPriceUSD / tokenPriceUSDC).toFixed(2);
            marketCap = (circulatingSupply * tokenPriceUSDC).toLocaleString();

            //console.log("tokenSymbol: ", tokenSymbol);
            //console.log("tokenPriceUSDC: ", tokenPriceUSDC);
            //console.log("MATICPrice: ", MATICPriceUSD);
            //console.log("MATICRate: ", MATICRate);

            bot.sendPhoto(msg.chat.id, "https://www.tradingview.com/x/zWnsQz2y/", {caption: `Symbol: *${tokenSymbol}*\n${tokenSymbol} Price: *$${tokenPriceUSDC}*\nMATIC Price: *$${MATICPriceUSD}*\nMATIC Price (BTC): *${MATICPriceBTC}*\n${tokenSymbol}/MATIC: *${MATICRate}*\n${tokenSymbol} Total Supply: *${totalSupply}*\n${tokenSymbol} Circulating Supply: *${editedCirculatingSupply}*\n${tokenSymbol} Market Cap: *$${marketCap}*\n\n_Powered by_ [Acura Network](http://acuranetwork.io/)`, parse_mode: "Markdown"});

        } else {
            bot.sendMessage(msg.chat.id, `The price of ${tokenName} couldn't be retrieve.`);
            return;
        }

    }
  
});

module.exports = bot;