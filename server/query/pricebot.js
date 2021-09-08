const TelegramBot = require("node-telegram-bot-api");
const getTokenInfo = require("./token_info");
const getTokenPriceIn = require("./token_price");
const getTokenLiquidityAt = require("./token_liquidity");
const getTokenTotalSupply = require("./token_total_supply");
const getTokenCirculatingSupply = require("./token_circulating_supply");
const getMaticPrice = require("./matic_price");

const url = process.env.URL_PUBLIC_FROM_NGROK;

const options = {
    webHook: {
        port: 443
    }
};
// Create a bot that uses 'webhook' to fetch new updates
const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, options);
bot.setWebHook(`${url}/bot${process.env.TELEGRAM_API_KEY}`);

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

Mandatory information for all bots
- Matic Price
- Acura Price | Powered by Acura Network

*/

// User favorite tokens
let registeredTokenAddress;

bot.onText(/\/start/, async (msg) => {

    console.log(msg);
    bot.sendMessage(msg.chat.id, `Hi ${msg.from.first_name}! 😀\n\nWelcome to the Acura Network Price Bot 🔥\n\nDo you wanna know the commands❓\n\nType /info to see how they work!`);    

});

// Register a bot to a group given an ID
bot.onText(/\/register/, async (msg) => {

    // Parse text from the user
    let pieces = msg.text.split(" ");
    let registrationKey = pieces[1];

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){
            /* Here I need to go to MongoDB and check if there is an entry already generated for that
            API Key. If that is the case, then I have to update the entry with the chatID received.
            Then, everytime I receive a command, I can retrieve the config of that specific bot
            using the chatID. 
            If I don't find an entry with that API Key, then I say the API Key is not valid.
            */
            //let registeredBot = await registerBot(registrationKey);
            bot.sendMessage(msg.chat.id, `Invalid registration key!`); 
            return;
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to register this bot.");
            return;
        }
    });

});

bot.onText(/\/info/, async (msg) => {

    bot.sendMessage(msg.chat.id, `Available Bot Commands 

    ---ADMIN---   
   /register: [botID] Register a bot to a group given an ID
   /unregister: Unregister and delete a bot from the group
   /updatepricemessage: [messageText] Update price message
   /setcommands: [commandsID] Create/Update custom commands
   /deletecommands: [command names comma seperated] Deletes custom commands
   /setslippage: [slippage %] Set slippage for price swap link
   /toggleratelimitresponse: [true or false] Enable rate limit response from users' commands
   /forcepricedecimals: [true or false] Force price message to always have 5 decimals
   /disablepricechart: [true or false] Disable chart image on the price command
   /setuserratelimit: [limit number (in seconds)] Set rate limit for users' commands
   /enableusercommands: [command names comma seperated] Enable default commands for users
   /disableusercommands: [command names comma seperated] Disable default commands for users
   /setcharttype: [line or candlestick] Set chart type to line or candlestick
   /editor: View editor for the price message and custom commands
   
    ---USER DEFAULT--- 
   /price: Get price information about the registered token
   /contract: Get the token contract address and link to BSCScan
   /chart: Get a chart of the tokens price in USD, cached for 2 minutes
   /info: List available bot commands
   
   ---USER CUSTOM---
   None Available`);

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

    if(tokenAddress === undefined) {
        bot.sendMessage(msg.chat.id, "Please, specify the address of the token you want to add.");
        return;
    }

    // Get the information of the token
    const tokenInfo = await getTokenInfo(tokenAddress, "QuickSwap");

    // Check for errors
    if(tokenInfo.errors === undefined) {

        registeredTokenAddress = tokenAddress;

        // send back the matched "whatever" to the chat
        bot.sendMessage(msg.chat.id, `The address "${tokenAddress}" has been successfully added as your registered token address.`); 
    } else {
        bot.sendMessage(msg.chat.id, "Please, specify a correct address for the token in Polygon (MATIC) network.");
        return;
    }
     
});

/* Get the following information of the token
- Price Chart: Candlestick | Line
- Symbol
- Token Price
- Tokens/Matic
- Circulating Supply
- Total Supply
- Market Cap
- Liquidity

Options for the BOT (Staking $50 Acura)
- 24Hr Change
- 24Hr Volume
- Total Value Locked
- Total Holders

Mandatory information for all bots
- Matic Price
- Acura Price | Powered by Acura Network
*/
bot.onText(/\/price/, async (msg) => {

    // Get bot configuration
    let botConfig = await getBotConfig(msg.chat.id);

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

    if(registeredTokenAddress === undefined) {
        bot.sendMessage(msg.chat.id, "There is no token address registered. Add a token with the /set_token command followed by your token address.");
        return;
    } else {
        // Get the token price and the MATIC Price
        const tokenPrice = await getTokenPriceIn(registeredTokenAddress, USDC);
        const maticPrice = await getMaticPrice();

        if(tokenPrice.data.ethereum.dexTrades.length == 1) {
            
            //const tokenLiquidity = await getTokenLiquidityAt(blockNumber, registeredTokenAddress);
            const tokenTotalSupply = await getTokenTotalSupply(registeredTokenAddress);
            totalSupply = (parseInt(tokenTotalSupply.result, 10) / 1000000000000000000).toLocaleString();
            const tokenCirculatingSupply = await getTokenCirculatingSupply(registeredTokenAddress);
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

            bot.sendPhoto(msg.chat.id, "https://www.tradingview.com/x/zWnsQz2y/", {caption: `Symbol: *${tokenSymbol}*\n${tokenSymbol} Price: *$${tokenPriceUSDC}*\nMATIC Price: *$${MATICPriceUSD}*\nMATIC Price (BTC): *${MATICPriceBTC}*\n${tokenSymbol}/MATIC: *${MATICRate}*\n${tokenSymbol} Total Supply: *${totalSupply}*\n${tokenSymbol} Circulating Supply: *${editedCirculatingSupply}*\n${tokenSymbol} Market Cap: *$${marketCap}*\n\n_Powered by_ [Acura Network](http://acuranetwork.io/)`, parse_mode: "Markdown"});

        } else {
            bot.sendMessage(msg.chat.id, `The price of ${tokenName} couldn't be retrieve.`);
            return;
        }

    }
  
});

bot.onText(/\/chart/, async (msg) => {

    bot.sendMessage(msg.chat.id, `I understand the following commands: \n\n`);

});

bot.onText(/\/contract/, async (msg) => {

    bot.sendMessage(msg.chat.id, `I understand the following commands: \n\n`);

});

module.exports = bot;