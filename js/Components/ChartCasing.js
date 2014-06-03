(function(visn, d3, window, undefined){visn.Components.ChartCasing = function(dom) {
    var document = window.document;
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
    }(),
    function(){
        if(typeof window === 'undefined')
            return require('jsdom').jsdom().parentWindow;
        return window;
    }()
 ));
