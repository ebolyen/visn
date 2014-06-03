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
