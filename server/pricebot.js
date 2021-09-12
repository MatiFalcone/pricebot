const TelegramBot = require("node-telegram-bot-api");
const getTokenInfo = require("./query/token_info");
const getTokenPriceIn = require("./query/token_price");
//const getTokenLiquidityAt = require("./token_liquidity");
const getTokenTotalSupply = require("./query/token_total_supply");
const getTokenCirculatingSupply = require("./query/token_circulating_supply");
const getMaticPrice = require("./query/matic_price");
const { getBotConfig, registerBot, getBotConfigAndUpdateTokenAddress } = require("../functions/bot")

const url = process.env.URL_PUBLIC_FROM_NGROK;

const options = {
    webHook: {
        port: 8443
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
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){
           /* Here I need to go to MongoDB and check if there is an entry already generated for that
           API Key. If that is the case, then I have to update the entry with the chatID received.
           Then, everytime I receive a command, I can retrieve the config of that specific bot
           using the chatID. 
           If I don't find an entry with that API Key, then I say the API Key is not valid.
           */
           let chatId = msg.chat.id;
           let groupMembers = await bot.getChatMemberCount(msg.chat.id);
           let groupType;
           if(msg.chat.type === "group") {
               groupType = "Private"
           } else {
               groupType = "Public"
           }

           let registeredBot = await registerBot(registrationKey, chatId, groupMembers, groupType);
        
           if(registeredBot.ok === false) {
               bot.sendMessage(msg.chat.id, `Invalid registration key!`); 
           } else {
               bot.sendMessage(msg.chat.id, `Your bot has been successfully registered!`);
           }
        } else {
           bot.sendMessage(msg.chat.id, "You need to be an Admin to register this bot.");
        }
    });

});

bot.onText(/\/info/, async (msg) => {

    bot.sendMessage(msg.chat.id, `*Available Bot Commands* 

    ---ADMIN---   
   /register {botID}: Register a bot to a group given an ID.
   /unregister: Unregister and delete a bot from the group.
   /setToken {tokenContractAddress}: Update the contract address of your token.
   /updatePriceMessage {messageText}: Update price message.
   /disablePriceChart {true/false} Disable chart image on the price command.
   /setChartType {candlestick/line}: Set chart type to candlestick or line.
   
    ---USER DEFAULT--- 
   /price: Get price information about the registered token.
   /contract: Get the token contract address and link to Polygonscan.
   /chart: Get a chart of the token's price in USD.
   /info: Get list of available commands.`, {parse_mode: "Markdown"});

});

/* Set the address of the token and the name
 - Example: "/set_token 0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4 Solana"
 - In the above command, the user sets "Solana" as name for "0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4" token address 
 - If the user specifies no name for the token, the default name will be the token ticker ("SOL" in this example)
*/
bot.onText(/\/setToken/, async (msg) => {

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

        let response = await getBotConfigAndUpdateTokenAddress(msg.chat.id, tokenAddress);         
        
        if(!response) {
            bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
            return;
        }

        // send back the matched "whatever" to the chat
        bot.sendMessage(msg.chat.id, `The address "${tokenAddress}" has been successfully updated as your registered token address.`); 
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

    if(!botConfig) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

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

    if(botConfig.tokenAddress === "") {
        bot.sendMessage(msg.chat.id, "There is no token address registered. Add a token with the /set_token command followed by your token address.");
        return;
    } else {
        // Get the token price and the MATIC Price
        const tokenPrice = await getTokenPriceIn(botConfig.tokenAddress, USDC);
        const maticPrice = await getMaticPrice();

        if(tokenPrice.data.ethereum.dexTrades.length == 1) {
            
            //const tokenLiquidity = await getTokenLiquidityAt(blockNumber, botConfig.tokenAddress);
            const tokenTotalSupply = await getTokenTotalSupply(botConfig.tokenAddress);
            totalSupply = (parseInt(tokenTotalSupply.result, 10) / 1000000000000000000).toLocaleString();
            const tokenCirculatingSupply = await getTokenCirculatingSupply(botConfig.tokenAddress);
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

            bot.sendPhoto(msg.chat.id, "https://www.tradingview.com/x/zWnsQz2y/", {caption: `Symbol: ${tokenSymbol}\n${tokenSymbol} Price: $${tokenPriceUSDC}\nMATIC Price: $${MATICPriceUSD}\nMATIC Price (BTC): ${MATICPriceBTC}\n${tokenSymbol}/MATIC: ${MATICRate}\n${tokenSymbol} Total Supply: ${totalSupply}\n${tokenSymbol} Circulating Supply: ${editedCirculatingSupply}\n${tokenSymbol} Market Cap: $${marketCap}\n\n_Powered by_ [Acura Network](http://acuranetwork.io/)`, parse_mode: "Markdown"});

        } else {
            bot.sendMessage(msg.chat.id, `The price of ${tokenName} couldn't be retrieve.`);
            return;
        }

    }
  
});

bot.onText(/\/contract/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    bot.sendMessage(msg.chat.id, `The token address is: ${response.botConfig.tokenAddress}\n`, {
        reply_markup: {
            inline_keyboard: [[{
                text: 'View on Polygonscan',
                url: `https://polygonscan.com/address/${response.botConfig.tokenAddress}`
            }]]
        }
    });

});

module.exports = bot;