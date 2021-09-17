const TelegramBot = require("node-telegram-bot-api");
const getTokenInfo = require("./query/token_info");
const getTokenPriceIn = require("./query/token_price");
//const getTokenLiquidityAt = require("./token_liquidity");
const getTokenTotalSupply = require("./query/token_total_supply");
const getTokenCirculatingSupply = require("./query/token_circulating_supply");
const getMaticPrice = require("./query/matic_price");
const { getBotConfig, registerBot, getBotConfigAndUpdate } = require("../functions/bot")
const { io } = require("../server/server");

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

    
    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

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

// Register a bot to a group given an ID
bot.onText(/\/unregister/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){
           /* Here I need to go to MongoDB and check if there is an entry already generated for that
           API Key. If that is the case, then I have to update the entry with the chatID received.
           Then, everytime I receive a command, I can retrieve the config of that specific bot
           using the chatID. 
           If I don't find an entry with that API Key, then I say the API Key is not valid.
           */
            // Get bot configuration
           let update = { active: false };
           let response = await getBotConfigAndUpdate(msg.chat.id, update);

           if(!response) {
               bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
               return;
           }

           if(response.botConfig.active === false) {
               bot.sendMessage(msg.chat.id, "This bot has already been unregistered.");
               return;
           }

           bot.sendMessage(msg.chat.id, "The bot has been successfully unregistered.");
       
        } else {
           bot.sendMessage(msg.chat.id, "You need to be an Admin to register this bot.");
        }
    });

});

bot.onText(/\/info/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(!response) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    bot.sendMessage(msg.chat.id, `*Available Acura Network Bot Commands* 

    ---ADMIN---   
   /register {botID}: Register a bot to a group given an ID.
   /unregister: Unregister and delete a bot from the group.
   /setToken {tokenContractAddress}: Update the contract address of your token.
   /showChart {true/false}: Enable/Disable chart image on the price command.
   /setChartType {candlestick/line}: Set chart type to candlestick or line.
   /showTokenSymbol {true/false}: Enable/Disable the token symbol on the price command.
   /showTokenPrice {true/false}: Enable/Disable the token price on the price command.
   /showTokensPerMatic {true/false}: Enable/Disable token/Matic rate on the price command.
   /showCirculatingSupply {true/false}: Enable/Disable token circulating supply on the price command.
   /showTotalSupply {true/false}: Enable/Disable token total supply on the price command.
   /showMarketcap {true/false}: Enable/Disable token marketcap on the price command.
   /showLiquidity {true/false}: Enable/Disable token liquidity on the price command.
   /updatePriceMessage {messageText}: Update price message.
   /disablePriceChart {true/false}: Disable chart image on the price command.
   
   
    ---USER DEFAULT--- 
   /price: Get price information about the registered token.
   /contract: Get the token's contract address and a link to Polygonscan.
   /chart: Get a chart of the token's price in USD, along with the price of Matic and Acura.
   /info: Get list of available commands.`, {parse_mode: "Markdown"});

});

