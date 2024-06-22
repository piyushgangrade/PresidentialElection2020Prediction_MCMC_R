// 10.20.17 -- BROCK & ROWLAND -- Added sticky ad in article and polls pages
// 10.27.17 -- BROCK -- ADDED FLOATING SKYSCRAPERS TO RCP HOMEPAGE IF SCREEN WIDTH WIDE ENOUGH TO SUPPORT
// 7/2/2018 -- Rowland -- fixed so consent value goes to comscore
// 10/1/2018 -- Rowland -- updated consent to give our intended value for each scenario

var gdpr_consent_val = null;
if(readCookie('rc_tos_consent') == 'allow') {
    gdpr_consent_val = '1';
} else if(readCookie('rc_tos_consent_seen_not_agreed') == '1') {
    gdpr_consent_val = '0';
}
var _comscore = _comscore || [];
//_comscore.push({ c1: "2", c2: "6872493" });
_comscore.push({ c1: "2", c2: "22522699", cs_ucfr: gdpr_consent_val }); //GDPR (cs_ucfr: "0")
(function() {
var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js"; 
el.parentNode.insertBefore(s, el);
})();
//document.write('<noscript><img src="http://b.scorecardresearch.com/p?c1=2&c2=6872493&cv=2.0&cj=1" /></noscript><!-- End comScore Tag -->');
document.write('<noscript><img src="https://sb.scorecardresearch.com/p?c1=2&c2=22522699&cs_ucfr='+gdpr_consent_val+'&cv=2.0&cj=1" /></noscript><!-- End comScore Tag -->'); //GDPR (&cs_ucfr=0)

//Inyerman fonseca 3/7/23
<!-- Global site tag (gtag.js) - Google Analytics -->
(function(){

    let s = document.createElement("script"),
        el = document.getElementsByTagName("script")[0];
    s.src = "https://www.googletagmanager.com/gtag/js?id="+SITE_INFO['google_analytics4_id'];
    s.async = true;

    el.parentNode.insertBefore(s, el);


    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', SITE_INFO['google_analytics4_id']);
})();
//End Inyerman fonseca 3/7/23


console.log(window._gaq);
var _gaq = _gaq || [];
console.log(window._gaq);

var env_subdomain = document.location.hostname.split('.')[0];
var gaq_acc_id = 'UA-31527-1';
if(env_subdomain == 'www1') {
    gaq_acc_id = 'UA-31527-54';
}
_gaq.push(['_setAccount', gaq_acc_id]);
_gaq.push(['_setDomainName', 'realclearpolitics.com']);
_gaq.push(['_trackPageview']);

/**
 * If logged in with no ad free account
 */
if( readCookie('rcmg_guid') && readCookie('rcmg_token') && (readCookie('evaf') == null || parseInt(readCookie('evaf')) == 0) ){

  _gaq.push(['_setCustomVar',
    1,           // Slot (1 - 5)
    'Logged In', // Name
    'Yes',       // Value
    2            // 1 - page level, 2 - session level, 3 - visitor level
  ]);

}

//Custom Tracking - Adblocker Users who signed up for Newsletter via AD Notifier Widget(evolok)
if( readCookie('two_weeks_adfree') ){

  _gaq.push(['_setCustomVar',
    2,           // Slot (1 - 5) 
    'Newsletter Ad Free Access', // Name
    'Yes',       // Value
    2            // 1 - page level, 2 - session level, 3 - visitor level
  ]);

}


/**
 * If logged in with ad free account create var
 */
if( readCookie('rcmg_guid') && readCookie('rcmg_token') && parseInt(readCookie('evaf')) == 1 ){

  _gaq.push(['_setCustomVar',
    3,           // Slot (1 - 5)
    'Logged In With Ad Free', // Name
    'Yes',       // Value
    2            // 1 - page level, 2 - session level, 3 - visitor level
  ]);
  
}


/**
 * If logged in with an blocker
 */
setTimeout(function(){

    if( readCookie('rcmg_guid') && readCookie('rcmg_token') && Utils.global_settings.realclear_ad_block_check ){

      _gaq.push(['_setCustomVar',
        4,           // Slot (1 - 5)
        'Logged In With Ad Block', // Name
        'Yes',       // Value
        2            // 1 - page level, 2 - session level, 3 - visitor level
      ]);
    }

}, 1600);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



//Check if jQ is Loaded and Ready
if( window.jQuery ){
    //With jQuery Available Fire Scroll Depth Lib with loadAsyncScript Func
    //Will load script async and keep checking if it is then ready - once ready callback is fired( 2nd param in loadAsyncScript() )
    loadAsyncScript("https://www.realclearpolitics.com/3rd_party/scroll-depth/jquery.scrolldepth.min.js", function () {
        // Script/Library was loaded - Fire loadAsyncScript again to load in additional libs/scripts dependent to above file 
        //loadAsyncScript("//code.jquery.com/ui/1.10.4/jquery-ui.min.js");
        
        //NO FURTHER DEPENDENCIES - RUN FOLLOWING CODE
        //Fire Scroll Depth Function to send scroll events to GA
        if( $.scrollDepth ){ jQuery.scrollDepth(); }
        
    });
    
}

//Dependency/Custom Lazy Loader - Non-Paralleled, Sequential Script Loader(Async)
function loadAsyncScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    if (script.readyState) {
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                if (callback && typeof callback === "function") {
                    callback();
                }
            }
        };
    } else {
        script.onload = function () {
            if (callback && typeof callback === "function") {
                callback();
            }
        };
    }
    script.src = url;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
}


