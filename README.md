# neocy
Neo4j Cypher library using promises and transactions.

## Usage
```javascript
const Neo4j = require('neocy');
let neo4j = new Neo4j();
neo4j.initGraphDB('http://127.0.0.1:7474', 'neo4j', 'password');
```

## APIs
This module contains a core exported class Neo4j. In turn it also creates `Transaction` and `QueryBuilder` objects.

#### Core API

| Method | Description | Notes |
| --- | --- | --- |
| initGraphDB | Initialize Neo4j Graph Database | Required |
| createTransaction | Creates a transaction object | See Transaction API section |
| createQueryBuilder | Creates a new query builder object | See Query Build API section |
| getSimpleData | Helper to extra simple data responses | Simple data is defined as a single return value.  A single object qualifies |
| toProps | Convert an object of properties to a property query string | |
| toNamedProps | Converts a named object to a cypher compatible key / value pair | |
| toSets | Converts an object to a cypher compatible list of set statements | |

#### Transaction API
| Method | Description | Notes |
| --- | --- | --- |
| addQuery | Appends a query to the transaction's list of query statements | Requires a Query Builder object and params |
| execute | Executes a transaction ||

#### Query Builder API

| Method | Description | Notes |
| --- | --- | --- |
| add | Adds a partial query statement | |
| toString | Returns the full query as a string ||

## Tests

The `specs` folder contains tests.

To run the tests you first need to install mocha:

```shell
$ npm install mocha -g
```

Then run:

```shell
$ npm run test
```
