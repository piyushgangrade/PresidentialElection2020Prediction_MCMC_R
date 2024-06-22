    (function() {


        var body_classes = document.getElementsByTagName("BODY")[0].className;
        var body_array = body_classes.split(" ");
        var body_first_class = body_array[0];

        console.log("ivan classname: "+ body_first_class);

        /** CONFIGURATION START **/
        var _sf_async_config = window._sf_async_config = (window._sf_async_config || {});
        _sf_async_config.uid = 21569;
        _sf_async_config.domain = 'realclearpolitics.com'; //CHANGE THIS TO ONE OF THREE DOMAINS
        _sf_async_config.flickerControl = false;
        _sf_async_config.useCanonical = true;
        _sf_async_config.useCanonicalDomain = true;
        _sf_async_config.sections = body_first_class; //CHANGE THIS TO YOUR SECTION NAME(s)
        _sf_async_config.authors = ''; //CHANGE THIS TO YOUR AUTHOR NAME(s)
        /** CONFIGURATION END **/
        function loadChartbeat() {
            var e = document.createElement('script');
            var n = document.getElementsByTagName('script')[0];
            e.type = 'text/javascript';
            e.async = true;
            e.src = '//static.chartbeat.com/js/chartbeat.js';
            n.parentNode.insertBefore(e, n);
        }
        loadChartbeat();
     })();