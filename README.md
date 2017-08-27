# neocy
Neo4j Cypher library using promises and transactions.

## Usage

For simple transactions:

```javascript
const Neo4j = require('neocy');
let neo4j = new Neo4j();
neo4j.init('127.0.0.1', 7474, 'neo4j', 'password');

let result;
try {
  result = await neo4j.simpleTransaction([
    'MATCH (u:User {uid: {params}.uid})',
    'RETURN u'
  ], {
    params: {
      uid: '134'
    }
  });
} catch (error) {
  result = {
    error
  };
}
return result || {};
```

For more complicated transactions involving mulitple queries:

```javascript
const Neo4j = require('neocy');
let neo4j = new Neo4j();
neo4j.init('127.0.0.1', 7474, 'neo4j', 'password');

let users = [
  {
    uid: "111",
    name: "John Smith"
  },
  {
    uid: "134",
    name: "Carlos Justiniano"
  },
];
let transaction = neo4j.createTransaction();

users.forEach((user) => {
  let q = neo4j.createQueryBuilder();
  q.add([
    'CREATE (u:User {uid: {params}.uid, name: {params}.name})'
  ]);
  transaction.addQuery(q, {
    params: user
  });
});

let result;
try {
  result = await neo4j.getSimpleListData(await transaction.execute());
} catch (error) {
  result = {
    error
  };
}
return result || {};
```

#### API

| Method | Description | Notes |
| --- | --- | --- |
| init | Initialize Neo4j Graph Database | Required |
| createTransaction | Creates a transaction object | See Transaction API section |
| createQueryBuilder | Creates a new query builder object | See Query Build API section |
| getSimpleData | Helper to extract simple data responses | Simple data is defined as a single return value.  A single object qualifies |
| getSimpleListData | Helper to extract simple arrat of data responses | Similar to getSimpleData but returns and array of objects |
| toProps | Convert an object of properties to a property query string | |
| toNamedProps | Converts a named object to a cypher compatible key / value pair | |
| toSets | Converts an object to a cypher compatible list of set statements | |
| simpleTransaction | Performs a simple transaction consisting of only a single transactions. | |

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
