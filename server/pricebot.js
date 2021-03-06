const TelegramBot = require("node-telegram-bot-api");
const getTokenInfo = require("./query/token_info");
const getTokenPriceIn = require("./query/token_price");
const getTokenLiquidityQuick = require("./query/liquidity_quick");
const getTokenLiquiditySushi = require("./query/liquidity_sushi");
const getTokenLiquidityUniswap = require("./query/liquidity_uniswap");
const getTokenLiquidityPancake = require("./query/liquidity_pancake");
const getTokenLiquidityJulswap = require("./query/liquidity_julswap");
const getTokenLiquidityApe = require("./query/liquidity_ape");
const getTokenTotalSupply = require("./query/token_total_supply");
const getTokenCirculatingSupply = require("./query/token_circulating_supply");
const getDailyVolume = require("./query/24hr_volume");
const getMaticPrice = require("./query/matic_price");
const getEthPrice = require("./query/eth_price");
const getBnbPrice = require("./query/bnb_price");
const getTotalValueLockedQuick = require("./query/tvl_quick");
const getTotalValueLockedSushi = require("./query/tvl_sushi");
const getTotalValueLockedUniswap = require("./query/tvl_uniswap");
const getTotalValueLockedPancake = require("./query/tvl_pancake");
const getTotalValueLockedJulswap = require("./query/tvl_julswap");
const getTotalValueLockedApe = require("./query/tvl_ape");
const getTotalValueLockedBakery = require("./query/tvl_bakery");
const capitalizeFirstLetter = require("../functions/aux");
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

bot.onText(/\/start/, async (msg) => {

    
    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    bot.sendMessage(msg.chat.id, `Hi ${msg.from.first_name}! ????\n\nWelcome to the Acura Network Pricebot ????\n\nDo you wanna know the commands???\n\nType /info to see how they work!`);    

});

// Register a bot to a group given an ID
bot.onText(/\/register/, async (msg) => {

    // Parse text from the user
    let pieces = msg.text.split(" ");
    let registrationKey = pieces[1];

    if(registrationKey === undefined) {
        bot.sendMessage(msg.chat.id, `Please, specify a valid Bot ID.`);
        return;
    }

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

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
                if(registeredBot.updatedConfig.active === false) {
                    bot.sendMessage(msg.chat.id, `This bot has been unregistered. Please, register a new bot.`);
                    return;
                }
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
            // Get bot configuration
           let update = { active: false };
           let response = await getBotConfigAndUpdate(msg.chat.id, update);

           if(response.ok === false) {
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

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    bot.sendMessage(msg.chat.id, `*Available Acura Network Bot Commands* 

    This bot is configured to work in the *${capitalizeFirstLetter(response.botConfig.network)}* network.

    ---ADMIN---

   /register {botID}: Register a bot to a group given an ID.
   /unregister: Unregister and delete a bot from the group.
   /setToken {tokenContractAddress}: Update the contract address of your token.
   /showChart {true/false}: Enable/Disable chart image on the price command.
   /setChartType {candlestick/line}: Set chart type to candlestick or line.
   /showTokenSymbol {true/false}: Enable/Disable the token symbol on the price command.
   /showTokenPrice {true/false}: Enable/Disable the token price on the price command.
   /showTokensPerNative {true/false}: Enable/Disable token/BNB/ETH/Matic rate on the price command.
   /showCirculatingSupply {true/false}: Enable/Disable token circulating supply on the price command.
   /showTotalSupply {true/false}: Enable/Disable token total supply on the price command.
   /showMarketcap {true/false}: Enable/Disable token marketcap on the price command.
   /showLiquidity {true/false}: Enable/Disable token liquidity on the price command.
   /showDailyChange {true/false}: Enable/Disable token daily change on the price command.
   /showDailyVolume {true/false}: Enable/Disable token daily volume on the price command.
   /showTotalValueLocked {true/false}: Enable/Disable token total value locked on the price command.

    ---USER DEFAULT---

   /price: Get price information about the registered token.
   /contract: Get the token's contract address and a link to BscScan/Etherscan/Polygonscan.
   /chart: Get a chart of the token's price in USD, along with the price of BNB.
   /info: Get list of available commands.`, {parse_mode: "Markdown"});

});

/* Set the address of the token and the name
 - Example: "/set_token 0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4 Solana"
 - In the above command, the user sets "Solana" as name for "0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4" token address 
 - If the user specifies no name for the token, the default name will be the token ticker ("SOL" in this example)
*/
bot.onText(/\/setToken/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let tokenAddress = pieces[1];

            if(tokenAddress === undefined) {
                bot.sendMessage(msg.chat.id, "Please, specify the address of the token you want to add after the /setToken command.");
                return;
            }

            const tokenInfo = await getTokenInfo(response.botConfig.network, tokenAddress, response.botConfig.swap);

            // Check for errors
            if(tokenInfo.errors === undefined) {

                let update = { tokenAddress: tokenAddress};
                let response = await getBotConfigAndUpdate(msg.chat.id, update);         
                
                if(response.ok === false) {
                    bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                    return;
                }

                if(response.botConfig.active === false) {
                    bot.sendMessage(msg.chat.id, "Please, register your bot.");
                    return;
                }

                bot.sendMessage(msg.chat.id, `The address "${tokenAddress}" has been successfully updated as your registered token address.`); 
            } else {
                bot.sendMessage(msg.chat.id, `The token address "${tokenAddress}" was not found in ${response.botConfig.swap} (${capitalizeFirstLetter(response.botConfig.network)} network).`);
                return;
            }
        } else {
            bot.sendMessage(msg.chat.id, "You need to be an Admin to use this command.");
        }
    });
     
});

