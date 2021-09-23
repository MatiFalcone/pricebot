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
 
async function getEthPrice() {

const url = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHERSCAN_API_KEY}`;

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`ethPrice:`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`ethPrice:`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getEthPrice;

