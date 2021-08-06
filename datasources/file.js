const { DataSource } = require('apollo-datasource');
const tokens = require("../data/data");
const _ = require("underscore");

class TokenService extends DataSource {
  
  constructor() {
    super();
    //this.baseURL = 'https://randomuser.me/api/';
  }

  getTokens(args) {
    //const { results } = await this.get("");
    return _.filter(tokens,args);
  }

  getTokenBySymbol(symbol) {
    return tokens.filter(function(token) {
      return token.symbol === symbol;
    })
  }

}

module.exports = TokenService;