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
