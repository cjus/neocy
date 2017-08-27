/**
 * @name Transaction
 * @description handle transactions
 */
'use strict';

const ServerRequest = require('./server-request');
const TransactionPath = '/db/data/transaction';

class Transaction {
  /**
    * @name constructor
    * @param {string} host - server host
    * @param {number} port - server port (i.e. 7474)
    * @param {string} auth - Authorization string
   */
  constructor(host, port, auth) {
    this.used = false;
    this.auth = auth;
    this.host = host;
    this.port = port;
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
        host: this.host,
        port: this.port,
        path: TransactionPath,
        method: 'post',
        body: JSON.stringify({
          statements: this.statements
        })
      };
      let result = {};
      let serverRequest = new ServerRequest();
      serverRequest.send(options)
        .then((res) => {
          if (res.statusCode !== ServerRequest.HTTP_OK && res.statusCode !== ServerRequest.HTTP_CREATED) {
            let serverRequest = new ServerRequest();
            serverRequest.send(Object.assign(options, {
              method: 'delete'
            }));
            throw new Error('Query failed to return OK or CREATED');
          }
          return JSON.parse(res.payLoad.toString('utf8'));
        })
        .then((json) => {
          if (json.errors.length > 0) {
            throw json.errors[0].message;
          } else {
            result = json.results;
            let serverRequest = new ServerRequest();
            return serverRequest.send(Object.assign(options, {
              path: json.commit,
              method: 'post',
              body: ''
            }));
          }
        })
        .then((res) => {
          if (res.statusCode === ServerRequest.HTTP_OK) {
            resolve(result);
          } else {
            throw new Error('Transaction commit failed');
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

module.exports = Transaction;
