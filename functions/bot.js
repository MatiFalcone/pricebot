const Bot = require("../models/bots");

async function addBot(apiKey, chart, chartType, network, swap, message, tokenAddress, tokenSymbol, tokenPrice, tokensPerNative,
    circulatingSupply, totalSupply, marketCap, liquidity, dailyChange, dailyVolume,
    totalValueLocked) {

	// Create Bot instance
	let addedBot = new Bot({
		apiKey,
		chart,
		chartType,
        network,
        swap,
        message,
        tokenAddress,
		tokenSymbol,
        tokenPrice,
        tokensPerNative,
        circulatingSupply,
        totalSupply,
        marketCap,
        liquidity,
        dailyChange,
        dailyVolume,
        totalValueLocked,
        active: true,
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

async function editBot(chatId, chart, chartType, network, swap, message, tokenAddress, tokenSymbol, tokenPrice, tokensPerNative,
    circulatingSupply, totalSupply, marketCap, liquidity, dailyChange, dailyVolume,
    totalValueLocked, active) {

    // Search for the entry in the database
    let botConfig = await Bot.findOneAndUpdate({chatId: chatId}, {
        chart: chart, 
        chartType: chartType,
        network: network,
        swap: swap,
        message: message,
        tokenAddress: tokenAddress,
        tokenSymbol: tokenSymbol,
        tokenPrice: tokenPrice,
        tokensPerNative: tokensPerNative,
        circulatingSupply: circulatingSupply,
        totalSupply: totalSupply,
        marketCap: marketCap,
        liquidity: liquidity,
        dailyChange: dailyChange,
        dailyVolume: dailyVolume,
        totalValueLocked: totalValueLocked,
        active: active
    });
    
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

async function getBotConfig(chatId) {

    // Search for the entry in the database
    let botConfig = await Bot.findOne({chatId: chatId});
    
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

async function getBotConfigAndUpdate(chatId, update) {

    // Search for the entry in the database
    let botConfig = await Bot.findOneAndUpdate({chatId: chatId}, update);
    
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

module.exports = { addBot, registerBot, editBot, getBotConfig, getBotConfigAndUpdate };