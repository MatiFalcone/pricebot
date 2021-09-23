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
 
async function getTokenInfo(network, tokenAddress, exchangeAddress) {

  const query = `
{
  ethereum(network: ${network}) {
    dexTrades(
      options: {desc: ["block.height","tradeIndex"], limit: 1}
      exchangeName: {in: ["${exchangeAddress}"]}
      baseCurrency: {is: "${tokenAddress}"}
      date: {since: null, till: null}
    ) {
      transaction {
        hash
      }
      tradeIndex
      smartContract {
        address {
          address
        }
        contractType
        currency {
          name
        }
      }
      tradeIndex
      block {
        height
      }
      baseCurrency {
        name
        symbol
        address
        decimals
      }
      quoteCurrency {
        name
        symbol
        address
      }
      quotePrice
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
let cacheEntry = await redis.get(`tokenInfo:${tokenAddress}+${exchangeAddress}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`tokenInfo:${tokenAddress}+${exchangeAddress}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTokenInfo;

