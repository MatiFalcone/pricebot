const Web3 = require('web3');
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
 
async function getContractABI(network, contractAddress) {

  var url = "";

  /*
  if(network === "matic") {
    url = `https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.POLYGONSCAN_API_KEY}`;
  }
  */

  if(network === "ethereum") {
    url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;
  }

  if(network === "bsc") {
    url = `https://api.bscscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BSCSCAN_API_KEY}`;
  }
            
  const response = await fetch(url);
  const data = await response.json();
  return data;
        
}

async function getDecimals(network, contractAddress) {

  var web3;

  /*
  if(network === "matic") {
    web3 = new Web3(`https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
  }
  */

  if(network === "ethereum") {
    web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
  }

  if(network === "bsc") {
    web3 = new Web3(`https://apis.ankr.com/${process.env.ANKR_API_KEY}/binance/full/main`);
  }
  
  // Check if I have a cache value for this response
  let cacheEntry = await redis.get(`decimals:${network}+${contractAddress}`);

  // If we have a cache hit
  if (cacheEntry) {
      cacheEntry = JSON.parse(cacheEntry);
      // return that entry
      return cacheEntry;
  }

  var contractABI = await getContractABI(network, contractAddress);

  if (contractABI != ''){
      var myContract = new web3.eth.Contract(JSON.parse(contractABI.result), contractAddress);
      var tokenDecimals = await myContract.methods._decimals.call().call();

  } else {
      console.log("Error" );
  }            
    
  redis.set(`decimals:${network}+${contractAddress}`, JSON.stringify(tokenDecimals), "EX", 10);

  return tokenDecimals;

}

module.exports = getDecimals;