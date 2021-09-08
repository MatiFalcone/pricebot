const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

let validChartTypes = {
    values: ["Candlestick", "Line"],
    message: "{VALUE} is not a valir type of chart."
}

let botSchema = new Schema({
    apiKey: { 
    	type: String, 
    	unique: true, 
    	required: [true, "API Key is mandatory."] 
    },
    chart: {
        type: Boolean,
        default: true
    },
    chartType: { 
    	type: String, 
    	default: "Candlestick",
        enum: validChartTypes 
    },
    chatId: {
        type: Number,
        default: 0,
        required: true
    },
    tokenAddress: {
        type: String,
        required: [true, "Token address is mandatory."]
    },
    tokenSymbol: {
        type: Boolean,
        default: true
    },
    tokenPrice: {
        type: Boolean,
        default: true
    },
    tokensPerMatic: {
        type: Boolean,
        default: true
    },
    circulatingSupply: {
        type: Boolean,
        default: true
    },
    marketCap: {
        type: Boolean,
        default: true
    },
    tokenPrice: {
        type: Boolean,
        default: true
    },
    liquidity: {
        type: Boolean,
        default: true
    },
    lpValue: {
        type: Boolean,
        default: true
    },
    dailyChange: {
        type: Boolean,
        default: true
    },
    dailyVolume: {
        type: Boolean,
        default: true
    },
    totalValueLocked: {
        type: Boolean,
        default: true
    },
    holders: {
        type: Boolean,
        default: true
    },
    active: {
        type: Boolean,
        default: true
    }
});

botSchema.plugin(uniqueValidator, { message: '{PATH} must be unique.' });

module.exports = mongoose.model('Bot', botSchema);