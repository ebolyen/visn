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
