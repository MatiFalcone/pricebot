const bcrypt = require('bcrypt');
const Bot = require("../models/bots");

async function addBot(apiKey, chart, chartType, tokenAddress, tokenSymbol, tokenPrice, tokensPerMatic,
    circulatingSupply, totalSupply, marketCap, liquidity, lpValue, dailyChange, dailyVolume,
    totalValueLocked, holders) {

	// Create Bot instance
	let addedBot = new Bot({
		apiKey,
		chart,
		chartType,
        tokenAddress,
		tokenSymbol,
        tokenPrice,
        tokensPerMatic,
        circulatingSupply,
        totalSupply,
        marketCap,
        liquidity,
        lpValue,
        dailyChange,
        dailyVolume,
        totalValueLocked,
        holders,
        active: true
	});

	// Grabo en la base de datos
	let response = await addedBot.save();
	
	if (response === undefined) {
		return;
	} else {
        console.log(response);
		return response;
	}
	
}

async function registerBot(apiKey, chatId, groupMembers, groupType) {

    // Search for the entry in the database
    let updatedConfig = await Bot.findOneAndUpdate({apiKey: apiKey}, {chatId: chatId, groupMembers: groupMembers, groupType: groupType});

    if(!updatedConfig) {
        return {
            ok: false,
            message: "Bot configuration not found."
        }
    }

    return {
        ok: true,
        updatedConfig
    };

}

async function getBotConfig(chatId) {

    // Search for the entry in the database
    let botConfig = await Bot.findOne({chatId: chatId});

    console.log(botConfig);
    
    if(!botConfig) {
        return {
            ok: false,
            message: "Bot configuration not found."
        }
    }

    return {
        ok: true,
        botConfig
    };
    
}

async function getBotConfigAndUpdateTokenAddress(chatId, tokenAddress) {

    // Search for the entry in the database
    let botConfig = await Bot.findOneAndUpdate({chatId: chatId}, {tokenAddress: tokenAddress});
    
    if(!botConfig) {
        return {
            ok: false,
            message: "Bot configuration not found."
        }
    }

    return {
        ok: true,
        botConfig
    };
    
}

module.exports = { addBot, registerBot, getBotConfig, getBotConfigAndUpdateTokenAddress };