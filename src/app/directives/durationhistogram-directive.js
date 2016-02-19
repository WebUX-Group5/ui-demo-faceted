(function () {
  'use strict';
  angular.module('FacetedUI')
    .directive('durationhistogramGuiItem', [
      function () {
        return {
          templateUrl: 'directives/durationhistogram.html',
          replace: true,
          scope: {
            bind: '='
          },
          link: function (scope, element, attrs, ctrl) {

            // here you can do more things to initialise the 'scope' of your
            // directive

            // e.g. some extra value
            var minValue = 0;
            var maxValue = 100000;

            var maxCount = 0;

            //scope.mytext = 'rangehistogram';


            scope.$watch('bind', function (data) {

              if (data) {

                if (data.length > 0) {
                  minValue = parseInt(data[0].key);
                  maxCount = parseInt(data[0].doc_count);
                }
                var i;

                for (i = data.length - 1; i >= 0; i -= 1) {
                  if (data[i].doc_count <= 0) {
                    //console.log(data[i].key +"> " + data[i].doc_count);
                    data.splice(i, 1);
                  }
                }

                data.forEach(function (d, index, object) {
                  maxValue = parseInt(d.key);
                });

                //set the new min and max values for the elasticsearch query on duration
                scope.$parent.setMinMaxValues(minValue, maxValue);

                //console.log('Histogramm init!');
                //debugger;

                /******************************************************
                 * Step1: Create the dc.js chart objects & ling to div *
                 ******************************************************/

                var durationChart = dc.barChart("#dc-duration-histogram");


                /****************************************
                 *   Run the data through crossfilter    *
                 ****************************************/

                var facts = crossfilter(data);  // Gets our 'facts' into crossfilter
                data.forEach(function (d) {
                  //console.log(d.key +"> " + d.doc_count);
                });

                /******************************************************
                 * Create the Dimensions                               *
                 * A dimension is something to group or filter by.     *
                 * Crossfilter can filter by exact value, or by range. *
                 ******************************************************/

                // for voice_calls
                var durationValue = facts.dimension(function (d) {
                  //return Math.round(d.doc_count* 100);
                  return +d.key;
                });
                var durationValueGroup = durationValue.group().reduceSum(function (d) {
                  return d.doc_count;
                });
                //var durationValueGroup = durationValue.group();


                /***************************************
                 *   Step4: Create the Visualisation   *
                 ***************************************/
                var width = 300;
                var height = 200;
                var numberFormat = d3.format('.0f');

                // voice_calls bar graph
                durationChart
                  .width(width)
                  .height(height)
                  .margins({top: 10, right: 10, bottom: 20, left: 40})
                  .elasticX(true)
                  .x(d3.scale.linear().domain([0, maxValue]))
                  .y(d3.scale.linear().domain([0, maxCount]))
                  //.x(d3.scale.pow().exponent(.9))
                  //.y(d3.scale.pow().exponent(.9))

                  //.renderLabel(true)
                  //.legend(dc.legend().x(250).y(100))
                  .dimension(durationValue)
                  .group(durationValueGroup)
                  .renderVerticalGridLines(true)
                  .renderHorizontalGridLines(true)

                  //.colors(d3.scale.category10())
                  .transitionDuration(500)

                  .centerBar(true)
                  .gap(1)                    // bar width Keep increasing to get right then back off.
                  .filterPrinter(function (filters) {
                    var filter = filters[0], s = '';
                    s += numberFormat(filter[0]) + '-> ' + numberFormat(filter[1]);

                    //set the new min and max values for the elasticsearch query on duration
                    scope.$parent.setMinMaxValues(numberFormat(filter[0]), numberFormat(filter[1]));

                    //console.log(s);
                    return s;
                  })
                  //.xAxis().tickFormat(function(v) {return v;});
                  .xUnits(function () {
                    return 20;
                  });

                dc.renderAll();

              }
            });
          }
        }
      }]
    );
}());

