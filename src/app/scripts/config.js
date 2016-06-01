(function () {
  'use strict';
  var app = angular.module('FacetedUI');

  /**
   * Configure to either use elasticsearch directly, or use a proxy
   * in between.
   * Set the 'esClient' option to either 'py' or 'js'.
   */
  app.constant('Config', {
    esClient: 'py',
    pyEndpoint: '/search',
    esEndpoint: '',
  });
}());
