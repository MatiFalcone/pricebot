const { ApolloServer, gql } = require("apollo-server-express");
const TokenService = require("./datasources/file");
const APIService = require("./datasources/api");
const GraphQLService = require("./datasources/graphql");

const express = require("express");
const app = express();

const typeDefs = gql`

    type Query {
      tokens (
        symbol: String
        name: String
        decimals: Int
        address: String
        blockHeight: Int
      ): [Token],
      getTokenBySymbol(symbol: String): Token,
      persons: [Person]
    }

    type Token {
      symbol: String!
      name: String!
      decimals: Int!
      address: String!
      blockHeight: Int!
    }

    type Person {
      gender: String
      email: String
      phone: String
    }

    # Mutations
    
    type Mutation {
      createToken(symbol: String!, name: String!, decimals: Int!, address: String!, blockHeight: Int!): Token! 
    }

`;

const dataSources = () => ({
    tokenService: new TokenService(),
    apiService: new APIService(),
    graphQLService: new GraphQLService()
})

const resolvers = {
    Query: {
        tokens: (parent, args, { dataSources }, info) => {
            return dataSources.tokenService.getTokens(args);
        },
        getTokenBySymbol: (parent, { symbol }, { dataSources }, info) => {
            return dataSources.tokenService.getTokenBySymbol(symbol)[0];
        },
        persons: (parent, args, { dataSources }, info) => {
            return dataSources.apiService.getPerson();
        }
    },
    Mutation: {
        createToken(parent, args) {
            const newToken = args;
            tokens.push(newToken);
            return newToken;
        }
    }
}

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    dataSources
});

server.applyMiddleware({ app });

app.listen({ port: 3001 }, () => {
    console.log(`Server ready at http://localhost:3001${server.graphqlPath}`);
});