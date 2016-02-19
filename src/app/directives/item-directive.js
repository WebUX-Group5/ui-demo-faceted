(function () {
  'use strict';

  /**
   * Directive to display a speaker's statement (text, date, photo etc)
   */
  angular.module('FacetedUI')
    .directive('facetedGuiItem', [
      function () {
        return {
          templateUrl: 'directives/item.html',
          replace: true,
          scope: {
            itemGetter: '&item',    // using '&' to get a one-way-binding
            scoreGetter: '&score',
            queryText: '='
          },
          // link: function(scope, element, attrs, ctrl) {
          link: function (scope) {
            scope.item = scope.itemGetter();
            scope.score = scope.scoreGetter();

            // Convert seconds to minute / seconds
            scope.item.duration = Math.floor(scope.item.duration / 60)
              + ':' + String('00' + scope.item.duration % 60).slice(-2);


            scope.itemExpanded = false;
            scope.expandToggle = function() {
              scope.itemExpanded = !scope.itemExpanded;
            };
          }
        };
      }]
    );

  /**
   * An angular template - filter that highlights a specific term in a text
   */
  angular.module('FacetedUI')
    .filter('highlight', function ($sce) {
      return function (text, phrase) {
        if (phrase) {
          text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
            '<span class="highlighted">$1</span>');
        }
        return $sce.trustAsHtml(text);
      };
    });


}());

