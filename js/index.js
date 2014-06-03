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
