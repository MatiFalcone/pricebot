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
 
async function getTokenPriceIn(network, tokenAddress, exchangeAddress, quoteCurrency, since, till) {

  var quotes1 = " ";
  var quotes2 = " ";

  if(since !== "null") {
    quotes1 = `"`;
  }

  if(till !== "null") {
    quotes2 = `"`;
  }

  const query = `
{
  ethereum(network: ${network}) {
    dexTrades(
      options: {desc: ["block.height","tradeIndex"], limit: 1}
      exchangeName: {in: ["${exchangeAddress}"]}
      baseCurrency: {is: "${tokenAddress}"}
      quoteCurrency: {is: "${quoteCurrency}"}
      date: {since: ${quotes1}${since}${quotes1}, till: ${quotes2}${till}${quotes2}}
    ) {
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
        symbol
        decimals
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
let cacheEntry = await redis.get(`tokenPriceIn:${network}+${tokenAddress}+${quoteCurrency}+${since}+${till}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 5 minutes
redis.set(`tokenPriceIn:${network}+${tokenAddress}+${quoteCurrency}+${since}+${till}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTokenPriceIn;

