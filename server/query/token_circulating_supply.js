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
 
async function getTokenCirculatingSupply(contractAddress) {

const url = `https://api.polygonscan.com/api?module=stats&action=tokenCsupply&contractaddress=${contractAddress}&apikey=${process.env.POLYGONSCAN_API_KEY}`;

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`tokenCirculatingSupply:${contractAddress}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`tokenCirculatingSupply:${contractAddress}`, JSON.stringify(data), "EX", 300);
return data;

}

module.exports = getTokenCirculatingSupply;

