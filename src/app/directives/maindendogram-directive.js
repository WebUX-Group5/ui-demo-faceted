(function () {
  'use strict';
  angular.module('FacetedUI')
    .directive('maindendogramGuiItem', [
      function () {
        return {
          template: '<div><div id="dendrogram"></div></div>',
          replace: true,
          scope: {
            bind: '=',
            confirmAction: '&'
          },
          link: function (scope, element, attrs, ctrl) {

            //var client = new elasticsearch.Client();

            //scope.buckets; // these are the buckets passed in as attribute

            // here you can do more things to initialise the 'scope' of your
            // directive

            // e.g. some extra value
            scope.mytext = 'maindendogram';


            scope.$watch('bind', function (data) {

              if (data) {
                // D3 code goes here.
                var root = createChildNodes(data);


                var width = 700,
                  height = 4000;

                var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4', "#4682B4"];

                // d3 dendrogram (used as a tree)
                var cluster = d3.layout.cluster()
                  .nodeSize([30, 70])
                  .separation(function separation(a, b) {
                    return (a.parent == b.parent ? 1 : 1.3) / a.depth;
                  })
                  .size([height, width - 200]);

                var diagonal = d3.svg.diagonal()
                  .projection(function (d) {
                    return [d.y, d.x];
                  });

                var svg = d3.select("#dendrogram");

                svg.selectAll("*").remove();

                svg = d3.select("#dendrogram").append("svg")
                  .attr("width", width)
                  .attr("height", height)
                  .append("g")
                  .attr("transform", "translate(120,0)");

                var nodes = cluster.nodes(root),
                  links = cluster.links(nodes);

                var link = svg.selectAll(".link")
                  .data(links)
                  .enter().append("path")
                  .attr("class", "link")
                  .attr("d", diagonal);

                var node = svg.selectAll(".node")
                  .data(nodes)
                  .enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                  });

                node.append("circle")
                  .attr("r", 5.5)
                  .style("fill", function (d) {
                    //return d.children ? "#ffffff" : color[+d.key - 1];
                    if (!d.children)
                      if (d.key < 180)
                        return color[4];

                  })
                  .style("stroke", function (d) {
                    //return d.children ? "#4682B4" : color[+d.key - 1];

                    if (d.key != "Open Data") {
                      if (d.children) {
                        if (!d.main) {
                          if (d.key == 'pres')
                            return color[1];
                          else if (d.key == 'abg')
                            return color[0];
                          else
                            return color[2];
                        }
                      }
                      else
                        return color[3];
                    }

                  });

                node.append("text")
                  .attr("dx", function (d) {
                    return d.children ? -8 : 8;
                  })
                  .attr("dy", 3)
                  .style("text-anchor", function (d) {
                    return d.children ? "end" : "start";
                  })
                  .attr("font-family", "sans-serif")
                  .attr("font-size", function (d) {
                    if (d.children && d.main)
                      return "20px"
                    else
                      return "14px"
                  })
                  .text(function (d) {
                    if (d.children) {
                      if (d.main) {
                        //return scope.convertPartyCase(d.main.key);
                        return scope.confirmAction({arg1: d.main.key});
                      }
                      else
                        return d.key;
                    }
                    else
                      return (d.key + ": " + d.doc_count);
                  });

                d3.select(self.frameElement).style("height", height + "px");

                function createChildNodes(dataObj) {
                  var root = {};

                  root.key = "Open Data";

                  root.children = dataObj.entries;

                  root.children.forEach(function (d) {
                    d.children = d.main.roletype.buckets;
                  });

                  root.children.forEach(function (d) {
                    //console.log(d);
                    d.children.forEach(function (d) {
                      d.children = d.durationtotals.buckets;
                    });
                  });

                  return root;
                }
              }
            });

          }
        }
      }]
    );
}());

