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
 
async function getBnbPrice() {

const url = `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${process.env.BSCSCAN_API_KEY}`;

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`bnbPrice:`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`bnbPrice:`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getBnbPrice;

