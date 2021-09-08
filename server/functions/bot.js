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
        chatId,
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
	bot.save((error, botDB) => {

		if (error) {
			return res.status(400).json( {
				ok: false,
				error
			});
		}

		res.json({
			ok: true,
			bot: botDB
		});

	});

}

async function registerBot(apiKey, chart, chartType, tokenSymbol, tokenPrice, tokensPerMatic,
    circulatingSupply, totalSupply, marketCap, liquidity, lpValue, dailyChange, dailyVolume,
    totalValueLocked, holders) {

    let addedBot;
    

return addedBot;

}

module.exports = addBot;