/* Set the address of the token and the name
 - Example: "/set_token 0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4 Solana"
 - In the above command, the user sets "Solana" as name for "0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4" token address 
 - If the user specifies no name for the token, the default name will be the token ticker ("SOL" in this example)
*/
bot.onText(/\/setToken/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

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

                let update = { tokenAddress: tokenAddress};
                let response = await getBotConfigAndUpdate(msg.chat.id, update);         
                
                if(!response) {
                    bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                    return;
                }

                if(response.botConfig.active === false) {
                    bot.sendMessage(msg.chat.id, "Please, register your bot.");
                    return;
                }

                // send back the matched "whatever" to the chat
                bot.sendMessage(msg.chat.id, `The address "${tokenAddress}" has been successfully updated as your registered token address.`); 
            } else {
                bot.sendMessage(msg.chat.id, "Please, specify a correct address for the token in Polygon (MATIC) network.");
                return;
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });
     
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

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
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
        const tokenLiquidity = await getTokenLiquidityAt(blockNumber, response.botConfig.tokenAddress);
        totalLiquidity = parseInt(tokenLiquidity.data.tokens[0].totalLiquidity, 10) * parseInt(tokenPrice.data.ethereum.dexTrades[0].quotePrice, 10);
        answer = answer + `Liquidity: $ \n`
    }

    answer = answer + `\nMatic: $${MATICPriceUSD}\nAcura: $ | _Powered by_ [Acura Network](http://acuranetwork.io/)`;

    if(response.botConfig.chart) {
        // Get a list of all connected sockets.
        var sockets = await io.fetchSockets();

        if(sockets.length >= 1) {
            sockets[1].emit("getScreenshot", { tokenAddress: response.botConfig.tokenAddress, chartType: response.botConfig.chartType, chatId: response.botConfig.chatId, caption: answer })
        } else {
            console.log("There are no instances of Front-End to handle the screenshot request.");
        }

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

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
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

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    // Get the MATIC Price
    let MATICPriceUSD;
    const maticPrice = await getMaticPrice();
    MATICPriceUSD = maticPrice.result.maticusd;   

    var answer = `\nMatic: $${MATICPriceUSD}\nAcura: $ | _Powered by_ [Acura Network](http://acuranetwork.io/)`;

    // Get a list of all connected sockets.
    var sockets = await io.fetchSockets();

    if(sockets.length >= 1) {
        sockets[1].emit("getScreenshot", { tokenAddress: response.botConfig.tokenAddress, chartType: response.botConfig.chartType, chatId: response.botConfig.chatId, caption: answer });
    } else {
        console.log("There are no instances of Front-End to handle the screenshot request.");
    }

});

