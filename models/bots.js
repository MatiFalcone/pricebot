const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

let validChartTypes = {
    values: ["candlestick", "line", ""],
    message: "{VALUE} is not a valid chart type."
}

let validGroupTypes = {
    values: ["Public", "Private"],
    message: "{VALUE} is not a valid group type."
}

let validNetworks = {
    values: ["ethereum", "matic", "bsc"],
    message: "{VALUE} is not a valid network."
}

let validSwaps = {
    values: ["QuickSwap", "AcuraSwap", "BSCSwap", "SushiSwap", "ApeSwap", "Uniswap", "Pancake", "Pancake v2", "BakerySwap"],
    message: "{VALUE} is not a valid swap."
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
    	default: "candlestick",
        enum: validChartTypes 
    },
    chatId: {
        type: Number,
        default: 0,
        required: true
    },
    network: {
        type: String,
        default: "matic",
        enum: validNetworks
    },
    swap: {
        type: String,
        default: "QuickSwap",
        enum: validSwaps
    },
    message: {
        type: String,
        default: "",
        required: false
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
    tokensPerNative: {
        type: Boolean,
        default: true
    },
    circulatingSupply: {
        type: Boolean,
        default: true
    },
    totalSupply: {
        type: Boolean,
        default: true
    },
    marketCap: {
        type: Boolean,
        default: true
    },
    liquidity: {
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
    active: {
        type: Boolean,
        default: true
    },
    groupMembers: {
        type: Number,
        default: 0,
        required: false
    },
    groupType: {
        type: String,
        default: "Public",
        enum: validGroupTypes
    }
});

botSchema.plugin(uniqueValidator, { message: '{PATH} must be unique.' });

module.exports = mongoose.model('Bot', botSchema);