bot.onText(/\/price/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    if(response.botConfig.network === "matic") {
        // Get the MATIC Price
        var MATICPriceUSD;
        const maticPrice = await getMaticPrice();
        MATICPriceUSD = maticPrice.result.maticusd;   
    }

    if(response.botConfig.network === "ethereum") {
        // Get the ETH Price
        var ETHPriceUSD;
        const ethPrice = await getEthPrice();
        ETHPriceUSD = ethPrice.result.ethusd;   
    }

    if(response.botConfig.network === "bsc") {
        // Get the BNB Price
        var BNBPriceUSD;
        const bnbPrice = await getBnbPrice();
        BNBPriceUSD = bnbPrice.result.ethusd;   
    }
    

    // Send answer depending on bot configuration
    var answer = "";

    // Add customizable message
    if(response.botConfig.message !== "") {
        answer = answer + `${response.botConfig.message}\n\n`;
    } 

    if(response.botConfig.tokenSymbol || response.botConfig.tokenPrice || response.botConfig.tokensPerNative || response.botConfig.circulatingSupply || response.botConfig.totalSupply || response.botConfig.liquidity || response.botConfig.marketCap) {
        
        var quoteCurrency = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"; // WBNB

        if(response.botConfig.network === "ethereum") {
            quoteCurrency = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH
        }

        if(response.botConfig.network === "matic") {
            quoteCurrency = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"; // WMATIC
        }

        var tokenPrice = await getTokenPriceIn(response.botConfig.network, response.botConfig.tokenAddress, response.botConfig.swap, quoteCurrency, "null", "null");

        if(tokenPrice.data.ethereum.dexTrades.length === 1) {

            var tokenSymbol;
            var tokenPriceUSD;
            var tokenPriceForCalcs;
            var decimals;

            tokenSymbol = tokenPrice.data.ethereum.dexTrades[0].baseCurrency.symbol

            if(response.botConfig.network === "matic") {
                tokenPriceForCalcs = tokenPrice.data.ethereum.dexTrades[0].quotePrice * MATICPriceUSD;
                tokenPriceUSD = (tokenPrice.data.ethereum.dexTrades[0].quotePrice * MATICPriceUSD).toFixed(2);
            }

            if(response.botConfig.network === "ethereum") {
                tokenPriceForCalcs = tokenPrice.data.ethereum.dexTrades[0].quotePrice * ETHPriceUSD;
                tokenPriceUSD = (tokenPrice.data.ethereum.dexTrades[0].quotePrice * ETHPriceUSD).toFixed(2);
            }

            if(response.botConfig.network === "bsc") {
                tokenPriceForCalcs = tokenPrice.data.ethereum.dexTrades[0].quotePrice * BNBPriceUSD;
                tokenPriceUSD = (tokenPrice.data.ethereum.dexTrades[0].quotePrice * BNBPriceUSD).toFixed(2);
            }
            
            decimals = tokenPrice.data.ethereum.dexTrades[0].baseCurrency.decimals;

        } else {
            bot.sendMessage(msg.chat.id, `The price couldn't be retrieved.`);
            return;
        }
    }

    if(response.botConfig.tokenSymbol) {
        answer = answer + `Symbol: ${tokenSymbol}\n`
    }

    if(response.botConfig.tokenPrice) {
        answer = answer + `${tokenSymbol} Price: $${tokenPriceUSD}\n`
    }

    if(response.botConfig.tokensPerNative) {
        if(response.botConfig.network === "matic") {
            let MATICRate;
            MATICRate = (MATICPriceUSD / tokenPriceForCalcs).toFixed(6);
            answer = answer + `${tokenSymbol}/MATIC: ${MATICRate}\n`;
        }
        if(response.botConfig.network === "ethereum") {
            let ETHRate;
            ETHRate = (ETHPriceUSD / tokenPriceForCalcs).toFixed(6);
            answer = answer + `${tokenSymbol}/ETH: ${ETHRate}\n`;
        }
        if(response.botConfig.network === "bsc") {
            let BNBRate;
            BNBRate = (BNBPriceUSD / tokenPriceForCalcs).toFixed(6);
            answer = answer + `${tokenSymbol}/BNB: ${BNBRate}\n`;
        }
    }

    if(response.botConfig.circulatingSupply || response.botConfig.marketCap) {
        var circulatingSupply;
        const tokenCirculatingSupply = await getTokenCirculatingSupply(response.botConfig.network, response.botConfig.tokenAddress);
        circulatingSupply = parseInt(tokenCirculatingSupply.result, 10) / Math.pow(10, decimals);
        editedCirculatingSupply = (parseInt(tokenCirculatingSupply.result, 10) / Math.pow(10, decimals)).toLocaleString();
        answer = answer + `Circulating Supply: ${editedCirculatingSupply}\n`
    }

    if(response.botConfig.totalSupply) {
        let totalSupply;
        const tokenTotalSupply = await getTokenTotalSupply(response.botConfig.network, response.botConfig.tokenAddress);
        totalSupply = (parseInt(tokenTotalSupply.result, 10) / Math.pow(10, decimals)).toLocaleString();
        answer = answer + `Total Supply: ${totalSupply}\n`
    }

    if(response.botConfig.marketCap) {
        let marketCap;
        marketCap = (circulatingSupply * tokenPriceForCalcs).toLocaleString();
        answer = answer + `Marketcap: $${marketCap}\n`
    }

    if(response.botConfig.liquidity) {
        var totalLiquidity;

        if(response.botConfig.network === "matic") {
            const tokenLiquidityQuick = await getTokenLiquidityQuick(response.botConfig.tokenAddress);
            if(tokenLiquidityQuick.data.tokens.lenght === 0) {
                totalLiquidity = 0;
            } else {
                totalLiquidity = (parseInt(tokenLiquidityQuick.data.tokens[0].totalLiquidity, 10) * tokenPriceForCalcs).toLocaleString();
            }
        }

        if(response.botConfig.network === "ethereum") {
            if(response.botConfig.swap === "SushiSwap") {
                const tokenLiquiditySushi = await getTokenLiquiditySushi(response.botConfig.tokenAddress);
                if(tokenLiquiditySushi.data.tokens.length === 0) {
                    totalLiquidity = 0;
                } else {
                    totalLiquidity = (parseInt(tokenLiquiditySushi.data.tokens[0].liquidity, 10) * tokenPriceForCalcs).toLocaleString();        
                }
            }
            if(response.botConfig.swap === "Uniswap") {
                const tokenLiquidityUniswap = await getTokenLiquidityUniswap(response.botConfig.tokenAddress);
                if(tokenLiquidityUniswap.data.tokens.length === 0) {
                    totalLiquidity = 0;
                } else {
                    totalLiquidity = (parseInt(tokenLiquidityUniswap.data.tokens[0].totalLiquidity, 10) * tokenPriceForCalcs).toLocaleString();        
                }
            }
        }

        if(response.botConfig.network === "bsc") {
            if(response.botConfig.swap === "Pancake") {
                const tokenLiquidityPancake = await getTokenLiquidityPancake(response.botConfig.tokenAddress);
                if(tokenLiquidityPancake.data.tokens.length === 0) {
                    totalLiquidity = 0;
                } else {
                    totalLiquidity = (parseInt(tokenLiquidityPancake.data.tokens[0].totalLiquidity, 10) * tokenPriceForCalcs).toLocaleString();
                }
            }
            if(response.botConfig.swap === "ApeSwap") {
                const tokenLiquidityApe = await getTokenLiquidityApe(response.botConfig.tokenAddress);
                if(tokenLiquidityApe.data.tokens.length === 0) {
                    totalLiquidity = 0;    
                } else {
                    totalLiquidity = (parseInt(tokenLiquidityApe.data.tokens[0].totalLiquidity, 10) * tokenPriceForCalcs).toLocaleString();
                }
            }
            if(response.botConfig.swap === "BakerySwap") {
                const tokenLiquidityBakery = await getTokenLiquidityBakery(response.botConfig.tokenAddress);
                if(tokenLiquidityBakery.data.tokens.length === 0) {
                    totalLiquidity = 0;
                } else {
                    totalLiquidity = (parseInt(tokenLiquidityBakery.data.tokens[0].totalLiquidity, 10) * tokenPriceForCalcs).toLocaleString();
                }
            }
        }
        
        answer = answer + `Liquidity: $${totalLiquidity}\n`
    }

    answer = answer + `-----------------------------------\n`;

    if(response.botConfig.dailyChange) {

        let currentDate = new Date();
        let currentDateUTC = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), currentDate.getUTCHours(), currentDate.getUTCMinutes(), currentDate.getUTCSeconds());
        let before = new Date(currentDateUTC);
        let beforeIso = before.toISOString();
        let since = new Date();
        since.setDate(since.getDate() - 1);
        sinceIso = since.toISOString();

        let tokenDailyVolume = await getDailyVolume(response.botConfig.network, response.botConfig.tokenAddress, response.botConfig.swap, sinceIso, beforeIso);
        
        var dailyVolume = 0;
        for (let i = 0; i < tokenDailyVolume.data.twenty_four_hour.dexTrades.length; i++) {
            var element = tokenDailyVolume.data.twenty_four_hour.dexTrades[i];
            var dailyVolume = dailyVolume + element.tradeAmount;
        }

        var quoteCurrency = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"; // WMATIC
        var nativePrice = MATICPriceUSD;

        if(response.botConfig.network === "ethereum") {
            quoteCurrency = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH
            nativePrice = ETHPriceUSD;
        }

        if(response.botConfig.network === "bsc") {
            quoteCurrency = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"; // WBNB
            nativePrice = BNBPriceUSD;
        }

        var tokenPriceYesterday = await getTokenPriceIn(response.botConfig.network, response.botConfig.tokenAddress, response.botConfig.swap, quoteCurrency, "null", sinceIso);
        var tokenPriceUSDYesterday = tokenPriceYesterday.data.ethereum.dexTrades[0].quotePrice * nativePrice;

        var dailyChange = ((tokenPriceForCalcs - tokenPriceUSDYesterday) / tokenPriceUSDYesterday) * 100;
        var upOrDown = "???";

        if(Math.sign(dailyChange) === 1) {
            upOrDown = "????"
        }

        if(Math.sign(dailyChange) === -1) {
            upOrDown = "????"
        }

        dailyChange = dailyChange.toFixed(2);
        dailyChange = dailyChange.toLocaleString();
        dailyVolume = dailyVolume.toLocaleString();
        answer = answer + `24Hr Change: ${dailyChange}% ${upOrDown}\n`
    }

    if(response.botConfig.dailyVolume) {
        answer = answer + `24Hr Volume: $${dailyVolume} \n`
    }

    if(response.botConfig.totalValueLocked) {
        
        if(response.botConfig.network === "matic") {
            var tvl;
            const totalValueLockedQuick = await getTotalValueLockedQuick();
            tvl = (parseInt(totalValueLockedQuick.data.uniswapFactories[0].totalLiquidityUSD, 10)).toLocaleString();
        }

        if(response.botConfig.network === "ethereum") {
            if(response.botConfig.swap === "SushiSwap") {
                var tvl;
                const totalValueLockedSushi = await getTotalValueLockedSushi();
                tvl = (parseInt(totalValueLockedSushi.data.factories[0].liquidityUSD, 10)).toLocaleString();
            }
            if(response.botConfig.swap === "Uniswap") {
                var tvl;
                const totalValueLockedUniswap = await getTotalValueLockedUniswap();
                tvl = (parseInt(totalValueLockedUniswap.data.uniswapFactories[0].totalLiquidityUSD, 10)).toLocaleString();
            }
        }

        if(response.botConfig.network === "bsc") {
            if(response.botConfig.swap === "Pancake") {
                var tvl;
                const totalValueLockedPancake = await getTotalValueLockedPancake();
                tvl = (parseInt(totalValueLockedPancake.data.pancakeFactories[0].totalLiquidityUSD, 10)).toLocaleString();
            }
            if(response.botConfig.swap === "ApeSwap") {
                var tvl;
                const totalValueLockedApe = await getTotalValueLockedApe();
                tvl = (parseInt(totalValueLockedApe.data.uniswapFactories[0].totalLiquidityUSD, 10)).toLocaleString();
            }
        }

        answer = answer + `Total Value Locked????: $${tvl}\n`;

    }

    answer = answer + `-----------------------------------\n`;

    if(response.botConfig.network === "matic") {
        answer = answer + `\nMatic: $${MATICPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    if(response.botConfig.network === "ethereum") {
        answer = answer + `\nETH: $${ETHPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    if(response.botConfig.network === "bsc") {
        answer = answer + `\nBNB: $${BNBPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    if(response.botConfig.chart) {
        // Get a list of all connected sockets.
        const sockets = await io.fetchSockets();
        if(sockets.length >= 1) {
            try {
                sockets[1].emit("getScreenshot", { network: response.botConfig.network, tokenAddress: response.botConfig.tokenAddress, chartType: response.botConfig.chartType, chatId: response.botConfig.chatId, caption: answer });
            } 
            catch(err) {
                console.log("The emit failed. Keep in mind you need a Front-End connected to handle the screenshot request: ", err);
                sockets[0].emit("getScreenshot", { network: response.botConfig.network, tokenAddress: response.botConfig.tokenAddress, chartType: response.botConfig.chartType, chatId: response.botConfig.chatId, caption: answer });
            }
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

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    if(response.botConfig.network === "matic") {
        bot.sendMessage(msg.chat.id, `The address of your token is: ${response.botConfig.tokenAddress}`, {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'View on Polygonscan',
                    url: `https://polygonscan.com/address/${response.botConfig.tokenAddress}`
                }]]
            }
        });
    }

    if(response.botConfig.network === "ethereum") {
        bot.sendMessage(msg.chat.id, `The address of your token is: ${response.botConfig.tokenAddress}`, {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'View on Etherscan',
                    url: `https://etherscan.io/token/${response.botConfig.tokenAddress}`
                }]]
            }
        });
    }

    if(response.botConfig.network === "bsc") {
        bot.sendMessage(msg.chat.id, `The address of your token is: ${response.botConfig.tokenAddress}`, {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'View on BscScan',
                    url: `https://bscscan.com/token/${response.botConfig.tokenAddress}`
                }]]
            }
        });
    }

});

