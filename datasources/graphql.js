const { GraphQLDataSource } = require("apollo-datasource-graphql");
const { gql } = require("apollo-server-express");

const BIT_QUERY = gql`
  query {
    ethereum(network: bsc) {
      smartContractCalls(
        options: {asc: "block.height", limit: 2147483647}
        smartContractMethod: {is: "Contract Creation"}
        smartContractType: {is: Token}
        time: {after: "2021-08-03T00:00:00"}
      ) {
        block {
          height
        }
        smartContract {
          contractType
          address {
            address
          }
          currency {
            name
            symbol
            decimals
          }
        }
      }
    }
  }
`;

class GraphQLService extends GraphQLDataSource {

    constructor() {
        super();
        this.baseURL = "https://graphql.bitquery.io/";
    }

    async getTokens() {
        const { response } = await this.query(BIT_QUERY);
        return response;
    }

    willSendRequest(request) {
        const { accessToken } = this.context;
    
        if (!request.headers) {
          request.headers = {
            "Content-Type": "application/json",
            "X-API-KEY": "BQY5wayTu6KZOqVhwqhGLGBHqQfxPTKV"
          };
        }
        
        request.headers.authorization = accessToken;
    }

}

module.exports = GraphQLService;