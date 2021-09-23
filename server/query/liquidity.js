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

async function getTokenLiquidity(network, quoteCurrency) {

  const query = `
  {
    ethereum(network: ${network}) {
      address(address: {is: "0x03F18135c44C64ebFdCBad8297fe5bDafdBbdd86"}) {
        balances(currency: {in: ["${quoteCurrency}"]}) {
          currency {
            symbol
          }
          value
        }
      }
    }
  }
`;

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
let cacheEntry = await redis.get(`tokenLiquidity:${blockNumber}+${tokenAddress}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 1 minute
redis.set(`tokenLiquidity:${blockNumber}+${tokenAddress}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTokenLiquidity;