/*

//removed 8.22.19 - I.D.
function load_paa_code(){
    var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel-a.basis.net/iap/c274c919d04ff75e';
    new Image().src = ssaUrl; 
    (function(d) { 
        var syncUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel-a.basis.net/dmp/asyncPixelSync'; 
        var iframe = d.createElement('iframe'); 
        (iframe.frameElement || iframe).style.cssText = "width: 0; height: 0; border: 0;"; 
        iframe.src = "javascript:false"; 
        d.body.appendChild(iframe); 
        var doc = iframe.contentWindow.document; doc.open().write('<body onload="window.location.href=\''+syncUrl+'\'">'); 
        doc.close(); 
    })(document);
};

load_paa_code();*/

//document.write("<scr"+"ipt type=\"text/javascript\" src=\"http://tags.bluekai.com/site/3537?ret=js\"></scr"+"ipt>");


var _qevents = _qevents || [];
(function() {
var elem = document.createElement('script');
elem.src = (document.location.protocol == "https:" ? "https://secure" : "http://edge") + ".quantserve.com/quant.js";
elem.async = true;
elem.type = "text/javascript";
var scpt = document.getElementsByTagName('script')[0]; 
scpt.parentNode.insertBefore(elem, scpt);
})();

_qevents.push({
qacct:"p-9bKF-NgTuSFM6"
});

document.write('<noscript><div style="display:none;"><img src="//pixel.quantserve.com/pixel/p-9bKF-NgTuSFM6.gif" border="0" height="1" width="1" alt="Quantcast"/></div></noscript>');

//GETS THE CURRENT <BODY> CLASS
var cur_body_class = document.body.getAttribute('class').split(/\s+/);

//ad block check
$(document).ready(function(){
    setTimeout(function(){
        warning_widget.check_ad_block_status();
    },125);
});

// Inyerman Fonseca, 3-7-23 commenting lines 194-239 to avoid analytics double hits.
function checkIfAnalyticsLoaded2() {
    if (window._gat && window._gat._getTracker) {

        //RCP SURVEY BEACON
        //var rcp_google_beacon = readCookie('rcp_google_beacon_1019');

        //if(!rcp_google_beacon){

            /*

            var makeid = function(length) {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < length; i++){
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                return text;
            }

            var millis = Date.now();
            user_identifier = millis+"_"+makeid(8)+"|0";

            createCookie("rcp_google_beacon_1019", user_identifier, 365);

            var data = {
                'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
                'ge_action' : 'Hit',
                'ge_label' : "0",
            };

            send_ga_event(data);

            */

        //}


    } else {
        //check in 500 ms
        setTimeout('checkIfAnalyticsLoaded2()', 1000);
    }
}

//}

 

/*
if(cur_body_class[0]!='home' && cur_body_class[0]!='polls'){   
    piAId = '63502'; 
    piCId = '1506'; 
    (function() {
        function async_load(){
            var s = document.createElement('script'); s.type = 'text/javascript';
            s.src = ('https:' == document.location.protocol ? 'https://pi' : 'http://cdn') + '.pardot.com/pd.js';
            var c = document.getElementsByTagName('script')[0]; c.parentNode.insertBefore(s, c);
        }
        if(window.attachEvent) { window.attachEvent('onload', async_load); }
        else { window.addEventListener('load', async_load, false); }
    })();
} */


/*load mobile ad */
if(viewportSize.getWidth()<768){

                var s=document.createElement('script'); 
                s.type='text/javascript'; 
                s.async=true; 
                s.src='//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
                var x=document.getElementsByTagName('script')[0];
                x.parentNode.insertBefore(s,x);

                 (adsbygoogle = window.adsbygoogle || []).push({ 
                    google_ad_client: "ca-pub-4560167926987914",
                    enable_page_level_ads: true
                 });             
}

var s_bk =document.createElement('script');
    s_bk.type='text/javascript';
    s_bk.async=true;
    s_bk.src='//tags.bluekai.com/site/3537?ret=js';
    var x_bk=document.getElementsByTagName('script')[0];
    x_bk.parentNode.insertBefore(s_bk,x_bk);



/*if(cur_body_class[0]=='home' ){  //|| cur_body_class[0]=='article' || cur_body_class[0]=='video' || cur_body_class[0]=='polls'
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:335482,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');

}*/ 


//M.B. MOVED CODE 12.5.17 -- MOVED TO ARTICLES.JS FILE (WILL DISPLAY ON ALL SITES)
/*if( ( $('body.article').length || $('body.polls').length ) 
    && $('div.beta div').first().hasClass('RC-AD-BOX-TOP')) {

    $('div.beta div:not(.RC-AD-BOX-TOP)').wrapAll('<div class="sticky-wrapper" />');
    //$('div.beta').not('.RC-AD-BOX-TOP').wrapAll('<div class="sticky-wrapper" />');
    
    $('div.beta div.RC-AD-BOX-TOP').wrapAll('<div class="ad-sticky-wrapper" />');
    $('div.beta div.RC-AD-BOX-TOP').addClass('sticky');

    $.getScript('/3rd_party/stickyfill/stickyfill.js', function(){
        Stickyfill.add($('.sticky'));
    });

}*/

/*Facebook skd*/
/*<script async crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v10.0" nonce="LyDJj0Y2"></script>*/

//google+ js sdk
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://apis.google.com/js/plusone.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","goggleplusshare");

//linkedin js sdk
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.linkedin.com/in.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","linkedinshare");

//tumblr sdk 
//!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.tumblr.com/v1/share.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","tumblrshare");

//pinterest
/*!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="http://assets.pinterest.com/js/pinit.js";js.async=true;js.setAttribute('data-pin-hover', true);fjs.parentNode.insertBefore(js,fjs);}}(document,"script","pinterest");  */
