import { ApolloServer, gql } from "apollo-server";

const typeDefs = gql`
  type LeaseCalculation {
    monthlyPayment: Float!
  }

  type CalculateLeasePayload {
    calculation: LeaseCalculation
  }

  input CalculateLeaseInput {
    purchasePrice: Float!
  }

  type Query {
    calculateLease(input: CalculateLeaseInput!): CalculateLeasePayload
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
