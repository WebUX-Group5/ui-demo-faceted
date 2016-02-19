(function () {
  'use strict';

  var app = angular.module('FacetedUI');

  app.service('queryBuilderService', [function () {
    var clauseGenerators = {};
    this.query = {};
    this.queryDSL = {};
    this.aggregations = {};

    this.facets = {};

    function termClause(query, facet) {
      var clause = {},
        value,
        key = facet.query.key || facet.query.field;
      value = query[key];
      clause[facet.query.type] = {};
      clause[facet.query.type][facet.query.field] = value;
      return clause;
    }

    function analysedTermClause(query, facet) {
      var clause = {},
        value,
        key = facet.query.key || facet.query.field;
      value = query[key].toLowerCase();
      clause.term = {};
      clause.term[facet.query.field] = value;
      return clause;
    }

    function rangeClause(query, facet) {
      var clause = {},
        value = query[facet.query.field],
        range;

      if (typeof value === 'object') {
        // value is object - expect min and max values
        range = {
          gte: parseInt(value.min),
          lt: parseInt(value.max)
        };
      } else {
        // not an object - expect a number & use interval from config
        range = {
          gte: parseInt(value),
          lt: parseInt(value) + facet.query.interval
        };
      }
      clause.range = {};
      clause.range[facet.query.field] = range;
      return clause;
    }

    function multiSelect(query, facet) {
      var clause, clauses = [],
        value,
        key = facet.query.key || facet.query.field;
      for (value in query[key]) {
        if (query[key][value]) {
          clause = {term: {}};
          clause.term[facet.query.field] = value;
          clauses.push(clause);
        }
      }
      return clauses.length ? {or: clauses} : false;
    }

    clauseGenerators.term = termClause;
    clauseGenerators.analysedTerm = analysedTermClause;
    clauseGenerators.range = rangeClause;
    clauseGenerators.multiTerm = multiSelect;

    /**
     * Construct the queryDSL with aggregations-part and query-part,
     * depending on the configured facets and the current query-context.
     */
    this.buildQueryDSL = function (query) {
      var key,
        facet,
        facets = this.facets,
        clauses = [],
        clause,
        queryDSL = {
          body: {
            aggregations: {}
          }
        };

      // Add aggregations of facets to query
      for (key in facets) {
        facet = facets[key];
        if (facet.aggregation) {
          queryDSL.body.aggregations[key] = facet.aggregation;
        }
      }

      // Build query clause
      for (key in facets) {
        facet = facets[key];
        if (query[key] && facet.query) {
          // the field is set in the query, so we set up the
          // filter in queryDSL

          // Create the suitable clause depending on facet type
          clause = clauseGenerators[facet.query.type](query, facet);
          if (clause) {
            clauses.push(clause);
          }
        }
      }

      // If query is non-empty, add it to the request-parameters
      if (clauses.length) {
        queryDSL.body.query = {
          filtered: {
            filter: {
              and: clauses
            }
          }
        };
      }

      return queryDSL;
    };

    /**
     * Add / set a facet configuration
     */
    this.setFacetConfig = function (name, query, aggregation) {
      this.facets[name] = {query: query, aggregation: aggregation};
    };

    /**
     * Clear one facet configuration or all of them.
     */
    this.clearFacetConfig = function (name) {
      if (typeof name !== 'undefined') {
        delete this.facets[name];
      } else {
        this.facets = {};
      }
    };

    /**
     * names of aggregations
     */
    this.getAggregationKeys = function () {
      var l = [], kn;
      for (kn in this.facets) {
        if (this.facets[kn].aggregation) {
          l.push(kn);
        }
      }
      return l;
    };

    /**
     * names of aggregations for which we want a separate query
     */
    this.getAggregationMultiKeys = function () {
      var l = [], kn;
      var multikeys = ['party', 'date'];  // TODO: read this from the configuration
      for (kn in this.facets) {
        if (this.facets[kn].aggregation &&
          multikeys.indexOf(kn) !== -1) {
          l.push(kn);
        }
      }
      return l;
    };

  }]);

})();
