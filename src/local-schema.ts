import { ApolloServer, gql } from "apollo-server";
import { delegateToSchema } from "@graphql-tools/delegate";
import { GraphQLSchema, print } from "graphql";
import { ExecutionParams } from "graphql-tools";
import { wrapSchema, introspectSchema } from "@graphql-tools/wrap";
import { fetch } from "cross-fetch";

const typeDefs = gql`
  type LeaseBoundary {
    min: Float!
    max: Float!
  }

  type ObjectTooOldError {
    message: String!
    code: Int!
    path: [String!]!
  }

  type LeaseBoundaries {
    downPayment: LeaseBoundary!
  }

  type LeaseCalculation {
    monthlyPayment: Float!
    boundaries: LeaseBoundaries!
  }

  union LeaseCalculationPayload = LeaseCalculation | ObjectTooOldError

  input ObjectInput {
    categoryId: ID!
    brand: String!
    type: String!
    year: Int!
    used: Boolean!
  }

  input LeaseCalculationInput {
    purchasePrice: Float!
    tenor: Int!
    downPayment: Float!
    balloonPayment: Float!
    object: ObjectInput!
    chamberOfCommerceNumber: String!
  }

  type Query {
    leaseCalculation(input: LeaseCalculationInput!): LeaseCalculationPayload!
  }
`;

const executor = async ({ document, variables }: ExecutionParams) => {
  const query = print(document);
  const fetchResult = await fetch("http://localhost:4000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  return fetchResult.json();
};

const remoteSchema = async (): Promise<GraphQLSchema> => {
  const schema = await introspectSchema(executor);

  return wrapSchema({
    schema,
    executor,
  });
};

const resolvers = {
  LeaseCalculationPayload: {
    __resolveType(error: any) {
      if (error.code) {
        return "ObjectTooOldError";
      }

      return "LeaseCalculation";
    },
  },
  Query: {
    async leaseCalculation(
      parent: any,
      args: any,
      context: any,
      info: any
    ): Promise<any> {
      const {
        purchasePrice,
        tenor,
        downPayment,
        balloonPayment,
        object,
      } = args.input;

      const schema = await remoteSchema();
      const data = await delegateToSchema({
        schema: schema,
        operation: "query",
        fieldName: "calculateLease",
        args: {
          input: {
            purchasePrice,
            tenor,
            downPayment,
            balloonPayment,
            categoryId: object.categoryId,
            objectUsed: object.used,
            operational: false,
            intermediaryToken: "xVCsFmBV8ZNCZX7Adn8bWDsb",
          },
        },
        context,
        info,
      });
      console.log({ data });
      return data;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});
server.listen({ port: process.env.PORT || 4001 }).then(({ url }) => {
  console.log(`🐝 Local schema server ready at ${url}`);
});
