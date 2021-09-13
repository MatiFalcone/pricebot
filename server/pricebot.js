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
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    } 

    // Get the MATIC Price
    let MATICPriceUSD;
    const maticPrice = await getMaticPrice();
    MATICPriceUSD = maticPrice.result.maticusd;   

    // Send answer depending on bot configuration
    var answer = "";
    if(response.botConfig.tokenSymbol || response.botConfig.tokenPrice || response.botConfig.tokensPerMatic || response.botConfig.liquidity) {
        
        let USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
        const tokenPrice = await getTokenPriceIn(response.botConfig.tokenAddress, USDC);

        if(tokenPrice.data.ethereum.dexTrades.length == 1) {

            var tokenSymbol;
            var tokenPriceUSDC;

            tokenSymbol = tokenPrice.data.ethereum.dexTrades[0].baseCurrency.symbol
            tokenPriceUSDC = tokenPrice.data.ethereum.dexTrades[0].quotePrice.toFixed(2);

        } else {
            bot.sendMessage(msg.chat.id, `The price couldn't be retrieved.`);
            return;
        }
    }

    if(response.botConfig.tokenSymbol) {
        answer = answer + `Symbol: ${tokenSymbol}\n`
    }

    if(response.botConfig.tokenPrice) {
        answer = answer + `${tokenSymbol} Price: $${tokenPriceUSDC}\n`
    }

    if(response.botConfig.tokensPerMatic) {
        let MATICRate;
        MATICRate = (MATICPriceUSD / tokenPriceUSDC).toFixed(6);
        answer = answer + `${tokenSymbol}/MATIC: ${MATICRate}\n`
    }

    if(response.botConfig.circulatingSupply || response.botConfig.marketCap) {
        var circulatingSupply;
        const tokenCirculatingSupply = await getTokenCirculatingSupply(response.botConfig.tokenAddress);
        circulatingSupply = parseInt(tokenCirculatingSupply.result, 10) / 1000000000000000000;
        editedCirculatingSupply = (parseInt(tokenCirculatingSupply.result, 10) / 1000000000000000000).toLocaleString();
        answer = answer + `Circulating Supply: ${editedCirculatingSupply}\n`
    }

    if(response.botConfig.totalSupply) {
        let totalSupply;
        const tokenTotalSupply = await getTokenTotalSupply(response.botConfig.tokenAddress);
        totalSupply = (parseInt(tokenTotalSupply.result, 10) / 1000000000000000000).toLocaleString();
        answer = answer + `Total Supply: ${totalSupply}\n`
    }

    if(response.botConfig.marketCap) {
        let marketCap;
        marketCap = (circulatingSupply * tokenPriceUSDC).toLocaleString();
        answer = answer + `Marketcap: $${marketCap}\n`
    }

    if(response.botConfig.liquidity) {
        let liquidity;
        //const tokenLiquidity = await getTokenLiquidityAt(blockNumber, response.botConfig.tokenAddress);
        //totalLiquidity = parseInt(tokenLiquidity.data.tokens[0].totalLiquidity, 10) * parseInt(tokenPrice.data.ethereum.dexTrades[0].quotePrice, 10);
        answer = answer + `Liquidity: $ \n`
    }

    answer = answer + `\nMatic: $${MATICPriceUSD}\nAcura: $ | _Powered by_ [Acura Network](http://acuranetwork.io/)`;

    if(response.botConfig.chart) {
        bot.sendPhoto(msg.chat.id, "https://www.tradingview.com/x/zWnsQz2y/", {caption: answer, parse_mode: "Markdown"});
    } else {
        bot.sendMessage(msg.chat.id, answer, {parse_mode: "Markdown"});
    }
  
});

bot.onText(/\/contract/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    bot.sendMessage(msg.chat.id, `The address of your token is: ${response.botConfig.tokenAddress}`, {
        reply_markup: {
            inline_keyboard: [[{
                text: 'View on Polygonscan',
                url: `https://polygonscan.com/address/${response.botConfig.tokenAddress}`
            }]]
        }
    });

});

bot.onText(/\/chart/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    // Get the MATIC Price
    let MATICPriceUSD;
    const maticPrice = await getMaticPrice();
    MATICPriceUSD = maticPrice.result.maticusd; 

    bot.sendPhoto(msg.chat.id, "https://www.tradingview.com/x/zWnsQz2y/", {caption: `Matic: $${MATICPriceUSD}\nAcura: $ | _Powered by_ [Acura Network](http://acuranetwork.io/)`, parse_mode: "Markdown"});

});

bot.onText(/\/editor/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    bot.sendMessage(msg.chat.id, `is: ${response.botConfig.tokenAddress}`, {
        reply_markup: {
            inline_keyboard: [[{
                text: 'View the visual editor on the following link.',
                url: `https://polygonscan.com/address/${response.botConfig.tokenAddress}`
            }]]
        }
    });

});

bot.onText(/\/updateBot/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    bot.sendMessage(msg.chat.id, `is: ${response.botConfig.tokenAddress}`, {
        reply_markup: {
            inline_keyboard: [[{
                text: 'View the visual editor on the following link.',
                url: `https://polygonscan.com/address/${response.botConfig.tokenAddress}`
            }]]
        }
    });

});

module.exports = bot;