bot.onText(/\/chart/, async (msg) => {

    // Get bot configuration
    let response = await getBotConfig(msg.chat.id);

    if(response.ok === false) {
        bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
        return;
    }

    if(response.botConfig.active === false) {
        bot.sendMessage(msg.chat.id, "Please, register your bot.");
        return;
    }

    if(response.botConfig.network === "matic") {
        // Get the MATIC Price
        var MATICPriceUSD;
        const maticPrice = await getMaticPrice();
        MATICPriceUSD = maticPrice.result.maticusd;
    }

    if(response.botConfig.network === "ethereum") {
        // Get the MATIC Price
        var ETHPriceUSD;
        const ethPrice = await getEthPrice();
        ETHPriceUSD = ethPrice.result.ethusd;   
    }

    if(response.botConfig.network === "bsc") {
        // Get the MATIC Price
        var BNBPriceUSD;
        const bnbPrice = await getBnbPrice();
        BNBPriceUSD = bnbPrice.result.ethusd;   
    }

    var answer = "";

    if(response.botConfig.network === "matic") {
        answer = `\nMatic: $${MATICPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    if(response.botConfig.network === "ethereum") {
        answer = `\nETH: $${ETHPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    if(response.botConfig.network === "bsc") {
        answer = `\nBNB: $${BNBPriceUSD} | _Powered by_ [Acura Network](http://acuranetwork.io/)`;
    }

    // Get a list of all connected sockets.
    const sockets = await io.fetchSockets();
    if(sockets.length >= 1) {
        sockets[1].emit("getScreenshot", { network: response.botConfig.network, tokenAddress: response.botConfig.tokenAddress, chartType: response.botConfig.chartType, chatId: response.botConfig.chatId, caption: answer });
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
            let chartRaw = pieces[1];

            if(chartRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showChart command.`);
                return;
            }

            let chart = chartRaw.toLowerCase();

            if(chart !== "true" && chart !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showChart command.`);
                return;
            }

            // Get bot configuration
            let update = { chart: chart };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let chartTypeRaw = pieces[1];

            if(chartTypeRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "candlestick" or "line" after /setChartType command.`);
                return;
            }

            let chartType = chartTypeRaw.toLowerCase();

            if(chartType !== "candlestick" && chartType !== "line") {
                bot.sendMessage(msg.chat.id, `The chart type is incorrect. Please, choose between "candlestick" or "line".`);
                return;
            }

            // Get bot configuration
            let update = { chartType: chartType };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let symbolRaw = pieces[1];

            if(symbolRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTokenSymbol command.`);
                return;
            }

            let symbol = symbolRaw.toLowerCase();

            if(symbol !== "true" && symbol !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showSymbol command.`);
                return;
            }

            // Get bot configuration
            let update = { tokenSymbol: symbol };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let priceRaw = pieces[1];

            if(priceRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTokenPrice command.`);
                return;
            }

            let price = priceRaw.toLowerCase();

            if(price !== "true" && price !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showPrice command.`);
                return;
            }

            // Get bot configuration
            let update = { tokenPrice: price };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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

bot.onText(/\/showTokensPerNative/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let tokensPerNativeRaw = pieces[1];

            if(tokensPerNativeRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTokensPerNative command.`);
                return;
            }

            let tokensPerNative = tokensPerNativeRaw.toLowerCase();

            if(tokensPerNative !== "true" && tokensPerNative !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTokensPerNative command.`);
                return;
            }

            // Get bot configuration
            let update = { tokensPerNative: tokenstokensPerNative };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
                bot.sendMessage(msg.chat.id, "There is a problem with your bot configuration. Please, repeat the process of registration.");
                return;
            }

            if(response.botConfig.active === false) {
                bot.sendMessage(msg.chat.id, "Please, register your bot.");
                return;
            }

            if(tokensPerNative === "true") {
                bot.sendMessage(msg.chat.id, `Tokens/BNB/ETH/Matic on.`);
            }

            if(tokensPerNative === "false") {
                bot.sendMessage(msg.chat.id, `Tokens/BNB/ETH/Matic off.`);
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
            let circulatingSupplyRaw = pieces[1];

            if(circulatingSupplyRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showCirculatingSupply command.`);
                return;
            }

            let circulatingSupply = circulatingSupplyRaw.toLowerCase();

            if(circulatingSupply !== "true" && circulatingSupply !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showCirculatingSupply command.`);
                return;
            }

            // Get bot configuration
            let update = { circulatingSupply: circulatingSupply };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let totalSupplyRaw = pieces[1];

            if(totalSupplyRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalSupply command.`);
                return;
            }

            let totalSupply = totalSupplyRaw.toLowerCase();

            if(totalSupply !== "true" && totalSupply !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalSupply command.`);
                return;
            }

            // Get bot configuration
            let update = { totalSupply: totalSupply };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let marketcapRaw = pieces[1];

            if(marketcapRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showMarketcap command.`);
                return;
            }

            let marketcap = marketcapRaw.toLowerCase();

            if(marketcap !== "true" && marketcap !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showMarketcap command.`);
                return;
            }

            // Get bot configuration
            let update = { marketCap: marketcap };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let liquidityRaw = pieces[1];

            if(liquidityRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showLiquidity command.`);
                return;
            }

            let liquidity = liquidityRaw.toLowerCase();

            if(liquidity !== "true" && liquidity !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showLiquidity command.`);
                return;
            }

            // Get bot configuration
            let update = { liquidity: liquidity };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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

bot.onText(/\/showDailyChange/, async (msg) => {

    // Check if the sender is Admin
    bot.getChatMember(msg.chat.id, msg.from.id).then(async function(data) {
        if ((data.status === "creator") || (data.status === "administrator")){

            // Parse text from the user
            let pieces = msg.text.split(" ");
            let dailyChangeRaw = pieces[1];

            if(dailyChangeRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyChange command.`);
                return;
            }

            let dailyChange = dailyChangeRaw.toLowerCase();

            if(dailyChange !== "true" && dailyChange !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyChange command.`);
                return;
            }

            // Get bot configuration
            let update = { dailyChange: dailyChange };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let dailyVolumeRaw = pieces[1];

            if(dailyVolumeRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyVolume command.`);
                return;
            }

            let dailyVolume = dailyVolumeRaw.toLowerCase();

            if(dailyVolume !== "true" && dailyVolume !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showDailyVolume command.`);
                return;
            }

            // Get bot configuration
            let update = { dailyVolume: dailyVolume };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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
            let totalValueLockedRaw = pieces[1];

            if(totalValueLockedRaw === undefined) {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalValueLocked command.`);
                return;
            }

            let totalValueLocked = totalValueLockedRaw.toLowerCase();

            if(totalValueLocked !== "true" && totalValueLocked !== "false") {
                bot.sendMessage(msg.chat.id, `Please, specify "true" or "false" after /showTotalValueLocked command.`);
                return;
            }

            // Get bot configuration
            let update = { totalValueLocked: totalValueLocked };
            let response = await getBotConfigAndUpdate(msg.chat.id, update);

            if(response.ok === false) {
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

module.exports = bot;