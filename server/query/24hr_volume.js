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

async function getDailyVolume(network, tokenAddress, swap, since, before) {

  const query = `
  {
    twenty_four_hour: ethereum(network: ${network}){
      dexTrades(
        options: {desc: "timeInterval.hour"}
        baseCurrency: {is: "${tokenAddress}"}
        exchangeName: {is: "${swap}"}
        time: {since: "${since}", before: "${before}"}
      ){
        timeInterval{
          hour
        }
        trades: count
        tradeAmount(in: USD)
      }
    }
  }
`;

// 2021-09-22T14:39:00Z
const url = "https://graphql.bitquery.io/";

const opts = {
  method: "POST",
  headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.API_KEY
  },
  body: JSON.stringify({
      query
  })
};

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`tokenDailyVolume:${network}+${tokenAddress}+${swap}+${since}+${before}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 1 minute
redis.set(`tokenDailyVolume:${network}+${tokenAddress}+${swap}+${since}+${before}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getDailyVolume;

