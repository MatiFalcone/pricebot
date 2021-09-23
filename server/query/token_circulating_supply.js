const fetch = require("node-fetch");
const Redis = require("ioredis");
let redis;
// Redis instance
if(process.env.NODE_ENV !== "production") {
  redis = new Redis({
    "port":6379,
    "host":"localhost"
  })
} else {
  redis = new Redis(process.env.REDIS_URL);
}
 
async function getTokenCirculatingSupply(network, contractAddress) {

var url = `https://api.polygonscan.com/api?module=stats&action=tokenCsupply&contractaddress=${contractAddress}&apikey=${process.env.POLYGONSCAN_API_KEY}`;

if(network === "ethereum") {
  url = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;
}

if(network === "bsc") {
  url = `https://api.bscscan.com/api?module=stats&action=tokenCsupply&contractaddress=${contractAddress}&apikey=${process.env.BSCSCAN_API_KEY}`;
}

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`tokenCirculatingSupply:${network}+${contractAddress}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`tokenCirculatingSupply:${network}+${contractAddress}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTokenCirculatingSupply;

