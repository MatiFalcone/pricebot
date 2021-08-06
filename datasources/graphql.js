const { GraphQLDataSource } = require("apollo-datasource-graphql");
const { gql } = require("apollo-server-express");

const getProductsQuery = gql`
{
    products {
      id
      description
      name
      price
      slug
    }
  }
`;

class GraphQLService extends GraphQLDataSource {

    constructor() {
        super();
        //this.baseURL = "https://graphql.bitquery.io/";
        this.baseURL = "https://api-eu-central-1.graphcms.com/v2/ck8sn5tnf01gc01z89dbc7s0o/master";
    }

    async getProducts() {
        const { data } = await this.query(getProductsQuery);
        return data.products;
    }

}

module.exports = GraphQLService;