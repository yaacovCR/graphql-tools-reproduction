import { ApolloServer, gql } from "apollo-server";

const typeDefs = gql`
  type Boundary {
    min: Int!
    max: Int!
  }

  type LeaseBoundaries {
    downPayment: Boundary!
  }

  type LeaseCalculation {
    balloonPayment: Float!
    monthlyPayment: Float!
  }

  type CalculateLeasePayload {
    calculation: LeaseCalculation
    boundaries: LeaseBoundaries
  }

  input CalculateLeaseInput {
    balloonPayment: Float!
    categoryId: ID!
    downPayment: Float!
    objectUsed: Boolean!
    objectYear: Int!
    operational: Boolean!
    purchasePrice: Float!
    tenor: Int!
    intermediaryToken: String!
  }

  type Query {
    calculateLease(input: CalculateLeaseInput!): CalculateLeasePayload!
  }
`;

const resolvers = {
  Query: {
    async calculateLease(parent: any, args: any): Promise<any> {
      const { purchasePrice } = args.input;

      return {
        calculation: {
          monthlyPayment: purchasePrice * 0.15,
        },
        boundaries: {
          downPayment: {
            min: purchasePrice * 0.1,
            max: purchasePrice - 1,
          },
        },
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🐝 Remote schema server ready at ${url}`);
});
