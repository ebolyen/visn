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
