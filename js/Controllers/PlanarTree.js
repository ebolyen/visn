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
