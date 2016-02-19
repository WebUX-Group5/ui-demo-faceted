(function () {
  'use strict';
  angular.module('FacetedUI')
    .directive('mainwordcloudGuiItem', [
      function () {
        return {
          template: '<div></div>',
          replace: true,
          scope: {
            buckets: '=',
            bind: '='
          },
          link: function (scope, element, attrs, ctrl) {

            scope.buckets; // these are the buckets passed in as attribute
            scope.bind;

            // here you can do more things to initialise the 'scope' of the
            // directive

            // e.g. some extra value
            scope.mytext = 'mainwordcloud';

            var width = 100;
            var height = 80;

            var x = d3.scale.linear().range([0, width]);
            var y = d3.scale.ordinal().rangeBands([0, height], .1);

            var svg = d3.select(element[0])
              .append('svg')
              .attr('preserveAspectRatio', 'xMaxYMin meet')
              .attr('viewBox', '0 0 ' + (width + 75) + ' ' + height)
              .append('g');

            scope.$watch('bind', function (data) {

              if (data) {

                x.domain([0, d3.max(data, function (d) {
                  //return d.score;
                  return d.doc_count;
                })]);

                y.domain(data.map(function (d) {
                  return d.key;
                }));

                var bars = svg.selectAll('rect')
                  .data(data, function (d, i) {
                    return Math.random();
                  });

                // d3 enter fn binds each new value to a rect
                bars.enter()
                  .append('rect')
                  .attr('class', 'bar rect')
                  .attr('y', function (d) {
                    return y(d.key);
                  })
                  .attr('height', y.rangeBand())
                  .attr('width', function (d) {
                    return x(d.doc_count.toFixed(2));
                  });

                // wire up event listeners - (registers filter callback)
                bars.on('mousedown', function (d) {
                  scope.$apply(function () {
                    (scope.onClick || angular.noop)(scope.field, d.key);
                  });
                });

                // d3 exit/remove flushes old values (removes old rects)
                bars.exit().remove();

                var labels = svg.selectAll('text')
                  .data(data, function (d) {
                    return Math.random();
                  });

                labels.enter()
                  .append('text')
                  .attr("font-size", "8px")
                  .attr('y', function (d) {
                    return y(d.key) + y.rangeBand() / 2;
                  })
                  .attr('x', function (d) {
                    return x(d.doc_count.toFixed(0)) + 3;
                  })
                  .attr('dy', '.35em')
                  .attr('text-anchor', function (d) {
                    return 'start';
                  })
                  .text(function (d) {
                    return d.key + ' (' + d.doc_count.toFixed(0) + ')';
                  });

                // d3 exit/remove flushes old values (removes old rects)
                labels.exit().remove();
              }
            })

          }
        };
      }]
    );
}());

