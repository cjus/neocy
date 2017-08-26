/**
 * @name Neo4j
 * @description Neo4j Cypher library using promises and transactions.
 * @author Carlos Justiniano
 */
'use strict';

const Promise = require('bluebird');
const fetch = require('node-fetch');

const HTTP_OK = 200;
const HTTP_CREATED = 201;

class QueryBuilder {
  constructor() {
    this.q = [];
  }

  /**
  * @name add
  * @summary Adds a partial query statement.
  * @param {string / array} partial - query fragment
  */
  add(partial) {
    if (partial.constructor === Array) {
      partial.forEach((element) => {
        this.add(element);
      });
      return;
    }
    this.q.push(partial);
  }

  /**
  * @name toString
  * @summary Returns the full query as a string.
  * @return {string} value - full query as a string
  */
  toString() {
    return this.q.join(' ').
      replace(/\s\s+/g, ' ').
      replace(/(?:\r\n|\r|\n|\t)/g,'').
      trim();
  }
}

class Transaction {
  /**
    * @name constructor
    * @param {string} transactionUrl - transaction URL
    * @param {string} auth - Authorization string
   */
  constructor(transactionUrl, auth) {
    this.used = false;
    this.auth = auth;
    this.transactionUrl = transactionUrl;
    this.statements = [];
  }

  /**
  * @name execute
  * @summary Returns the full query as a string.
  * @return {object} promise
  */
  execute() {
    return new Promise((resolve, reject) => {
      let headers = {
        'content-type': 'application/json',
        'Accept': 'application/json; charset=UTF-8',
        'Authorization': 'Basic ' + this.auth
      };
      let options = {
        headers,
        method: 'post',
        body: JSON.stringify({
          statements: this.statements
        })
      };
      let result = {};
      fetch(this.transactionUrl, options)
        .then((res) => {
          if (res.status !== HTTP_OK && res.status !== HTTP_CREATED) {
            fetch(this.transactionUrl, {
              headers,
              'method': 'delete'
            });
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then((json) => {
          if (json.errors.length > 0) {
            throw json.errors[0].message;
          } else {
            result = json.results;
            return fetch(json.commit, {
              headers,
              'method': 'post'
            });
          }
        })
        .then((res) => {
          if (res.status === HTTP_OK) {
            resolve(result);
          } else {
            throw new Error('commit failed');
          }
        })
        .catch((err) => {
          reject(new Error(err));
        });
      this.used = true;
    });
  }

  /**
   * @name addQuery
   * @summary Appends a query to the transaction's list of query statements.
   * @param {object} queryBuilder - query builder object
   * @param {object} params - object containing query parameters
   * @return {object} this - for chaining
   */
  addQuery(queryBuilder, params) {
    if (this.used) {
      throw new Error(`Can't reuse transaction`);
    }
    this.statements.push({
      statement: queryBuilder.toString(),
      parameters: params
    });
    return this;
  }
}

class Neo4j {
  constructor() {
    this.graphDatabaseUrl = '';
    this.auth = '';
  }

  /**
  * @name init
  * @summary Initialize Neo4j Graph Database.
  * @param {string} graphDBUrl - path to Neo4j Graph Database
  * @param {string} userName - user name
  * @param {string} password - password
  */
  init(graphDBUrl, userName, password) {
    this.graphDatabaseUrl = graphDBUrl;
    this.auth = '';
    if (userName && password) {
      this.auth = new Buffer(userName + ':' + password).toString('base64').toString('utf8');
    }
  }

  /**
   * @name createTransaction
   * @description Creates a transaction object
   * @return {object} pCypherTransaction
   */
  createTransaction() {
    return new Transaction(`${this.graphDatabaseUrl}/db/data/transaction`, this.auth);
  }

  /**
   * @name createQueryBuilder
   * @description Creates a new query builder object
   * @return {object} QueryBuilder
   */
  createQueryBuilder() {
    return new QueryBuilder();
  }

  /**
   * @name getSimpleData
   * @description Simple data is defined as a single return value.  A single object qualifies.
   * @param {object} result - result object
   * @returns {object} ret - response data
   */
  getSimpleData(result) {
    let ret = null;
    if (result) {
      result = result[0];
    }
    if (!result || !result.data || result.data.length === 0) {
      return ret;
    }
    if (result.columns.length === 1) {
      ret = (typeof result.data[0] === 'object') ? result.data[0].row[0] : result.data[0][0];
    }
    return ret;
  }

  /**
   * @name getSimpleListData
   * @description Returns a list of simple data
   * @param {object} result - result object
   * @returns {object} ret - response data
   */
  getSimpleListData(result) {
    let ret = null;
    if (result) {
      result = result[0];
    }
    if (!result || !result.data || result.data.length === 0) {
      return ret;
    }
    return result.data.map((row) => row.row[0]);
  }

  /**
  * @name toProps
  * @summary Convert an object of properties to a property query string.
  * @param {object} obj - object which will be converted to string of key/values
  * @return {string} string of neo4j cypher compatible key / values
  */
  toProps(obj) {
    let ret = [];
    let objKeys = Object.keys(obj);
    objKeys.forEach((k) => {
      if (typeof(obj[k]) === 'string') {
        ret.push(`${k}:"${obj[k]}"`);
      } else if (typeof(obj[k]) === 'number') {
        ret.push(`${k}:${obj[k]}`);
      } else if (typeof(obj[k]) === 'boolean') {
        ret.push(`${k}:${obj[k]}`);
      } else if (typeof(obj[k]) === 'array') {
        ret.push(`${k}:[]`);
      } else {
        throw new Error('property type not supported');
      }
    });
    return ret.join(', ');
  }

  /**
    * @name toNamedProps
    * @summary Converts a named object to a cypher compatible key / value pair.
    * @param {string} name - name of object
    * @param {object} obj - object which will be converted to string of key/values
    * @return {string} string of neo4j cypher compatible key / values
    */
  toNamedProps(name, obj) {
    let ret = [];
    let objKeys = Object.keys(obj);
    objKeys.forEach((k) => {
      ret.push(`${k}:{${name}}.${k}`);
    });
    return ret.join(', ');
  }

  /**
  * @name toSets
  * @summary Convert an object of properties to a group of set statements
  * @param {string} v - query varible
  * @param {string} objName - query param object name
  * @param {object} obj - object which will be converted
  * @note creates string in this format: "SET e.eid = {event}.eid"
  *       query must pass param object named event in the example above
  * @return {string} string of neo4j cypher compatible set statements
  */
  toSets(v, objName, obj) {
    let ret = [];
    let objKeys = Object.keys(obj);
    ret.push('\n');
    objKeys.forEach((k) => {
      ret.push(`  SET ${v}.${k} = {${objName}}.${k}`)
    });
    return ret.join('\n');
  }
}

module.exports = Neo4j;
