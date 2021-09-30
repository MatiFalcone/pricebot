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

async function getTotalValueLockedApe() {

  const query = `
  {
    uniswapFactories(first: 1) {
      totalLiquidityUSD
    }
  }  
`;

const url = "https://api.thegraph.com/subgraphs/name/tapswapv2/apeswap-subgraph";

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
let cacheEntry = await redis.get(`totalValueLockedApe:`);

// If we have a cache hit
if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    // return that entry
    return cacheEntry;
}

const response = await fetch(url, opts);
const data = await response.json();
// Save entry in cache for 1 minute
redis.set(`totalValueLockedApe:`, JSON.stringify(data), "EX", 10);
return data;

}

module.exports = getTotalValueLockedApe;

