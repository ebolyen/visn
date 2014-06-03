(function(visn, undefined){
    visn.Controllers = {};
    visn.Components = {};
    visn.Utils = {};
    visn.Charts = {};
    visn._settings_ = {};
    visn._settings_.redraw_limit = 10;
}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
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
(function(visn, undefined){visn.Utils.reactiveVar = function(thing) {
    var listeners = [];
    var handle = function(){ return handle; }
    handle.tickle = function(){
        listeners.forEach(function(d){
            d.callback(handle.value);
        })
    }
    handle.listen = function(_){
        return visn.Utils.Listener(listeners, _);
    };
    visn.Utils.reactiveProperty(handle, "value", handle.tickle, thing);

    return handle;
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
// Courtesy of http://davidwalsh.name/javascript-debounce-function and Underscore.js:

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
(function(visn, undefined){visn.Utils.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    }
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
(function(visn, undefined){visn.Utils.Listener = function(listeners, callback) {
    var listener =  {
        callback : callback,
        destroy : function() {
            var i = listeners.indexOf(listener);
            if(i>0)
                listeners.splice(i, 1);
        }
    }
    listeners.push(listener)
    return listener;
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
(function(visn, undefined){visn.Utils.maxest = function() {
    var self = {};
    var maxes = [];


    self.max = visn.Utils.reactiveVar(0);

    function evaluate() {
        var max = 0;
        for(var i=0; i<maxes.length; i++) {
            if(maxes[i].value > max)
                max = maxes[i].value;
        }
        if(max !== self.max.value)
            self.max.value = max;
    }


    self.Coordinate = function(i) {
        var rvar = visn.Utils.reactiveVar(0);
        rvar.listen(evaluate);
        maxes[i] = rvar;
        return rvar;
    }

    return self;
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
(function(visn, undefined){visn.Utils.reactiveProperty = function(obj, name, callback, def) {
    var _private = def;
    Object.defineProperty(obj, name, {
        enumerable : true,
        get : function() {
            return _private;
        },
        set : function(_) {
            _private = _;
            callback(_private);
        }
    });
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
(function(visn, undefined){visn.Controllers.PlanarTree = function(data) {
    var self = {};
    var _notify = (function(){
        var _listeners = {
            change : [],
            active : []
        }

        self.on = function(event, callback) {
            var eventListeners = _listeners[event];
            if(eventListeners === undefined)
                throw "Event: `" + event + "` does not exist.";
            return visn.Utils.Listener(eventListeners, callback);
        }

        return function _notify(event, data) {
            var listeners = _listeners[event];
            for(var i=0; i<listeners.length; i++) {
                listeners[i].callback(data);
            }
        }
    }());

    visn.Utils.reactiveProperty(self, "view", function(v) {
        _notify("change", v);
    }, []);
    visn.Utils.reactiveProperty(self, "active", function(a) {
        _notify("active", a);
    }, null);

    var _literalReader = function() {
        var literalReader = {}

        literalReader.index = 0;

        literalReader.getChildren = function(id) {
            var start = data._metatree_[id];
            var endIndex = id;
            var end = 0;
            do {
                endIndex++;
                if(endIndex < data._metatree_.length)
                    end = data._metatree_[endIndex];
                else
                    end = data._count_;
            } while(endIndex<data._metatree_.length &&
                    data._metatree_[endIndex] == 0);
            var newElems = new Array();
            var index = 0;
            for(var i=start; i<end; i++) {
                newElems[index] = i;
                index++;
            }
            return newElems
        }

        literalReader.binarySearchParentIndex = function(target) {
            var upper = target - 1;
            var lower = 0;
            var index = 0;
            while(upper >= lower) {
                var mid = (upper + lower)/2 | 0;
                var pivot = data._metatree_[mid];
                //We need to skip 0's
                if(pivot == 0) {
                    var i = mid + 1;
                    var p = pivot;
                    //First search up, because we can disprove it
                    while(i<=upper) {
                        p = data._metatree_[i];
                        if(p != 0 || p > target)
                            break;
                        i++;
                    }
                    //If up is overshooting, search down
                    if((p>target || p==0) && mid-1>=lower) {
                        p = pivot;
                        i = mid - 1;
                        while(i>=lower){
                            p = data._metatree_[i];
                            if(p != 0)
                                break;
                            i--;
                        }
                    }
                    mid = i;
                    pivot = p;
                }
                if(pivot <= target && pivot != 0) {
                    index = mid;
                    if(pivot == target) {
                        return index;
                    }
                }
                if(pivot > target) {
                    upper = mid - 1;
                } else {
                    lower = mid + 1;
                }
            }

            return index;
        }

        literalReader.isAGroupedByB = function(a, b) {
            var heritage = a;
            do {
                heritage = literalReader.binarySearchParentIndex(heritage);
            }while(heritage > b)
            return heritage === b;
        }

        literalReader.isTip = function(id) {
            return id >= data._metatree_.length || data._metatree_[id] == 0;
        }

        literalReader.create = function() {
            var reader = function(property) {
                var scale = reader.identity;
                var accessor = reader.identity;

                var r = function(d) {
                    return scale(accessor(data[property][d]))
                }

                r.scale = function(s) {
                    scale = s;
                    return r;
                }
                r.accessor = function(a) {
                    accessor = a;
                    return r;
                }
                r.useIndex = function(use) {
                    if(use) {
                        accessor = function(d) {
                            return d[literalReader.index];
                        }
                    } else {
                        accessor = reader.identity;
                    }
                    return r;
                }

                return r;
            }
            reader.identity = function(d) {return d;}
            reader.isTip = literalReader.isTip;
            reader.getChildren = literalReader.getChildren;
            reader.isDescendedFrom = literalReader.isAGroupedByB;
            reader.getParent = literalReader.binarySearchParentIndex;
            reader.scanl = function(property, fun, accum, useIndex) {
                var scan = new Array();
                var sum = reader(property).useIndex(useIndex);
                scan.push(accum)
            //    console.log(self.view)
                for(var i=0; i<self.view.length; i++) {

                    var t = fun(accum, sum(self.view[i]))
                    //console.log(t)
                    scan.push(t);
                    accum = t;
                }
                return scan;
            }
            return reader;
        }

        return literalReader;
    }

    var _virtualReader = function() {
        var self = {}

        return self;
    }

    (function(reader){
        var _viewStack = [];

        function lookupIndex(id) {
            for(var i=0; i<view.data.length; i++) {
                if(view.data[i] === id)
                    return i;
            }
            return null;
        }

        self.expand = function(id) {
            if(reader.isTip(id))
                return;
            var index = lookupIndex(id);
            if(index === null)
                return;
            var args = [index, 1].concat(reader.getChildren(id));
            Array.prototype.splice.apply(self.view, args);
            self.view = self.view
        }

        self.collapse = function() {
            var index = lookupIndex(id);
            if(index === null) {
                return;
            }
            var group = reader.binarySearchParentIndex(id);
            var start = index - 1;
            while(start >= 0 && reader.isAGroupedByB(self.view[start], group)) {
                start--;
            }
            start++;
            var end = index + 1;
            while(end < self.view.length && reader.isAGroupedByB(self.view[end], group)) {
                end++;
            }
            self.view.splice(start, end-start, group);
            self.view = self.view;
        }

        self.zoomIn = function(id) {
            _viewStack.push(self.view);
            if(!reader.isTip(id))
                self.view = reader.getChildren(id);
            else
                self.view = [id]
        }

        self.zoomOut = function() {
            if(_viewStack.length > 0)
                self.view = _viewStack.pop();
        }

        Object.defineProperty(self, "index", {
            enumerable : true,
            get : function() {
                return reader.index;
            },
            set : function(i) {
                reader.index = i;
                self.view = self.view
            }
        });

        self.Reader = reader.create();
        //console.log(self.view)
        self.view = reader.getChildren(0);

        //console.log(self.view)

    }(function GetReaderConstructor() {
        if(data._type_ === "literal")
            return _literalReader();
        else if(data._type_ === "virtual")
            return _virtualReader();
        else
            throw "Not a valid data object for visn.Controller.PlanarTree"
    }()));
    return self;
}}(function(){
    if(typeof window === 'undefined')
        return module.exports
    return window.visn = window.visn || {}
}()));
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
(function(visn, d3, undefined){visn.Components.ChartCasing = function(svgGroup, controller, localMax, maxRVar) {
    var self = {};

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
