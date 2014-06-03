(function(visn, d3, undefined){visn.Components.CollapsibleStackedBar = function(svgGroup, controller, localMax, maxRVar) {
    var self = {};
    var Reader = controller.Reader;
    var max = maxRVar.value;

    var color = d3.scale.category20b();
    var privateMutable = {};

    self.redraw_x = visn.Utils.debounce(function() {
        privateMutable._redraw_x();
    }, visn._settings_.redraw_limit, false);
    self.redraw = visn.Utils.debounce(function() {
        privateMutable._redraw();
    }, visn._settings_.redraw_limit, false);

    visn.Utils.reactiveProperty(self, "width", self.redraw_x, 10);
    visn.Utils.reactiveProperty(self, "height", self.redraw, 50);
    visn.Utils.reactiveProperty(self, "paddingLeft", self.redraw_x, 5);
    visn.Utils.reactiveProperty(self, "paddingRight", self.redraw_x, 5);
    visn.Utils.reactiveProperty(self, "paddingTop", self.redraw, 5);
    visn.Utils.reactiveProperty(self, "paddingBottom", self.redraw, 5);

    privateMutable._redraw_x = function() {
        svgGroup.selectAll("rect")
            .attr("width", self.width - self.paddingLeft - self.paddingRight);
    }

    privateMutable._redraw = function() {
    //    console.log(controller.view)
        var y0s = Reader.scanl("sum", function(a,b){return a+b}, 0, true);
    //    console.log(y0s)
        localMax.value = y0s[y0s.length -1];

        var adjustedHeight = height - self.paddingTop - self.paddingBottom;

        var y1 = d3.scale.linear()
                            .domain([0, max])
                            .range([adjustedHeight, 0]);

        var y2 = d3.scale.linear()
                            .domain([0, max])
                            .range([0, adjustedHeight]);

        var sum = Reader("sum")
                    .useIndex(true)
                    .scale(y2);

        var bar = svgGroup.selectAll("rect")
            .data(controller.view, Reader.identity);

        function boxY(d, i) {
            var r = y1(y0s[i]) - sum(d);
            return r;
        }

        bar.attr("fill", color)
            .transition().duration(500)
            .attr("y", boxY)
            .attr("height", sum)
            .attr("opacity", function(d){
                return 1;
            });

        bar.enter().append("rect")
            .on('click', controller.zoomIn)
            .on("contextmenu", function(d) {
                 controller.zoomOut()
                 //stop showing browser menu
                 d3.event.preventDefault();
            })
            .on("mouseover", function(d){
                controller.active = d;
                if(!Reader.isTip(d))
                    d3.select(this)
                        .classed("expandable", true)
                        .attr("stroke", "red")
            })
            .on("mouseout", function(d){
                controller.active = null;
                d3.select(this)
                    .attr("stroke", "")
            })
            .attr("fill", color)
            .attr("y", height)
            //.attr("opacity", 0)
            .transition().duration(500)
            .attr("opacity", 1)

            .attr("height", sum)
            .attr("y", boxY);


        bar.exit()
            .transition().duration(500)
            .attr("height", 0)
            .attr("y", height)
            .attr("opacity", 0)
            .remove();

        privateMutable._redraw_x();
    }



    var maxListener = maxRVar.listen(function(m) {
        max = m;
        self.redraw();
    });

    var ctrlListener = controller.on("change", self.redraw)
    self.destroy = function() {
        ctrlListener.destroy();
        maxListener.destroy();
        chart.remove();
        self = {};
    }

    self.redraw();
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
