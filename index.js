/**
 * @name Neo4j
 * @description Neo4j Cypher library using promises and transactions.
 */
'use strict';

let Transaction = require('./transaction');
let QueryBuilder = require('./query-builder');

class Neo4j {
  constructor() {
    this.graphDatabaseUrl = '';
    this.graphDBPort = 7474;
    this.auth = '';
  }

  /**
  * @name init
  * @summary Initialize Neo4j Graph Database.
  * @param {string} graphDBUrl - path to Neo4j Graph Database
  * @param {number} graphdBPort - neo4j server port (i.e. 7474)
  * @param {string} userName - user name
  * @param {string} password - password
  */
  init(graphDBUrl, graphDBPort, userName, password) {
    this.graphDatabaseUrl = graphDBUrl;
    this.graphDBPort = graphDBPort;
    if (userName && password) {
      this.auth = new Buffer(userName + ':' + password).
        toString('base64').
        toString('utf8');
    }
  }

  /**
  * @name simmpleTransaction
  * @summary A simple transaction is one which does not consist of a single transaction
  * @param {array} statements - array of string template statements
  * @param {object} params - object containing template params
  * @return {object} promise - promise resolving to an array of results
  */
  simpleTransaction(statements, params) {
    return new Promise((resolve, reject) => {
      let transaction = this.createTransaction();
      let q = this.createQueryBuilder();
      q.add(statements);
      transaction.addQuery(q, params);
      transaction.execute()
        .then((result) => {
          resolve(this.getSimpleListData(result));
        })
        .catch(reject);
    });
  }

  /**
   * @name createTransaction
   * @description Creates a transaction object
   * @return {object} CypherTransaction
   */
  createTransaction() {
    return new Transaction(this.graphDatabaseUrl, this.graphDBPort, this.auth);
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
