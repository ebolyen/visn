(function(visn, d3, undefined){visn.Charts.Bar = function(svg) {
   var self = {}
   var width = 500;
   var height = 300;
   var svg = d3.select("#chart").append("svg")
       .attr("width", width)
       .attr("height", height);

   var bars = svg.selectAll("g.bar")
               .data(data.x_labels)

   svg.append("g")
       .attr("class", "yaxis")
       .attr("transform", "translate(40,0)");

   var controllers = [];

   var maxest = visn.Utils.maxest();
   var max = maxest.max;

   max.listen(function(max) {
       var y = d3.scale.linear()
                           .domain([0, max])
                           .range([height, 0]);

       var yAxis = d3.svg.axis()
                   .orient("left")
                   .scale(y);

       svg.select(".yaxis").call(yAxis);
   })

   bars.enter().append("g")
       .attr("class", "bar")
       .attr("transform", function(d, i){
           return "translate("+(i*100 + 50)+",0)";
       })
       .each(function(d, i){
           controllers[i] = visn.Controllers.PlanarTree(data);
           controllers[i].index = i;
           var localMax = maxest.Coordinate(i);
           var sb = visn.Components.CollapsibleStackedBar(d3.select(this), controllers[i], localMax, max)
           sb.height = height;
           sb.width = 100;
       })


    return self;
}}(
    function(){
        if(typeof window === 'undefined')
            return module.exports
        return window.visn = window.visn || {}
    }(),
    function(){
        if(typeof window === 'undefined')
            return require('d3');
        return window.d3;
    }()
 ));
