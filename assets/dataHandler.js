


var ColView = (function() {

    function notify(listeners, method, data) {
        var event = listeners[method]
        for(var i=0; i<event.length; i++) {
            event[i](data);
        }
    }

    function literal(data, view, listeners, stack) {

        function constructElement(id) {
            /*var elem = {};
            elem._id_ = id;
            elem._isGroup_ = !isTip(id);

            for(var i=0; i<data._properties_.length; i++) {
                var property = data._properties_[i]
                elem[property] = data[property][id]
            }
            return elem;*/
            return id;
        }

        function getChildren(id) {
            var start = data._metatree_[id];
            var endIndex = id;
            var end = 0;
            do {
                endIndex++;
                if(endIndex < data._metatree_.length)
                    end = data._metatree_[endIndex];
                else
                    end = data._count_;
            } while(endIndex<data._metatree_.length && data._metatree_[endIndex] == 0);
            var newElems = new Array();
            var index = 0;
            for(var i=start; i<end; i++) {
                newElems[index] = constructElement(i);
                index++;
            }
            return newElems
        }

        // This is ugly because although the metatree is ordered, it is filled
        // with zeros which must be ignored. There is always a parent for a
        // target, so the index which has the closest number <= our target is
        // correct.
        function binarySearchParentIndex(target) {
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

        //This could be a modified binary search in the future
        function getIndex(id) {
            for(var i=0; i<view.data.length; i++) {
                if(view.data[i] === id)
                    return i;
            }
            return null;
        }

        view.isTip = function(id) {
            return id >= data._metatree_.length || data._metatree_[id] == 0;
        }
        view.isAGroupedByB = function(a, b) {
            var heritage = a;
            do {
                heritage = binarySearchParentIndex(heritage);
            }while(heritage > b)
            return heritage === b;
        }
        view.getParent = function(id) {
            return binarySearchParentIndex(id);
        }
        view.expand = function(id) {
            if(view.isTip(id))
                return;
            var index = getIndex(id);
            if(index === null)
                return;
            var args = [index, 1].concat(getChildren(id));
            Array.prototype.splice.apply(view.data, args);
            notify(listeners, "change", view.getView());
        }

        view.collapse = function(id) {
            var index = getIndex(id);
            if(index === null) {
                return;
            }
            var group = binarySearchParentIndex(id);
            var start = index - 1;
            while(start >= 0 && view.isAGroupedByB(view.data[start], group)) {
                start--;
            }
            start++;
            var end = index + 1;
            while(end < view.data.length && view.isAGroupedByB(view.data[end], group)) {
                end++;
            }
            view.data.splice(start, end-start, constructElement(group));

            notify(listeners, "change", view.getView());
        }

        view.zoomIn = function(id) {
                stack.push(view.getView());

                if(!view.isTip(id))
                    view.data = getChildren(id);
                else
                    view.data = [id]
                console.log(stack)
                notify(listeners, "change", view.getView());

        }

        view.zoomOut = function(id) {
            var n = stack.pop();
            if(n){
                view.setView(n)
                console.log(n)
                notify(listeners, "change", view.getView());
            }

        }

        view.get = function(property, id, index) {
            if(index)
                return data[property][id][propertyIndex];
            return data[property][id];
        }

        view.getView = function() {
            var v = new Array();
            for(var i=0; i<view.data.length; i++) {
                v[i] = view.data[i];
            }
            return v;

        }

        view.setView = function(idList) {
            /*for(var i=0; i<idList.length; i++) {
                view.data[i] = constructElement(idList[i]);
            }
            if(view.data.length > idList.length) {
                view.data.splice(idList.length, idList.length-view.data.length)
            }
            */
            view.data = idList;
            console.log(view.getView())
            notify(listeners, "change", view.getView());
        }


        var propertyIndex = null;
        view.setIndex = function(index) {
            propertyIndex = index;
        }
        view.getIndex = function() {
            return propertyIndex;
        }

        view.data = getChildren(0)
        return view;
    }

    function virtual(data, view, listeners) {
        function constructElement(id) {

        }

        view.expand = function(id) {

        }

        view.collapse = function(id) {

        }

        view.focus = function(id) {

        }

        view.getView = function() {

        }

        view.setView = function(idList) {

        }
    }

    ex = function constructor(data) {
        var view = {};
        view.data = [{}];

        var listeners = {
            "expand":[],
            "collapse":[],
            "focus":[],
            "change":[],
            "link":[],
        };


        view.on = function(event, callback) {
            listeners[event].push(callback);
        }

        view.scanl = function(property, fun, accum, useIndex) {
            var scan = new Array();
            scan.push(accum)
            for(var i=0; i<view.data.length; i++) {
                var t = fun(accum, view.get(property, view.data[i], useIndex))
                scan.push(t);
                accum = t;
            }
            console.log(view.data.map(function(d){
                return view.get(property, d, useIndex)
            }))
            console.log(scan)
            return scan;
        }

        if(data._type_ == "literal")
            return literal(data, view, listeners, []);
        if(data._type_ == "virtual")
            return virtual(data, view, listeners, []);
        return null;
    }

    return ex;

})()
