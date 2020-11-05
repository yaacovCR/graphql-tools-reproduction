import { ApolloServer, gql } from "apollo-server";
import { delegateToSchema } from "@graphql-tools/delegate";
import { GraphQLSchema, print } from "graphql";
import { ExecutionParams } from "graphql-tools";
import { wrapSchema, introspectSchema, RenameTypes, HoistField, PruneSchema } from "@graphql-tools/wrap";
import { fetch } from "cross-fetch";

const typeDefs = gql`
  type ObjectTooOldError {
    message: String!
    code: Int!
    path: [String!]!
  }

  type LeaseCalculation {
    monthlyPayment: Float!
  }

  union LeaseCalculationPayload = LeaseCalculation | ObjectTooOldError

  input LeaseCalculationInput {
    purchasePrice: Float!
  }

  type Query {
    leaseCalculation(input: LeaseCalculationInput!): LeaseCalculationPayload
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
    transforms: [
      new HoistField('CalculateLeasePayload', ['calculation', 'monthlyPayment'], 'monthlyPayment'),
      // Pruning necessary because LeaseCalculation in the remote schema will now be empty, has to be pruned or schema will error
      // in a less minimal example (or if Hoisting is changed to copy rather than move the fields), this may be unnecessary
      new PruneSchema(),
      // Abstract types in the local schema that do not exist in the remote are automatically expanded to the concrete types
      // as long as the names of the concrete types in the local schema match that of the remote schema
      // but in this example, our new abstract type has the same name as the concrete type in the remote schema
      // so we need to rename the concrete type in the remote schema to match that of the local schema
      new RenameTypes((name) => {
        if (name === 'CalculateLeasePayload') {
          return 'LeaseCalculation';
        }
      }),
    ],
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
      } = args.input;

      const schema = await remoteSchema();
      const data = await delegateToSchema({
        schema: schema,
        operation: "query",
        fieldName: "calculateLease",
        args: {
          input: {
            purchasePrice,
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
