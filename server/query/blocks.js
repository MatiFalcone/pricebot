const fetch = require("node-fetch");

async function getMaticBlockNumber(timestamp) {

    const query = `
      query blocks {
        blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: {timestamp_gt: ${timestamp-180000}, timestamp_lt: ${timestamp-120000}}) {
          number
        }
      }
  `;
  
  const url = "https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks";
  
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
  
  const response = await fetch(url, opts);
  const data = await response.json();
  return data;
  
  }

  module.exports = getMaticBlockNumber;