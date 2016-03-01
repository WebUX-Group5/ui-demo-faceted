(function () {
  'use strict';

  var app = angular
    .module('FacetedUI', [
      'elasticsearch',
      'elasticui',
      'dangle',
      'debounce',
      'rzModule'
    ]);

  // Config for elastic-UI
  app.constant('euiHost', 'http://localhost:9200'); // ACTION: change to cluster address

  // esFactory() creates a configured client instance. Turn that instance
  // into a service so that it can be required by other parts of the application
  app.service('esClientJs', ['esFactory', function (esFactory) {
    return esFactory({
      host: 'localhost:9200/opendata',
      //apiVersion: '1.2',
      log: 'trace'
    });
  }]);

  app.service('esClientPythonProxy', ['$http', function ($http) {
    function esClient(host) {
      this.search = function search(dsl) {
        return $http.post(host, JSON.stringify(dsl))
          .then(function(response) {
            return response.data;
          });
      }
    };
    return new esClient('http://localhost:5000/search');
  }]);

  app.factory('esClient', [
  'esClientJs', 'esClientPythonProxy', 'Config',
  function(esClientJs, esClientPythonProxy, Config) {
    var dependencyConfig = Config.esClient;
    var implementations = {
      js: esClientJs,
      py: esClientPythonProxy
    };
    var client = implementations[dependencyConfig];
    return client;
  }]);

  /**
   * Map aggregation part of an elastic result to the format that
   * dangle wants for its date-historgram
   */
  function dangleMapHistoData(data) {
    return {
      _type: 'date_histogram',
      entries: data.buckets.map(function (r) {
        return {time: r.key, count: r.doc_count};
      })
    };
  }

  /**
   * Passing data to the Tree Diagram
   */
  function mainTreeMapDiagramData(data) {
    return {
      _type: 'name',
      entries: data.buckets.map(function (r) {
        return {main: r};
      })
    };
  }

  //
  // Demo controller
  app.controller('FacetedDemoController', ['$scope', '$log', '$filter', 'esClient',
    'queryBuilderService', 'debounce',
    function ($scope, $log, $filter, esClient, queryBuilderService, debounce) {
      var self = this;
      var minValue = 0, maxValue = 100000;

      this.results = [];
      this.aggregations = {};
      this.query = {};
      this.queryDSL = {};
      this.lastQueryTime = 0;
      this.statusOk = true;
      this.statusInProgress = false;
      this.tabsOpen = ['text'];

      // Constants
      this.roleLongname = {
        abg: 'Member of Parl.',
        other: 'Other',
        pres: 'President'
      };

      // Configure facets
      queryBuilderService.setFacetConfig('party',
        {field: 'current_party', type: 'multiTerm', key: 'party'},
        {terms: {field: 'current_party'}});

      queryBuilderService.setFacetConfig('llp',
        {field: 'llp', type: 'term'},
        {terms: {field: 'llp'}});

      // Simple query config for role
      // queryBuilderService.setFacetConfig('role',
      //   {field: 'role', type: 'term'},
      //   {terms: {field: 'role'}
      // });

      //
      // Set up multiple configurations for the 'role' field (one has a nested
      // aggregation). Use the changeConfig method to switch between the two.
      //
      var roleconfigs = {
        full: [
          {field: 'role', type: 'term'},
          {terms: {
            field: 'role',
            min_doc_count: 10
            },
             aggregations: {
               toptags: {
                 terms: {
                   field: 'text',
                   exclude: 'gelangt|abgeordnet|dr|redn|mag|1|2|3|4|5|6|7|8|9|10|minut|schon|mehr|ganz|gibt|bitt|nach|wort|ja|dass|sag|uns|dam|gut|imm|hoh'
                 }
               }}
             }],
        fast: [
          {field: 'role', type: 'term'},
          {terms: {
            field: 'role',
            min_doc_count: 10
            }}]
      };
      queryBuilderService.setFacetConfig('role', roleconfigs.fast[0],
        roleconfigs.fast[1]);

      queryBuilderService.setFacetConfig('occupation',
        {field: 'occupation', type: 'term'},
        {terms: {field: 'occupation'}});

      queryBuilderService.setFacetConfig('freetext',
        {field: 'text', type: 'analysedTerm', key: 'freetext'},
        false);

      //
      // Query and aggregation by date
      queryBuilderService.setFacetConfig('duration',
        {field: 'duration', type: 'range', interval: 180},
        {
          histogram: {
            field: 'duration', interval: 180, min_doc_count: 10
          }
        });

      queryBuilderService.setFacetConfig('date',
        {field: 'date', type: 'range'},
        {
          'date_histogram': {
            field: 'date',
            interval: 'month'
          }
        });

      //
      // This configuration is used by the tree-diagram
      //
      queryBuilderService.setFacetConfig('name',
        {field: 'name', type: 'term'},
        {
          terms: {
            field: "current_party",
            // exclude: "",
            //size: 0
          },
          aggregations: {
            roletype: {
              terms: {
                field: "name",
                order: {"_term": "desc"}
                //include: "([a-z]?[.][a-z]+)",
                //size: 200
              },
              aggregations: {
                durationtotals: {
                  histogram: {
                    field: 'duration', interval: 180, min_doc_count: 1
                  }
                }
              }
            }
          }
        });

      // Reuqest the date once more ,  this time it will fetched from
      // the primary query-context and thus be affected by the query context
      queryBuilderService.setFacetConfig('dateLimited',
        false,
        {
          'date_histogram': {
            field: 'date',
            interval: 'month'
          }
        });

      /**
       * This is a demo method that shows that aggregations can easily be
       * changed on the fly.
       */
      function useNestedAggregationForRoleFacet(status) {
        if(status) {
          queryBuilderService.setFacetConfig('role',
            roleconfigs.full[0], roleconfigs.full[1]);
        } else {
          queryBuilderService.setFacetConfig('role',
            roleconfigs.fast[0], roleconfigs.fast[1]);
        }
      }

      this.updateHiddenChartSetting = function() {
        useNestedAggregationForRoleFacet(this.showHiddenChart);
        this.refresh();
      }


      /**
       * Set values/results from a es-result to the scope of the controller
       */
      function bringAggregationsIntoScope(agglist, aggResult) {
        var j;
        for (j = 0; j < agglist.length; j++) {
          if (agglist[j] in aggResult) {
            self.aggregations[agglist[j]] = aggResult[agglist[j]];
          }
        }
      }

      /**
       * Various stuff that we want to do with the query after it has
       * changed (+before actually submitting)
       *
       * Note : is now more like some kind of prepare-query method
       */
      function cleanQuery() {
        // Cleanup the party field
        if (self.query.party) {
          for (var pk in self.query.party) {
            if (!self.query.party[pk]) {
              delete self.query.party[pk];
            }
          }
          if (!Object.keys(self.query.party).length) {
            delete self.query.party;
          }
        }

        // apply the slider settings to query - if something is set
        if (self.useDateSlider &&
          (self.dateSlider.min !== false || self.dateSlider.max !== false) &&
          (self.dateSlider.min !== self.dateSliderOptions.floor ||
          self.dateSlider.max !== self.dateSliderOptions.ceil)) {
          self.query.date = {
            min: self.dateSlider.min,
            max: self.dateSlider.max
          };
        } else {
          if (self.query.date) {
            delete self.query.date;
          }
        }
      }

      /**
       * Issue a separate call, excluding just one facet
       * (to have the full, non-restricted view on that facet
       */
      function extraFacetRequest(excludefacet, query) {
        var extraquery = {},
          dsl = {},
          queryitems = Object.keys(query);

        // Copy the query except for the excludefacet
        for (var k = 0; k < queryitems.length; k++) {
          if (queryitems[k] !== excludefacet) {
            extraquery[queryitems[k]] = query[queryitems[k]];
          }
        }

        // TODO : we could build a different, stripped-down query, because
        // all we're interested is that one aggregation of the excludefacet
        dsl = queryBuilderService.buildQueryDSL(extraquery);
        return esClient.search(dsl)
          .then(function (body) {
            bringAggregationsIntoScope([excludefacet], body.aggregations);
          })
          .catch(function (error) {
            // self.statusOk = false;
            // self.statusInProgress = false;
            $log.error(error);
          });
      }

      this.tabIsShown = function (what) {
        return this.tabsOpen.indexOf(what) !== -1;
      };

      this.showTab = function (what) {
        this.tabsOpen = [what];
      };

      /**
       * Return current content of freetext-search.
       */
      this.getQueryText = function () {
        return (this.query.freetext);
      };

      /**
       * remove a filter/facet from query context
       */
      this.resetField = function (name) {
        if (name in this.query) {
          delete this.query[name];
          this.refresh();
        }
      };

      /**
       * reset query context completely
       */
      this.resetQuery = function () {
        // Hack : also reset the slider value, that we keep separately
        // for now:
        this.dateSlider = {min: false, max: false};
        this.useDateSlider = false;

        this.query = {};
        this.refresh();
      };

      /**
       * test for empty/non-empty query context (are any filters set?)
       */
      this.queryIsEmpty = function () {
        return Object.keys(this.query).length === 0;
      };

      /**
       * test if a facet/field is set in the current query
       */
      this.queryContains = function (what) {
        return this.query.hasOwnProperty(what);
      };

      /**
       * refresh results / build query and issue a call to search-backend
       */
      this.refresh = function () {
        self.statusInProgress = true;

        // Apply some filters etc on query
        cleanQuery();

        // build queryDSL
        self.queryDSL = queryBuilderService.buildQueryDSL(self.query);

        // Make request to search-backend
        esClient.search(self.queryDSL)
          .then(function (body) {
            var mainaggs = [], specialaggs = [];
            self.statusOk = true;
            self.statusInProgress = false;
            self.results = body.hits.hits;
            self.lastQueryTime = body.took;
            self.hits = body.hits.total;

            // Find those aggregations that we really want to take
            // into scope with the first query
            specialaggs = queryBuilderService.getAggregationMultiKeys();
            mainaggs = queryBuilderService.getAggregationKeys()
              .filter(function (v) {
                return specialaggs.indexOf(v) === -1;
              });
            bringAggregationsIntoScope(
              mainaggs,
              body.aggregations
            );

            // Further prepare result as needed
            // (some components need the results in diferent form)
            self.dangleDateHisto = dangleMapHistoData(self.aggregations.dateLimited);
            self.mainTreeDiagram = mainTreeMapDiagramData(self.aggregations.name);
          })
          .catch(function (error) {
            self.statusOk = false;
            self.statusInProgress = false;
            $log.error(error);
          });

        // Make separate requests for facets for which we want to
        // have the un-restricted bucket
        // TODO : read from configuration , i.e. do that for all facets
        // that are in  queryBuilderService.getAggregationMultiKeys()
        extraFacetRequest('party', self.query);
        extraFacetRequest('date', self.query)
          .then(function() {
            // Separate request for the date
            // Set new values to our slider and the 'full-date' histogram
            // (which is not affected by the date query)
            var agg = self.aggregations.date, dummy;
            self.dangleFullDateHisto = dangleMapHistoData(agg);

            self.dateSliderOptions.floor =
              agg.buckets[0].key;
            self.dateSliderOptions.ceil =
              agg.buckets[agg.buckets.length - 1].key;

            if (self.dateSlider.min < self.dateSliderOptions.floor) {
              self.dateSlider.min = self.dateSliderOptions.floor;
            }

            if (self.dateSlider.max > self.dateSliderOptions.ceil) {
              self.dateSlider.max = self.dateSliderOptions.ceil;
            }

            if (self.dateSlider.min > self.dateSlider.max) {
              dummy = self.dateSlider.min;
              self.dateSlider.min = self.dateSlider.max;
              self.dateSlider.max = dummy;
            }

          });
      };

      // Convert party strings to proper case (available through scope)
      $scope.convertPartyCase = function (party) {
        if (party == 'grüne') {
          return 'Grüne';
        }
        if (party == 'none') {
          return 'None';
        }
        return party.toUpperCase();
      };

      /**
       * Use debounce to make a refresh-function that will wait some time
       * before it actually triggers refresh (useful for fields with
       * text input to not trigger multiple requests when the user is still
       * typing.
       */
      this.debounceRefresh = debounce(this.refresh, 500);

      $scope.myController = this;

      //Fires every time the user changes the range value on the dc chart duration histogram
      $scope.setMinMaxValues = function (min, max) {
        //debugger;
        $scope.myController.minValue = min;
        $scope.myController.maxValue = max;


        //$scope.myController.refresh();
      };


      // Init slider (TODO: do somewhere else)
      this.useDateSlider = false;
      this.dateSliderOptions = {
        floor: 0,
        ceil: 1,
        onChange: this.debounceRefresh,
        translate: function (v) {
          return v !== false ?
            $filter('date')(v, 'dd.MM.yy') : '-';
        }
      };
      this.dateSlider = {
        min: false,
        max: false
      };


      // Initialise with call to refresh
      this.refresh();
    }]);
})();
