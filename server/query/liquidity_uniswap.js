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

async function getTokenLiquidityUniswap(tokenAddress) {

  const query = `
  {
    tokens(where: {id: "${tokenAddress}"}) {
      totalLiquidity
    }
  }
`;

const url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

const opts = {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.API_KEY_THE_GRAPH
    },
    body: JSON.stringify({
        query
    })
};

// Check if I have a cache value for this response
let cacheEntry = await redis.get(`tokenLiquidityUniswap:${tokenAddress}`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 1 minute
redis.set(`tokenLiquidityUniswap:${tokenAddress}`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTokenLiquidityUniswap;