bot.onText(/\/showChart/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let chart = pieces[1].toLowerCase();

            if(chart !== "true" && chart !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showChart command.`);
                return;
            }

            // Get bot configuration
            let update = { chart: chart };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(chart === "true") {
                bot.sendMessage(msg.chat.id, `Chart on.`);
            }

            if(chart === "false") {
                bot.sendMessage(msg.chat.id, `Chart off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/setChartType/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let chartType = pieces[1].toLowerCase();

            if(chartType !== "candlestick" && chartType !== "line") {
                bot.sendMessage(msg.chat.id, `The chart type is incorrect. Please, choose between "candlestick" or "line".`);
                return;
            }

            // Get bot configuration
            let update = { chartType: chartType };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            bot.sendMessage(msg.chat.id, `The chart type has been successfully updated to "${chartType}".`);

        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showTokenSymbol/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let symbol = pieces[1].toLowerCase();

            if(symbol !== "true" && symbol !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showSymbol command.`);
                return;
            }

            // Get bot configuration
            let update = { tokenSymbol: symbol };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(symbol === "true") {
                bot.sendMessage(msg.chat.id, `Token symbol on.`);
            }

            if(symbol === "false") {
                bot.sendMessage(msg.chat.id, `Token symbol off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showTokenPrice/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let price = pieces[1].toLowerCase();

            if(price !== "true" && price !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showPrice command.`);
                return;
            }

            // Get bot configuration
            let update = { tokenPrice: price };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(price === "true") {
                bot.sendMessage(msg.chat.id, `Token price on.`);
            }

            if(price === "false") {
                bot.sendMessage(msg.chat.id, `Token price off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showTokensPerMatic/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let tokensPerMatic = pieces[1].toLowerCase();

            if(tokensPerMatic !== "true" && tokensPerMatic !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTokensPerMatic command.`);
                return;
            }

            // Get bot configuration
            let update = { tokensPerMatic: tokensPerMatic };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(tokensPerMatic === "true") {
                bot.sendMessage(msg.chat.id, `Tokens/Matic on.`);
            }

            if(tokensPerMatic === "false") {
                bot.sendMessage(msg.chat.id, `Tokens/Matic off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showCirculatingSupply/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let circulatingSupply = pieces[1].toLowerCase();

            if(circulatingSupply !== "true" && circulatingSupply !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showCirculatingSupply command.`);
                return;
            }

            // Get bot configuration
            let update = { circulatingSupply: circulatingSupply };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(circulatingSupply === "true") {
                bot.sendMessage(msg.chat.id, `Circulating supply on.`);
            }

            if(circulatingSupply === "false") {
                bot.sendMessage(msg.chat.id, `Circulating supply off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showTotalSupply/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let totalSupply = pieces[1].toLowerCase();

            if(totalSupply !== "true" && totalSupply !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalSupply command.`);
                return;
            }

            // Get bot configuration
            let update = { totalSupply: totalSupply };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(totalSupply === "true") {
                bot.sendMessage(msg.chat.id, `Token total supply on.`);
            }

            if(totalSupply === "false") {
                bot.sendMessage(msg.chat.id, `Token total supply off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showMarketcap/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let marketcap = pieces[1].toLowerCase();

            if(marketcap !== "true" && marketcap !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showMarketcap command.`);
                return;
            }

            // Get bot configuration
            let update = { marketCap: marketcap };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(marketcap === "true") {
                bot.sendMessage(msg.chat.id, `Token marketcap on.`);
            }

            if(marketcap === "false") {
                bot.sendMessage(msg.chat.id, `Token marketcap off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showLiquidity/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let liquidity = pieces[1].toLowerCase();

            if(liquidity !== "true" && liquidity !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showLiquidity command.`);
                return;
            }

            // Get bot configuration
            let update = { liquidity: liquidity };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(liquidity === "true") {
                bot.sendMessage(msg.chat.id, `Token liquidity on.`);
            }

            if(liquidity === "false") {
                bot.sendMessage(msg.chat.id, `Token liquidity off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showLpValue/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let lpValue = pieces[1].toLowerCase();

            if(lpValue !== "true" && lpValue !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showLpValue command.`);
                return;
            }

            // Get bot configuration
            let update = { lpValue: lpValue };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(lpValue === "true") {
                bot.sendMessage(msg.chat.id, `Token LP value on.`);
            }

            if(lpValue === "false") {
                bot.sendMessage(msg.chat.id, `Token LP value off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showDailyChange/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let dailyChange = pieces[1].toLowerCase();

            if(dailyChange !== "true" && dailyChange !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyChange command.`);
                return;
            }

            // Get bot configuration
            let update = { dailyChange: dailyChange };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(dailyChange === "true") {
                bot.sendMessage(msg.chat.id, `Token 24hr change on.`);
            }

            if(dailyChange === "false") {
                bot.sendMessage(msg.chat.id, `Token 24hr change off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showDailyVolume/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){
            
            // Parse text from the user
            let pieces = msg.text.split(" ");
            let dailyVolume = pieces[1].toLowerCase();

            if(dailyVolume !== "true" && dailyVolume !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyVolume command.`);
                return;
            }

            // Get bot configuration
            let update = { dailyVolume: dailyVolume };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(dailyVolume === "true") {
                bot.sendMessage(msg.chat.id, `Token 24hr volume on.`);
            }

            if(dailyVolume === "false") {
                bot.sendMessage(msg.chat.id, `Token 24hr volume off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showTotalValueLocked/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let totalValueLocked = pieces[1].toLowerCase();

            if(totalValueLocked !== "true" && totalValueLocked !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalValueLocked command.`);
                return;
            }

            // Get bot configuration
            let update = { totalValueLocked: totalValueLocked };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(totalValueLocked === "true") {
                bot.sendMessage(msg.chat.id, `Token total value locked on.`);
            }

            if(totalValueLocked === "false") {
                bot.sendMessage(msg.chat.id, `Token total value locked off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

bot.onText(/\/showHolders/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let holders = pieces[1].toLowerCase();

            if(holders !== "true" && holders !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showHolders command.`);
                return;
            }

            // Get bot configuration
            let update = { holders: holders };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(!response) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(holders === "true") {
                bot.sendMessage(msg.chat.id, `Token total value locked on.`);
            }

            if(holders === "false") {
                bot.sendMessage(msg.chat.id, `Token total value locked off.`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });

});

module.exports = bot;