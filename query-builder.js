/**
 * @name QueryBuilder
 * @description Query Builder helper
 */
'use strict';

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

module.exports = QueryBuilder;
