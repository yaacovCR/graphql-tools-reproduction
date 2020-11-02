# grapql-tools-reproduction

A repository for reproducing issues with graphql-tools.

## Installing

Install the dependencies:

```bash
yarn install
```

## Remote schema

Start the server that acts as the remote schema with:

```bash
yarn run start-remote
```

GraphQL Playground will be available at [http://localhost:4000](http://localhost:4000)

## Local schema

Start the server that acts as the public local schema with:

```bash
yarn run start-local
```

GraphQL Playground will be available at [http://localhost:4001](http://localhost:4001)

Sample query:

```
{
  leaseCalculation(input: {
    purchasePrice: 30000, 
    tenor: 36, 
    downPayment: 3000,
    balloonPayment: 1,
    object: {
      categoryId: "5",
      brand: "Volvo",
      type: "XF480",
      year: 2020,
      used: true
    },
    chamberOfCommerceNumber: "123456"
  }) {
    ... on LeaseCalculation {
      monthlyPayment
      boundaries {
        downPayment {
          min
          max
        }
      }      
    }
  }
}
```
