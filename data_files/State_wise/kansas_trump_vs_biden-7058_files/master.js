/*

master.js
---------

Script loaded on all sites
Major revision March 2019

Requirements:

  On most pages, place script tag in head tag above all other scripts
  On streamlined pages, place script tag just before end of body tag
  Script tag should have:
    id: "jsSite"
    data-site: <site name> (ex: "politics")

Optional:

  Script tag can have:
    data-site-page: <page name> (ex: "home")
    data-gaTag: <google analytics tag> (ex: ?)

Dependencies:

  None

Table of Contents:

  GLOBAL VARIABLES / CONSTANTS

  MAIN LOGIC

  PRESERVE COMPATIBILITY

  BROWSER / OS DETECTION
  NOTIFICATIONS
  TEMPSHOW LIBRARY
  EVOLOK LIBRARY
  EVOLOK NOTIFIERS
  COOKIE CONSENT LIBRARY
  JQUERY TOOLS LIBRARY
  FACEBOX LIBRARY
  FARK WIDGET
  FLOATING LEADERBOARD

  (order doesn't matter for these function definitions)

  ADS FUNCTIONS
  SOCIAL FUNCTIONS
  UTILITY FUNCTIONS
  SCRIPT LOADING FUNCTIONS
  EVOLOK FUNCTIONS
  DISTROSCALE FUNCTIONS
  SPOT.IM FUNCTIONS
  STORY STREAM FUNCTIONS
  HOMEPAGE FUNCTIONS
  COMMENTS FUNCTIONS
  HP RECENTS FUNCTIONS
  OTHER FUNCTIONS

*/

// Load top_of_header.js synchronously if not loaded yet
if(typeof SITES_INFO === 'undefined') {

    var top_of_header_ajax = new XMLHttpRequest();
    var top_of_header_url = '/asset/top/top_of_header.js?v='+Math.floor((new Date()).getTime() / 25000);

    top_of_header_ajax.open('GET', top_of_header_url, false);

    top_of_header_ajax.onreadystatechange = function ()
    {
        
        var script = top_of_header_ajax.response || top_of_header_ajax.responseText;
        if (top_of_header_ajax.readyState === 4)
        {
            switch(top_of_header_ajax.status)
            {
                case 200:
                    eval.apply( window, [script] );
                    console.log("library loaded: ", top_of_header_url);
                    break;
                default:
                    console.log("ERROR: library not loaded: ", top_of_header_url);
            }
        }
    };
    top_of_header_ajax.send(null);
}


var rcp_page_refresh_interval = ''; //DEFINING GLOBAL REFRESH INTERVAL SET IN rcp.js
var dateMenuVisible = false;
var allow_ad_render = false; // We want to wait until publir prebid is initialized fully
var lazy_ad_list = []; // populated as scrolling down page
var notif_banner_enabled = false; // ?
var fire_gdpr_consent = true; // simple enable/disable flag
var story_stream_related_tags_html = ''; // Used for story streams related topics
var network_ads_loaded = false;

// EVOLOK //////////////////////////////////////////////////////////////////////

var evolok_init_called = false;
var evolok_init_finished = false;
var evolok_block_ads = false;
var evolok_do_ads = false;

// WIDGETS /////////////////////////////////////////////////////////////////////

var $w_ss = []; // Holds multiple story streams
var rcp_avg_w_total = 0;
var rcp_avg_w_data = [];

// SOCIAL //////////////////////////////////////////////////////////////////////

var fbShares = 0;
var linkedCount = 0;
var sharePosition = 0;
var share_urls = [];

var fbDone = false;
var linDone = false;

/**
 * These two need to be set up here to bypass ad block check when ad free account
 */
var warning_widget = {};
warning_widget.ad_block_ready_for_check = false;

//Utils class object for any frequently used utility functions
var Utils = {};
Utils.global_settings = {
    realclear_ad_block_check: null,
    device_detect_loaded: false,
    link_clicked: false,
};

// ad container sizing variables
globalThis.elem = [];
var is_ad_location;

// Code to detect browser visibility super early on.
// Used in ads to load them on page load or wait until tab becomes visible.
var browser_tab_is_visible = true;
detect_visibility_state();

document.addEventListener("visibilitychange", handle_browser_tab_visibility_change, false);
function handle_browser_tab_visibility_change(){
    detect_visibility_state();
}

function detect_visibility_state() {
    if(document.hidden) {
        browser_tab_is_visible = false;
        eraseCookie('browser_tab_is_visible');
    } else  {
        browser_tab_is_visible = true;
        createCookie('browser_tab_is_visible', 1, 1);
    }
}
// end browser tab visibility code

window.isTouchDevice = function(){
    try {  
        document.createEvent("TouchEvent");  
        return true;  
    } catch (e) {  
        return false;  
    }  
}

//JQUERY FUNCTION TO CHECK IF ITEM IS WITHIN THE WINDOW VIEWPORT, VISIBLE
$.fn.inViewport = function(top_padding, bottom_padding) {

    if( $(this).length == 0 ){
        return false;
    }

    top_padding     = (typeof top_padding == 'undefined') ? 0 : parseInt(top_padding);
    bottom_padding  = (typeof bottom_padding == 'undefined') ? 0 : parseInt(bottom_padding);

    //get the passed item's postion
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    //get the viewports positions
    var viewportTop = $(window).scrollTop() - top_padding;
    var viewportBottom = viewportTop + $(window).height() + bottom_padding;

    //will return true if item is within viewport, else will return false
    return elementBottom >= viewportTop && elementTop <= viewportBottom;
};

//RETURNS TRUE OR FALSE IF WINDOW SIZE IS TABLET 
$.fn.isTablet = function(){
    var width = $(window).width();
    return  width >= 768 && width <= 1024;
}

//RETURNS TRUE OR FALSE IF WINDOW SIZE IS MOBILE - use $().isMobile();
$.fn.isMobile = function(){
    return $(window).width() < 768;
}



////////////////////////////////////////////////////////////////////////////////
// MAIN LOGIC //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Evolok Metering Init
// Evolok has to be the first thing that should be loading first.
//Scripts are dependent from it
console.log("ADMIRAL BEFORE EVOLOK INIT RUN LOAD ADS", window.run_loadAds);
if( window.run_loadAds === true ){
    evolok_init();
}

//ezoic var only will exist on rcscience 
if(typeof ezoicTestActive !== 'undefined'){    
    //alert("ezoic version");
}else{ //science legacy

    // comment out to turn off ad refreshing
    load_ad_refresh_js();
}

// Run logic immediately or in doc ready, depending on where master is (head, or at end of body)
if(document.querySelector("body")) {
    init_master();
} else {
    $(document).ready(function(){
        init_master();
    });
}

function init_master() {
    check_ios_app();
    runConfiantScript();
    init_hotjar();
    init_comscore();
    init_story_stream_related();

    // Clicks on document that should close menus
    click_outside_menus();

    if(typeof load_spot_recirculation == 'function') {load_spot_recirculation(); }

    // spot_right_rail_init();

    sitesMenu();
    sectionsMenu();
    sectionsInnerMenu();
    sitesMenuHover();
    recommendedSitesMenuHover(); // Why does this function exist twice?

    recentItemsSlider();

    //LOAD DYNAMIC SOCIAL TOOLS IN TOOLS CONTAINER
    if( $('.socialBar').length>0 ) {

        loadSocialTools();
        initEmailDrawer();
    }

    loadGotChosen();

    //loadPrimisWidget();

    $(document).ready(function(){
        //this is throwing an error if its not outside the doc ready
        // distroscale_init();
        render_video_player();
    })

    markets_investingchannel();
    load_insticator();



    showComments();
    hideComments();
    showHideComments();

    initSocialDrawer();

    onScroll();
    onResize();

    showMobileSearch();



    //M.B. TURNED OF STREAM TAG POPUPS FOR LAUNCH - TURN BACK ON POST LAUNCH
    //event checker - replaces width checks used to determine resolution
    //used to determine if a mouse event or touch event is fired
    if(!$('body').hasClass('article-landing')){
        $( ".stream-tag" ).on({
            click: function(e) {
                storyStreamClick(e);
            },
            mouseenter: function(e) {
                storyStreamHover(e);
            },
            touchstart: function(e) {
                storyStreamClick(e);
            },
            touchmove: function(e) {
                setTimeout(function(){
                    storyStreamClick(e);
                },250);
            },
            touchleave: function(e) {
                setTimeout(function(){
                    storyStreamClick(e);
                },250);
            }
        });
    }

    $(document).on('click', '', function(e){
        if(!$(e.target).hasClass('stream-tag')){
            $('.story-stream-hover-wrapper').hide();
        }
    });

    //homepage hover menu handlers
    //smart check for touch events to cover all devices without device/width checks
    $( ".main-nav-bar .links-container ul li a" ).on({
        mouseenter: function(e) {
            mainNavHover(e);
        }, touchstart: function(e) {
            homeNavClick(e);
        }, touchmove: function(e) {
            homeNavClick(e);
        }
    });

    toggleCBTsearch();

    customSelectBox();

    cbtSearch();

    viewSwitcher();

    dateMenu();

    displayStaff();

    siteSearch();

    //insert_tracking_admiral();


    /************************************************ DOC READY UTILITY FUNCTIONS **************************************************/


    //ANIMATE SCROLLING - REPLACES TRADITIONAL HTML BOOKMARKING BY CLICKING LINK AND SCROLLING DOWN TO BOOKMARK RATHER THAN JUMP DOWN
    $(".gamma > ul > li > a").click(function(e) {
        // Prevent a page reload when a link is pressed
        e.preventDefault();
        // Call the scroll function
        goToByScroll($(this).attr("id"));
    });

    loadInfinityAds(); //we wait for body class to load so we can check what section we're on

    // Google Site Translator
    // SITE_INFO['name'] == 'world' &&
    if( $('body.article').length > 0 ){
        setTimeout(function(){
            $('.goog-te-gadget-icon').removeClass('goog-te-gadget-icon');
            $('.goog-te-gadget-simple').html('<span style="vertical-align: middle;"><a class="goog-te-menu-value" href="javascript:void(0)"><span class="translate-text">Select Language</span><img class="election-full-site-arrow" src="/asset/img/grey-bg-chev.png"></a></span>');
            $('.goog-te-gadget-simple').css({ "background-color" : "transparent", "border-width" : "0", "padding-bottom" : "5px", "padding-top" : "5px" });
            $('.goog-te-gadget-simple .goog-te-menu-value').css({ "color" : "#999999" });
            $('.goog-te-menu-value img').css({ "margin-left" : "7px" });
        }, 2100);
    }else{
        setTimeout(function(){
            $('.goog-te-gadget-icon').removeClass('goog-te-gadget-icon');
            $('.goog-te-gadget-simple').html('<span style="vertical-align: middle;"><a class="goog-te-menu-value" href="javascript:void(0)"><span class="translate-text">Select Language</span><img class="election-full-site-arrow" src="/asset/img/grey-bg-chev.png"></a></span>');
        }, 2100);
    }

    //Newsletter Promo Pop-Up Handlers
    $("body").append('<div class="overlay_newsletter_promo"></div>');

    //Hide Member Pop-up - click anywhere outside pop-up to hide
    $(document).click(function(event) {
        if(!$(event.target).closest('#facebox').length) {
            if($('#facebox').is(":visible")) {
                $("body > .overlay_newsletter_promo").hide("fast");
            }else{
                $("body > .overlay_newsletter_promo").hide("fast");
            }
        }
    }); //END DOC .click - hide pop-up

    ///Newsletter widget I agree checkbox
    $(document).on('click', ':checkbox#i-agree' , function(e){
        console.log('i-');
        $('.right-options input:checkbox').prop('checked',this.checked);
    });


    // Temp disabled, seeing if we don't need it anymore
    //load_fb_sdk();

    toggleDonationsBanner();
    initStatsCounter();
}

function init_hotjar() {

  // Hotjar Tracking Code for www.realclearpolitics.com
  (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:335482,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
}

function toggleDonationsBanner(){

    // if banner shown but not shown popup, dipslay popup
    if( $('.donations-pop-up-bg').length > 0 && readCookie('donations_banner_x2') != null && readCookie('donations_popup_x') == null ) {
        $('.donations-pop-up-bg').css({'display': 'block'});
        
        var current_hours = (new Date()).getHours();
        var hours_to_expire = 0;
        if( current_hours > 19 ){
            hours_to_expire = 8;
        }else{
            hours_to_expire = 23 - current_hours;
        }

        createCookie('donations_popup_x', '1', hours_to_expire, true);

        var data = {
            'ge_category' : 'Donations Campaign Popup',
            'ge_action' : 'Display',
            'ge_label' : SITE_INFO['name'],
            'ge_noninteraction': true,
        };

        send_ga_event(data);

        $('.donations-pop-up-bg').on('click', function(){
            $('.donations-pop-up-bg').css({'display': 'none'});
        });

        $('.donations-pop-up-close').on('click', function(){
            $('.donations-pop-up-bg').css({'display': 'none'});
        });
    }

    // if banner banner not shown, show it
    if( ( $('.donations_wrapper').length > 0 || $('.mobile_banner_wrapper').length > 0 ) && readCookie('donations_banner_x2') == null ){
        $('.donations_wrapper').css({'display': 'block'});
        $('.mobile_banner').css({'display':'block'});
        
        var current_hours = (new Date()).getHours();
        var hours_to_expire = 0;
        if( current_hours > 19 ){
            hours_to_expire = 8;
        }else{
            hours_to_expire = 23 - current_hours;
        }

        createCookie('donations_banner_x2', '1', hours_to_expire, true);

        var data = {
            'ge_category' : 'Donations Campaign Banner',
            'ge_action' : 'Display',
            'ge_label' : SITE_INFO['name'],
            'ge_noninteraction': true,
        };

        send_ga_event(data);

    }else if(window.innerWidth <= 768) { 
        $('#container .flex-viewport').css({'margin-top': '80px'});
    }

}

function initStatsCounter(){

    if( SITE_NAME != 'politics' ){
        return;
    }

    window.sc_project = 12673371; 
    window.sc_invisible = 1; 
    window.sc_security = "ce910324"; 
    
    var e = document.createElement('script');
    var n = document.getElementsByTagName('script')[0];
    e.type = 'text/javascript';
    e.async = true;
    e.src = 'https://www.statcounter.com/counter/counter.js';
    n.parentNode.insertBefore(e, n);
}









////////////////////////////////////////////////////////////////////////////////
// PRESERVE COMPATIBILITY //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var siteName = SITE_INFO['name'];
var sitePage = SITE_PAGE;
var gaTag = GA_TAG;
var site_title = SITE_INFO['site_title'];
var facebook_url = SITE_INFO['facebook_url'];
var twitter_url = SITE_INFO['twitter_url'];
var twitter_related = SITE_INFO['twitter_related'];
var global_site_url = SITE_INFO['global_site_url'];
var site_color = SITE_INFO['site_color'];
var FB_app_id = SITE_INFO['FB_app_id'];
var global_data_loc = SITE_INFO['global_data_loc'];
//var revc_id = SITE_INFO['revc_id'];
//var revc_w = SITE_INFO['revc_w'];
//var revc_id_side = SITE_INFO['revc_id_side'];
//var revc_w_side = SITE_INFO['revc_w_side'];
var zerg_id = SITE_INFO['zerg_id'];
var auto_list_ids = SITE_INFO['auto_list_ids'];
var spot_production_id = SITE_INFO['spot_production_id'];
var google_one_tap_client_id = SITE_INFO['google_one_tap_client_id'];










////////////////////////////////////////////////////////////////////////////////
// BROWSER / OS DETECTION //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Adds ability to detect browser
navigator.browserInfo = (function(){

    var ua= navigator.userAgent, tem,
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return {'browser': 'IE', 'version': (tem[1] || '')};
    }

    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null){
            var temp = tem.slice(1);
            return { 'browser': temp[0].replace('OPR', 'Opera'), 'version': temp[1] };
        }
    }

    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem = ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return { 'browser': M[0], 'version': M[1] };
})();

// Adds ability to detect OS
navigator.osInfo = (function(){
    var ua = navigator.userAgent;
    var av = navigator.appVersion;
    var os = 'unknown';
    var clientStrings = [
        {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
        {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
        {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
        {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
        {s:'Windows Vista', r:/Windows NT 6.0/},
        {s:'Windows Server 2003', r:/Windows NT 5.2/},
        {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
        {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
        {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
        {s:'Windows 98', r:/(Windows 98|Win98)/},
        {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
        {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
        {s:'Windows CE', r:/Windows CE/},
        {s:'Windows 3.11', r:/Win16/},
        {s:'Android', r:/Android/},
        {s:'Open BSD', r:/OpenBSD/},
        {s:'Sun OS', r:/SunOS/},
        {s:'Linux', r:/(Linux|X11)/},
        {s:'iOS', r:/(iPhone|iPad|iPod)/},
        {s:'Mac OS X', r:/Mac OS X/},
        {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
        {s:'QNX', r:/QNX/},
        {s:'UNIX', r:/UNIX/},
        {s:'BeOS', r:/BeOS/},
        {s:'OS/2', r:/OS\/2/},
        {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
    ];
    for (var id in clientStrings) {
        var cs = clientStrings[id];
        if (cs.r.test(ua)) {
            os = cs.s;
            break;
        }
    }

    var osVersion = 'unknown';

    if (/Windows/.test(os)) {
        osVersion = /Windows (.*)/.exec(os)[1];
        os = 'Windows';
    }

    switch (os) {
        case 'Mac OS X':
            
            osVersion = /Mac OS X ([0-9]+[0-9]+[\.\_\d]+)/.exec(ua)[1];

            if(osVersion == null) {
                osVersion = 'unknown';
            }
            break;

        case 'Android':
            osVersion = /Android ([\.\_\d]+)/.exec(ua)[1];
            if(osVersion == null) {
                osVersion = 'unknown';
            }
            break;

        case 'iOS':
            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(av);
            if(osVersion == null) {
                osVersion = 'unknown';
            } else {
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
            }
            break;
    }

    return { 'os': os, 'os_version': osVersion };
})();











////////////////////////////////////////////////////////////////////////////////
// NOTIFICATIONS ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function loadNotificationsPromo() {

    var bc;
    if( $("body.article").length>0 ){
        bc = "article";
    }else if( $("body.entry").length>0 ){
        bc = "entry";
    }else if( $("body.video").length>0 ){
        bc = "video";
    }else if( $("body.polls").length>0 ){
        bc = "polls";
    }else if( $("body.election").length>0 ){
        bc = "election";
    }else if( $("body.story-stream").length>0 ){
        bc = "story-stream";
    }else if( $("body.custom-topic").length>0 ){
        bc = "custom-topic";
    }else if( $("body.cartoon").length>0 ){
        bc = "cartoon";
    }else if( $("body.about").length>0 ){
        bc = "about";
    }else if( $("body.list").length>0 ){
        bc = "list";
    }else if( $("body.static").length>0 ){
        bc = "static";
    }else if( $("body.author").length>0 ){
        bc = "author";
    }else if( $("body.changingLanes").length>0 ){
        bc = "changingLanes";
    }else if( $("body.entry-date-based").length>0 ){
        bc = "entry-date-based";
    }else if( $("body.links").length>0 ){
        bc = "links";
    }else if( $("body.event").length>0 ){
        bc = "event";
    }else{
        bc = $("body").attr("class");
    }

    var notificationsPopCookie = readCookie('notificationsScrollPop');

    var commenter_id = readCookie('realclear_user');
    if(!commenter_id){
        commenter_id = 0;
    }

    if( !notificationsPopCookie ){

        //_gaq.push(['_trackEvent', 'Notifications', 'Auto Pop', "'"+bc+"'"]);
        _gaq.push(['_trackEvent', 'Notifications', 'Auto Pop', SITE_INFO['name']+' : '+bc, null, true]);

        var site_settings = notification_settings(SITE_INFO['name']);

        var notifications_copy = '\
      <div id="notifications_fixed" class="nt_fixed">\
            <div id="notifications_title">\
              <!--<div class="nt_top"><img height="60" class="nt_logo" src="/asset/img/rcp-logo-ss-red-250.gif" alt="RealClearPolitics" /></div>-->\
                <h3><img class="nt_icon" height="20" src="/asset/img/notifications_icon.png" alt="Notifications" /> Notifications</h3>\
            </div>\
            <div id="notifications_content">\
                <span id="notif_content">\
                  <img src="'+site_settings.notif_preview_url+'" style="width: 100%;border: 1px #cecdcd solid;box-shadow:rgba(168, 166, 168, 0.521569) 2px 2px 1px 0px;">\
                    <p>Would you like to receive nonobstrusive notifications?</p>\
                    <p>Notifications can come in whether you are on our site or not, and even if your browser is closed.</p>\
                    <p>You can always disable notifications in the future.</p>\
                </span>\
                <span id="notif_response">\
                </span>\
                <div id="notif_buttons_wrapper">\
                    <button type="button" class="notif_btn notif_btn_action" id="enable_notifications">Enable</button>\
                    <br />\
                    <button type="button" class="notif_btn notif_btn_ignore notif_popup_action">Not Now</button>\
                </div>\
            </div>\
        </div>';

        jQuery.facebox(notifications_copy);

        $('#enable_notifications').click(function(){

            //_gaq.push(['_trackEvent', 'Notifications EnableClick : ' + bc + ' module', 'Site: ' + SITE_INFO['name']]);
            _gaq.push(['_trackEvent', 'Notifications', 'Click', 'Pop Button-1', 1]);

            $('.overlay').remove();
            $(document).trigger('close.facebox');
            var this_url = encodeURIComponent(location.href);

            var notif_url = 'https://notifications.realclearpolitics.com/web_notifications/sign_up.html?';
            var query_string = 'site_shortname='+SITE_INFO['global_data_loc']+'&site='+SITE_INFO['name']+'&section='+bc+'&auto_list_ids='+SITE_INFO['auto_list_ids']+'&commid='+commenter_id+'&url='+this_url+'&enable=1';
            window.location = notif_url+query_string;
            //window.open(notif_url+query_string);
        });
        $('.notif_btn_ignore').click(function() {

            //_gaq.push(['_trackEvent', 'Notifications Not Now : ' + bc + ' module', 'Site: ' + SITE_INFO['name']]);
            _gaq.push(['_trackEvent', 'Notifications', 'Click', 'Pop Button-0', 0]);

            $('.overlay').remove();
            $(document).trigger('close.facebox');
        });

        $(".overlay").show("fast");

        goToByScroll("facebox");

        createCookie('notificationsScrollPop','1','365');

        //fire google tracking event
        //_gaq.push(['_trackEvent', 'Notifications Pop : ' + bc + ' module', 'Site: ' + SITE_INFO['name']]);

    }else{

    }
}

function notification_settings(site){
    var site_settings;
    var notifs_root = "https://notifications.realclearpolitics.com/web_notifications/";
    switch(site){
        case 'politics':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcp.png",
                "notif_preview_250":notifs_root+"images/notification_rcp_250px.png"
            };
            break;
        case 'world':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcw.png"
            };
            break;
        case 'future':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcf.png"
            };
            break;
        case 'health':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rch.png"
            };
            break;
        case 'markets':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcm.png"
            };
            break;
        case 'defense':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcd.png"
            };
            break;
        case 'energy':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rce.png"
            };
            break;
        case 'science':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcs.png"
            };
            break;
        case 'religion':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcr.png"
            };
            break;
        case 'education':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rced.png"
            };
            break;
        case 'sports':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcsp.png"
            };
            break;
        case 'history':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rchi.png"
            };
            break;
        case 'books':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcb.png"
            };
            break;
        case 'investigations':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rci.png"
            };
            break;
        case 'policy':
            site_settings = {
                "notif_preview_url":notifs_root+"images/notification_rcpo.png"
            };
            break;
        default:
            site_settings = {};
            break;
    }
    return site_settings;
}

function loadNewsletterPromo(){

    var bc;
    if( $("body.article").length>0 ){
        bc = "article";
    }else if( $("body.entry").length>0 ){
        bc = "entry";
    }else if( $("body.video").length>0 ){
        bc = "video";
    }else if( $("body.polls").length>0 ){
        bc = "polls";
    }else if( $("body.election").length>0 ){
        bc = "election";
    }else if( $("body.story-stream").length>0 ){
        bc = "story-stream";
    }else if( $("body.custom-topic").length>0 ){
        bc = "custom-topic";
    }else if( $("body.cartoon").length>0 ){
        bc = "cartoon";
    }else if( $("body.about").length>0 ){
        bc = "about";
    }else if( $("body.list").length>0 ){
        bc = "list";
    }else if( $("body.static").length>0 ){
        bc = "static";
    }else if( $("body.author").length>0 ){
        bc = "author";
    }else if( $("body.changingLanes").length>0 ){
        bc = "changingLanes";
    }else if( $("body.entry-date-based").length>0 ){
        bc = "entry-date-based";
    }else if( $("body.links").length>0 ){
        bc = "links";
    }else if( $("body.event").length>0 ){
        bc = "event";
    }else{
        bc = $("body").attr("class");
    }

    if( SITE_INFO['name'] != "investigations" && (!$("body").hasClass("home") && !$("body").hasClass("welcome")) ){
        var news_letter_page = false;
        if(bc == 'static'){
            var script_url = 'http://www.realclearpolitics.com/scripts/rc-newsletters.js';
            var script_url2 = 'https://www.realclearpolitics.com/scripts/rc-newsletters.js';
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length; i--;) {
                if (scripts[i].src == script_url || scripts[i].src == script_url2) {
                    news_letter_page = true;
                }
            }
        }

        if( news_letter_page == false){

            var sign_in_copy='<div class="sign_in_form sign_up_form"><h2>Sign Up for Our Newsletters!</h2><div class="newsletter-signup-container3" id="jqNewsPop"><div class="jsTag jqNewsPop" data-loc="newsletter-scrollpop-' + bc + '-' + SITE_INFO['global_data_loc'] + '" id="jsTagPromo" data-auto-checks="'+SITE_INFO['auto_list_ids']+'"></div></div></div>';

            jQuery.facebox(sign_in_copy);
            $(".overlay").show("fast");

            loadscript('https://www.realclearpolitics.com/asset/top/rc-newsletters.js', 'jqNewsPop', '', '');

            goToByScroll("facebox");

            createCookie('newsletterScrollPop','1','365');

            //fire google tracking event
            _gaq.push(['_trackEvent', 'Newsletters Pop', 'Auto Pop', SITE_INFO['name']+' : '+bc, null, true]);
            //_gaq.push(['_trackEvent', 'Newsletter/Notifications Pop', 'Auto Pop', SITE_INFO['name']+' : '+bc, '', true]);
            //_gaq.push(['_trackEvent', 'Newsletters Pop', 'Auto Pop', "'+bc+'", true]);
            //console.log(test);

        }
    }

}

/**
 * Displays inline content for articles, videos and polls to sign up for notifications
 * and to sign up for newsletters.
 *
 * inline_widget.create_notifs_sign_up_for_warning() is used by warning_widget to display
 * notifications sign up
 *
 * @type {Object}
 */
var inline_widget = {};
inline_widget = notification_settings(SITE_INFO['name']);
inline_widget.siteName = SITE_INFO['name'];
inline_widget.site = SITE_INFO['global_data_loc'];
inline_widget.list_ids = SITE_INFO['auto_list_ids'];
inline_widget.perma;
inline_widget.browser = navigator.browserInfo.browser;
inline_widget.os = navigator.osInfo.os;
inline_widget.no_cache = new Date().getTime();
inline_widget.notif_icon = '//www.realclearpolitics.com/asset/img/notifications_icon.png';
inline_widget.notif_text = 'Sign Up For Browser Push Notifications';

inline_widget.create_notifs_sign_up = function(){
    return this.notifications_inline = '\
    <div class="inline_sign_up_box" id="notifications_hover">\
        <span class="inline_hover_details">\
            <span class="inline_hover_content">\
                <span class="hover_details_text">\
                    <span>Browser push notifications are small unobstrusive notifications delivered by your browser.</span>\
                </span>\
                <span class="hover_details_image">\
                    <img class="hover_notif_preview" src="'+this.notif_preview_250+'">\
                </span>\
            </span>\
        </span>\
        <div class="inline_notifications_wrapper">\
            <div class="inline_sign_up_left">\
                <span class="inline_sign_up_icon">\
                    <img src="'+this.notif_icon+'">\
                </span>\
                <span class="inline_sign_up_text">\
                    '+this.notif_text+'\
                </span>\
            </div>\
            <div class="inline_sign_up_right">\
                <span class="inline_sign_up_action">\
                    <button type="button" id="notifications_sign_up" class="inline_sign_button new_notif_sign_up">\
                        Sign Up\
                    </button>\
                </span>\
            </div>\
        </div>\
    </div>\
    ';
}

inline_widget.create_notifs_sign_up_for_warning = function(){
    return this.notifications_inline = '\
    <div class="inline_sign_up_box" id="notifications_hover">\
        <div class="inline_notifications_wrapper">\
            <div class="inline_sign_up_left">\
                <span class="inline_sign_up_icon">\
                    <img src="'+this.notif_icon+'">\
                </span>\
                <span class="inline_sign_up_text">\
                    '+this.notif_text+'\
                </span>\
            </div>\
            <div class="inline_sign_up_right">\
                <span class="inline_sign_up_action">\
                    <button type="button" id="notifications_sign_up" class="inline_sign_button new_notif_sign_up">\
                        Sign Up\
                    </button>\
                </span>\
            </div>\
        </div>\
    </div>\
    ';
}

inline_widget.create_news_sign_up = function(){
    return this.newsletters_inline = '\
    <div class="inline_sign_up_box" id="newsletters_inline">\
        <div class="inline_sign_up_left">\
            <span class="inline_sign_up_icon">\
                <img class="newspaper" src="//www.realclearpolitics.com/asset/img/icon-newspaper.png">\
            </span>\
            <span class="inline_sign_up_text">\
                Sign Up For RC Newsletters\
            </span>\
        </div>\
        <div class="inline_sign_up_right">\
            <script src="//www.realclearpolitics.com/asset/top/rc-newsletters-v2.js?v='+this.no_cache+'" type="text/javascript" class="jsTag" data-loc="Inline-Widget-RCP" data-auto-checks="`+inline_widget.list_ids+`"></script>\
            <div class="newsletter-signup-container2" data-loc="Inline-Widget-RCP" data-auto-checks="'+this.list_ids+'" style="display:block; margin-bottom:20px">\
            </div>\
        </div>\
    </div>\
    ';
}

inline_widget.notifications_actions = function(){
    $('#notifications_hover').on({
        mouseenter: function(){
            if($(window).width() >= 1024){
                _gaq.push(['_trackEvent', 'Notifications', 'Inline Sign Up', 'Hover '+inline_widget.perma, null, true]);
                $('.hover_notif_preview').css('left', '260px');
                $('.inline_hover_details').css('display', 'table');
                $(".hover_notif_preview").animate({ "left": "0px" }, "slow" );
            }
        },
        mouseleave: function(){
            $('.inline_hover_details').css('display', 'none');
            $(".hover_notif_preview").attr('style', '');
        }
    });
}

inline_widget.insert_html = function(element){
    var notifications_inline_article = readCookie('notifications_inline_article');
    var newsletter_inline_article = readCookie('newsletter_inline_article');

    if( $(element).length == 0 ){
        console.log('Inline widget div "'+element+'" is missing form the page. Exiting early.');
        return;
    }

    // 03-07-2019 disable notifications sign ups until resolved A.A.
    var disableNewNotifications = true;
    if(disableNewNotifications == false && notifs.notifs_work == true && notifs.enabled == false ){
        _gaq.push(['_trackEvent', 'Notifications', 'Display Inline', 'Auto '+this.perma, null, true]);
        if(this.perma == 'article'){
            $(element).after(this.create_notifs_sign_up());
        }else if(this.perma == 'video'){
            $(element).after(this.create_notifs_sign_up());
        }else if(this.perma == 'latest_polls' || this.perma == 'poll'){
            this.notif_text = 'Sign Up for Polls Push Notifications';
            this.notif_icon = '//www.realclearpolitics.com/asset/img/notif_poll_icon.png';
            $(element).after(this.create_notifs_sign_up());
        }
        this.notifications_actions();
        createCookie('notifications_inline_article','1','7');
        eraseCookie('newsletter_inline_article');
    }else{
        _gaq.push(['_trackEvent', 'Newsletters', 'Display Inline', 'Auto '+this.perma, null, true]);
        if(this.perma == 'article'){
            $(element).after(this.create_news_sign_up());
        }else if(this.perma == 'video'){
            $(element).after(this.create_news_sign_up());
        }else if(this.perma == 'latest_polls' || this.perma == 'poll'){
            $(element).after(this.create_news_sign_up());
        }
        createCookie('newsletter_inline_article','1','7');
        eraseCookie('notifications_inline_article');
    }
}

inline_widget.article = function(){
    this.perma = 'article';
    /*var paragraphs = $('.alpha .article-body-text p');
  var half_paragraphs = parseInt(parseInt(paragraphs.length) / 2);
  if(half_paragraphs > 3){
    this.insert_html(paragraphs[half_paragraphs]);
  }*/
    this.insert_html('.article-social-bottom-wrapper');
}

inline_widget.video = function(){
    this.perma = 'video';
    this.insert_html('#related-footer');
}

inline_widget.poll = function(){
    var location = window.location.pathname;
    if(location == '/epolls/latest_polls/'
        || location == '/epolls/latest_polls/index.html'){
        this.perma = 'latest_polls';
        this.insert_html('p#my-nav');
    }else{
        this.perma = 'poll';
        this.insert_html('div#chart_slider_holder');
    }
}

inline_widget.insert_widget_into_page = function(){
    setTimeout(function(){
        if($('body').hasClass('article') && !$('body').hasClass('article-landing') && !$('body').hasClass('long')){
            inline_widget.article();
        }else if($('body').hasClass('video-perma')){
            inline_widget.video();
        }else if($('body').hasClass('polls')){
            inline_widget.poll();
        }
    },1500);
}



/**
 * Displays underlay at the bottom of the page
 * Currently displays:
 *    notifications sign up
 *    ad block message
 *    will use for ad targeting
 *    will user for newsletter sign up
 * @type {Object}
 */

//initialize object and default settings
warning_widget.empty_div = '<div id="warning_empty_div"></div>';
warning_widget.siteName = SITE_INFO['name'];
warning_widget.close_icon = "<a class='close warning_close' href='#'><img src='https://www.realclearpolitics.com/asset/img/close_icon.png' /></a>";
warning_widget.icon = "https://www.realclearpolitics.com/asset/img/Asset_3.png";
warning_widget.info_message = "Our website is partially funded by displaying online advertisements to our visitors. Please consider supporting us by disabling your Ad-Blocker.";

warning_widget.info = "";
warning_widget.footer_pos = 0;
warning_widget.scroll_fix = 0;
warning_widget.active = false;
warning_widget.active_notice = "";

warning_widget.warning_template = function(){
    var warning_ad_block_enabled = readCookie('warning_ad_block_enabled');

    if(!warning_ad_block_enabled){
        if( $('#warning_empty_div').length == 0 ){
            $(this.empty_div).appendTo('body');
        }

        $('#warning_empty_div').html(this.set_message());
        this.event_listeners();
        $('.warning-wrapper').show();
        $('.warning-wrapper').css('display', 'block');
        $('div.overlay').css('z-index', 500).show();
        $('.warning-wrapper .container').css({
            top: '50%',
            transform : 'translateY(-50%)',
        });
        this.set_scroll_settings();
        this.active = true;
        this.active_notice = "ad block message";

        createCookie('warning_ad_block_enabled', 'temp', 5, true);
        _gaq.push(['_trackEvent', 'notices', 'Underlay', 'option: ad block message', null, true]);

        // var body_class = $('body').attr('class');
        // _gaq.push(['_trackEvent', 'AdBlocker', 'adblocker-blocked', 'section: '+body_class, null, true]);
    }

}

warning_widget.set_notifications_sign_up = function(){
    var warning_notif_underlay = readCookie('warning_notif_underlay');

    if(!warning_notif_underlay){

        if( $('#warning_empty_div').length == 0 ){
            $(this.empty_div).appendTo('body');
        }

        $('#warning_empty_div').html(this.set_notification());
        this.event_listeners();
        $('.inline_sign_up_box').css({
            'bottom': '14px',
            'left': '0',
            'right': '0',
        });
        $('.warning-wrapper').show();
        $('.warning-wrapper').css('display', 'block');

        this.set_scroll_settings();
        this.active = true;
        this.active_notice = "notifications sign up";
        createCookie('warning_notif_underlay', 'temp', '12', true);
        _gaq.push(['_trackEvent', 'notices', 'Underlay', 'option: notifications sign up', null, true]);
    }

}

warning_widget.set_newslettter_sign_up = function(){
    var warning_newsletter_underlay = readCookie('warning_newsletter_underlay');

    if(!warning_newsletter_underlay){
        if( $('#warning_empty_div').length == 0 ){
            $(this.empty_div).appendTo('body');
        }

        $('#warning_empty_div').html(this.newsletter_html());

        $('.warning-wrapper').show();
        $('.warning-wrapper').css('display', 'block');
        this.set_scroll_settings();
        this.newsletter_listeners();
        this.event_listeners();
        this.active = true;
        this.active_notice = "newsletter sign up";

        createCookie('warning_newsletter_underlay', 'temp', '12', true);
        _gaq.push(['_trackEvent', 'notices', 'Underlay', 'option: newsletter sign up', null, true]);
    }
}

warning_widget.set_message = function(){
    return "\
    <div class='warning-wrapper'>\
      "+ this.close_icon +"\
      <div class='container'>\
        <div class='image-wrapper'><img src='"+ this.icon +"' /></div>\
        <div class='message-wrapper'><span class='info-message'>"+ this.info_message +"</span></div>\
      </div>\
    </div>";
}

warning_widget.set_notification = function(){
    return "\
    <div class='warning-wrapper notif-wrapper'>\
      "+ this.close_icon +"\
      <div class='container'>\
      "+inline_widget.create_notifs_sign_up_for_warning()+ "\
      </div>\
    </div>";
}

warning_widget.newsletter_html = function(){
    return "\
        <div class='warning-wrapper notif-wrapper'>\
            "+ this.close_icon +"\
            <div class='container'>\
            "+inline_widget.create_news_sign_up()+ "\
            </div>\
        </div>";
}

warning_widget.position_div = function(scrollPosition){
    if (scrollPosition >= this.footer_pos - 15) {
        // If the function is only supposed to fire once
        var footer_height = $('.footer-wrapper').height();
        $('.warning-wrapper').css({'position': 'fixed', 'bottom': footer_height+'px' });
    }else{
        $('.warning-wrapper').css({'position': 'fixed', 'bottom': '0px'});
    }
}

warning_widget.event_listeners = function(){
    $('.warning_close').on('click', function(){
        $('.warning-wrapper').hide();
        $('div.overlay').css('z-index', 1).hide();
        warning_widget.active = false;

        //on close, check how many times it has been closed before
        //if closed three times create cookie to seven days
        //else create cookie for two days
        //warning underlay cookie that applies to all types of underlays

        var underlay_close_click_count = readCookie('underlay_close_click_count');
        var underlay_close_clicks;

        if(!underlay_close_click_count){
            underlay_close_clicks = 1;
        }else{
            underlay_close_clicks = parseInt(underlay_close_click_count) + 1;
        }

        createCookie('underlay_close_click_count', underlay_close_clicks, 365);

        eraseCookie('warning_underlay');

        if(underlay_close_clicks >= 3){
            createCookie('warning_underlay', 'temp', 7);
        }else{
            createCookie('warning_underlay', 'temp', 2);
        }

        _gaq.push(['_trackEvent', 'notices', 'Underlay', 'option: '+warning_widget.active_notice+' close', null, true]);
        return false;
    });

    //change the position of the elemtent when reached to the bottom of the page -150px
    $(window).on('scroll', function() {
        var scrollPosition = $(this).scrollTop() + warning_widget.scroll_fix;
        warning_widget.position_div(scrollPosition);
    });
}

warning_widget.newsletter_listeners = function(){
    var window_width = $(window).width();
    if(window_width <= 415){
        $('.warning-wrapper').css('height', '75px');
        $('.inline_sign_up_box').css({
            top: '-15px',
        });
    }else if(window_width < 1024){
        $('.warning-wrapper').css('height', '100px');
    }


    $(document).on('focus', '.warning-wrapper #list_email', function(){
        var $this = this;
        setTimeout(function(){
            var height = $($this).parents('.inline_sign_up_box').css('height');
            var warning_height = '';
            if(window_width >= 768){
                warning_height = parseInt(height) + 20;
            }else{
                warning_height = parseInt(height) - 30;
            }

            $('.warning-wrapper').css('height', warning_height+'px');
            $('.sign_up_open').css({
                'height' : (height-10) + 'px',
                'position' : 'relative',
                'top' : '-15px',
            });
        },150);
    });
}

warning_widget.set_scroll_settings = function(){

    if($('.footer').length) {

        var footer_pos = $('.footer').offset();
        this.footer_pos = footer_pos.top;
        var window_height = $(window).height();
        this.scroll_fix = window_height - $('.footer-wrapper').height();
    }
}

warning_widget.check_ad_block_status = function(force_check){

    force_check = force_check || false;
    Utils.global_settings.realclear_ad_block_check = null;

    //if it doesn't load it in into the body
    //it will be blocked by ad block plugins
    //then run the ad block checks
    if( force_check == false){
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "/asset/section/gpt.js?v=4";
        script.id = "adunit-js";
        script.crossOrigin = 'anonymous';
        script.onload = function() {

            console.log('ad-block script was loaded successfully');

            if ( document.getElementById('mjiFajjseefh') !== null && document.getElementById('mjiFajjseefh').clientHeight !== 0 ) {

                Utils.global_settings.realclear_ad_block_check = false;
                warning_widget.ad_block_ready_for_check = true;

            }

        }
        script.onerror = function(){
            // on error force check the status of ad block
            //warning_widget.check_ad_block_status(true);
            console.log('No need to try to run this check if there was an error');
            //if there was an error loading it then this means the user had ad-blocker enabled
            //This will only happen if there was an error
            Utils.global_settings.realclear_ad_block_check = true;
            warning_widget.ad_block_ready_for_check = true;

            if(SITE_INFO['name'] == 'politics'){
                checkIfAnalyticsLoaded2();
            }

            if(typeof _gaq != 'undefined') {
                var body_class = $('body').attr('class');
                _gaq.push(['_trackEvent', 'Adblock Tracker', 'Adblocker enabled', 'section: ' + body_class, null, true]);
            }

        }

        document.body.appendChild(script);

    }

}


//if user is referred to site from a newsletter link
//then we don't want to show the underlay for newsletters for a year
warning_widget.check_for_newsletter_referer = function(){
    var utm_campaign = Utils.get_query_param('utm_campaign');
    var utm_medium = Utils.get_query_param('utm_medium');

    if( (utm_campaign !== null && typeof utm_campaign === 'string') && (utm_medium !== null && typeof utm_medium === 'string') ){
        //check if from mailchimp email
        if( /EMAIL_CAMPAIGN/i.test(utm_campaign) && utm_medium === 'email' ){
            //create newseltter cookie to expire in one year
            eraseCookie('warning_newsletter_underlay');
            createCookie('warning_newsletter_underlay', 'From Newsletter', '365', false);
            _gaq.push(['_trackEvent', 'notices', 'Underlay', 'newsletter click: disable notice', null, true]);
        }
    }
}

$(document).ready(function(){
    warning_widget.set_scroll_settings();
    $(warning_widget.empty_div).appendTo('body');
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },1000);
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },2000);
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },3000);
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },4000);
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },5000);
    setTimeout(function(){
        warning_widget.set_scroll_settings();
    },6000);

    warning_widget.check_ad_block_status();
});

$(window).resize(function(){
    warning_widget.set_scroll_settings();
    $(window).scroll();
});


/*
*
* Install PWA on Safari or Android
* DATE: FEB 2 2020
* @ Add To HOME SCREEN
* */

window.mobileAndTabletcheck = function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

$(document).ready(function(){

    if(iOSSafari(navigator.userAgent) && siteName == 'politics'){

        if(window.navigator.standalone == true && typeof window.navigator !== 'undefined' && typeof window.navigator.standalone !== 'undefined' ){
            // if user is viewing the app from the Homescreen
            //we could target other behaivor
        } else {

            if(check_notif_cookie_to_display()){
                /*Temporarly disableing it because we at the moment there is no way to see if page has been bookedmarked on ios*/
                //msg = "Install this web app on your iPhone. Tap <img src='/asset/img/safari_action_icon.png'> and then <b>Add to Home Screen.</b>";
                //display_ios_modal(msg, 'safari');
            }
        }

    }

});

function append_manifest(){
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'https://www.realclearpolitics.com/asset/vertical/rcp/manifest.json';
    document.head.appendChild(link);
}

//Service worker

if ('serviceWorker' in navigator ) {

    /*navigator.serviceWorker.getRegistrations().
        then(function (registrations) {

            for (let registration of registrations) {
                registration.unregister();

            }
        });*/

    if(siteName == 'politics'){
        append_manifest();

        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
                // Registration was successful
                console.log('ServiceWorker registration successful with scope: ', registration.scope);

            }, function(err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
            });

        });
    }

}

var deferredPrompt;

window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;

    //After detecting it can be installed show button
    install_app_init();
});

window.addEventListener('appinstalled', function(evt){
    //we know it has been installed hide button
    //trigger ga events to
    //console.log('a2hs installed');

    var data = {
        'ge_action' : 'Installed',
        'ge_category' : 'Notices',
        'ge_label' : 'add-to-homescreen',
        'ge_noninteraction' : false
    };
    send_ga_event(data);

});

function install_app_init() {

    if( check_notif_cookie_to_display() && mobileAndTabletcheck() && siteName == 'politics' ){
        display_install_btn();
    }

}

function iOSSafari(userAgent)
{
    return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent) && !(/(CriOS|FxiOS|OPiOS|mercury)/i.test(userAgent));
}
function display_ios_modal(message , css_class){

    html = '<div class="pwa-underlay-notification '+ css_class +'">' +
        '<span class="btn-close">X</span>' +
        '<div class="pwa-wrapper">' +
        '   <a href="#" class="pwa-btn"> '+ message +'</a>' +
        '</div>'+
        '</div>';

    $('body').append(html);

    $(document).on('click', '.pwa-underlay-notification span.btn-close', function(e){
        $('.pwa-underlay-notification').hide().remove();
    });

    var data = {
        'ge_action' : 'Prompt',
        'ge_category' : 'Notices',
        'ge_label' : 'add-to-homescreen',
        'ge_noninteraction' : false
    };

    send_ga_event(data);

}
/*
* UX
* O(ny display the notification on the 3rd visit
* */
function check_notif_cookie_to_display(){
    hp_pwa_notif_value = parseInt(readCookie('hp_pwa_notif') ) || createCookie('hp_pwa_notif', 1, 30);

    if(hp_pwa_notif_value && siteName == 'politics') {

        if (hp_pwa_notif_value < 3) {
            createCookie('hp_pwa_notif', hp_pwa_notif_value + 1, 30);
            return false;
        } else if (hp_pwa_notif_value == 3) {
            createCookie('hp_pwa_notif', hp_pwa_notif_value + 1, 30);
            return true;
        }

        return false;
    }
}

function display_install_btn(){

    msg = '<img src="/asset/img/rcp_pwa_icon_sm.png" alt="RCP App Icon" /> <span>Add <b>RCP</b> to <br> Home Screen!</span>';

    display_ios_modal(msg , 'sw-enabled');

    $(document).on('click', '.pwa-btn', function(e){
        deferredPrompt.prompt();

        deferredPrompt.userChoice
            .then( function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
    });

    //Only show it once a month
    check_notif_cookie_to_display();

}


/*
* End of PWA INSTALL
* */




////////////////////////////////////////////////////////////////////////////////
// TEMPSHOW LIBRARY ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* Tempshow js notification library
*  v1.0 (c) 2018 RealClear
*/
window.Tempshow = function() {

    this.default = {
        width: '300px',       // any css width unit
        horizontal: 'right',  // left, center, right
        vertical: 'top',      // top, center, bottom
        type: 'info',         // warning, info, success, fail, or custom
        seconds: 10,          // default seconds until removed
        msg: '',              // message string
    };

    this.remove_timeouts = [];

    this.template = '<div id="tempshow_notif_{{notif_id}}" class="tempshow_notif_wrapper type_{{type}} horizontal_{{horizontal}} vertical_{{vertical}}" style="max-width:{{width}}">' +
        '<div class="msg">{{msg}}</div>' +
        '<div class="exit">X</div>' +
        '</div>';

    this.generate_id = function() {
        return Math.floor(Math.random() * Math.floor(9999999999));
    };

    this.create = function(new_options) {

        // if body isn't ready try again and exit early
        if( document.body === null ){
            console.log("BODY NOT READY FOR TEMP SHOW", document.body);
            setTimeout(function(){
                var tempshow = new Tempshow();
                tempshow.create(new_options);
            }, 250);
            return;
        }

        var html = this.template;

        // Apply options
        var options = this.default;

        for (var property in new_options) {
            if (new_options.hasOwnProperty(property)) {
                options[property] = new_options[property];
            }
        }

        html = html.replace('{{msg}}', options.msg);
        html = html.replace('{{type}}', options['type']);
        html = html.replace('{{horizontal}}', options.horizontal);
        html = html.replace('{{vertical}}', options.vertical);
        html = html.replace('{{width}}', options['width']);

        var notif_id = this.generate_id();

        html = html.replace('{{notif_id}}', notif_id);

        // Add new notification
        document.body.insertAdjacentHTML('beforeend', html);

        // Add click removal
        var exit_btn = document.querySelector('#tempshow_notif_'+notif_id+' .exit');

        this.addEvent(exit_btn, 'click', function() {

            parent.remove_existing(notif_id);

        }.bind(parent = this, notif_id));

        // Start removal timeout
        this.remove_timeouts.push(window.setTimeout(function() {

            parent.remove_existing(notif_id);

        }.bind(parent = this, notif_id), options.seconds * 1000));
    };

    this.remove_existing = function(notif_id) {

        // If 'animations' available in browser, do animation then remove at end of animation
        // If not available, just remove it right away

        var existing = document.querySelector('#tempshow_notif_'+notif_id);

        if(existing !== null) {

            if(this.isAnimationSupported()) {

                if( !this.hasClass(existing, 'remove') ) {

                    transitionEndEventNames.forEach( function(evt) {

                        existing.addEventListener(evt, function() {

                            existing.parentNode.removeChild(existing);

                        }.bind(existing), false);

                    }.bind(existing));

                    this.addClass(existing, 'remove');
                }

            } else {
                existing.parentNode.removeChild(existing);
            }
        }
    };

    // UTILITY

    this.addClass = function(el, className) {
        if (el.classList) el.classList.add(className);
        else if (!hasClass(el, className)) el.className += ' ' + className;
    };

    this.hasClass = function(el, className) {
        return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
    };

    var transitionEndEventNames = [
        'animationend',
        'webkitAnimationEnd',
        'oAnimationEnd',
        'MSAnimationEnd'
    ];

    this.isAnimationSupported = function() {
        var thisBody = document.body || document.documentElement,
            thisStyle = thisBody.style,
            support = thisStyle.animation !== undefined ||
                thisStyle.WebkitAnimation !== undefined ||
                thisStyle.MozAnimation !== undefined ||
                thisStyle.MsAnimation !== undefined ||
                thisStyle.OAnimation !== undefined;
        return support;
    };

    this.addEvent = function(el, type, handler) {
        if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
    };

};











////////////////////////////////////////////////////////////////////////////////
// EVOLOK LIBRARY //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

if(SITE_INFO['evolok_enabled']) {

    /*!
 * @license ev-em.js v3.3.1
 * (c) 2015-2021 Evolok, Inc. https://www.evolok.com/
 *
 * License: MIT
 *
 */!function(t){var n={};function e(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,e),i.l=!0,i.exports}e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:r})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,n){if(1&n&&(t=e(t)),8&n)return t;if(4&n&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(e.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&n&&"string"!=typeof t)for(var i in t)e.d(r,i,function(n){return t[n]}.bind(null,i));return r},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=121)}([function(t,n,e){var r=e(1),i=e(7),o=e(14),u=e(11),c=e(17),a=function(t,n,e){var s,f,l,v,h=t&a.F,p=t&a.G,d=t&a.S,g=t&a.P,y=t&a.B,m=p?r:d?r[n]||(r[n]={}):(r[n]||{}).prototype,w=p?i:i[n]||(i[n]={}),b=w.prototype||(w.prototype={});for(s in p&&(e=n),e)l=((f=!h&&m&&void 0!==m[s])?m:e)[s],v=y&&f?c(l,r):g&&"function"==typeof l?c(Function.call,l):l,m&&u(m,s,l,t&a.U),w[s]!=l&&o(w,s,v),g&&b[s]!=l&&(b[s]=l)};r.core=i,a.F=1,a.G=2,a.S=4,a.P=8,a.B=16,a.W=32,a.U=64,a.R=128,t.exports=a},function(t,n){var e=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=e)},function(t,n){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,n,e){var r=e(4);t.exports=function(t){if(!r(t))throw TypeError(t+" is not an object!");return t}},function(t,n){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,n,e){var r=e(48)("wks"),i=e(29),o=e(1).Symbol,u="function"==typeof o;(t.exports=function(t){return r[t]||(r[t]=u&&o[t]||(u?o:i)("Symbol."+t))}).store=r},function(t,n,e){var r=e(19),i=Math.min;t.exports=function(t){return t>0?i(r(t),9007199254740991):0}},function(t,n){var e=t.exports={version:"2.6.12"};"number"==typeof __e&&(__e=e)},function(t,n,e){t.exports=!e(2)((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}))},function(t,n,e){var r=e(3),i=e(88),o=e(26),u=Object.defineProperty;n.f=e(8)?Object.defineProperty:function(t,n,e){if(r(t),n=o(n,!0),r(e),i)try{return u(t,n,e)}catch(t){}if("get"in e||"set"in e)throw TypeError("Accessors not supported!");return"value"in e&&(t[n]=e.value),t}},function(t,n,e){var r=e(24);t.exports=function(t){return Object(r(t))}},function(t,n,e){var r=e(1),i=e(14),o=e(13),u=e(29)("src"),c=e(126),a=(""+c).split("toString");e(7).inspectSource=function(t){return c.call(t)},(t.exports=function(t,n,e,c){var s="function"==typeof e;s&&(o(e,"name")||i(e,"name",n)),t[n]!==e&&(s&&(o(e,u)||i(e,u,t[n]?""+t[n]:a.join(String(n)))),t===r?t[n]=e:c?t[n]?t[n]=e:i(t,n,e):(delete t[n],i(t,n,e)))})(Function.prototype,"toString",(function(){return"function"==typeof this&&this[u]||c.call(this)}))},function(t,n,e){var r=e(0),i=e(2),o=e(24),u=/"/g,c=function(t,n,e,r){var i=String(o(t)),c="<"+n;return""!==e&&(c+=" "+e+'="'+String(r).replace(u,"&quot;")+'"'),c+">"+i+"</"+n+">"};t.exports=function(t,n){var e={};e[t]=n(c),r(r.P+r.F*i((function(){var n=""[t]('"');return n!==n.toLowerCase()||n.split('"').length>3})),"String",e)}},function(t,n){var e={}.hasOwnProperty;t.exports=function(t,n){return e.call(t,n)}},function(t,n,e){var r=e(9),i=e(28);t.exports=e(8)?function(t,n,e){return r.f(t,n,i(1,e))}:function(t,n,e){return t[n]=e,t}},function(t,n,e){var r=e(44),i=e(24);t.exports=function(t){return r(i(t))}},function(t,n,e){"use strict";var r=e(2);t.exports=function(t,n){return!!t&&r((function(){n?t.call(null,(function(){}),1):t.call(null)}))}},function(t,n,e){var r=e(18);t.exports=function(t,n,e){if(r(t),void 0===n)return t;switch(e){case 1:return function(e){return t.call(n,e)};case 2:return function(e,r){return t.call(n,e,r)};case 3:return function(e,r,i){return t.call(n,e,r,i)}}return function(){return t.apply(n,arguments)}}},function(t,n){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t}},function(t,n){var e=Math.ceil,r=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?r:e)(t)}},function(t,n,e){var r=e(45),i=e(28),o=e(15),u=e(26),c=e(13),a=e(88),s=Object.getOwnPropertyDescriptor;n.f=e(8)?s:function(t,n){if(t=o(t),n=u(n,!0),a)try{return s(t,n)}catch(t){}if(c(t,n))return i(!r.f.call(t,n),t[n])}},function(t,n,e){var r=e(0),i=e(7),o=e(2);t.exports=function(t,n){var e=(i.Object||{})[t]||Object[t],u={};u[t]=n(e),r(r.S+r.F*o((function(){e(1)})),"Object",u)}},function(t,n,e){var r=e(17),i=e(44),o=e(10),u=e(6),c=e(104);t.exports=function(t,n){var e=1==t,a=2==t,s=3==t,f=4==t,l=6==t,v=5==t||l,h=n||c;return function(n,c,p){for(var d,g,y=o(n),m=i(y),w=r(c,p,3),b=u(m.length),E=0,S=e?h(n,b):a?h(n,0):void 0;b>E;E++)if((v||E in m)&&(g=w(d=m[E],E,y),t))if(e)S[E]=g;else if(g)switch(t){case 3:return!0;case 5:return d;case 6:return E;case 2:S.push(d)}else if(f)return!1;return l?-1:s||f?f:S}}},function(t,n){var e={}.toString;t.exports=function(t){return e.call(t).slice(8,-1)}},function(t,n){t.exports=function(t){if(null==t)throw TypeError("Can't call method on  "+t);return t}},function(t,n,e){"use strict";if(e(8)){var r=e(30),i=e(1),o=e(2),u=e(0),c=e(59),a=e(84),s=e(17),f=e(42),l=e(28),v=e(14),h=e(43),p=e(19),d=e(6),g=e(115),y=e(32),m=e(26),w=e(13),b=e(46),E=e(4),S=e(10),_=e(76),x=e(33),O=e(35),A=e(34).f,T=e(78),I=e(29),k=e(5),P=e(22),R=e(49),M=e(47),N=e(80),F=e(40),L=e(52),C=e(41),j=e(79),D=e(106),W=e(9),U=e(20),G=W.f,V=U.f,B=i.RangeError,q=i.TypeError,Y=i.Uint8Array,z=Array.prototype,H=a.ArrayBuffer,K=a.DataView,J=P(0),$=P(2),X=P(3),Q=P(4),Z=P(5),tt=P(6),nt=R(!0),et=R(!1),rt=N.values,it=N.keys,ot=N.entries,ut=z.lastIndexOf,ct=z.reduce,at=z.reduceRight,st=z.join,ft=z.sort,lt=z.slice,vt=z.toString,ht=z.toLocaleString,pt=k("iterator"),dt=k("toStringTag"),gt=I("typed_constructor"),yt=I("def_constructor"),mt=c.CONSTR,wt=c.TYPED,bt=c.VIEW,Et=P(1,(function(t,n){return At(M(t,t[yt]),n)})),St=o((function(){return 1===new Y(new Uint16Array([1]).buffer)[0]})),_t=!!Y&&!!Y.prototype.set&&o((function(){new Y(1).set({})})),xt=function(t,n){var e=p(t);if(e<0||e%n)throw B("Wrong offset!");return e},Ot=function(t){if(E(t)&&wt in t)return t;throw q(t+" is not a typed array!")},At=function(t,n){if(!E(t)||!(gt in t))throw q("It is not a typed array constructor!");return new t(n)},Tt=function(t,n){return It(M(t,t[yt]),n)},It=function(t,n){for(var e=0,r=n.length,i=At(t,r);r>e;)i[e]=n[e++];return i},kt=function(t,n,e){G(t,n,{get:function(){return this._d[e]}})},Pt=function(t){var n,e,r,i,o,u,c=S(t),a=arguments.length,f=a>1?arguments[1]:void 0,l=void 0!==f,v=T(c);if(null!=v&&!_(v)){for(u=v.call(c),r=[],n=0;!(o=u.next()).done;n++)r.push(o.value);c=r}for(l&&a>2&&(f=s(f,arguments[2],2)),n=0,e=d(c.length),i=At(this,e);e>n;n++)i[n]=l?f(c[n],n):c[n];return i},Rt=function(){for(var t=0,n=arguments.length,e=At(this,n);n>t;)e[t]=arguments[t++];return e},Mt=!!Y&&o((function(){ht.call(new Y(1))})),Nt=function(){return ht.apply(Mt?lt.call(Ot(this)):Ot(this),arguments)},Ft={copyWithin:function(t,n){return D.call(Ot(this),t,n,arguments.length>2?arguments[2]:void 0)},every:function(t){return Q(Ot(this),t,arguments.length>1?arguments[1]:void 0)},fill:function(t){return j.apply(Ot(this),arguments)},filter:function(t){return Tt(this,$(Ot(this),t,arguments.length>1?arguments[1]:void 0))},find:function(t){return Z(Ot(this),t,arguments.length>1?arguments[1]:void 0)},findIndex:function(t){return tt(Ot(this),t,arguments.length>1?arguments[1]:void 0)},forEach:function(t){J(Ot(this),t,arguments.length>1?arguments[1]:void 0)},indexOf:function(t){return et(Ot(this),t,arguments.length>1?arguments[1]:void 0)},includes:function(t){return nt(Ot(this),t,arguments.length>1?arguments[1]:void 0)},join:function(t){return st.apply(Ot(this),arguments)},lastIndexOf:function(t){return ut.apply(Ot(this),arguments)},map:function(t){return Et(Ot(this),t,arguments.length>1?arguments[1]:void 0)},reduce:function(t){return ct.apply(Ot(this),arguments)},reduceRight:function(t){return at.apply(Ot(this),arguments)},reverse:function(){for(var t,n=Ot(this).length,e=Math.floor(n/2),r=0;r<e;)t=this[r],this[r++]=this[--n],this[n]=t;return this},some:function(t){return X(Ot(this),t,arguments.length>1?arguments[1]:void 0)},sort:function(t){return ft.call(Ot(this),t)},subarray:function(t,n){var e=Ot(this),r=e.length,i=y(t,r);return new(M(e,e[yt]))(e.buffer,e.byteOffset+i*e.BYTES_PER_ELEMENT,d((void 0===n?r:y(n,r))-i))}},Lt=function(t,n){return Tt(this,lt.call(Ot(this),t,n))},Ct=function(t){Ot(this);var n=xt(arguments[1],1),e=this.length,r=S(t),i=d(r.length),o=0;if(i+n>e)throw B("Wrong length!");for(;o<i;)this[n+o]=r[o++]},jt={entries:function(){return ot.call(Ot(this))},keys:function(){return it.call(Ot(this))},values:function(){return rt.call(Ot(this))}},Dt=function(t,n){return E(t)&&t[wt]&&"symbol"!=typeof n&&n in t&&String(+n)==String(n)},Wt=function(t,n){return Dt(t,n=m(n,!0))?l(2,t[n]):V(t,n)},Ut=function(t,n,e){return!(Dt(t,n=m(n,!0))&&E(e)&&w(e,"value"))||w(e,"get")||w(e,"set")||e.configurable||w(e,"writable")&&!e.writable||w(e,"enumerable")&&!e.enumerable?G(t,n,e):(t[n]=e.value,t)};mt||(U.f=Wt,W.f=Ut),u(u.S+u.F*!mt,"Object",{getOwnPropertyDescriptor:Wt,defineProperty:Ut}),o((function(){vt.call({})}))&&(vt=ht=function(){return st.call(this)});var Gt=h({},Ft);h(Gt,jt),v(Gt,pt,jt.values),h(Gt,{slice:Lt,set:Ct,constructor:function(){},toString:vt,toLocaleString:Nt}),kt(Gt,"buffer","b"),kt(Gt,"byteOffset","o"),kt(Gt,"byteLength","l"),kt(Gt,"length","e"),G(Gt,dt,{get:function(){return this[wt]}}),t.exports=function(t,n,e,a){var s=t+((a=!!a)?"Clamped":"")+"Array",l="get"+t,h="set"+t,p=i[s],y=p||{},m=p&&O(p),w=!p||!c.ABV,S={},_=p&&p.prototype,T=function(t,e){G(t,e,{get:function(){return function(t,e){var r=t._d;return r.v[l](e*n+r.o,St)}(this,e)},set:function(t){return function(t,e,r){var i=t._d;a&&(r=(r=Math.round(r))<0?0:r>255?255:255&r),i.v[h](e*n+i.o,r,St)}(this,e,t)},enumerable:!0})};w?(p=e((function(t,e,r,i){f(t,p,s,"_d");var o,u,c,a,l=0,h=0;if(E(e)){if(!(e instanceof H||"ArrayBuffer"==(a=b(e))||"SharedArrayBuffer"==a))return wt in e?It(p,e):Pt.call(p,e);o=e,h=xt(r,n);var y=e.byteLength;if(void 0===i){if(y%n)throw B("Wrong length!");if((u=y-h)<0)throw B("Wrong length!")}else if((u=d(i)*n)+h>y)throw B("Wrong length!");c=u/n}else c=g(e),o=new H(u=c*n);for(v(t,"_d",{b:o,o:h,l:u,e:c,v:new K(o)});l<c;)T(t,l++)})),_=p.prototype=x(Gt),v(_,"constructor",p)):o((function(){p(1)}))&&o((function(){new p(-1)}))&&L((function(t){new p,new p(null),new p(1.5),new p(t)}),!0)||(p=e((function(t,e,r,i){var o;return f(t,p,s),E(e)?e instanceof H||"ArrayBuffer"==(o=b(e))||"SharedArrayBuffer"==o?void 0!==i?new y(e,xt(r,n),i):void 0!==r?new y(e,xt(r,n)):new y(e):wt in e?It(p,e):Pt.call(p,e):new y(g(e))})),J(m!==Function.prototype?A(y).concat(A(m)):A(y),(function(t){t in p||v(p,t,y[t])})),p.prototype=_,r||(_.constructor=p));var I=_[pt],k=!!I&&("values"==I.name||null==I.name),P=jt.values;v(p,gt,!0),v(_,wt,s),v(_,bt,!0),v(_,yt,p),(a?new p(1)[dt]==s:dt in _)||G(_,dt,{get:function(){return s}}),S[s]=p,u(u.G+u.W+u.F*(p!=y),S),u(u.S,s,{BYTES_PER_ELEMENT:n}),u(u.S+u.F*o((function(){y.of.call(p,1)})),s,{from:Pt,of:Rt}),"BYTES_PER_ELEMENT"in _||v(_,"BYTES_PER_ELEMENT",n),u(u.P,s,Ft),C(s),u(u.P+u.F*_t,s,{set:Ct}),u(u.P+u.F*!k,s,jt),r||_.toString==vt||(_.toString=vt),u(u.P+u.F*o((function(){new p(1).slice()})),s,{slice:Lt}),u(u.P+u.F*(o((function(){return[1,2].toLocaleString()!=new p([1,2]).toLocaleString()}))||!o((function(){_.toLocaleString.call([1,2])}))),s,{toLocaleString:Nt}),F[s]=k?I:P,r||k||v(_,pt,P)}}else t.exports=function(){}},function(t,n,e){var r=e(4);t.exports=function(t,n){if(!r(t))return t;var e,i;if(n&&"function"==typeof(e=t.toString)&&!r(i=e.call(t)))return i;if("function"==typeof(e=t.valueOf)&&!r(i=e.call(t)))return i;if(!n&&"function"==typeof(e=t.toString)&&!r(i=e.call(t)))return i;throw TypeError("Can't convert object to primitive value")}},function(t,n,e){var r=e(29)("meta"),i=e(4),o=e(13),u=e(9).f,c=0,a=Object.isExtensible||function(){return!0},s=!e(2)((function(){return a(Object.preventExtensions({}))})),f=function(t){u(t,r,{value:{i:"O"+ ++c,w:{}}})},l=t.exports={KEY:r,NEED:!1,fastKey:function(t,n){if(!i(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!o(t,r)){if(!a(t))return"F";if(!n)return"E";f(t)}return t[r].i},getWeak:function(t,n){if(!o(t,r)){if(!a(t))return!0;if(!n)return!1;f(t)}return t[r].w},onFreeze:function(t){return s&&l.NEED&&a(t)&&!o(t,r)&&f(t),t}}},function(t,n){t.exports=function(t,n){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:n}}},function(t,n){var e=0,r=Math.random();t.exports=function(t){return"Symbol(".concat(void 0===t?"":t,")_",(++e+r).toString(36))}},function(t,n){t.exports=!1},function(t,n,e){var r=e(90),i=e(63);t.exports=Object.keys||function(t){return r(t,i)}},function(t,n,e){var r=e(19),i=Math.max,o=Math.min;t.exports=function(t,n){return(t=r(t))<0?i(t+n,0):o(t,n)}},function(t,n,e){var r=e(3),i=e(91),o=e(63),u=e(62)("IE_PROTO"),c=function(){},a=function(){var t,n=e(60)("iframe"),r=o.length;for(n.style.display="none",e(64).appendChild(n),n.src="javascript:",(t=n.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),a=t.F;r--;)delete a.prototype[o[r]];return a()};t.exports=Object.create||function(t,n){var e;return null!==t?(c.prototype=r(t),e=new c,c.prototype=null,e[u]=t):e=a(),void 0===n?e:i(e,n)}},function(t,n,e){var r=e(90),i=e(63).concat("length","prototype");n.f=Object.getOwnPropertyNames||function(t){return r(t,i)}},function(t,n,e){var r=e(13),i=e(10),o=e(62)("IE_PROTO"),u=Object.prototype;t.exports=Object.getPrototypeOf||function(t){return t=i(t),r(t,o)?t[o]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?u:null}},function(t,n,e){var r=e(5)("unscopables"),i=Array.prototype;null==i[r]&&e(14)(i,r,{}),t.exports=function(t){i[r][t]=!0}},function(t,n,e){var r=e(4);t.exports=function(t,n){if(!r(t)||t._t!==n)throw TypeError("Incompatible receiver, "+n+" required!");return t}},function(t,n,e){var r=e(9).f,i=e(13),o=e(5)("toStringTag");t.exports=function(t,n,e){t&&!i(t=e?t:t.prototype,o)&&r(t,o,{configurable:!0,value:n})}},function(t,n,e){var r=e(0),i=e(24),o=e(2),u=e(66),c="["+u+"]",a=RegExp("^"+c+c+"*"),s=RegExp(c+c+"*$"),f=function(t,n,e){var i={},c=o((function(){return!!u[t]()||"​"!="​"[t]()})),a=i[t]=c?n(l):u[t];e&&(i[e]=a),r(r.P+r.F*c,"String",i)},l=f.trim=function(t,n){return t=String(i(t)),1&n&&(t=t.replace(a,"")),2&n&&(t=t.replace(s,"")),t};t.exports=f},function(t,n){t.exports={}},function(t,n,e){"use strict";var r=e(1),i=e(9),o=e(8),u=e(5)("species");t.exports=function(t){var n=r[t];o&&n&&!n[u]&&i.f(n,u,{configurable:!0,get:function(){return this}})}},function(t,n){t.exports=function(t,n,e,r){if(!(t instanceof n)||void 0!==r&&r in t)throw TypeError(e+": incorrect invocation!");return t}},function(t,n,e){var r=e(11);t.exports=function(t,n,e){for(var i in n)r(t,i,n[i],e);return t}},function(t,n,e){var r=e(23);t.exports=Object("z").propertyIsEnumerable(0)?Object:function(t){return"String"==r(t)?t.split(""):Object(t)}},function(t,n){n.f={}.propertyIsEnumerable},function(t,n,e){var r=e(23),i=e(5)("toStringTag"),o="Arguments"==r(function(){return arguments}());t.exports=function(t){var n,e,u;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(e=function(t,n){try{return t[n]}catch(t){}}(n=Object(t),i))?e:o?r(n):"Object"==(u=r(n))&&"function"==typeof n.callee?"Arguments":u}},function(t,n,e){var r=e(3),i=e(18),o=e(5)("species");t.exports=function(t,n){var e,u=r(t).constructor;return void 0===u||null==(e=r(u)[o])?n:i(e)}},function(t,n,e){var r=e(7),i=e(1),o=i["__core-js_shared__"]||(i["__core-js_shared__"]={});(t.exports=function(t,n){return o[t]||(o[t]=void 0!==n?n:{})})("versions",[]).push({version:r.version,mode:e(30)?"pure":"global",copyright:"© 2020 Denis Pushkarev (zloirock.ru)"})},function(t,n,e){var r=e(15),i=e(6),o=e(32);t.exports=function(t){return function(n,e,u){var c,a=r(n),s=i(a.length),f=o(u,s);if(t&&e!=e){for(;s>f;)if((c=a[f++])!=c)return!0}else for(;s>f;f++)if((t||f in a)&&a[f]===e)return t||f||0;return!t&&-1}}},function(t,n){n.f=Object.getOwnPropertySymbols},function(t,n,e){var r=e(23);t.exports=Array.isArray||function(t){return"Array"==r(t)}},function(t,n,e){var r=e(5)("iterator"),i=!1;try{var o=[7][r]();o.return=function(){i=!0},Array.from(o,(function(){throw 2}))}catch(t){}t.exports=function(t,n){if(!n&&!i)return!1;var e=!1;try{var o=[7],u=o[r]();u.next=function(){return{done:e=!0}},o[r]=function(){return u},t(o)}catch(t){}return e}},function(t,n,e){"use strict";var r=e(3);t.exports=function(){var t=r(this),n="";return t.global&&(n+="g"),t.ignoreCase&&(n+="i"),t.multiline&&(n+="m"),t.unicode&&(n+="u"),t.sticky&&(n+="y"),n}},function(t,n,e){"use strict";var r=e(46),i=RegExp.prototype.exec;t.exports=function(t,n){var e=t.exec;if("function"==typeof e){var o=e.call(t,n);if("object"!=typeof o)throw new TypeError("RegExp exec method returned something other than an Object or null");return o}if("RegExp"!==r(t))throw new TypeError("RegExp#exec called on incompatible receiver");return i.call(t,n)}},function(t,n,e){"use strict";e(108);var r=e(11),i=e(14),o=e(2),u=e(24),c=e(5),a=e(81),s=c("species"),f=!o((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")})),l=function(){var t=/(?:)/,n=t.exec;t.exec=function(){return n.apply(this,arguments)};var e="ab".split(t);return 2===e.length&&"a"===e[0]&&"b"===e[1]}();t.exports=function(t,n,e){var v=c(t),h=!o((function(){var n={};return n[v]=function(){return 7},7!=""[t](n)})),p=h?!o((function(){var n=!1,e=/a/;return e.exec=function(){return n=!0,null},"split"===t&&(e.constructor={},e.constructor[s]=function(){return e}),e[v](""),!n})):void 0;if(!h||!p||"replace"===t&&!f||"split"===t&&!l){var d=/./[v],g=e(u,v,""[t],(function(t,n,e,r,i){return n.exec===a?h&&!i?{done:!0,value:d.call(n,e,r)}:{done:!0,value:t.call(e,n,r)}:{done:!1}})),y=g[0],m=g[1];r(String.prototype,t,y),i(RegExp.prototype,v,2==n?function(t,n){return m.call(t,this,n)}:function(t){return m.call(t,this)})}}},function(t,n,e){var r=e(17),i=e(103),o=e(76),u=e(3),c=e(6),a=e(78),s={},f={};(n=t.exports=function(t,n,e,l,v){var h,p,d,g,y=v?function(){return t}:a(t),m=r(e,l,n?2:1),w=0;if("function"!=typeof y)throw TypeError(t+" is not iterable!");if(o(y)){for(h=c(t.length);h>w;w++)if((g=n?m(u(p=t[w])[0],p[1]):m(t[w]))===s||g===f)return g}else for(d=y.call(t);!(p=d.next()).done;)if((g=i(d,m,p.value,n))===s||g===f)return g}).BREAK=s,n.RETURN=f},function(t,n,e){var r=e(1).navigator;t.exports=r&&r.userAgent||""},function(t,n,e){"use strict";var r=e(1),i=e(0),o=e(11),u=e(43),c=e(27),a=e(56),s=e(42),f=e(4),l=e(2),v=e(52),h=e(38),p=e(67);t.exports=function(t,n,e,d,g,y){var m=r[t],w=m,b=g?"set":"add",E=w&&w.prototype,S={},_=function(t){var n=E[t];o(E,t,"delete"==t||"has"==t?function(t){return!(y&&!f(t))&&n.call(this,0===t?0:t)}:"get"==t?function(t){return y&&!f(t)?void 0:n.call(this,0===t?0:t)}:"add"==t?function(t){return n.call(this,0===t?0:t),this}:function(t,e){return n.call(this,0===t?0:t,e),this})};if("function"==typeof w&&(y||E.forEach&&!l((function(){(new w).entries().next()})))){var x=new w,O=x[b](y?{}:-0,1)!=x,A=l((function(){x.has(1)})),T=v((function(t){new w(t)})),I=!y&&l((function(){for(var t=new w,n=5;n--;)t[b](n,n);return!t.has(-0)}));T||((w=n((function(n,e){s(n,w,t);var r=p(new m,n,w);return null!=e&&a(e,g,r[b],r),r}))).prototype=E,E.constructor=w),(A||I)&&(_("delete"),_("has"),g&&_("get")),(I||O)&&_(b),y&&E.clear&&delete E.clear}else w=d.getConstructor(n,t,g,b),u(w.prototype,e),c.NEED=!0;return h(w,t),S[t]=w,i(i.G+i.W+i.F*(w!=m),S),y||d.setStrong(w,t,g),w}},function(t,n,e){for(var r,i=e(1),o=e(14),u=e(29),c=u("typed_array"),a=u("view"),s=!(!i.ArrayBuffer||!i.DataView),f=s,l=0,v="Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array".split(",");l<9;)(r=i[v[l++]])?(o(r.prototype,c,!0),o(r.prototype,a,!0)):f=!1;t.exports={ABV:s,CONSTR:f,TYPED:c,VIEW:a}},function(t,n,e){var r=e(4),i=e(1).document,o=r(i)&&r(i.createElement);t.exports=function(t){return o?i.createElement(t):{}}},function(t,n,e){n.f=e(5)},function(t,n,e){var r=e(48)("keys"),i=e(29);t.exports=function(t){return r[t]||(r[t]=i(t))}},function(t,n){t.exports="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")},function(t,n,e){var r=e(1).document;t.exports=r&&r.documentElement},function(t,n,e){var r=e(4),i=e(3),o=function(t,n){if(i(t),!r(n)&&null!==n)throw TypeError(n+": can't set as prototype!")};t.exports={set:Object.setPrototypeOf||("__proto__"in{}?function(t,n,r){try{(r=e(17)(Function.call,e(20).f(Object.prototype,"__proto__").set,2))(t,[]),n=!(t instanceof Array)}catch(t){n=!0}return function(t,e){return o(t,e),n?t.__proto__=e:r(t,e),t}}({},!1):void 0),check:o}},function(t,n){t.exports="\t\n\v\f\r   ᠎             　\u2028\u2029\ufeff"},function(t,n,e){var r=e(4),i=e(65).set;t.exports=function(t,n,e){var o,u=n.constructor;return u!==e&&"function"==typeof u&&(o=u.prototype)!==e.prototype&&r(o)&&i&&i(t,o),t}},function(t,n,e){"use strict";var r=e(19),i=e(24);t.exports=function(t){var n=String(i(this)),e="",o=r(t);if(o<0||o==1/0)throw RangeError("Count can't be negative");for(;o>0;(o>>>=1)&&(n+=n))1&o&&(e+=n);return e}},function(t,n){t.exports=Math.sign||function(t){return 0==(t=+t)||t!=t?t:t<0?-1:1}},function(t,n){var e=Math.expm1;t.exports=!e||e(10)>22025.465794806718||e(10)<22025.465794806718||-2e-17!=e(-2e-17)?function(t){return 0==(t=+t)?t:t>-1e-6&&t<1e-6?t+t*t/2:Math.exp(t)-1}:e},function(t,n,e){var r=e(19),i=e(24);t.exports=function(t){return function(n,e){var o,u,c=String(i(n)),a=r(e),s=c.length;return a<0||a>=s?t?"":void 0:(o=c.charCodeAt(a))<55296||o>56319||a+1===s||(u=c.charCodeAt(a+1))<56320||u>57343?t?c.charAt(a):o:t?c.slice(a,a+2):u-56320+(o-55296<<10)+65536}}},function(t,n,e){"use strict";var r=e(30),i=e(0),o=e(11),u=e(14),c=e(40),a=e(102),s=e(38),f=e(35),l=e(5)("iterator"),v=!([].keys&&"next"in[].keys()),h=function(){return this};t.exports=function(t,n,e,p,d,g,y){a(e,n,p);var m,w,b,E=function(t){if(!v&&t in O)return O[t];switch(t){case"keys":case"values":return function(){return new e(this,t)}}return function(){return new e(this,t)}},S=n+" Iterator",_="values"==d,x=!1,O=t.prototype,A=O[l]||O["@@iterator"]||d&&O[d],T=A||E(d),I=d?_?E("entries"):T:void 0,k="Array"==n&&O.entries||A;if(k&&(b=f(k.call(new t)))!==Object.prototype&&b.next&&(s(b,S,!0),r||"function"==typeof b[l]||u(b,l,h)),_&&A&&"values"!==A.name&&(x=!0,T=function(){return A.call(this)}),r&&!y||!v&&!x&&O[l]||u(O,l,T),c[n]=T,c[S]=h,d)if(m={values:_?T:E("values"),keys:g?T:E("keys"),entries:I},y)for(w in m)w in O||o(O,w,m[w]);else i(i.P+i.F*(v||x),n,m);return m}},function(t,n,e){var r=e(74),i=e(24);t.exports=function(t,n,e){if(r(n))throw TypeError("String#"+e+" doesn't accept regex!");return String(i(t))}},function(t,n,e){var r=e(4),i=e(23),o=e(5)("match");t.exports=function(t){var n;return r(t)&&(void 0!==(n=t[o])?!!n:"RegExp"==i(t))}},function(t,n,e){var r=e(5)("match");t.exports=function(t){var n=/./;try{"/./"[t](n)}catch(e){try{return n[r]=!1,!"/./"[t](n)}catch(t){}}return!0}},function(t,n,e){var r=e(40),i=e(5)("iterator"),o=Array.prototype;t.exports=function(t){return void 0!==t&&(r.Array===t||o[i]===t)}},function(t,n,e){"use strict";var r=e(9),i=e(28);t.exports=function(t,n,e){n in t?r.f(t,n,i(0,e)):t[n]=e}},function(t,n,e){var r=e(46),i=e(5)("iterator"),o=e(40);t.exports=e(7).getIteratorMethod=function(t){if(null!=t)return t[i]||t["@@iterator"]||o[r(t)]}},function(t,n,e){"use strict";var r=e(10),i=e(32),o=e(6);t.exports=function(t){for(var n=r(this),e=o(n.length),u=arguments.length,c=i(u>1?arguments[1]:void 0,e),a=u>2?arguments[2]:void 0,s=void 0===a?e:i(a,e);s>c;)n[c++]=t;return n}},function(t,n,e){"use strict";var r=e(36),i=e(107),o=e(40),u=e(15);t.exports=e(72)(Array,"Array",(function(t,n){this._t=u(t),this._i=0,this._k=n}),(function(){var t=this._t,n=this._k,e=this._i++;return!t||e>=t.length?(this._t=void 0,i(1)):i(0,"keys"==n?e:"values"==n?t[e]:[e,t[e]])}),"values"),o.Arguments=o.Array,r("keys"),r("values"),r("entries")},function(t,n,e){"use strict";var r,i,o=e(53),u=RegExp.prototype.exec,c=String.prototype.replace,a=u,s=(r=/a/,i=/b*/g,u.call(r,"a"),u.call(i,"a"),0!==r.lastIndex||0!==i.lastIndex),f=void 0!==/()??/.exec("")[1];(s||f)&&(a=function(t){var n,e,r,i,a=this;return f&&(e=new RegExp("^"+a.source+"$(?!\\s)",o.call(a))),s&&(n=a.lastIndex),r=u.call(a,t),s&&r&&(a.lastIndex=a.global?r.index+r[0].length:n),f&&r&&r.length>1&&c.call(r[0],e,(function(){for(i=1;i<arguments.length-2;i++)void 0===arguments[i]&&(r[i]=void 0)})),r}),t.exports=a},function(t,n,e){"use strict";var r=e(71)(!0);t.exports=function(t,n,e){return n+(e?r(t,n).length:1)}},function(t,n,e){var r,i,o,u=e(17),c=e(96),a=e(64),s=e(60),f=e(1),l=f.process,v=f.setImmediate,h=f.clearImmediate,p=f.MessageChannel,d=f.Dispatch,g=0,y={},m=function(){var t=+this;if(y.hasOwnProperty(t)){var n=y[t];delete y[t],n()}},w=function(t){m.call(t.data)};v&&h||(v=function(t){for(var n=[],e=1;arguments.length>e;)n.push(arguments[e++]);return y[++g]=function(){c("function"==typeof t?t:Function(t),n)},r(g),g},h=function(t){delete y[t]},"process"==e(23)(l)?r=function(t){l.nextTick(u(m,t,1))}:d&&d.now?r=function(t){d.now(u(m,t,1))}:p?(o=(i=new p).port2,i.port1.onmessage=w,r=u(o.postMessage,o,1)):f.addEventListener&&"function"==typeof postMessage&&!f.importScripts?(r=function(t){f.postMessage(t+"","*")},f.addEventListener("message",w,!1)):r="onreadystatechange"in s("script")?function(t){a.appendChild(s("script")).onreadystatechange=function(){a.removeChild(this),m.call(t)}}:function(t){setTimeout(u(m,t,1),0)}),t.exports={set:v,clear:h}},function(t,n,e){"use strict";var r=e(1),i=e(8),o=e(30),u=e(59),c=e(14),a=e(43),s=e(2),f=e(42),l=e(19),v=e(6),h=e(115),p=e(34).f,d=e(9).f,g=e(79),y=e(38),m=r.ArrayBuffer,w=r.DataView,b=r.Math,E=r.RangeError,S=r.Infinity,_=m,x=b.abs,O=b.pow,A=b.floor,T=b.log,I=b.LN2,k=i?"_b":"buffer",P=i?"_l":"byteLength",R=i?"_o":"byteOffset";function M(t,n,e){var r,i,o,u=new Array(e),c=8*e-n-1,a=(1<<c)-1,s=a>>1,f=23===n?O(2,-24)-O(2,-77):0,l=0,v=t<0||0===t&&1/t<0?1:0;for((t=x(t))!=t||t===S?(i=t!=t?1:0,r=a):(r=A(T(t)/I),t*(o=O(2,-r))<1&&(r--,o*=2),(t+=r+s>=1?f/o:f*O(2,1-s))*o>=2&&(r++,o/=2),r+s>=a?(i=0,r=a):r+s>=1?(i=(t*o-1)*O(2,n),r+=s):(i=t*O(2,s-1)*O(2,n),r=0));n>=8;u[l++]=255&i,i/=256,n-=8);for(r=r<<n|i,c+=n;c>0;u[l++]=255&r,r/=256,c-=8);return u[--l]|=128*v,u}function N(t,n,e){var r,i=8*e-n-1,o=(1<<i)-1,u=o>>1,c=i-7,a=e-1,s=t[a--],f=127&s;for(s>>=7;c>0;f=256*f+t[a],a--,c-=8);for(r=f&(1<<-c)-1,f>>=-c,c+=n;c>0;r=256*r+t[a],a--,c-=8);if(0===f)f=1-u;else{if(f===o)return r?NaN:s?-S:S;r+=O(2,n),f-=u}return(s?-1:1)*r*O(2,f-n)}function F(t){return t[3]<<24|t[2]<<16|t[1]<<8|t[0]}function L(t){return[255&t]}function C(t){return[255&t,t>>8&255]}function j(t){return[255&t,t>>8&255,t>>16&255,t>>24&255]}function D(t){return M(t,52,8)}function W(t){return M(t,23,4)}function U(t,n,e){d(t.prototype,n,{get:function(){return this[e]}})}function G(t,n,e,r){var i=h(+e);if(i+n>t[P])throw E("Wrong index!");var o=t[k]._b,u=i+t[R],c=o.slice(u,u+n);return r?c:c.reverse()}function V(t,n,e,r,i,o){var u=h(+e);if(u+n>t[P])throw E("Wrong index!");for(var c=t[k]._b,a=u+t[R],s=r(+i),f=0;f<n;f++)c[a+f]=s[o?f:n-f-1]}if(u.ABV){if(!s((function(){m(1)}))||!s((function(){new m(-1)}))||s((function(){return new m,new m(1.5),new m(NaN),"ArrayBuffer"!=m.name}))){for(var B,q=(m=function(t){return f(this,m),new _(h(t))}).prototype=_.prototype,Y=p(_),z=0;Y.length>z;)(B=Y[z++])in m||c(m,B,_[B]);o||(q.constructor=m)}var H=new w(new m(2)),K=w.prototype.setInt8;H.setInt8(0,2147483648),H.setInt8(1,2147483649),!H.getInt8(0)&&H.getInt8(1)||a(w.prototype,{setInt8:function(t,n){K.call(this,t,n<<24>>24)},setUint8:function(t,n){K.call(this,t,n<<24>>24)}},!0)}else m=function(t){f(this,m,"ArrayBuffer");var n=h(t);this._b=g.call(new Array(n),0),this[P]=n},w=function(t,n,e){f(this,w,"DataView"),f(t,m,"DataView");var r=t[P],i=l(n);if(i<0||i>r)throw E("Wrong offset!");if(i+(e=void 0===e?r-i:v(e))>r)throw E("Wrong length!");this[k]=t,this[R]=i,this[P]=e},i&&(U(m,"byteLength","_l"),U(w,"buffer","_b"),U(w,"byteLength","_l"),U(w,"byteOffset","_o")),a(w.prototype,{getInt8:function(t){return G(this,1,t)[0]<<24>>24},getUint8:function(t){return G(this,1,t)[0]},getInt16:function(t){var n=G(this,2,t,arguments[1]);return(n[1]<<8|n[0])<<16>>16},getUint16:function(t){var n=G(this,2,t,arguments[1]);return n[1]<<8|n[0]},getInt32:function(t){return F(G(this,4,t,arguments[1]))},getUint32:function(t){return F(G(this,4,t,arguments[1]))>>>0},getFloat32:function(t){return N(G(this,4,t,arguments[1]),23,4)},getFloat64:function(t){return N(G(this,8,t,arguments[1]),52,8)},setInt8:function(t,n){V(this,1,t,L,n)},setUint8:function(t,n){V(this,1,t,L,n)},setInt16:function(t,n){V(this,2,t,C,n,arguments[2])},setUint16:function(t,n){V(this,2,t,C,n,arguments[2])},setInt32:function(t,n){V(this,4,t,j,n,arguments[2])},setUint32:function(t,n){V(this,4,t,j,n,arguments[2])},setFloat32:function(t,n){V(this,4,t,W,n,arguments[2])},setFloat64:function(t,n){V(this,8,t,D,n,arguments[2])}});y(m,"ArrayBuffer"),y(w,"DataView"),c(w.prototype,u.VIEW,!0),n.ArrayBuffer=m,n.DataView=w},function(t,n){var e=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=e)},function(t,n){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,n,e){t.exports=!e(120)((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}))},function(t,n,e){t.exports=!e(8)&&!e(2)((function(){return 7!=Object.defineProperty(e(60)("div"),"a",{get:function(){return 7}}).a}))},function(t,n,e){var r=e(1),i=e(7),o=e(30),u=e(61),c=e(9).f;t.exports=function(t){var n=i.Symbol||(i.Symbol=o?{}:r.Symbol||{});"_"==t.charAt(0)||t in n||c(n,t,{value:u.f(t)})}},function(t,n,e){var r=e(13),i=e(15),o=e(49)(!1),u=e(62)("IE_PROTO");t.exports=function(t,n){var e,c=i(t),a=0,s=[];for(e in c)e!=u&&r(c,e)&&s.push(e);for(;n.length>a;)r(c,e=n[a++])&&(~o(s,e)||s.push(e));return s}},function(t,n,e){var r=e(9),i=e(3),o=e(31);t.exports=e(8)?Object.defineProperties:function(t,n){i(t);for(var e,u=o(n),c=u.length,a=0;c>a;)r.f(t,e=u[a++],n[e]);return t}},function(t,n,e){var r=e(15),i=e(34).f,o={}.toString,u="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return u&&"[object Window]"==o.call(t)?function(t){try{return i(t)}catch(t){return u.slice()}}(t):i(r(t))}},function(t,n,e){"use strict";var r=e(8),i=e(31),o=e(50),u=e(45),c=e(10),a=e(44),s=Object.assign;t.exports=!s||e(2)((function(){var t={},n={},e=Symbol(),r="abcdefghijklmnopqrst";return t[e]=7,r.split("").forEach((function(t){n[t]=t})),7!=s({},t)[e]||Object.keys(s({},n)).join("")!=r}))?function(t,n){for(var e=c(t),s=arguments.length,f=1,l=o.f,v=u.f;s>f;)for(var h,p=a(arguments[f++]),d=l?i(p).concat(l(p)):i(p),g=d.length,y=0;g>y;)h=d[y++],r&&!v.call(p,h)||(e[h]=p[h]);return e}:s},function(t,n){t.exports=Object.is||function(t,n){return t===n?0!==t||1/t==1/n:t!=t&&n!=n}},function(t,n,e){"use strict";var r=e(18),i=e(4),o=e(96),u=[].slice,c={},a=function(t,n,e){if(!(n in c)){for(var r=[],i=0;i<n;i++)r[i]="a["+i+"]";c[n]=Function("F,a","return new F("+r.join(",")+")")}return c[n](t,e)};t.exports=Function.bind||function(t){var n=r(this),e=u.call(arguments,1),c=function(){var r=e.concat(u.call(arguments));return this instanceof c?a(n,r.length,r):o(n,r,t)};return i(n.prototype)&&(c.prototype=n.prototype),c}},function(t,n){t.exports=function(t,n,e){var r=void 0===e;switch(n.length){case 0:return r?t():t.call(e);case 1:return r?t(n[0]):t.call(e,n[0]);case 2:return r?t(n[0],n[1]):t.call(e,n[0],n[1]);case 3:return r?t(n[0],n[1],n[2]):t.call(e,n[0],n[1],n[2]);case 4:return r?t(n[0],n[1],n[2],n[3]):t.call(e,n[0],n[1],n[2],n[3])}return t.apply(e,n)}},function(t,n,e){var r=e(1).parseInt,i=e(39).trim,o=e(66),u=/^[-+]?0[xX]/;t.exports=8!==r(o+"08")||22!==r(o+"0x16")?function(t,n){var e=i(String(t),3);return r(e,n>>>0||(u.test(e)?16:10))}:r},function(t,n,e){var r=e(1).parseFloat,i=e(39).trim;t.exports=1/r(e(66)+"-0")!=-1/0?function(t){var n=i(String(t),3),e=r(n);return 0===e&&"-"==n.charAt(0)?-0:e}:r},function(t,n,e){var r=e(23);t.exports=function(t,n){if("number"!=typeof t&&"Number"!=r(t))throw TypeError(n);return+t}},function(t,n,e){var r=e(4),i=Math.floor;t.exports=function(t){return!r(t)&&isFinite(t)&&i(t)===t}},function(t,n){t.exports=Math.log1p||function(t){return(t=+t)>-1e-8&&t<1e-8?t-t*t/2:Math.log(1+t)}},function(t,n,e){"use strict";var r=e(33),i=e(28),o=e(38),u={};e(14)(u,e(5)("iterator"),(function(){return this})),t.exports=function(t,n,e){t.prototype=r(u,{next:i(1,e)}),o(t,n+" Iterator")}},function(t,n,e){var r=e(3);t.exports=function(t,n,e,i){try{return i?n(r(e)[0],e[1]):n(e)}catch(n){var o=t.return;throw void 0!==o&&r(o.call(t)),n}}},function(t,n,e){var r=e(216);t.exports=function(t,n){return new(r(t))(n)}},function(t,n,e){var r=e(18),i=e(10),o=e(44),u=e(6);t.exports=function(t,n,e,c,a){r(n);var s=i(t),f=o(s),l=u(s.length),v=a?l-1:0,h=a?-1:1;if(e<2)for(;;){if(v in f){c=f[v],v+=h;break}if(v+=h,a?v<0:l<=v)throw TypeError("Reduce of empty array with no initial value")}for(;a?v>=0:l>v;v+=h)v in f&&(c=n(c,f[v],v,s));return c}},function(t,n,e){"use strict";var r=e(10),i=e(32),o=e(6);t.exports=[].copyWithin||function(t,n){var e=r(this),u=o(e.length),c=i(t,u),a=i(n,u),s=arguments.length>2?arguments[2]:void 0,f=Math.min((void 0===s?u:i(s,u))-a,u-c),l=1;for(a<c&&c<a+f&&(l=-1,a+=f-1,c+=f-1);f-- >0;)a in e?e[c]=e[a]:delete e[c],c+=l,a+=l;return e}},function(t,n){t.exports=function(t,n){return{value:n,done:!!t}}},function(t,n,e){"use strict";var r=e(81);e(0)({target:"RegExp",proto:!0,forced:r!==/./.exec},{exec:r})},function(t,n,e){e(8)&&"g"!=/./g.flags&&e(9).f(RegExp.prototype,"flags",{configurable:!0,get:e(53)})},function(t,n,e){"use strict";var r,i,o,u,c=e(30),a=e(1),s=e(17),f=e(46),l=e(0),v=e(4),h=e(18),p=e(42),d=e(56),g=e(47),y=e(83).set,m=e(236)(),w=e(111),b=e(237),E=e(57),S=e(112),_=a.TypeError,x=a.process,O=x&&x.versions,A=O&&O.v8||"",T=a.Promise,I="process"==f(x),k=function(){},P=i=w.f,R=!!function(){try{var t=T.resolve(1),n=(t.constructor={})[e(5)("species")]=function(t){t(k,k)};return(I||"function"==typeof PromiseRejectionEvent)&&t.then(k)instanceof n&&0!==A.indexOf("6.6")&&-1===E.indexOf("Chrome/66")}catch(t){}}(),M=function(t){var n;return!(!v(t)||"function"!=typeof(n=t.then))&&n},N=function(t,n){if(!t._n){t._n=!0;var e=t._c;m((function(){for(var r=t._v,i=1==t._s,o=0,u=function(n){var e,o,u,c=i?n.ok:n.fail,a=n.resolve,s=n.reject,f=n.domain;try{c?(i||(2==t._h&&C(t),t._h=1),!0===c?e=r:(f&&f.enter(),e=c(r),f&&(f.exit(),u=!0)),e===n.promise?s(_("Promise-chain cycle")):(o=M(e))?o.call(e,a,s):a(e)):s(r)}catch(t){f&&!u&&f.exit(),s(t)}};e.length>o;)u(e[o++]);t._c=[],t._n=!1,n&&!t._h&&F(t)}))}},F=function(t){y.call(a,(function(){var n,e,r,i=t._v,o=L(t);if(o&&(n=b((function(){I?x.emit("unhandledRejection",i,t):(e=a.onunhandledrejection)?e({promise:t,reason:i}):(r=a.console)&&r.error&&r.error("Unhandled promise rejection",i)})),t._h=I||L(t)?2:1),t._a=void 0,o&&n.e)throw n.v}))},L=function(t){return 1!==t._h&&0===(t._a||t._c).length},C=function(t){y.call(a,(function(){var n;I?x.emit("rejectionHandled",t):(n=a.onrejectionhandled)&&n({promise:t,reason:t._v})}))},j=function(t){var n=this;n._d||(n._d=!0,(n=n._w||n)._v=t,n._s=2,n._a||(n._a=n._c.slice()),N(n,!0))},D=function(t){var n,e=this;if(!e._d){e._d=!0,e=e._w||e;try{if(e===t)throw _("Promise can't be resolved itself");(n=M(t))?m((function(){var r={_w:e,_d:!1};try{n.call(t,s(D,r,1),s(j,r,1))}catch(t){j.call(r,t)}})):(e._v=t,e._s=1,N(e,!1))}catch(t){j.call({_w:e,_d:!1},t)}}};R||(T=function(t){p(this,T,"Promise","_h"),h(t),r.call(this);try{t(s(D,this,1),s(j,this,1))}catch(t){j.call(this,t)}},(r=function(t){this._c=[],this._a=void 0,this._s=0,this._d=!1,this._v=void 0,this._h=0,this._n=!1}).prototype=e(43)(T.prototype,{then:function(t,n){var e=P(g(this,T));return e.ok="function"!=typeof t||t,e.fail="function"==typeof n&&n,e.domain=I?x.domain:void 0,this._c.push(e),this._a&&this._a.push(e),this._s&&N(this,!1),e.promise},catch:function(t){return this.then(void 0,t)}}),o=function(){var t=new r;this.promise=t,this.resolve=s(D,t,1),this.reject=s(j,t,1)},w.f=P=function(t){return t===T||t===u?new o(t):i(t)}),l(l.G+l.W+l.F*!R,{Promise:T}),e(38)(T,"Promise"),e(41)("Promise"),u=e(7).Promise,l(l.S+l.F*!R,"Promise",{reject:function(t){var n=P(this);return(0,n.reject)(t),n.promise}}),l(l.S+l.F*(c||!R),"Promise",{resolve:function(t){return S(c&&this===u?T:this,t)}}),l(l.S+l.F*!(R&&e(52)((function(t){T.all(t).catch(k)}))),"Promise",{all:function(t){var n=this,e=P(n),r=e.resolve,i=e.reject,o=b((function(){var e=[],o=0,u=1;d(t,!1,(function(t){var c=o++,a=!1;e.push(void 0),u++,n.resolve(t).then((function(t){a||(a=!0,e[c]=t,--u||r(e))}),i)})),--u||r(e)}));return o.e&&i(o.v),e.promise},race:function(t){var n=this,e=P(n),r=e.reject,i=b((function(){d(t,!1,(function(t){n.resolve(t).then(e.resolve,r)}))}));return i.e&&r(i.v),e.promise}})},function(t,n,e){"use strict";var r=e(18);function i(t){var n,e;this.promise=new t((function(t,r){if(void 0!==n||void 0!==e)throw TypeError("Bad Promise constructor");n=t,e=r})),this.resolve=r(n),this.reject=r(e)}t.exports.f=function(t){return new i(t)}},function(t,n,e){var r=e(3),i=e(4),o=e(111);t.exports=function(t,n){if(r(t),i(n)&&n.constructor===t)return n;var e=o.f(t);return(0,e.resolve)(n),e.promise}},function(t,n,e){"use strict";var r=e(9).f,i=e(33),o=e(43),u=e(17),c=e(42),a=e(56),s=e(72),f=e(107),l=e(41),v=e(8),h=e(27).fastKey,p=e(37),d=v?"_s":"size",g=function(t,n){var e,r=h(n);if("F"!==r)return t._i[r];for(e=t._f;e;e=e.n)if(e.k==n)return e};t.exports={getConstructor:function(t,n,e,s){var f=t((function(t,r){c(t,f,n,"_i"),t._t=n,t._i=i(null),t._f=void 0,t._l=void 0,t[d]=0,null!=r&&a(r,e,t[s],t)}));return o(f.prototype,{clear:function(){for(var t=p(this,n),e=t._i,r=t._f;r;r=r.n)r.r=!0,r.p&&(r.p=r.p.n=void 0),delete e[r.i];t._f=t._l=void 0,t[d]=0},delete:function(t){var e=p(this,n),r=g(e,t);if(r){var i=r.n,o=r.p;delete e._i[r.i],r.r=!0,o&&(o.n=i),i&&(i.p=o),e._f==r&&(e._f=i),e._l==r&&(e._l=o),e[d]--}return!!r},forEach:function(t){p(this,n);for(var e,r=u(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.n:this._f;)for(r(e.v,e.k,this);e&&e.r;)e=e.p},has:function(t){return!!g(p(this,n),t)}}),v&&r(f.prototype,"size",{get:function(){return p(this,n)[d]}}),f},def:function(t,n,e){var r,i,o=g(t,n);return o?o.v=e:(t._l=o={i:i=h(n,!0),k:n,v:e,p:r=t._l,n:void 0,r:!1},t._f||(t._f=o),r&&(r.n=o),t[d]++,"F"!==i&&(t._i[i]=o)),t},getEntry:g,setStrong:function(t,n,e){s(t,n,(function(t,e){this._t=p(t,n),this._k=e,this._l=void 0}),(function(){for(var t=this._k,n=this._l;n&&n.r;)n=n.p;return this._t&&(this._l=n=n?n.n:this._t._f)?f(0,"keys"==t?n.k:"values"==t?n.v:[n.k,n.v]):(this._t=void 0,f(1))}),e?"entries":"values",!e,!0),l(n)}}},function(t,n,e){"use strict";var r=e(43),i=e(27).getWeak,o=e(3),u=e(4),c=e(42),a=e(56),s=e(22),f=e(13),l=e(37),v=s(5),h=s(6),p=0,d=function(t){return t._l||(t._l=new g)},g=function(){this.a=[]},y=function(t,n){return v(t.a,(function(t){return t[0]===n}))};g.prototype={get:function(t){var n=y(this,t);if(n)return n[1]},has:function(t){return!!y(this,t)},set:function(t,n){var e=y(this,t);e?e[1]=n:this.a.push([t,n])},delete:function(t){var n=h(this.a,(function(n){return n[0]===t}));return~n&&this.a.splice(n,1),!!~n}},t.exports={getConstructor:function(t,n,e,o){var s=t((function(t,r){c(t,s,n,"_i"),t._t=n,t._i=p++,t._l=void 0,null!=r&&a(r,e,t[o],t)}));return r(s.prototype,{delete:function(t){if(!u(t))return!1;var e=i(t);return!0===e?d(l(this,n)).delete(t):e&&f(e,this._i)&&delete e[this._i]},has:function(t){if(!u(t))return!1;var e=i(t);return!0===e?d(l(this,n)).has(t):e&&f(e,this._i)}}),s},def:function(t,n,e){var r=i(o(n),!0);return!0===r?d(t).set(n,e):r[t._i]=e,t},ufstore:d}},function(t,n,e){var r=e(19),i=e(6);t.exports=function(t){if(void 0===t)return 0;var n=r(t),e=i(n);if(n!==e)throw RangeError("Wrong length!");return e}},function(t,n,e){var r=e(34),i=e(50),o=e(3),u=e(1).Reflect;t.exports=u&&u.ownKeys||function(t){var n=r.f(o(t)),e=i.f;return e?n.concat(e(t)):n}},function(t,n,e){var r=e(6),i=e(68),o=e(24);t.exports=function(t,n,e,u){var c=String(o(t)),a=c.length,s=void 0===e?" ":String(e),f=r(n);if(f<=a||""==s)return c;var l=f-a,v=i.call(s,Math.ceil(l/s.length));return v.length>l&&(v=v.slice(0,l)),u?v+c:c+v}},function(t,n,e){var r=e(8),i=e(31),o=e(15),u=e(45).f;t.exports=function(t){return function(n){for(var e,c=o(n),a=i(c),s=a.length,f=0,l=[];s>f;)e=a[f++],r&&!u.call(c,e)||l.push(t?[e,c[e]]:c[e]);return l}}},function(t,n){var e=t.exports={version:"2.6.12"};"number"==typeof __e&&(__e=e)},function(t,n){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,n,e){e(122),t.exports=e(308)},function(t,n,e){"use strict";e(123);var r,i=(r=e(295))&&r.__esModule?r:{default:r};i.default._babelPolyfill&&"undefined"!=typeof console&&console.warn&&console.warn("@babel/polyfill is loaded more than once on this page. This is probably not desirable/intended and may have consequences if different versions of the polyfills are applied sequentially. If you do need to load the polyfill more than once, use @babel/polyfill/noConflict instead to bypass the warning."),i.default._babelPolyfill=!0},function(t,n,e){"use strict";e(124),e(267),e(269),e(272),e(274),e(276),e(278),e(280),e(282),e(284),e(286),e(288),e(290),e(294)},function(t,n,e){e(125),e(128),e(129),e(130),e(131),e(132),e(133),e(134),e(135),e(136),e(137),e(138),e(139),e(140),e(141),e(142),e(143),e(144),e(145),e(146),e(147),e(148),e(149),e(150),e(151),e(152),e(153),e(154),e(155),e(156),e(157),e(158),e(159),e(160),e(161),e(162),e(163),e(164),e(165),e(166),e(167),e(168),e(169),e(171),e(172),e(173),e(174),e(175),e(176),e(177),e(178),e(179),e(180),e(181),e(182),e(183),e(184),e(185),e(186),e(187),e(188),e(189),e(190),e(191),e(192),e(193),e(194),e(195),e(196),e(197),e(198),e(199),e(200),e(201),e(202),e(203),e(204),e(206),e(207),e(209),e(210),e(211),e(212),e(213),e(214),e(215),e(217),e(218),e(219),e(220),e(221),e(222),e(223),e(224),e(225),e(226),e(227),e(228),e(229),e(80),e(230),e(108),e(231),e(109),e(232),e(233),e(234),e(235),e(110),e(238),e(239),e(240),e(241),e(242),e(243),e(244),e(245),e(246),e(247),e(248),e(249),e(250),e(251),e(252),e(253),e(254),e(255),e(256),e(257),e(258),e(259),e(260),e(261),e(262),e(263),e(264),e(265),e(266),t.exports=e(7)},function(t,n,e){"use strict";var r=e(1),i=e(13),o=e(8),u=e(0),c=e(11),a=e(27).KEY,s=e(2),f=e(48),l=e(38),v=e(29),h=e(5),p=e(61),d=e(89),g=e(127),y=e(51),m=e(3),w=e(4),b=e(10),E=e(15),S=e(26),_=e(28),x=e(33),O=e(92),A=e(20),T=e(50),I=e(9),k=e(31),P=A.f,R=I.f,M=O.f,N=r.Symbol,F=r.JSON,L=F&&F.stringify,C=h("_hidden"),j=h("toPrimitive"),D={}.propertyIsEnumerable,W=f("symbol-registry"),U=f("symbols"),G=f("op-symbols"),V=Object.prototype,B="function"==typeof N&&!!T.f,q=r.QObject,Y=!q||!q.prototype||!q.prototype.findChild,z=o&&s((function(){return 7!=x(R({},"a",{get:function(){return R(this,"a",{value:7}).a}})).a}))?function(t,n,e){var r=P(V,n);r&&delete V[n],R(t,n,e),r&&t!==V&&R(V,n,r)}:R,H=function(t){var n=U[t]=x(N.prototype);return n._k=t,n},K=B&&"symbol"==typeof N.iterator?function(t){return"symbol"==typeof t}:function(t){return t instanceof N},J=function(t,n,e){return t===V&&J(G,n,e),m(t),n=S(n,!0),m(e),i(U,n)?(e.enumerable?(i(t,C)&&t[C][n]&&(t[C][n]=!1),e=x(e,{enumerable:_(0,!1)})):(i(t,C)||R(t,C,_(1,{})),t[C][n]=!0),z(t,n,e)):R(t,n,e)},$=function(t,n){m(t);for(var e,r=g(n=E(n)),i=0,o=r.length;o>i;)J(t,e=r[i++],n[e]);return t},X=function(t){var n=D.call(this,t=S(t,!0));return!(this===V&&i(U,t)&&!i(G,t))&&(!(n||!i(this,t)||!i(U,t)||i(this,C)&&this[C][t])||n)},Q=function(t,n){if(t=E(t),n=S(n,!0),t!==V||!i(U,n)||i(G,n)){var e=P(t,n);return!e||!i(U,n)||i(t,C)&&t[C][n]||(e.enumerable=!0),e}},Z=function(t){for(var n,e=M(E(t)),r=[],o=0;e.length>o;)i(U,n=e[o++])||n==C||n==a||r.push(n);return r},tt=function(t){for(var n,e=t===V,r=M(e?G:E(t)),o=[],u=0;r.length>u;)!i(U,n=r[u++])||e&&!i(V,n)||o.push(U[n]);return o};B||(c((N=function(){if(this instanceof N)throw TypeError("Symbol is not a constructor!");var t=v(arguments.length>0?arguments[0]:void 0),n=function(e){this===V&&n.call(G,e),i(this,C)&&i(this[C],t)&&(this[C][t]=!1),z(this,t,_(1,e))};return o&&Y&&z(V,t,{configurable:!0,set:n}),H(t)}).prototype,"toString",(function(){return this._k})),A.f=Q,I.f=J,e(34).f=O.f=Z,e(45).f=X,T.f=tt,o&&!e(30)&&c(V,"propertyIsEnumerable",X,!0),p.f=function(t){return H(h(t))}),u(u.G+u.W+u.F*!B,{Symbol:N});for(var nt="hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables".split(","),et=0;nt.length>et;)h(nt[et++]);for(var rt=k(h.store),it=0;rt.length>it;)d(rt[it++]);u(u.S+u.F*!B,"Symbol",{for:function(t){return i(W,t+="")?W[t]:W[t]=N(t)},keyFor:function(t){if(!K(t))throw TypeError(t+" is not a symbol!");for(var n in W)if(W[n]===t)return n},useSetter:function(){Y=!0},useSimple:function(){Y=!1}}),u(u.S+u.F*!B,"Object",{create:function(t,n){return void 0===n?x(t):$(x(t),n)},defineProperty:J,defineProperties:$,getOwnPropertyDescriptor:Q,getOwnPropertyNames:Z,getOwnPropertySymbols:tt});var ot=s((function(){T.f(1)}));u(u.S+u.F*ot,"Object",{getOwnPropertySymbols:function(t){return T.f(b(t))}}),F&&u(u.S+u.F*(!B||s((function(){var t=N();return"[null]"!=L([t])||"{}"!=L({a:t})||"{}"!=L(Object(t))}))),"JSON",{stringify:function(t){for(var n,e,r=[t],i=1;arguments.length>i;)r.push(arguments[i++]);if(e=n=r[1],(w(n)||void 0!==t)&&!K(t))return y(n)||(n=function(t,n){if("function"==typeof e&&(n=e.call(this,t,n)),!K(n))return n}),r[1]=n,L.apply(F,r)}}),N.prototype[j]||e(14)(N.prototype,j,N.prototype.valueOf),l(N,"Symbol"),l(Math,"Math",!0),l(r.JSON,"JSON",!0)},function(t,n,e){t.exports=e(48)("native-function-to-string",Function.toString)},function(t,n,e){var r=e(31),i=e(50),o=e(45);t.exports=function(t){var n=r(t),e=i.f;if(e)for(var u,c=e(t),a=o.f,s=0;c.length>s;)a.call(t,u=c[s++])&&n.push(u);return n}},function(t,n,e){var r=e(0);r(r.S,"Object",{create:e(33)})},function(t,n,e){var r=e(0);r(r.S+r.F*!e(8),"Object",{defineProperty:e(9).f})},function(t,n,e){var r=e(0);r(r.S+r.F*!e(8),"Object",{defineProperties:e(91)})},function(t,n,e){var r=e(15),i=e(20).f;e(21)("getOwnPropertyDescriptor",(function(){return function(t,n){return i(r(t),n)}}))},function(t,n,e){var r=e(10),i=e(35);e(21)("getPrototypeOf",(function(){return function(t){return i(r(t))}}))},function(t,n,e){var r=e(10),i=e(31);e(21)("keys",(function(){return function(t){return i(r(t))}}))},function(t,n,e){e(21)("getOwnPropertyNames",(function(){return e(92).f}))},function(t,n,e){var r=e(4),i=e(27).onFreeze;e(21)("freeze",(function(t){return function(n){return t&&r(n)?t(i(n)):n}}))},function(t,n,e){var r=e(4),i=e(27).onFreeze;e(21)("seal",(function(t){return function(n){return t&&r(n)?t(i(n)):n}}))},function(t,n,e){var r=e(4),i=e(27).onFreeze;e(21)("preventExtensions",(function(t){return function(n){return t&&r(n)?t(i(n)):n}}))},function(t,n,e){var r=e(4);e(21)("isFrozen",(function(t){return function(n){return!r(n)||!!t&&t(n)}}))},function(t,n,e){var r=e(4);e(21)("isSealed",(function(t){return function(n){return!r(n)||!!t&&t(n)}}))},function(t,n,e){var r=e(4);e(21)("isExtensible",(function(t){return function(n){return!!r(n)&&(!t||t(n))}}))},function(t,n,e){var r=e(0);r(r.S+r.F,"Object",{assign:e(93)})},function(t,n,e){var r=e(0);r(r.S,"Object",{is:e(94)})},function(t,n,e){var r=e(0);r(r.S,"Object",{setPrototypeOf:e(65).set})},function(t,n,e){"use strict";var r=e(46),i={};i[e(5)("toStringTag")]="z",i+""!="[object z]"&&e(11)(Object.prototype,"toString",(function(){return"[object "+r(this)+"]"}),!0)},function(t,n,e){var r=e(0);r(r.P,"Function",{bind:e(95)})},function(t,n,e){var r=e(9).f,i=Function.prototype,o=/^\s*function ([^ (]*)/;"name"in i||e(8)&&r(i,"name",{configurable:!0,get:function(){try{return(""+this).match(o)[1]}catch(t){return""}}})},function(t,n,e){"use strict";var r=e(4),i=e(35),o=e(5)("hasInstance"),u=Function.prototype;o in u||e(9).f(u,o,{value:function(t){if("function"!=typeof this||!r(t))return!1;if(!r(this.prototype))return t instanceof this;for(;t=i(t);)if(this.prototype===t)return!0;return!1}})},function(t,n,e){var r=e(0),i=e(97);r(r.G+r.F*(parseInt!=i),{parseInt:i})},function(t,n,e){var r=e(0),i=e(98);r(r.G+r.F*(parseFloat!=i),{parseFloat:i})},function(t,n,e){"use strict";var r=e(1),i=e(13),o=e(23),u=e(67),c=e(26),a=e(2),s=e(34).f,f=e(20).f,l=e(9).f,v=e(39).trim,h=r.Number,p=h,d=h.prototype,g="Number"==o(e(33)(d)),y="trim"in String.prototype,m=function(t){var n=c(t,!1);if("string"==typeof n&&n.length>2){var e,r,i,o=(n=y?n.trim():v(n,3)).charCodeAt(0);if(43===o||45===o){if(88===(e=n.charCodeAt(2))||120===e)return NaN}else if(48===o){switch(n.charCodeAt(1)){case 66:case 98:r=2,i=49;break;case 79:case 111:r=8,i=55;break;default:return+n}for(var u,a=n.slice(2),s=0,f=a.length;s<f;s++)if((u=a.charCodeAt(s))<48||u>i)return NaN;return parseInt(a,r)}}return+n};if(!h(" 0o1")||!h("0b1")||h("+0x1")){h=function(t){var n=arguments.length<1?0:t,e=this;return e instanceof h&&(g?a((function(){d.valueOf.call(e)})):"Number"!=o(e))?u(new p(m(n)),e,h):m(n)};for(var w,b=e(8)?s(p):"MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger".split(","),E=0;b.length>E;E++)i(p,w=b[E])&&!i(h,w)&&l(h,w,f(p,w));h.prototype=d,d.constructor=h,e(11)(r,"Number",h)}},function(t,n,e){"use strict";var r=e(0),i=e(19),o=e(99),u=e(68),c=1..toFixed,a=Math.floor,s=[0,0,0,0,0,0],f="Number.toFixed: incorrect invocation!",l=function(t,n){for(var e=-1,r=n;++e<6;)r+=t*s[e],s[e]=r%1e7,r=a(r/1e7)},v=function(t){for(var n=6,e=0;--n>=0;)e+=s[n],s[n]=a(e/t),e=e%t*1e7},h=function(){for(var t=6,n="";--t>=0;)if(""!==n||0===t||0!==s[t]){var e=String(s[t]);n=""===n?e:n+u.call("0",7-e.length)+e}return n},p=function(t,n,e){return 0===n?e:n%2==1?p(t,n-1,e*t):p(t*t,n/2,e)};r(r.P+r.F*(!!c&&("0.000"!==8e-5.toFixed(3)||"1"!==.9.toFixed(0)||"1.25"!==1.255.toFixed(2)||"1000000000000000128"!==(0xde0b6b3a7640080).toFixed(0))||!e(2)((function(){c.call({})}))),"Number",{toFixed:function(t){var n,e,r,c,a=o(this,f),s=i(t),d="",g="0";if(s<0||s>20)throw RangeError(f);if(a!=a)return"NaN";if(a<=-1e21||a>=1e21)return String(a);if(a<0&&(d="-",a=-a),a>1e-21)if(e=(n=function(t){for(var n=0,e=t;e>=4096;)n+=12,e/=4096;for(;e>=2;)n+=1,e/=2;return n}(a*p(2,69,1))-69)<0?a*p(2,-n,1):a/p(2,n,1),e*=4503599627370496,(n=52-n)>0){for(l(0,e),r=s;r>=7;)l(1e7,0),r-=7;for(l(p(10,r,1),0),r=n-1;r>=23;)v(1<<23),r-=23;v(1<<r),l(1,1),v(2),g=h()}else l(0,e),l(1<<-n,0),g=h()+u.call("0",s);return g=s>0?d+((c=g.length)<=s?"0."+u.call("0",s-c)+g:g.slice(0,c-s)+"."+g.slice(c-s)):d+g}})},function(t,n,e){"use strict";var r=e(0),i=e(2),o=e(99),u=1..toPrecision;r(r.P+r.F*(i((function(){return"1"!==u.call(1,void 0)}))||!i((function(){u.call({})}))),"Number",{toPrecision:function(t){var n=o(this,"Number#toPrecision: incorrect invocation!");return void 0===t?u.call(n):u.call(n,t)}})},function(t,n,e){var r=e(0);r(r.S,"Number",{EPSILON:Math.pow(2,-52)})},function(t,n,e){var r=e(0),i=e(1).isFinite;r(r.S,"Number",{isFinite:function(t){return"number"==typeof t&&i(t)}})},function(t,n,e){var r=e(0);r(r.S,"Number",{isInteger:e(100)})},function(t,n,e){var r=e(0);r(r.S,"Number",{isNaN:function(t){return t!=t}})},function(t,n,e){var r=e(0),i=e(100),o=Math.abs;r(r.S,"Number",{isSafeInteger:function(t){return i(t)&&o(t)<=9007199254740991}})},function(t,n,e){var r=e(0);r(r.S,"Number",{MAX_SAFE_INTEGER:9007199254740991})},function(t,n,e){var r=e(0);r(r.S,"Number",{MIN_SAFE_INTEGER:-9007199254740991})},function(t,n,e){var r=e(0),i=e(98);r(r.S+r.F*(Number.parseFloat!=i),"Number",{parseFloat:i})},function(t,n,e){var r=e(0),i=e(97);r(r.S+r.F*(Number.parseInt!=i),"Number",{parseInt:i})},function(t,n,e){var r=e(0),i=e(101),o=Math.sqrt,u=Math.acosh;r(r.S+r.F*!(u&&710==Math.floor(u(Number.MAX_VALUE))&&u(1/0)==1/0),"Math",{acosh:function(t){return(t=+t)<1?NaN:t>94906265.62425156?Math.log(t)+Math.LN2:i(t-1+o(t-1)*o(t+1))}})},function(t,n,e){var r=e(0),i=Math.asinh;r(r.S+r.F*!(i&&1/i(0)>0),"Math",{asinh:function t(n){return isFinite(n=+n)&&0!=n?n<0?-t(-n):Math.log(n+Math.sqrt(n*n+1)):n}})},function(t,n,e){var r=e(0),i=Math.atanh;r(r.S+r.F*!(i&&1/i(-0)<0),"Math",{atanh:function(t){return 0==(t=+t)?t:Math.log((1+t)/(1-t))/2}})},function(t,n,e){var r=e(0),i=e(69);r(r.S,"Math",{cbrt:function(t){return i(t=+t)*Math.pow(Math.abs(t),1/3)}})},function(t,n,e){var r=e(0);r(r.S,"Math",{clz32:function(t){return(t>>>=0)?31-Math.floor(Math.log(t+.5)*Math.LOG2E):32}})},function(t,n,e){var r=e(0),i=Math.exp;r(r.S,"Math",{cosh:function(t){return(i(t=+t)+i(-t))/2}})},function(t,n,e){var r=e(0),i=e(70);r(r.S+r.F*(i!=Math.expm1),"Math",{expm1:i})},function(t,n,e){var r=e(0);r(r.S,"Math",{fround:e(170)})},function(t,n,e){var r=e(69),i=Math.pow,o=i(2,-52),u=i(2,-23),c=i(2,127)*(2-u),a=i(2,-126);t.exports=Math.fround||function(t){var n,e,i=Math.abs(t),s=r(t);return i<a?s*(i/a/u+1/o-1/o)*a*u:(e=(n=(1+u/o)*i)-(n-i))>c||e!=e?s*(1/0):s*e}},function(t,n,e){var r=e(0),i=Math.abs;r(r.S,"Math",{hypot:function(t,n){for(var e,r,o=0,u=0,c=arguments.length,a=0;u<c;)a<(e=i(arguments[u++]))?(o=o*(r=a/e)*r+1,a=e):o+=e>0?(r=e/a)*r:e;return a===1/0?1/0:a*Math.sqrt(o)}})},function(t,n,e){var r=e(0),i=Math.imul;r(r.S+r.F*e(2)((function(){return-5!=i(4294967295,5)||2!=i.length})),"Math",{imul:function(t,n){var e=+t,r=+n,i=65535&e,o=65535&r;return 0|i*o+((65535&e>>>16)*o+i*(65535&r>>>16)<<16>>>0)}})},function(t,n,e){var r=e(0);r(r.S,"Math",{log10:function(t){return Math.log(t)*Math.LOG10E}})},function(t,n,e){var r=e(0);r(r.S,"Math",{log1p:e(101)})},function(t,n,e){var r=e(0);r(r.S,"Math",{log2:function(t){return Math.log(t)/Math.LN2}})},function(t,n,e){var r=e(0);r(r.S,"Math",{sign:e(69)})},function(t,n,e){var r=e(0),i=e(70),o=Math.exp;r(r.S+r.F*e(2)((function(){return-2e-17!=!Math.sinh(-2e-17)})),"Math",{sinh:function(t){return Math.abs(t=+t)<1?(i(t)-i(-t))/2:(o(t-1)-o(-t-1))*(Math.E/2)}})},function(t,n,e){var r=e(0),i=e(70),o=Math.exp;r(r.S,"Math",{tanh:function(t){var n=i(t=+t),e=i(-t);return n==1/0?1:e==1/0?-1:(n-e)/(o(t)+o(-t))}})},function(t,n,e){var r=e(0);r(r.S,"Math",{trunc:function(t){return(t>0?Math.floor:Math.ceil)(t)}})},function(t,n,e){var r=e(0),i=e(32),o=String.fromCharCode,u=String.fromCodePoint;r(r.S+r.F*(!!u&&1!=u.length),"String",{fromCodePoint:function(t){for(var n,e=[],r=arguments.length,u=0;r>u;){if(n=+arguments[u++],i(n,1114111)!==n)throw RangeError(n+" is not a valid code point");e.push(n<65536?o(n):o(55296+((n-=65536)>>10),n%1024+56320))}return e.join("")}})},function(t,n,e){var r=e(0),i=e(15),o=e(6);r(r.S,"String",{raw:function(t){for(var n=i(t.raw),e=o(n.length),r=arguments.length,u=[],c=0;e>c;)u.push(String(n[c++])),c<r&&u.push(String(arguments[c]));return u.join("")}})},function(t,n,e){"use strict";e(39)("trim",(function(t){return function(){return t(this,3)}}))},function(t,n,e){"use strict";var r=e(71)(!0);e(72)(String,"String",(function(t){this._t=String(t),this._i=0}),(function(){var t,n=this._t,e=this._i;return e>=n.length?{value:void 0,done:!0}:(t=r(n,e),this._i+=t.length,{value:t,done:!1})}))},function(t,n,e){"use strict";var r=e(0),i=e(71)(!1);r(r.P,"String",{codePointAt:function(t){return i(this,t)}})},function(t,n,e){"use strict";var r=e(0),i=e(6),o=e(73),u="".endsWith;r(r.P+r.F*e(75)("endsWith"),"String",{endsWith:function(t){var n=o(this,t,"endsWith"),e=arguments.length>1?arguments[1]:void 0,r=i(n.length),c=void 0===e?r:Math.min(i(e),r),a=String(t);return u?u.call(n,a,c):n.slice(c-a.length,c)===a}})},function(t,n,e){"use strict";var r=e(0),i=e(73);r(r.P+r.F*e(75)("includes"),"String",{includes:function(t){return!!~i(this,t,"includes").indexOf(t,arguments.length>1?arguments[1]:void 0)}})},function(t,n,e){var r=e(0);r(r.P,"String",{repeat:e(68)})},function(t,n,e){"use strict";var r=e(0),i=e(6),o=e(73),u="".startsWith;r(r.P+r.F*e(75)("startsWith"),"String",{startsWith:function(t){var n=o(this,t,"startsWith"),e=i(Math.min(arguments.length>1?arguments[1]:void 0,n.length)),r=String(t);return u?u.call(n,r,e):n.slice(e,e+r.length)===r}})},function(t,n,e){"use strict";e(12)("anchor",(function(t){return function(n){return t(this,"a","name",n)}}))},function(t,n,e){"use strict";e(12)("big",(function(t){return function(){return t(this,"big","","")}}))},function(t,n,e){"use strict";e(12)("blink",(function(t){return function(){return t(this,"blink","","")}}))},function(t,n,e){"use strict";e(12)("bold",(function(t){return function(){return t(this,"b","","")}}))},function(t,n,e){"use strict";e(12)("fixed",(function(t){return function(){return t(this,"tt","","")}}))},function(t,n,e){"use strict";e(12)("fontcolor",(function(t){return function(n){return t(this,"font","color",n)}}))},function(t,n,e){"use strict";e(12)("fontsize",(function(t){return function(n){return t(this,"font","size",n)}}))},function(t,n,e){"use strict";e(12)("italics",(function(t){return function(){return t(this,"i","","")}}))},function(t,n,e){"use strict";e(12)("link",(function(t){return function(n){return t(this,"a","href",n)}}))},function(t,n,e){"use strict";e(12)("small",(function(t){return function(){return t(this,"small","","")}}))},function(t,n,e){"use strict";e(12)("strike",(function(t){return function(){return t(this,"strike","","")}}))},function(t,n,e){"use strict";e(12)("sub",(function(t){return function(){return t(this,"sub","","")}}))},function(t,n,e){"use strict";e(12)("sup",(function(t){return function(){return t(this,"sup","","")}}))},function(t,n,e){var r=e(0);r(r.S,"Date",{now:function(){return(new Date).getTime()}})},function(t,n,e){"use strict";var r=e(0),i=e(10),o=e(26);r(r.P+r.F*e(2)((function(){return null!==new Date(NaN).toJSON()||1!==Date.prototype.toJSON.call({toISOString:function(){return 1}})})),"Date",{toJSON:function(t){var n=i(this),e=o(n);return"number"!=typeof e||isFinite(e)?n.toISOString():null}})},function(t,n,e){var r=e(0),i=e(205);r(r.P+r.F*(Date.prototype.toISOString!==i),"Date",{toISOString:i})},function(t,n,e){"use strict";var r=e(2),i=Date.prototype.getTime,o=Date.prototype.toISOString,u=function(t){return t>9?t:"0"+t};t.exports=r((function(){return"0385-07-25T07:06:39.999Z"!=o.call(new Date(-50000000000001))}))||!r((function(){o.call(new Date(NaN))}))?function(){if(!isFinite(i.call(this)))throw RangeError("Invalid time value");var t=this,n=t.getUTCFullYear(),e=t.getUTCMilliseconds(),r=n<0?"-":n>9999?"+":"";return r+("00000"+Math.abs(n)).slice(r?-6:-4)+"-"+u(t.getUTCMonth()+1)+"-"+u(t.getUTCDate())+"T"+u(t.getUTCHours())+":"+u(t.getUTCMinutes())+":"+u(t.getUTCSeconds())+"."+(e>99?e:"0"+u(e))+"Z"}:o},function(t,n,e){var r=Date.prototype,i=r.toString,o=r.getTime;new Date(NaN)+""!="Invalid Date"&&e(11)(r,"toString",(function(){var t=o.call(this);return t==t?i.call(this):"Invalid Date"}))},function(t,n,e){var r=e(5)("toPrimitive"),i=Date.prototype;r in i||e(14)(i,r,e(208))},function(t,n,e){"use strict";var r=e(3),i=e(26);t.exports=function(t){if("string"!==t&&"number"!==t&&"default"!==t)throw TypeError("Incorrect hint");return i(r(this),"number"!=t)}},function(t,n,e){var r=e(0);r(r.S,"Array",{isArray:e(51)})},function(t,n,e){"use strict";var r=e(17),i=e(0),o=e(10),u=e(103),c=e(76),a=e(6),s=e(77),f=e(78);i(i.S+i.F*!e(52)((function(t){Array.from(t)})),"Array",{from:function(t){var n,e,i,l,v=o(t),h="function"==typeof this?this:Array,p=arguments.length,d=p>1?arguments[1]:void 0,g=void 0!==d,y=0,m=f(v);if(g&&(d=r(d,p>2?arguments[2]:void 0,2)),null==m||h==Array&&c(m))for(e=new h(n=a(v.length));n>y;y++)s(e,y,g?d(v[y],y):v[y]);else for(l=m.call(v),e=new h;!(i=l.next()).done;y++)s(e,y,g?u(l,d,[i.value,y],!0):i.value);return e.length=y,e}})},function(t,n,e){"use strict";var r=e(0),i=e(77);r(r.S+r.F*e(2)((function(){function t(){}return!(Array.of.call(t)instanceof t)})),"Array",{of:function(){for(var t=0,n=arguments.length,e=new("function"==typeof this?this:Array)(n);n>t;)i(e,t,arguments[t++]);return e.length=n,e}})},function(t,n,e){"use strict";var r=e(0),i=e(15),o=[].join;r(r.P+r.F*(e(44)!=Object||!e(16)(o)),"Array",{join:function(t){return o.call(i(this),void 0===t?",":t)}})},function(t,n,e){"use strict";var r=e(0),i=e(64),o=e(23),u=e(32),c=e(6),a=[].slice;r(r.P+r.F*e(2)((function(){i&&a.call(i)})),"Array",{slice:function(t,n){var e=c(this.length),r=o(this);if(n=void 0===n?e:n,"Array"==r)return a.call(this,t,n);for(var i=u(t,e),s=u(n,e),f=c(s-i),l=new Array(f),v=0;v<f;v++)l[v]="String"==r?this.charAt(i+v):this[i+v];return l}})},function(t,n,e){"use strict";var r=e(0),i=e(18),o=e(10),u=e(2),c=[].sort,a=[1,2,3];r(r.P+r.F*(u((function(){a.sort(void 0)}))||!u((function(){a.sort(null)}))||!e(16)(c)),"Array",{sort:function(t){return void 0===t?c.call(o(this)):c.call(o(this),i(t))}})},function(t,n,e){"use strict";var r=e(0),i=e(22)(0),o=e(16)([].forEach,!0);r(r.P+r.F*!o,"Array",{forEach:function(t){return i(this,t,arguments[1])}})},function(t,n,e){var r=e(4),i=e(51),o=e(5)("species");t.exports=function(t){var n;return i(t)&&("function"!=typeof(n=t.constructor)||n!==Array&&!i(n.prototype)||(n=void 0),r(n)&&null===(n=n[o])&&(n=void 0)),void 0===n?Array:n}},function(t,n,e){"use strict";var r=e(0),i=e(22)(1);r(r.P+r.F*!e(16)([].map,!0),"Array",{map:function(t){return i(this,t,arguments[1])}})},function(t,n,e){"use strict";var r=e(0),i=e(22)(2);r(r.P+r.F*!e(16)([].filter,!0),"Array",{filter:function(t){return i(this,t,arguments[1])}})},function(t,n,e){"use strict";var r=e(0),i=e(22)(3);r(r.P+r.F*!e(16)([].some,!0),"Array",{some:function(t){return i(this,t,arguments[1])}})},function(t,n,e){"use strict";var r=e(0),i=e(22)(4);r(r.P+r.F*!e(16)([].every,!0),"Array",{every:function(t){return i(this,t,arguments[1])}})},function(t,n,e){"use strict";var r=e(0),i=e(105);r(r.P+r.F*!e(16)([].reduce,!0),"Array",{reduce:function(t){return i(this,t,arguments.length,arguments[1],!1)}})},function(t,n,e){"use strict";var r=e(0),i=e(105);r(r.P+r.F*!e(16)([].reduceRight,!0),"Array",{reduceRight:function(t){return i(this,t,arguments.length,arguments[1],!0)}})},function(t,n,e){"use strict";var r=e(0),i=e(49)(!1),o=[].indexOf,u=!!o&&1/[1].indexOf(1,-0)<0;r(r.P+r.F*(u||!e(16)(o)),"Array",{indexOf:function(t){return u?o.apply(this,arguments)||0:i(this,t,arguments[1])}})},function(t,n,e){"use strict";var r=e(0),i=e(15),o=e(19),u=e(6),c=[].lastIndexOf,a=!!c&&1/[1].lastIndexOf(1,-0)<0;r(r.P+r.F*(a||!e(16)(c)),"Array",{lastIndexOf:function(t){if(a)return c.apply(this,arguments)||0;var n=i(this),e=u(n.length),r=e-1;for(arguments.length>1&&(r=Math.min(r,o(arguments[1]))),r<0&&(r=e+r);r>=0;r--)if(r in n&&n[r]===t)return r||0;return-1}})},function(t,n,e){var r=e(0);r(r.P,"Array",{copyWithin:e(106)}),e(36)("copyWithin")},function(t,n,e){var r=e(0);r(r.P,"Array",{fill:e(79)}),e(36)("fill")},function(t,n,e){"use strict";var r=e(0),i=e(22)(5),o=!0;"find"in[]&&Array(1).find((function(){o=!1})),r(r.P+r.F*o,"Array",{find:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}}),e(36)("find")},function(t,n,e){"use strict";var r=e(0),i=e(22)(6),o="findIndex",u=!0;o in[]&&Array(1)[o]((function(){u=!1})),r(r.P+r.F*u,"Array",{findIndex:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}}),e(36)(o)},function(t,n,e){e(41)("Array")},function(t,n,e){var r=e(1),i=e(67),o=e(9).f,u=e(34).f,c=e(74),a=e(53),s=r.RegExp,f=s,l=s.prototype,v=/a/g,h=/a/g,p=new s(v)!==v;if(e(8)&&(!p||e(2)((function(){return h[e(5)("match")]=!1,s(v)!=v||s(h)==h||"/a/i"!=s(v,"i")})))){s=function(t,n){var e=this instanceof s,r=c(t),o=void 0===n;return!e&&r&&t.constructor===s&&o?t:i(p?new f(r&&!o?t.source:t,n):f((r=t instanceof s)?t.source:t,r&&o?a.call(t):n),e?this:l,s)};for(var d=function(t){t in s||o(s,t,{configurable:!0,get:function(){return f[t]},set:function(n){f[t]=n}})},g=u(f),y=0;g.length>y;)d(g[y++]);l.constructor=s,s.prototype=l,e(11)(r,"RegExp",s)}e(41)("RegExp")},function(t,n,e){"use strict";e(109);var r=e(3),i=e(53),o=e(8),u=/./.toString,c=function(t){e(11)(RegExp.prototype,"toString",t,!0)};e(2)((function(){return"/a/b"!=u.call({source:"a",flags:"b"})}))?c((function(){var t=r(this);return"/".concat(t.source,"/","flags"in t?t.flags:!o&&t instanceof RegExp?i.call(t):void 0)})):"toString"!=u.name&&c((function(){return u.call(this)}))},function(t,n,e){"use strict";var r=e(3),i=e(6),o=e(82),u=e(54);e(55)("match",1,(function(t,n,e,c){return[function(e){var r=t(this),i=null==e?void 0:e[n];return void 0!==i?i.call(e,r):new RegExp(e)[n](String(r))},function(t){var n=c(e,t,this);if(n.done)return n.value;var a=r(t),s=String(this);if(!a.global)return u(a,s);var f=a.unicode;a.lastIndex=0;for(var l,v=[],h=0;null!==(l=u(a,s));){var p=String(l[0]);v[h]=p,""===p&&(a.lastIndex=o(s,i(a.lastIndex),f)),h++}return 0===h?null:v}]}))},function(t,n,e){"use strict";var r=e(3),i=e(10),o=e(6),u=e(19),c=e(82),a=e(54),s=Math.max,f=Math.min,l=Math.floor,v=/\$([$&`']|\d\d?|<[^>]*>)/g,h=/\$([$&`']|\d\d?)/g;e(55)("replace",2,(function(t,n,e,p){return[function(r,i){var o=t(this),u=null==r?void 0:r[n];return void 0!==u?u.call(r,o,i):e.call(String(o),r,i)},function(t,n){var i=p(e,t,this,n);if(i.done)return i.value;var l=r(t),v=String(this),h="function"==typeof n;h||(n=String(n));var g=l.global;if(g){var y=l.unicode;l.lastIndex=0}for(var m=[];;){var w=a(l,v);if(null===w)break;if(m.push(w),!g)break;""===String(w[0])&&(l.lastIndex=c(v,o(l.lastIndex),y))}for(var b,E="",S=0,_=0;_<m.length;_++){w=m[_];for(var x=String(w[0]),O=s(f(u(w.index),v.length),0),A=[],T=1;T<w.length;T++)A.push(void 0===(b=w[T])?b:String(b));var I=w.groups;if(h){var k=[x].concat(A,O,v);void 0!==I&&k.push(I);var P=String(n.apply(void 0,k))}else P=d(x,v,O,A,I,n);O>=S&&(E+=v.slice(S,O)+P,S=O+x.length)}return E+v.slice(S)}];function d(t,n,r,o,u,c){var a=r+t.length,s=o.length,f=h;return void 0!==u&&(u=i(u),f=v),e.call(c,f,(function(e,i){var c;switch(i.charAt(0)){case"$":return"$";case"&":return t;case"`":return n.slice(0,r);case"'":return n.slice(a);case"<":c=u[i.slice(1,-1)];break;default:var f=+i;if(0===f)return e;if(f>s){var v=l(f/10);return 0===v?e:v<=s?void 0===o[v-1]?i.charAt(1):o[v-1]+i.charAt(1):e}c=o[f-1]}return void 0===c?"":c}))}}))},function(t,n,e){"use strict";var r=e(3),i=e(94),o=e(54);e(55)("search",1,(function(t,n,e,u){return[function(e){var r=t(this),i=null==e?void 0:e[n];return void 0!==i?i.call(e,r):new RegExp(e)[n](String(r))},function(t){var n=u(e,t,this);if(n.done)return n.value;var c=r(t),a=String(this),s=c.lastIndex;i(s,0)||(c.lastIndex=0);var f=o(c,a);return i(c.lastIndex,s)||(c.lastIndex=s),null===f?-1:f.index}]}))},function(t,n,e){"use strict";var r=e(74),i=e(3),o=e(47),u=e(82),c=e(6),a=e(54),s=e(81),f=e(2),l=Math.min,v=[].push,h="length",p=!f((function(){RegExp(4294967295,"y")}));e(55)("split",2,(function(t,n,e,f){var d;return d="c"=="abbc".split(/(b)*/)[1]||4!="test".split(/(?:)/,-1)[h]||2!="ab".split(/(?:ab)*/)[h]||4!=".".split(/(.?)(.?)/)[h]||".".split(/()()/)[h]>1||"".split(/.?/)[h]?function(t,n){var i=String(this);if(void 0===t&&0===n)return[];if(!r(t))return e.call(i,t,n);for(var o,u,c,a=[],f=(t.ignoreCase?"i":"")+(t.multiline?"m":"")+(t.unicode?"u":"")+(t.sticky?"y":""),l=0,p=void 0===n?4294967295:n>>>0,d=new RegExp(t.source,f+"g");(o=s.call(d,i))&&!((u=d.lastIndex)>l&&(a.push(i.slice(l,o.index)),o[h]>1&&o.index<i[h]&&v.apply(a,o.slice(1)),c=o[0][h],l=u,a[h]>=p));)d.lastIndex===o.index&&d.lastIndex++;return l===i[h]?!c&&d.test("")||a.push(""):a.push(i.slice(l)),a[h]>p?a.slice(0,p):a}:"0".split(void 0,0)[h]?function(t,n){return void 0===t&&0===n?[]:e.call(this,t,n)}:e,[function(e,r){var i=t(this),o=null==e?void 0:e[n];return void 0!==o?o.call(e,i,r):d.call(String(i),e,r)},function(t,n){var r=f(d,t,this,n,d!==e);if(r.done)return r.value;var s=i(t),v=String(this),h=o(s,RegExp),g=s.unicode,y=(s.ignoreCase?"i":"")+(s.multiline?"m":"")+(s.unicode?"u":"")+(p?"y":"g"),m=new h(p?s:"^(?:"+s.source+")",y),w=void 0===n?4294967295:n>>>0;if(0===w)return[];if(0===v.length)return null===a(m,v)?[v]:[];for(var b=0,E=0,S=[];E<v.length;){m.lastIndex=p?E:0;var _,x=a(m,p?v:v.slice(E));if(null===x||(_=l(c(m.lastIndex+(p?0:E)),v.length))===b)E=u(v,E,g);else{if(S.push(v.slice(b,E)),S.length===w)return S;for(var O=1;O<=x.length-1;O++)if(S.push(x[O]),S.length===w)return S;E=b=_}}return S.push(v.slice(b)),S}]}))},function(t,n,e){var r=e(1),i=e(83).set,o=r.MutationObserver||r.WebKitMutationObserver,u=r.process,c=r.Promise,a="process"==e(23)(u);t.exports=function(){var t,n,e,s=function(){var r,i;for(a&&(r=u.domain)&&r.exit();t;){i=t.fn,t=t.next;try{i()}catch(r){throw t?e():n=void 0,r}}n=void 0,r&&r.enter()};if(a)e=function(){u.nextTick(s)};else if(!o||r.navigator&&r.navigator.standalone)if(c&&c.resolve){var f=c.resolve(void 0);e=function(){f.then(s)}}else e=function(){i.call(r,s)};else{var l=!0,v=document.createTextNode("");new o(s).observe(v,{characterData:!0}),e=function(){v.data=l=!l}}return function(r){var i={fn:r,next:void 0};n&&(n.next=i),t||(t=i,e()),n=i}}},function(t,n){t.exports=function(t){try{return{e:!1,v:t()}}catch(t){return{e:!0,v:t}}}},function(t,n,e){"use strict";var r=e(113),i=e(37);t.exports=e(58)("Map",(function(t){return function(){return t(this,arguments.length>0?arguments[0]:void 0)}}),{get:function(t){var n=r.getEntry(i(this,"Map"),t);return n&&n.v},set:function(t,n){return r.def(i(this,"Map"),0===t?0:t,n)}},r,!0)},function(t,n,e){"use strict";var r=e(113),i=e(37);t.exports=e(58)("Set",(function(t){return function(){return t(this,arguments.length>0?arguments[0]:void 0)}}),{add:function(t){return r.def(i(this,"Set"),t=0===t?0:t,t)}},r)},function(t,n,e){"use strict";var r,i=e(1),o=e(22)(0),u=e(11),c=e(27),a=e(93),s=e(114),f=e(4),l=e(37),v=e(37),h=!i.ActiveXObject&&"ActiveXObject"in i,p=c.getWeak,d=Object.isExtensible,g=s.ufstore,y=function(t){return function(){return t(this,arguments.length>0?arguments[0]:void 0)}},m={get:function(t){if(f(t)){var n=p(t);return!0===n?g(l(this,"WeakMap")).get(t):n?n[this._i]:void 0}},set:function(t,n){return s.def(l(this,"WeakMap"),t,n)}},w=t.exports=e(58)("WeakMap",y,m,s,!0,!0);v&&h&&(a((r=s.getConstructor(y,"WeakMap")).prototype,m),c.NEED=!0,o(["delete","has","get","set"],(function(t){var n=w.prototype,e=n[t];u(n,t,(function(n,i){if(f(n)&&!d(n)){this._f||(this._f=new r);var o=this._f[t](n,i);return"set"==t?this:o}return e.call(this,n,i)}))})))},function(t,n,e){"use strict";var r=e(114),i=e(37);e(58)("WeakSet",(function(t){return function(){return t(this,arguments.length>0?arguments[0]:void 0)}}),{add:function(t){return r.def(i(this,"WeakSet"),t,!0)}},r,!1,!0)},function(t,n,e){"use strict";var r=e(0),i=e(59),o=e(84),u=e(3),c=e(32),a=e(6),s=e(4),f=e(1).ArrayBuffer,l=e(47),v=o.ArrayBuffer,h=o.DataView,p=i.ABV&&f.isView,d=v.prototype.slice,g=i.VIEW;r(r.G+r.W+r.F*(f!==v),{ArrayBuffer:v}),r(r.S+r.F*!i.CONSTR,"ArrayBuffer",{isView:function(t){return p&&p(t)||s(t)&&g in t}}),r(r.P+r.U+r.F*e(2)((function(){return!new v(2).slice(1,void 0).byteLength})),"ArrayBuffer",{slice:function(t,n){if(void 0!==d&&void 0===n)return d.call(u(this),t);for(var e=u(this).byteLength,r=c(t,e),i=c(void 0===n?e:n,e),o=new(l(this,v))(a(i-r)),s=new h(this),f=new h(o),p=0;r<i;)f.setUint8(p++,s.getUint8(r++));return o}}),e(41)("ArrayBuffer")},function(t,n,e){var r=e(0);r(r.G+r.W+r.F*!e(59).ABV,{DataView:e(84).DataView})},function(t,n,e){e(25)("Int8",1,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Uint8",1,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Uint8",1,(function(t){return function(n,e,r){return t(this,n,e,r)}}),!0)},function(t,n,e){e(25)("Int16",2,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Uint16",2,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Int32",4,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Uint32",4,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Float32",4,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){e(25)("Float64",8,(function(t){return function(n,e,r){return t(this,n,e,r)}}))},function(t,n,e){var r=e(0),i=e(18),o=e(3),u=(e(1).Reflect||{}).apply,c=Function.apply;r(r.S+r.F*!e(2)((function(){u((function(){}))})),"Reflect",{apply:function(t,n,e){var r=i(t),a=o(e);return u?u(r,n,a):c.call(r,n,a)}})},function(t,n,e){var r=e(0),i=e(33),o=e(18),u=e(3),c=e(4),a=e(2),s=e(95),f=(e(1).Reflect||{}).construct,l=a((function(){function t(){}return!(f((function(){}),[],t)instanceof t)})),v=!a((function(){f((function(){}))}));r(r.S+r.F*(l||v),"Reflect",{construct:function(t,n){o(t),u(n);var e=arguments.length<3?t:o(arguments[2]);if(v&&!l)return f(t,n,e);if(t==e){switch(n.length){case 0:return new t;case 1:return new t(n[0]);case 2:return new t(n[0],n[1]);case 3:return new t(n[0],n[1],n[2]);case 4:return new t(n[0],n[1],n[2],n[3])}var r=[null];return r.push.apply(r,n),new(s.apply(t,r))}var a=e.prototype,h=i(c(a)?a:Object.prototype),p=Function.apply.call(t,h,n);return c(p)?p:h}})},function(t,n,e){var r=e(9),i=e(0),o=e(3),u=e(26);i(i.S+i.F*e(2)((function(){Reflect.defineProperty(r.f({},1,{value:1}),1,{value:2})})),"Reflect",{defineProperty:function(t,n,e){o(t),n=u(n,!0),o(e);try{return r.f(t,n,e),!0}catch(t){return!1}}})},function(t,n,e){var r=e(0),i=e(20).f,o=e(3);r(r.S,"Reflect",{deleteProperty:function(t,n){var e=i(o(t),n);return!(e&&!e.configurable)&&delete t[n]}})},function(t,n,e){"use strict";var r=e(0),i=e(3),o=function(t){this._t=i(t),this._i=0;var n,e=this._k=[];for(n in t)e.push(n)};e(102)(o,"Object",(function(){var t,n=this._k;do{if(this._i>=n.length)return{value:void 0,done:!0}}while(!((t=n[this._i++])in this._t));return{value:t,done:!1}})),r(r.S,"Reflect",{enumerate:function(t){return new o(t)}})},function(t,n,e){var r=e(20),i=e(35),o=e(13),u=e(0),c=e(4),a=e(3);u(u.S,"Reflect",{get:function t(n,e){var u,s,f=arguments.length<3?n:arguments[2];return a(n)===f?n[e]:(u=r.f(n,e))?o(u,"value")?u.value:void 0!==u.get?u.get.call(f):void 0:c(s=i(n))?t(s,e,f):void 0}})},function(t,n,e){var r=e(20),i=e(0),o=e(3);i(i.S,"Reflect",{getOwnPropertyDescriptor:function(t,n){return r.f(o(t),n)}})},function(t,n,e){var r=e(0),i=e(35),o=e(3);r(r.S,"Reflect",{getPrototypeOf:function(t){return i(o(t))}})},function(t,n,e){var r=e(0);r(r.S,"Reflect",{has:function(t,n){return n in t}})},function(t,n,e){var r=e(0),i=e(3),o=Object.isExtensible;r(r.S,"Reflect",{isExtensible:function(t){return i(t),!o||o(t)}})},function(t,n,e){var r=e(0);r(r.S,"Reflect",{ownKeys:e(116)})},function(t,n,e){var r=e(0),i=e(3),o=Object.preventExtensions;r(r.S,"Reflect",{preventExtensions:function(t){i(t);try{return o&&o(t),!0}catch(t){return!1}}})},function(t,n,e){var r=e(9),i=e(20),o=e(35),u=e(13),c=e(0),a=e(28),s=e(3),f=e(4);c(c.S,"Reflect",{set:function t(n,e,c){var l,v,h=arguments.length<4?n:arguments[3],p=i.f(s(n),e);if(!p){if(f(v=o(n)))return t(v,e,c,h);p=a(0)}if(u(p,"value")){if(!1===p.writable||!f(h))return!1;if(l=i.f(h,e)){if(l.get||l.set||!1===l.writable)return!1;l.value=c,r.f(h,e,l)}else r.f(h,e,a(0,c));return!0}return void 0!==p.set&&(p.set.call(h,c),!0)}})},function(t,n,e){var r=e(0),i=e(65);i&&r(r.S,"Reflect",{setPrototypeOf:function(t,n){i.check(t,n);try{return i.set(t,n),!0}catch(t){return!1}}})},function(t,n,e){e(268),t.exports=e(7).Array.includes},function(t,n,e){"use strict";var r=e(0),i=e(49)(!0);r(r.P,"Array",{includes:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}}),e(36)("includes")},function(t,n,e){e(270),t.exports=e(7).Array.flatMap},function(t,n,e){"use strict";var r=e(0),i=e(271),o=e(10),u=e(6),c=e(18),a=e(104);r(r.P,"Array",{flatMap:function(t){var n,e,r=o(this);return c(t),n=u(r.length),e=a(r,0),i(e,r,r,n,0,1,t,arguments[1]),e}}),e(36)("flatMap")},function(t,n,e){"use strict";var r=e(51),i=e(4),o=e(6),u=e(17),c=e(5)("isConcatSpreadable");t.exports=function t(n,e,a,s,f,l,v,h){for(var p,d,g=f,y=0,m=!!v&&u(v,h,3);y<s;){if(y in a){if(p=m?m(a[y],y,e):a[y],d=!1,i(p)&&(d=void 0!==(d=p[c])?!!d:r(p)),d&&l>0)g=t(n,e,p,o(p.length),g,l-1)-1;else{if(g>=9007199254740991)throw TypeError();n[g]=p}g++}y++}return g}},function(t,n,e){e(273),t.exports=e(7).String.padStart},function(t,n,e){"use strict";var r=e(0),i=e(117),o=e(57),u=/Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(o);r(r.P+r.F*u,"String",{padStart:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0,!0)}})},function(t,n,e){e(275),t.exports=e(7).String.padEnd},function(t,n,e){"use strict";var r=e(0),i=e(117),o=e(57),u=/Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(o);r(r.P+r.F*u,"String",{padEnd:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0,!1)}})},function(t,n,e){e(277),t.exports=e(7).String.trimLeft},function(t,n,e){"use strict";e(39)("trimLeft",(function(t){return function(){return t(this,1)}}),"trimStart")},function(t,n,e){e(279),t.exports=e(7).String.trimRight},function(t,n,e){"use strict";e(39)("trimRight",(function(t){return function(){return t(this,2)}}),"trimEnd")},function(t,n,e){e(281),t.exports=e(61).f("asyncIterator")},function(t,n,e){e(89)("asyncIterator")},function(t,n,e){e(283),t.exports=e(7).Object.getOwnPropertyDescriptors},function(t,n,e){var r=e(0),i=e(116),o=e(15),u=e(20),c=e(77);r(r.S,"Object",{getOwnPropertyDescriptors:function(t){for(var n,e,r=o(t),a=u.f,s=i(r),f={},l=0;s.length>l;)void 0!==(e=a(r,n=s[l++]))&&c(f,n,e);return f}})},function(t,n,e){e(285),t.exports=e(7).Object.values},function(t,n,e){var r=e(0),i=e(118)(!1);r(r.S,"Object",{values:function(t){return i(t)}})},function(t,n,e){e(287),t.exports=e(7).Object.entries},function(t,n,e){var r=e(0),i=e(118)(!0);r(r.S,"Object",{entries:function(t){return i(t)}})},function(t,n,e){"use strict";e(110),e(289),t.exports=e(7).Promise.finally},function(t,n,e){"use strict";var r=e(0),i=e(7),o=e(1),u=e(47),c=e(112);r(r.P+r.R,"Promise",{finally:function(t){var n=u(this,i.Promise||o.Promise),e="function"==typeof t;return this.then(e?function(e){return c(n,t()).then((function(){return e}))}:t,e?function(e){return c(n,t()).then((function(){throw e}))}:t)}})},function(t,n,e){e(291),e(292),e(293),t.exports=e(7)},function(t,n,e){var r=e(1),i=e(0),o=e(57),u=[].slice,c=/MSIE .\./.test(o),a=function(t){return function(n,e){var r=arguments.length>2,i=!!r&&u.call(arguments,2);return t(r?function(){("function"==typeof n?n:Function(n)).apply(this,i)}:n,e)}};i(i.G+i.B+i.F*c,{setTimeout:a(r.setTimeout),setInterval:a(r.setInterval)})},function(t,n,e){var r=e(0),i=e(83);r(r.G+r.B,{setImmediate:i.set,clearImmediate:i.clear})},function(t,n,e){for(var r=e(80),i=e(31),o=e(11),u=e(1),c=e(14),a=e(40),s=e(5),f=s("iterator"),l=s("toStringTag"),v=a.Array,h={CSSRuleList:!0,CSSStyleDeclaration:!1,CSSValueList:!1,ClientRectList:!1,DOMRectList:!1,DOMStringList:!1,DOMTokenList:!0,DataTransferItemList:!1,FileList:!1,HTMLAllCollection:!1,HTMLCollection:!1,HTMLFormElement:!1,HTMLSelectElement:!1,MediaList:!0,MimeTypeArray:!1,NamedNodeMap:!1,NodeList:!0,PaintRequestList:!1,Plugin:!1,PluginArray:!1,SVGLengthList:!1,SVGNumberList:!1,SVGPathSegList:!1,SVGPointList:!1,SVGStringList:!1,SVGTransformList:!1,SourceBufferList:!1,StyleSheetList:!0,TextTrackCueList:!1,TextTrackList:!1,TouchList:!1},p=i(h),d=0;d<p.length;d++){var g,y=p[d],m=h[y],w=u[y],b=w&&w.prototype;if(b&&(b[f]||c(b,f,v),b[l]||c(b,l,y),a[y]=v,m))for(g in r)b[g]||o(b,g,r[g],!0)}},function(t,n,e){var r=function(t){"use strict";var n=Object.prototype,e=n.hasOwnProperty,r="function"==typeof Symbol?Symbol:{},i=r.iterator||"@@iterator",o=r.asyncIterator||"@@asyncIterator",u=r.toStringTag||"@@toStringTag";function c(t,n,e){return Object.defineProperty(t,n,{value:e,enumerable:!0,configurable:!0,writable:!0}),t[n]}try{c({},"")}catch(t){c=function(t,n,e){return t[n]=e}}function a(t,n,e,r){var i=n&&n.prototype instanceof l?n:l,o=Object.create(i.prototype),u=new _(r||[]);return o._invoke=function(t,n,e){var r="suspendedStart";return function(i,o){if("executing"===r)throw new Error("Generator is already running");if("completed"===r){if("throw"===i)throw o;return O()}for(e.method=i,e.arg=o;;){var u=e.delegate;if(u){var c=b(u,e);if(c){if(c===f)continue;return c}}if("next"===e.method)e.sent=e._sent=e.arg;else if("throw"===e.method){if("suspendedStart"===r)throw r="completed",e.arg;e.dispatchException(e.arg)}else"return"===e.method&&e.abrupt("return",e.arg);r="executing";var a=s(t,n,e);if("normal"===a.type){if(r=e.done?"completed":"suspendedYield",a.arg===f)continue;return{value:a.arg,done:e.done}}"throw"===a.type&&(r="completed",e.method="throw",e.arg=a.arg)}}}(t,e,u),o}function s(t,n,e){try{return{type:"normal",arg:t.call(n,e)}}catch(t){return{type:"throw",arg:t}}}t.wrap=a;var f={};function l(){}function v(){}function h(){}var p={};p[i]=function(){return this};var d=Object.getPrototypeOf,g=d&&d(d(x([])));g&&g!==n&&e.call(g,i)&&(p=g);var y=h.prototype=l.prototype=Object.create(p);function m(t){["next","throw","return"].forEach((function(n){c(t,n,(function(t){return this._invoke(n,t)}))}))}function w(t,n){var r;this._invoke=function(i,o){function u(){return new n((function(r,u){!function r(i,o,u,c){var a=s(t[i],t,o);if("throw"!==a.type){var f=a.arg,l=f.value;return l&&"object"==typeof l&&e.call(l,"__await")?n.resolve(l.__await).then((function(t){r("next",t,u,c)}),(function(t){r("throw",t,u,c)})):n.resolve(l).then((function(t){f.value=t,u(f)}),(function(t){return r("throw",t,u,c)}))}c(a.arg)}(i,o,r,u)}))}return r=r?r.then(u,u):u()}}function b(t,n){var e=t.iterator[n.method];if(void 0===e){if(n.delegate=null,"throw"===n.method){if(t.iterator.return&&(n.method="return",n.arg=void 0,b(t,n),"throw"===n.method))return f;n.method="throw",n.arg=new TypeError("The iterator does not provide a 'throw' method")}return f}var r=s(e,t.iterator,n.arg);if("throw"===r.type)return n.method="throw",n.arg=r.arg,n.delegate=null,f;var i=r.arg;return i?i.done?(n[t.resultName]=i.value,n.next=t.nextLoc,"return"!==n.method&&(n.method="next",n.arg=void 0),n.delegate=null,f):i:(n.method="throw",n.arg=new TypeError("iterator result is not an object"),n.delegate=null,f)}function E(t){var n={tryLoc:t[0]};1 in t&&(n.catchLoc=t[1]),2 in t&&(n.finallyLoc=t[2],n.afterLoc=t[3]),this.tryEntries.push(n)}function S(t){var n=t.completion||{};n.type="normal",delete n.arg,t.completion=n}function _(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(E,this),this.reset(!0)}function x(t){if(t){var n=t[i];if(n)return n.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var r=-1,o=function n(){for(;++r<t.length;)if(e.call(t,r))return n.value=t[r],n.done=!1,n;return n.value=void 0,n.done=!0,n};return o.next=o}}return{next:O}}function O(){return{value:void 0,done:!0}}return v.prototype=y.constructor=h,h.constructor=v,v.displayName=c(h,u,"GeneratorFunction"),t.isGeneratorFunction=function(t){var n="function"==typeof t&&t.constructor;return!!n&&(n===v||"GeneratorFunction"===(n.displayName||n.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,h):(t.__proto__=h,c(t,u,"GeneratorFunction")),t.prototype=Object.create(y),t},t.awrap=function(t){return{__await:t}},m(w.prototype),w.prototype[o]=function(){return this},t.AsyncIterator=w,t.async=function(n,e,r,i,o){void 0===o&&(o=Promise);var u=new w(a(n,e,r,i),o);return t.isGeneratorFunction(e)?u:u.next().then((function(t){return t.done?t.value:u.next()}))},m(y),c(y,u,"Generator"),y[i]=function(){return this},y.toString=function(){return"[object Generator]"},t.keys=function(t){var n=[];for(var e in t)n.push(e);return n.reverse(),function e(){for(;n.length;){var r=n.pop();if(r in t)return e.value=r,e.done=!1,e}return e.done=!0,e}},t.values=x,_.prototype={constructor:_,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(S),!t)for(var n in this)"t"===n.charAt(0)&&e.call(this,n)&&!isNaN(+n.slice(1))&&(this[n]=void 0)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var n=this;function r(e,r){return u.type="throw",u.arg=t,n.next=e,r&&(n.method="next",n.arg=void 0),!!r}for(var i=this.tryEntries.length-1;i>=0;--i){var o=this.tryEntries[i],u=o.completion;if("root"===o.tryLoc)return r("end");if(o.tryLoc<=this.prev){var c=e.call(o,"catchLoc"),a=e.call(o,"finallyLoc");if(c&&a){if(this.prev<o.catchLoc)return r(o.catchLoc,!0);if(this.prev<o.finallyLoc)return r(o.finallyLoc)}else if(c){if(this.prev<o.catchLoc)return r(o.catchLoc,!0)}else{if(!a)throw new Error("try statement without catch or finally");if(this.prev<o.finallyLoc)return r(o.finallyLoc)}}}},abrupt:function(t,n){for(var r=this.tryEntries.length-1;r>=0;--r){var i=this.tryEntries[r];if(i.tryLoc<=this.prev&&e.call(i,"finallyLoc")&&this.prev<i.finallyLoc){var o=i;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=n&&n<=o.finallyLoc&&(o=null);var u=o?o.completion:{};return u.type=t,u.arg=n,o?(this.method="next",this.next=o.finallyLoc,f):this.complete(u)},complete:function(t,n){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&n&&(this.next=n),f},finish:function(t){for(var n=this.tryEntries.length-1;n>=0;--n){var e=this.tryEntries[n];if(e.finallyLoc===t)return this.complete(e.completion,e.afterLoc),S(e),f}},catch:function(t){for(var n=this.tryEntries.length-1;n>=0;--n){var e=this.tryEntries[n];if(e.tryLoc===t){var r=e.completion;if("throw"===r.type){var i=r.arg;S(e)}return i}}throw new Error("illegal catch attempt")},delegateYield:function(t,n,e){return this.delegate={iterator:x(t),resultName:n,nextLoc:e},"next"===this.method&&(this.arg=void 0),f}},t}(t.exports);try{regeneratorRuntime=r}catch(t){Function("r","regeneratorRuntime = r")(r)}},function(t,n,e){e(296),t.exports=e(119).global},function(t,n,e){var r=e(297);r(r.G,{global:e(85)})},function(t,n,e){var r=e(85),i=e(119),o=e(298),u=e(300),c=e(307),a=function(t,n,e){var s,f,l,v=t&a.F,h=t&a.G,p=t&a.S,d=t&a.P,g=t&a.B,y=t&a.W,m=h?i:i[n]||(i[n]={}),w=m.prototype,b=h?r:p?r[n]:(r[n]||{}).prototype;for(s in h&&(e=n),e)(f=!v&&b&&void 0!==b[s])&&c(m,s)||(l=f?b[s]:e[s],m[s]=h&&"function"!=typeof b[s]?e[s]:g&&f?o(l,r):y&&b[s]==l?function(t){var n=function(n,e,r){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(n);case 2:return new t(n,e)}return new t(n,e,r)}return t.apply(this,arguments)};return n.prototype=t.prototype,n}(l):d&&"function"==typeof l?o(Function.call,l):l,d&&((m.virtual||(m.virtual={}))[s]=l,t&a.R&&w&&!w[s]&&u(w,s,l)))};a.F=1,a.G=2,a.S=4,a.P=8,a.B=16,a.W=32,a.U=64,a.R=128,t.exports=a},function(t,n,e){var r=e(299);t.exports=function(t,n,e){if(r(t),void 0===n)return t;switch(e){case 1:return function(e){return t.call(n,e)};case 2:return function(e,r){return t.call(n,e,r)};case 3:return function(e,r,i){return t.call(n,e,r,i)}}return function(){return t.apply(n,arguments)}}},function(t,n){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t}},function(t,n,e){var r=e(301),i=e(306);t.exports=e(87)?function(t,n,e){return r.f(t,n,i(1,e))}:function(t,n,e){return t[n]=e,t}},function(t,n,e){var r=e(302),i=e(303),o=e(305),u=Object.defineProperty;n.f=e(87)?Object.defineProperty:function(t,n,e){if(r(t),n=o(n,!0),r(e),i)try{return u(t,n,e)}catch(t){}if("get"in e||"set"in e)throw TypeError("Accessors not supported!");return"value"in e&&(t[n]=e.value),t}},function(t,n,e){var r=e(86);t.exports=function(t){if(!r(t))throw TypeError(t+" is not an object!");return t}},function(t,n,e){t.exports=!e(87)&&!e(120)((function(){return 7!=Object.defineProperty(e(304)("div"),"a",{get:function(){return 7}}).a}))},function(t,n,e){var r=e(86),i=e(85).document,o=r(i)&&r(i.createElement);t.exports=function(t){return o?i.createElement(t):{}}},function(t,n,e){var r=e(86);t.exports=function(t,n){if(!r(t))return t;var e,i;if(n&&"function"==typeof(e=t.toString)&&!r(i=e.call(t)))return i;if("function"==typeof(e=t.valueOf)&&!r(i=e.call(t)))return i;if(!n&&"function"==typeof(e=t.toString)&&!r(i=e.call(t)))return i;throw TypeError("Can't convert object to primitive value")}},function(t,n){t.exports=function(t,n){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:n}}},function(t,n){var e={}.hasOwnProperty;t.exports=function(t,n){return e.call(t,n)}},function(t,n){function r(t){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function i(t,n){var e;if("undefined"==typeof Symbol||null==t[Symbol.iterator]){if(Array.isArray(t)||(e=function(t,n){if(!t)return;if("string"==typeof t)return o(t,n);var e=Object.prototype.toString.call(t).slice(8,-1);"Object"===e&&t.constructor&&(e=t.constructor.name);if("Map"===e||"Set"===e)return Array.from(t);if("Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e))return o(t,n)}(t))||n&&t&&"number"==typeof t.length){e&&(t=e);var r=0,i=function(){};return{s:i,n:function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function(t){function n(n){return t.apply(this,arguments)}return n.toString=function(){return t.toString()},n}((function(t){throw t})),f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var u,c=!0,a=!1;return{s:function(){e=t[Symbol.iterator]()},n:function(){var t=e.next();return c=t.done,t},e:function(t){function n(n){return t.apply(this,arguments)}return n.toString=function(){return t.toString()},n}((function(t){a=!0,u=t})),f:function(){try{c||null==e.return||e.return()}finally{if(a)throw u}}}}function o(t,n){(null==n||n>t.length)&&(n=t.length);for(var e=0,r=new Array(n);e<n;e++)r[e]=t[e];return r}function u(t,n,e,r,i,o,u){try{var c=t[o](u),a=c.value}catch(t){return void e(t)}c.done?n(a):Promise.resolve(a).then(r,i)}function c(t,n){if(!(t instanceof n))throw new TypeError("Cannot call a class as a function")}function a(t,n){for(var e=0;e<n.length;e++){var r=n[e];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function s(t,n){return!n||"object"!==r(n)&&"function"!=typeof n?function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t):n}function f(t){var n="function"==typeof Map?new Map:void 0;return(f=function(t){if(null===t||(e=t,-1===Function.toString.call(e).indexOf("[native code]")))return t;var e;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==n){if(n.has(t))return n.get(t);n.set(t,r)}function r(){return l(t,arguments,p(this).constructor)}return r.prototype=Object.create(t.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),h(r,t)})(t)}function l(t,n,e){return(l=v()?Reflect.construct:function(t,n,e){var r=[null];r.push.apply(r,n);var i=new(Function.bind.apply(t,r));return e&&h(i,e.prototype),i}).apply(null,arguments)}function v(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function h(t,n){return(h=Object.setPrototypeOf||function(t,n){return t.__proto__=n,t})(t,n)}function p(t){return(p=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}window.EV=window.EV||{},function(t){"use strict";var n,r,o,l,d,g=new M,y=new M,m=!1,w=0,b=0,E={};function S(){r&&(n.disableCookies||_("ev_sid")==r||(x("ev_sid",r,10),k("ev_sid",r,0,"localStorage"),l=l+"&ev_sid="+r)),o&&(n.disableCookies||_("ev_did")==o||(x("ev_did",o,10),k("ev_did",o,0,"localStorage"),l=l+"&ev_did="+o))}function _(t){var n=document.cookie;n=n.split("; ");for(var e={},r=0;r<n.length;r++){var i=n[r].split("=");e[i[0]]=i[1]}return e[t]?e[t]:""}window.addEventListener("ev.widgets.dwelltime.enabled",(function(n){n.detail.dwellTimeTrackingEnabled&&(m=!0,b=n.detail.maxDwellTimeRequests||3,setTimeout((function(){t.Em.initDwellTimeRequests(E.authorizeData)}),1e3))})),window.customElements.define("ev-engagement",function(e){!function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(n&&n.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),n&&h(t,n)}(w,e);var r,o,f,l,d,g,y,m=(r=w,o=v(),function(){var t,n=p(r);if(o){var e=p(this).constructor;t=Reflect.construct(n,arguments,e)}else t=n.apply(this,arguments);return s(this,t)});function w(){return c(this,w),m.apply(this,arguments)}return f=w,(l=[{key:"registerCloseModal",value:function(){var n=this;"notifier"===this.widgetType?(this.allowBackgroundClickClosing()&&(window.onclick=function(t){"ev-em-modal-backdrop"===t.target.id&&n.closeModal()}),t.Em.on(t.Em.Event.NOTIFIER_CLOSE,this.closeModal.bind(this))):t.Em.on("ev.em.paywall.close",this.closeModal.bind(this))}},{key:"allowBackgroundClickClosing",value:function(){return null==this.getAttribute("modal-backdrop")||"false"!==this.getAttribute("modal-backdrop")}},{key:"getGroupName",value:function(){return this.getAttribute("group-name")}},{key:"closeModal",value:function(){null!=document.querySelector("#engagement-top")&&document.querySelector("#engagement-top").parentElement.remove(),document.body.style.overflow=null}},{key:"setModalContent",value:function(){var t=document.createElement("div");document.body.prepend(t),document.body.style.overflow="hidden",t.innerHTML='\n                <div id="engagement-top" class="ev-em-modals ev-em-modal">\n                    <div class="ev-em-modal-dialog ev-em-modal-'.concat(this.widgetResponse.modalSize,'">\n                        <div class="ev-em-modal-content">\n                            <div class="ev widget-container ev-engagement">\n                                <div class="ev-').concat(this.widgetType,'-template">\n                                    ').concat(this.widgetResponse.content,'\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <div id="ev-em-modal-backdrop" class="ev-em-modal-backdrop"></div>\n                </div>'),this.renderContent()}},{key:"setInlineContent",value:function(){this.innerHTML='\n                        <div class="ev widget-container ev-engagement">\n                            <div class="ev-'.concat(this.widgetType,'-template">\n                                ').concat(this.widgetResponse.content,"\n                            </div>\n                        </div>"),this.renderContent()}},{key:"renderContent",value:function(){if(t.Widgets){var n=this;t.Widgets.asyncInit().then((function(){console.log("EV widgets initialized from ev-em library"),n.publishRenderedEvents()}))}else this.publishRenderedEvents();for(var e=document.querySelectorAll("script[data-ev-engagement]"),r=0;r<e.length;r++){var i=e[r],o=document.createElement("script");o.innerHTML=i.text,document.body.appendChild(o)}}},{key:"publishRenderedEvents",value:function(){var n={ev_sid:this.ev_sid,template:this.widgetResponse},e="notifier"===this.widgetType?t.Em.Event.NOTIFIER_MODAL_RENDERED:t.Em.Event.PAYWALL_MODAL_RENDERED;t.Em.publish(e,n)}},{key:"connectedCallback",value:function(){window.addEventListener("ev.ad.authorize",this.internalWidgetDisplay.bind(this)),window.addEventListener("ev.ad.dwelltime.check",this.dwellTimeCheckEvents.bind(this))}},{key:"internalWidgetDisplay",value:(g=regeneratorRuntime.mark((function n(e){var r,i,o,u,c,a,s,f;return regeneratorRuntime.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:if(!this.blockDwellTimeRequests){n.next=2;break}return n.abrupt("return");case 2:if(r=e.detail,this.ev_sid=r.sessionId||r.restoredSessionId,i=r.deviceId||_("ev_did")||I("ev_did","localStorage"),o=r.hasOwnProperty("loggedOut")&&!1===r.loggedOut,(u=this.getMeter(r))||(u={count:null,max:null}),"ALLOW_ACCESS"!==r.result){n.next=15;break}return a=r.dwellTimeInterval,n.next=12,this.getNotifierWidget(u.count,u.max,r.segments||[],this.ev_sid,i,this.getGroupName(),a,o);case 12:c=n.sent,n.next=20;break;case 15:return this.blockDwellTimeRequests=!0,s=r.requireEntitlement?"REQUIRE_LOGIN_WITH_ENTITLEMENT":"REQUIRE_LOGIN"==r.result?"REQUIRE_LOGIN":"REQUIRE_ENTITLEMENT",n.next=19,this.getPaywallWidget(u.count,u.max,s,r.segments||[],this.ev_sid,i,this.getGroupName(),o);case 19:c=n.sent;case 20:c&&(this.widgetResponse=c,f="notifier"===this.widgetType?t.Em.Event.NOTIFIER_MODAL_RENDERED:t.Em.Event.PAYWALL_MODAL_RENDERED,t.Em.on(f,this.initLinkTracking.bind(this)),c.autoRender&&this.displayEngagement());case 21:case"end":return n.stop()}}),n,this)})),y=function(){var t=this,n=arguments;return new Promise((function(e,r){var i=g.apply(t,n);function o(t){u(i,e,r,o,c,"next",t)}function c(t){u(i,e,r,o,c,"throw",t)}o(void 0)}))},function(t){return y.apply(this,arguments)})},{key:"getMeter",value:function(t){return t.activeMeter||t.exceededMeter||t.offeredMeter}},{key:"displayEngagement",value:function(){if(!this.notifierDisplayed){this.trackDwellTime||(this.notifierDisplayed=!0),null!=this.widgetResponse.dwellTime&&this.widgetResponse.dwellTime>0&&this.closeModal();var n="notifier"===this.widgetType?t.Em.Event.NOTIFIER_OPENED:t.Em.Event.PAYWALL_OPENED;t.Em.publish(n,this.widgetResponse),t.Em.publish("ev.em.open.modal.".concat(this.widgetType,".").concat(this.widgetResponse.displayOn)),this.escapeSessionPlaceholders(),this.widgetResponse.modal?(this.setModalContent(),this.registerCloseModal()):this.setInlineContent()}}},{key:"escapeSessionPlaceholders",value:function(){var t=new RegExp("({{properties\\..+}})","g");this.widgetResponse.content=this.widgetResponse.content.replaceAll(t,"");var n=new RegExp("({{attributes\\..+}})","g");this.widgetResponse.content=this.widgetResponse.content.replaceAll(n,"")}},{key:"getPaywallWidget",value:function(e,r,i,o,u,c,a,s){var f=this,l="".concat(n.url,"/widgets/templates/paywall?ev_sid=").concat(u,"&ev_did=").concat(c),v={count:e,total:r,displayOn:i,segments:o,groupName:a,loggedIn:s,brand:t.Em.brand};return this.post(l,v).then((function(t){return t&&(f.widgetType="paywall",f.handleManualRenderEvents(t,"paywall")),t}))}},{key:"getNotifierWidget",value:function(e,r,i,o,u,c,a,s){var f=this,l="".concat(n.url,"/widgets/templates/notifier?ev_sid=").concat(o,"&ev_did=").concat(u),v={count:e,total:r,segments:i,dwellTime:a,groupName:c,loggedIn:s,brand:t.Em.brand};return this.post(l,v).then((function(t){return t&&(f.widgetType="notifier",f.handleManualRenderEvents(t,"notifier")),t}))}},{key:"post",value:function(t,n){return fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}).then((function(t){return 200===t.status?t.json():null}))}},{key:"handleManualRenderEvents",value:function(n,e){if(n.hasOwnProperty("autoRender")&&!1===n.autoRender){var r="notifier"===e?t.Em.Event.NOTIFIER_SHOW_CTA:t.Em.Event.PAYWALL_SHOW_CTA;t.Em.on(r,this.displayEngagement.bind(this))}var i="notifier"===e?t.Em.Event.NOTIFIER_RENDER_READY:t.Em.Event.PAYWALL_RENDER_READY;t.Em.publish(i,n)}},{key:"initLinkTracking",value:function(t){var n,e=t.detail,r=i(document.querySelector(".ev-engagement").querySelectorAll("a[href]"));try{for(r.s();!(n=r.n()).done;){var o=n.value;o.dataset.widgetuid=e.template.uid,o.dataset.sessionid=e.ev_sid,o.addEventListener("click",this.trackLink.bind(this))}}catch(t){r.e(t)}finally{r.f()}}},{key:"trackLink",value:function(t){t.preventDefault();var n=t.target;"a"!==n.tagName.toLowerCase()&&(n=n.parentElement);var e=n.innerText,r=n.href,i=n.dataset.widgetuid,o=n.dataset.sessionid;this.storeLinkTracking(o,i,e,r).then((function(t){window.location=r})).catch((function(t){console.log(t),window.location=r}))}},{key:"storeLinkTracking",value:function(t,e,r,i){var o="".concat(n.url,"/widgets/templates/linkTracking?ev_sid=").concat(t),u={templateUid:e,linkName:r,linkValue:i};return this.post(o,u)}},{key:"dwellTimeCheckEvents",value:function(){var t=this,n={dwellTimeTrackingEnabled:!1};this.checkDwellTimeWidgetsActive().then((function(e){e?(t.trackDwellTime=!0,n.dwellTimeTrackingEnabled=!0,n.maxDwellTimeRequests=e.maxDwellTimeRequests||3):console.warn("No dwell time widgets found"),t.sendDwellTimeEnabledEvent(n)})).catch((function(t){console.error("Error checking dwell time widgets:",t)}))}},{key:"checkDwellTimeWidgetsActive",value:function(){var t="".concat(n.url,"/widgets/templates/dwellTime?groupName=").concat(this.getGroupName());return fetch(t,{headers:{"Content-Type":"application/json"}}).then((function(t){return 200===t.status?t.json():null}))}},{key:"sendDwellTimeEnabledEvent",value:function(t){var n;"function"==typeof CustomEvent?n=new CustomEvent("ev.widgets.dwelltime.enabled",{detail:t}):(n=document.createEvent("CustomEvent")).initCustomEvent("ev.widgets.dwelltime.enabled",!1,!1,{detail:t}),window.dispatchEvent(n)}}])&&a(f.prototype,l),d&&a(f,d),w}(f(HTMLElement))),t.Em={Event:{PAYWALL_MODAL_RENDERED:"ev.em.paywall.modal.rendered",NOTIFIER_MODAL_RENDERED:"ev.em.notifier.modal.rendered",PAYWALL_OPENED:"ev.em.paywall.opened",NOTIFIER_OPENED:"ev.em.notifier.opened",PAYWALL_SHOW_CTA:"ev.em.paywall.showCTA",NOTIFIER_SHOW_CTA:"ev.em.notifier.showCTA",PAYWALL_RENDER_READY:"ev.em.paywall.render.ready",NOTIFIER_RENDER_READY:"ev.em.notifier.render.ready",NOTIFIER_CLOSE:"ev.em.notifier.close"},on:function(t,n){window.addEventListener(t,n)},publish:function(t,n){var e;"function"==typeof CustomEvent?e=new CustomEvent(t,{detail:n}):(e=document.createEvent("CustomEvent")).initCustomEvent(t,!1,!1,{detail:n}),window.dispatchEvent(e)},init:function(t){if(!t.url)throw"Configuration must specify the url property!";t.hasOwnProperty("brand")&&(this.brand=t.brand),t.hasOwnProperty("disableCookies")&&(this.disableCookies=t.disableCookies),n=t},getAuthResponse:function(){return g.promise},getSegmentResponse:function(){return y.promise},authorize:function(e,i,u){t.Em.assert(e,"Parameters should not be empty!"),t.Em.assert(i,"Success callback should not be empty!"),t.Em.assert(u,"Error callback should not be empty!");var c=P(e),a="",s="",f="";l=c,-1===c.indexOf("referer")&&document.referrer&&(c+="&referer="+encodeURIComponent(document.referrer)),-1===c.indexOf("title")&&document.title&&(c+="&title="+encodeURIComponent(document.title)),-1===c.indexOf("article_url")&&window.location.href&&(c+="&article_url="+encodeURIComponent(window.location.href)),n.brand?c+="&brand="+encodeURIComponent(n.brand):e.site&&(c+="&brand="+encodeURIComponent(e.site)),!n.disableCookies&&O("ev_sid")?(s="&ev_sid="+_("ev_sid"),k("ev_sid",_("ev_sid"),0,"localStorage")):!n.disableCookies&&A("ev_sid")&&(n.meterHD?!0===n.meterHD&&(x("ev_sid",I("ev_sid","localStorage"),10),s="&ev_sid="+I("ev_sid","localStorage"),n.meterHD):x("ev_sid",I("ev_sid","localStorage"),10)),!n.disableCookies&&O("ev_did")?(f="&ev_did="+_("ev_did"),k("ev_did",_("ev_did"),0,"localStorage")):!n.disableCookies&&A("ev_did")&&(n.meterHD?!0===n.meterHD&&(x("ev_did",I("ev_did","localStorage"),10),f="&ev_did="+I("ev_did","localStorage")):x("ev_did",I("ev_did","localStorage"),10)),""!==_("ev_ss")&&(a+="&ev_ss="+_("ev_ss"));var v=R("/authorize/json",c=c+(a=a==="&ev_ss="+_("ev_ss")?"&ev_ss="+_("ev_ss"):"&ev_ss=")+(s=s==="&ev_sid="+_("ev_sid")?"&ev_sid="+_("ev_sid"):"&ev_sid=")+(f=f==="&ev_did="+_("ev_did")?"&ev_did="+_("ev_did"):"&ev_did=")),h=new XMLHttpRequest;h.open("GET",v,!0),h.withCredentials=!0,h.onload=function(){if(h.status>=200&&h.status<400){var n=JSON.parse(h.responseText);g.resolve(n),E.authorizeData=n,n.sessionKeys?(n.sessionKeys.ev_sid&&(r=n.sessionKeys.ev_sid,S()),n.sessionKeys.ev_did&&(o=n.sessionKeys.ev_did,n.deviceId=n.sessionKeys.ev_did,S())):n.deviceId=_("ev_did"),t.Em.paywallAndNotifierEvents(n),"REQUIRE_LOGIN"===n.result&&t.Event&&(""!==_("ev_ss")&&t.Event.publish("session.cleanup","Session has expired"),t.Event.publish("login.required","Login is required")),"ALLOW_ACCESS"!=n.result&&t.Em.hideMeteredContent(),i(n)}else u&&u(h.status,h.responseText)},h.onerror=function(t){t?u(t):u(0,"unknown connection error")},h.send()},initDwellTimeRequests:function(n){var e=window.setInterval((function(){if(!document.hidden){var r=30*w+30;n.dwellTimeInterval=r,t.Em.paywallAndNotifierEvents(n),w++}w==b&&clearInterval(e)}),3e4)},paywallAndNotifierEvents:function(t){function n(t){var n;"function"==typeof CustomEvent?n=new CustomEvent("ev.ad.authorize",{detail:t}):(n=document.createEvent("CustomEvent")).initCustomEvent("ev.ad.authorize",!1,!1,t),window.dispatchEvent(n)}"ALLOW_ACCESS"===t.result&&function(){if(m)return;var t;"function"==typeof CustomEvent?t=new CustomEvent("ev.ad.dwelltime.check"):(t=document.createEvent("CustomEvent")).initCustomEvent("ev.ad.dwelltime.check",!1,!1,{});window.dispatchEvent(t)}(),n(t),window.addEventListener("ev.widgets.paywall.load",(function(){n(t)})),window.addEventListener("ev.widgets.notifier.load",(function(){n(t)}))},pretty_print:function(n){var e=JSON.stringify(n,null,3).replace(/&/g,"&amp;").replace(/\\"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm,t.Em.replacer);return e="<pre>"+e+"</pre>"},replacer:function(t,n,e,r,i){var o=n||"";return e&&(o=o+"<span class=json-key>"+e.replace(/[": ]/g,"")+"</span>: "),r&&(o=o+('"'==r[0]?"<span class=json-string>":"<span class=json-value>")+r+"</span>"),o+(i||"")},segment:function(n,r,i){t.Em.assert(n,"Parameters should not be empty!"),t.Em.assert(r,"Success callback should not be empty!"),t.Em.assert(i,"Error callback should not be empty!");var o=R("/segment",P(n)),u=new XMLHttpRequest;u.open("GET",o,!0),u.withCredentials=!0,u.onload=function(){if(u.status>=200&&u.status<400){var t=JSON.parse(u.responseText);y.resolve(t),r(t)}else i&&i(u.status,u.responseText)},u.onerror=function(){e?i(e):i(0,"unknown connection error")},u.send()},assert:function(t,n){if(!t){if(n=n||"Assertion failed","undefined"!=typeof Error)throw new Error(n);throw n}},getUrl:function(){return n.url},showMeteredContent:function(){var t=document.getElementsByClassName("ev-meter-content");[].forEach.call(t,(function(t){t.style.display="block"}))},hideMeteredContent:function(){var t=document.getElementsByClassName("ev-meter-content");[].forEach.call(t,(function(t){t.style.display="none"}))}},setTimeout((function(){S()}),4e3);function x(t,e,r){if(!n.sidCookieDomain)throw new Error("Please specify sidCookieDomain in the config!",!0);var i=new Date;i.setDate(i.getDate()+1460),(d=T())&&d<13?(document.cookie=t+"="+escape(e)+";time="+new Date+";expires="+i.toUTCString()+";path=/; domain="+n.sidCookieDomain+"; Secure",console.log(t+"="+escape(e)+";time="+new Date+";expires="+i.toUTCString()+";path=/; domain="+n.sidCookieDomain+"; Secure")):(document.cookie=t+"="+escape(e)+";time="+new Date+";expires="+i.toUTCString()+";path=/; domain="+n.sidCookieDomain+";SameSite=None; Secure",console.log(t+"="+escape(e)+";time="+new Date+";expires="+i.toUTCString()+";path=/; domain="+n.sidCookieDomain+";SameSite=None; Secure"))}function O(t){if(""!==_(t)&&"undefined"!==_(t))return _(t)}function A(t){if(""!==I(t,"localStorage")&&"undefined"!==I(t,"localStorage"))return I(t,"localStorage")}function T(){var t,n=navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);return null!=n&&(t=[parseInt(n[1],10),parseInt(n[2],10),parseInt(n[3]||0,10)],parseFloat(t.join(".")))}function I(t,n){var e=document.cookie.indexOf(t+"=");if("localStorage"==n){if("undefined"==typeof localStorage)return document.cookie.length>0&&-1!==e?getCookieSubstring(e,t):"";try{return localStorage.getItem(t)}catch(t){return console.warn("Could not retrieve the cookie in local storage - maybe the browser's running on an environment with restricted access to localStorage?"),"undefined"}}if("sessionStorage"==n){if("undefined"==typeof sessionStorage)return e=document.cookie.indexOf(t+"="),document.cookie.length>0&&-1!==e?getCookieSubstring(e,t):"";console.log(sessionStorage.getItem(t));try{return sessionStorage.getItem(t)}catch(t){return console.warn("Could not retrieve the cookie in session storage - maybe the browser's running on an environment with restricted access to sessionStorage?"),"undefined"}}}function k(t,n,e,r){var i=new Date;if("localStorage"==r)if(i.setDate(i.getDate()+e),"undefined"!=typeof localStorage)try{localStorage.setItem(t,n)}catch(t){console.warn("Could not store the cookie in local storage - maybe the browser's running on an environment with restricted access to localStorage?")}else d=T(),document.cookie=d&&d<13?t+"="+escape(n)+(null===e?"":";time="+new Date+";expires="+i.toUTCString())+"; Secure":t+"="+escape(n)+(null===e?"":";time="+new Date+";expires="+i.toUTCString())+";SameSite=None; Secure";if("sessionStorage"==r)if(i.setDate(i.getDate()+e),"undefined"!=typeof sessionStorage)try{sessionStorage.setItem(t,n)}catch(t){console.warn("Could not store the cookie in session storage - maybe the browser's running on an environment with restricted access to sessionStorage?")}else d=T(),document.cookie=d&&d<13?t+"="+escape(n)+(null===e?"":";time="+new Date+";expires="+i.toUTCString())+"; Secure":t+"="+escape(n)+(null===e?"":";time="+new Date+";expires="+i.toUTCString())+";SameSite=None; Secure"}function P(t){var n="";for(var e in t=JSON.parse(t))""!==n&&(n+="&"),n+=e+"="+encodeURIComponent(t[e]);return n}function R(t,e){!function(){if(!n)throw"Evolok Metering library is not initialised!"}();var r=n.url;if(!r)throw new Error("Evolok Metering host url is not configured!");return"/"===r.charAt(r.length-1)&&"/"===t.charAt(0)?r+=t.substring(1,t.length):r+=t,r=e?r+"?"+e:r}function M(){var t=this;this.promise=new Promise((function(n,e){t.reject=e,t.resolve=n}))}}(window.EV)}]);

}



////////////////////////////////////////////////////////////////////////////////
// EVOLOK NOTIFIERS ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*
 *  Module:  Evolok Init Scripts - Notifiers/Modals
 *
 *  Launch:  06.07.18
 *
 */

if( typeof send_notifier_event != 'function' ){ //send ga events for all users => anonymous/logged in => upon accepting cookies/policies
    function send_notifier_event(data)
    {
        // EXAMPLE INPUT:
        /*
      {
        'ge_action' : 'The What',
        'ge_category' : 'High Level - Event Name',
        'ge_label' : 'Descriptor/Values being tracked'
        'ge_index' : INT/index/counter => would allow you to track which element out of many/locations
        'ge_noninteraction' : Boolean => If empty/false(default) it would go again daily numbers/bounce rates("Intentional or NOT")
      }
      */
        //Wrap event tracking call to prevent premature termination of this function.
        try{
            _gaq.push(['_trackEvent', data['ge_category'], data['ge_action'], data['ge_label'], data['ge_index'], data['ge_noninteraction']]);
            //console.log('trackevent: '+data['ge_category']+' - '+data['ge_action']+' - '+data['ge_label']+' - '+data['ge_index']+' - '+data['ge_noninteraction']);
        } catch(err) {}
    }
}

$(document).ready(function(){

    $(document).on('click', '.jQ_allow', function(){
        $(".adblk-todo-wrapper").css({"display" : "block"});
    });

    $(document).on('click', '.jQ_close', function(){
        $(".adblk-todo-wrapper").css({"display" : "none"});
    });

    $(document).on('click', '.jQ_buy', function(){
        location.assign("//" + document.domain + "/subscriptions/index.html");
    });

    if(typeof window.EV !== 'undefined') {
        if(typeof EV.Event !== 'undefined'){
            EV.Event.on("ev.notifier.opened", function(){
                //Javascript functionality
                //console.log("::: AD WIDGET VISIBLE :::");

                //run until bootstrap modal, "notifier", is visible - get heights, recalculate, reset modal position for all devices
                /*get_ev_modal_ht = setInterval(function(){

              var notifier_ht = $(".modal-content").height();
              var notifier_half_ht = (notifier_ht / 2);

              if( $("body.ev-modals").length > 0 ){
                 var vp_ht = $(window).height();
                 var vp = (vp_ht / 2);
                 var modal_pos = (vp - notifier_half_ht);
                 var modal_pos_reset = (modal_pos-20);

                 $("body.ev-modals .modal").css({"top" : modal_pos_reset+"px"});

              }

              clearInterval(get_ev_modal_ht);

          }, 300);*/

                var notifier_segment;

                get_notifier_segment = setInterval(function(){

                    if( $(".offer-wrapper").length > 0 ){
                        notifier_segment = $(".offer-wrapper").data("segments");

                        check_send_ga_loaded = setInterval(function(){
                            if( typeof send_notifier_event == 'function' ){
                                var onload_notifier_data = {
                                    'ge_action' : 'AD Widget - Notifier Viewed - ' + 'Segment: ' + notifier_segment,
                                    'ge_category' : 'EV Subscriptions Notifier',
                                    'ge_label' : 'Viewed URL: ' + window.location.href,
                                    'ge_index' : null,
                                    'ge_noninteraction' : true
                                };
                                send_notifier_event(onload_notifier_data);
                                createCookie('notifierSegment',notifier_segment,'365');

                                clearInterval(check_send_ga_loaded);
                            } //if func() exists check
                        }, 250); //2.5 Second Intervals

                        clearInterval(get_notifier_segment);
                    }

                }, 500);

            });
        }
    }

    /* ADBLOCK AD WIDGET LOGIC */
    $(document).on('focus', '#email', function(){
        $(this).parents('.adb-clear-input form').addClass('focused');
        //$(".agree_container label, .agree_container input").show('fast');
        //$(".adb_agree_container label, .adb_agree_container input").css({ "display" : "inline !important" });
        $(".adb_agree_container").css({ "display" : "inline-block" });
    });

    $(document).on('blur', '#email', function(){
        if( $(this).val() == "" ){
            $(this).parents('.adb-clear-input form').removeClass('focused');
        }

        //$(".agree_container label, .agree_container input").hide('fast');
    });

    if(typeof window.EV !== 'undefined') {
        if(typeof EV.Event !== 'undefined'){
            EV.Event.on("ev.notifier.opened", function(){
                //Javascript functionality
                //console.log("::: AD WIDGET VISIBLE :::");
                $(".back-to-top").css({ "z-index" : "0" });

                get_modal_counts = setInterval(function(){

                    if( $(".offer-wrapper").length > 0 ){
                        var cur_count = parseInt($(".current-posts").html());
                        var total_count = $(".total-posts").html();
                        if( typeof total_count != "undefined" ){
                            var nLimit = parseInt(total_count.replace("*", ""));
                        }

                        if( cur_count > nLimit ){

                            $(".current-posts").html(nLimit);

                            get_ev_modal_ht = setInterval(function(){

                                var notifier_ht = $(".modal-content").height();
                                var notifier_half_ht = (notifier_ht / 2);

                                if( $("body.ev-modals").length > 0 ){

                                    var vp_ht = $(window).height();
                                    var vp = (vp_ht / 2);
                                    var modal_pos = (vp - notifier_half_ht);
                                    var modal_pos_reset = (modal_pos-20);

                                    $("body.ev-modals .modal").css({"top" : modal_pos_reset+"px"});

                                    /*$(document).mouseup(function(e)
                                {
                                    var container = $(".modal");
                                    //console.info("THIS IS HAPPENING:::: ");

                                    // if the target of the click isn't the container nor a descendant of the container
                                    if (!container.is(e.target) && container.has(e.target).length === 0)
                                    {
                                        //container.hide();
                                        EV.Event.publish('ev.notifier.close');
                                        $(".ev-modals .modal-backdrop").hide();
                                        $(".adb-overlay").remove();
                                    }
                                });*/

                                }

                                clearInterval(get_ev_modal_ht);

                            }, 300);


                            $("body").prepend('<div class="adb-overlay"></div>');

                            // Blur text if exists
                            $('.article-body').addClass('blur-text');
                            $('.video-body-text').addClass('blur-text');
                            $('body.polls').addClass('blur-text');
                            $('body.maps').addClass('blur-text');

                            $(".modal-header-markets .close").hide();
                            $(".adblk-todo span a").last().hide();

                        }else{

                            get_ev_modal_ht = setInterval(function(){

                                var notifier_ht = $(".modal-content").height();
                                var notifier_half_ht = (notifier_ht / 2);

                                if( $("body.ev-modals").length > 0 ){
                                    var vp_ht = $(window).height();
                                    var vp = (vp_ht / 2);
                                    var modal_pos = (vp - notifier_half_ht);
                                    var modal_pos_reset = (modal_pos-20);

                                    $("body.ev-modals .modal").css({"top" : modal_pos_reset+"px"});

                                    $("body.ev-modals .modal").css({ "width" : "100% !important", "height" : "100% !important" });

                                    $(document).mouseup(function(e)
                                    {
                                        var container = $(".modal");
                                        //console.info("THIS IS HAPPENING:::: ");

                                        // if the target of the click isn't the container nor a descendant of the container
                                        if (!container.is(e.target) && container.has(e.target).length === 0)
                                        {
                                            //container.hide();
                                            EV.Event.publish('ev.notifier.close');
                                            $(".ev-modals .modal-backdrop").hide();
                                        }
                                    });

                                }

                                clearInterval(get_ev_modal_ht);

                            }, 300);

                        } //end else

                    }

                    clearInterval(get_modal_counts);

                }, 300);

            });
        }
    }


    //var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)notifierSegment\s*\=\s*([^;]*).*$)|^.*$/, "$1");

});

//IF FUNCTION DOESN'T EXIST/NOT LOADED/ETC...
if( typeof rcmg_api_call != 'function' ){ //fire api call and update DB for existing users(logged in/anonymous on log in)
    function rcmg_api_call(method, post_data, callback) {

        var now_time = new Date().getTime();

        $.ajax({
            url: window.location.protocol + "//util.realclearpolitics.com/rcmg_users_v2/api.php?cache_bust="+now_time+"&method="+method+"&jsoncallback=?",
            type: "POST",
            crossDomain: true,
            data: post_data,
            success: callback,
            statusCode: {
                500: function() {
                    console.log('500 error');
                    // Report this 500 error for diagnostics
                    $.getJSON(window.location.protocol + "//util.realclearpolitics.com/rcmg_users_v2/error_500.php?method="+method, function(response) {
                        console.log('-------- RCMG API ERROR --------');
                    });
                }.bind(method)
            }
        });
    }
}

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}


////////////////////////////////////////////////////////////////////////////////
// GDPR REGULAIONS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

if( fire_gdpr_consent ) {

    /**
     * Load cookie consetn bot script
     */
    // try{
    //     var cookieScript    = document.createElement("script");
    //     cookieScript.type   = "text/javascript";
    //     cookieScript.id     = "cookiebot";
    //     cookieScript.src    = "https://consent.cookiebot.com/uc.js";
    //     cookieScript.setAttribute("data-cbid", "6dcaec77-f01e-45d9-a827-dce183129d73");
    //     cookieScript.setAttribute("data-blockingmode", "auto");
    //     document.head.appendChild(cookieScript);
    // }catch(e){
    //     console.log("cookieScript failed to load", e);
    // }

    /*
    * TITLE:      GDPR - COOKIECONSENT
    * LAUNCHED:   5/25/18
    * AUTHOR:     BROCK
    */

    if( typeof send_cc_event != 'function' ){ //send ga events for all users => anonymous/logged in => upon accepting cookies/policies
        function send_cc_event(data)
        {
            // EXAMPLE INPUT:
            /*
        {
          'ge_action' : 'The What',
          'ge_category' : 'High Level - Event Name',
          'ge_label' : 'Descriptor/Values being tracked'
          'ge_index' : INT/index/counter => would allow you to track which element out of many/locations
          'ge_noninteraction' : Boolean => If empty/false(default) it would go again daily numbers/bounce rates("Intentional or NOT")
        }
        */
            //Wrap event tracking call to prevent premature termination of this function.
            try{
                _gaq.push(['_trackEvent', data['ge_category'], data['ge_action'], data['ge_label'], data['ge_index'], data['ge_noninteraction']]);
                //console.log('trackevent: '+data['ge_category']+' - '+data['ge_action']+' - '+data['ge_label']);
            } catch(err) {}
        }
    }

    function updateConsent(gdpr_consent_details){

        var user_consent_details = readCookie('gdpr_consent_details');
    
        //user exists and logged in....
        rcmg_api_call('update_user_cookieconsent', {
            guid  : readCookie('rcmg_guid'),
            token : readCookie('rcmg_token'),
            cookieconsent : readCookie('rc_tos_consent'),
            cookiedetails : user_consent_details,
            userAgent  : navigator.userAgent
        }, function(response) {
    
            if (response.success) {
                // Successfully stored in DB.
    
                //console.log("::: country from cookie ::: " + response.data.consent_country);
                //console.log("::: timestamp from cookie ::: " + response.data.consent_timestamp);
    
                createCookie('gdpr_consent_stored', '1', '365');
    
            } else {
    
                //alert("Something Failed:::");
    
                // Could not authenticate. Deleted cookies.
                // Prompt with login.
                //clear_token_cookies();
    
            }
        });
    
    }

    var gdpr_block_consent = readCookie('gdpr_consent_country'); //User Country - User Must Consent to exist
    var user_consent_stored = readCookie('gdpr_consent_stored'); //User Consent Data Stored in DB - User is logged in/Logs in later after consent
    var gdpr_consent_details = readCookie('gdpr_consent_details'); //User Consent Data - Time of Consent/Country of Consent

    window.onload = function() { //needs onload wrapper to keep from firing too early
        if (window.jQuery) { //only run the following once jQuery is loaded else it will error
            /*
            * User has/is:
            *   a) Clicked I Agree while logged out OR not RCMG User(new)
            *   b) First Time Accepting - data not stored in DB
            */
            if( readCookie('rcmg_guid') && readCookie('rcmg_token') && readCookie('rc_tos_consent') && !user_consent_stored ){
                updateConsent(gdpr_consent_details);
            }
        }
    }
}











////////////////////////////////////////////////////////////////////////////////
// JQUERY TOOLS LIBRARY ////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*!
 * jQuery Tools v1.2.7 - The missing UI library for the Web
 *
 * tabs/tabs.js
 * dateinput/dateinput.js
 * rangeinput/rangeinput.js
 * validator/validator.js
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/
 *
 */
(function(a){a.tools=a.tools||{version:"v1.2.7"},a.tools.tabs={conf:{tabs:"a",current:"current",onBeforeClick:null,onClick:null,effect:"default",initialEffect:!1,initialIndex:0,event:"click",rotate:!1,slideUpSpeed:400,slideDownSpeed:400,history:!1},addEffect:function(a,c){b[a]=c}};var b={"default":function(a,b){this.getPanes().hide().eq(a).show(),b.call()},fade:function(a,b){var c=this.getConf(),d=c.fadeOutSpeed,e=this.getPanes();d?e.fadeOut(d):e.hide(),e.eq(a).fadeIn(c.fadeInSpeed,b)},slide:function(a,b){var c=this.getConf();this.getPanes().slideUp(c.slideUpSpeed),this.getPanes().eq(a).slideDown(c.slideDownSpeed,b)},ajax:function(a,b){this.getPanes().eq(0).load(this.getTabs().eq(a).attr("href"),b)}},c,d;a.tools.tabs.addEffect("horizontal",function(b,e){if(!c){var f=this.getPanes().eq(b),g=this.getCurrentPane();d||(d=this.getPanes().eq(0).width()),c=!0,f.show(),g.animate({width:0},{step:function(a){f.css("width",d-a)},complete:function(){a(this).hide(),e.call(),c=!1}}),g.length||(e.call(),c=!1)}});function e(c,d,e){var f=this,g=c.add(this),h=c.find(e.tabs),i=d.jquery?d:c.children(d),j;h.length||(h=c.children()),i.length||(i=c.parent().find(d)),i.length||(i=a(d)),a.extend(this,{click:function(d,i){var k=h.eq(d),l=!c.data("tabs");typeof d=="string"&&d.replace("#","")&&(k=h.filter("[href*=\""+d.replace("#","")+"\"]"),d=Math.max(h.index(k),0));if(e.rotate){var m=h.length-1;if(d<0)return f.click(m,i);if(d>m)return f.click(0,i)}if(!k.length){if(j>=0)return f;d=e.initialIndex,k=h.eq(d)}if(d===j)return f;i=i||a.Event(),i.type="onBeforeClick",g.trigger(i,[d]);if(!i.isDefaultPrevented()){var n=l?e.initialEffect&&e.effect||"default":e.effect;b[n].call(f,d,function(){j=d,i.type="onClick",g.trigger(i,[d])}),h.removeClass(e.current),k.addClass(e.current);return f}},getConf:function(){return e},getTabs:function(){return h},getPanes:function(){return i},getCurrentPane:function(){return i.eq(j)},getCurrentTab:function(){return h.eq(j)},getIndex:function(){return j},next:function(){return f.click(j+1)},prev:function(){return f.click(j-1)},destroy:function(){h.off(e.event).removeClass(e.current),i.find("a[href^=\"#\"]").off("click.T");return f}}),a.each("onBeforeClick,onClick".split(","),function(b,c){a.isFunction(e[c])&&a(f).on(c,e[c]),f[c]=function(b){b&&a(f).on(c,b);return f}}),e.history&&a.fn.history&&(a.tools.history.init(h),e.event="history"),h.each(function(b){a(this).on(e.event,function(a){f.click(b,a);return a.preventDefault()})}),i.find("a[href^=\"#\"]").on("click.T",function(b){f.click(a(this).attr("href"),b)}),location.hash&&e.tabs=="a"&&c.find("[href=\""+location.hash+"\"]").length?f.click(location.hash):(e.initialIndex===0||e.initialIndex>0)&&f.click(e.initialIndex)}a.fn.tabs=function(b,c){var d=this.data("tabs");d&&(d.destroy(),this.removeData("tabs")),a.isFunction(c)&&(c={onBeforeClick:c}),c=a.extend({},a.tools.tabs.conf,c),this.each(function(){d=new e(a(this),b,c),a(this).data("tabs",d)});return c.api?d:this}})(jQuery);

(function(d,D){function M(b,a){b=""+b;for(a=a||2;b.length<a;)b="0"+b;return b}function N(b,a,d,g){var f=a.getDate(),l=a.getDay(),k=a.getMonth(),c=a.getFullYear(),f={d:f,dd:M(f),ddd:r[g].shortDays[l],dddd:r[g].days[l],m:k+1,mm:M(k+1),mmm:r[g].shortMonths[k],mmmm:r[g].months[k],yy:(""+c).slice(2),yyyy:c},b=O[b](d,a,f,g);return S.html(b).html()}function l(b){return parseInt(b,10)}function P(b,a){return b.getFullYear()===a.getFullYear()&&b.getMonth()==a.getMonth()&&b.getDate()==a.getDate()}function w(b){if(b!==
    D){if(b.constructor==Date)return b;if("string"==typeof b){var a=b.split("-");if(3==a.length)return new Date(l(a[0]),l(a[1])-1,l(a[2]));if(!/^-?\d+$/.test(b))return;b=l(b)}a=new Date;a.setDate(a.getDate()+b);return a}}function T(b,a){function j(a,t,c){o=a;z=a.getFullYear();B=a.getMonth();A=a.getDate();c||(c=d.Event("api"));"click"==c.type&&!d.browser.msie&&b.focus();c.type="beforeChange";C.trigger(c,[a]);c.isDefaultPrevented()||(b.val(N(t.formatter,a,t.format,t.lang)),c.type="change",C.trigger(c),
    b.data("date",a),f.hide(c))}function g(a){a.type="onShow";C.trigger(a);d(document).on("keydown.d",function(a){if(a.ctrlKey)return!0;var e=a.keyCode;if(8==e||46==e)return b.val(""),f.hide(a);if(27==e||9==e)return f.hide(a);if(0<=d(Q).index(e)){if(!u)return f.show(a),a.preventDefault();var h=d("#"+c.weeks+" a"),j=d("."+c.focus),g=h.index(j);j.removeClass(c.focus);if(74==e||40==e)g+=7;else if(75==e||38==e)g-=7;else if(76==e||39==e)g+=1;else if(72==e||37==e)g-=1;41<g?(f.addMonth(),j=d("#"+c.weeks+" a:eq("+
    (g-42)+")")):0>g?(f.addMonth(-1),j=d("#"+c.weeks+" a:eq("+(g+42)+")")):j=h.eq(g);j.addClass(c.focus);return a.preventDefault()}if(34==e)return f.addMonth();if(33==e)return f.addMonth(-1);if(36==e)return f.today();13==e&&(d(a.target).is("select")||d("."+c.focus).click());return 0<=d([16,17,18,9]).index(e)});d(document).on("click.d",function(a){var e=a.target;!d(e).parents("#"+c.root).length&&e!=b[0]&&(!E||e!=E[0])&&f.hide(a)})}var f=this,q=new Date,k=q.getFullYear(),c=a.css,F=r[a.lang],i=d("#"+c.root),
    K=i.find("#"+c.title),E,G,H,z,B,A,o=b.attr("data-value")||a.value||b.val(),n=b.attr("min")||a.min,p=b.attr("max")||a.max,u,I;0===n&&(n="0");o=w(o)||q;n=w(n||new Date(k+a.yearRange[0],1,1));p=w(p||new Date(k+a.yearRange[1]+1,1,-1));if(!F)throw"Dateinput: invalid language: "+a.lang;"date"==b.attr("type")&&(I=b.clone(),k=I.wrap("<div/>").parent().html(),k=d(k.replace(/type/i,"type=text data-orig-type")),a.value&&k.val(a.value),b.replaceWith(k),b=k);b.addClass(c.input);var C=b.add(f);if(!i.length){i=
    d("<div><div><a/><div/><a/></div><div><div/><div/></div></div>").hide().css({position:"absolute"}).attr("id",c.root);i.children().eq(0).attr("id",c.head).end().eq(1).attr("id",c.body).children().eq(0).attr("id",c.days).end().eq(1).attr("id",c.weeks).end().end().end().find("a").eq(0).attr("id",c.prev).end().eq(1).attr("id",c.next);K=i.find("#"+c.head).find("div").attr("id",c.title);if(a.selectors){var x=d("<select/>").attr("id",c.month),y=d("<select/>").attr("id",c.year);K.html(x.add(y))}for(var k=
    i.find("#"+c.days),L=0;7>L;L++)k.append(d("<span/>").text(F.shortDays[(L+a.firstDay)%7]));d("body").append(i)}a.trigger&&(E=d("<a/>").attr("href","#").addClass(c.trigger).click(function(e){a.toggle?f.toggle():f.show();return e.preventDefault()}).insertAfter(b));var J=i.find("#"+c.weeks),y=i.find("#"+c.year),x=i.find("#"+c.month);d.extend(f,{show:function(e){if(!b.attr("readonly")&&!b.attr("disabled")&&!u){e=e||d.Event();e.type="onBeforeShow";C.trigger(e);if(!e.isDefaultPrevented()){d.each(R,function(){this.hide()});
        u=true;x.off("change").change(function(){f.setValue(l(y.val()),l(d(this).val()))});y.off("change").change(function(){f.setValue(l(d(this).val()),l(x.val()))});G=i.find("#"+c.prev).off("click").click(function(){G.hasClass(c.disabled)||f.addMonth(-1);return false});H=i.find("#"+c.next).off("click").click(function(){H.hasClass(c.disabled)||f.addMonth();return false});f.setValue(o);var t=b.offset();if(/iPad/i.test(navigator.userAgent))t.top=t.top-d(window).scrollTop();i.css({top:t.top+b.outerHeight({margins:true})+
                a.offset[0],left:t.left+a.offset[1]});if(a.speed)i.show(a.speed,function(){g(e)});else{i.show();g(e)}return f}}},setValue:function(e,b,g){var h=l(b)>=-1?new Date(l(e),l(b),l(g==D||isNaN(g)?1:g)):e||o;h<n?h=n:h>p&&(h=p);typeof e=="string"&&(h=w(e));e=h.getFullYear();b=h.getMonth();g=h.getDate();if(b==-1){b=11;e--}else if(b==12){b=0;e++}if(!u){j(h,a);return f}B=b;z=e;A=g;var g=(new Date(e,b,1-a.firstDay)).getDay(),i=(new Date(e,b+1,0)).getDate(),k=(new Date(e,b-1+1,0)).getDate(),r;if(a.selectors){x.empty();
        d.each(F.months,function(a,b){n<new Date(e,a+1,1)&&p>new Date(e,a,0)&&x.append(d("<option/>").html(b).attr("value",a))});y.empty();for(var h=q.getFullYear(),m=h+a.yearRange[0];m<h+a.yearRange[1];m++)n<new Date(m+1,0,1)&&p>new Date(m,0,0)&&y.append(d("<option/>").text(m));x.val(b);y.val(e)}else K.html(F.months[b]+" "+e);J.empty();G.add(H).removeClass(c.disabled);for(var m=!g?-7:0,s,v;m<(!g?35:42);m++){s=d("<a/>");if(m%7===0){r=d("<div/>").addClass(c.week);J.append(r)}if(m<g){s.addClass(c.off);v=k-
        g+m+1;h=new Date(e,b-1,v)}else if(m>=g+i){s.addClass(c.off);v=m-i-g+1;h=new Date(e,b+1,v)}else{v=m-g+1;h=new Date(e,b,v);P(o,h)?s.attr("id",c.current).addClass(c.focus):P(q,h)&&s.attr("id",c.today)}n&&h<n&&s.add(G).addClass(c.disabled);p&&h>p&&s.add(H).addClass(c.disabled);s.attr("href","#"+v).text(v).data("date",h);r.append(s)}J.find("a").click(function(b){var e=d(this);if(!e.hasClass(c.disabled)){d("#"+c.current).removeAttr("id");e.attr("id",c.current);j(e.data("date"),a,b)}return false});c.sunday&&
    J.find("."+c.week).each(function(){var b=a.firstDay?7-a.firstDay:0;d(this).children().slice(b,b+1).addClass(c.sunday)});return f},setMin:function(a,b){n=w(a);b&&o<n&&f.setValue(n);return f},setMax:function(a,b){p=w(a);b&&o>p&&f.setValue(p);return f},today:function(){return f.setValue(q)},addDay:function(a){return this.setValue(z,B,A+(a||1))},addMonth:function(a){var a=B+(a||1),b=(new Date(z,a+1,0)).getDate();return this.setValue(z,a,A<=b?A:b)},addYear:function(a){return this.setValue(z+(a||1),B,A)},
    destroy:function(){b.add(document).off("click.d keydown.d");i.add(E).remove();b.removeData("dateinput").removeClass(c.input);I&&b.replaceWith(I)},hide:function(a){if(u){a=d.Event();a.type="onHide";C.trigger(a);if(a.isDefaultPrevented())return;d(document).off("click.d keydown.d");i.hide();u=false}return f},toggle:function(){return f.isOpen()?f.hide():f.show()},getConf:function(){return a},getInput:function(){return b},getCalendar:function(){return i},getValue:function(b){return b?N(a.formatter,o,b,
        a.lang):o},isOpen:function(){return u}});d.each(["onBeforeShow","onShow","change","onHide"],function(b,c){if(d.isFunction(a[c]))d(f).on(c,a[c]);f[c]=function(a){if(a)d(f).on(c,a);return f}});a.editable||b.on("focus.d click.d",f.show).keydown(function(a){var c=a.keyCode;if(!u&&d(Q).index(c)>=0){f.show(a);return a.preventDefault()}(c==8||c==46)&&b.val("");return a.shiftKey||a.ctrlKey||a.altKey||c==9?true:a.preventDefault()});w(b.val())&&j(o,a)}d.tools=d.tools||{version:"@VERSION"};var R=[],O={},q,Q=
    [75,76,38,39,74,72,40,37],r={};q=d.tools.dateinput={conf:{format:"mm/dd/yy",formatter:"default",selectors:!1,yearRange:[-5,5],lang:"en",offset:[0,0],speed:0,firstDay:0,min:D,max:D,trigger:0,toggle:0,editable:0,css:{prefix:"cal",input:"date",root:0,head:0,title:0,prev:0,next:0,month:0,year:0,days:0,body:0,weeks:0,today:0,current:0,week:0,off:0,sunday:0,focus:0,disabled:0,trigger:0}},addFormatter:function(b,a){O[b]=a},localize:function(b,a){d.each(a,function(b,d){a[b]=d.split(",")});r[b]=a}};q.localize("en",
    {months:"January,February,March,April,May,June,July,August,September,October,November,December",shortMonths:"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",days:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",shortDays:"Sun,Mon,Tue,Wed,Thu,Fri,Sat"});var S=d("<a/>");q.addFormatter("default",function(b,a,d){return b.replace(/d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g,function(a){return a in d?d[a]:a})});q.addFormatter("prefixed",function(b,a,d){return b.replace(/%(d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*')/g,
    function(a,b){return b in d?d[b]:a})});d.expr[":"].date=function(b){var a=b.getAttribute("type");return a&&"date"==a||!!d(b).data("dateinput")};d.fn.dateinput=function(b){if(this.data("dateinput"))return this;b=d.extend(!0,{},q.conf,b);d.each(b.css,function(a,d){!d&&"prefix"!=a&&(b.css[a]=(b.css.prefix||"")+(d||a))});var a;this.each(function(){var j=new T(d(this),b);R.push(j);j=j.getInput().data("dateinput",j);a=a?a.add(j):j});return a?a:this}})(jQuery);
(function(a){function z(c,b){var a=Math.pow(10,b);return Math.round(c*a)/a}function m(c,b){var a=parseInt(c.css(b),10);return a?a:(a=c[0].currentStyle)&&a.width&&parseInt(a.width,10)}function y(a){return(a=a.data("events"))&&a.onSlide}function A(c,b){function e(a,d,f,e){void 0===f?f=d/i*v:e&&(f-=b.min);s&&(f=Math.round(f/s)*s);if(void 0===d||s)d=f*i/v;if(isNaN(f))return g;d=Math.max(0,Math.min(d,i));f=d/i*v;if(e||!n)f+=b.min;n&&(e?d=i-d:f=b.max-f);var f=z(f,r),h="click"==a.type;if(u&&void 0!==k&&
    !h&&(a.type="onSlide",w.trigger(a,[f,d]),a.isDefaultPrevented()))return g;e=h?b.speed:0;h=h?function(){a.type="change";w.trigger(a,[f])}:null;n?(j.animate({top:d},e,h),b.progress&&x.animate({height:i-d+j.height()/2},e)):(j.animate({left:d},e,h),b.progress&&x.animate({width:d+j.width()/2},e));k=f;c.val(f);return g}function o(){(n=b.vertical||m(h,"height")>m(h,"width"))?(i=m(h,"height")-m(j,"height"),l=h.offset().top+i):(i=m(h,"width")-m(j,"width"),l=h.offset().left)}function q(){o();g.setValue(void 0!==
b.value?b.value:b.min)}var g=this,p=b.css,h=a("<div><div/><a href='#'/></div>").data("rangeinput",g),n,k,l,i;c.before(h);var j=h.addClass(p.slider).find("a").addClass(p.handle),x=h.find("div").addClass(p.progress);a.each(["min","max","step","value"],function(a,d){var f=c.attr(d);parseFloat(f)&&(b[d]=parseFloat(f,10))});var v=b.max-b.min,s="any"==b.step?0:b.step,r=b.precision;void 0===r&&(r=s.toString().split("."),r=2===r.length?r[1].length:0);if("range"==c.attr("type")){var t=c.clone().wrap("<div/>").parent().html(),
    t=a(t.replace(/type/i,"type=text data-orig-type"));t.val(b.value);c.replaceWith(t);c=t}c.addClass(p.input);var w=a(g).add(c),u=!0;a.extend(g,{getValue:function(){return k},setValue:function(b,d){o();return e(d||a.Event("api"),void 0,b,true)},getConf:function(){return b},getProgress:function(){return x},getHandle:function(){return j},getInput:function(){return c},step:function(c,d){d=d||a.Event();g.setValue(k+(b.step=="any"?1:b.step)*(c||1),d)},stepUp:function(a){return g.step(a||1)},stepDown:function(a){return g.step(-a||
        -1)}});a.each(["onSlide","change"],function(c,d){if(a.isFunction(b[d]))a(g).on(d,b[d]);g[d]=function(b){if(b)a(g).on(d,b);return g}});j.drag({drag:!1}).on("dragStart",function(){o();u=y(a(g))||y(c)}).on("drag",function(a,b,f){if(c.is(":disabled"))return false;e(a,n?b:f)}).on("dragEnd",function(a){if(!a.isDefaultPrevented()){a.type="change";w.trigger(a,[k])}}).click(function(a){return a.preventDefault()});h.click(function(a){if(c.is(":disabled")||a.target==j[0])return a.preventDefault();o();var b=
    n?j.height()/2:j.width()/2;e(a,n?i-l-b+a.pageY:a.pageX-l-b)});b.keyboard&&c.keydown(function(b){if(!c.attr("readonly")){var d=b.keyCode,f=a([75,76,38,33,39]).index(d)!=-1,e=a([74,72,40,34,37]).index(d)!=-1;if((f||e)&&!b.shiftKey&&!b.altKey&&!b.ctrlKey){f?g.step(d==33?10:1,b):e&&g.step(d==34?-10:-1,b);return b.preventDefault()}}});c.blur(function(b){var c=a(this).val();c!==k&&g.setValue(c,b)});a.extend(c[0],{stepUp:g.stepUp,stepDown:g.stepDown});q();i||a(window).load(q)}a.tools=a.tools||{version:"@VERSION"};
    var u;u=a.tools.rangeinput={conf:{min:0,max:100,step:"any",steps:0,value:0,precision:void 0,vertical:0,keyboard:!0,progress:!1,speed:100,css:{input:"range",slider:"slider",progress:"progress",handle:"handle"}}};var q,l;a.fn.drag=function(c){document.ondragstart=function(){return!1};c=a.extend({x:!0,y:!0,drag:!0},c);q=q||a(document).on("mousedown mouseup",function(b){var e=a(b.target);if("mousedown"==b.type&&e.data("drag")){var o=e.position(),m=b.pageX-o.left,g=b.pageY-o.top,p=!0;q.on("mousemove.drag",
        function(a){var b=a.pageX-m,a=a.pageY-g,k={};c.x&&(k.left=b);c.y&&(k.top=a);p&&(e.trigger("dragStart"),p=!1);c.drag&&e.css(k);e.trigger("drag",[a,b]);l=e});b.preventDefault()}else try{l&&l.trigger("dragEnd")}finally{q.off("mousemove.drag"),l=null}});return this.data("drag",!0)};a.expr[":"].range=function(c){var b=c.getAttribute("type");return b&&"range"==b||!!a(c).filter("input").data("rangeinput")};a.fn.rangeinput=function(c){if(this.data("rangeinput"))return this;var c=a.extend(!0,{},u.conf,c),
        b;this.each(function(){var e=new A(a(this),a.extend(!0,{},c)),e=e.getInput().data("rangeinput",e);b=b?b.add(e):e});return b?b:this}})(jQuery);
(function(c){function i(b,a,f){var a=c(a).first()||a,d=b.offset().top,e=b.offset().left,g=f.position.split(/,?\s+/),j=g[0],g=g[1],d=d-(a.outerHeight()-f.offset[0]),e=e+(b.outerWidth()+f.offset[1]);/iPad/i.test(navigator.userAgent)&&(d-=c(window).scrollTop());f=a.outerHeight()+b.outerHeight();"center"==j&&(d+=f/2);"bottom"==j&&(d+=f);b=b.outerWidth();"center"==g&&(e-=(b+a.outerWidth())/2);"left"==g&&(e-=b);return{top:d,left:e}}function q(b){function a(){return this.getAttribute("type")==b}a.key='[type="'+
    b+'"]';return a}function n(b,a,f){function p(a,b,e){if(f.grouped||!a.length){var g;!1===e||c.isArray(e)?(g=d.messages[b.key||b]||d.messages["*"],g=g[f.lang]||d.messages["*"].en,(b=g.match(/\$\d/g))&&c.isArray(e)&&c.each(b,function(a){g=g.replace(this,e[a])})):g=e[f.lang]||e;a.push(g)}}var e=this,g=a.add(e),b=b.not(":button, :image, :reset, :submit");a.attr("novalidate","novalidate");c.extend(e,{getConf:function(){return f},getForm:function(){return a},getInputs:function(){return b},reflow:function(){b.each(function(){var a=
        c(this),b=a.data("msg.el");b&&(a=i(a,b,f),b.css({top:a.top,left:a.left}))});return e},invalidate:function(a,h){if(!h){var d=[];c.each(a,function(a,f){var c=b.filter("[name='"+a+"']");c.length&&(c.trigger("OI",[f]),d.push({input:c,messages:[f]}))});a=d;h=c.Event()}h.type="onFail";g.trigger(h,[a]);h.isDefaultPrevented()||l[f.effect][0].call(e,a,h);return e},reset:function(a){a=a||b;a.removeClass(f.errorClass).each(function(){var a=c(this).data("msg.el");a&&(a.remove(),c(this).data("msg.el",null))}).off(f.errorInputEvent+
        ".v"||"");return e},destroy:function(){a.off(f.formEvent+".V reset.V");b.off(f.inputEvent+".V change.V");return e.reset()},checkValidity:function(a,h){var a=a||b,a=a.not(":disabled"),d={},a=a.filter(function(){var a=c(this).attr("name");if(!d[a])return d[a]=!0,c(this)});if(!a.length)return!0;h=h||c.Event();h.type="onBeforeValidate";g.trigger(h,[a]);if(h.isDefaultPrevented())return h.result;var k=[];a.each(function(){var a=[],b=c(this).data("messages",a),d=m&&b.is(":date")?"onHide.v":f.errorInputEvent+
        ".v";b.off(d);c.each(o,function(){var c=this[0];if(b.filter(c).length){var d=this[1].call(e,b,b.val());if(!0!==d){h.type="onBeforeFail";g.trigger(h,[b,c]);if(h.isDefaultPrevented())return!1;var j=b.attr(f.messageAttr);if(j)return a=[j],!1;p(a,c,d)}}});if(a.length&&(k.push({input:b,messages:a}),b.trigger("OI",[a]),f.errorInputEvent))b.on(d,function(a){e.checkValidity(b,a)});if(f.singleError&&k.length)return!1});var i=l[f.effect];if(!i)throw'Validator: cannot find effect "'+f.effect+'"';if(k.length)return e.invalidate(k,
        h),!1;i[1].call(e,a,h);h.type="onSuccess";g.trigger(h,[a]);a.off(f.errorInputEvent+".v");return!0}});c.each(["onBeforeValidate","onBeforeFail","onFail","onSuccess"],function(a,b){if(c.isFunction(f[b]))c(e).on(b,f[b]);e[b]=function(a){if(a)c(e).on(b,a);return e}});if(f.formEvent)a.on(f.formEvent+".V",function(b){if(!e.checkValidity(null,b))return b.preventDefault();b.target=a;b.type=f.formEvent});a.on("reset.V",function(){e.reset()});b[0]&&b[0].validity&&b.each(function(){this.oninvalid=function(){return!1}});
    a[0]&&(a[0].checkValidity=e.checkValidity);if(f.inputEvent)b.on(f.inputEvent+".V",function(a){e.checkValidity(c(this),a)});b.filter(":checkbox, select").filter("[required]").on("change.V",function(a){var b=c(this);(this.checked||b.is("select")&&c(this).val())&&l[f.effect][1].call(e,b,a)});b.filter(":radio[required]").on("change.V",function(a){var b=c("[name='"+c(a.srcElement).attr("name")+"']");b!=null&&b.length!=0&&e.checkValidity(b,a)});c(window).resize(function(){e.reflow()})}c.tools=c.tools||
    {version:"@VERSION"};var r=/\[type=([a-z]+)\]/,s=/^-?[0-9]*(\.[0-9]+)?$/,m=c.tools.dateinput,t=/^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,u=/^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i,d;d=c.tools.validator={conf:{grouped:!1,effect:"default",errorClass:"invalid",inputEvent:null,errorInputEvent:"keyup",formEvent:"submit",lang:"en",message:"<div/>",messageAttr:"data-message",messageClass:"error",offset:[0,0],position:"center right",singleError:!1,speed:"normal"},messages:{"*":{en:"Please correct this value"}},
    localize:function(b,a){c.each(a,function(a,c){d.messages[a]=d.messages[a]||{};d.messages[a][b]=c})},localizeFn:function(b,a){d.messages[b]=d.messages[b]||{};c.extend(d.messages[b],a)},fn:function(b,a,f){c.isFunction(a)?f=a:("string"==typeof a&&(a={en:a}),this.messages[b.key||b]=a);(a=r.exec(b))&&(b=q(a[1]));o.push([b,f])},addEffect:function(b,a,f){l[b]=[a,f]}};var o=[],l={"default":[function(b){var a=this.getConf();c.each(b,function(b,d){var e=d.input;e.addClass(a.errorClass);var g=e.data("msg.el");
        g||(g=c(a.message).addClass(a.messageClass).appendTo(document.body),e.data("msg.el",g));g.css({visibility:"hidden"}).find("p").remove();c.each(d.messages,function(a,b){c("<p/>").html(b).appendTo(g)});g.outerWidth()==g.parent().width()&&g.add(g.find("p")).css({display:"inline"});e=i(e,g,a);g.css({visibility:"visible",position:"absolute",top:e.top,left:e.left}).fadeIn(a.speed)})},function(b){var a=this.getConf();b.removeClass(a.errorClass).each(function(){var a=c(this).data("msg.el");a&&a.css({visibility:"hidden"})})}]};
    c.each(["email","url","number"],function(b,a){c.expr[":"][a]=function(b){return b.getAttribute("type")===a}});c.fn.oninvalid=function(b){return this[b?"on":"trigger"]("OI",b)};d.fn(":email","Please enter a valid email address",function(b,a){return!a||t.test(a)});d.fn(":url","Please enter a valid URL",function(b,a){return!a||u.test(a)});d.fn(":number","Please enter a numeric value.",function(b,a){return s.test(a)});d.fn("[max]","Please enter a value no larger than $1",function(b,a){if(""===a||m&&b.is(":date"))return!0;
        var c=b.attr("max");return parseFloat(a)<=parseFloat(c)?!0:[c]});d.fn("[min]","Please enter a value of at least $1",function(b,a){if(""===a||m&&b.is(":date"))return!0;var c=b.attr("min");return parseFloat(a)>=parseFloat(c)?!0:[c]});d.fn("[required]","Please complete this mandatory field.",function(b,a){return b.is(":checkbox")?b.is(":checked"):!!a});d.fn("[pattern]",function(b,a){return""===a||RegExp("^"+b.attr("pattern")+"$").test(a)});d.fn(":radio","Please select an option.",function(b){var a=!1;
        c("[name='"+b.attr("name")+"']").each(function(b,d){c(d).is(":checked")&&(a=!0)});return a?!0:!1});c.fn.validator=function(b){var a=this.data("validator");a&&(a.destroy(),this.removeData("validator"));b=c.extend(!0,{},d.conf,b);if(this.is("form"))return this.each(function(){var d=c(this);a=new n(d.find(":input"),d,b);d.data("validator",a)});a=new n(this,this.eq(0).closest("form"),b);return this.data("validator",a)}})(jQuery);












////////////////////////////////////////////////////////////////////////////////
// Facebox Library /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*
 * Facebox (for jQuery)
 * version: 1.2 (05/05/2008)
 * @requires jQuery v1.2 or later
 *
 * Examples at http://famspam.com/facebox/
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]
 *
 * Usage:
 *
 *  jQuery(document).ready(function() {
 *    jQuery('a[rel*=facebox]').facebox()
 *  })
 *
 *  <a href="#terms" rel="facebox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="facebox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="facebox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *
 *  You can also use it programmatically:
 *
 *    jQuery.facebox('some html')
 *
 *  The above will open a facebox with "some html" as the content.
 *
 *    jQuery.facebox(function($) {
 *      $.get('blah.html', function(data) { $.facebox(data) })
 *    })
 *
 *  The above will show a loading screen before the passed function is called,
 *  allowing for a better ajaxy experience.
 *
 *  The facebox function can also display an ajax page or image:
 *
 *    jQuery.facebox({ ajax: 'remote.html' })
 *    jQuery.facebox({ image: 'dude.jpg' })
 *
 *  Want to close the facebox?  Trigger the 'close.facebox' document event:
 *
 *    jQuery(document).trigger('close.facebox')
 *
 *  Facebox also has a bunch of other hooks:
 *
 *    loading.facebox
 *    beforeReveal.facebox
 *    reveal.facebox (aliased as 'afterReveal.facebox')
 *    init.facebox
 *
 *  Simply bind a function to any of these hooks:
 *
 *   $(document).bind('reveal.facebox', function() { ...stuff to do after the facebox and contents are revealed... })
 *
 */
(function($) {
    $.facebox = function(data, klass) {
        $.facebox.loading()

        if (data.ajax) fillFaceboxFromAjax(data.ajax)
        else if (data.image) fillFaceboxFromImage(data.image)
        else if (data.div) fillFaceboxFromHref(data.div)
        else if ($.isFunction(data)) data.call($)
        else $.facebox.reveal(data, klass)
    }

    /*
   * Public, $.facebox methods
   */

    $.extend($.facebox, {
        settings: {
            opacity      : 0,
            overlay      : true,
            loadingImage : 'https://s3.amazonaws.com/assets.realclearpolitics.com/images/facebox/loading.gif',
            closeImage   : 'https://s3.amazonaws.com/assets.realclearpolitics.com/images/facebox/closelabel.gif',
            imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ],
            faceboxHtml  : '\
    <div id="facebox" style="display:none;"> \
      <div class="popup"> \
        <table> \
          <tbody> \
            <tr> \
              <td class="tl"/><td class="b"/><td class="tr"/> \
            </tr> \
            <tr> \
              <td class="b"/> \
              <td class="body"> \
                <div class="content"> \
                </div> \
                <div class="footer"> \
                  <a href="#" class="close"> \
                    <img src="https://s3.amazonaws.com/assets.realclearpolitics.com/images/facebox/closelabel.gif" title="close" class="close_image" /> \
                  </a> \
                </div> \
              </td> \
              <td class="b"/> \
            </tr> \
            <tr> \
              <td class="bl"/><td class="b"/><td class="br"/> \
            </tr> \
          </tbody> \
        </table> \
      </div> \
    </div>'
        },

        loading: function() {
            init()
            if ($('#facebox .loading').length == 1) return true
            showOverlay()

            $('#facebox .content').empty()
            $('#facebox .body').children().hide().end().
            append('<div class="loading"><img src="'+$.facebox.settings.loadingImage+'"/></div>')

            $('#facebox').css({
                top:  getPageScroll()[1] + (getPageHeight() / 10),
                left: 385.5
            }).show()

            $(document).bind('keydown.facebox', function(e) {
                if (e.keyCode == 27) $.facebox.close()
                return true
            })
            $(document).trigger('loading.facebox')
        },

        reveal: function(data, klass) {
            $(document).trigger('beforeReveal.facebox')
            if (klass) $('#facebox .content').addClass(klass)
            $('#facebox .content').append(data)
            $('#facebox .loading').remove()
            $('#facebox .body').children().fadeIn('normal')
            $('#facebox').css('left', $(window).width() / 2 - ($('#facebox table').width() / 2))
            $(document).trigger('reveal.facebox').trigger('afterReveal.facebox')
        },

        close: function() {
            $(document).trigger('close.facebox')
            return false
        }
    })

    /*
   * Public, $.fn methods
   */

    $.fn.facebox = function(settings) {
        init(settings)

        function clickHandler() {
            $.facebox.loading(true)

            // support for rel="facebox.inline_popup" syntax, to add a class
            // also supports deprecated "facebox[.inline_popup]" syntax
            var klass = this.rel.match(/facebox\[?\.(\w+)\]?/)
            if (klass) klass = klass[1]

            fillFaceboxFromHref(this.href, klass)
            return false
        }

        return this.click(clickHandler)
    }

    /*
   * Private methods
   */

    // called one time to setup facebox on this page
    function init(settings) {
        if ($.facebox.settings.inited) return true
        else $.facebox.settings.inited = true

        $(document).trigger('init.facebox')
        makeCompatible()

        var imageTypes = $.facebox.settings.imageTypes.join('|')
        $.facebox.settings.imageTypesRegexp = new RegExp('\.' + imageTypes + '$', 'i')

        if (settings) $.extend($.facebox.settings, settings)
        $('body').append($.facebox.settings.faceboxHtml)

        var preload = [ new Image(), new Image() ]
        preload[0].src = $.facebox.settings.closeImage
        preload[1].src = $.facebox.settings.loadingImage

        $('#facebox').find('.b:first, .bl, .br, .tl, .tr').each(function() {
            preload.push(new Image())
            preload.slice(-1).src = $(this).css('background-image').replace(/url\((.+)\)/, '$1')
        })

        $('#facebox .close').click(function(){
            $('.overlay').hide();
            $.facebox.close
        });

        $('#facebox .close').click($.facebox.close);

        $('#facebox .close_image').attr('src', $.facebox.settings.closeImage)
    }

    // getPageScroll() by quirksmode.com
    function getPageScroll() {
        var xScroll, yScroll;
        if (self.pageYOffset) {
            yScroll = self.pageYOffset;
            xScroll = self.pageXOffset;
        } else if (document.documentElement && document.documentElement.scrollTop) {   // Explorer 6 Strict
            yScroll = document.documentElement.scrollTop;
            xScroll = document.documentElement.scrollLeft;
        } else if (document.body) {// all other Explorers
            yScroll = document.body.scrollTop;
            xScroll = document.body.scrollLeft;
        }
        return new Array(xScroll,yScroll)
    }

    // Adapted from getPageSize() by quirksmode.com
    function getPageHeight() {
        var windowHeight
        if (self.innerHeight) { // all except Explorer
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) { // other Explorers
            windowHeight = document.body.clientHeight;

        }
        return windowHeight
    }

    // Backwards compatibility
    function makeCompatible() {
        var $s = $.facebox.settings

        $s.loadingImage = $s.loading_image || $s.loadingImage
        $s.closeImage = $s.close_image || $s.closeImage
        $s.imageTypes = $s.image_types || $s.imageTypes
        $s.faceboxHtml = $s.facebox_html || $s.faceboxHtml
    }

    // Figures out what you want to display and displays it
    // formats are:
    //     div: #id
    //   image: blah.extension
    //    ajax: anything else
    function fillFaceboxFromHref(href, klass) {
        // div
        if (href.match(/#/)) {
            var url    = window.location.href.split('#')[0]
            var target = href.replace(url,'')
            $.facebox.reveal($(target).clone().show(), klass)

            // image
        } else if (href.match($.facebox.settings.imageTypesRegexp)) {
            fillFaceboxFromImage(href, klass)
            // ajax
        } else {
            fillFaceboxFromAjax(href, klass)
        }
    }

    function fillFaceboxFromImage(href, klass) {
        var image = new Image()
        image.onload = function() {
            $.facebox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass)
        }
        image.src = href
    }

    function fillFaceboxFromAjax(href, klass) {
        $.get(href, function(data) { $.facebox.reveal(data, klass) })
    }

    function skipOverlay() {
        return $.facebox.settings.overlay == false || $.facebox.settings.opacity === null
    }

    function showOverlay() {
        if (skipOverlay()) return

        if ($('facebox_overlay').length == 0)
            $("body").append('<div id="facebox_overlay" class="facebox_hide"></div>')

        $('#facebox_overlay').hide().addClass("facebox_overlayBG")
            .css('opacity', $.facebox.settings.opacity)
            .click(function() { $(document).trigger('close.facebox') })
            .fadeIn(200)
        return false
    }

    function hideOverlay() {
        if (skipOverlay()) return

        $('#facebox_overlay').fadeOut(200, function(){
            $("#facebox_overlay").removeClass("facebox_overlayBG")
            $("#facebox_overlay").addClass("facebox_hide")
            $("#facebox_overlay").remove()
        })


        return false
    }

    /*
   * Bindings
   */

    $(document).bind('close.facebox', function() {
        $(document).unbind('keydown.facebox')
        $('#facebox').fadeOut(function() {
            $('#facebox .content').removeClass().addClass('content')
            hideOverlay()
            $('#facebox .loading').remove()
        })
    })

})(jQuery);











////////////////////////////////////////////////////////////////////////////////
// FARK WIDGET /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Class to load in dynamic ads (just used for Fark Widget)
 * @type Object
 */
var dynamic_ads = {};

/*
 * FARK Widget : RCP, RCW, RCD, RCSci, RCHist, RCM
 * Homepage Locations : LC or RC
 * Article Locations  : MC && RC
*/
dynamic_ads.fark_widget = function(location, override_mixi_id){

    if( NO_IC ) { return; } //temporary override of IC off with Fisher "malvert" flag 6/8/2019

    if( typeof override_mixi_id === 'undefined' ){
        override_mixi_id = null;
    }

    if(override_mixi_id !== null){console.log('orale mixi override: '+override_mixi_id);}

    if($('div.beta').is("[data-sponsored-ads-only]")) {
        // If marked as "Sponsored Ads Only", do not show this ad
        return;
    }

    // Disabled on Polls 10/10/2022 RROSE
    if( SITE_INFO['name'] == "politics" && $('body').hasClass('polls') ) {
        return;
    }

    var mixi_id, target, fark_target, widget, insertHere;

    if( location == 'left' ){ //Homepage Left Column
        mixi_id = 92311;
        if(override_mixi_id!==null){ mixi_id=override_mixi_id; }
        target = 'div.gamma';
        if( SITE_INFO['name'] != 'science' ){ //RCD, RCW
            fark_target = 'div.gamma .widget_slot:eq(1)';
            insertHere = 'after';
        }else{ //RCSci
            fark_target = 'div.gamma';
            insertHere = 'append';
        }

        widget = '<style type="text/css">#header_'+mixi_id+'{background-color:'+SITE_INFO['site_heading_color']+' !important;}</style><div class="mixi_unit" id="unit_'+mixi_id+'"><a href="https://mixi.media/" rel="nofollow"></a></div>';

    }else if( location == 'simple_left' ){ //new widget - without images - bottom left column
        mixi_id = 92584;
        target = 'ul#most-read-box';
        fark_target = 'ul#most-read-box';
        insertHere = 'after';

        widget = '<div class="fark-header" style="font-size:13px; background-color:'+SITE_INFO['site_heading_color']+'; color: #FFFFFF; padding: 15px 15px; width: auto; font-weight: bold; margin-bottom: 0px;">News From Partners</div>';
        widget += '<div class="mixi_unit" id="unit_'+mixi_id+'"><a href="https://mixi.media/" rel="nofollow"></a></div>';
        widget += '<style>#container_92584 #header_92584{display:none;}</style>';  // Hides the 'Recent News' Title Header.

    }else if( location == 'middle' ){ //Article Permalinks(Standard) Middle Column
        mixi_id = 92313;
        target = 'div.alpha';
        fark_target = 'div.alpha';
        insertHere = 'append';

        widget = '<style type="text/css">#container_92313 {margin-top:10px; border-bottom:1px solid #DDDDDD;} #container_92313 .list-container {border-left:1px solid #DDDDDD; border-right:1px solid #DDDDDD; padding-top:10px;} #unit_92313 h2 {background-color: '+SITE_INFO['site_heading_color']+'; padding: 10px; color: white; font-size: 1.3em; margin:0; }</style><div class="mixi_unit" id="unit_'+mixi_id+'"><a href="https://mixi.media/" rel="nofollow"></a></div>';

    }else{ //loc == right/default
        mixi_id = 91801;
        target = 'div.beta';
        var w_header = '<div class="fark-header" style="font-size:13px; background-color:'+SITE_INFO['site_heading_color']+'; color: #FFFFFF; padding: 15px 15px; width: auto; font-weight: bold; margin-bottom: 0px;">News From Partners</div>';
        widget = '';

        if( SITE_INFO['name'] != "politics" ){ //All Sites EXCEPT RCP Right Column(article pages only)
            fark_target = 'div.beta';
            insertHere = 'append';
        }else if( $('body').hasClass('article') ) {
            mixi_id = 94208;
            w_header = ''; // Clears header
            widget += '<br />';
            fark_target = '';

            if(SITE_INFO['name'] != 'politics'){
                fark_target = 'div.beta .RC-AD:eq(1)';
                insertHere = 'before';
            } else {
                fark_target = 'div.beta';
                insertHere = 'append';
            }

            //Inserting the widget on mobile on the beta column
            if(document.body.clientWidth < 768){

                //we are removing the mixi widget on mobile on politics
                if(SITE_INFO['name'] != 'politics') {
                    fark_target = 'div.alpha #comments-container';
                    insertHere = 'after';
                }
            }

        }else{


            if( $('body').hasClass('home') && document.body.clientWidth<768 ){ //HOMEPAGE MOBILE only

                mixi_id = 94488; //custom 1x3
                fark_target = 'div#hpstreams';
                insertHere = 'before';

                w_header = "<div class='clear' style='margin-top:10px;'></div>"+w_header; //MORE PADDING

            }else{
                //Default behaivior will be targeting the right column
                //Mobile : right column is hidden
                fark_target = 'div.beta .widget_slot:eq(3)';
                insertHere = 'after';
            }


        }

        widget = '<div class="mixi_unit" id="unit_'+mixi_id+'"><a href="https://mixi.media/" rel="nofollow"></a></div>' + widget;

        widget = w_header + widget;
    }

    // if ads are already lazyloaded with ads, change target
    if( $(fark_target).length == 0 ) {
        fark_target = fark_target.replace('.RC-AD', '.lazyloaded');
    }

    if( $(target).length > 0 ) {
        // console.log("FARK WIDGET INSERT DETAILS", "TARGET", fark_target, "WIDGET", widget);
        if( insertHere == 'append' ){
            $(fark_target).append( widget );
        } else if( insertHere == 'after' ) {
            $(fark_target).after( widget );
        } else if( insertHere == 'before' ) {
            $(fark_target).before( widget );
        } else {
            $(fark_target).after( widget );
        }

        var sc = document.createElement('script');
        sc.type = 'text/javascript';
        sc.async = true;
        sc.src = '//mixi.media/data/js/'+mixi_id+'.js';
        sc.charset = 'utf-8';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(sc, s);
    }

}



function fark_widgets_init() {

    if( readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1 ) {
        console.log('ad_free exit fark_widgets_init');
        return;
    }

    if (SITE_INFO['name'] == 'politics') {
        if ($('body').hasClass('article') || $('body').hasClass('video') || $('body').hasClass('home') || $('body').hasClass('polls') || $('body').hasClass('polls')) {
            dynamic_ads.fark_widget('right');
            dynamic_ads.fark_widget('simple_left');
        }
    } else if ((SITE_INFO['name'] == 'markets' || SITE_INFO['name'] == 'history') && $('body').hasClass('home')) {
        dynamic_ads.fark_widget('right');
        if (SITE_INFO['name'] == 'markets') {
            dynamic_ads.fark_widget('left', '94201');
        }
    } else if ((SITE_INFO['name'] == 'defense' || SITE_INFO['name'] == 'world' || SITE_INFO['name'] == 'science') && $('body').hasClass('home')) {
        dynamic_ads.fark_widget('left');
    } else if ((SITE_INFO['name'] == 'defense' || SITE_INFO['name'] == 'world' || SITE_INFO['name'] == 'science' || SITE_INFO['name'] == 'markets' || SITE_INFO['name'] == 'history') && $('body').hasClass('article')) {
        $(".newsletter-signup-container2").last().hide();
        $(".newsletter-widget").css({"margin-bottom": "20px"});

        dynamic_ads.fark_widget('middle');
        dynamic_ads.fark_widget('right');
    }


}













////////////////////////////////////////////////////////////////////////////////
// FLOATING LEADERBOARD ////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//M.B. ADDED 12.5.17 -- FLOATING LEADERBOARD AD/RIGHTRAIL AD_BOX_TOP
//A.A. REWORKED AND CLEANED UP 11.15.18
/* floating leaderboard ad && floating right rail ad box top */
//if( $('body.article').length > 0 ){ //only article pages -- might need to kill /articles and long-format pages???
//console.log('floater func enabled.......');

//when doc is ready then check body class - if checks true do following...
$(document).ready(function(){

    var settings = {};

    leaderboardActions(leaderboardSettings(settings));
}); //end doc ready

var leaderboardSettings = function(options){

    var checkIfArticle = function(){

        // Turn off on video per Ivan 05/14/2020
        return false;

        if( $('body.article').length > 0 && $('div.beta div').first().hasClass('RC-AD-BOX-TOP') ){
            return true;
        }

        return false;
    }

    var checkIfPolls = function(){

        // Setting this as false permanently to turn off on polls per Ivan - A.A. 03-12-2019
        // Turning it back on 04/12/2019 per Ivan
        // Turning it back off 10/23/2019 per Ivan
        return false;

        if( $('body.polls').length > 0 || $('body.maps').length > 0 || $('body.live_results').length>0 ){
            return true;
        }

        return false;

    }

    var checkIfVideo = function(){

        // Turn off on video per Ivan 05/07/2020
        return false; 
        return $('body.video').length > 0;
    }

    options = options || {};

    var settings = {
        fixed_class: 'fixed-leaderboard',
        leaderboard_cookie: 'rc-ad_rc-ad-top-banner_fixed-leaderboard_close-ad',
        hide_class: 'hide',
        top_pos_class: 'top',
        tynt_check: '.tynt-ad-fence',
        top_banner_ad_el: $('.RC-AD-TOP-BANNER'),
        container_top: $('#container').length ? $('#container').offset().top : 0,
        container_width: $('#container').length ? $('#container').width() : 0,
        alpha_left: $('.alpha').length ? $('.alpha').offset().left : 0,
        alpha_width: $('.alpha').length ? $('.alpha').width() : 0,

        article: checkIfArticle(),
        polls: checkIfPolls(),
        video: checkIfVideo(),
        on_article: {
            reset: 1000,
        },
        on_polls: {
            reset: 300,
        },
        on_video: {
            reset: 1000,
        },
        hooks: [
            'rightColumnStickyOnScroll',
            'backToTopIcon'
        ],
        scroll_hooks: [],
    };

    $.extend(true, settings, options);

    return settings;
};

var leaderboardActions = function(set){


    if( SITE_INFO['name'] == "science" || SITE_INFO['name'] == 'policy' ){ return; }

    var pos_settings = {};
    if(set.article == true){

        pos_settings = set.on_article;

    }else if(set.polls == true){

        pos_settings = set.on_polls;

        //if not valid page exit early
    }else if(set.video == true){

        pos_settings = set.on_video;

        //if not valid page exit early
    }else {
        return;
    }

    //if not at least 1180 pixels wide exit early
    var winWidth = $(window).width();
    if( winWidth <= 1180 ){
        return;
    }

    var timeout = null;
    var reset = pos_settings.reset+set.container_top;
    var container_top = set.container_top;
    var cookie = set.leaderboard_cookie;

    $(window).scroll(function (event) {

        clearTimeout(timeout);

        timeout = setTimeout(function() {
            if(!readCookie(cookie)){

                var topPos  = $(this).scrollTop();
                var position = ( ( $(window).width() - $('#container').width() ) / 2) + $('.beta').width() + 90;

                //if top pass the container top reset the ad to the top of the page
                if(topPos <= container_top){

                    //remove all classes to reset ad to the top of the page to orinal position
                    $(set.top_banner_ad_el).removeClass(set.fixed_class)
                        .removeClass(set.top_pos_class)
                        .removeClass(set.hide_class)
                        .css({'right': 'initial'});

                    //if passed the container top position and below reset then fix the ad
                }else if(topPos > container_top && topPos < reset){

                    $(set.top_banner_ad_el).removeClass(set.hide_class);

                    //fix add to top if not already done so
                    if( !$(set.top_banner_ad_el).hasClass(set.fixed_class) ){

                        $(set.top_banner_ad_el).addClass(set.fixed_class);
                        //.css({'right' : position+'px'});

                        //if tynt ad on page then fix to top
                        if( $(set.tynt_check).length > 0 && !$(set.top_banner_ad_el).hasClass(set.top_pos_class) ){
                            $(set.top_banner_ad_el).addClass(set.top_pos_class);
                        }
                    }

                    //Using current jquery structure to adjust ad position based to screen size
                    if(winWidth > 1179 && winWidth < 1281 && $("body.article").length > 0)
                    {
                        $(set.top_banner_ad_el).css({'right' : 439+'px', 'margin-right' : '7px'});

                    }else if(winWidth > 1279 && $("body.article").length > 0)
                    {
                        $(set.top_banner_ad_el).css({'right' : 'auto', 'margin-right' : '41px'});
                    }else if(winWidth > 1279 && winWidth < 1300 && $("body.article").length > 0)
                    {
                        $(set.top_banner_ad_el).css({'right' : 451+'px'});

                    }else{
                        $(set.top_banner_ad_el).css({'right' : position+'px'});
                    }
                    //$(set.top_banner_ad_el).css({'right' : position+'px'});

                    //if passed the reset position then hide it
                } else if(topPos >= reset){

                    $(set.top_banner_ad_el).addClass(set.hide_class);

                }

            }

            if(set.scroll_hooks.length > 0){
                //call other functions dynamically that are hook into the on scroll event
                for (var i = 0; i < set.scroll_hooks.length; i++) {
                    window[set.scroll_hooks[i]]();
                }
            }

        }, 10);

    }).scroll();

    if(set.hooks.length > 0){
        //call other functions dynamically that are hook into the on scroll event
        for (var i = 0; i < set.hooks.length; i++) {
            window[set.hooks[i]]();
        }
    }
}

var rightColumnStickyOnScroll = function(){

    if( SITE_INFO['name'] != "markets" ){
        //if standard article OR polls page - all verticals - float rightrail ad-box-top ad on scroll
        if(
            ( $('body.article').length > 0 && $('div.beta div').first().hasClass('RC-AD-BOX-TOP') )
            || ( $('body.polls').length > 0 )
            || ( $('body.maps').length > 0 )
            || ( $('body.live_results').length > 0 )
            || ( $('body.video').length > 0 )
        ){

            /**
             * A.A. code to make the right column sticky and then scrollable
             */

            var scroll_distance = 400;
            if($('body.polls').length || $('body.maps').length) {
                scroll_distance = 300;
            }

            var sticky_base_class = 'sticky-right-col';
            $('.beta').wrapInner("<div class='"+sticky_base_class+"'></div>");

            var sticky_el = '.'+sticky_base_class;
            var beta_top_st = $('.beta').offset().top;
            var distroscale_div = "#ds_cpp";

            $(window).on('scroll', function(event){

                var w_top = $(this).scrollTop();

                if( w_top < beta_top_st ){

                    $(sticky_el).removeClass('scroll');
                    $(sticky_el).css('margin-top', '0px');

                }else if( w_top > beta_top_st && w_top < (beta_top_st + scroll_distance) ){

                    $(sticky_el).addClass('scroll');
                    $(sticky_el).removeClass('stop');
                    if( $(sticky_el).parent().find(distroscale_div).length > 0 ){
                        $(sticky_el).css('margin-top', '592px');
                    }else{
                        $(sticky_el).css('margin-top', '0px');
                    }

                }else if( w_top > (beta_top_st + scroll_distance) ){

                    $(sticky_el).addClass('stop');
                    if( $(sticky_el).parent().find(distroscale_div).length > 0 ){
                        $(sticky_el).css('margin-top', '0px');
                    }else{
                        $(sticky_el).css('margin-top', scroll_distance+'px');
                    }
                }
            });

        }
    }
}

var backToTopIcon = function(){
    //BACK TO TOP
    if($('body').hasClass('article')){

        //this will only get executed only and only if the body has a class of article it
        $('body').append('<div class="back-to-top"><img title="Scroll To Top" src="/asset/img/backToTop.png" /></div>');

        var backToTop = function(){
            var scrollTrigger = 300;

            var scrollTop = $(window).scrollTop();

            if(scrollTop > scrollTrigger){
                $('.back-to-top').addClass('show');
            } else{
                $('.back-to-top').removeClass('show');

            }
        }

        backToTop();
        $(window).on('scroll',function(){
            backToTop();
        })

        $('.back-to-top').on('click', function(e){
            e.preventDefault();
            $('html, body'). animate({
                scrollTop:0
            }, 700);
        });
    }
}

// Another floating ads class... may be redundant? /////////////////////////////

function floatingAds(p_enabledAds, p_banner, p_box_top, p_banner_big, p_mobile_box_top){

    //add the sitename to the body tag to target css on differences between sites
    if( SITE_INFO['name'] && !$('body').hasClass(SITE_INFO['name']) ){
        $('body').addClass(SITE_INFO['name']);
    }

    var getBannerHidePoint = function(){
        
        var $ora = $('#oracontainer');

        if($ora.length == 0 || $ora.height() == 0){
            return 985;
        }

        var top = $ora.offset().top;
        var height = $ora.height();
        
        return top+height;
    }

    // possible to pass these as false to turn off ad transitions
    var enabledAds = {
        banner: true,
        box_top: true,
        big_banner: true,
        mobile_box_top: true,
    };
    p_enabledAds = p_enabledAds || {};
    $.extend(true, enabledAds, p_enabledAds);

    var banner = {
        tag: '.RC-AD-TOP-BANNER',
        cookie: 'rc-ad_rc-ad-top-banner_sticky-banner_close-ad',

        triggerPoint: 10,//point at which ad will become fixed
        hidePoint: getBannerHidePoint(), //point at which ad will slide up and hide

        sticky: 'sticky-banner', //class causes the banner to stick to the top
        slideUp: 'banner-slide-up', //class causese the sticky banner to slide up
        has_tynt: 'has-tynt-ad',
        tynt_class: '.tynt-ad-fence',

        adHidden: false, //flag for big banner to know when to show up
    };
    p_banner = p_banner || {};
    $.extend(true, banner, p_banner);

    var box_top = {
        init: false,//after initial setting up of the DOM, this is true

        tag: '.RC-AD-BOX-TOP',
        beta: '.beta-container .beta',
        beta_top: 0,//will trigger fixPos class once the beta top position is scrolled
        //trigger: 600//how long to make the beta column to be fixed, then it will be absolute positioned
        trigger: 360,//how long to make the beta column to be fixed, then it will be absolute positioned

        adHeight: 0,//needed to so some calculations

        fixPos: 'fix-box-top',//added to beta column to make it fixed so it scrolls with the user
        absPos: 'abs-box-top',//added to beta column after fixed to make it absolute positioned, not used anymore
        relPos: 'rel-box-top',//added to beta column after fixed to make it relative positioned
    };
    p_box_top = p_box_top || {};
    $.extend(true, box_top, p_box_top);

    var rightColPadding = 34;
    if( $('#container').width() == 1280 ){
        rightColPadding = 134;
    }

    var banner_big = {
        init: false,//set to true when initial DOM setup is done

        adWrapper: 'banner-big-wrapper',//wraps banner add with div with this class
        adContainer: '.top-bannerx',//the ad container div
        ad: '.RC-AD-TOP-BANNER-BIG',//the ad div element class

        // these two are calculated on the fly but set with innitial to
        // do the math before the ad is loaded in yet
        adHeight: 90,
        adWidth: 970,

        // this the selector and top position of it
        // where the big banner will be hidden
        hideEl: '#hpstreams',
        hidePoint: 0,
        hasCloser: false,
        rightColPadding: rightColPadding,
    };
    p_banner_big = p_banner_big || {};
    $.extend(true, banner_big, p_banner_big);

    var mobile_box_top = {
        init: false,

        tag: '.RC-AD-BOX-TOP',

        wrapperTag: 'top-ad-wrapper-mobile',
        containerTag: 'top-ad-container-mobile',
        adDiv: 'top-ad-div',

        adEl: null,

        adHeight: 0,
        adWidth: 0,
        adBottom: 0,

        hidePoint: 500,
    };
    p_mobile_box_top = p_mobile_box_top || {};
    $.extend(true, mobile_box_top, p_mobile_box_top);

    return {

        pos:{
            top: 0,
            width: 0,

            gamma_left: 0,
            gamma_right: 0,
            gamma_width: 0,

            alpha_left: 0,
            alpha_width: 0,
            alpha_right: 0,
        },

        enabledAds: enabledAds,

        activeAds: {
            banner: false,
            box_top: false,
            big_banner: false,
            mobile_box_banner: false,
            tynt: false,
        },

        ads:{
            banner: banner,
            box_top: box_top,
            banner_big: banner_big,
            mobile_box_top: mobile_box_top,
            tynt: {
                found: false,
                ora_select: '#oracontainer',
                tynt_select: 'iframe.placement-fixed-footer',
                ora_bot_pos: 0,
                tynt_top_top: 0,
            },
        },

        timeoutID:0,

        /**
         * ENTRY POINT TO START LISTENER AND AD SETTINGS
         */
        init: function(){
            this.updateScrollValues();

            if(this.enabledAds.box_top == true){
                this.initBoxTop();
            }

            if(this.enabledAds.big_banner == true && $(this.ads.banner_big.hideEl).length > 0){
                console.log('initBitBanner');
                this.initBigBanner();
            }

            if(this.enabledAds.mobile_box_top == true){
                this.initMobileBoxTop();
            }

            this.setListeners();
        },

        /**
         * SETS WINDOW LISTENERS FOR SCROLL
         */
        setListeners: function(){

            $( window ).scroll(function(event){

                this.checkForTynt();
                this.scrollBack(event);

            }.bind(this));

            $(window).scroll();
        },

        /**
         * Check if tynt is on the page and set a class on it to transition it
         */
        checkForTynt: function(){

            // placement-fixed-footer spout-mode- spout-show
            if( this.ads.tynt.found == false 
                && $(this.ads.tynt.ora_select).length > 0 
                && $(this.ads.tynt.tynt_select).length > 0 ){
                $(this.ads.tynt.tynt_select).css({'transition': 'transform .25s ease-in-out'});
                this.ads.tynt.found = true;
            }
            
        },

        /**
         * THE SCROLL EVENT TRIGGERS THIS FUNCTION
         * IT HAS A TIMEOUT TO MAKE PERFORMANCE AS BEST AS POSSIBLE
         */
        scrollBack: function(event){

            clearTimeout(this.timeoutID);

            this.timeoutID = setTimeout(function(){
                this.updateScrollValues(event);
                this.parseAdsPositions();
            }.bind(this), 10);
        },

        /**
         * AFTER TIME OUT IN scrollBack() EXPIRES THIS IS TRIGGERED
         * UPDATES DIMENSIONS USED BY ALL AD POSITIONING CALCULATIONS
         */
        updateScrollValues: function(event){

            this.pos.top = window.pageYOffset;
            this.pos.width = window.innerWidth;

            if( $('.gamma').length > 0 ){
                this.pos.gamma_left = $('.gamma').offset().left;
                this.pos.gamma_width = $('.gamma').width();
                this.pos.gamma_right = this.pos.gamma_left + this.pos.gamma_width;
            }

            if( $('.alpha').length > 0 ){
                this.pos.alpha_left = $('.alpha').offset().left;
                this.pos.alpha_width = $('.alpha').width();
                this.pos.alpha_right = this.pos.alpha_left + this.pos.alpha_width;
            }

            if(this.pos.width >= 768 && this.enabledAds.box_top == true){

                this.ads.box_top.adHeight = $('.beta '+this.ads.box_top.tag+' > div').height();
            }

            if(this.pos.width >= 1400 && this.enabledAds.big_banner == true){

                // this.ads.banner_big.adHeight = $(this.ads.banner_big.ad+' > div').height() || 90;
                this.ads.banner_big.adHeight = $(this.ads.banner_big.ad+' > div:nth-child(2)').height() || 90;

                this.ads.banner_big.adWidth = $(this.ads.banner_big.ad+' > div:nth-child(2) ').width() || 970;

                if( $(this.ads.banner_big.hideEl).length > 0 ){
                    this.ads.banner_big.hidePoint = $(this.ads.banner_big.hideEl).offset().top + 225;
                }
            }

            if(this.pos.width < 768 && this.enabledAds.mobile_box_top == true ){

                if(!this.ads.mobile_box_top.adEl || this.ads.mobile_box_top.adEl == null){
                    this.ads.mobile_box_top.adEl = $('div.alpha div'+this.ads.mobile_box_top.tag);
                }

                this.ads.mobile_box_top.adHeight = $(this.ads.mobile_box_top.adEl).height();
                this.ads.mobile_box_top.adWidth = $(this.ads.mobile_box_top.adEl).width();

            }

            if( this.ads.tynt.found == true ){
                this.ads.tynt.ora_bot_pos = $(this.ads.tynt.ora_select).offset().top + $(this.ads.tynt.ora_select).height();
                this.ads.tynt.tynt_top_top = $(this.ads.tynt.tynt_select).offset().top;
            }
        },

        /**
         * AFTER EVERY CALL TO UPDATE SCROLL VALUES THIS IS TRIGGERED
         * RUNS THE FUNCTIONS TO UPDATE THE AD POSITIONING
         */
        parseAdsPositions: function(){

            if(this.pos.width >= 768 && this.enabledAds.box_top == true){
                this.parseBoxTop();
            }

            if(this.pos.width >= 768 && this.enabledAds.banner == true){
                this.parseBannerAd();
            }

            if(this.pos.width >= 1300 && this.enabledAds.big_banner == true){
                this.parseBigBanner();
            }

            if(this.pos.width < 768 && this.enabledAds.mobile_box_top == true){
                this.parseMobileBoxTop();
            }

            if( this.ads.tynt.found == true ){
                this.parseTyntAd();
            }
        },

        /**
         * If above ora video container then hide it
         * Else show it
         */
        parseTyntAd: function(){

            this.activeAds.tynt = true;

            if( (this.ads.tynt.tynt_top_top - 100) <= this.ads.tynt.ora_bot_pos){
                var height = $(this.ads.tynt.tynt_select).height();
                $(this.ads.tynt.tynt_select).css({'transform': 'translateY('+height+'px)'});
            }else{
                $(this.ads.tynt.tynt_select).css({'transform': 'translateY(0px)'});
            }
        },

        /**
         * POSIONS LOCATION OF THE LEADERBOARD BANNER AD
         */
        parseBannerAd: function(){

            if(readCookie(this.ads.banner.cookie)){
                return;
            }

            this.activeAds.banner = true;

            var triggerPoint = this.ads.banner.triggerPoint;

            var tag = this.ads.banner.tag;

            var sticky = this.ads.banner.sticky;
            var slideUp = this.ads.banner.slideUp;

            var hidePoint = this.ads.banner.hidePoint; 

            var has_tynt = this.ads.banner.has_tynt;
            var tynt_class = this.ads.banner.tynt_class;

            var pos = this.pos;

            //if tynt add class that allows the add to move to the top of the page
            if( $(tynt_class).length > 0 && !$(tag).hasClass(has_tynt) ){
                $(tag).addClass(has_tynt);
            }

            if( pos.top < triggerPoint ){

                $(tag).css({'left': 'auto'});
                $(tag).css({'margin-left': 'auto'});

                if( $(tag).hasClass(sticky) ){
                    $(tag).toggleClass(sticky);
                }

                if( $(tag).hasClass(slideUp) ){
                    $(tag).toggleClass(slideUp);
                }

            }else if( pos.width >= 768 && ( pos.top > triggerPoint && pos.top < hidePoint ) ){

                var mid_positon = (pos.alpha_width + pos.gamma_width - 688) / 2;
                //console.log(mid_positon);

                $(tag).css({'left': this.pos.gamma_left+'px'});
                $(tag).css({'margin-left': mid_positon+'px'});

                if( !$(tag).hasClass(sticky) ){
                    $(tag).toggleClass(sticky);
                }

                if( $(tag).hasClass(slideUp) ){
                    $(tag).toggleClass(slideUp);

                    $('li.top-left').addClass('skyscraper-ad');
                    $('li.top-right').addClass('skyscraper-ad');

                    $('.skyscraper-ad').css({'transform': 'translateY(0px)'});
                    this.ads.banner.adHidden = false;
                }

            }else if( pos.width >= 768 && pos.top >= hidePoint ){


                if( !$(tag).hasClass(slideUp) ){
                    $(tag).toggleClass(slideUp);

                    $('li.top-left').addClass('skyscraper-ad');
                    $('li.top-right').addClass('skyscraper-ad');

                    $('.skyscraper-ad').css({'transform': 'translateY(-650px)'});
                    this.ads.banner.adHidden = true;
                }

            }
        },

        /**
         * BOX TOP AD ON RIGHT COL NEEDS INITIAL SETUP
         * THIS TRIGGERS THE CODE NEEDED TO MAKE THE RIGHT COLUMN POSITIONING WORK
         */
        initBoxTop: function(){

            if( this.ads.box_top.init == false && this.pos.width >= 768 ) {

                var beta = this.ads.box_top.beta;

                $(beta).addClass('clearfix');
                this.ads.box_top.beta_top = $(beta).offset().top;
                this.ads.box_top.init = true;
            }
        },

        /**
         * ONCE INIT FOR BOX TOP RUNS THIS WILL UPDATE THE RIGHT COLUMN POSITIONING
         */
        parseBoxTop: function(){

            if(this.pos.width >= 768 && this.ads.box_top.init == true){

                this.activeAds.box_top = true;

                var theAd = this.ads.box_top.tag;
                var beta = this.ads.box_top.beta;
                var beta_top = this.ads.box_top.beta_top;

                var trigger = this.ads.box_top.trigger;
                var adHeight = this.ads.box_top.adHeight;

                var fixPos = this.ads.box_top.fixPos;
                // var absPos = this.ads.box_top.absPos;
                var relPos = this.ads.box_top.relPos;


                var triggerPoint = beta_top + trigger;

                var currentPoint = this.pos.top;
                //console.log(currentPoint+' < '+triggerPoint);

                if(currentPoint < beta_top){

                    $(beta).removeClass(fixPos);

                }else if( currentPoint >= beta_top ){

                    $(beta).addClass(fixPos);

                    if(currentPoint < triggerPoint){

                        $(beta).removeClass(relPos).css({'margin-top': 'initial'});

                    }else{

                        $(beta).addClass(relPos).css({'margin-top': trigger+'px'});

                    }

                }
            }
        },

        /**
         * BIG BANNER NEEDS INITIAL SETUP TO BECOME FIXED AT BOTTOM OF PAGE
         */
        initBigBanner: function(){

            if( this.pos.width >= 1400 ){

                var banner_big =  this.ads.banner_big;

                var adContainer = banner_big.adContainer;
                var adWrapper = banner_big.adWrapper;

                var adHeight = banner_big.adHeight;
                var ad = banner_big.ad;
                var $this = this;

                $(adContainer).wrapAll('<div class="'+adWrapper+'" />');

                $('.'+adWrapper).addClass('clearfix');

                $(ad).css({'transform': 'translateY('+adHeight+'px)'});

                //on clicking the corner X, slide the ad out and then display none so it doesn't appear again
                $('.'+adWrapper).on('click', '.banner-big-close', function(){
                    $this.activeAds.big_banner = false;

                    $(ad).css({'transform': 'translateY(600px)'});
                    createCookie('big_banner_manual_close', 'Clicked on big banner ad custom close x', 12, true);

                    setTimeout(function(){
                        $('.'+adWrapper).css({'display': 'none'});
                    }, 250);

                });

                // // Allow the code above to remove the image from the masthead
                // // But don't show the ad if the cookie exists
                var cookie = readCookie('big_banner_manual_close');
                if(cookie){

                    this.ads.banner_big.init = false;
                    $(this.ads.banner_big.ad).hide();
                    console.log('Big banner cookie found: '+cookie);
                    return;

                }else{

                    this.ads.banner_big.init = true;
                }
            }
        },

        /**
         * AFTER INIT FOR BIG BANNER THIS WILL UPDATE THE POSITIONING OF IT
         */
        parseBigBanner: function(){

            if(this.enabledAds.big_banner === true && this.ads.banner_big.init === true){

                this.activeAds.big_banner = true;

                var adHeight = this.ads.banner_big.adHeight;

                var alpha_left = this.pos.alpha_left + this.ads.banner_big.rightColPadding;

                var adWrapper = '.'+this.ads.banner_big.adWrapper;
                var adContainer = this.ads.banner_big.adContainer;
                var ad = this.ads.banner_big.ad;
                var hasCloser = this.ads.banner_big.hasCloser;

                //if the banner ad is disabled, check where it would normally be triggered
                //and update the adHidden value before checking if the big banner should show up
                if(this.enabledAds.banner == false){

                    // this.ads.banner.hidePoint
                    if(this.pos.top >= ( getBannerHidePoint() - window.innerHeight + $('#oracontainer').height() + 20 ) ){

                        this.ads.banner.adHidden = true;

                    }else{

                        this.ads.banner.adHidden = false;
                    }
                }

                //hide big banner if banner leaderboard is shown
                if(this.ads.banner.adHidden == false){

                    $(ad).css({'transform': 'translateY('+parseInt(adHeight+30)+'px)', 'visibility': 0});
                    $(adWrapper).css({'visibility': 'collapse'});

                    //$(adContainer).css({'visibility': 'collapse'});
                    $(adContainer).hide();

                    //show/hide big banner if leaderboard is hidden
                }else if(this.ads.banner.adHidden == true){

                    var top             = this.pos.top;
                    var hidePoint       = this.ads.banner_big.hidePoint;
                    var currentPoint    = top + window.innerHeight; //determines how far down to scroll the ad with the page

                    //show big banner
                    if(currentPoint < hidePoint){

                        if(hasCloser == false){
                            /*setTimeout(function(){
                $(ad).prepend('<div class="x-marks-the-spot banner-big-close "></div>');
              }, 2000);*/
                            $(adWrapper).prepend('<div class="x-marks-the-spot banner-big-close "></div>');
                            this.ads.banner_big.hasCloser = true;
                        }

                        $(ad).css({'transform': 'translateY(0px)','visibility': 'inherit', 'visibility': 'initial'});

                        //$(adContainer).css({'visibility': 'inherit', 'visibility': 'initial'});
                        $(adContainer).show();

                        $(adWrapper).css({'right': alpha_left+'px','visibility': 'inherit', 'visibility': 'initial'});

                        //hide big banner further down the page after hide point is passed
                    }else{

                        $(ad).css({'transform': 'translateY('+parseInt(adHeight+30)+'px)', 'visibility': 'collapse'});
                        $(adWrapper).css({'visibility': 'collapse'});

                        //$(adContainer).css({'visibility': 'collapse'});
                        $(adContainer).hide();
                    }
                }

            }
        },

        /**
         * MOBILE BOX TOP AD NEEDS INITIAL SETUP TO BE FIXED AT BOTTOM OF SCREEN
         */
        initMobileBoxTop: function(){

            if(this.ads.mobile_box_top.init == false && this.pos.width < 768){

                var cookie = readCookie('mobile_box_top');
                if(cookie){
                    console.log('Mobile box top cookie found: '+cookie);
                    $('.date-menu img').css({'padding-top': '20px'});
                    return;
                }

                $('.date-menu img').css({'padding-top': '10px !important'});

                if(!this.ads.mobile_box_top.adEl || this.ads.mobile_box_top.adEl == null){
                    this.ads.mobile_box_top.adEl = $('div.alpha div'+this.ads.mobile_box_top.tag);
                }

                var adHeight = this.ads.mobile_box_top.adHeight;
                var adWidth = this.ads.mobile_box_top.adWidth;

                if(!adHeight || adHeight == 0){
                    this.updateScrollValues();
                    adHeight = this.ads.mobile_box_top.adHeight;
                    adWidth = this.ads.mobile_box_top.adWidth;
                }
                console.log('adHeight: '+adHeight);
                console.log('adWidth: '+adWidth);

                var theAd = this.ads.mobile_box_top.tag;
                var wrapperTag = this.ads.mobile_box_top.wrapperTag;
                var containerTag = this.ads.mobile_box_top.containerTag;
                var adDiv = this.ads.mobile_box_top.adDiv;


                console.log(this.ads.mobile_box_top.adEl);
                $(this.ads.mobile_box_top.adEl).appendTo("body");

                $(this.ads.mobile_box_top.adEl).wrapAll('<div class="'+wrapperTag+'" />');
                $(this.ads.mobile_box_top.adEl).wrapAll('<div class="'+containerTag+'" />');
                $(this.ads.mobile_box_top.adEl).wrapAll('<div class="'+adDiv+'" />');
                console.log('wrappers');

                $('.'+wrapperTag).addClass('clearfix');
                $('.'+containerTag).addClass('clearfix');
                $('.'+adDiv).addClass('clearfix');

                $('.'+adDiv).prepend('<div class="x-marks-the-spot mobile-box-top-close "></div>');


                var margin_left = (this.pos.width - adWidth) / 2;
                $(this.ads.mobile_box_top.adEl).css({'margin-left': margin_left+'px'});

                this.updateScrollValues();

                this.ads.mobile_box_top.init = true;

                this.parseMobileBoxTop();

                //on clicking the corner X, slide the ad out and then display none so it doesn't appear again
                $('.'+wrapperTag).on('click', '.mobile-box-top-close', function(){

                    console.log('clicked');
                    $('.'+adDiv).css({'transform': 'translateY(300px)'});
                    createCookie('mobile_box_top', 'clicked on mobile ad close x', 1);

                    setTimeout(function(){
                        $('.'+wrapperTag).css({'display': 'none'});
                    }, 250);

                });
            }
        },

        /**
         * AFTER INIT FOR MOBILE BOX TOP THIS WILL REPOSITION IT
         */
        parseMobileBoxTop: function(){

            if(this.ads.mobile_box_top.init == true){

                this.activeAds.mobile_box_top = true;

                var adHeight = this.ads.mobile_box_top.adHeight;
                var adWidth = this.ads.mobile_box_top.adWidth;
                var hidePoint = this.ads.mobile_box_top.hidePoint;
                var adDiv = this.ads.mobile_box_top.adDiv;
                var wrapperTag = this.ads.mobile_box_top.wrapperTag;

                if(!adHeight || adHeight == 0){
                    this.updateScrollValues();
                    adHeight = this.ads.mobile_box_top.adHeight;
                }

                var margin_left = (this.pos.width - adWidth) / 2;
                $(this.ads.mobile_box_top.adEl).css({'margin-left': margin_left+'px'});

                if(this.pos.top < hidePoint){

                    $(wrapperTag).css({'visibility': 'inherit', 'visibility': 'initial'});
                    $('.'+adDiv).css({'transform': 'translateY(0px)', 'visibility': 'inherit', 'visibility': 'initial'});

                }else{

                    $(wrapperTag).css({'visibility': 'collapse'});
                    $('.'+adDiv).css({'transform': 'translateY(300px)', 'visibility': 'collapse'});
                }
            }
        },

    };
}











////////////////////////////////////////////////////////////////////////////////
// ADS FUNCTIONS ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function init_comscore(){
    var script = document.createElement('script');
    script.src = '//a.pub.network/core/fscomscore.js';
    script.setAttribute('data-cfasync', 'false');
    document.head.appendChild(script);
}

/**
 * Load dynamically the JS needed to refresh ads
 */
function load_ad_refresh_js(){

    var script = document.createElement('script');
    
    script.onload = function () {    
        auto_refresh_ads_service();
    };

    script.src = '/asset/top/refresh_ads.js?v=1.2';
    document.head.appendChild(script);
}

function loadAds() {

    // console.log('admiral all_ads_disabled: '+(typeof all_ads_disabled));
    // console.log('admiral evolok_init_finished: '+evolok_init_finished);
    // console.log('admiral evolok_do_ads: '+evolok_do_ads);
    // console.log('admiral evolok_block_ads: '+evolok_block_ads);
    // console.log('admiral allow_ad_render: '+allow_ad_render);
    // console.log('admiral network_ads_loaded: '+network_ads_loaded);

    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        console.log("ADMIRAL allAds all_ads_disabled");
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads && !evolok_block_ads) {
            console.log("ADMIRAL allAds !evolok_block_ads", evolok_block_ads);
            // Just skip and wait for next function call for a status change
            return;
        } else if(evolok_block_ads) {
            console.log("ADMIRAL allAds evolok_block_ads", evolok_block_ads);
            return;
        }

        // Otherwise go ahead and do ads
    }

    if(!allow_ad_render) {
        console.log("ADMIRAL allAds allow_ad_render", allow_ad_render);
        return;
    }

    if(network_ads_loaded) {
        console.log("ADMIRAL allAds network_ads_loaded", network_ads_loaded);
        return;
    }

    if( typeof timer_ad_load !== 'undefined' ){
        var timer_now = (new Date()).getTime() / 1000;
        console.trace('ADMIRAL TIMER - '+(timer_now - window.timer_ad_load)+' sec - loadAds() successfully run');
    }

    network_ads_loaded = true;

    // Track how many page hits by users in their two-week adfree trial
    if( readCookie('two_weeks_adfree') ){

        check_send_ga_loaded = setInterval(function(){
            if( typeof send_notifier_event == 'function' ){
                var onload_adfree_user_data = {
                    'ge_action' : 'Page Load No Ads',
                    'ge_category' : 'Two Weeks Ad-Free Promo',
                    'ge_label' : 'Adblock User Subscribed to Newsletter',
                    'ge_index' : null,
                    'ge_noninteraction' : true
                };
                send_notifier_event(onload_adfree_user_data);

                clearInterval(check_send_ga_loaded);
            } //if func() exists check
        }, 250); //2.5 Second Intervals

        return false;
    }

    if(SITE_INFO['name'] == 'markets' && !NO_IC) {

        investingChannel_init();
        return;

    }


    // TRIGGER HOMEPAGE FLOATING ADS CODE
    if( $("body").hasClass("home") ){

        if( SITE_INFO['name'] == 'politics' ){
            var isMobile = $().isMobile();
            if(!(isMobile)){ //ONLY DESKTOP/TABLET we float ads

                var adOpts = {};

                if( $('body').hasClass('with-distroscale') || $('body').hasClass('with-ora') ){
                    adOpts.banner = false;
                }

                adOpts.box_top = false;

                window.floatAds = new window.floatingAds(adOpts);
                window.floatAds.init();
            }

        }else if(SITE_INFO['name'] == 'defense'){

            // window.floatAds = new window.floatingAds({mobile_box_top: false});
            // window.floatAds.init();
        }

    }

    if( LAZY_ADS_ENABLED ) {
        start_lazy_ads();
    } else {
        normal_ads_load();
    }
}

function start_lazy_ads() {

    console.log("ADMIRAL: start_lazy_ads");

    // Show all ads that are marked with class .RC-AD-SHOW-NOW instead of .RC-AD
    var show_now_elements = document.querySelectorAll('.RC-AD-SHOW-NOW');

    for (i=0; i < show_now_elements.length; i++) {

        var show_now = show_now_elements[i];

        for (var ad_slot in ads_info) {
            if (ads_info.hasOwnProperty(ad_slot)) {

                if( !ads_info[ad_slot]['loaded'] &&
                    hasClass(show_now, ads_info[ad_slot]['class']) &&
                    isVisible(show_now) ) {

                    lazy_ad_list.push(ad_slot); // adds ad to list of ads to render (if ready)
                    ads_info[ad_slot]['loaded'] = true;
                }
            }
        }
    }

    if(show_now_elements.length>0){
        //REVERSE ORDER OF SHOW-NOW ADS - IN ORDER FOR ABF ADS TO LOAD FIRST        
        lazy_ad_list.reverse();
    }    

    // We push ad slots to a list. This is because the above-the-fold ads may be
    // visible to lazyload library before our publir prebid is ready
    document.addEventListener('lazybeforeunveil', function(e) {

        console.log("ADMIRAL lazybeforeunveil", e);

        for (var ad_slot in ads_info) {
            if (ads_info.hasOwnProperty(ad_slot)) {

                if( !ads_info[ad_slot]['loaded'] &&
                    hasClass(e.target, ads_info[ad_slot]['class']) &&
                    isVisible(e.target) &&
                    !hasClass(e.target, '.RC-AD-SHOW-NOW') ) {

                    console.log('ad pushed into ad render list');

                    // Record of all ad slots that have been visible to user
                    lazy_ad_list.push(ad_slot); // adds ad to list of ads to render (if ready)
                    ads_info[ad_slot]['loaded'] = true;
                    break;
                }
            }
        }
    });

    window.lazySizes.init(); // Initializes lazysizes manually right now

    // moved here to only call once instead on every ad render
    googletag.cmd.push(function () {
        console.log("ADMIRAL CALL INIT GOOGLE TAG");
        init_googletag();
    });

    console.log("ADMIRAL lazy_ad_list", lazy_ad_list);

    var lazy_ad_interval = window.setInterval(function() {

        // console.log("ADMIRAL ads setInterval, lazy_ad_list", lazy_ad_list.length, lazy_ad_list);

        //console.log('lazy check... length: '+lazy_ad_list.length);

        if( lazy_ad_list.length == 0 || !allow_ad_render || browser_tab_is_visible == false) {
            return;
        }

        // Find first ad_slot that is actually visible on screen and load
        // In theory this shouldn't be neccessary... not sure why lazysizes is getting false positives sometimes

        var target_ad_i = lazy_ad_list.length - 1;
        var match_found = false;

        for (var i = 0; i < lazy_ad_list.length; i++) {

            var ad_elem = firstVisibleElement('.'+ads_info[lazy_ad_list[i]]['class']); // first visible element

            //if( ad_elem == null || !isVisibleOnScreen(ad_elem) ) { // must be visible on screen
            if( ad_elem == null ) { // must have match
                continue;
            } else {
                target_ad_i = i;
                match_found = true;
            }
        }

        if( !match_found ) {
            return; // Don't do unless truly visible on screen
        }

        // Removes and returns ad name from stack that has been accumulating
        var temp_ad_slots = lazy_ad_list.splice(target_ad_i, 1);
        var ad_slot = temp_ad_slots[0];

        if(ad_slot){

            console.log("ADMIRAL load ad_slot", ad_slot);

            googletag.cmd.push(function () {

                // moved above to only call once
                // init_googletag();

                //// Create and serve prebid ad
                rcmg_load_ad(ad_slot, 'lazy');
            });
        }

    }, 50); // Checks every 50 milliseconds
}

function rcmg_load_ad(ad_slot, load_type) {

    console.log("ADMIRAL rcmg_load_ad: ", ad_slot, load_type);

    if(typeof load_type === 'undefined') { load_type = 'normal'; }// Get only first visible element that matches

    var ad_elem = firstVisibleElement('.'+ads_info[ad_slot]['class']); // first visible element
    //var ad_elem = document.querySelector('.'+ads_info[ad_slot]['class']); // default element is just first matching class
    if(ad_elem == null) {
        console.log('no container found for: '+ads_info[ad_slot]['class']);
        return; // no ad container found
    }
    /*var matches = document.querySelectorAll('.'+ads_info[ad_slot]['class']);
  for (var i = 0; i < matches.length; ++i) {
    if(isVisible(matches[i])) {
      ad_elem = matches[i];
      break;
    }
  }*/

    // If ad has been closed recently, do not load
    if( readCookie(ad_close_cookie_name(ad_elem)) ) {
        return;
    }

    // If investingchannel override, and on relevant site, put script tag in and return
    if( SITE_INFO['name'] == 'markets' && !NO_IC && typeof ads_info[ad_slot]['ic_override'] !== 'undefined' && ads_info[ad_slot]['ic_override'].length > 2 ) {


        return;

        /*if($('body').hasClass('new_ic_uat') ){
            return;
        }*/

        /*var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = ads_info[ad_slot]['ic_override'];
        s.charset = "utf-8"
        ad_elem.appendChild(s);
        return;*/
    }

    var slot_sizes = ads_info[ad_slot]['sizes'];

    /*custom filter for disallowed slot sizes on certain pages*/
    var filtered_slot_sizes = []; //
    slot_sizes.forEach(function (item, index) {
        /*DO NOT Allow 970s on top-leaderboard homepage placements */
        if(ads_info[ad_slot]['class']=='RC-AD-TOP-BANNER' && sitePage=='home' && item[0]=='728'){ //ONLY ALLOW 728 ON HOMEPAGE            
            filtered_slot_sizes.push(item);
        }

        var isMobile = $().isMobile();
        if(ads_info[ad_slot]['class']=='RC-AD-BOX-TOP' && isMobile==true && item[1]=='250' && (sitePage=='polls' || sitePage=='home') ){ //ONLY ALLOW 250 height ads on Polls or HP Mobile       
            filtered_slot_sizes.push(item);
        }     

    });

    if(filtered_slot_sizes.length>0){ slot_sizes = filtered_slot_sizes; } //IF FILTERED REPLACE DEFAULT VAR
    
    var new_slot = googletag.defineSlot(ads_info[ad_slot]['name'], slot_sizes, ad_slot).addService(googletag.pubads());
    ads_info[ad_slot].slot_definition = new_slot;

    console.log(ad_elem);
    //console.log(pbjs.adUnits);

    //ad_elem.innerHTML = "<div id='"+ad_slot+"'></div>";

    //keep track fo ad slot to check for height later
    let ad_item = {};

    ad_item['elem_class'] = ads_info[ad_slot]['class'];
    ad_item['prev_height'] = $(ad_elem).height();

    globalThis.elem.push(ad_item);

    // Use this method to append... so we don't overwrite any close button
    var new_ad_div = document.createElement('div');
    new_ad_div.id = ad_slot;
    ad_elem.appendChild(new_ad_div);

    // if( !PREBIDDING_ENABLED ){
    //     console.log('ADMIRAL NO PREBID DISPLAY SLOT');
        googletag.display(ad_slot);
    // }

    // console.log(ad_elem.innerHTML);

    if(load_type == 'lazy') {

        // After each ad, since lazy
        // But before unit refresh
        if(typeof window.moatAPI !== 'undefined') {
            window.moatAPI.init();
        }

        if(PREBIDDING_ENABLED) {
            console.log('ADMIRAL PREBID ENABLED');

            /*
        pbjs.que.push(function() {
            pbjs.setTargetingForGPTAsync();
            googletag.pubads().refresh([ new_slot ]);
        });*/

            pbjs.que.push(function() {
                pbjs.requestBids({
                    timeout: PREBID_TIMEOUT, //set by publir
                    adUnitCodes: [ad_slot],
                    bidsBackHandler: function() {
                        console.log('ADMIRAL PREBID DISPLAY SLOT');
                        pbjs.setTargetingForGPTAsync([ad_slot]);
                        googletag.display(ad_slot);
                        googletag.pubads().refresh([new_slot]);
                    }
                });
            });

        } else {
            console.log('loading lazy ad no prebid');
            if(SITE_INFO['name'] != 'markets' || NO_IC) {
                googletag.pubads().refresh([ new_slot ]);
            }
        }

    }

    setAdCloser(ad_slot);
    addStylesToAds();
}

// Global requirements: ads_info, googletag
function normal_ads_load() {

    console.log('normal_ads_load()');

    // Load ads normally
    googletag.cmd.push(function () {

        init_googletag();
        //try { amznads.setTargetingForGPTAsync('amznslots');} catch(e) { /*ignore*/}

        //googletag.pubads().collapseEmptyDivs(true);

        //googletag.pubads().refresh();

        for (var ad_slot in ads_info) {
            if (ads_info.hasOwnProperty(ad_slot)) {

                rcmg_load_ad(ad_slot);
            }
        }

        if(!PREBIDDING_ENABLED) {
            googletag.pubads().refresh();
        } else {
            pbjs.que.push(function() {
                pbjs.requestBids({
                    timeout: PREBID_TIMEOUT, //set by publir
                    bidsBackHandler: function() {
                        pbjs.setTargetingForGPTAsync();
                        googletag.pubads().refresh();
                    }
                });
            });
        }

    });
}

/**
 * Requirements: must be called within a googletag.cmd.push(function() {}) block
 * @see https://developers.google.com/doubleclick-gpt/reference
 */
function init_googletag() {

    console.log("ADMIRAL INIT GOOGLE TAG", googletag);

    googletag.pubads().setTargeting("SiteDomain", SITE_INFO['name']);
    googletag.pubads().setTargeting("SitePage", SITE_PAGE);
    googletag.pubads().setTargeting("Tags", GA_TAG);

    // Used to send keywords to google ads
    if(typeof DYNAMIC_GAM_KEYWORDS !== 'undefined') {
        eval("googletag.pubads().setTargeting('Keywords', DYNAMIC_GAM_KEYWORDS)");
    }

    googletag.pubads().addEventListener('slotRenderEnded', function(event) {
        var slot_path = event.slot.getAdUnitPath();
        console.log("ADMIRAL AD RENDERED", slot_path);
        //IF WE'RE LOADING A 970 ON POLLS DESKTOP WE MUST ADJUST CSS TO FIT PROPERLY
        if(slot_path=='/1004503/RC_728_by_90_top' && sitePage=='polls' && event.size[0]=='970'){                 
            $(".top-banner").css("overflow","visible");
            $(".RC-AD-TOP-BANNER").css("float","right");            
        }

        if(slot_path=='/1004503/RC_mobile'){
            var mobile_slot_id = event.slot.getSlotElementId();
            var mobile_element = document.getElementById(mobile_slot_id);               

            if(event.isEmpty){ //GAM lets us know if ad event is empty
                if(!$(mobile_element).parent().hasClass('noAd')){
                    $(mobile_element).parent().addClass('noAd');  
                }            
            }else{
                if($(mobile_element).parent().hasClass('noAd')){
                    $(mobile_element).parent().removeClass('noAd');  
                }                
            }
        }
        
        if(slot_path=='/1004503/RC_1_by_1_tynt' && event.lineItemId == '6131302515'){                 
            createCookie("show_dst_instead", "1", 30, false);
        }
        
        //set ad container min-height to reduce shifting page with incoming ad-refreshes        
        if(!event.isEmpty){
            renderedAdElement_id = event.slot.getSlotElementId();
            renderedAdElement = document.getElementById(renderedAdElement_id);            
            var parent = renderedAdElement.parentElement;
            var parent_class = '';
            var ad_loc_obj = {};

            // check for the ad spot that is not in the ads_info array
            if (!renderedAdElement_id.includes('div-gpt-ad')) 
            {
                var ad_loc_elem = parent.parentElement;
                var ad_loc_height = ad_loc_elem.clientHeight;
                var ad_loc_class = ad_loc_elem.getAttribute('class');
            }
            else 
            {
                parent_class = parent.getAttribute('class').split(' ');
            }

            // check if ad-location-1 is in the array
            globalThis.elem.forEach((el) => {
                if (el.elem_class == 'ad-location-1')
                {
                    is_ad_location = true;
                }
            })

            if(!is_ad_location)
            {
                ad_loc_obj['elem_class'] = ad_loc_class;
                ad_loc_obj['prev_height'] = ad_loc_height;

                globalThis.elem.push(ad_loc_obj);
            }

            // update the ad slot height if it changed from the previous ad
            globalThis.elem.forEach((el, index) => {
                if (el.elem_class == parent_class[0] && event.size[1] > el.prev_height)
                {
                    el.prev_height = event.size[1];
                    parent.style.height = event.size[1] + 'px';
                }

                if (el.elem_class == 'ad-location-1' && event.size[1] > el.prev_height)
                {
                    el.prev_height = event.size[1];
                    ad_loc_elem.style.minHeight = "0";
                    ad_loc_elem.style.height = event.size[1] + 'px';
                }
            });

            // console.log("SLOT PATH", slot_path);
            // trigger PA entries to show
            if( slot_path == '/'+AD_ID+'/RC_Lc' ){
                // console.log("SLOT PATH FOR LC TRIGGERED");
                $('.pa-post-wrapper').show();
            }
        }
        
        /**
         * Add ads to the refresh queueu after they've been rendered
         * && $.inArray(slot_path, ['/'+AD_ID+'/RC_mobile', '/'+AD_ID+'/RC_300_by_250_top', '/'+AD_ID+'/RC_728_by_90_top', '/'+AD_ID+'/RC_300_by_250_middle']) > -1
         */
        if( typeof add_to_refresh_queueu !== 'undefined' ){
            add_to_refresh_queueu(event);
        }

    });    
    
    googletag.pubads().disableInitialLoad();
    // googletag.pubads().collapseEmptyDivs(true);
    googletag.enableServices();
}

// Ad Closing //////////////////////////////////////////////////////////////////

function setAdCloser(ad_slot){

    //Check if the Ad should be closed
    if(shouldAdHaveCloser(ad_slot) == false) {
        return;
    }

    var interval_key = setInterval(function(){

        $el = $("." + ads_info[ad_slot]['class']);
        if($el.length > 0){

            clearInterval(interval_key);

            var closer = '<div class="close-the-ad">&times;</div>';

            if($el.hasClass('RC-AD-MOBILE-BANNER')){
                if( !$el.hasClass("noAd") ){ //we've determined ad slot is empty, no need for closer
                    $el.append(closer);
                }
            }else{
                $el.addClass('rc-ad-top-banner-reactive').append(closer);
            }

            //alert('here');

            $el.find('.close-the-ad').click(function() {
                // $(this).parent().parent().hide();
                // $(this).closest('.RC-AD').hide();

                // on closing ad, create a cookie based on the classes of the element
                // the cookie is to be used by anyone else needing to check for this
                //var ad_element = $(this).closest('.RC-AD');
                var ad_element = $(this).parent();
                var cookie_name = ad_close_cookie_name(ad_element);
                createCookie(cookie_name, $(ad_element).prop('nodeName')+'_'+cookie_name, 1);
                $(ad_element).hide();
            });
        }

    }, 1000);
}

function ad_close_cookie_name(ad_element) {

    return Utils.make_slug($(ad_element).attr('class')+'_close-ad');
}

/*Adding inline styles to Ad*/
function addStylesToAds(){

    $.each(ads_info, function( key, value){

        if(typeof value.styles !== 'undefined' && value.styles.length !== 0){
            $('.'+ value.class + '> div').css(value.styles);
        }

    });

}

//Check if ad Exist 11/15/2018
function shouldAdHaveCloser(ad_slot){

    var ad_option = ads_info[ad_slot];

    if(ad_option.closeable_pages.length == 0){
        return false;
    }

    for (let i = 0; i < ad_option.closeable_pages.length; i++) {

        var class_txt = ad_option.closeable_pages[i];
        if( $('body').hasClass(class_txt) ) {

            return true;
        }

    }
}

// Special Ad Vendors //////////////////////////////////////////////////////////

function loadGotChosen(){

    if( readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1 ) {
        console.log('ad_free exit loadGotChosen');
        return;
    }


    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }
    /*
    * 3rd party ads disabled
    * */
    if(typeof disable_3rd_party_ads !== 'undefined' && disable_3rd_party_ads === true){
        return
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }
    $has_comments = $('#comments-container').length;
    $is_polls = $('body.polls').length;

    if($has_comments > 0 || $is_polls > 0){



        if(!$('#gotChosen').length && SITE_INFO['gotchosen_id']!="" ){ //this is to prevent duplicated widgets being created

            gotChosenWidget();
        }
    }
}

function gotChosenWidget(){

    if($('body').hasClass('polls') && $('.alpha .writeup').length) {
        return; // disabled on "writeup" pages
    }

    if($('body').hasClass('polls') && $('body').attr('data-page') == 'rank') {
        return; // disabled on "rank" pages
    }

    $pos = $('body').attr('class');

    var data = {
        'ge_action' : 'Loaded',
        'ge_category' : 'Partner Widgets',
        'ge_label' : 'GotChosen : ' + $pos
    };

    //send_ga_event(data);

    if( !NO_IC ) {

        if($('body').hasClass('polls')){
            $('div.alpha').append('<div class="clear" style="margin-top:10px;"></div> <div class="ndn_article_body_title" style="display:none">Advertisement</div><div id="gotChosen"></div>');
        }else{
            $('#comments-container, #fb-comments-container').after('<div class="clear" style="margin-top:10px;"></div> <div class="ndn_article_body_title">Advertisement</div><div id="gotChosen"></div>');
        }
    }


    //Old Script
    // (function(e,t,n,r,i,s,o){e["GotChosenObject"]=i;e[i]=e[i]||function()
    // {(e[i].q=e[i].q||[]).push(arguments)},e[i].l=1*new
    // Date;s=t.createElement(n),o=t.getElementsByTagName(n)
    //     [0];s.async=1;s.src=r;o.parentNode.insertBefore(s,o)})
    // (window,document,"script","https://www.gotchosen.com/thirdparty/gc.js","gc");
    // gc("webcurtain", SITE_INFO['gotchosen_id'] , { widgets: { autoinstall: [ { type: 'carousel-multi', selector: '#gotChosen', insertion: 'into' } ] } });

    //New Script D.N - 5/1/2020
    (function(c,e,n,o,i,r,s,t,u,a,h,f,l,d,p){s="querySelector";a=new Date;d=0;
    c["GotChosenObject"]=o;c[o]=c[o]||function(){(c[o].q=c[o].q||[]).push(arguments);r=r||c[o].q.filter(function(t){return t[0]==="init"})[0][1];
    p=function(){try{try{h=[];c[o].q[0][2].widgets.autoinstall.forEach(function(t){h.push(t.selector)});
    h=h.join()}catch(t){h=".gcwp-carousel"}if(d<6e4&&!e[s]("#"+r)){if(e[s](h)){f=e.createElement(n);
        f.id=r;f.async=1;f.src=i+"/gcjs/"+r+"/gc.js?cb="+a.toJSON().slice(0,13);e.head.appendChild(f)}
        else{setTimeout(p,100)}d+=100}}catch(t){throw new Error(t)}};if(r){p()}}})(window,document,"script","gc","https://cdn.gotchosen.com"); 
        gc("init", SITE_INFO['gotchosen_id'], { widgets: { autoinstall: [{ selector: '#gotChosen' }] } });
}

function loadZergOrRev() {

    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }

    //if( $("#revContentWidget").length>0 ){
    //IF WE HAVE A REVC_ID AND WE'RE ON AN ARTICLE PAGE
    var isarticle = $('body.article').length;
    var ispoll = $('body.polls').length;
    var isSponsoredPage = $('body.sp_content').length; //if sponsored page do not want any ads/ad widgets

    if(SITE_INFO['revc_id']!="" && isSponsoredPage==0 && (isarticle>0 || ispoll>0)){

        //if NOT hiding 3rd party ads then load rev/zerg ads
        if( $(".data-no-ads").length == 0 ){
            if(SITE_INFO['zerg_id']==''){
                //loadRevContentWidgets();
            }else{ //use zerg if we have it
                loadZergWidgets();
            }
        }

    }
}

function loadZergWidgets(){

    //REV CONTENT BELOW MAIN SECTION
    $f = $('div.alpha');
    $f.append("<div class='clear'></div><div id='zergnet-widget-"+SITE_INFO['zerg_id']+"'></div>");
    //(function() {
    var zergnet = document.createElement('script');
    zergnet.type = 'text/javascript'; zergnet.async = true;
    zergnet.src = (document.location.protocol == "https:" ? "https:" : "http:") + '//www.zergnet.com/zerg.js?id='+SITE_INFO['zerg_id'];
    var znscr = document.getElementsByTagName('script')[0];
    znscr.parentNode.insertBefore(zergnet, znscr);
    //})();

}

function loadRevContentWidgets(){

    //REV CONTENT BELOW ARTICLE
    //$f = $('#revContentWidget');
    $f = $('div.alpha');

    //$f.after("<div id='"+revc_id+"'></div>");
    $f.append("<div class='clear'></div><div id='"+SITE_INFO['revc_id']+"'></div>");
    var referer="";
    try{
        if(referer=document.referrer,"undefined"==typeof referer)
            throw"undefined"
    }catch(exception){
        referer=document.location.href,(""==referer||"undefined"==typeof referer)&&(referer=document.URL)
    }
    referer=referer.substr(0,700);
    var rcel = document.createElement("script");
    rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
    rcel.type = 'text/javascript';
    rcel.src = "https://trends.revcontent.com/serve.js.php?w="+SITE_INFO['revc_w']+"&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;
    rcel.async = true;
    if( $('body.article.long').length==0 ){
        var rcds = document.getElementById(SITE_INFO['revc_id']);
        rcds.appendChild(rcel);
    }


    if(SITE_INFO['revc_id_side']!=''){ //LOAD SIDEBAR WIDGET IF WE HAVE CODE

        //REV CONTENT SIDEBAR
        $('div.beta').append("<div id='"+SITE_INFO['revc_id_side']+"'></div>");
        var referer="";
        try{
            if(referer=document.referrer,"undefined"==typeof referer)
                throw"undefined"
        }catch(exception){
            referer=document.location.href,(""==referer||"undefined"==typeof referer)&&(referer=document.URL)
        }
        referer=referer.substr(0,700);
        var rcel = document.createElement("script");
        rcel.id = 'rc_' + Math.floor(Math.random() * 1000);
        rcel.type = 'text/javascript';
        rcel.src = "https://trends.revcontent.com/serve.js.php?w="+SITE_INFO['revc_w_side']+"&t="+rcel.id+"&c="+(new Date()).getTime()+"&width="+(window.outerWidth || document.documentElement.clientWidth)+"&referer="+referer;
        rcel.async = true;
        if( $('body.article.long').length==0 ){
            var rcds = document.getElementById(SITE_INFO['revc_id_side']);
            rcds.appendChild(rcel);
        }
    }
}

function investingChannel_init(){

    console.log("ADMIRAL investingChannel_init");

    // Put close button on select ads
    // and Remove id of any ad that has a close cookie still active
    if(typeof SITE_INFO['ic_ads_close'] !== 'undefined') {

        SITE_INFO['ic_ads_close'].forEach(function(ic_ad) {

            if( $("body").hasClass(ic_ad['body_class']) ) {

                ic_ad['ads'].forEach(function(ad) {

                    $el = $('#'+ad);
                    if($el.length > 0){

                        // If cookie exists, remove id
                        if(readCookie(ad+'_close-ad')) {

                            $el.attr('id', 'closed_ic_ad');

                        } else { // If no cookie, place close btn

                            $el.attr('style', 'position:relative;');

                            var closer = '<div class="close-the-ad">&times;</div>';

                            $el.append(closer);

                            $el.find('.close-the-ad').click(function() {
                                // on closing ad, create a cookie based on the classes of the element
                                // the cookie is to be used by anyone else needing to check for this
                                //var ad_element = $(this).closest('.RC-AD');
                                var ad_element = $(this).parent();
                                var cookie_name = ad_element.attr('id')+'_close-ad';
                                console.log('cookie_name: '+cookie_name);
                                createCookie(cookie_name, $(ad_element).prop('nodeName')+'_'+cookie_name, 1);
                                $(ad_element).hide();
                            });
                        }
                    }
                });
            }
        });
    }

    // Init investingchannel

    if(typeof InvestingChannelQueue != 'undefined'){
        InvestingChannelQueue = window.InvestingChannelQueue || [];

        InvestingChannelQueue.push(function() {
            window.ic_page = InvestingChannel.UAT.Run("350ec4ce-2cd7-4361-8d99-f004438137c2");
        });
    }

    return;
}

function markets_investingchannel() {

    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads) {

            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }

    if( readCookie('two_weeks_adfree') ){ return false; }

    if(SITE_INFO['name'] == 'markets' && !NO_IC ) {

        if ($('body').hasClass('new_ic_uat')) {

        } else {
            var invc_bylineAd = "<div class=\"invc-byline-ad\"><!-- Site: RealClearMarkets.RealClearMarkets, Zone: equities_news, Size 234x20, Multiple sizes: N/A --><div class=\"sponsored-text-list\" style=\"font-size:.55em;font-color:#777\">Advertisement</div><script src='//ads.investingchannel.com/adtags/realclearmarkets/equities_news/234x20.js' type='text/javascript' charset='utf-8'></script></div>";

            var invc_lcAd = "<!-- Site: RealClearMarkets.RealClearMarkets, Zone: equities_news, Size 125x125, Multiple sizes: N/A --><script src='//ads.investingchannel.com/adtags/realclearmarkets/equities_news/125x125.js' type='text/javascript' charset='utf-8'></script>";

            var invc_bannerAd = "<!-- Site: RealClearMarkets.RealClearMarkets, Zone: searchbx, Size 88x31, Multiple sizes: N/A --><script src='//ads.investingchannel.com/adtags/realclearmarkets/searchbx/88x31.js?kval=searchbx' type='text/javascript' charset='utf-8'></script>";

            if( $(".sharepoint-wrapper").length>0 ){
                $(".article-auth").css({ "margin-bottom" : "45px" });
            }

            if(typeof load_investingchannel_88x31 == 'function') {load_investingchannel_88x31(); }
            if(typeof load_investingchannel_300 == 'function') {load_investingchannel_300(); }
        }
        //Dynamically load in Inv. Channel Ads

        // disabled 1/6/2019 ROWLAND
        //$('.article-auth').after( invc_bylineAd );
        //$('.invc-lc-ad').append( invc_lcAd );
        //$('.invc-header-ad').append( invc_bannerAd );

    }

}

function taboolaWidget(pos){ //pos comes from articles.js

    if( typeof pos === "undefined" ){
        pos = 0;
    }else{
        pos = pos;
    }

    var module = $("#taboolaWidget").attr('data-module');
    var type = $("#taboolaWidget").attr('data-type'); //3 Types: full -> thumb -> text

    window._taboola = window._taboola || [];
    if( module == 'video' ){
        _taboola.push({video: 'auto'});
    }else if(module=='home'){
        _taboola.push({home:'auto'});
    }else if(module=='polls'){
        _taboola.push({category:'auto'});
    }else{
        _taboola.push({article: 'auto'});
    }

    !function (e, f, u) {
        e.async = 1;
        e.src = u;
        f.parentNode.insertBefore(e, f);
    }(document.createElement('script'), document.getElementsByTagName('script')[0], '//cdn.taboola.com/libtrc/realclearpolitics/loader.js');

    if( type == 'full' ){ //both thumb and text link versions - 2 box elements
        //THUMBS
        if( pos == 0 ){
            $('#taboolaWidget').after("<div id='taboola-bottom-main-column'></div>");

            window._taboola = window._taboola || [];
            _taboola.push({mode : 'autosized-generated-2r', container : 'taboola-bottom-main-column', placement :
                    'bottom-main-column'});

            //TEXT
            $('#taboola-bottom-main-column').after("<div id='taboola-text-2-columns-mix' style='border:1px solid #ccc; padding:10px; background: url(\""+window.location.protocol+"//realclearpolitics.com/images/bg_election_small_maps.gif\") bottom repeat-x;'></div>");
            window._taboola = window._taboola || [];
            _taboola.push({mode:'text-links-2c', container:'taboola-text-2-columns-mix', placement:'text-2-columns', target_type:'mix'});

        }else{ //infinite scroll triggered - increment position and push... push it real good
            $('#taboolaWidget_'+pos+'').after("<div id='taboola-bottom-main-column_"+pos+"'></div>");

            window._taboola = window._taboola || [];
            _taboola.push({mode : 'autosized-generated-2r', container : 'taboola-bottom-main-column_'+pos+'', placement :
                    'bottom-main-column'});

            //TEXT
            $('#taboola-bottom-main-column_'+pos+'').after("<div id='taboola-text-2-columns-mix' style='border:1px solid #ccc; padding:10px; background: url(\""+window.location.protocol+"//realclearpolitics.com/images/bg_election_small_maps.gif\") bottom repeat-x;'></div>");
            window._taboola = window._taboola || [];
            _taboola.push({mode:'text-links-2c', container:'taboola-text-2-columns-mix', placement:'text-2-columns', target_type:'mix'});

        }

    }else if( type == 'thumb' ){ // thumb w/ link version - 1 element
        //THUMBS
        if( pos == 0 ){
            $('#taboolaWidget').after("<div id='taboola-bottom-main-column'></div>");

            window._taboola = window._taboola || [];
            _taboola.push({mode : 'autosized-generated-2r', container : 'taboola-bottom-main-column', placement :
                    'bottom-main-column'});
        }else{
            $('#taboolaWidget_'+pos+'').after("<div id='taboola-bottom-main-column_"+pos+"'></div>");

            window._taboola = window._taboola || [];
            _taboola.push({mode : 'autosized-generated-2r', container : 'taboola-bottom-main-column_'+pos+'', placement :
                    'bottom-main-column'});
        }

    }else if( type == 'text' ){ //text link version - 1 box element
        //TEXT
        if( pos == 0 ){
            $('#taboolaWidget').after("<div id='taboola-bottom-main-column'></div>");

            $('#taboola-bottom-main-column').after("<div id='taboola-text-2-columns-mix' style='border:1px solid #ccc; padding:10px; background: url(\""+window.location.protocol+"//realclearpolitics.com/images/bg_election_small_maps.gif\") bottom repeat-x;'></div>");
            window._taboola = window._taboola || [];
            _taboola.push({mode:'text-links-2c', container:'taboola-text-2-columns-mix', placement:'text-2-columns', target_type:'mix'});
        }else{
            $('#taboolaWidget_'+pos+'').after("<div id='taboola-bottom-main-column_"+pos+"'></div>");

            $('#taboola-bottom-main-column').after("<div id='taboola-text-2-columns-mix' style='border:1px solid #ccc; padding:10px; background: url(\""+window.location.protocol+"//realclearpolitics.com/images/bg_election_small_maps.gif\") bottom repeat-x;'></div>");
            window._taboola = window._taboola || [];
            _taboola.push({mode:'text-links-2c', container:'taboola-text-2-columns-mix', placement:'text-2-columns', target_type:'mix'});
        }

    }else if(type == 'home_left_rail'){ //HOMEPAGE LEFT RAIL
        $('#taboolaWidget').after("<div id='taboola-left-rail-thumbnails'></div>");

        window._taboola = window._taboola || [];
        _taboola.push({mode:'thumbnails-lr', container:'taboola-left-rail-thumbnails', placement:'Left Rail Thumbnails', target_type:'mix'});
    }else if(type == 'polls'){ //POLLS PAGES - LEFT SIDE - BOTTOM
        $('#taboolaWidget').after("<div id='taboola-below-main-column-thumbnails'></div>");
        window._taboola = window._taboola || [];
        _taboola.push({mode:'thumbnails-a', container:'taboola-below-main-column-thumbnails', placement:'Below Main Column Thumbnails', target_type:'mix'});
    }

    _taboola.push({flush:true});

}//end articles taboola

//LOAD INFINITY "Before you Go" UNIT (was pop-under)
// No need to have evolok manage this until politics ready
function loadInfinityAds(){

    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }    



    //setTimeout(function(){
        //console.log('infinity: ');
        //console.log(enable_infinity_ads);
        if(SITE_INFO['name']=='politics'){
            //console.log('infinity ran');

            var random_num = Math.random();
            if(!(navigator.userAgent.match(/(iPhone|iPod|iPad)/i)) && random_num < .15 ){
                var cur_body_class = document.body.getAttribute('class').split(/\s+/); //grab body class

                //ONLY ON SPECIFIC SECTIONS
                if(cur_body_class[0]=='polls' || cur_body_class[0]=='video' || cur_body_class[0]=='article' || cur_body_class[0]=='home'){
                                        

                    window.InfPreInsterstitialProcessCallback = function(event) { 
                        var target = event.target;
                        window.OnClickCallback = event.target.dataset.onclick;

                        var data = {
                            'ge_action' : 'Link Clicked',
                            'ge_category' : 'AdSupply',
                            'ge_label' : cur_body_class[0],
                            'ge_noninteraction' : false
                        };
                        send_ga_event(data);

                        eval(window.OnClickCallback);
                        //alert('click 1')
                    };

                    window.InfPostInterstitialCallback = function(event) {
                        //eval(window.OnClickCallback);
                        //alert('click 2');
                    }; 
                            

                    (function(s,o,l,v,e,d){
                        if(s[o]==null&&s[l+e]){s[o]="loading";s[l+e](d,l=function(){ 
                            s[o]="complete";s[v+e](d,l,!1)},!1)}
                    })(document,"readyState","add","remove","EventListener","DOMContentLoaded");

                    (function(){
                        var s=document.createElement("script");
                        s.type="text/javascript";
                        s.async=true;
                        s.src="//cdn.engine.4dsply.com/Scripts/infinity.js.aspx?guid=9483dc51-8a49-444d-92b3-54b3f3d6a32b";
                        s.id="infinity";
                        s.setAttribute("data-guid","9483dc51-8a49-444d-92b3-54b3f3d6a32b");
                        s.setAttribute("data-version","async");
                        var e=document.getElementsByTagName('script')[0];
                        e.parentNode.insertBefore(s,e);
                    })();

                    
                    var data = {
                        'ge_action' : 'Called Tag',
                        'ge_category' : 'AdSupply',
                        'ge_label' : cur_body_class[0],
                        'ge_noninteraction' : true
                    };
                    send_ga_event(data);



                }
            }
        }
    //},500); //wait half second to make sure survey wasn't triggered
}

function loadPrimisWidget(){

    if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }


    if(SITE_INFO['name']=='science'){
        var cur_body_class = document.body.getAttribute('class').split(/\s+/); //grab body class
        if( cur_body_class[0]=='article'){

            (function() {

                widget = '<div id="primis_target"></div>';
                target = 'div.article-body #comments-container';
                $(target).after(widget);


                var sc = document.createElement('script');
                sc.type = 'text/javascript';
                sc.async = true;
                sc.src = '//live.sekindo.com/live/liveView.php?s=99276&cbuster=[CACHE_BUSTER]&pubUrl=[PAGE_URL_ENCODED]&x=[WIDTH]&y=[HEIGHT]&vp_content=plembed128dgxvmnzqs&vp_template=5280&subId=[SUBID_ENCODED]';
                sc.charset = 'utf-8';
                var s = document.getElementById('primis_target');
                s.appendChild(sc, s);

            })();


        }
    }
}











////////////////////////////////////////////////////////////////////////////////
// SOCIAL FUNCTIONS ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function loadSocialTools(){

    var any_print_button = false;
    //IF SOCIAL TOOLS CONTAINER EXIST
    if($('div#fb-root').length<1) {
        $('body').append('<div id="fb-root"></div>'); //Add the fb-root if it doesn't exist already.
    }
    // ----------------------------
    //BUILD SOCIAL TOOLS ON ALL CONTAINER INSTANCES AND APPEND
    $(".socialBar .toolset").each(function(index){
        if($(this).is('.has-tools')) {
            return; //quit this function if the current item already has social tools.
            //this function will append the .has-tools class to $(this) at the end.
        }


        var sbIndex = index;
        //alert(sbIndex);
        var socialBar = $(this).parent();
        var socialBarParent = socialBar.parent(); //grandparent to socialBar

        var feedName = socialBarParent.attr("data-feed-name");
        if( feedName == "" || typeof feedName === 'undefined' ){
            //we have a discrepency in html markup different on targeting the elements for sharing tools for twitter
            feedName = socialBar.attr('data-src-title');

            if(feedName == "" || typeof feedName === 'undefined'){
                feedName = $(document).find("title").text();
            }
        }

        var feedCaption = socialBarParent.attr("data-feed-caption");
        if( feedCaption == "" || typeof feedCaption === 'undefined' ){
            feedCaption = $(document).find("description").text();
        }

        //var feedDescription = socialBarParent.attr("data-feed-description");
        var feedDesc = $('meta[name=description]').attr("content");

        var feedAuth = socialBar.attr("data-src-author");//Articles

        if(feedAuth == "" || typeof feedAuth === 'undefined'){
            //this will get the author from the Articles permalink pages
            feedAuth = $(".auth-author").text();
        }
        var feedDescription = feedDesc;

        if(feedAuth != '' || typeof feedAuth === 'undefined' && feedDesc != ''){
            feedDescription = feedDesc +' - By '+feedAuth;
        }

        if( feedDescription == "" || typeof feedDescription === 'undefined' ){
            feedDescription = $(document).find("description").text();
        }

        var feedLink = socialBarParent.attr("data-feed-link");
        if( feedLink == "" || typeof feedLink === 'undefined' ){
            feedLink = window.location.href;
        }

        //var feedLink = window.location.href;

        var feedPhoto = socialBarParent.attr("data-feed-photo");
        if( feedPhoto == "" || typeof feedPhoto === 'undefined' ){
            feedPhoto = $('meta[property="og:image"]').attr('content');
        }

        var shareStyle = socialBar.attr('data-style');
        var shareDialog = socialBar.attr('data-dialog');
        var shareTwitterHandle = socialBar.attr('data-handle');
        var authorPage = $('body').hasClass('author');

        var toolset = $(this);  //parent toolset element

        //GRABS REFERRAL URL
        var ref_url = socialBar.attr('data-src-url');
        if(!ref_url){
            //IF 'ref' non-existent pull current page url
            ref_url = window.location.href;
        }

        /**
         * E.M
         * Multipage data url
         * It will only exist if ther is a multi-page article
         */
        //if it is a multipage article
        if($('.multipage_article').length > 0){
            //var new_location = $(this).attr('data-url');
            ref_url = $('.multipage_article').attr('data-url');
        }

        //GRABS REFERRAL TITLE
        var ref_title = socialBar.attr('data-src-title');
        if(!ref_title){
            //IF 'title' non-existent pull current page meta-title
            ref_title = $(document).find("title").text();
        }

        //Replace requires a new variable name for each replace you do or it will not work
        var new_ref_title = ref_title;
        var refTitleClean = new_ref_title.replace("'","");
        var rtNoEm = refTitleClean.replace("<em>","");
        var refTitle = rtNoEm.replace("</em>", "");

        //console.log('NEW Title: ' + refTitle);

        var red_btn_html = '<a href="//www.reddit.com/submit" style="margin-right:-3px; padding:0 0 0 7px;" onclick="window.location = \'//www.reddit.com/submit?url=\' + encodeURIComponent(window.location); return false"> <img width="30" src="/asset/img/reddit-icon.png" alt="submit to reddit" border="0" /> </a>';

        // Print Button
        var include_print = false;
        var print_icon_html = '';
        if(typeof socialBar.attr("data-print") !== 'undefined' && socialBar.attr("data-print") != '') {
            include_print = true;
            any_print_button = true;
            print_icon_html = "<a class=\"print_icon\"></a>";
        }

        //CUSTOM TWITTER TEXT FOR FEED TYPE SHARE DIALOGS
        feed_temp = feedName.split('|');
        feedName = feed_temp[0];

        if(feedName.search('Articles ') !== -1){
            feedName = refTitle;
        }

        var twt_share_text = feedName + ' - ' + feedDescription;
        var new_twt_share_text = fixedEncodeURIComponent( feedName );

        if( shareStyle == "short" ){
            if( shareDialog == "feed" ){
                //APPEND TWITTER SHARE
                refTitle = refTitle.replace("039", "");
                refTitle = refTitle.replace("'", "");
                share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ new_twt_share_text +'&amp;related='+SITE_INFO['twitter_related'];
                //share_url = share_url.replace("039", "");
                //share_url = share_url.replace("'", "");
                //console.log(share_url);
                toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

                feedName = feedName.replace("'", "");
                toolset.append("<a class=\"icon fb_icon\" onclick=\"shareOnFacebook('"+feedName+"', '"+feedCaption+"', '"+feedDescription+"', '"+feedLink+"', '"+feedPhoto+"')\"></a>");
                //APPEND FACEBOOK SHARE
                //share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
                //toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");
            }else{
                if(authorPage){
                    if(shareTwitterHandle){
                        toolset.append(`<a class="icon tweet_icon" href="https://twitter.com/${shareTwitterHandle}"></a>`);
                    }
                } else {
                    //APPEND TWITTER SHARE
                    refTitle = refTitle.replace("039", "");
                    refTitle = refTitle.replace("'", "");
                    feed_temp = refTitle.split('|');
                    refTitle = feed_temp[0];
                    share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ new_twt_share_text +'&amp;related='+SITE_INFO['twitter_related'];
                    //share_url = share_url.replace("039", "");
                    //share_url = share_url.replace("'", "");

                    //console.log('Share URL: ' + share_url);

                    toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");
                }

                //APPEND FACEBOOK SHARE
                share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
                toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

                if(SITE_INFO['name'] == 'markets'){
                    //APPEND GETTR SHARE
                    var text = new_twt_share_text;
                    var url = encodeURI(ref_url);
                    share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
                    toolset.append("<a class=\"icon gettr_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");
                }

            }

            //Linked In global share url - used in short style sharing or when clicking the plus/more button menu
            var lin_share_url = 'https://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent(ref_url)+'&title='+encodeURIComponent(refTitle)+'&summary='+encodeURIComponent(refTitle)+'&source='+SITE_INFO['site_title'];
            //Google Plus global share url - used in short style sharing when sharing is inside plus/more button menu
            var gp_share_url = 'https://plus.google.com/share?url='+ref_url;

            //APPEND MORE DRAWER
            //style=\"display:none;\"
            toolset.append("<span class=\"more-wrapper\">"
                +   "<a class=\"icon jqDrawer more_icon\"></a>"
                +   "<div class=\"toolset_drawer\">"
                +     "<div class=\"content\">"
                +     "<a class=\"icon lnkdin_icon\" onclick=\"rctools_openShareWindow('linkedinwindow','"+lin_share_url+"')\"></a> "
                // +     "<a class=\"icon gplus_icon\" onclick=\"rctools_openShareWindow('gpluswindow','"+gp_share_url+"')\"></a>"
                +     red_btn_html
                +     "<span class=\"email-wrapper\">"
                +       "<a class=\"icon email_icon\" href=\"mailto:?subject="+encodeURIComponent(refTitle)+"&body="+ref_url+"\"></a>"
                //+       "<div class=\"toolset_drawer\" >"
                //+         "<a class=\"tab\"></a>"
                //+         "<div class=\"tab-header\"><div>Email Link to Friends</div></div>"
                //+         "<div class=\"content\">"
                //+           rctools_genSendEmailsForm(ref_url)
                //+         "</div>"
                //+       "</div>"
                +     "</span>"
                +     print_icon_html
                +     "</div>"
                +     "<div class=\"toolset_drawer_tab\"></div>"
                +   "</div>"
                + "</span>");

        } //end short bar

        else if( shareStyle == "full" ){
            if( shareDialog == "feed" ){
                //APPEND TWITTER SHARE
                twt_share_text = twt_share_text.replace("039", "");
                twt_share_text = twt_share_text.replace("'", "");
                share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ encodeURIComponent(twt_share_text) +'&amp;related='+SITE_INFO['twitter_related'];
                //share_url = share_url.replace("039", "");
                //share_url = share_url.replace("'", "");
                //console.log(share_url);
                toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

                //APPEND FACEBOOK SHARE
                feedName = feedName.replace("'", "");
                toolset.append("<a class=\"icon fb_icon\" onclick=\"shareOnFacebook('"+feedName+"', '"+feedCaption+"', '"+feedDescription+"', '"+feedLink+"', '"+feedPhoto+"')\"></a>");
                //APPEND FACEBOOK SHARE
                //share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
                //toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

                if(SITE_INFO['name'] == 'markets'){
                    //APPEND GETTR SHARE
                    var text = new_twt_share_text;
                    var url = encodeURI(ref_url);
                    share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
                    toolset.append("<a class=\"icon gettr_icon_footer\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");
                }

            }else{
                //APPEND TWITTER SHARE
                refTitle = refTitle.replace("039", "");
                refTitle = refTitle.replace("'", "");
                share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ encodeURIComponent(refTitle) +'&amp;related='+SITE_INFO['twitter_related'];
                //share_url = share_url.replace("039", "");
                //share_url = share_url.replace("'", "");
                //console.log(share_url);
                toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

                //APPEND FACEBOOK SHARE
                share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
                toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

                if(SITE_INFO['name'] == 'markets'){
                    //APPEND GETTR SHARE
                    var text = new_twt_share_text;
                    var url = encodeURI(ref_url);
                    share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
                    toolset.append("<a class=\"icon gettr_icon_footer\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");
                }

            }

            //APPEND LINKEDIN
            share_url = 'https://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent(ref_url)+'&title='+encodeURIComponent(refTitle)+'&summary='+encodeURIComponent(refTitle)+'&source='+SITE_INFO['site_title'];
            toolset.append("<a class=\"icon lnkdin_icon\" onclick=\"rctools_openShareWindow('linkedinwindow','"+share_url+"')\"></a>");

            //APPEND GOOGLE+
            // share_url = 'https://plus.google.com/share?url='+ref_url;
            // toolset.append("<a class=\"icon gplus_icon\" onclick=\"rctools_openShareWindow('gpluswindow','"+share_url+"')\"></a>");

            //APPEND EMAIL MARKUP
            //style=\"display:none;\"
            toolset.append("<span class=\"more-wrapper\">"
                +   "<a class=\"icon email_icon\" href=\"mailto:?subject="+encodeURIComponent(refTitle)+"&body="+ref_url+"\"></a>"
                //+   "<div class=\"toolset_drawer\" >"
                //+     "<a class=\"tab\"></a>"
                //+     "<div class=\"tab-header\"><div>Email Link to Friends</div></div>"
                //+     "<div class=\"content\">"
                //+       rctools_genSendEmailsForm(ref_url)
                //+     "</div>"
                //+   "</div>"
                +   print_icon_html
                + "</span>");

        } //end full bar

        else if( shareStyle == "site" ){
            //APPEND TWITTER SHARE
            site_url = SITE_INFO['global_site_url'];
            share_url = 'https://twitter.com/share?url='+encodeURIComponent(site_url);
            //share_url = share_url.replace("039", "");
            //share_url = share_url.replace("'", "");
            //console.log(share_url);
            toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

            //APPEND FACEBOOK SHARE
            share_url = 'https://www.facebook.com/sharer/sharer.php?u='+site_url;
            toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

            if(SITE_INFO['name'] == 'markets'){
                //APPEND GETTR SHARE
                var text = new_twt_share_text;
                var url = encodeURI(ref_url);
                share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
                toolset.append("<a class=\"icon gettr_icon_footer\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");
            }

            //APPEND LINKEDIN
            share_url = 'https://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent(site_url)+'&source='+SITE_INFO['site_title'];
            toolset.append("<a class=\"icon lnkdin_icon\" onclick=\"rctools_openShareWindow('linkedinwindow','"+share_url+"')\"></a>");

            //APPEND GOOGLE+
            // share_url = 'https://plus.google.com/share?url='+site_url;
            // toolset.append("<a class=\"icon gplus_icon\" onclick=\"rctools_openShareWindow('gpluswindow','"+share_url+"')\"></a>");

        }

        else if( shareStyle == "mobile" ){
            //APPEND TWITTER SHARE
            share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ new_twt_share_text +'&amp;related='+SITE_INFO['twitter_related'];
            //share_url = share_url.replace("039", "");
            //share_url = share_url.replace("'", "");
            //console.log(share_url);
            toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

            //APPEND FACEBOOK SHARE
            share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
            toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

            if(SITE_INFO['name'] == 'markets'){
                //APPEND GETTR SHARE
                var text = new_twt_share_text;
                var url = encodeURI(ref_url);
                share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
                toolset.append("<a class=\"icon gettr_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");
            }

            //APPEND SMS BUTTON
            sms_body = ref_url;

            //var isIOS8 = function() {
            var deviceAgent = navigator.userAgent.toLowerCase();
            var isIOS = false;
            var sms_body_switch;
            if(/ipad|ipod|iphone/i.test(navigator.userAgent)) { //if ios
                //return /(iphone|ipod|ipad).* os 8_/.test(deviceAgent);
                var isIOS = true;
                if(isIOS){
                    if( /(iphone|ipod|ipad).* os 8_/.test(deviceAgent) ){
                        sms_body_switch = '&';
                    }else if( /(iphone|ipod|ipad).* os 7_/.test(deviceAgent) ){
                        sms_body_switch = ';';
                    }else{
                        sms_body_switch = '?';
                    }
                }
            }else{ //if anything BUT iOS

                sms_body_switch = '?';
            }

            //alert(sms_body_switch);

            toolset.append("<a class=\"icon sms_icon\" href=\"sms:"+ sms_body_switch +"body="+ ref_url +"\"></a>");

            //APPEND EMAIL MARKUP
            //style=\"display:none;\"
            toolset.append("<span class=\"more-wrapper\">"
                +   "<a class=\"icon email_icon\" href=\"mailto:?subject="+encodeURIComponent(refTitle)+"&body="+ref_url+"\"></a>"
                //+   "<div class=\"toolset_drawer\" >"
                //+     "<a class=\"tab\"></a>"
                //+     "<div class=\"tab-header\"><div>Email Link to Friends</div></div>"
                //+     "<div class=\"content\">"
                //+       rctools_genSendEmailsForm(ref_url)
                //+     "</div>"
                //+   "</div>"
                + "</span>");

        }//end site bar
        else if( shareStyle == "mobile-video" ){
            //APPEND TWITTER SHARE
            share_url = 'https://twitter.com/share?url='+encodeURIComponent(ref_url)+'&amp;text='+ new_twt_share_text +'&amp;related='+SITE_INFO['twitter_related'];
            toolset.append("<a class=\"icon tweet_icon\" onclick=\"rctools_openShareWindow('twitterwindow','"+share_url+"')\"></a>");

            //APPEND FACEBOOK SHARE
            share_url = 'https://www.facebook.com/sharer/sharer.php?u='+ref_url;
            toolset.append("<a class=\"icon fb_icon\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"')\"></a>");

            //APPEND GETTR SHARE
            var text = new_twt_share_text;
            var url = encodeURI(ref_url);
            share_url = 'https://gettr.com/share?&text='+text+'&url='+url;
            toolset.append("<a class=\"icon gettr_icon_video\" onclick=\"rctools_openShareWindow('sharer','"+share_url+"','gettr')\"></a>");

            //APPEND SMS BUTTON
            let sms_body = ref_url;

            //var isIOS8 = function() {
            var deviceAgent = navigator.userAgent.toLowerCase();
            var isIOS = false;
            var sms_body_switch;
            if(/ipad|ipod|iphone/i.test(navigator.userAgent)) { //if ios
                //return /(iphone|ipod|ipad).* os 8_/.test(deviceAgent);
                var isIOS = true;
                if(isIOS){
                    if( /(iphone|ipod|ipad).* os 8_/.test(deviceAgent) ){
                        sms_body_switch = '&';
                    }else if( /(iphone|ipod|ipad).* os 7_/.test(deviceAgent) ){
                        sms_body_switch = ';';
                    }else{
                        sms_body_switch = '?';
                    }
                }
            }else{ //if anything BUT iOS

                sms_body_switch = '?';
            }

            //alert(sms_body_switch);

            toolset.append("<a class=\"icon sms_icon_video\" href=\"sms:"+ sms_body_switch +"body="+ ref_url +"\"></a>");

            //APPEND EMAIL MARKUP
            // toolset.append("<span class=\"more-wrapper\">"
            //     +   "<a class=\"icon email_icon\" href=\"mailto:?subject="+encodeURIComponent(refTitle)+"&body="+ref_url+"\"></a>">"
            //     //+   "</div>"
            //     + "</span>");

        }//end mobile bar
        
        $(this).addClass('has-tools');

    });

    if(any_print_button)
    {
        if($(".socialBar .print_icon").length)
        {
            $(".socialBar .print_icon").unbind('click');
            $(".socialBar .print_icon").click(function() {

                window.print();
            });
        }
    }

}//end socialTools function

//fixex to include encode properly
function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

function shareOnFacebook(feedName, feedCaption, feedDescription, feedLink, feedPhoto){

    /**
     * If FB sdk not in page, load it and then come back to this
     */
    if(typeof FB == 'undefined'){
        load_fb_sdk();
        setTimeout(function(){
            shareOnFacebook(feedName, feedCaption, feedDescription, feedLink, feedPhoto);
        }, 125);
        return;
    }

    var ogImg = $('meta[property="og:image"]').attr('content');
    if( feedPhoto == "" ){
        if( ogImg != "" ){
            feedPhoto = ogImg;
        }else{
            feedPhoto = feedPhoto = document.domain+'/asset/img/og-default.png';
        }
    }

    FB.ui({
        method: 'feed',
        name: feedName,
        link: feedLink,
        caption:feedCaption,
        picture: feedPhoto,
        description: feedDescription
    }, function(response) {
        if(response && response.post_id){}
        else{}
    });

}

function initSocialDrawer(){
    //ICON BUTTONS WITH DRAWERS CLICK -- SHOW DRAWER
    $(".jqDrawer").click(function(){
        if($(this).parent().children(".toolset_drawer").is(':hidden')){
            $(".socialBar .left .more-wrapper .toolset_drawer").hide(); //we must hide all other first
            $(this).parent().children(".toolset_drawer").show(200); //SHOW ONE YOU CLICKED ON
            //$(this).parent().find(".toolset_drawer .fieldset").css({ "opacity" : "1" }); //set visibility of form
            //rctools_initEmailControls($(this).parent(),ref_title);  //init controls
        }else{
            $(this).parent().children(".toolset_drawer").hide(200);
        }
    });

}

function initEmailDrawer(){
    //ICON BUTTONS WITH DRAWERS CLICK -- SHOW DRAWER
    ref_title = $(document).find("title").text();
    var new_ref_title = ref_title.replace("'","");
    var refTitle = new_ref_title.replace("'","");
}

//BUILDS SOCIAL BUTTONS
function rctools_genSocialToolsDropDown(share_url,share_title){

    var output = "";
    output += "<div class=\"social_tools\">"
        + "<div><a href=\"http://www.reddit.com/submit?url="+encodeURIComponent(share_url)+"\"><img src=\"https://www.reddit.com/static/spreddit5.gif\" alt=\"submit to reddit\" border=\"0\" /> Submit</a></div>"
        + "<div><script type=\"IN/Share\" data-url=\""+share_url+"\" data-counter=\"right\"></script></div>"
        //+ "<div><a href=\"http://www.tumblr.com/share\" title=\"Share on Tumblr\" style=\"display:inline-block; text-indent:-9999px; overflow:hidden; width:81px; height:20px; background:url('https://platform.tumblr.com/v1/share_1.png') top left no-repeat transparent;\">Share on Tumblr</a></div>"
        +   "<div><a onclick=\"rctools_openShareWindow('pinterestwindow','http://www.pinterest.com/pin/create/button/?url="+encodeURIComponent(share_url)+"&media=http://assets.realclearpolitics.com/images/logo-sub.gif&description="+encodeURIComponent(share_title)+"')\" data-pin-do=\"buttonPin\" data-pin-config=\"above\"><img src=\"//assets.pinterest.com/images/pidgets/pin_it_button.png\" /></a></div>"
        + "<div><div class=\"fb-like\" data-href=\""+share_url+"\" data-layout=\"button_count\"  data-action=\"like\" data-show-faces=\"false\" data-share=\"false\"></div></div><div class=\"clear\"></div>"
        + "<div><a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-related=\"RealClearNews,rcpvideo,TomBevanRCP\" data-count=\"horizontal\" data-lang=\"en\" >Tweet</a></div>"
        + "<div><g:plusone></g:plusone></div>"
        +   "<div><a href=\"javascript:void('0');\" id=\"print_all\"><img src=\"/images/printButton.gif\" /></a></div>"
        + "</div>";

    return output;
}

//BUILDS EMAIL FORM
function rctools_genSendEmailsForm(share_url){

    var output = "<div class=\"send-btn-form\">"
        +     "<div id=\"msgBox\" style=\"display:none;\"></div>"
        +     "<div id=\"successBox\" style=\"display:none;\"><h3></h3></div>"
        +     "<div class=\"fieldset\">"
        +       "Your Name:<br />"
        +       "<input id=\"senderName\" name=\"name\" type=\"text\" /><br />"
        +       "Your E-mail:<br />"
        +       "<input id=\"senderEmail\" name=\"sEmail\" type=\"text\" /><br />"
        +       "<div class=\"emailLoader\" style=\"display:none;\"><img src=\"/images/ajax-loader.gif\" /></div>"
        +       "Friend\'s E-mail(s):<br />"
        +       "<input id=\"recpEmail\" name=\"recEmail\" type=\"text\" data-index=\"1\" />"
        +       "<div id=\"addEmail\" class=\"addEmailBtn\">+</div>"
        +       "<div id=\"addEmailForm\"></div>"
        +       "Message:(optional)<br />"
        +       "<textarea id=\"optMessage\" name=\"msg\" rows=\"4\" cols=\"25\"></textarea><br />"
        +       "<input id=\"sendBtn\" type=\"submit\" value=\"Send\" name=\"submit\">"
        +       "<div id=\"successClose\" style=\"display:none;\">Close</div>"
        +     "</div>"
        +   "</div>";
    return output;
}

//SOCIAL OPEN WINDOW
function rctools_openShareWindow(name,url,typeShare){
    // w = typeof w !== 'undefined' ? width : 550;
    var w = 550;
    var sTop = window.screen.height/2-(218);
    var sLeft = window.screen.width/2-(313);
    
    if(typeShare == "gettr"){
        window.open(url, 'sharer', 'toolbar=0,status=0,width=626,height=436,top=' + sTop + ',left=' + sLeft);
    }else{
        window.open(url,name,"height=450, width="+w+", top="+sTop+", left="+sLeft+", toolbar=0, location=0, menubar=0, directories=0, scrollbars=0");
    }
}

function rctools_initEmailControls(parent,title){

    //*CURRENT* EMAIL CONTAINER TARGET ELEMENT
    var emailBox = parent.find('.toolset_drawer .send-btn-form');

    //SET TRIGGER FOR + ICON
    var gindex = 1;
    emailBox.find(".addEmailBtn").click(function(){
        gindex++;
        rctools_addField(gindex,emailBox);
        emailBox.find('[data-index="' + (gindex).toString() + '"]').focus();
    });

    //SET TRIGGER TO ADD NEW FIELDS WHEN HITTING RETURN AND COMMA
    emailBox.on('keydown', 'input', function (event) {
        if (event.which == 13 || event.which == 188) {
            event.preventDefault();
            var $this = $(event.target);
            var index = parseFloat($this.attr('data-index'));
            $('[data-index="' + (index + 1).toString() + '"]').focus();
            if(index >=1){
                gindex++;
                rctools_addField(gindex,emailBox)
                emailBox.find('[data-index="' + (gindex).toString() + '"]').focus();
            }
        }
    });


    emailBox.find("#sendBtn").unbind("click").click(function(e){

        var emailForm = $(this).parent().parent();

        e.preventDefault();

        //emailBox.append("<h2>orale guey</h2>");
        //var title = $("title").html();

        emailForm.find(".emailLoader").show();
        emailForm.find(".fieldset").css({ "opacity" : "0.3" });

        //get site name via url
        var getUrl = document.domain;
        //strip params off url to get raw site name
        var url = getUrl.replace(".com","");
        var site = url.replace("www.","");
        var siteName = site.replace("www1.","");

        //Get the data-feed-url from the div.hover-social, or fall back on window.location.href
        var pageLink = parent.parent().parent().parent().attr('data-feed-url') || window.location.href;
        //Get the data-feed-name from the div.hover-social, or fall back on title passed in to the function
        title = parent.parent().parent().parent().attr('data-feed-name') || title;



        var name = emailForm.find("#senderName").val();
        var sEmail = emailForm.find("#senderEmail").val();
        var recEmail = emailForm.find("#recpEmail").val();
        var msg = emailForm.find("#optMessage").val();
        var send = true;

        if( name == "" ){
            //alert ('Please Add Name');
            emailForm.find("#msgBox").html("Please Add Name");
            emailForm.find("#msgBox").show().delay(3000).fadeOut();
            emailForm.find(".emailLoader").hide();
            emailForm.find(".fieldset").css({ "opacity" : "1" });
            send = false;
        }
        if( sEmail == "" ){
            //alert('Please Enter Email');
            emailForm.find("#msgBox").html("Please Enter Email");
            emailForm.find("#msgBox").show().delay(3000).fadeOut();
            emailForm.find(".emailLoader").hide();
            emailForm.find(".fieldset").css({ "opacity" : "1" });
            send = false;
        }
        if( recEmail == "" ){
            //alert('Please Enter Recipients Email');
            emailForm.find("#msgBox").html("Please Enter Recipients Email");
            emailForm.find("#msgBox").show().delay(3000).fadeOut();
            emailForm.find(".emailLoader").hide();
            emailForm.find(".fieldset").css({ "opacity" : "1" });
            send = false;
        }

        if( msg != "" ){
            if (emailForm.find('#optMessage').val().match(/<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/) || emailForm.find('#optMessage').val().match(/http/i) || emailForm.find('#optMessage').val().match(/www./i)) {
                //alert('msg has html');
                emailForm.find('#msgBox').html("NO Links or HTML allowed. Please re-enter Message.");
                emailForm.find("#msgBox").show().delay(3000).fadeOut();
                emailForm.find(".emailLoader").hide();
                emailForm.find(".fieldset").css({ "opacity" : "1" });
                var msg = emailForm.find("#optMessage").val("");
                send = false;
            }
        }

        //var emailArray = new Array('idelgado@rcp.com','delgado.ivan@gmail.com', 'mb@rcp.com');
        var emailArray = new Array();
        emailForm.find("#addEmailForm input").each(function(i){
            var emails = $(this).val();
            emailArray.push(emails);
        });
        emailArray.push(recEmail); //append first field

        //if(send == true){
        if(rctools_verifyEmail(sEmail) && rctools_verifyEmail(emailArray)){
            var sEmailLen = sEmail.length;
            var recEmailLen = recEmail.length;
            if(sEmailLen <= 200 && recEmailLen <= 200){

                if(send == true || send == "true"){
                    $.getJSON(window.location.protocol+"//util.realclearpolitics.com/email/app/sendemail.php?jsoncallback=?",{
                        name:name,
                        sEmail:sEmail,
                        recEmail:recEmail,
                        msg:msg,
                        siteName:siteName,
                        pageLink:pageLink,
                        emailArray:emailArray,
                        title:title
                    }, function(data) {

                        $.each(data, function(key,val){
                            if(key == "response"){
                                if(val == 1){

                                    emailForm.find(".emailLoader").hide();

                                    var name = $(".fieldset #senderName").val("");
                                    var sEmail = $(".fieldset #senderEmail").val("");
                                    var recEmail = $(".fieldset #recpEmail").val("");
                                    var msg = $(".fieldset #optMessage").val("");

                                    emailBox.find("#msgBox").html("Your email has been sent.");

                                    emailBox.find("#msgBox").show().delay(4000).fadeOut();

                                    //$('.toolset_drawer').delay(5000).hide(200);

                                }else if(val == 2){
                                    //alert('Please wait one minute before sending another email to a friend');
                                    emailForm.find("#msgBox").html("Please wait one minute before sending another email to a friend");
                                    emailForm.find("#msgBox").show().delay(3000).fadeOut();

                                    emailForm.find(".emailLoader").hide();
                                    emailForm.find(".fieldset").css({ "opacity" : "1" });
                                }else if(val == 3){
                                    emailForm.find("#msgBox").html("Error: Email did not send.  Please <a style='font-weight:bold; color:#FFFFFF; text-decoration:underline;' href='http://www.realclearpolitics.com/contact.html'>Contact Us</a> for support.");
                                    emailForm.find("#msgBox").show().delay(9000).fadeOut();

                                    emailForm.find(".emailLoader").hide();
                                    emailForm.find(".fieldset").css({ "opacity" : "0" });

                                    //parent.find('.toolset_drawer').delay(5000).hide(200);
                                }else{
                                    //alert('Error: Please try again');
                                    $("#msgBox").html("Error: Please try again");
                                    $("#msgBox").show().delay(3000).fadeOut();
                                    emailForm.find(".emailLoader").hide();
                                    emailForm.find(".fieldset").css({ "opacity" : "1" });
                                }
                            }
                        });
                    });
                } //end if send is true - no errors

            }else{
                //alert('Email is too long.  Please try again.');
                emailForm.find("#msgBox").html("Email is too long. Please try again.");
                emailForm.find("#msgBox").show().delay(3000).fadeOut();

                emailForm.find(".emailLoader").hide();
                emailForm.find(".fieldset").css({ "opacity" : "1" });
            }



        }else{
            //alert('Invalid Email. Please correct and try again');
            emailForm.find("#msgBox").html("Invalid Email. Please correct and try again.");
            emailForm.find("#msgBox").show().delay(3000).fadeOut();

            emailForm.find(".emailLoader").hide();
            emailForm.find(".fieldset").css({ "opacity" : "1" });
        }
        //} //end if send - no errors

    }); //end send to friend handler
}

//SENDMAIL HELPER FUNCS
function rctools_addField(gindex,box){
    var addEmailInput = '<input id="recpEmail" name="recEmail" type="text" data-index="'+gindex+'" /><br />';
    box.find("#addEmailForm").append(addEmailInput);
}

function rctools_verifyEmail(email) {

    // Validate an email address, or an array of addresses.
    var emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,20}$/;
    if(email.constructor === Array) {
        for(var i=0; i<email.length;i++) {
            if(!emailReg.test(email[i])) {
                return false;

            }
        }
        return true;
    } else {
        return emailReg.test(email);
    }
}

/*function get_pageviews() {
  var $pv = $('.socialBar-clicks');

  if($pv.length > 0 && $('body.polls').length == 0)
  {
    $.ajax({
      dataType: 'json',
      url: window.location.href.substring(0, window.location.href.lastIndexOf('.') ) + '.json',
      success: function(data)
      {
        console.log(data);
        var pageviews = 0;
        var pageviews_text = '';
        if(data.hasOwnProperty('today_pageviews')) {
          pageviews += parseInt(data['today_pageviews']);
        }
        if(data.hasOwnProperty('total_pageviews')) {
          pageviews += parseInt(data['total_pageviews']);
        }
        if(pageviews < 1) {
          $pv.hide();
          $('.socialBar-divide').hide();
        } else {
          pageviews_text = social_number_format(pageviews);
        }
        $pv.html(pageviews_text + ' <span class="label">Views</span>');
      },
      timeout: 2000,
      error: function(jqXHR, textStatus, errorThrown) {
        $pv.hide();
        $('.socialBar-divide').hide();
      }
    });
  } else {
    $('.socialBar-divide').hide();
  }
}*/

function social_number_format(num) {

    if(num < 1000) {
        return num;
    } else if(num < 10000) {
        return (Math.floor(num/100) / 10) + 'k';
    } else if(num < 1000000) {
        return Math.floor(num/1000) + 'k';
    } else if(num < 10000000) {
        return (Math.floor(num/100000) / 10) + 'M';
    } else if(num < 1000000000) {
        return Math.floor(num/1000000) + 'M';
    } else {
        return (Math.floor(num/100000000) / 10) + 'B'; // It could happen
    }
}

/*function populateShares(){
  $(".socialBar").each(function() {
    if($(this).parent().find('.socialBar-shares').length > 0 ||
      $(this).parent().parent().next('.socialBar-bottom-counts').length > 0 ||
      $(this).parent().parent().next('.socialBar-top-counts').length > 0 ||
      $(this).parent().parent().next('.socialBar-mobile-counts').length > 0
    ) {

      //console.log('length: '+$(this).parent().find('.socialBar-shares').length);
      //console.log('length: '+$(this).parent().parent().next('.socialBar-bottom-counts').length);
      populateSharesSingle($(this));
    }
  });
}

function populateSharesSingle(container){
  var shareUrl = '';
  if( typeof container.attr("data-src-url") !=="undefined" ){
    shareUrl = container.attr("data-src-url");
  }else{
    shareUrl = window.location.href;
  }

  //console.log("This Here URL... " + shareUrl);

  $.ajax({
    url: 'https://graph.facebook.com/?id='+shareUrl,
    dataType: 'jsonp',
    ref: container,
    success: function(data){
      var ref = this.ref;
      // New data structure, post 8/19/2016
      var share = data.share;
      //console.log(share);
      var shareCount = 0;
      if( typeof share !== 'undefined') { // case where no shares available yet
        shareCount = share.share_count;
        if( shareCount == '' || shareCount == 'undefined' || shareCount == undefined ){
          shareCount = 0;
        }else{
          shareCount = shareCount;
        }
      }
      ref.fbDone=true;
      ref.fbShares = shareCount;
      socialDone(ref);
    },
    timeout: 4000,
    error: function(jqXHR, textStatus, errorThrown) {
      this.ref.fbDone=true;
      this.ref.fbShares = 0;
      socialDone(this.ref);
    }
  });

  $.ajax({
      url: 'https://www.linkedin.com/countserv/count/share?url='+shareUrl+'&callback=myCallback&format=jsonp',
      ref: container,
      dataType: "jsonp",
      jsonpCallback: "myCallback",
      success: function (data) {
        var ref = this.ref;
      $(data).each(function(i,k){
        var linCount = k.count;
        ref.linDone=true;
        ref.linkedCount = linCount;
        socialDone(ref);
      });
      },
      timeout: 4000,
      error: function(jqXHR, textStatus, errorThrown) {
        this.ref.linDone=true;
        this.ref.linkedCount = 0;
        socialDone(this.ref);
      }
  });

}*/

function socialDone(c){
    //M.B. updated 9.8.16 - removing twitter from totals as they do not offer counts anymore
    if( c.fbDone == true && c.linDone == true ){
        //if( c.fbDone == true && c.twtDone == true && c.linDone == true ){
        //console.log('successful c:');
        //console.log(c);
        //total shared count from all 3 social networks
        //console.log('fb: '+c.fbShares + ', twt: ' + c.twtCount + ', li: ' + c.linkedCount);

        //M.B. UPDATED 9.8.16 - NO MORE TWITTER
        var totalSharesCount = c.fbShares + c.linkedCount;
        //var totalSharesCount = c.fbShares + c.twtCount + c.linkedCount;
        //formatted version of the total share count - 12,365 total == 12.3k
        var totalCount = nFormatter(totalSharesCount);

        if( totalSharesCount > 49 ){
            //$(".socialBar-shares").html(totalCount + ' <span class="label">Shares</span>');
            //$(".socialBar-divide").css({"display" : "inline-block"});
            //$(".socialBar-shares").css({"display" : "inline-block"});
            c.parent().find(".socialBar-shares").each(function() {
                $(this).html(totalCount + ' <span class="label">Shares</span>');
                $(this).css({"display" : "inline-block"});
                if($(this).parent().find('.socialBar-clicks').is(':visible')) {
                    $(this).parent().find('.socialBar-divide').css({"display" : "inline-block"});
                }
            });
            c.parent().parent().next('.socialBar-bottom-counts').find('.socialBar-shares').each(function() {
                $(this).html(totalCount + ' <span class="label">Shares</span>');
                $(this).css({"display" : "inline-block"});
                if($(this).parent().find('.socialBar-clicks').is(':visible')) {
                    $(this).parent().find('.socialBar-divide').css({"display" : "inline-block"});
                }
            });
        }else{
            //$(".socialBar-shares").html(totalCount + ' <span class="label">Shares</span>');
            //$(".socialBar-divide").css({"display" : "none"});
            //$(".socialBar-shares").css({"display" : "none"});
            c.parent().find(".socialBar-shares").each(function() {
                $(this).html(totalCount + ' <span class="label">Shares</span>');
                $(this).css({"display" : "none"});
                $(this).parent().find('.socialBar-divide').css({"display" : "none"});
            });
        }
    }
}
//function to format numeric results - 12,654 == 12.6k etc,...
function nFormatter(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
}

//GET SOCIAL NETWORK SHARE COUNTS
function getFbShareCount(){
    var shareUrl = window.location.href;
    $.ajax({
        url: 'https://graph.facebook.com/?id='+shareUrl,
        success: function(data){
            $(data).each(function(i,k){
                //alert(k.shares);
                var fbShares = k.shares;
                if( fbShares == '' || fbShares == 'undefined' || fbShares == undefined ){
                    fbShares = 0;
                }else{
                    fbShares = fbShares;
                    $(".fb_icon .bubble").css({ "display" : "block" });
                }
                $(".fb_icon .bubble").html(fbShares);
            });
        }
    });
}

function getTweetCount(){
    var shareUrl = window.location.href;
    $.ajax({
        url: 'https://urls.api.twitter.com/1/urls/count.json?url='+shareUrl,
        dataType: "jsonp",
        success: function (data) {
            $(data).each(function(i,k){
                //alert(k.shares);
                var twtCount = k.count;
                if( twtCount == '' ){
                    twtCount = 0;

                }else{
                    twtCount = twtCount;
                    $(".tweet_icon .bubble").css({ "display" : "block" });
                }
                $(".tweet_icon .bubble").html(twtCount);

            });
        }
    });
}

function getLinkedCount(){
    var shareUrl = window.location.href;
    $.ajax({
        url: 'https://www.linkedin.com/countserv/count/share?url='+shareUrl+'&callback=myCallback&format=jsonp',
        dataType: "jsonp",
        jsonpCallback: "myCallback",
        success: function (data) {
            $(data).each(function(i,k){
                //alert(k.shares);
                var linkedCount = k.count;
                if( linkedCount == '' ){
                    linkedCount = 0;

                }else{
                    linkedCount = linkedCount;
                    $(".lnkdin_icon .bubble").css({ "display" : "block" });
                }
                $(".lnkdin_icon .bubble").html(linkedCount);
            });
        }
    });
}

//SET UP FACEBOOK COMMENTS/ADMINS ELEMENTS - MUST GO BEFORE EXECUTION OF FACEBOOK SDK
/*function load_fbcomments() {

  var comments_container = document.getElementById("fb-comments-container");


  if(comments_container != null ) {
    var div_fb_comments = document.createElement("div");
    div_fb_comments.setAttribute("class","fb-comments");
    div_fb_comments.setAttribute("data-href", window.location.hostname+window.location.pathname);
    div_fb_comments.setAttribute("data-numposts", "20");
    div_fb_comments.setAttribute("data-colorscheme", "light");
    div_fb_comments.setAttribute("data-width", "100%");
    comments_container.appendChild(div_fb_comments);
  }
//END SET UP FACEBOOK ELEMENTS
}
*/

function load_fb_sdk() {

    window.fbAsyncInit = function() {
        // init the FB JS SDK
        FB.init({
            appId      : SITE_INFO['FB_app_id'],  // App ID from the app dashboard
            status     : true,                    // Check Facebook Login status
            xfbml      : true,                    // Look for social plugins on the page
            version    : 'v4.0',
        });
        // channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel file for x-domain comms
        // Additional initialization code such as adding Event Listeners goes here
    };
  
    // Load the SDK asynchronously
    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/all.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  
}









////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
}

function isVisible(el) {
    return !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length );
}

function isVisibleOnScreen(elm) {
    var rect = elm.getBoundingClientRect();
    var doc = document.documentElement;
    var viewHeight = Math.max(doc.clientHeight, window.innerHeight);

    // console log if true
    /*if(!(rect.bottom < 0 || rect.top >= viewHeight || (rect.height == 0 && rect.width == 0))) {
    console.log('-----------------------------------------');
    console.log(elm);
    console.log('rect.bottom: '+rect.bottom);
    console.log('rect.top: '+rect.top);
    console.log('topScroll: '+viewHeight);
    console.log('-----------------------------------------');
  }*/

    return !(rect.bottom < 0 || rect.top >= viewHeight || (rect.height == 0 && rect.width == 0));
}

function firstVisibleElement(str) {

    var results = Array.prototype.slice.call(document.querySelectorAll(str))

        .filter(function (item,index) {

            if( isVisible(item) ) {
                return true;
            } else {
                return false;
            }
        });

    if(results && results.length) {
        return results[0];
    } else {
        return null;
    }
}

if( typeof readCookie === 'undefined' ){
    function readCookie(name) {

        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
}

if( typeof createCookie === 'undefined' ){
    function createCookie(name,value,days, expire_in_hours ) {

        if (days) {
            //allows us to set cookie expirations based on hours rather than days
            if(typeof expire_in_hours !== 'undefined' && expire_in_hours == true){
                var date = new Date();
                date.setTime(date.getTime()+(days*60*60*1000));
                var expires = "; expires="+date.toGMTString();
            }else{
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                var expires = "; expires="+date.toGMTString();
            }
        }
        else var expires = "";
        document.cookie = name+"="+value+expires+"; path=/; domain=."+getDomain()+"";
    }
}

if( typeof eraseCookie === 'undefined' ){
    function eraseCookie(name) {

        createCookie(name,"",-1);
    }
}

//handler to fire script from script
function loadscript(script_url, target_id, callback, attr_obj)
{
    var elem = document.getElementById(target_id);

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = script_url;

    if(typeof attr_obj != 'undefined')
    {
        for(var k in attr_obj) {
            script[k] = attr_obj[k];
            script.attributes[k] = attr_obj[k];
            script.setAttribute(k, attr_obj[k]);
        }
    }

    if(callback != null) {
        script.onreadystatechange = callback;
        script.onload = callback;
    }
    elem.appendChild(script);
}

function getDocHeight() {
    var D = document;
    return Math.max(
        D.body.scrollHeight, D.documentElement.scrollHeight,
        D.body.offsetHeight, D.documentElement.offsetHeight,
        D.body.clientHeight, D.documentElement.clientHeight
    );
}

if( typeof getDomain === 'undefined' ){
    //used with createcookie function to match domain
    function getDomain(){

        var path = window.location.host;
        if(path.substr(0,3)=='www'){
            var per=path.indexOf('.')
            per=per+1;
            path=path.substr(per);
        }
        return path;
    }
}

//gets querystring variable value
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
}

Utils.get_query_param = function(name){
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

Utils.append_device_file = function(){
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = '//wurfl.io/wurfl.js';
    document.head.appendChild(script);
    Utils.global_settings.device_detect_loaded = true;
}

Utils.load_script = function(url){

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    document.head.appendChild(script);
}

Utils.append_device_file();

//converts accented letters to plain asscii version - used in making slugs
Utils.removeDiacritics = function(str){
    var defaultDiacriticsRemovalMap = [
        {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
        {'base':'AA','letters':/[\uA732]/g},
        {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
        {'base':'AO','letters':/[\uA734]/g},
        {'base':'AU','letters':/[\uA736]/g},
        {'base':'AV','letters':/[\uA738\uA73A]/g},
        {'base':'AY','letters':/[\uA73C]/g},
        {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
        {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
        {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
        {'base':'DZ','letters':/[\u01F1\u01C4]/g},
        {'base':'Dz','letters':/[\u01F2\u01C5]/g},
        {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
        {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
        {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
        {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
        {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
        {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
        {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
        {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
        {'base':'LJ','letters':/[\u01C7]/g},
        {'base':'Lj','letters':/[\u01C8]/g},
        {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
        {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
        {'base':'NJ','letters':/[\u01CA]/g},
        {'base':'Nj','letters':/[\u01CB]/g},
        {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
        {'base':'OI','letters':/[\u01A2]/g},
        {'base':'OO','letters':/[\uA74E]/g},
        {'base':'OU','letters':/[\u0222]/g},
        {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
        {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
        {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
        {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
        {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
        {'base':'TZ','letters':/[\uA728]/g},
        {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
        {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
        {'base':'VY','letters':/[\uA760]/g},
        {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
        {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
        {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
        {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
        {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
        {'base':'aa','letters':/[\uA733]/g},
        {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
        {'base':'ao','letters':/[\uA735]/g},
        {'base':'au','letters':/[\uA737]/g},
        {'base':'av','letters':/[\uA739\uA73B]/g},
        {'base':'ay','letters':/[\uA73D]/g},
        {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
        {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
        {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
        {'base':'dz','letters':/[\u01F3\u01C6]/g},
        {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
        {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
        {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
        {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
        {'base':'hv','letters':/[\u0195]/g},
        {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
        {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
        {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
        {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
        {'base':'lj','letters':/[\u01C9]/g},
        {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
        {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
        {'base':'nj','letters':/[\u01CC]/g},
        {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
        {'base':'oi','letters':/[\u01A3]/g},
        {'base':'ou','letters':/[\u0223]/g},
        {'base':'oo','letters':/[\uA74F]/g},
        {'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
        {'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
        {'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
        {'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
        {'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
        {'base':'tz','letters':/[\uA729]/g},
        {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
        {'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
        {'base':'vy','letters':/[\uA761]/g},
        {'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
        {'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
        {'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
        {'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
    ];

    for(var i=0; i<defaultDiacriticsRemovalMap.length; i++) {
        str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
    }

    return str;
}


Utils.make_slug = function(string){

    string = Utils.removeDiacritics(string);

    return string.toString() //convert variable to string
        .replace(/  +/g, ' ') //convert multiple spaces to one
        .replace(/ & /g, '_and_') //convert ampersand to string and
        .replace(/&/g, '_and_') //convert ampersand to string and
        .replace(/ /g, '_') //converts spaces to underscores
        .replace(/_+/g, '_') //convert multiple underscores to single
        .replace(/-+/g, '-') //convert multiple dashes to single
        .toLowerCase() //lowercase
        .replace(/[^\w-]/g, ""); //clean out special chars
}

//*Global Click Tracking
// Track a click with ClickTracking.record_click(event, entry_id, atxt, site_module, section);
//
// */

var ClickTracking = {
    site: SITE_INFO['name'],
    ajax: function(sURL) {
        //Takes sURL and makes a GET request.
        var oReq = new XMLHttpRequest();
        oReq.arguments = Array.prototype.slice.call(arguments, 2);
        oReq.onload = function(e) { console.log(oReq.responseText) };
        oReq.onerror = function(e) { console.log(oReq.responseText); };
        oReq.open("get", sURL, true);
        oReq.send(null);
    },
    record_click: function(event, entry_id, atxt, site_module, section, permanent, position, partner_title) {
        // Takes parameters and builds a call to click tracker service.
        event = event || window.event; //The click event, or a fallback value
        var href = '';

        // console.log("event target: "+event.target.nodeName);

        if(event.target.nodeName=="IMG"){ //incase we are linking images
            href = event.target.parentNode.href;
        }else{

            if(event.target.href.length > 2) {
                href = event.target.href;
            } else {
                href = event.target.parentNode.href;
            }
        }

        //Build the params to go to click tracking.
        var url = window.location.protocol+'//util.realclearpolitics.com/trackclicks/trackclick.php?';
        url += 'site='+this.site+'&';
        if(typeof(entry_id) != 'undefined') url += 'entry_id='+entry_id+'&';
        if(typeof(atxt) != 'undefined') url += 'atxt='+atxt+'&';
        if(typeof(site_module) != 'undefined') url += 'site_module='+site_module+'&';
        url += 'entry_url='+href+'&';
        if(typeof(section) != 'undefined') url += 'section='+section;
        if(parseInt(permanent) == 1) url += '&perm='+'1'+'&position='+position+'&partner_title='+partner_title;

        try{
            var tclick = this.ajax(url);
            console.log(tclick);
        } catch(err) {
            console.log("Track failed: "+err.message);
        } finally {
            if(event.ctrlKey || event.metaKey) { //If right-click or control click
                return true;
            } else {

                target = event.target.target;


                if(typeof target !== "undefined" && target !== false && target == '_blank'){ 
                    window.open(href);
                }else{

                    //CATCHALL FOR OLDER BROWSERS -- NEW BROWSERS WERE ABLE TO LEVERAGE LINK HREF COMMAND WITHOUT THE NEED OF BELOW REDIRECT
                    window.setTimeout('document.location = "' + href + '"', 100); //Go to hyperlink
                    return false;

                    //AUTOREFRESH FOR INTERSTITIAL OUTBOUND LINKS RUNNING OFF ADSUPPLY - AUTOREDIRECTS TO OUTBOUND LINK FROM INTERSTITIAL SCREEN AFTER X SECS
                    /*setTimeout(function(){
                        document.location = href; //Go to hyperlink
                        return false;
                   },10000); //delay is in milliseconds 

                    */
                }

            }
        }
    }
};

//**End Click Tracking**/











////////////////////////////////////////////////////////////////////////////////
// SCRIPT LOADING FUNCTIONS ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*

NAME: loadScriptsDynamicSync
INPUT: arr_of_scripts (array of objects)
RETURNS: -
SIDE EFFECT: writes script tags in order to trigger synchronous execution

By writing a script tag directly to the page we are able to trigger a dynamic
synchronous execution of a js file.

arr_of_scripts must be an array of objects that at least have a property of
'src' equal to some valid javascript url.

We also allow any additional attributes to be specified.

*/

function loadScriptsDynamicSync(arr_of_scripts) {

    for(var i = 0; i < arr_of_scripts.length; i++) {

        var extra_attr = '';

        for(var key in arr_of_scripts[i]) {
            if(arr_of_scripts[i].hasOwnProperty(key)) {

                if(key != 'src') {

                    extra_attr += ' '+key+'="'+arr_of_scripts[i][key]+'" ';
                }
            }
        }

        document.write('\x3Cscript type="text/javascript" src="'+arr_of_scripts[i]['src']+'" '+extra_attr+'>\x3C/script>');
    }
}











////////////////////////////////////////////////////////////////////////////////
// WIDGETS FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function load_widget(widget_id, w_container)
{
    // If Ora right col loading, and recommended widget attempting load, cancel
    if(SITE_INFO['name'] == 'politics' && widget_id == 2 && document.querySelector('#oraPlayer') ) {
        return;
    }
    
    if(typeof w_container[0] === 'undefined') {
        return;
    } else if(typeof w_container[0].loaded_dropdown_widgets === 'undefined') {
        w_container[0].loaded_dropdown_widgets = '';
    }
    w_container.addClass('overlay');
    var now_time = new Date().getTime();
    now_time = Math.floor(now_time / 100000); // Changes every 100 seconds
    $.get(
        '/widget/'+widget_id+'.json?no_cache='+now_time,
        function(widget_data) {

            w_container.attr('data-widget-type', widget_data['type']);
            w_container.attr('data-widget-title', widget_data['title']);

            if(widget_data['type'] == 'feed')
            {
                if(widget_data['feed_info']['feed_type'] == 'json')
                {
                    if(typeof widget_data['feed_info']['jsonp_callback'] !== 'undefined')
                    {
                        // Is JSONP
                        $.ajax({
                            crossDomain: true,
                            url: widget_data['feed_info']['feed_url']+'?no_cache='+now_time,
                            dataType: 'jsonp',
                            jsonp: 'callback',
                            jsonpCallback: widget_data['feed_info']['jsonp_callback'],
                            container_ref: w_container,
                            success : function(feed_data) {
                                feed_loaded(widget_data, feed_data, this.container_ref);
                                this.container_ref.removeClass('overlay');
                            }
                        });
                    }
                    else
                    {
                        // Is JSON
                        /*$.getJSON(widget_data['feed_info']['feed_url'], function(feed_data)
            {
              feed_loaded(widget_data, feed_data, w_container);
              w_container.removeClass('overlay');
            });*/
                        $.ajax({
                            dataType: 'json',
                            url: widget_data['feed_info']['feed_url']+'?no_cache='+now_time,
                            container_ref: w_container,
                            success: function(feed_data)
                            {
                                feed_loaded(widget_data, feed_data, this.container_ref);
                                this.container_ref.removeClass('overlay');
                            }
                        });
                    }
                }
                else if(widget_data['feed_info']['feed_type'] == 'rss')
                {
                    // Is XML
                    $.ajax({
                        type: 'GET',
                        url: widget_data['feed_info']['feed_url']+'?no_cache='+now_time,
                        dataType: 'xml',
                        container_ref: w_container,
                        success : function(feed_xml) {
                            feed_loaded(widget_data, feed_xml, this.container_ref);
                            this.container_ref.removeClass('overlay');
                        }
                    });
                }
            }
            else if(widget_data['type'] == 'story_stream')
            {
                story_stream_loaded(widget_data, w_container);
                w_container.removeClass('overlay');
            }
            else if(widget_data['type'] == 'race')
            {
                // JSONP historical data
                $.ajax({
                    crossDomain: true,
                    url: 'https://www.realclearpolitics.com/epolls/json/'+widget_data['race_id']+'_historical.js?no_cache='+now_time,
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    jsonpCallback: 'return_json',
                    container_ref: w_container,
                    success : function(historical_data) {

                        // Get candidates JSON
                        $.ajax({
                            dataType: 'json',
                            url: '/poll/race/'+widget_data['race_id']+'/candidates.json?no_cache='+now_time,
                            container_ref: this.container_ref,
                            success: function(candidates_data)
                            {
                                $.ajax({
                                    dataType: 'json',
                                    url: '/poll/race/'+widget_data['race_id']+'/polling_data.json?no_cache='+now_time,
                                    container_ref: this.container_ref,
                                    success: function(polling_data)
                                    {
                                        var race_title = polling_data['moduleInfo']['title'];
                                        race_loaded(widget_data, historical_data, candidates_data, this.container_ref, race_title);
                                        this.container_ref.removeClass('overlay');
                                    }
                                });
                            }
                        });

                        // Get candidates json
                        // $.getJSON('/poll/race/'+widget_data['race_id']+'/candidates.json?no_cache='+now_time, function(candidates_data)
                        // {
                        //  // Get polling data json just for race title
                        //  $.getJSON('/poll/race/'+widget_data['race_id']+'/polling_data.json?no_cache='+now_time, function(polling_data)
                        //  {
                        //    var race_title = polling_data['moduleInfo']['title'];
                        //    race_loaded(widget_data, historical_data, candidates_data, this.container_ref, race_title);
                        //    this.container_ref.removeClass('overlay');
                        //  });
                        // });
                    }
                });
            }
            else if(widget_data['type'] == 'rcp_averages')
            {
                var race_id_arr = widget_data['race_ids'].replace(/ /g, '').split(',');

                rcp_avg_w_total = race_id_arr.length;

                for(var i = 0; i < race_id_arr.length; i++)
                {
                    $.ajax({
                        dataType: 'json',
                        url: '//www.realclearpolitics.com/poll/race/'+race_id_arr[i]+'/historical_data.json?no_cache='+now_time,
                        container_ref: w_container,
                        i_ref: i,
                        success : function(historical_data) {

                            rcp_avg_w_data[this.i_ref] = historical_data;
                            rcp_avg_w_loaded(widget_data, this.container_ref);
                        }
                    });
                }
            }
            else if(widget_data['type'] == 'head_to_head')
            {
                head_to_head_loaded(widget_data, w_container);
                w_container.removeClass('overlay');
            }
            else if(widget_data['type'] == 'latest_polls')
            {
                // Get json latest polls feed
                $.ajax({
                    dataType: 'json',
                    url: widget_data['feed_info']['feed_url'],
                    container_ref: w_container,
                    success: function(latest_polls_data)
                    {
                        latest_polls_loaded(widget_data, latest_polls_data, this.container_ref);
                        this.container_ref.removeClass('overlay');
                    }
                });
            }
            else if(widget_data['type'] == 'custom')
            {
                custom_widget_loaded(widget_data, w_container);
                w_container.removeClass('overlay');
            }
        },'json');
}

function rcp_avg_w_loaded(widget_data, w_container)
{
    for(var i = 0; i < rcp_avg_w_total; i++)
    {
        if(typeof rcp_avg_w_data[i] === 'undefined') {
            return;
        }
    }
    w_container.removeClass('overlay');

    console.log('rcp_avg_w_data');
    console.log(rcp_avg_w_data);

    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    w_container[0].current_item_num = 0;

    var subtitle = '';
    var hide_dropdown = 'style="display:none;"';
    if(widget_data['dropdown_title'].length > 0 && widget_data['dropdown_widgets'].length > 0) {
        subtitle = '<span class="buffer">Select Poll</span>';
        hide_dropdown = '';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header">';
    widget_html += '<div class="rec-title"><img class="title_icon" src="/asset/img/poll-widget-icon.png" alt="Story Stream Icon" /> '+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+hide_dropdown+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            if(w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    var max_height_style = '';
    if(widget_data['max_height'] > 0) {
        max_height_style = 'style="max-height: '+widget_data['max_height']+'px;"';
    }
    widget_html += '<div class="rec-link-body" '+max_height_style+'>';

    // Body of Widget
    var ul_classes = '';

    if(widget_data['max_height'] > 0) {
        ul_classes += ' scroll';
    }

    widget_html += '<ul class="'+ul_classes+'">';

    for(var i=0; i < rcp_avg_w_data.length; i++)
    {
        if(i >= widget_data['item_limit']) {
            break;
        }

        var candidates = rcp_avg_w_data[i]['rcp_avg'][0]['candidate'];

        widget_html += '<li>';
        widget_html += '<div class="content_wrapper rcp_averages">';

        var this_title = rcp_avg_w_data[i]['title'];
        if(typeof rcp_avg_w_data[i]['custom_title'] !== 'undefined') {
            if(rcp_avg_w_data[i]['custom_title'].length > 2) {
                this_title = rcp_avg_w_data[i]['custom_title'];
            }
        }

        widget_html += '<div class="title"><a href="'+rcp_avg_w_data[i]['link']+'">'+this_title+'</a></div>';
        widget_html += '<div class="byline">RCP Average</div>';

        widget_html += '<ul class="candidates">';

        var highest_name = '';
        var highest_score = 0;
        var second_highest_score = 0;
        for(var j = 0; j < candidates.length; j++)
        {
            if( parseInt(candidates[j]['value'] * 10) == 0 ) {
                continue;
            }
            if(j >= 8 && rcp_avg_w_data[i]['id'] == '6730') { // Max 8 candidates for Dem Nom 2020
                break;
            }
            var c_name = '';
            if(candidates[j]['name'] != '') {
                c_name = candidates[j]['name'];
            } else {
                c_name = candidates[j]['affiliation'];
            }

            var this_score = parseInt(candidates[j]['value'] * 10);
            if(this_score > highest_score)
            {
                highest_name = c_name;
                second_highest_score = highest_score;
                highest_score = this_score;
            }
            else if(this_score > second_highest_score)
            {
                second_highest_score = this_score;
            }

            // Add 's' if appropriate
            if(highest_name.toLowerCase() == 'democrat' || highest_name.toLowerCase() == 'republican') {
                highest_name += 's';
            }

            widget_html += '<li><span class="name">'+c_name+'</span><span class="score">'+candidates[j]['value']+'</span></li>';
        }
        widget_html += '</ul>';

        var spread = highest_name+' +' + (Math.round(highest_score - second_highest_score) / 10).toFixed(1);

        widget_html += '<div class="spread"><a href="'+rcp_avg_w_data[i]['link']+'">'+spread+'</a></div>';

        widget_html += '</div>';
        widget_html += '</li>';
    }
    widget_html += '</ul>';

    if(widget_data['max_height'] > 0) {
        widget_html += '<div class="white-overlay"></div>';
    }

    widget_html += '</div>';

    w_container.html(widget_html);

    bottom_fade(w_container);

    widget_link_events(w_container);
}

function custom_widget_loaded(widget_data, w_container)
{
    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    var new_dropdown_color = '';
    var subtitle_color = '';
    if(w_container[0].loaded_dropdown_widgets == 'none') {
        new_dropdown_color = 'style="background:none;"';
    } else if(widget_data['text_color'] == '#000000') {
        subtitle_color = 'style="color:'+widget_data['text_color']+';"';
        //new_dropdown_color = 'style="background-image:url(/asset/img/grey-bg-chev.png)"';
    }

    var subtitle = '';
    if(widget_data['dropdown_title'] !== null && widget_data['dropdown_title'].length > 0) {
        subtitle = '<span class="buffer" '+subtitle_color+'>'+widget_data['dropdown_title']+'</span>';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header">';
    widget_html += '<div class="rec-title" style="color:'+widget_data['text_color']+';">'+widget_data['title']+'</div>';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<div class="rec-site" '+new_dropdown_color+'>';
        widget_html += '<div class="name">'+subtitle+'</div>';
        if(w_container[0].loaded_dropdown_widgets != 'none') {
            widget_html += '<div class="menu"></div>';
        }
        widget_html += '<span class="rec-site-tab"></span>';
        widget_html += '<div class="rec-site-list">';

        if(w_container[0].loaded_dropdown_widgets != 'none')
        {
            widget_html += '<ul>';

            for(var key_d in w_container[0].loaded_dropdown_widgets)
            {
                var d_title = '';
                if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                    && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                    && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                    d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
                } else {
                    d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
                }

                var d_color = '';
                var d_background_color = 'data-bcolor=""';
                if(typeof w_container[0].loaded_dropdown_widgets[key_d]['color'] !== 'undefined' && w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                    d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                    d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
                }
                widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
            }

            widget_html += '</ul> ';
        }

        widget_html += '</div>';
        widget_html += '</div>';
    }

    widget_html += '</div>';

    widget_html += '<div class="rec-link-body custom_widget_body">';

    widget_html += widget_data['custom_top'];

    widget_html += '</div>';

    w_container.html(widget_html);

    recommendedSitesMenu(w_container);
    recommendedSitesMenuHover();
    recommendedSitesMenuItems(w_container);
    widget_link_events(w_container);

    if(parseInt(widget_data['id']) == 38 && SITE_INFO['name'] == 'world') { // Countries widget
        loadCountriesMenu();
    }

    if(parseInt(widget_data['id']) == 50 && SITE_INFO['name'] == 'energy') { // States widget
        loadStatesMenu();
    }

    /**
     * Triggers an event after the widget is ready for anyone listening
     */
    processWidgetReadyEvent(widget_data);
}

function head_to_head_loaded(widget_data, w_container)
{
    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    var new_dropdown_color = '';
    var subtitle_color = '';
    if(w_container[0].loaded_dropdown_widgets == 'none') {
        new_dropdown_color = 'style="background:none;"';
    } else if(widget_data['text_color'] == '#000000') {
        subtitle_color = 'style="color:'+widget_data['text_color']+';"';
        //new_dropdown_color = 'style="background-image:url(/asset/img/grey-bg-chev.png)"';
    }

    var subtitle = '';
    if(widget_data['dropdown_title'].length > 0) {
        subtitle = '<span class="buffer" '+subtitle_color+'>'+widget_data['dropdown_title']+'</span>';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header">';
    widget_html += '<div class="rec-title" style="color:'+widget_data['text_color']+';"><img class="title_icon" src="/asset/img/flag-icon.png" alt="Flag Icon" />'+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+new_dropdown_color+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['color'] !== 'undefined' && w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    widget_html += '<div class="head_to_head_candidates">';
    widget_html += '<div class="menu">';
    widget_html += '<img src="/asset/img/grey-bg-chev.png">';
    widget_html += '</div>';
    widget_html += '<div class="names"></div>';
    widget_html += '</div>';

    if(widget_data['dropdown_races'].length > 0)
    {
        widget_html += '<div class="head_to_head_race_dropdown"><ul>';

        for(var key_d in widget_data['dropdown_races'])
        {
            var d_title = widget_data['dropdown_races'][key_d]['title'];
            var d_id = widget_data['dropdown_races'][key_d]['id'];

            widget_html += '<li class="race_dropdown_link_'+d_id+'"><span data-id="'+d_id+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul></div>';
    }

    widget_html += '<div class="rec-link-body head_to_head_body"></div>';

    w_container.html(widget_html);

    get_head_to_head_body(widget_data, w_container);

    head_to_head_menu_init();

    race_dropdown_items_init(widget_data, w_container);

    recommendedSitesMenu(w_container);
    recommendedSitesMenuHover();
    recommendedSitesMenuItems(w_container);
    widget_link_events(w_container);

    /**
     * Triggers an event after the widget is ready for anyone listening
     */
    processWidgetReadyEvent(widget_data);
}

function head_to_head_menu_init(){
    $('.head_to_head_candidates .menu').click(function(){
        $(this).parent().parent().find('.head_to_head_race_dropdown').toggle();
    });
}

// Race dropdown menu items click
function race_dropdown_items_init(widget_data, w_container)
{
    $('.head_to_head_race_dropdown ul li span').click(
        {
            widget_data_ref:widget_data,
            container_ref:w_container
        },
        function(event)
        {
            get_head_to_head_body(event.data.widget_data_ref, event.data.container_ref, $(this).attr('data-id'));
            //$('.head_to_head_race_dropdown').toggle();
            $(this).parent().parent().parent().toggle();
        });
}

function get_head_to_head_body(widget_data, w_container, new_race_id)
{
    // JSON polling data
    var now_time = new Date().getTime();
    now_time = Math.floor(now_time / 100000); // Changes every 100 seconds

    var target_id = 0;
    if(typeof new_race_id === 'undefined') {
        target_id = widget_data['dropdown_races'][0]['id'];
    } else {
        target_id = new_race_id;
    }

    $.getJSON('/poll/race/'+target_id+'/polling_data.json?no_cache='+now_time, function(polling_data)
    {
        var body_html = '';

        if(polling_data['poll'][0]['pollster'] == 'rcp_average')
        {
            body_html += '<div class="race-wrapper">';
            body_html += '<div class="photos">';

            for(var i = 0; i < polling_data['poll'][0]['candidate'].length; i++)
            {
                if(i > 1) {
                    break;
                }
                if(i > 0) {
                    body_html += '<div class="vert-separator"></div>';
                }
                var aff = affiliation_to_abbr(polling_data['poll'][0]['candidate'][i]['affiliation'], polling_data['poll'][0]['candidate'][i]['name']);

                var c_image_source = '';

                if(is_approve_candidate(polling_data['poll'][0]['candidate'][i]['name'])) {
                    c_image_source = '/asset/img/approve.png';
                } else if(is_disapprove_candidate(polling_data['poll'][0]['candidate'][i]['name'])) {
                    c_image_source = '/asset/img/against.png';
                } else {
                    c_image_source = window.location.protocol+'//www.realclearpolitics.com/epolls/images/'+polling_data['poll'][0]['candidate'][i]['id']+'.jpg';
                }
                body_html += '<div class="candidate '+aff+'"><img class="c_photo" onerror="this.style.display = \'none\';" src="'+c_image_source+'" alt="'+polling_data['poll'][0]['candidate'][i]['name']+'" /><img class="overlay" onerror="this.style.display = \'none\';" src="/asset/img/'+aff+'-bg.png"></div>';
            }

            body_html += '</div>';
            body_html += '<div class="scores">';

            for(var i = 0; i < polling_data['poll'][0]['candidate'].length; i++)
            {
                if(i > 1) {
                    break;
                }
                var aff = affiliation_to_abbr(polling_data['poll'][0]['candidate'][i]['affiliation'], polling_data['poll'][0]['candidate'][i]['name']);
                var score = polling_data['poll'][0]['candidate'][i]['value'];

                body_html += '<div class="'+aff+'-score">'+score+'%</div>';
            }

            body_html += '</div>';
            body_html += '<div class="score-bar">';

            // Find sum of top two candidate scores (for calculating bar width)
            var score_sum = 0;
            for(var i = 0; i < polling_data['poll'][0]['candidate'].length; i++)
            {
                if(i > 1) {
                    break;
                }
                score_sum += parseFloat(polling_data['poll'][0]['candidate'][i]['value']);
            }

            for(var i = 0; i < polling_data['poll'][0]['candidate'].length; i++)
            {
                if(i > 1) {
                    break;
                }
                var aff = affiliation_to_abbr(polling_data['poll'][0]['candidate'][i]['affiliation'], polling_data['poll'][0]['candidate'][i]['name']);
                var bar_width = ( Math.floor(parseFloat(polling_data['poll'][0]['candidate'][i]['value'])) / score_sum ) * 268;

                body_html += '<div class="'+aff+'-bar" style="width:'+bar_width+'px;"></div>';
            }
            body_html += '<div class="marker"></div>';

            body_html += '</div> ';
            body_html += '</div>';

            // Also write dropdown title custom to show candidate 1 v candidate 2
            w_container.find('.head_to_head_candidates .names').html('<span class="dem">'+polling_data['poll'][0]['candidate'][0]['name']+'</span><span class="versus"> v </span><span class="gop">'+polling_data['poll'][0]['candidate'][1]['name']+'</span>');
        }

        w_container.find('.head_to_head_body').html(body_html);
    });
}

function affiliation_to_abbr(aff, name)
{
    if(aff.toLowerCase() == 'democrat') {
        return 'dem';
    } else if(aff.toLowerCase() == 'republican') {
        return 'gop';
    } else if(aff.toLowerCase() == 'independent') {
        return 'ind';
    } else if(name.toLowerCase() == 'approve'
        || name.toLowerCase() == 'right direction'
        || name.toLowerCase() == 'favorable'
        || name.toLowerCase() == 'support') {
        return 'approve';
    } else if(name.toLowerCase() == 'disapprove'
        || name.toLowerCase() == 'wrong track'
        || name.toLowerCase() == 'unfavorable'
        || name.toLowerCase() == 'oppose') {
        return 'disapprove';
    }
    else
    {
        if(name.toLowerCase() == 'approve'
            || name.toLowerCase() == 'right direction'
            || name.toLowerCase() == 'favorable'
            || name.toLowerCase() == 'support') {
            return 'approve';
        } else if(name.toLowerCase() == 'disapprove'
            || name.toLowerCase() == 'wrong track'
            || name.toLowerCase() == 'unfavorable'
            || name.toLowerCase() == 'oppose') {
            return 'disapprove';
        } else {
            return 'other';
        }
    }
}

function is_approve_candidate(name)
{
    if(name.toLowerCase() == 'approve'
        || name.toLowerCase() == 'right direction'
        || name.toLowerCase() == 'favorable'
        || name.toLowerCase() == 'support') {
        return true;
    }
    return false;
}

function is_disapprove_candidate(name)
{
    if(name.toLowerCase() == 'disapprove'
        || name.toLowerCase() == 'wrong track'
        || name.toLowerCase() == 'unfavorable'
        || name.toLowerCase() == 'oppose') {
        return true;
    }
    return false;
}

function race_loaded(widget_data, historical_data, candidates_data, w_container, race_title)
{
    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    w_container[0].current_item_num = 0;

    var subtitle = '';
    var hide_dropdown = 'style="display:none;"';
    if(widget_data['dropdown_title'].length > 0 && widget_data['dropdown_widgets'].length > 0) {
        subtitle = '<span class="buffer">Select Poll</span>';
        hide_dropdown = '';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header">';
    widget_html += '<div class="rec-title"><img class="title_icon" src="/asset/img/poll-widget-icon.png" alt="Story Stream Icon" /> '+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+hide_dropdown+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            if(w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    var max_height_style = '';
    if(widget_data['max_height'] > 0) {
        max_height_style = 'style="max-height: '+widget_data['max_height']+'px;"';
    }
    widget_html += '<div class="rec-link-body" '+max_height_style+'>';

    widget_html += get_race_widget_body(widget_data, historical_data, candidates_data, w_container, race_title);

    widget_html += '</div>';

    widget_html += '<div class="more"><a href="/stream/?topic='+widget_data['topic']+'">See the full poll</a></div>';

    w_container.html(widget_html);

    bottom_fade(w_container);

    race_date_arrows(widget_data, historical_data, candidates_data, w_container, race_title);
    widget_link_events(w_container);
}

function race_date_arrows(widget_data, historical_data, candidates_data, w_container, race_title)
{
    w_container.find('.race_nav .left_arrow').click(
        {
            widget_data_ref: widget_data,
            historical_data_ref: historical_data,
            candidates_data_ref: candidates_data,
            container_ref: w_container,
            race_title_ref: race_title
        },
        function(event)
        {
            event.data.container_ref[0].current_item_num += 1;
            var body_html = get_race_widget_body(event.data.widget_data_ref, event.data.historical_data_ref, event.data.candidates_data_ref, event.data.container_ref, event.data.race_title_ref);
            event.data.container_ref.find('.rec-link-body').html(body_html);
            race_date_arrows(event.data.widget_data_ref, event.data.historical_data_ref, event.data.candidates_data_ref, event.data.container_ref, event.data.race_title_ref);
        });
    w_container.find('.race_nav .right_arrow').click(
        {
            widget_data_ref: widget_data,
            historical_data_ref: historical_data,
            candidates_data_ref: candidates_data,
            container_ref: w_container,
            race_title_ref: race_title
        },
        function(event)
        {
            if(event.data.container_ref[0].current_item_num > 0)
            {
                event.data.container_ref[0].current_item_num -= 1;
                var body_html = get_race_widget_body(event.data.widget_data_ref, event.data.historical_data_ref, event.data.candidates_data_ref, event.data.container_ref, event.data.race_title_ref);
                event.data.container_ref.find('.rec-link-body').html(body_html);
                race_date_arrows(event.data.widget_data_ref, event.data.historical_data_ref, event.data.candidates_data_ref, event.data.container_ref, event.data.race_title_ref);
            }
        });
}

function get_race_widget_body(widget_data, historical_data, candidates_data, w_container, race_title)
{
    var body_html = '';

    //console.log(w_container[0].current_item_num);

    body_html += '<div class="race_title">'+race_title+'</div>';

    body_html += '<div class="race_nav">';

    var rcp_avg_date = new Date(historical_data['poll']['rcp_avg'][w_container[0].current_item_num]['date']);

    var month_num_to_text = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    var rcp_avg_display_date = month_num_to_text[rcp_avg_date.getMonth()]+' '+rcp_avg_date.getDate()+', '+rcp_avg_date.getFullYear();

    body_html += '<div class="left_arrow">&lt;</div>';
    body_html += '<div class="right_arrow">&gt;</div>';
    body_html += '<div class="date">'+rcp_avg_display_date+'</div>';

    body_html += '</div>';

    var ul_classes = 'race';
    if(widget_data['max_height'] > 0) {
        ul_classes += ' scroll';
    }
    body_html += '<ul class="'+ul_classes+'">';

    var race_data = historical_data['poll']['rcp_avg'][w_container[0].current_item_num];

    for(var i=0; i<race_data['candidate'].length; i++)
    {
        if(i >= widget_data['item_limit']) {
            break;
        }
        if(race_data['candidate'][i]['value'] == null || race_data['candidate'][i]['value'] == '') {
            continue;
        }
        body_html += '<li>';

        var c_color = '';
        var c_b_color = '';
        if(race_data['candidate'][i]['color'].length > 0) {
            c_color = 'color:'+race_data['candidate'][i]['color']+';';
            c_b_color = 'background-color:'+race_data['candidate'][i]['color']+';';
        }

        var c_image = '';
        for(var j=0; j<candidates_data['candidates'].length; j++)
        {
            if(candidates_data['candidates'][j]['candidate_id'] == race_data['candidate'][i]['id']) {
                if(candidates_data['candidates'][j]['candidate_image'] != '' && candidates_data['candidates'][j]['candidate_image'] != null && candidates_data['candidates'][j]['candidate_image_show'] != '0') {
                    c_image = '<img src="'+candidates_data['candidates'][j]['candidate_image']+'" alt="'+race_data['candidate'][i]['name']+'" />';
                }
            }
        }

        body_html += '<div class="dot"><div class="inner_dot" style="'+c_b_color+'"></div></div>';
        body_html += '<div class="candidate"><div class="image" style="'+c_b_color+'">'+c_image+'</div><div class="name">'+race_data['candidate'][i]['name']+'</div></div>';
        body_html += '<div class="percentage" style="'+c_color+'">'+race_data['candidate'][i]['value']+'%</div>';

        body_html += '</li>';
    }

    body_html += '</ul>';

    if(widget_data['max_height'] > 0) {
        body_html += '<div class="white-overlay"></div>';
    }

    return body_html;
}

function story_stream_loaded(widget_data, w_container)
{
    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    var w_color = '';

    if(widget_data['color'] != '') {
        w_color = 'style="background:'+widget_data['color']+';"';
    }

    var new_dropdown_color = '';
    var subtitle_color = '';
    if(w_container[0].loaded_dropdown_widgets == 'none') {
        new_dropdown_color = 'style="background:none;"';
    } else if(widget_data['text_color'] == '#000000') {
        subtitle_color = 'style="color:'+widget_data['text_color']+';"';
        //new_dropdown_color = 'style="background-image:url(/asset/img/grey-bg-chev.png)"';
    }

    var subtitle = '';
    if(widget_data['dropdown_title'].length > 0) {
        subtitle = '<span class="buffer" '+subtitle_color+'>'+widget_data['dropdown_title']+'</span>';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header" '+w_color+'>';
    widget_html += '<div class="rec-title" style="color:'+widget_data['text_color']+';"><img class="title_icon" src="/asset/img/stream-widget-icon.png" alt="Story Stream Icon" /> '+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+new_dropdown_color+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];

            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            if(w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    var max_height_style = '';
    if(widget_data['max_height'] > 0) {
        max_height_style = 'style="max-height: '+widget_data['max_height']+'px;"';
    }
    widget_html += '<div class="rec-link-body" '+max_height_style+'>';

    var ul_classes = 'items';
    if(widget_data['max_height'] > 0) {
        ul_classes += ' scroll';
    }
    if(widget_data['show_category']) {
        ul_classes += ' icons';
    }
    widget_html += '<ul class="'+ul_classes+'"></ul>';

    if(widget_data['max_height'] > 0) {
        widget_html += '<div class="white-overlay"></div>';
    }

    widget_html += '</div>';

    widget_html += '<div class="more"><a href="/stream/?topic='+widget_data['topic']+'">See full stream</a></div>';

    w_container.html(widget_html);

    bottom_fade(w_container);

    $w_ss.push($.extend(true, {}, $StoryStream)); // Clone $StoryStream object

    // By pushing a clone into an array, we are able to have multiple storystream
    // objects on a page at once, each with their own infinite scroll

    $w_ss[$w_ss.length - 1].topic = widget_data['topic'];
    $w_ss[$w_ss.length - 1].container = w_container.find('.items');
    $w_ss[$w_ss.length - 1].print_type = 'widget';
    $w_ss[$w_ss.length - 1].limit = widget_data['item_limit'];
    $w_ss[$w_ss.length - 1].ss_index = $w_ss.length - 1;

    $w_ss[$w_ss.length - 1].finished_callback = function() {

        update_date_displays();
        var $target = this.container.parent();
        $target.attr('data-ss-index', this.ss_index);
        $target.scroll(function() {
            var ss_i = parseInt($(this).attr('data-ss-index'));
            if($(this).scrollTop() + $(this).height() + 20 >= $(this)[0].scrollHeight
                && $w_ss[ss_i].scroll_continue_done == true) {
                $w_ss[ss_i].scroll_continue_done = false;
                $w_ss[ss_i].continue_stream();
            }
        });
    }

    $w_ss[$w_ss.length - 1].continue_stream();

    recommendedSitesMenu(w_container);
    recommendedSitesMenuHover();
    recommendedSitesMenuItems(w_container);
    widget_link_events(w_container);

    /**
     * Triggers an event after the widget is ready for anyone listening
     */
    processWidgetReadyEvent(widget_data);
}

function latest_polls_loaded(widget_data, latest_polls_data, w_container)
{

    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    var new_dropdown_color = '';
    var subtitle_color = '';
    if(w_container[0].loaded_dropdown_widgets == 'none') {
        new_dropdown_color = 'style="background:none;"';
    } else if(widget_data['text_color'] == '#000000') {
        subtitle_color = 'style="color:'+widget_data['text_color']+';"';
        //new_dropdown_color = 'style="background-image:url(/asset/img/grey-bg-chev.png)"';
    }

    var subtitle = '';
    if(widget_data['dropdown_title'].length > 0 && widget_data['dropdown_widgets'].length > 0) {
        subtitle = '<span class="buffer" '+subtitle_color+'>'+widget_data['dropdown_title']+'</span>';
    }

    var title_icon = '';
    if(widget_data['show_stream_icon'] == 1) {
        title_icon = '<img class="title_icon" src="/asset/img/stream-widget-icon.png" alt="Story Stream Icon" />';
    }

    var widget_html = '';

    widget_html += '<div class="rec-widget-header">';
    widget_html += '<div class="rec-title" style="color:'+widget_data['text_color']+';">'+title_icon+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+new_dropdown_color+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            /*if(w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
              d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
              d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }*/
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    var max_height_style = '';
    if(widget_data['max_height'] > 0) {
        max_height_style = 'style="max-height: '+widget_data['max_height']+'px;"';
    }
    widget_html += '<div class="rec-link-body" '+max_height_style+'>';

    var ul_classes = '';

    if(widget_data['max_height'] > 0) {
        ul_classes += ' scroll';
    }

    widget_html += '<ul class="'+ul_classes+'">';

    var lp_polls = latest_polls_data['election']['poll'];

    for(var i=0; i<lp_polls.length; i++)
    {
        if(i >= widget_data['item_limit']) {
            break;
        }

        widget_html += '<li>';
        widget_html += '<div class="content_wrapper latest_polls">';

        widget_html += '<div class="title"><a href="'+lp_polls[i]['link']+'">'+lp_polls[i]['race']+'</a></div>';
        widget_html += '<div class="byline"><a href="'+lp_polls[i]['link']+'" class="rec-auth">'+lp_polls[i]['pollster']+'</a></div>';

        widget_html += '<ul class="candidates">';
        for(var j=0; j<lp_polls[i]['candidate'].length; j++)
        {
            widget_html += '<li><a href="'+lp_polls[i]['link']+'"><span class="name">'+lp_polls[i]['candidate'][j]['name']+'</span><span class="score">'+lp_polls[i]['candidate'][j]['value']+'</span></a></li>';
        }
        widget_html += '</ul>';

        var aff_class = affiliation_to_abbr(lp_polls[i]['spread_aff'], '');

        widget_html += '<div class="spread"><a class="'+aff_class+'" href="'+lp_polls[i]['link']+'">'+lp_polls[i]['spread']+'</a></div>';

        widget_html += '</div>';
        widget_html += '</li>';
    }
    widget_html += '</ul>';

    if(widget_data['max_height'] > 0) {
        widget_html += '<div class="white-overlay"></div>';
    }


    widget_html += '</div>';

    if(widget_data['footer_text'] != '') {
        widget_html += '<div class="more"><a href="'+widget_data['footer_link']+'">'+widget_data['footer_text']+'</a></div>';
    }

    w_container.html(widget_html);

    bottom_fade(w_container);

    recommendedSitesMenu(w_container);
    recommendedSitesMenuHover();
    recommendedSitesMenuItems(w_container);
    widget_link_events(w_container);
}

function feed_loaded(widget_data, feed_data, w_container)
{
    // Convert feed data to standard format
    var feed_standard = [];

    if($.isXMLDoc(feed_data))
    {
        // Is XML
        $(feed_data).find('item').each(function(index)
        {
            var image_url = '';
            if( widget_data['feed_info']['image'] == 'media:thumbnail' ) {
                // The comma is needed for chrome to work
                image_url = $(this).find('media\\:thumbnail, thumbnail').attr('url');
            } else if( widget_data['feed_info']['image'] == 'media:content' ) {
                // The comma is needed for chrome to work
                image_url = $(this).find('media\\:content, content').attr('url');
            } else {
                image_url = $(this).find(widget_data['feed_info']['image']).html();
            }
            feed_item = {
                'byline' :    $(this).find(widget_data['feed_info']['byline']).html(),
                'title' :     $(this).find(widget_data['feed_info']['title_path']).html(),
                'category' :  $(this).find(widget_data['feed_info']['category']).html(),
                'image' :     image_url,
                'show_image' :  $(this).find(widget_data['feed_info']['show_image']).html(),
                'link' :    $(this).find(widget_data['feed_info']['link']).html(),
            };
            feed_standard.push(feed_item);
        });
    }
    else
    {
        // Is object (from json feed)

        for( var key1 in feed_data )
        {

            if(key1 == widget_data['feed_info']['container'])
            {
                if(typeof feed_data[key1][widget_data['feed_info']['byline']] !== 'undefined' ||
                    typeof feed_data[key1][widget_data['feed_info']['title_path']] !== 'undefined')
                {
                    feed_item = {
                        'byline' :        feed_data[key1][widget_data['feed_info']['byline']],
                        'title':          feed_data[key1][widget_data['feed_info']['title_path']],
                        'category' :      feed_data[key1][widget_data['feed_info']['category']],
                        'image' :         feed_data[key1][widget_data['feed_info']['image']],
                        'show_image' :    feed_data[key1][widget_data['feed_info']['show_image']],
                        'link' :          feed_data[key1][widget_data['feed_info']['link']]
                    };
                    if(widget_data['show_category_color']) {
                        feed_item['category_color'] = feed_data[key1][widget_data['feed_info']['category_color']];
                    }
                    if(widget_data['feed_info']['show_image'] != '') {
                        feed_item['show_image'] = feed_data[key1][widget_data['feed_info']['show_image']];
                    }
                    if(typeof feed_data[key1]['sponsored'] !== 'undefined') {
                        feed_item['sponsored'] = feed_data[key1]['sponsored'];
                    }
                    feed_standard.push(feed_item);
                }
                else
                {
                    for( var key2 in feed_data[key1] )
                    {
                        if(typeof feed_data[key1][key2][widget_data['feed_info']['byline']] !== 'undefined' ||
                            typeof feed_data[key1][key2][widget_data['feed_info']['title_path']] !== 'undefined')
                        {
                            feed_item = {
                                'byline' :        feed_data[key1][key2][widget_data['feed_info']['byline']],
                                'title':          feed_data[key1][key2][widget_data['feed_info']['title_path']],
                                'category' :      feed_data[key1][key2][widget_data['feed_info']['category']],
                                'image' :         feed_data[key1][key2][widget_data['feed_info']['image']],
                                'link' :          feed_data[key1][key2][widget_data['feed_info']['link']]
                            };
                            if(widget_data['show_category_color']) {
                                feed_item['category_color'] = feed_data[key1][key2][widget_data['feed_info']['category_color']];
                            }
                            if(widget_data['feed_info']['show_image'] != '') {
                                feed_item['show_image'] = feed_data[key1][key2][widget_data['feed_info']['show_image']];
                            }
                            if(typeof feed_data[key1][key2]['sponsored'] !== 'undefined') {
                                feed_item['sponsored'] = feed_data[key1][key2]['sponsored'];
                            }
                            feed_standard.push(feed_item);
                        }
                        else
                        {
                            for( var key3 in feed_data[key1][key2] )
                            {
                                if(typeof feed_data[key1][key2][key3][widget_data['feed_info']['byline']] !== 'undefined' ||
                                    typeof feed_data[key1][key2][key3][widget_data['feed_info']['title_path']] !== 'undefined')
                                {
                                    feed_item = {
                                        'byline' :        feed_data[key1][key2][key3][widget_data['feed_info']['byline']],
                                        'title':          feed_data[key1][key2][key3][widget_data['feed_info']['title_path']],
                                        'category' :      feed_data[key1][key2][key3][widget_data['feed_info']['category']],
                                        'image' :         feed_data[key1][key2][key3][widget_data['feed_info']['image']],
                                        'link' :          feed_data[key1][key2][key3][widget_data['feed_info']['link']]
                                    };
                                    if(widget_data['show_category_color']) {
                                        feed_item['category_color'] = feed_data[key1][key2][key3][widget_data['feed_info']['category_color']];
                                    }
                                    if(widget_data['feed_info']['show_image'] != '') {
                                        feed_item['show_image'] = feed_data[key1][key2][key3][widget_data['feed_info']['show_image']];
                                    }
                                    if(typeof feed_data[key1][key2][key3]['sponsored'] !== 'undefined') {
                                        feed_item['sponsored'] = feed_data[key1][key2][key3]['sponsored'];
                                    }
                                    feed_standard.push(feed_item);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    for( var key_feed in feed_standard)
    {
        // If category is numeric, convert to our standard categories
        var cat = feed_standard[key_feed]['category'];
        if($.isNumeric(cat)) {
            cat = category_id_to_name(cat);
        }
        feed_standard[key_feed]['category'] = cat;
    }

    // Load dropdown widgets if new, else keep old dropdown info
    if(w_container[0].loaded_dropdown_widgets.length == 0)
    {
        if(widget_data['dropdown_widgets'].length > 0)
        {
            w_container[0].loaded_dropdown_widgets = widget_data['dropdown_widgets'];
            // Add self to list (will be hidden later)
            w_container[0].loaded_dropdown_widgets.unshift({
                'id' :             widget_data['id'],
                'title' :          widget_data['title'],
                'dropdown_title' : widget_data['dropdown_title'],
                'color' :          widget_data['color']
            });
        }
        else {
            w_container[0].loaded_dropdown_widgets = 'none';
        }
    }

    var w_color = '';

    if(widget_data['color'] != '') {
        w_color = 'style="background-color:'+widget_data['color']+';"';
    }

    if(widget_data['background_image'] !== null && widget_data['background_image'] !== '') {
        w_color = 'style="padding-left: 26px; background-image:url('+widget_data['background_image']+');"';
    }

    var new_dropdown_color = '';
    var subtitle_color = '';
    if(w_container[0].loaded_dropdown_widgets == 'none') {
        new_dropdown_color = 'style="background:none;display:none;"';
    } else if(widget_data['text_color'] == '#000000') {
        subtitle_color = 'style="color:'+widget_data['text_color']+';"';
        //new_dropdown_color = 'style="background-image:url(/asset/img/grey-bg-chev.png)"';
    }

    var subtitle = '';
    if(widget_data['dropdown_title'] !== null && widget_data['dropdown_title'].length > 0) {
        subtitle = '<span class="buffer" '+subtitle_color+'>'+widget_data['dropdown_title']+'</span>';
    }

    var title_icon = '';
    if(widget_data['show_stream_icon'] == 1) {
        title_icon = '<img class="title_icon" src="/asset/img/stream-widget-icon.png" alt="Story Stream Icon" />';
    }

    var widget_html = '';

    //console.log(widget_data['title']);

    widget_html += '<div class="rec-widget-header" '+w_color+'>';
    widget_html += '<div class="rec-title" style="color:'+widget_data['text_color']+';">'+title_icon+widget_data['title']+'</div>';
    widget_html += '<div class="rec-site" '+new_dropdown_color+'>';
    widget_html += '<div class="name">'+subtitle+'</div>';
    if(w_container[0].loaded_dropdown_widgets != 'none') {
        widget_html += '<div class="menu"></div>';
    }
    widget_html += '<span class="rec-site-tab"></span>';
    widget_html += '<div class="rec-site-list">';

    if(w_container[0].loaded_dropdown_widgets != 'none')
    {
        widget_html += '<ul>';

        for(var key_d in w_container[0].loaded_dropdown_widgets)
        {
            var d_title = '';
            if(typeof w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== 'undefined'
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'] !== null
                && w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'].length > 0) {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['dropdown_title'];
            } else {
                d_title = w_container[0].loaded_dropdown_widgets[key_d]['title'];
            }

            var d_color = '';
            var d_background_color = 'data-bcolor=""';
            if(w_container[0].loaded_dropdown_widgets[key_d]['color'] != '') {
                d_color = 'style="color:'+w_container[0].loaded_dropdown_widgets[key_d]['color']+';"';
                d_background_color = 'data-bcolor="'+w_container[0].loaded_dropdown_widgets[key_d]['color']+'"';
            }
            widget_html += '<li class="dropdown_link_'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'"><span '+d_color+' '+d_background_color+' data-id="'+w_container[0].loaded_dropdown_widgets[key_d]['id']+'">'+d_title+'</span></li>';
        }

        widget_html += '</ul> ';
    }

    widget_html += '</div>';
    widget_html += '</div>';
    widget_html += '</div>';

    var max_height_style = '';
    if(widget_data['max_height'] > 0) {
        max_height_style = 'style="max-height: '+widget_data['max_height']+'px;"';
    }
    widget_html += '<div class="rec-link-body" '+max_height_style+' data-id="'+widget_data['id']+'">';

    if(widget_data['show_top_pic'] == 1)
    {
        /*widget_html += '<div class="rec-image">';
      widget_html += '<a href="'+feed_standard[0]['link']+'">';
        widget_html += '<img class="centered" src="'+feed_standard[0]['image']+'" width="100%">';
        if(widget_data['show_category_label'] == '1')
        {
          widget_html += '<div class="category_label" style="background-color:'+feed_standard[0]['category_color']+';">'+feed_standard[0]['category']+'</div>';
        }
      widget_html += '</a>';
    widget_html += '</div>';*/

        // New version uses background-size: cover for cropping
        // Eventually put inline styles (except background url) in widgets css
        widget_html += '<div class="rec-image">';

        var img_url = ""; // Larger images
        if(feed_standard[0]['image'] !== null){
            img_url = feed_standard[0]['image'].replace('_1_', '_4_'); // Larger images
        }

        var top_image_styles = 'background: url('+img_url+');';
        top_image_styles += 'background-size:cover;';
        //top_image_styles += 'display:block;position:absolute;top:0;right:0;bottom:0;left:0;';
        top_image_styles += 'display:block; height:100%;';
        widget_html += '<a href="'+feed_standard[0]['link']+'" style="'+top_image_styles+'">';
        if(widget_data['show_category_label'] === 1 || widget_data['show_category_label'] === '1')
        {
            widget_html += '<div class="category_label" style="background-color:'+feed_standard[0]['category_color']+';">'+feed_standard[0]['category']+'</div>';
        }
        widget_html += '</a>';
        widget_html += '</div>';
    }

    var ul_classes = '';

    if(widget_data['max_height'] > 0) {
        ul_classes += ' scroll';
    }
    if(widget_data['show_type_icons'] == 1) {
        ul_classes += ' icons';
    }

    widget_html += '<ul class="'+ul_classes+'">';

    /*console.log('widget_data');
  console.log(widget_data);
  console.log('feed_standard');
  console.log(feed_standard);*/

    for(var i=0; i<feed_standard.length; i++)
    {
        if(i >= widget_data['item_limit']) {
            break;
        }
        var li_classes = '';
        if(typeof feed_standard[i]['category'] !== 'undefined') {
            li_classes = feed_standard[i]['category'];
        }

        widget_html += '<li class="'+li_classes+'">';
        widget_html += '<div class="content_wrapper">';

        if(feed_standard[i]['category'] != 'none' && widget_data['show_category'] == '1')
        {
            var category_color = '';
            if(typeof feed_standard[i]['category_color'] !== 'undefined') {
                if(i > 0) {
                    category_color = 'style="color:'+feed_standard[i]['category_color']+';"';
                }
            }

            if( (widget_data['show_category_label'] == 0 || widget_data['show_category_label'] == '0') || i > 0) {
                widget_html += '<div class="category" '+category_color+'>'+feed_standard[i]['category']+'</div>';
            }
        }
        var widget_image_html = '';
        //if(widget_data['show_images'] == '1' && (feed_standard[i]['show_image'] == '1' || widget_data['feed_info']['show_image'] == '') )
        //console.log(widget_data['show_images']);
        //console.log(widget_data['feed_info']['show_image']);
        if(widget_data['show_images'] == '1' && widget_data['feed_info']['show_image'] != '' )
        {
            //console.log('in image html');
            var image_class = 'image';
            var center_image_class = 'img_container';
            if(widget_data['left_images'] == '1') {
                image_class += ' item_left';
            }else{
                center_image_class += ' full_width'; //used to target center class only
            }

            /**
             * In case suffix or prefix are null, make them empty strings
             * so it doesn't prepend/append null strings to image URL
             */
            if(widget_data['feed_info']['image_prefix'] == null){
                widget_data['feed_info']['image_prefix'] = "";
            }

            if(widget_data['feed_info']['image_suffix'] == null){
                widget_data['feed_info']['image_suffix'] = "";
            }

            widget_image_html = '<div class="'+center_image_class+'"><a class="'+image_class+'" href="'+feed_standard[i]['link']+'"><img class="content_img" onerror="this.style.display = \'none\';" src="'+widget_data['feed_info']['image_prefix']+feed_standard[i]['image']+widget_data['feed_info']['image_suffix']+'" alt="'+feed_standard[i]['title']+'"></a></div>';
        }

        if(widget_data['left_images'] == '1') {
            widget_html += widget_image_html;
        }

        var title_class = 'title';
        if(widget_data['left_images'] == '1') {
            title_class += ' item_left';
        }
        var sponsored_content = '';
        if(feed_standard[i]['sponsored'] == '1') {
            sponsored_content = '<div class="sponsored">Sponsored</div>';
        }
        widget_html += '<div class="'+title_class+'">'+sponsored_content+'<a href="'+feed_standard[i]['link']+'">'+feed_standard[i]['title']+'</a></div>';
        if(widget_data['show_byline'] == '1')
        {
            var byline_class = 'byline';
            if(widget_data['left_images'] == '1') {
                byline_class += ' item_left';
            }
            widget_html += '<div class="'+byline_class+'"><a href="'+feed_standard[i]['link']+'" class="rec-auth">'+feed_standard[i]['byline']+'</a></div>';
        }

        if(widget_data['left_images'] != '1') {
            widget_html += widget_image_html;
        }

        widget_html += '</div>';
        widget_html += '</li>';
    }
    widget_html += '</ul>';

    if(widget_data['max_height'] > 0) {
        widget_html += '<div class="white-overlay"></div>';
    }


    widget_html += '</div>';

    if(widget_data['footer_text'] !== null && widget_data['footer_text'].length > 0) {
        widget_html += '<div class="more"><a href="'+widget_data['footer_link']+'">'+widget_data['footer_text']+'</a></div>';
    }

    w_container.html(widget_html);

    bottom_fade(w_container);

    recommendedSitesMenu(w_container);
    recommendedSitesMenuHover();
    recommendedSitesMenuItems(w_container);
    widget_link_events(w_container);

    /**
     * Triggers an event after the widget is ready for anyone listening
     */
    processWidgetReadyEvent(widget_data);
}

/**
 * Prep the data node element and event name to trigger
 */
function processWidgetReadyEvent(widget_data){

    var eventName       = Utils.make_slug(widget_data['title']+'_widget_ready');
    var widgetSelector  = '[data-widget-title="'+widget_data['title']+'"]';
    var htmlNode        = document.querySelector(widgetSelector);
    // console.log("TRIGGERING EVENT", eventName, widgetSelector, htmlNode);
    if( htmlNode ){
        triggerWidgetReadyEvent(htmlNode, eventName);
    }else{
        console.error("WIDGET EVENT CANNOT FIND HTML NODE", eventName, widgetSelector, htmlNode);
    }
}

/**
 * When a widget is finished loading, trigger this event to anyone listening
 */
function triggerWidgetReadyEvent(el, type){

    if ('createEvent' in document) {
        // modern browsers, IE9+
        var e = document.createEvent('HTMLEvents');
        e.initEvent(type, false, true);
        document.dispatchEvent(e);
    } else {
        // IE 8
        var e = document.createEventObject();
        e.eventType = type;
        document.fireEvent('on'+e.eventType, e);
    }
}

function bottom_fade(w_container)
{
    w_container.find('.rec-link-body').scroll(function()
    {
        $(this).find('.white-overlay').css('bottom', $(this).scrollTop() * -1);
    });
}

// Event when link in body of system widget is clicked
function widget_link_events(w_container)
{
    w_container.find('.rec-link-body a').click(
        {
            container_ref: w_container
        },
        function(event)
        {
            //Get the href value. Will use at the end to go to link target.
            event = event || window.event;

            var href = $(this).closest('a').attr('href');
            //Build the params to go to event tracking
            /*var ge_action = 'Section Redesign: ' + $('body').attr('class').split(' ')[0]; // Section: <first body class>
    var ge_category = 'System Widget: ' + event.data.container_ref.attr('data-widget-type') + ': ' + event.data.container_ref.attr('data-widget-title'); // System Widgets: <widget title url friendly>
    var ge_label = 'Link';*/

            var ge_action = 'Click: Link';
            var ge_category = 'System Widget Interaction';
            var ge_label = event.data.container_ref.attr('data-widget-title')+': '+$('body').attr('class').split(' ')[0];

            //Wrap event tracking call to prevent premature termination of this function.
            try{
                _gaq.push(['_trackEvent', ge_category, ge_action, ge_label]);
                console.log('trackevent: '+ge_category+' '+ge_action+' '+ge_label);
            } catch(err) {}
            if(event.ctrlKey || event.metaKey) { //If right-click or control click
                return true;
            } else {
                window.setTimeout('document.location = "' + href + '"', 100); //Go to hyperlink
                return false;
            }
        });
}

// Menu items click
function recommendedSitesMenuItems(w_container)
{
    w_container.find('.rec-site-list ul li span').click(
        {
            container_ref: w_container
        },
        function(event)
        {
            /*var ge_action = 'Section Redesign: ' + $('body').attr('class').split(' ')[0]; // Section: <first body class>
    var ge_category = 'System Widget: ' + event.data.container_ref.attr('data-widget-type') + ': ' + event.data.container_ref.attr('data-widget-title'); // System Widgets: <widget title url friendly>
    var ge_label = 'Menu: ' + $(this).html();*/

            var ge_action = 'Click: Menu';
            var ge_category = 'System Widget Interaction';
            var ge_label = event.data.container_ref.attr('data-widget-title')+': '+$('body').attr('class').split(' ')[0];

            console.log('trackevent: '+ge_category+' '+ge_action+' '+ge_label);

            _gaq.push(['_trackEvent', ge_category, ge_action, ge_label]);

            load_widget($(this).attr('data-id'), event.data.container_ref);
        });
}

//other sites menu - recommended widget drop down menu
function recommendedSitesMenu(w_container){
    //console.log('recommendedSitesMenu');
    w_container.find('.rec-site .menu').click(
        {
            container_ref: w_container
        },
        function(event){
            event.data.container_ref.find('.rec-site-tab').toggle();
            event.data.container_ref.find('.rec-site-list').toggle();
        });
}

//open sitesMenu hover handler - changes color of pointer triangle at top of menu to match hovered site
// Now also handles color of li->a background
function recommendedSitesMenuHover()
{
    $('.rec-site-list ul li span').hover(function(){

        var bg = $(this).attr('data-bcolor');
        if(bg.length > 0) {
            $(this).css('color', '#ffffff');
        }
        $(this).css('background-color', bg);

        $(this).parent().parent().parent().parent().find('.rec-site-tab').css( { "border-bottom" : "10px solid " + bg } );

    }, function(){

        var bg = $(this).attr('data-bcolor');
        var new_color = '';
        if(bg.length > 0) {
            new_color = bg;
        }
        $(this).css('color', new_color);
        $(this).css('background-color', '');
        //$('.verticals-tab').css( { "border-bottom" : "10px solid #EBEBEB" } );
        $(this).parent().parent().parent().parent().find('.rec-site-tab').css( { "border-bottom" : "10px solid #EBEBEB" } );
    });
}

function category_id_to_name(cat_id)
{
    if(cat_id == '0') {
        return 'none';
    } else if(cat_id == '1') {
        return 'article';
    } else if(cat_id == '2') {
        return 'video';
    } else if(cat_id == '3') {
        return 'list';
    } else if(cat_id == '4') {
        return 'poll';
    } else if(cat_id == '5') {
        return 'podcast';
    }else if(cat_id == '6'){
        return 'quiz';
    }else if(cat_id == '7'){
        return 'tag';
    }

}

function update_date_displays()
{
    $('.item_date').each(function()
    {
        var today_date = new Date();
        //var today_date = new Date(1435536200000);
        var item_date = new Date(parseInt($(this).attr('data-ms')));
        var elapsed_ms = today_date.getTime() - item_date.getTime();

        var elapsed_seconds = elapsed_ms / 1000;
        var elapsed_minutes = elapsed_ms / 60000;
        var elapsed_hours = elapsed_minutes / 60;

        var elapsed_hours_exact = Math.floor(elapsed_hours);
        var elapsed_minutes_exact = Math.floor(elapsed_minutes);
        var elapsed_seconds_exact = Math.floor(elapsed_seconds);

        var display_date = '';

        if(elapsed_hours >= 24) {
            display_date = item_date.toDateString();
        } else if(elapsed_hours >= 1) {
            display_date = elapsed_hours_exact+' hours ago';
        } else if(elapsed_minutes >= 1) {
            display_date = elapsed_minutes_exact+' min ago';
        } else if(elapsed_seconds >= 1) {
            display_date = elapsed_seconds_exact+' sec ago';
        } else {
            display_date = 'now';
        }

        $(this).html(display_date);
    })
}











////////////////////////////////////////////////////////////////////////////////
// EVOLOK FUNCTIONS ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function evolok_init() {

    if(evolok_init_called === true) { return; }

    evolok_init_called = true;

    console.log("ADMIRAL evolok_init");

    // if ad free account it doesn't wait around to check for ad block since it doesn't matter for ad free accounts
    var ad_free = readCookie('evaf');
    // console.log("evolok init ad_free: ", ad_free, "warning widget: ", warning_widget);
    if( ad_free !== 'null' && ad_free !== null ){
        warning_widget.ad_block_ready_for_check = true;
        Utils.global_settings.realclear_ad_block_check = false;

    // if no ad free trigger ads right away but still let evolok check for ad block below
    }else if(SITE_INFO['name'] !== 'markets') {
        try{
            //
            evolok_do_ads = true;
            allow_ad_render = true;
            init_all_ads();
        }catch(err){
            console.log(err);
        }

    }

    //if main evo library is ready
    if(typeof window.EV !== 'undefined' && !evolok_init_finished && SITE_INFO['evolok_enabled'] !== false) {

        adblock_exists_check = window.setInterval(function(){

            if( warning_widget.ad_block_ready_for_check == true || warning_widget.ad_block_ready_for_check == "true" ){

                console.log('EVOLOK Console: USING ADBLOCK::: ' + Utils.global_settings.realclear_ad_block_check);
                clearInterval(adblock_exists_check);
                allow_ad_render = true;
                continue_ev_init(Utils.global_settings.realclear_ad_block_check);

            }else{
                console.log('EVOLOK Not ready to check adblock::: ' + warning_widget.ad_block_ready_for_check);
            }

        }, 100);

        //global param indicating libraries are ready
        evolok_init_finished = true;

    } else {
        //console.log('ev undefined or init already called');
        init_all_ads();
    }
}

function continue_ev_init(adBlockEnabled){

    var evp = {};

    if(typeof window.ev_params !== 'undefined') {
        evp = window.ev_params;
    }

    console.log("inline evolok params:::: ", evp);

    var id_timestamp = Math.floor(Date.now() / 1000 / 60);

    ev_article_id = id_timestamp;

    var wevp = {"articleId":ev_article_id,"site":SITE_INFO['name'],"adblock":adBlockEnabled};

    var all_params = Object.assign(wevp, evp);

    console.log("ALL evolok PARAMS:::: ", all_params);

    window.evolok_params = JSON.stringify(all_params);

    var ev_init_url = "//rcp.evolok.net/acd/api/3.0";
    var cookieDomain = "realclear"+SITE_INFO['name']+".com";

    if(Utils.get_query_param('evo_test') == 'true') {
        ev_init_url = "//rcp.uat.evolok.net/acd/api/3.0";
    }

    EV.Em.init({
        sidCookieDomain: document.domain,
        url: ev_init_url
    });

    EV.Em.authorize(window.evolok_params, evolok_metering_success, evolok_metering_error);
}


function evolok_metering_success(response) {
    console.log('evolok success response: ', response);

    if(response.result == 'ALLOW_ACCESS' &&
        response.loggedOut == false &&
        typeof response.ruleProperties !== 'undefined' &&
        response.ruleProperties.ADFREE == 'true') {

        evolok_block_ads = true;

        createCookie('evaf','1','365');

        // This means ads have shown, at least some inline ones that depend on cookie
        // So it's best to refresh
        // checks if we can read a cookie, means cookies are enabled
        // m.b. added 9.27 - typeof check for ad free sites - master loads after invchnl_rcmg.js file causing false positive
        if( ( typeof inline_ads_status !== 'undefined' && inline_ads_status == 'shown' ) && readCookie('evaf') ) {
            location.reload();
            return;
        }

        // We now know that ads will not be loaded, and there is no need for a refresh.
        // So we can display the tempshow notifications
        if(typeof Tempshow !== 'undefined') {

            var tempshow = new Tempshow;

            // 15 sec every time
            tempshow.create({
                msg: 'RCMG Ad-Free',
                seconds: 15
            });

            $('body').addClass('ad-free');

            if(readCookie('purchase_thanks_hp_modal') != '1') {

                // permanent just once
                tempshow.create({
                    msg: 'Thank you for your support!<br />Enjoy your ad-free experience.',
                    type: 'subscribe_thanks',
                    seconds: 20,
                    vertical: 'center',
                    horizontal: 'center',
                    width: '500px'
                });
                createCookie('purchase_thanks_hp_modal','1','365');
            }
        }

    } else {
        if(readCookie('user_access') != null ) {
            check_coupon_access();
        } else {

            eraseCookie('evaf');
            refresh_if_af_from_cookie();
            evolok_do_ads = true;
        }
    }

    init_all_ads();
    log_active_user();
}

function check_coupon_access() {

    rcmg_api_call('get_coupon_data', {
        'coupon_data': readCookie('user_access')
    }, function (response) {
        var current_time = Math.floor(Date.now() / 1000);

        if (response.success && response.data && response.data.coupon_data.coupon_expiration_date > current_time) {
            
            evolok_metering_success({result: 'ALLOW_ACCESS', loggedOut: false, ruleProperties: {ADFREE: 'true'}, userProperties: {adblock: 'true'}, activeMeter: {count: 2}});

        } else {
            eraseCookie('user_access');
            eraseCookie('evaf');
            refresh_if_af_from_cookie();
            evolok_do_ads = true;
            init_all_ads();
        }
        
    });
    
}

function evolok_metering_error(response) {

    if(readCookie('user_access') != null ) {
        check_coupon_access();
    } else {
        console.log('evolok metering error', response);
        //console.log(response);
        
        eraseCookie('evaf');
        refresh_if_af_from_cookie();
    
        evolok_do_ads = true;
    
        init_all_ads();
    }
}

function init_all_ads(){

    // console.trace("EVOLOK init_all_ads has INIT ads: ", HAS_INIT_ADS);

    // make sure this only runs once
    if( HAS_INIT_ADS === true ){
        return;
    }

    HAS_INIT_ADS = true;

    // gpt ads are lazy loaded so this can run asap because it'll find anchors on its own
    loadAds();

    // ads may run before document is ready so place any document touching ads here
    $(document).ready(function(){
        
        loadGotChosen();

        //loadPrimisWidget();
        // distroscale_init();
        render_video_player();
        markets_investingchannel();
        load_insticator();
        loadInfinityAds();

        setTimeout(function(){
            fark_widgets_init();
            mgid_init();
            taboola_init();
        }, 250);
        if(typeof load_spot_recirculation == 'function') {load_spot_recirculation(); }
        //load loadLockerdome everywhere else except for science
        // if(typeof loadLockerdome == 'function') { loadLockerdome(); }
        spot_right_rail_init();
    });

}

function refresh_if_af_from_cookie() {

    if( ( typeof inline_ads_status !== 'undefined' && inline_ads_status == 'skipped' )) {

        location.reload();
    }
}

// The following functions are for checking if the user has purchased
// Done after filling in fn/ln/email form on subscription page
function evolok_post_init_check() {

    EV.Em.authorize('{"site":"'+SITE_INFO['name']+'"}', evolok_post_init_metering_success, evolok_post_init_metering_error);
}

function evolok_post_init_metering_success(response) {

    if(response.result == 'ALLOW_ACCESS' &&
        response.loggedOut == false &&
        typeof response.ruleProperties !== 'undefined' &&
        response.ruleProperties.ADFREE == 'true') {

        evolok_already_purchased();
    }
}
function evolok_post_init_metering_error(response) {
    console.log('Error with post-init authorize call');
    //console.log(response);
}

function evolok_already_purchased(){} // overwrite where needed as a callback



// flags to keep track one has started
var distroscale_master_init = false;
var jw_player_master_init = false;


function render_video_player(){

    // sites that can use JW player
    var allowedSites = [
        "politics",
        "health",
        "science"
    ];

    // if not part of allowed sites to do JW Player
    // then just do distroscale by default
    if( allowedSites.indexOf(SITE_INFO['name']) == -1 ){
        distroscale_init();
        return;
    }

    // otherwise do 10/90 to switch between distro and JW player
    var rand = parseInt(Math.floor(Math.random() * 10) +1);
    
    // console.log("VIDEO PLAYER RENDER VIDEO PLAYER RAND NUMBER", rand);
    
    if(rand <= 9 || Utils.get_query_param('force_jw') !== null){
        jwplayer_widget_init();
        return;
    }else {
        distroscale_init();
        return;
    }

}

function jwplayer_widget_init(){

    // console.log('jwplayer_widget_init called');

    if( typeof start_jw_player_library == 'undefined' ){
        console.log("Unable to start jwplayer library, jwplayer_widget_init not found");
        return;
    }

    // if set force it will ignore this section
    if( Utils.get_query_param('force_jw') == null ){

        if(readCookie('evaf') !== null && parseInt(readCookie('evaf')) === 1) {
            // Ad free. Exit jw player.
            return;
        }

        if(evolok_init_finished) {

            if(!evolok_do_ads) {
                // Just skip and wait for next function call for a status change 
                return;
            }
            // Otherwise go ahead and do ads
        }

        if( readCookie("jw_player_shown_new") || readCookie('jw_player_close_button_clicked') || distroscale_master_init == true ){
            return;
        }

    }
    
    jw_player_master_init = true;
    
    start_jw_player_library();
}


////////////////////////////////////////////////////////////////////////////////
// DISTROSCALE FUNCTIONS ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//DISTROSCALE VIDEO WIDGET
function distroscale_init(){

    console.log('distroscale_init called');

    if(evolok_init_finished) {

        if(!evolok_do_ads && (readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1) ) {
            // Just skip and wait for next function call for a status change 
            console.log('ad_free exit distro');
            return;
        }
        // Otherwise go ahead and do ads
    }

    // if distro already shown
    if( readCookie("distroscale_shown_new") || readCookie('dst_close_button_clicked') || jw_player_master_init == true ){

      //TESTING OVERRIDE
        /*if(typeof Utils.get_query_param == 'function'){
            if( Utils.get_query_param('ds_z') == null && Utils.get_query_param('ds_t') == null ){
                console.log('already shown exit distro');
                return;
            }
        }*/

        console.log('already shown exit distro');
        return;

    }

    distroscale_master_init = true;

    var allowedSites = [
        "science",
        "policy",
        "politics",
        "defense",
    ];

    if( $.inArray(SITE_INFO['name'], allowedSites) > -1 ){

        console.log('Testint for distro should launch');

        var launch_distro = false;
        
        if( SITE_INFO['name'] == "politics" && $("body.home").length > 0 ) { //HOMEPAGE ONLY

            //|| $("body.polls").length>0 || $("body.maps").length>0 || $("body.live_results").length>0

            // if( $().isTablet() === false && $().isMobile() === false && mobileAndTabletcheck() === false && isTouchDevice() == false ){
            // if( $().isTablet() === false && isTouchDevice() == false ){
            if( $(window).outerWidth() < 768 || ($().isTablet() === false && isTouchDevice() == false) ){ //MOBILE OR NOT TABLET(TOUCH)
                // uncomment to turn on distro on politics
                launch_distro = true;
                
                // both of these functions are defined in rcp.js
                create_dst_ga_event();
                set_dst_close_listeners();
            }

        // Launch on policy, science, defense homepages
        }else if(SITE_INFO['name']=="policy" && $("body.home").length>0) {

            $dstro = $('div.beta div.distro_spot');
            $dstro.append("<div id=\'ds_default_anchor\' class=\"ds_default_anchor\" style=\'margin-left:15px;\'></div>");
            launch_distro = true;

        }else if(SITE_INFO['name']=="defense" && $("body.home").length>0) {

            $dstro = $('div.beta div.distro_spot');
            $dstro.append("<div id=\'ds_default_anchor\' class=\"ds_default_anchor\" style=\'margin-left:15px;\'></div>");
            launch_distro = true;
        
        } else if(SITE_INFO['name']=="science" && $("body.home").length>0) {

            $dstro = $('div.beta div.distro_spot');
            $dstro.append("<div id=\'ds_default_anchor\' class=\"ds_default_anchor\" style=\'margin-left:15px;\'></div>");
            launch_distro = true;
        
        } /*else if( ($("body.distro_test").length>0 || $("body.article").length>0 ) && $ (".data-no-ads").length == 0 ){ //ALL NON RCP ARTICLES
            
            if(SITE_INFO['name']!="politics"){

                if( $("body.distro_test").length>0 ) {

                $dstro = $('div.beta div.distro_spot');

                } else {

                $dstro = $('div.beta .RC-AD-BOX-TOP:first-child');

                }
                $dstro.append("<div id=\'ds_default_anchor\' class=\"ds_default_anchor\" style=\'margin-left:15px;\'></div>");

                launch_distro = true;

            }
        } */

        /**
         * If ad free account or ad block then run recommended widget
         */
        if( launch_distro == true && ( parseInt(readCookie('evaf')) == 1 || Utils.global_settings.realclear_ad_block_check == true ) ){
            launch_distro = false;

            var rec_selector = 'div#dynamic-recommended';
            var recommended_id = 2; // Possibly make this number tailored to the vertical you're on. Right now it's just the ID for politics.
            
            if( $(rec_selector).length == 0 && $('div[data-widget-title="Recommended"]').length == 0 ){
                
                var widget_slot = '<div id="dynamic-recommended" class="widget_slot init dynamic" style="margin-bottom: 20px;" ></div>';
                $('div.beta').prepend(widget_slot);
                var widget_container = $(rec_selector);
                load_widget(recommended_id, widget_container);
                widget_container.addClass('loaded');
            }
            
            $('.ds_default_anchor').remove();
            console.log('ad free account run recommended', launch_distro);
            return;
        }


        if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
            console.log('all_ads_disabled is true', all_ads_disabled, launch_distro);
            return;
        }

        // Disable for resolutions less than 1024
        // if($(window).outerWidth() < 1024) {
        //     $('.ds_default_anchor').remove();
        //     console.log('remove distro and exit early cause window less than 1024', launch_distro);
        //     return;
        // }

        console.log('should launch distro?', launch_distro);

        if(launch_distro) {

            // cookie shouldn't be made unless distro is actually launched
            // desktop homepage
            createCookie("distroscale_shown_new", "1", 2, true); //hrs

            if(isTouchDevice() == true){ //throttle diff on mobile
                createCookie("distroscale_shown_new", "1", 2, true); //24 hours    
            }

            load_distro_when_ready_master();
        }

    }


}

function load_distro_when_ready_master()
{
    if(browser_tab_is_visible == true){
        init_distro_master_set();
        return;
    }

    var distro_interval = setInterval(function() {

        // console.log("DISTRO BROWSER TAB VISIBLE?", browser_tab_is_visible);
        if(browser_tab_is_visible == false){
            return;
        }
        
        // console.log("DISTRO BROWSER IS VISIBLE SO CLEAR INTERVAL AND RUN IT", browser_tab_is_visible);
        clearInterval(distro_interval);
        init_distro_master_set();

    }, 1000);
}

function init_distro_master_set()
{
    var distroscale = document.createElement('script');
    distroscale.type = 'text/javascript'; 
    distroscale.async = true;
    distroscale.src = (document.location.protocol == "https:" ? "https:" : "http:") + '//c.jsrdn.com/s/cs.js?p=22663';
    var dstrox = document.getElementsByTagName('script')[0];
    dstrox.parentNode.insertBefore(distroscale, dstrox); 
}











////////////////////////////////////////////////////////////////////////////////
// SPOT.IM FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//SPOT.IM DOC READY -- NEEDED TO CALL OUT EACH TEMPLATE AND APPEND SPOT.IM WIDGET TO RIGHT RAIL WHEN ELEMENTS ARE ALL LOADED - ONLY RCP!!!
function spot_right_rail_init() {


    if( (typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) || (typeof disable_3rd_party_ads !== 'undefined' && disable_3rd_party_ads  === true) ) {
        return;
    }

    if(evolok_init_finished) { // Evolok is initiated

        if(!evolok_do_ads) {
            console.log('skip and wait for next function call');
            // Just skip and wait for next function call for a status change
            return;
        }
        console.log('go ahead and do spot right rail');
        // Otherwise go ahead and do ads
    }

    var allowedSites = [
        "defense",
        "markets",
        "world",
        "science",
        "history",
        "policy",
        "religion",
        "energy",
        "investigations",
        "health",
        "eduction",
        "books",
        "politics"
    ];

    if( $.inArray(SITE_INFO['name'], allowedSites) > -1 ){

        var widget_loc = '';
        var widget_order = '';

        if( $("body.entry").length>0 || $("body.author").length>0 || $("body.cartoon").length>0 || $("body.search").length>0 || $("body.story-stream").length>0 ){

            //Check, Re-Check if elements exist until they do then append spot widget to right rail
            widget_loc = 'Other';
            widget_order = 'before';

            isITNLoaded(widget_loc, widget_order);

        }else if( $("body.home").length>0  ){ //&& $("body").hasClass("spot-home")

            //Check, Re-Check if elements exist until they do then append spot widget to right rail
            widget_loc = 'homepage';
            widget_order = 'before';

            isITNLoaded(widget_loc, widget_order);
        }else if( $("body.article").length>0 ){

            widget_loc = 'articles';
            widget_order = 'after';
            isITNLoaded(widget_loc, widget_order);

        }else if( $("body.polls").length>0 || $("body.live_results").length>0 ){

            widget_order = 'before';
            isITNLoaded(".widget_slot:eq(1)", widget_order);

        }else if( $("body.video").length>0 ){
            //Check, Re-Check if elements exist until they do then append spot widget to right rail
            widget_loc = 'Other';
            widget_order = 'after';

            isITNLoaded(widget_loc, widget_order);
        }


    }
}

//SPOT.IM -- makes sure elements are loaded on page and then, depending on template, appends spot.im widget to right rail
function isITNLoaded(widget_loc, widget_order) {

    //testing do not run on mobile
    // var ismobile = $().isMobile(); 
    // if(ismobile==true){ return; }

    var target_el = '';
    if(widget_loc == "Other"){
        target_el = '.widget_slot:eq(2)';
    }else if(widget_loc == "homepage"){
        //var target_el = '[data-widget-title="Latest Polls"]';
        var target_column = '.beta';
        if(document.body.clientWidth < 768){ // smaller than ipad portrait
            target_column = '.alpha';
        }
        target_el = target_column + ' .spot-box'; //Added empty div to index template - Only page we needed additional markup
    }else if( widget_loc=='articles' ){
        target_el = '.widget_slot:eq(2)';

    }else{
        //else make widget_loc the target_el for custom places
        target_el = widget_loc;
    }


    if ( $(target_el).length>0 && !$(target_el).is("[data-no-ads]") ) {

        //console.log("ITN Loaded, Append SPOT.IM....");

        //temporary solution
        if(SITE_INFO['name'] == 'politics') {

            if(widget_order == "before"){
                //console.log('WIDGET LOC: ' + widget_loc);
                if(widget_loc == "homepage"){
                    //console.log('TARGET EL INSIDE IS HOMEPAGE CHECK: ' + target_el);
                    $(target_el).append('<div class="spot-im-widget-header" style="font-size:13px; background-color:#d30015; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true" data-page-type="homepage"> </div>');

                    var social_side_rail = document.createElement("script");
                    social_side_rail.type = "text/javascript";
                    //social_side_rail.src = "https://recirculation.spot.im/spot/" + SITE_INFO['spot_production_id'] + "/siderail";
                    social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                    social_side_rail.async = true;
                    social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                    social_side_rail.setAttribute("data-post-id", "homepage");
                    social_side_rail.setAttribute("data-spotim-autorun", "false");
                    //$(social_side_rail).appendTo("body");
                    $(target_el).append(social_side_rail);

                }else{

                    $(target_el).after('<div class="spot-im-widget-header" style="font-size:13px; background-color:#d30015; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true"></div>');


                    var data_post_id = $('body').attr('class');

                    if(typeof window.__OW_CONFIG__ == 'undefined'){ // if the SPOT>IM library is not loaded then load it

                        var social_side_rail = document.createElement("script");
                        social_side_rail.type = "text/javascript";
                        social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                        social_side_rail.async = true;
                        social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                        social_side_rail.setAttribute("data-post-id", data_post_id );
                        social_side_rail.setAttribute("data-spotim-autorun", "false");
                        //$(social_side_rail).appendTo("body");
                        $(target_el).append(social_side_rail);

                    }


                }


            }else{

                $(target_el).after('<div class="spot-im-widget-header" style="font-size:13px; background-color:#d30015; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true"></div>');

                var data_post_id = $('body').attr('class');

                if(typeof window.__OW_CONFIG__ == 'undefined'){

                    var social_side_rail = document.createElement("script");
                    social_side_rail.type = "text/javascript";
                    social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                    social_side_rail.async = true;
                    social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                    social_side_rail.setAttribute("data-post-id", data_post_id );
                    social_side_rail.setAttribute("data-spotim-autorun", "false");
                    //$(social_side_rail).appendTo("body");
                    $(target_el).append(social_side_rail);

                }

            }

        } else {
            if(widget_order == "before"){
                //console.log('WIDGET LOC: ' + widget_loc);
                if(widget_loc == "homepage"){
                    //console.log('TARGET EL INSIDE IS HOMEPAGE CHECK: ' + target_el);

                    $(target_el).append('<div class="spot-im-widget-header" style="font-size:13px; background-color:'+site_color+'; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true" data-page-type="homepage"> </div>');

                    var social_side_rail = document.createElement("script");
                    social_side_rail.type = "text/javascript";
                    //social_side_rail.src = "https://recirculation.spot.im/spot/" + SITE_INFO['spot_production_id'] + "/siderail";
                    social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                    social_side_rail.async = true;
                    social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                    social_side_rail.setAttribute("data-post-id", "homepage");
                    social_side_rail.setAttribute("data-spotim-autorun", "false");
                    //$(social_side_rail).appendTo("body");
                    $(target_el).append(social_side_rail);


                }else{


                    $(target_el).after('<div class="spot-im-widget-header" style="font-size:13px; background-color:'+ site_color +'; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true"></div>');

                    var data_post_id = $('body').attr('class');

                    if(typeof window.__OW_CONFIG__ == 'undefined'){

                        var social_side_rail = document.createElement("script");
                        social_side_rail.type = "text/javascript";
                        social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                        social_side_rail.async = true;
                        social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                        social_side_rail.setAttribute("data-post-id", data_post_id );
                        social_side_rail.setAttribute("data-spotim-autorun", "false");
                        //$(social_side_rail).appendTo("body");
                        $(target_el).append(social_side_rail);

                    }

                }


            }else{

                if( typeof $("#jsSite").attr("data-gaTag") !== 'undefined' && $("#jsSite").attr("data-gaTag") == 'API'){
                    return;
                }

                $(target_el).after('<div class="spot-im-widget-header" style="font-size:13px; background-color:'+ site_color +'; color: #FFFFFF;padding: 15px 15px;width: auto;font-weight: bold;margin-bottom: 0px;">Popular in the Community</div><div data-spotim-module="pitc" data-vertical-view="true"></div>');

                var data_post_id = $('body').attr('class');

                if(typeof window.__OW_CONFIG__ == 'undefined'){

                    var social_side_rail = document.createElement("script");
                    social_side_rail.type = "text/javascript";
                    social_side_rail.src = "https://launcher.spot.im/spot/" + SITE_INFO['spot_production_id'];
                    social_side_rail.async = true;
                    social_side_rail.setAttribute("data-spotim-module", "spotim-launcher");
                    social_side_rail.setAttribute("data-post-id", data_post_id );
                    social_side_rail.setAttribute("data-spotim-autorun", "false");
                    //$(social_side_rail).appendTo("body");
                    $(target_el).append(social_side_rail);

                }

            }
        }


    } else {
        //check in 500 ms
        setTimeout(isITNLoaded, 500, widget_loc, widget_order);
    }

}











////////////////////////////////////////////////////////////////////////////////
// STORY STREAM FUNCTIONS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**TEMPORARY FIX
 Allows us to change the stream page for sponsors and custom ads on page.
 10.03.16 A.A. - Added time outs for each section of this to make sure that the content is updated either on first try or on second try from timeouts because of a race between this and story-stream.js to update the header of the story streams page.
 **/
function init_story_stream_related() {

    if( SITE_PAGE == 'story-stream' && SITE_INFO['story_stream_related'] == true ) {

        console.log("story");
        var sp_url = decodeURIComponent(window.location.href).toLowerCase();
        var sp_topic_match = sp_url.match(/topic=(\w+)/);

        if(typeof sp_topic_match != 'undefined' && sp_topic_match.length > 0){

            var sp_topic = sp_topic_match.length >1 ? sp_topic_match[1] : "election_2016";

            var meta_url = "/topic/"+sp_topic.substring(0, 1)+"/"+sp_topic+"/tag_meta.json";

            $.ajax({
                dataType: 'json',
                url: meta_url,
                success: function(data) {
                    var output = '';

                    if(typeof data.tag_assigned_tags !== 'undefined' && data.tag_assigned_tags.length > 0){

                        $(document).ready(function(){
                            //overwrites the original height of the parent div to adjust to the new elements added

                            $(data.tag_assigned_tags).each(function(){
                                var safe_link = this.name.toLowerCase().replace(/ /g, '_').replace(/\W+/g, "");
                                //output += '<li class="tag-icon"><a href="/stream/?topic=' + this.name + '">'+ this.name +'</a></li>';
                                output += '<li class="tag-icon">';
                                output +=   '<div class="content_wrapper">';
                                output +=   '<a href=/stream/?topic=' + safe_link + '>' + this.name + '</a>';
                                output +=   '</div>'; //end of content-wrapper
                                output += '</li>'; //end item
                            });


                            story_stream_related_tags_html = '<div class="alpha_related_tags_mobile"><ul class="related-tags mobile"><span class="alpha_related_tags_title">Related Topics: </span>' + output + '</ul></div>';
                            //adds the description to the header
                            $('.tag-description').append(data.tag_description);

                            $('.related_tags').append('<div class="rec-widget-header"><div class="rec-title related-topics">Related Topics</div></div>');
                            $('.related_tags').append('<ul class="related-tags-side-widget"></ul>');
                            $('.related_tags ul.related-tags-side-widget').append(output);

                            if($('.alpha_related_tags').length) {
                                $('.alpha_related_tags').append(output);
                            }
                        });
                    }

                    if(parseInt(data.sponsored) == 1){

                        if(data.sponsor_ads != null || data.sponsor_ads != "" || data.sponsor_ads != undefined){

                            $("#jsSite").attr("data-gaTag", data.sponsor_ads);
                            GA_TAG = $("#jsSite").attr("data-gaTag");
                        }
                        //overwrites the ba


                        $('#sponsored_heading').html('<link type="text/css" rel="stylesheet" href="/asset/section/story-stream-sponsored.css" />');
                        setTimeout(function(){
                            $('#sponsored_heading').html('<link type="text/css" rel="stylesheet" href="/asset/section/story-stream-sponsored.css" />');
                            //console.log("delayed css");
                        }, 300);

                        $('.stream-details div.icon').html('<img src="/asset/img/storyStream-header-icon-black.png">');
                        setTimeout(function(){
                            $('.stream-details div.icon').html('<img src="/asset/img/storyStream-header-icon-black.png">');
                            //console.log("delayed icon");
                        }, 300);

                        var html = "";
                        $(document).ready(function(){

                            html += "<center>"+data.sponsor_text+"</center>";

                            if(data.sponsor_link != null || data.sponsor_link != "" || data.sponsor_link != undefined){
                                html += "<a href='"+data.sponsor_link+"'>";
                            }
                            html += "<center><img src='"+data.sponsor_img+"' class='sponsored_header_img'></center>";

                            if(data.sponsor_link !== null || data.sponsor_link !== "" || data.sponsor_link !== undefined){
                                html += "</a>";
                            }
                        });

                        setTimeout(function(){
                            $('#sponsored_heading').append(html);
                        }, 400);


                    }else if(data.tag_image_loc !== '' || data.tag_image_loc !== null){
                        //console.log(data);

                        $(document).ready(function(){

                            $('.stream-header').css({
                                'background-color' : '#000',
                                'height' : '300px'
                            });

                            $('.stream-header .photo').css({
                                'background' : 'url('+data.tag_image_loc+') no-repeat #000',
                                'background-color' : '#000',
                                'opacity': '0.6',
                                'background-size' : 'cover',
                                'height': '300px',
                                'background-position-y' : '50%',
                            });


                            //$('.tag-description').append(data.tag_description);
                            $('.tag-description').css({
                                'color' : '#fff',
                            });
                        });

                        /*
            setTimeout(function(){
              $('.stream-header').css({
                'background-color' : '#000',
              });

              if(data.tag_image_loc !== '' || data.tag_image_loc !== null){
                $('.stream-header .photo').css({
                  'background' : 'url('+data.tag_image_loc+') no-repeat #000',
                  'background-color' : '#000',
                  'opacity': '0.6',
                  'background-size' : 'cover',
                  'height': '250px',
                  'background-position-y' : '50%',
                });
              }

              //$('.tag-description').append(data.tag_description);
              $('.tag-description').css({
                'color' : '#fff',
              });


            }, 500);
            */

                    } else{
                        $(document).ready(function(){
                            $('.photo').css({
                                'background-color' : '#000',
                                'height' : '250px',
                            });
                        });

                        /*setTimeout(function(){
                            $('.photo').css('background', '#000');
                            //console.log("delayed else");
                            }, 500);*/
                        //console.log("Sponsored Off");
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    $('.photo').css('background', '#000');
                    setTimeout(function(){
                        $('.photo').css('background', '#000');
                        //console.log("delayed error");
                    }, 500);
                },
                statusCode: {
                    404: function() {
                        //console.log( "sponsor json not found" );
                        $('.photo').css('background', '#000');
                        setTimeout(function(){
                            $('.photo').css('background', '#000');
                            //console.log("delayed 404");
                        }, 500);
                    },
                    403:function() {
                        //console.log( "sponsor json forbiden" );
                        $('.photo').css('background', '#000');
                        setTimeout(function(){
                            $('.photo').css('background', '#000');
                            //console.log("delayed 403");
                        }, 500);
                    }
                }
            });
        }else{
            console.log('no topic for story stream');
        }
    }
}

function storyStreamClick(e){
    /*
  This code figures out the targets (span click or hovered) location
  Compares it to the alpha location wrapper div and figures out the top and left position
  that overlay story stream should appear at
   */
    var ele_text = $(e.target).text();
    $(e.target).html(ele_text+'<img class="ss_loader" src="//notifications.realclearpolitics.com/web_notifications/images/ajax-loader2.gif">');
    $(".story-stream-hover-wrapper").hide();

    //var ele_url = ele_text.toLowerCase();
    //ele_url = ele_url.replace(/ /g, '_').replace(/\W+/g, "");

    //use the same basename making process equal to cms side
    var ele_url = Utils.make_slug(ele_text);

    $(".story-stream-hover-wrapper .title-wrapper .title").html('<a href="/stream/?topic='+ele_url+'">' + ele_text + '</a>');
    populateStreamTag(ele_url, e, 'click');
}

function storyStreamHover(e){

    /*
  This code figures out the targets (span click or hovered) location
  Compares it to the alpha location wrapper div and figures out the top and left position
  that overlay story stream should appear at
   */

    var ele_text = $(e.target).text();
    $(e.target).html(ele_text+'<img class="ss_loader" src="//notifications.realclearpolitics.com/web_notifications/images/ajax-loader2.gif">');
    $(".story-stream-hover-wrapper").hide();

    //var ele_url = ele_text.toLowerCase();
    //ele_url = ele_url.replace(/ /g, '_').replace(/\W+/g, "");

    //use the same basename making process equal to cms side
    var ele_url = Utils.make_slug(ele_text);

    $(".story-stream-hover-wrapper .title-wrapper .title").html('<a href="/stream/?topic='+ele_url+'">' + ele_text + '</a>');
    populateStreamTag(ele_url, e, 'hover');

    //keeps stream info box open when hovered over - desktop
    $( ".story-stream-hover-wrapper" ).hover(
        function() {
            $( this ).show();
        }, function() {
            $( this ).hide();
        }
    );
}

//populate story stream popups for any template that uses them
function populateStreamTag(tag, e, ga_action){

    var ss = $.extend(true, {}, $StoryStream);

    ss.topic = tag;
    //Set the limit in StoryStream object. This is the number of stories that will appear at a time.
    ss.limit = 12;
    //Set which DOM element is the content container
    ss.container = $(".story-stream-hover-wrapper");

    ss.event = e;
    ss.ga_action = ga_action;

    ss.loop_limit = 5;
    ss.pushed_to_html = 0;
    ss.fail_limit = 10;

    ss.stories_added = [];
    ss.html = "";

    ss.current_article = $('.article-title h1').text();

    //Override the print_stories function.
    //This is so the markup for this page gets generated on continue_stream(),
    // instead of the default markup
    ss.print_stories = function(stories_array) {
        stream_tags[tag] = '';
        var urlArray = [];
        for(var i=0; i<stories_array.length; i++) {
            if(this.filter.indexOf(stories_array[i].type) != -1) {
                if(this.pushed_to_html >= this.loop_limit){
                    break;
                }

                if(urlArray.indexOf(stories_array[i].content_url) != -1
                    || this.current_article == this.clear_html_entities(stories_array[i].heading1.replace(/\\/g, "")) ){
                    continue;
                } //end urlArray check

                urlArray.push(stories_array[i].content_url);

                this.stories_added.push([stories_array[i].content_url, stories_array[i].heading1]);

                this.pushed_to_html = this.pushed_to_html + 1;

            } //end if type check
        } //end for loop

        if(this.pushed_to_html >= this.loop_limit){
            this.is_finished = true;
            this.build_up_html();
            reposition_story_stream_widget(this.event, this.ga_action, true);
        }

    } //end print stories

    ss.clear_html_entities = function(text){
        var txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }

    ss.build_up_html = function(){
        if(this.stories_added.length > 0){
            this.html = "";

            var limiter = 5;
            if(this.stories_added.length < 5){
                limiter = this.stories_added.length;
            }

            for(var i = 0; i < limiter; i++){
                this.html += '<li><a href="'+this.stories_added[i][0].replace(/\\/g, "")+'">'+this.stories_added[i][1].replace(/\\/g, "")+'</a></li>';
            }

            $(".story-stream-hover-wrapper .recent-link ul").html(this.html);
        }else{
            $(".story-stream-hover-wrapper .recent-link ul").html("No Posts Available");
        }
    }

    ss.finished_callback = function(){
        if(this.fail_count >= this.fail_limit){
            this.is_finished = true;
            this.build_up_html();
            reposition_story_stream_widget(this.event, this.ga_action, false);
        }
    }

    //init stream - build links
    ss.continue_stream();
}

function reposition_story_stream_widget(e, ga_action, completed){

    $('.ss_loader').remove();

    var ele = $(e.target.parentNode);

    var target_offset = $(e.target).offset();
    var target_width = $(e.target).width();
    var target_height = $(e.target).height();
    var target_left = target_offset.left;
    var target_top = target_offset.top;

    var scrollTop     = $(window).scrollTop(),
        elementOffset = ele.offset().top,
        distance      = (elementOffset - scrollTop);

    var windowWidth = $(window).outerWidth();
    var height = $(".story-stream-hover-wrapper").height();
    var alpha_offset = $('.alpha').offset();

    var hoverLeft;
    var hoverTop;

    hoverTop = target_top - alpha_offset.top - (target_height/2);
    if( windowWidth > 768 ){
        hoverLeft = target_left - alpha_offset.left - (target_width/2) - 20;
        if(hoverLeft < -42){
            hoverLeft = -42;
        }
        $( ".mobile-close-btn" ).hide();
    }else{
        hoverLeft = "0px";
        if( distance > height ){
            hoverTop = hoverTop + 40;
        }
        $( ".mobile-close-btn" ).show();
    }

    var appear_on_top = false;
    if( distance <= height ){ //show below placeholder
        hoverTop = hoverTop - 10;
        $(".story-stream-hover-wrapper").css({
            position: "absolute",
            top: hoverTop,
            left: hoverLeft
        }).show();

        $( ".story-stream-hover-tab-up" ).show();
        $( ".story-stream-hover-tab-down" ).hide();
        appear_on_top = false;
    }else{ //show above  placeholder
        hoverTop = hoverTop - 401;
        $(".story-stream-hover-wrapper").css({
            position: "absolute",
            top: hoverTop,
            left: hoverLeft
        }).show();

        $( ".story-stream-hover-tab-down" ).show();
        $( ".story-stream-hover-tab-up" ).hide();
        appear_on_top = true;
    }

    if(ga_action == 'click'){
        $( ".mobile-close-btn" ).show();
    }else{
        $( ".mobile-close-btn" ).hide();
    }

    $( ".mobile-close-btn" ).click(function(){
        $( ".story-stream-hover-wrapper" ).hide();
    });

    var position_data = {
        target_top:target_top - alpha_offset.top - (target_height/2)-210,
        appear_on_top: appear_on_top
    }

    if(position_data.appear_on_top){
        var wrapper_height = $(".story-stream-hover-wrapper").height();
        if(parseInt(wrapper_height) < 350){
            var difference = 350 - wrapper_height;
            var current_top_pos = parseFloat($(".story-stream-hover-wrapper").css('top'));
            var new_top_pos = current_top_pos + difference;

            if(parseInt(new_top_pos) <= parseInt(position_data.target_top) ){
                $(".story-stream-hover-wrapper").css('top', new_top_pos+'px');
            }else{
                $(".story-stream-hover-wrapper").css('top', (position_data.target_top-20)+'px');
            }
        }
    }

    var bc = $('body').attr('class');
    var data = {
        'ge_action' : ga_action,
        'ge_category' : 'System Widget Interaction',
        'ge_label' : 'Inline Story Stream : '+bc
    };
    try{
        _gaq.push(['_trackEvent', data['ge_category'], data['ge_action'], data['ge_label']]);
    } catch(err) {}
}











////////////////////////////////////////////////////////////////////////////////
// HOMEPAGE FUNCTIONS //////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//homepage navigation touch/click handlers
function homeNavClick(e){
    var ele = $(e.target.parentNode);
    var menu = ele.find("ul");


    $( menu ).toggle();
}

//homepage navigation mouse event handlers
function mainNavHover(){

    var over_submenu = false;

    /*$('.main-nav-bar ul.hoverMenu').hover(
      function(){
        over_submenu = true;
      },
      function(){
        over_submenu = false;
      }
  );*/

    $(".main-nav-bar .hoverli").hover(
        function () {
            // $('ul.hoverMenu').slideDown('medium');
            $(this).find('ul.hoverMenu').show();
        },
        function () {
            //$('ul.hoverMenu').slideUp('medium');
            //setTimeout(function(){
            // if(!over_submenu) {
            //$('.main-nav-bar ul.hoverMenu').hide();
            //}
            //},  20);

            $(this).find('ul.hoverMenu').hide();

        }
    );

}

function viewSwitcher(){
    $( ".grid_hp" ).click(function(){

        $('.list_view_default').hide();

        $( ".grid-view" ).css({ "display" : "block" });
        $( ".list-view" ).css({ "display" : "none" });

        $( ".list-style .grid_hp" ).addClass("active");
        $( ".list-style .list_hp" ).removeClass("active");

        var data = {
            'ge_action' : 'Grid View',
            'ge_category' : 'Section: Homepage',
            'ge_label' : 'Click',
            'ge_noninteraction' : false
        };
        send_ga_event(data);

        // Ask if this should be default
        if( SITE_INFO['name'] != "investigations" ){

            $('.grid_view_default .yes').click(function() {
                createCookie('grid_view_default','1','365');
                $('.grid_view_default').hide();
                var grid_data = {
                    'ge_action' : 'Grid View',
                    'ge_category' : 'Section: Homepage',
                    'ge_label' : 'Set Grid Cookie: Yes',
                    'ge_noninteraction' : false
                };
                send_ga_event(grid_data);
            });
            $('.grid_view_default .no').click(function() {
                createCookie('grid_view_default','0','365');
                $('.grid_view_default').hide();
                var grid_data = {
                    'ge_action' : 'Grid View',
                    'ge_category' : 'Section: Homepage',
                    'ge_label' : 'Set Grid Cookie: No',
                    'ge_noninteraction' : false
                };
                send_ga_event(grid_data);
            });
            if(readCookie('grid_view_default') != '1') {
                $('.grid_view_default').show();
            }
        }
    });

    $( ".list_hp" ).click(function(){

        $('.grid_view_default').hide();

        $( ".list-view" ).css({ "display" : "block" });
        $( ".grid-view" ).css({ "display" : "none" });

        $( ".list-style .list_hp" ).addClass("active");
        $( ".list-style .grid_hp" ).removeClass("active");

        var data = {
            'ge_action' : 'List View',
            'ge_category' : 'Section: Homepage',
            'ge_label' : 'Click',
            'ge_noninteraction' : false
        };
        send_ga_event(data);

        // Ask if this should be default
        if( SITE_INFO['name'] != "investigations" ){

            $('.list_view_default .yes').click(function() {
                createCookie('grid_view_default','0','365');
                $('.list_view_default').hide();
                var list_data = {
                    'ge_action' : 'List View',
                    'ge_category' : 'Section: Homepage',
                    'ge_label' : 'Set List View Cookie: Yes',
                    'ge_noninteraction' : false
                };
                send_ga_event(list_data);
            });
            $('.list_view_default .no').click(function() {
                createCookie('grid_view_default','1','365');
                $('.list_view_default').hide();
                var list_data = {
                    'ge_action' : 'List View',
                    'ge_category' : 'Section: Homepage',
                    'ge_label' : 'Set List View Cookie: No',
                    'ge_noninteraction' : false
                };
                send_ga_event(list_data);
            });
            if(readCookie('grid_view_default') != '0') {
                $('.list_view_default').show();
            }
        }
    });

    // Read cookie to determine if grid is default, if so, click
    if(readCookie('grid_view_default') == '1') {
        $( ".grid_hp" ).trigger('click');
    }
}











////////////////////////////////////////////////////////////////////////////////
// CONGRESSIONAL BILL TRACKER FUNCTIONS ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function cbtSearch(){
    $( "#cbt-searchBox" ).keypress(function(e) {
        //e.preventDefault();
        if(e.which == 13) {
            searchText = ($(this).val());
            window.location = window.location.protocol+'//dyn.realclearpolitics.com/congressional_bill_tracker/search/' + searchText + '';
            $(this).val('');
        }
    });
}

function toggleCBTsearch(){
    $( ".cbt-widget .filter" ).click(function(){
        $( ".cbt-widget .search #cbt-searchBox" ).toggle();
        $( ".cbt-widget .search #form_state_select" ).toggle();
        $( ".cbt-widget .search .select" ).toggle();
    });
}











////////////////////////////////////////////////////////////////////////////////
// COMMENTS FUNCTIONS //////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function showComments(){
    $('.comments-count .show').click(function(){
        $(this).parent().parent().find("#comments-container").show();
        $(".comments-count .show").hide();
        $(".comments-count .hide").show();

        clearInterval(rcp_page_refresh_interval); //CLEARS THE REFRESH INTERVAL SET ON rcp.js
    });
}

function hideComments(){
    $('.comments-count .hide').click(function(){
        $(this).parent().parent().find("#comments-container").hide();
        $(".comments-count .hide").hide();
        $(".comments-count .show").show();
    });
}

function showHideComments(){
    $('.comments-wrapper .comments-label').click(function(){
        $(this).parent().parent().find("#comments-container").toggle();
        $(".comments-count .hide").toggle();
        $(".comments-count .show").toggle();

        clearInterval(rcp_page_refresh_interval); //CLEARS THE REFRESH INTERVAL SET ON rcp.js
    });
}











////////////////////////////////////////////////////////////////////////////////
// HP RECENTS FUNCTIONS ////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function recentItemsSlider()
{
    var $container = $('.hp-recents-container');
    if($container.length > 0) {
        $.getJSON(SITE_INFO['global_site_url']+'/include/home-recents-scroller-data.js?callback=?');
    }
}

// This function serves as the callback for /include/home-recents-scroller-data.js
function callback_recent_scroller(data)
{
    var $container = $('.hp-recents-container');

    // Populate with items from data

    var output = '';
    var counter = 1;

    output += '<ul id="recents_carousel" class="slides">';

    $.each(data.rss.item, function(i,item){ //LOOPS THROUGH EACH ITEM

        if(item.media['content']['url']!=""){ //ITEM MUST HAVE AN IMAGE

            var split_author = item.author.split(",");
            var author_name = split_author[0];
            //image = '<img class="tmb" src="'+item.media['content']['url']+'" />'; //_1_
            image = '<img class="tmb" src="'+item.media['thumbnail']['url']+'" />'; //_3_

            var output_item = '';

            if(counter<=24){

                output_item += '<li class="video">';
                output_item += '<div class="image">';
                output_item += '<a href="'+item.link+'">'+image+'</a>';
                output_item += '</div>';
                output_item += '<p class="info">';
                output_item += '<a href="'+item.link+'">';
                output_item += '<em>'+author_name+'</em>: '+ item.title;
                output_item += '</a>';
                output_item += '</p>';
                output_item += '<div class="buffer"></div>';
                output_item += '</li>';
            }

            output += output_item;

            counter += 1;
        }
    });

    output += '</ul>';
    //output += '<a class="video_nav" id="prev" href="javascript:void(\'0\');">&laquo;</a> <a class="video_nav" id="next" href="javascript:void(\'0\');">&raquo;</a>';

    $container.children("#entries").html(output);

    var grid_size = get_grid_size_recents();

    $container.children("#entries").flexslider({
        animation: "slide",
        slideshowSpeed: 15000,
        controlNav: false,
        itemWidth: 210,
        minItems: grid_size,
        maxItems: grid_size
    });

    $(window).resize(throttle_resize_recents);
}

var resize_timeout_recents;

function throttle_resize_recents()
{
    window.clearTimeout(resize_timeout_recents);
    resize_timeout_recents = setTimeout(window_resize_recents, 70);
}

function window_resize_recents()
{
    //DESTROY FLEXSLIDER IF EXISTS
    var flexslider = $('.hp-recents-container #entries').data('flexslider');
    if(flexslider != undefined)
    {
        flexslider.destroy();
        var grid_size = get_grid_size_recents();
        $('.hp-recents-container #entries').flexslider({
            animation: "slide",
            slideshowSpeed: 5000,
            controlNav: false,
            itemWidth: 200,
            minItems: grid_size,
            maxItems: grid_size
        });
    }
}

function get_grid_size_recents()
{
    var w_width = window.innerWidth;
    if(w_width < 480) {
        return 1;
    } else if(w_width < 760) {
        return 2;
    } else if(w_width < 860) {
        return 3;
    } else if(w_width < 1080) {
        return 4;
    } else {
        return 5;
    }
}

////////////////////////////////////////////////////////////////////////////
/////////////////////ADMIRAL INIT CCPA///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

var admiral_gdpr_modal_active = false;

function admiral_init(){

    $(document).ready(function(){
        $('.ccpaOptOut').click(function(){
            if(window.admiral){
                window.admiral('show', 'ccpa.main');
            }
        })
    })

    window.admiral('after', 'ccpa.loaded', function(opts) {
        if(opts.applies) {
            document.querySelector('.ccpaOptOut').style.display = 'inline-block';
            $('.ccpaOptOut').show();
        }
        if(opts.optedOut){

            var on_ccpa_optOut = {
                'ge_action' : 'CCPA Opted-Out View',
                'ge_category' : 'Consent',
                'ge_label' : 'Page: ' + $('body').attr('class'),
                'ge_index' : null,
                'ge_noninteraction' : true
            };

            send_notifier_event(on_ccpa_optOut);

        }
    });

    window.admiral('after', 'cmp.loaded', function(opts) {
        console.log("ADMIRAL GDPR MODAL LOADED", opts);

        if(opts.euVisitor === true && opts.consentKnown === false && opts.tcData.gdprApplies === true ){
            admiral_gdpr_modal_active = true;
        }
        
    });
}










////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONS /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function click_outside_menus()
{
    $(document).click(function(event)
    {
        // Hide main dropdown menu on system widgets
        if( !$(event.target).closest('.rec-site .rec-site-list').length
            && !$(event.target).closest('.rec-site .menu').length )
        {
            $('.rec-site .rec-site-list').each(function()
            {
                if( $(this).is(':visible') )
                {
                    $(this).hide();
                    $(this).parent().find('.rec-site-tab').hide();
                }
            });
        }

        // Hide secondary dropdown menu on head-to-head system widget
        if( !$(event.target).closest('.head_to_head_candidates .menu').length
            && !$(event.target).closest('.head_to_head_race_dropdown').length )
        {
            $('.head_to_head_race_dropdown').each(function()
            {
                if( $(this).is(':visible') ) {
                    $(this).hide();
                }
            });
        }

        // Hide quick links / advanced filter
        if( !$(event.target).closest('.polls_header_dropdown').length &&
            $(event.target).attr('src') != '/asset/img/grey-bg-chev.png' )
        {

            var $ql_c = $('.polls_header_dropdown .quick_links_content');
            var $f_c = $('.polls_header_dropdown .filter_content');

            $('.polls_header_dropdown .open .quick_links_title').removeClass('active');
            $('.polls_header_dropdown .open .filter_title').removeClass('active');
            $('.polls_header_dropdown .open .arrow').html('<img src="/asset/img/grey-bg-chev.png" alt="Arrow" />');

            if( $ql_c.is(':visible') ) {
                $ql_c.slideToggle();
            } else if( $f_c.is(':visible') ) {
                $f_c.slideToggle();
            }
        }
        if( !$(event.target).closest('.polls_header_2_dropdown').length &&
            $(event.target).attr('src') != '/asset/img/grey-bg-chev.png' )
        {

            var $ql_c = $('.polls_header_2_dropdown .quick_links_content');
            var $f_c = $('.polls_header_2_dropdown .filter_content');

            $('.polls_header_2_dropdown .open .quick_links_title').removeClass('active');
            $('.polls_header_2_dropdown .open .filter_title').removeClass('active');
            $('.polls_header_2_dropdown .open .arrow').html('<img src="/asset/img/grey-bg-chev.png" alt="Arrow" />');

            if( $ql_c.is(':visible') ) {
                $ql_c.slideToggle();
            } else if( $f_c.is(':visible') ) {
                $f_c.slideToggle();
            }
        }

        // verticals menu masthead inner pages
        if( !$(event.target).closest('.verticals-menu').length &&
            !$(event.target).closest('.verticals-site-list').length )
        {
            if( $('.verticals-tab').is(':visible') ) {
                $('.verticals-tab').hide();
                $('.verticals-site-list').hide();
            }
        }

        // social bar Menu
        if( !$(event.target).closest('.jqDrawer').length &&
            !$(event.target).closest('.toolset_drawer').length &&
            !$(event.target).closest('.email_icon').length )
        {
            if( $('.toolset_drawer').is(':visible') ) {
                $('.toolset_drawer').hide(200);
            }
        }

        // homepage date dropdown
        if( !$(event.target).closest('.date-menu').length )

        {
            if( $('.date-menu .menu').is(':visible') ) {
                $('.date-menu .menu').hide();
                $('.date-menu .menu-marker').hide();
            }
        }

    });
}

function displayStaff(){
    $('.menu .title').click(function(){
        var team = $( this ).parent().find(".author-wrapper");
        $( team ).toggle();
        $( this ).parent().toggleClass( "active" );
    });
}

function postScroller (){
    var scrollerWidth = 0;
    //get width - per post item
    var postWidth = $( ".scroller .post" ).outerWidth();

    var postLimit = 6;
    var totalPosts = '';

    $( ".scroller .post" ).each(function(index) {
        scrollerWidth += parseInt($(this).outerWidth(), 10);
        totalPosts = index+1;
    });

    $( ".scroller" ).css({ "width" : scrollerWidth });

    $('.scroller-wrapper .right').click(function() {
        //alert(postWidth);

        postLimit += 1;
        if( postLimit != totalPosts ){
            $('.scroller').animate({left: '-=' + postWidth + 'px'}, 'fast');
        }

    });

    $('.scroller-wrapper .left').click(function() {
        //alert(postWidth);

        postLimit -= 1;
        if( postLimit > 6 ){
            $('.scroller').animate({left: '+=' + postWidth + 'px'}, 'fast');
        }

    });

}

function dateMenu(){
    $( ".date-menu" ).click(function(){
        $( ".date-menu .menu-marker" ).toggle();
        $( ".date-menu .menu" ).toggle();

        dateMenuVisible = true;

    });

}

function send_ga_event(data)
{
    // REQUIRED INPUT:
    /*
  {
    'ge_action' : 'List View',
    'ge_category' : 'Homepage: Grid/List',
    'ge_label' : 'Click'
  }
  OPTIONAL INPUT:
  {
    'ge_noninteraction' : false
  }
  */

    if(typeof data['ge_noninteraction'] === 'undefined') {
        data['ge_noninteraction'] = true; // By default events are registered as noninteraction events, and leave bounce rate alone.
    }
    // Right now value is just always 0

    //Wrap event tracking call to prevent premature termination of this function.
    try{
        _gaq.push(['_trackEvent', data['ge_category'], data['ge_action'], data['ge_label'], 0, data['ge_noninteraction']]);
        console.log('trackevent: '+data['ge_category']+' '+data['ge_action']+' '+data['ge_label']+' '+data['ge_noninteraction']);
    } catch(err) {}
}

function customSelectBox(){
    // Iterate over each select element
    $('#form_state_select').each(function () {

        // Cache the number of options
        var $this = $(this),
            numberOfOptions = $(this).children('option').length;

        // Hides the select element
        $this.addClass('s-hidden');

        // Wrap the select element in a div
        $this.wrap('<div class="select"></div>');

        // Insert a styled div to sit over the top of the hidden select element
        $this.after('<div class="styledSelect"></div>');

        // Cache the styled div
        var $styledSelect = $this.next('div.styledSelect');

        // Show the first select option in the styled div
        $styledSelect.text($this.children('option').eq(0).text());

        // Insert an unordered list after the styled div and also cache the list
        var $list = $('<ul />', {
            'class': 'options'
        }).insertAfter($styledSelect);

        // Insert a list item into the unordered list for each select option
        for (var i = 0; i < numberOfOptions; i++) {
            $('<li />', {
                text: $this.children('option').eq(i).text(),
                rel: $this.children('option').eq(i).val()
            }).appendTo($list);
        }

        // Cache the list items
        var $listItems = $list.children('li');

        // Show the unordered list when the styled div is clicked (also hides it if the div is clicked again)
        $styledSelect.click(function (e) {
            e.stopPropagation();
            $('div.styledSelect.active').each(function () {
                $(this).removeClass('active').next('ul.options').hide();
            });
            $(this).toggleClass('active').next('ul.options').toggle();
        });

        // Hides the unordered list when a list item is clicked and updates the styled div to show the selected list item
        // Updates the select element to have the value of the equivalent option
        $listItems.click(function (e) {
            e.stopPropagation();
            $styledSelect.text($(this).text()).removeClass('active');
            $this.val($(this).attr('rel'));
            $list.hide();
            /* alert($this.val());*/ //Uncomment this for demonstration!
            window.location = window.location.protocol+'//dyn.realclearpolitics.com/congressional_bill_tracker/state/' + $this.val() + '';
        });

        // Hides the unordered list when clicking outside of it
        $(document).click(function () {
            $styledSelect.removeClass('active');
            $list.hide();
        });

    });
}

function sitesMenu(){
    $('.verticals-menu').click(function(){

        //if( $( '.more-nav' ).is( ' :visible' ) ){
        //  $('.more-nav').hide();
        //}

        $('.verticals-tab').toggle();
        $('.verticals-site-list').toggle();
    });
}

//open sitesMenu hover handler - changes color of pointer triangle at top of menu to match hovered site
function sitesMenuHover(){
    $('.verticals-site-list ul li a').mouseenter(function(){
        if($(this).is(':hover')){
            var bg = $(this).css('background-color');
            var parent = $(this).parent().parent().parent().parent();

            $('.verticals-tab').css( { "border-bottom" : "10px solid " + bg } );
        }
    });

    $('.verticals-site-list ul li a').mouseleave(function(){
        if($(this).not(':hover')){
            $('.verticals-tab').css( { "border-bottom" : "10px solid #EBEBEB" } );
        }
    });
}

//open sitesMenu hover handler - changes color of pointer triangle at top of menu to match hovered site
function recommendedSitesMenuHover(){
    $('.rec-site-list ul li a').mouseenter(function(){
        if($(this).is(':hover')){
            var bg = $(this).css('background-color');
            var parent = $(this).parent().parent().parent().parent();

            $('.rec-site-tab').css( { "border-bottom" : "10px solid " + bg } );
        }
    });

    $('.verticals-site-list ul li a').mouseleave(function(){
        if($(this).not(':hover')){
            $('.verticals-tab').css( { "border-bottom" : "10px solid #EBEBEB" } );
        }
    });
}

//more link drop menu - contains all sections of website
function sectionsMenu(){

    if( $(window).width() > 420 ) {

        $(".site-nav-more").on({
            mouseenter: function (e) {
                //HIDES OTHER DROPDOWNS
                if ($('.verticals-menu').is(' :visible')) {
                    $('.verticals-tab').hide();
                    $('.verticals-site-list').hide();
                }

                $(this).find('.sections-tab').show();
                $(this).find('.primary').show();
            }, mouseleave: function (e) {
                $(this).find('.sections-tab').hide();
                $(this).find('.primary').hide();
            }
        });
    }

    /*, click: function(e) {

      //HIDES OTHER DROPDOWNS
      if( $( '.verticals-menu' ).is( ' :visible' ) ){
        $('.verticals-tab').hide();
        $('.verticals-site-list').hide();
      }

      $(this).find('.sections-tab').toggle();
      $(this).find('.primary').toggle();
    }--
    });  */


    $('li.site-nav-more .jQ-section-menu').click(function(e){
        //alert(e.target+'-'+this);
        e.preventDefault();
        if(e.target != this) return; // only continue if the target itself has been clicked, this is so child submenu clicks will work
        //alert('got here');
        //HIDES OTHER DROPDOWNS
        if( $( '.verticals-menu' ).is( ' :visible' ) ){
            $('.verticals-tab').hide();
            $('.verticals-site-list').hide();
        }

        $(this).parent().find('.sections-tab').toggle();
        $(this).parent().find('.primary').toggle();
    });



    /*
  $(".site-nav-more").hover(
      function () {
      //HIDES OTHER DROPDOWNS
      if( $( '.verticals-menu' ).is( ' :visible' ) ){
        $('.verticals-tab').hide();
        $('.verticals-site-list').hide();
      }

      $(this).find('.sections-tab').show();
      $(this).find('.primary').show();
      },
      function () {
       $(this).find('.sections-tab').hide();
       $(this).find('.primary').hide();
      }
  ); */
}

//inner sections menu handler - opens sub-sections for modules like Polls, Elections 2016, Etc...
function sectionsInnerMenu(){
    $('.site-nav-more ul.primary li a').click(function(){
        //alert('test');
        if( $(this).not('.static') ){
            $(this).parent().find('.inner').toggle();
        }
        /*if( $(this).is('.static') ){
      $('.more-nav').toggle();
      var url = $(this).attr('href');
      location.href  = url;
    }*/
    });
}

function progressBar(){
    var getMax = function(){
        return $(document).height() - $(window).height();
    }

    var getValue = function(){
        return $(window).scrollTop();
    }

    //alert( 'getMax: ' + getMax() + ' -- ' + 'getVal: ' + getValue() );    

    if ('max' in document.createElement('progress')) {
        // Browser supports progress element
        var progressBar = $('progress');

        var top = $('#progress-bar').offset().top;




        // Set the Max attr for the first time
        progressBar.attr({ max: getMax() });

        $(document).on('scroll', function(){
            // On scroll only Value attr needs to be calculated
            progressBar.attr({ value: getValue() });

            var y = $(this).scrollTop();

            if( y > top ){
                // $('#progress-bar').addClass('fixed');
                $('.progress-bar').addClass('fixed');
                $(".progress-bar").css({ "position" : "fixed" });
            }else{
                //$('#progress-bar').removeClass('fixed');
                //$('.progress-bar').addClass('fixed');
            }

        });

        $(window).resize(function(){
            // On resize, both Max/Value attr needs to be calculated
            progressBar.attr({ max: getMax(), value: getValue() });
        });

    } else { //no browser support => older browsers and < IE10

        var progressBar = $('.progress-bar'),
            max = getMax(),
            value, width;

        var getWidth = function() {
            // Calculate width in percentage
            value = getValue();

            width = (value/max) * 100;
            width = width + '%';
            return width;
        }

        var setWidth = function(){
            progressBar.css({ width: getWidth() });
        }

        $(document).on('scroll', setWidth);
        $(window).on('resize', function(){
            // Need to reset the Max attr
            max = getMax();
            setWidth();
        });

    }
}

function onResize(){ //viewport has resize

    //on viewport resize
    $(window).resize(function(){

        //certain inline styles are applied onScroll in specific viewport sizes so we clear them here
        $('#masthead-container').attr('style','');
    });

}

function onScroll(){ //show/hide masthead on scrolling down/up

    var didScroll = false;
    var lastScrollTop = 0;
    var delta = 5;
    var firedNewsletterPromo = 0; //INIT NEWSLETTER FIRED-TRIGGER
    var firedNotificationsPromo = 0; //INIT NOTIFICATIONS FIRED-TRIGGER


    if($('body.home').length>0){
        var navbarHeight = $("#masthead-container").outerHeight();
    }else{
        var navbarHeight = $("#masthead-wrapper").outerHeight();
    }

    // on scroll, let the interval function know the user has scrolled
    $(window).scroll(function(event){
        //console.info("Console: I am scrolling");
        didScroll = true;
    });

    // run hasScrolled() and reset didScroll status
    setInterval(function() {
        //console.info("didScroll @ top of interval: ", didScroll);
        if (didScroll) {
            hasScrolled();
            didScroll = false;
        }
        //console.log("didScroll @ bottom after scrolling: ", didScroll);
    }, 500);

    function hasScrolled() {
        var st = $(this).scrollTop();
        var mastHeight = $("#masthead-wrapper").css("height");
        var mastheadContainerHeight = $("#masthead-container").css("height");

        var windowWidth = $(window).outerWidth();

        //notifications checks
        var n_browser = navigator.browserInfo.browser;
        var n_os = navigator.osInfo.os;
        var pop_up_notif = false;
        var notificationsPopCookie = readCookie('notificationsScrollPop');

        if(notif_browser(n_browser) && notif_os(n_os) &&
            SITE_INFO['name'] == "politics" && (!$("body").hasClass("home") && !$("body").hasClass("welcome")) && !notificationsPopCookie){
            pop_up_notif = true;
        }else if(notif_browser(n_browser) && notif_os(n_os) && SITE_INFO['name'] == "politics"
            && $('#notif_banner_content').is(':visible')){
            notif_banner_enabled = true;
        } else if($('#large_notif_content').is(':visible') || SITE_INFO['name'] != 'politics'){
            notif_banner_enabled = false;
        }

        if(notif_banner_enabled == false){
            $('#large_notif_content').slideUp();
            $('#container').css('padding-top', '0px');
            $('#masthead-container').css('margin-top', 'inherit');
            $('.flex-viewport').css('margin-top', 'inherit');
            if(SITE_INFO['name'] == "politics" && notif_banner_enabled == true){
                switch_to_banner(windowWidth);
            }
        }

        //end notifications checks

        //if(Math.abs(lastScrollTop-st) <= delta) return;

        // If current position > last position AND scrolled past navbar...
        //console.log(st+' > '+navbarHeight);
        //if (st > lastScrollTop && st > navbarHeight){ EM: Original
        if (st > lastScrollTop && st > 1){

            //checks viewport vertical scroll percentage
            scrollPercentage = getScrollPercent();

            //IF SCROLLED PAST 50% AND WE HAVE NOT FIRED YET
            /*ORIGINAL CODE TO ONLY FIRE loadNewsletterPromo();
        if(scrollPercentage>35 && firedNewsletterPromo==0){
          //load newsletter promo
          //alert('scroll-percentage: '+scrollPercentage);
          firedNewsletterPromo=1; //SET FIRE TRIGGER OFF
          loadNewsletterPromo();

        }*/

            //M.B. SEE CHANGE LOG ON TOP FILE...
            /*if(scrollPercentage>25 && firedNotificationsPromo==0){
          //load notifications promo
          //alert('scroll-percentage: '+scrollPercentage);
          firedNotificationsPromo=1; //SET FIRE TRIGGER OFF
          // Make sure OS is Mac, Windows, Android or Linux
          // Make sure browser is chrome or firefox

          //if(pop_up_notif){
            //loadNotificationsPromo();
          //}else{
            var newsPopCookie = readCookie('newsletterScrollPop');
            if(!newsPopCookie && SITE_INFO['name'] != 'politics'){
              loadNewsletterPromo();
            }
          //}

        }*/

            // Scroll Down
            if( (windowWidth < 1180 && $( 'body.home' ).length) || !$( 'body.home' ).length || !$("body.polls").length ){
                $("#masthead-wrapper").removeClass("nav-down").addClass("nav-up");
            }

            if( $("body.polls").length ){

                $("#masthead-wrapper").removeClass("nav-up");
                $("#masthead-wrapper").removeClass("nav-down");
                $("#masthead-wrapper").css({"position" : "static !important"});
                $("#container").css({"padding-top" : "0 !important"});
                $("body").css({"margin" : "0 !important"});

                /*if( $("#masthead-wrapper").hasClass("nav-down") ){

                  $("#masthead-wrapper").mouseleave(function(){
                        setTimeout(function(){
                          $("#masthead-wrapper").removeClass("nav-down").addClass("nav-up");
                      }, 2000);
                    });

                  //if( $("#masthead-wrapper").not(":hover") ){
                      /*setTimeout(function(){
                          $("#masthead-wrapper").removeClass("nav-down").addClass("nav-up");
                      }, 2000); */
                //}

                //}

            }


            $("#masthead-wrapper").css({ "box-shadow" : "none" });


            /*if( windowWidth < 768 && st>navbarHeight){
          $("#masthead-container").removeClass("nav-down").addClass("nav-up").css("position","fixed");
        }*/

            if( windowWidth < 768 && !$( 'body.polls' ).length ){
                $("#masthead-container").removeClass("nav-down").addClass("nav-up").css("position","fixed");
            }


            $("#masthead-container").css({ "box-shadow" : "none" });


            $(".progress-bar").css({ "position" : "relative", "top" : "8px" });

            if( mastHeight == "54px" ){
                $("progress").css({ "position" : "relative", "top" : "-11px" });
            }

            if( mastHeight == "166px" && windowWidth <= 1280 ){
                $("progress").css({ "position" : "relative", "top" : "-14px" });
            }

            if( windowWidth >= 768 || windowWidth <= 1024 ){
                $(".progress-bar").css({ "position" : "fixed", "top" : "0" });
            }


            if(!$("body.polls").length){
                if(notif_banner_enabled){
                    $('#masthead-container').css('margin-top', '35px');
                    $('.flex-viewport').css('margin-top', '35px');
                    //to push the menu down on inner pages
                    if(!$("body").hasClass("home") && $('#large_notif_wrapper').is(':visible')){
                        $('#large_notif_wrapper').css('top', '0');
                        $('#masthead-wrapper').css('top', '35px');
                        $('#container').css('padding-top', '45px');
                        if($('#masthead-wrapper').hasClass('nav-down')){
                            if(windowWidth < 768){
                                $('.progress-bar').css('top', '89px');
                            }else{
                                $('.progress-bar').css('top', '110px');
                            }
                        }else{
                            $('.progress-bar').css('top', '35px');
                        }
                    }
                }else{
                    $('#masthead-container').css('margin-top', 'inherit');
                    $('.flex-viewport').css('margin-top', 'inherit');
                    $('#masthead-wrapper').css('top', '0');
                    $('#container').css('padding-top', '10px');
                }
            }

        } else {

            // Scroll Up
            // If did not scroll past the document (possible on mac)...

            if(st + $(window).height() < $(document).height()) {

                // doing a do while so it can break out early in the first if check
                do{

                    /**
                     * this is for distro scale on mobile to not show the mast head unless the user has scrolled to the top
                     * This will apply to all pages and ignore all other rules below
                     */
                    if( SITE_NAME == 'politics' && $(window).width() < 768  && window.pageYOffset > 100){
                        $("#masthead-container").removeClass("nav-down").addClass("nav-up");
                        break;
                    }

                    if( (windowWidth < 1180 && $( 'body.home' ).length) || !$( 'body.home' ).length || !$("body.polls").length ){
                        $("#masthead-wrapper").removeClass("nav-up").addClass("nav-down");
                    }

                    if( $("body.polls").length ){

                        $("#masthead-wrapper").removeClass("nav-up");
                        $("#masthead-wrapper").removeClass("nav-down");
                        $("#masthead-wrapper").css({"position" : "static !important"});
                        $("#container").css({"padding-top" : "0 !important"});
                        $("body").css({"margin" : "0 !important"});

                        /*if( $("#masthead-wrapper").hasClass("nav-down") ){

                    $("#masthead-wrapper").mouseleave(function(){
                            setTimeout(function(){
                            $("#masthead-wrapper").removeClass("nav-down").addClass("nav-up");
                        }, 2000);
                        });

                    //if( $("#masthead-wrapper").not(":hover") ){
                        /*setTimeout(function(){
                            $("#masthead-wrapper").removeClass("nav-down").addClass("nav-up");
                        }, 2000); */
                        //}

                        //}

                    }

                    /*if( windowWidth < 1024 ){
                $("#masthead-container").removeClass("nav-up").addClass("nav-down");

                if( st<navbarHeight){ //GOING BACK UP IF WE PASS THE AD WE PUT THE MASTHEAD IN STARTING POSITION BELOW THE HEADER
                $("#masthead-container").css("position","inherit");
                }
            }*/

                    if( windowWidth < 768 && !$( 'body.polls' ).length ){
                        $("#masthead-container").removeClass("nav-up").addClass("nav-down");
                        //if( st<navbarHeight){
                        $("#masthead-container").css("position","fixed");
                        //}
                    }

                    $(".progress-bar").css({ "position" : "relative", "top" : "15px" });

                    if( windowWidth >= 768){
                        $(".progress-bar").css({ "position" : "fixed", "top" : "73px" });
                    }

                    if( windowWidth < 768){
                        if( SITE_INFO['name'] == "investigations" ){
                            $(".progress-bar").css({ "position" : "fixed", "top" : "42px" });
                        }else{
                            $(".progress-bar").css({ "position" : "fixed", "top" : "54px" });
                        }
                    }

                    if(!$("body.polls").length){
                        if(notif_banner_enabled){
                            $('#masthead-container').css('margin-top', '35px');
                            $('.flex-viewport').css('margin-top', '35px');
                            //to push the menu down on inner pages
                            if(!$("body").hasClass("home") && $('#large_notif_wrapper').is(':visible')){
                                $('#large_notif_wrapper').css('top', '0');
                                $('#masthead-wrapper').css('top', '35px');
                                $('#container').css('padding-top', '45px');
                                if($('#masthead-wrapper').hasClass('nav-down')){
                                    if(windowWidth < 768){
                                        $('.progress-bar').css('top', '89px');
                                    }else{
                                        $('.progress-bar').css('top', '110px');
                                    }
                                }else{
                                    $('.progress-bar').css('top', '35px');
                                }
                            }
                        }else{
                            $('#masthead-container').css('margin-top', 'inherit');
                            $('.flex-viewport').css('margin-top', 'inherit');
                            $('#masthead-wrapper').css('top', '0');
                            // $('#container').css('padding-top', '10px');
                        }
                    }

                    //alert( mastHeight );
                    if( mastHeight == "54px" ){
                        $("#masthead-wrapper").css({ "box-shadow" : "none" });
                        $("progress").css({ "position" : "relative", "top" : "-16px" });
                    }else{

                        // Removed per Ivan
                        // $("#masthead-wrapper").css({ "box-shadow" : "0px 8px 5px -5px "+SITE_INFO['site_color'] });
                    }

                    if( mastheadContainerHeight == "54px" ){
                        $("#masthead-container").css({ "box-shadow" : "none" });
                        $("progress").css({ "position" : "relative", "top" : "-16px" });
                    }

                // purposely break out so it never loops but we can still exit the if statement early above
                }while(false);

            }

            if(st < 135){  //height of masthead-wrapper + pageheader div - clears shadow smoothly
                $("#masthead-wrapper").css({ "box-shadow" : "none" });
            }

        }

        lastScrollTop = st;
        didScroll = false;
    }
}

function getScrollPercent() {
    var h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    return h[st]||b[st] / ((h[sh]||b[sh]) - h.clientHeight) * 100;
}

function notif_browser(browser){
    if(browser == 'Firefox' || browser == 'Chrome' || browser == 'Opera'){
        return true;
    }else{
        return false;
    }
}

function notif_os(OS){
    if(OS == 'Linux' || OS == 'Mac OS X' || OS == 'Mac OS' || OS.charAt(0) == 'W' || OS == 'Android'){
        return true;
    }else{
        return false;
    }
}

function shareSelected(){
    var savedText = null; // Variable to save the text

    function saveSelection() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }

    function restoreSelection(range) {
        if (range) {
            if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (ddocument.selection && range.select) {
                range.select();
            }
        }
    }

    var btnWrap = document.getElementById('share-button'),
        btnShare = btnWrap.children[0];

    document.onmouseup = function(e) {

        savedText = saveSelection(); // Save selection on mouse-up

        //alert(savedText);

        setTimeout(function() {

            var isEmpty = savedText.toString().length === 0; // Check selection text length

            // set sharing button position
            //if( savedText.toString().length > 45 ){
            btnWrap.style.top = (isEmpty ? -9999 : e.pageY) + 'px';
            btnWrap.style.left = (isEmpty ? -9999 : e.pageX) + 'px';
            //}

        }, 10);

    };

    btnShare.onmousedown = function(e) {

        if (!savedText) return;

        //window.open('http://firefox.com/');
        window.open('https://twitter.com/intent/tweet?text=' + savedText, 'shareWindow', 'width=300,height=150,top=50,left=50'); // Insert the selected text into sharing URL
        restoreSelection(savedText); // select back the old selected text

        // hide if we are done
        setTimeout(function() {
            btnWrap.style.top = '-9999px';
            btnWrap.style.left = '-9999px';
        }, 1000);

        return false;

    };
}

function showMobileSearch(){
    $( ".site-search-mobile" ).click(function(){
        $( ".site-search.mobile" ).toggle();
        $( ".site-search-mobile" ).hide();
    });
}

function goToByScroll(id){
    // Reove "link" from the ID
    id = id.replace("link", "");

    var offset;
    var navPointer;
    function getNav(){
        navPointer = $("#masthead-container").attr("class");

        if( navPointer === "nav-down" ){ //scrolling down
            if( id === "top" ){
                offset = 30;
            }else{
                offset = 50;
            }
        }else if( navPointer === "nav-up" ){
            if( id === "top" ){
                offset = 174;
            }else{
                offset = 104;
            }
        }else{
            offset = 0;
        }
    }
    //the use of timeout gets more accurate value of offset to use - allows scrolling to wind down before calculating
    setTimeout(getNav(), 4000);
    //set offset to control scroll stop point - home page only
    if( $("body.home").length > 0 ){
        // Scroll
        $('html,body').animate({
                scrollTop: $("#"+id).offset().top-offset},
            'slow');
    }else{
        // Scroll
        $('html,body').animate({
                scrollTop: $("#"+id).offset().top},
            'slow');
    }

}

//SITE SEARCH
function siteSearch(){
    if( $('body.home').length>0 ){
        $( ".home-search #searchBox" ).keypress(function(e) {
            if(e.which == 13) {
                e.stopPropagation();
                e.preventDefault();
                searchText = ($(this).val());
                if(searchText == ''){
                    return;
                }
                searchText = searchText.replace(" ", "+");
                window.location = SITE_INFO['global_site_url']+'/search/?q=' + searchText + '';
                $(this).val('');
                return false;
            }
        });
    }else{
        $( "#searchBox" ).keypress(function(e) {
            if(e.which == 13) {
                e.stopPropagation();
                e.preventDefault();
                searchText = ($(this).val());
                if(searchText == ''){
                    return;
                }
                searchText = searchText.replace(" ", "+");
                window.location = SITE_INFO['global_site_url']+'/search/?q=' + searchText + '';
                $(this).val('');
                return false;
            }
        });
    }
}

function convertImgUrl(url, target) {
    //Changes image url to an alternate resolution image
    var a = document.createElement('a');
    //If 'target' argument has no value or is zero, the new url will not have _N_ at the end (where N is a number).
    var new_res = typeof target === 'undefined' || target == 0 ? '' : '_'+target+'_';
    a.href = url;
    if(a.pathname.match(/\/(\d+)_([12345])_.(jpg|png|gif)/g)) {
        url = window.location.protocol+'//' + a.hostname + a.pathname.replace(/_[12345]_/g, new_res);
    }
    a.remove();
    return url;
}

function upgradeImagesByDisplaySize() {
    var images = document.getElementsByTagName('img');
    for(var i=0; i<images.length; i++) {
        var alt_src = images[i].attributes['data-src'] || false;
        if(alt_src && window.matchMedia('screen and (min-width:400px)').matches) {
            //If there is an alternate (larger) image,
            //  and alt is different from the original src
            //  and the screen is >= 400px
            images[i].src = alt_src.value;
        }
    }
}






//RCP GOOGLE SURVEY BEACON POST-MESSAGE
if (window.addEventListener) {
    window.addEventListener("message", onMessage, false);
}
else if (window.attachEvent) {
    window.attachEvent("onmessage", onMessage, false);
}

function onMessage(event) {

    // Check sender origin to be trusted
    //comment out when testing from DFP
    if (event.origin !== "https://tpc.googlesyndication.com") return;

    var data = event.data;

    if (typeof(window[data.func]) == "function") {
        window[data.func].call(null, data.message,event.origin);
    }

}

// Function to be called from iframe
function trackGoogleExposedSegment(message,origin) {


    //impression hit notice
    var data = {
        'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
        'ge_action' : 'Hit',
        'ge_label' : '1'
    };
    send_ga_event(data);



    beacon = readCookie("rcp_google_beacon_1019");

    if(beacon){ //EXISTS

        cookie_arr = beacon.split("|");
        user_id = cookie_arr[0];
        user_seen_ad = cookie_arr[1];
        num_exposures = cookie_arr[3]; //number of ad views

        if(user_seen_ad != '2'){ //known user, Flag as exposed

            //array -> user_id|status|timestamp|numexposures
            createCookie("rcp_google_beacon_1019",user_id+"|2|"+Date.now()+"|1",365); //resets cookie to exposed status

            var data = {
                'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
                'ge_action' : 'Hit',
                'ge_label' : '2'
            };

            send_ga_event(data); 

        }else if(user_seen_ad=='2'){

            if(typeof(num_exposures) != 'undefined'){ //make sure we have a num
                num_exposures = parseInt(num_exposures) + 1;

                //array -> user_id|status|timestamp|numexposures
                createCookie("rcp_google_beacon_1019",user_id+"|2|"+Date.now()+"|"+num_exposures,365); //resets cookie to exposed status

                var data = {
                    'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
                    'ge_action' : 'Hit',
                    'ge_label' : '3'
                };

                send_ga_event(data);

            }


        }

    }

}


/**
 * Triggers a customizable modal
 * @param  object userOpts object to override the default settings
 * @return object returns the object used to make the modal and interact with it
 */
function rcTriggerModal(userOpts){

    userOpts = userOpts || {};

    var container_selector = '#promo-modal-container';

    var opts = {
        heading: 'Promo Notification',
        body_content:
            '<h3>This is a attention grabbing heading.</h3>'+
            '<p>Paragraph content here.</p>'+
            '<p>More content <button type="button" >button</button></p>',
        footer_btns: '',
        custom_id: 'customizable-as-you-see-fit',
        container_selector: container_selector,
        close_modal: function(){

            $(this.container_selector).hide();

            if( this.on_close !== null ){
                this.on_close();
            }
        },
        /**
         * On close hook
         */
        on_close: null,
    };

    $.extend(opts, userOpts);

    var container = '<div id="promo-modal-container" class="promo-modal-body-container"></div>';

    if( !document.getElementById('promo-modal-container') ){
        $('body').append(container);
    }

    var coreTemplate =
        '<div id="'+opts.custom_id+'" class="promo-modal-wrapper">'+
        '<div class="promo-modal-content">'+
        '<div class="promo-modal-head">'+
        opts.heading+
        '<div class="close-promo-modal"></div>'+
        '</div>'+
        '<div class="promo-modal-body">'+
        opts.body_content+
        '</div>'+
        '<div class="promo-modal-footer">'+
        opts.footer_btns+
        '</div>'+
        '</div>'+
        '</div>';

    $(container_selector).html(coreTemplate);

    $(container_selector).show();

    $(container_selector).on('click', '.close-promo-modal', function(){

        opts.close_modal();
    });

    return opts;
}

function insert_tracking_admiral()
{
    if(SITE_INFO.admiral_id !== ''){
        admiral_id = SITE_INFO.admiral_id;
        $script = '<script type="text/javascript">!(function(o,n,t){t=o.createElement(n),o=o.getElementsByTagName(n)[0],t.async=1,t.src="https://steadfastsound.com/v2/0/'+ admiral_id +'",o.parentNode.insertBefore(t,o)})(document,"script"),(function(o,n){o[n]=o[n]||function(){(o[n].q=o[n].q||[]).push(arguments)}})(window,"admiral");!(function(n,e,r,t){function o(){if((function o(t){try{return(t=localStorage.getItem("v4ac1eiZr0"))&&0<t.split(",")[4]}catch(n){}return!1})()){var t=n[e].pubads();typeof t.setTargeting===r&&t.setTargeting("admiral-engaged","true")}}(t=n[e]=n[e]||{}).cmd=t.cmd||[],typeof t.pubads===r?o():typeof t.cmd.unshift===r?t.cmd.unshift(o):t.cmd.push(o)})(window,"googletag","function");;;;;</script>';

        $($script).appendTo('head');
    }else{
        console.log('was not able to append admiral to head');
    }

}

/**
 * Returns an array of random numbers based on the limit passed
 */
function getRandomNumbers(num, randLimit)
{
    if(num > randLimit){
        throw new Error("num value must be less or equal to randLimit");
    }

    var numbers = [];

    for (var i = 0; i < num; i++) {
    
        var unique = false;

        do{

            var rand = Math.floor(Math.random() * randLimit) +1;
            var index = numbers.map(function(x){ return x; }).indexOf(rand);

            if(index == -1){
                numbers.push(rand);
                unique = true;
            }

        }while(unique == false);

    }

    return numbers;
}

/**
 * Return a random set of featured fact checks 
 */
function getRandomFeaturedFactChecks(numToGrab, fcs)
{
    var numbers = getRandomNumbers(numToGrab, fcs.length);
    
    var random = [];
  
    for (var i = 0; i < numbers.length; i++) {

        var index = numbers[i] - 1;
  
        if( fcs[index] ){
            random.push(fcs[index]);
        }
      
    }

    return random;
}

/*Loads Insticator widget on Science
* Locations: Home, Articles index, article, Video
* */
function load_insticator(){

    // Used to prevent breaking on IE
    if(!window.IntersectionObserver){
        return;
    }

    if(evolok_init_finished) {

        if(!evolok_do_ads && (readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1) ) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }

    if( (siteName == 'science' ) &&
        ( $('body').hasClass('home') || $('body').hasClass('article') || $('body').hasClass('video') ) ) {

        if($('#insticator-ad-wrapper').length == 0){
            return;
        }

        var instigator_loaded = false;
        var statusBox = document.getElementById("insticator-ad-wrapper");
        var observer = new IntersectionObserver(handler);

        observer.observe(statusBox);

        function handler(entries, observer) {
            for (entry in entries) {
                if (entries[entry].isIntersecting) {
                    if(!instigator_loaded){
                        load_observer_insticator();
                        stop_listening();
                    }
                }
            }
        }

        function stop_listening(){
            console.log('stop listening');
            observer.unobserve(document.getElementById("insticator-ad-wrapper"));
        }

        function load_observer_insticator(){
            if(instigator_loaded){
                return;
            }

            (function (a, c, s, u){'Insticator'in a || (a.Insticator={ad:{loadAd: function (b){Insticator.ad.q.push(b)}, q: []}, helper:{}, embed:{}, version: "4.0", q: [], load: function (t, o){Insticator.q.push({t: t, o: o})}}); var b=c.createElement(s); b.src=u; b.async=!0; var d=c.getElementsByTagName(s)[0]; d.parentNode.insertBefore(b, d)})(window, document, 'script', '//d3lcz8vpax4lo2.cloudfront.net/ads-code/697d3ca0-daa5-4ba9-8579-49bcbab41773.js');

            if($('body').hasClass('home')){
                Insticator.ad.loadAd("div-insticator-ad-1");
                $('#div-insticator-ad-1').css('height', '280px');
                Insticator.ad.loadAd("div-insticator-ad-2");
                console.log('Insticator-loaded - Home');
            } else {
                Insticator.ad.loadAd("div-insticator-ad-3");
                $('#div-insticator-ad-3').css('height', '280px');
                Insticator.ad.loadAd("div-insticator-ad-4");
                console.log('Insticator-loaded - Inner');
            }

            Insticator.load("em", {id: "fa650b51-8c4e-432d-9bd1-eca8d48b39ab"});
            //stop loading the script
            instigator_loaded = true;

        }

    }
}

$(document).ready(function(){
    notify_unconfirmed_subscription_users();
});

/*Notifies unconfirmed subscriber */
function notify_unconfirmed_subscription_users(){
    if(readCookie('unconfirmed_user')){

        if(readCookie('unconfirmed_user_notified')){
            console.log('we have already notified user');
        }else{
            //check if he has already confirm
            var rcmg_purchase_token = readCookie('rcmg_purchase_token');
            data = {
                'site' : siteName,
                'rcmg_purchase_token' : rcmg_purchase_token,
            };

            rcmg_api_call('verify_unconfirmed_subscription', data, function(response) {

                if(response.success){

                    if(response.data.user_info.user_status == 1){ // user has already confirm no need to show modal remove cookie

                        deleteCookie('unconfirmed_user');
                        deleteCookie('unconfirmed_user_notified');
                        return;

                    }else{

                        //show modal
                        if(typeof Tempshow !== 'undefined' ) {

                            var tempshow = new Tempshow;

                            tempshow.create({
                                msg: `<p>
                                We noticed you purchased a subscription at some point but have not yet activated the account. Please confirm the email address used to purchase. This will allow you to enjoy an ad-free experience. <br /> <a href="javascript:void(0)" class="resend-confirmation-email">Resend Confirmation Email</a>
                                <div id="passform">
                                    <hr>
                                    <div class="pass-submitted">
                                        <p>Your password has been added to your account.</p>
                                    </div>
                                    <div class="pass-error">
                                        <p>There was an error adding the password to your account.<br>Please try again later or contact us <a href="https://${document.domain}/contact.html">here.</a></p>
                                    </div>
                                    <div class="no-pass">
                                        <p>Your account doesn't have a password. You can create a password below.</p>
                                    </div>
                                    <div id="enter_password">
                                        <input type="password" name="password" class="password" placeholder="Password" required>
                                        <input type="password" name="confirm_password" class="confirm_password" placeholder="Confirm Password" required>
                                        <span class="notice">Passwords Don't Match</span>
                                        <button disabled id="submit_button">Submit</button>
                                    </div>
                                    <div class="pass-entry">
                                        <div class="loading"></div>
                                    </div>
                                </div>
                                </p>`,
                                type: 'unconfirmed_notif',
                                seconds: 200,
                                vertical: 'center',
                                horizontal: 'center',
                                width: '500px'
                            });

                        }

                        //hide the password form if the user doesn't have a password
                        if(readCookie('user_no_pass') == 0){
                            $('#passform').hide();
                        } else {
                            $('.pass-submitted').hide();
                            $('.pass-error').hide();
                            $('#enter_password .notice').hide();

                            function validatePassword(){
                                var password = document.querySelector('#enter_password .password');
                                var confirm_password = document.querySelector('#enter_password .confirm_password');
                        
                                console.log("validating password");
                                if(password.value != confirm_password.value) {
                                    document.querySelector('#submit_button').disabled = true;
                                    $('#enter_password .notice').show();
                                } else {
                                    document.querySelector('#submit_button').disabled = false;
                                    $('#enter_password .notice').hide();
                                }
                            }

                            $('#enter_password .password').on('change', function() {
                                validatePassword();
                            });
                        
                            $('#enter_password .confirm_password').on('keyup', function() {
                                validatePassword();
                            })

                            $('#enter_password #submit_button').on('click',function() {
                                $('.pass-entry .loading').show();
                                $('#enter_password').hide();
                                $('.no-pass').hide();
                                
                        
                                rcmg_api_call('purchase_password', {
                                    password           : $('#enter_password .password').val(),
                                    confirm_password   : $('#enter_password .confirm_password').val(),
                                    purchase_token : readCookie('rcmg_purchase_token')
                                }, (response) => {
                                    if(!response.success) {
                                        $('.pass-error').text(response.messages[0].message);
                                        $('.pass-error').show();
                                        $('#enter_password').show();
                                        $('#enter_password .password').val("")
                                        $('#enter_password .confirm_password').val("")
                                        $('.no-pass').hide();
                                        $('.pass-entry .loading').hide();

                                        document.querySelector('#submit_button').disabled = true;
                                    } else {
                                        $('.pass-submitted').show();
                                        $('.no-pass').hide();
                                        $('.pass-entry .loading').hide();
                                        $('.pass-error').hide();

                                        // delete the no pass cookie
                                        deleteCookie('user_no_pass');
                                    }
                                });
                            });
                        }

                        //api click envent and logic for resending email
                        $(document).on('click', '.resend-confirmation-email', function(e){
                            e.preventDefault();

                            if( $('.resend-confirmation-email').find('div.loading').length == 1 ){
                                //prevents users from clicking multiple times amd making multiple request
                                return;
                            }

                            $('.resend-confirmation-email').html('<div class="loading" ><img alt="loading" style="height:20px" src="/asset/img/ajax-grey-sm.gif" /></div>');

                            //event handler for resend-confirmation-email
                            var rcmg_purchase_token = readCookie('rcmg_purchase_token');



                            if(rcmg_purchase_token){
                                data = {
                                    'site' : siteName,
                                    'rcmg_purchase_token' : rcmg_purchase_token,
                                };

                                rcmg_api_call('resend_confirmation_email_to_unconfirmed_subscriber', data, function(response){

                                    if(response.success){

                                        $('.type_unconfirmed_notif .msg p').text('We have successfully sent the email confirmation. Please check your inbox.').addClass('success');

                                    }

                                });
                            }

                            //sending an google event
                            var data = {
                                'ge_action' : 'overlay shown',
                                'ge_category' : 'notices',
                                'ge_label' : 'Unconfirmed Subscription Popup',
                                'ge_noninteraction' : true
                            };

                            send_ga_event(data);

                        });//end of document.on.click

                        createCookie('unconfirmed_user_notified', true, 1);

                    }
                }
            });

        }
    }

}


function log_active_user(){

  if( typeof getCookie == 'function' ){

    if(!getCookie('daily_logged_in') && is_member_logged_in() == true ){
        //cookie has already expired ping util


        var data = {
            'is_ad_free' : parseInt(getCookie('evaf')),
            'rcmg_guid' : getCookie('rcmg_guid'),
            'site' : siteName
        };

        rcmg_api_call('daily_active_user', data , function(resp){

            if(resp.success){
                createDailyCookie('daily_logged_in', Date.now(), '/');
                console.log('daily user logged successfully');
            }

        } );

    }
  }else{
    return;
  }

}

function createDailyCookie(name, value, path){
    var expires = "";
    var date = new Date();
    var midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    expires = "; expires=" + midnight.toGMTString();

    if (!path) {
        path = "/";
    }
    document.cookie = name + "=" + value + expires + "; path=" + path;
}

function is_member_logged_in(){
    if( getCookie('rcmg_guid') ){
        return true;
    }
    return false;
}

function lazy_load_taboola_unit(selector, code) {

    var lazy_init_callback = function(){
        if( window.$(selector).length > 0 && window.$(selector).inViewport(-300) ){
            code();
            $(window).off("scroll rezise", lazy_init_callback);
        }
    }

    $(window).on('scroll rezise', lazy_init_callback).scroll().resize();
}

function taboola_init() {

    if (typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if (evolok_init_finished) {

        if (!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }

    // Load Taboola script

    // if (siteName != 'politics') {
    //     return; // Skip since Taboola not launched on that site yet..
    // }



    // Load Taboola widgets depending on page

    if (siteName == 'politics') {

        if ($('body').hasClass('polls')) {
            window._taboola = window._taboola || [];
            _taboola.push({other:'auto'});
            get_taboola_loader();


            //loaded everywhere
            lazy_load_taboola_unit(

                '#taboola-mid-thumbnails',

                function() {
                    window._taboola = window._taboola || [];
                    _taboola.push({
                        mode: 'thumbnails-m',
                        container: 'taboola-mid-thumbnails',
                        placement: 'Mid Thumbnails',
                        target_type: 'mix'
                    });
                }
            );



            if (document.body.clientWidth >= 768 ) { // Desktop & Tablet

                lazy_load_taboola_unit(

                    '#taboola-right-rail---poll-pages',

                    function() {
                        window._taboola = window._taboola || [];
                        _taboola.push({
                            mode: 'thumbnails-rr-category',
                            container: 'taboola-right-rail---poll-pages',
                            placement: 'Right Rail - Poll Pages',
                            target_type: 'mix'
                        });
                    }
                );



            }

            if( $('body').attr('data-page') == 'latest_polls' ) {



            } else { // All poll pages except lastest polls

                
            }
        }
    }
}

/*Ad-flags */
var mgid_flags = {};
function load_mgid_units() {

    if (typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
        return;
    }

    if (evolok_init_finished) {

        if (!evolok_do_ads) {
            // Just skip and wait for next function call for a status change
            return;
        }
        // Otherwise go ahead and do ads
    }

    //Only for politics
    if (siteName == 'politics') {

        $url = "https://jsc.mgid.com/r/e/realclearpolitics.com.";

        //homepage
        if ($('body').hasClass('home')) {

            //On mobile it will be placed on top of Mixi on alpha
            //Desktop will be palced on gamma
            //<!-- Composite Start --> <div id="M478141ScriptRootC970897"> </div> <script src="https://jsc.mgid.com/r/e/realclearpolitics.com.970897.js" async></script> <!-- Composite End -->
            if (document.body.clientWidth < 768 ) {

                //Mobile: Above the From partners mixi widet on the alpha column
                if ( typeof mgid_flags.mobile_center_section == 'undefined') {

                    //$(window).off('scroll', load_mgid_units);
                    // $('.alpha .RC-AD-BOX-MOBILE_2 ').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');

                    // show on right column
                    $('.beta-container:not(.clone) .beta').append('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');

                    Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                    mgid_flags.mobile_center_section = 'loaded';
                }

            } else {

                //Desktop: Right Column Only
                //this is only going to trigger on desktop
                if(  typeof mgid_flags.hp_rc_slot  == 'undefined' ){

                    $('.beta .widget_slot:eq(3)').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');

                    Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                    mgid_flags.hp_rc_slot = 'loaded';
                }
            }

            //Left column widget
            if (  typeof mgid_flags.hp_lc == 'undefined' ) {
                //$(window).off('scroll', load_mgid_units);
                $('.gamma #most-read-box').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_id'] + '"></div>');

                Utils.load_script($url + SITE_INFO['mgid_hp_id'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }

            if(  typeof mgid_flags.hp_after_covid == 'undefined'){

                if($('.alpha #rclife_middle_script').length>0){ //covid table non-existent - we look for other option
                    $('.alpha #rclife_middle_script').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_after_covid'] + '"></div>');
                }else{
                    $('.alpha .list-view .spot-box').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_hp_after_covid'] + '"></div>');
                }
                

                Utils.load_script($url + SITE_INFO['mgid_hp_after_covid'] + ".js");
                mgid_flags.hp_after_covid = 'loaded';
            }



            /*
                Lazyloaded sisabled
            if(Object.keys(mgid_flags).length == 3){
                $(window).off('scroll', load_mgid_units);
            }*/


        }
        //polls  page
        // Disabled 10/10/2022 RROSE
        /*if ($('body').hasClass('polls')) {

            //Desktop
            //Location: Latest polls Page
            //After last table before the short news section only
            if ( typeof mgid_flags.polls_mc == 'undefined') {
                $('.alpha #short_news').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_polls_id'] + '"></div>');

                Utils.load_script($url + SITE_INFO['mgid_polls_id'] + ".js");
                mgid_flags.polls_mc = 'loaded';
            }

            //right column widgtet
            if(  typeof mgid_flags.polls_rc == 'undefined' ){

                $('.beta .widget_slot:eq(3)').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_polls_rc'] + '"></div>');

                Utils.load_script($url + SITE_INFO['mgid_polls_rc'] + ".js");
                mgid_flags.polls_rc = 'loaded';
            }
            //after the second polling data table only if its not latest poll page
            if(  typeof mgid_flags.after_second_data_table == 'undefined' && $('body').attr('data-page') !== 'latest_polls'){

                $('.alpha .RC-AD-BOTTOM-BANNER').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_polls_id'] + '"></div>');

                Utils.load_script($url + SITE_INFO['mgid_polls_id'] + ".js");
                mgid_flags.after_second_data_table = 'loaded';
            }


             if(  typeof mgid_flags.polls_carousel == 'undefined'  && $('body').attr('data-page') !== 'latest_polls'){

                $('.alpha .distro-with-ad').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_polls_carousel'] + '"></div>');

                Utils.load_script($url + SITE_INFO['mgid_polls_carousel'] + ".js");
                mgid_flags.polls_carousel = 'loaded';
            }
        }*/

        //article
        if($('body').hasClass('article') && !$('body').hasClass('rcor') ){ //removing ads from Realclearopinion reserach pieces
        
          //Mobile
          //After the comments 
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {
            
              $('.alpha #comments-container').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';
            
            }else{
            
              //Desktop or window larger then 768px will load on the right column
              if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                $('.beta .RC-AD-BOX-TOP').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.beta_rc_top = 'loaded';

              }
            
            }

            

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    $('.alpha-long .comments-wrapper').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }

            //if all the ad placements have been placed in the page then at this time we will remove the event handler
            /*if(Object.keys(mgid_flags).length == 4){
                console.log('offf');
                $(window).off('scroll', load_mgid_units);
            }*/

        }

        if($('body').hasClass('video-perma')){

            if( typeof mgid_flags.video_bc == 'undefined'){

                $('.alpha .comments-wrapper').before('<div id="M478141ScriptRootC' + SITE_INFO['mgid_video'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video'] + ".js");
                mgid_flags.video_bc = 'loaded';

            }


            //Mobile
            //move it to the alpha column
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_video == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                mgid_flags.mobile_center_c_video = 'loaded';

            }else{
                //Desktop Widget
                if(  typeof mgid_flags.video_rc == 'undefined' ){

                    $('.beta .widget_slot:eq(2)').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');

                    Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                    mgid_flags.video_rc = 'loaded';
                }
            }

           /* if(Object.keys(mgid_flags).length == 2){
                $(window).off('scroll', load_mgid_units);
            }*/
        }

        if($('body').hasClass('election')){
            //right side bar widget
            if( typeof mgid_flags.election_rc == 'undefined'){

                $('.beta .RC-AD-BOX-TOP').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js"); //widget id 977465
                mgid_flags.election_rc = 'loaded';
            }


            if( typeof mgid_flags.election_carousel == 'undefined'){

                $('.alpha .news_items').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_election_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_election_carousel'] + ".js"); //widget id 970915
                mgid_flags.election_carousel = 'loaded';
            }


            if( typeof mgid_flags.election_smart_widget == 'undefined'){

                $('.alpha #more_news').after('<div id="M478141ScriptRootC' + SITE_INFO['mgid_video'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video'] + ".js"); //widget id 970915
                mgid_flags.election_smart_widget = 'loaded';
            }





        }

    }

    if(siteName == 'science'){
        $url = 'https://jsc.mgid.com/r/e/realclearscience.com.';
        //Homepage only
        if($('body').hasClass('home')){
            //<!-- Composite Start --> <div id="M440576ScriptRootC992065"> </div> <script src="https://jsc.mgid.com/r/e/realclearscience.com.992065.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.science_carousell == 'undefined'){

                $('.alpha #insticator-ad-wrapper').after('<div class="line"></div><div id="M440576ScriptRootC' + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.science_carousell = 'loaded';

            }

            //Left column widget
            if(typeof mgid_flags.science_hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.science_hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.science_hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="M440576ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.science_hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if($('.beta .widget_slot:eq(2)').length > 0) {

                        $('.beta .widget_slot:eq(2)').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load in the comments section
            if(typeof mgid_flags.comments_section == 'undefined'){

                $('.alpha #comments-container').append('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.comments_section = 'loaded';
            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="M440576ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }

        if($('body').hasClass('video-perma')){

            if( typeof mgid_flags.video_bc == 'undefined'){

                $('.alpha .bottom-banner').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_video'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video'] + ".js");
                mgid_flags.video_bc = 'loaded';

            }


            //Mobile
            //move it to the alpha column
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_video == 'undefined' ) {

                $('.alpha .bottom-banner').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                mgid_flags.mobile_center_c_video = 'loaded';

            }else{
                //Desktop Widget
                if(  typeof mgid_flags.video_rc == 'undefined' ){

                    $('.beta .widget_slot:eq(2)').after('<div id="M440576ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');

                    Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                    mgid_flags.video_rc = 'loaded';
                }
            }

        }
    }

    if(siteName == 'world'){
        $url = 'https://jsc.mgid.com/r/e/realclearworld.com.';
        //Homepage only
        if($('body').hasClass('home')){
            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.world_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="M498915ScriptRootC' + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.world_carousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.world_hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.world_hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.world_hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="M498915ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.world_hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if($('.beta .RC-AD-BOX-TOP').length > 0) {

                        $('.beta .RC-AD-BOX-TOP').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="M498915ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }

        if($('body').hasClass('video-perma')){

            if( typeof mgid_flags.video_bc == 'undefined'){

                $('.alpha .bottom-banner').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_video'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video'] + ".js");
                mgid_flags.video_bc = 'loaded';

            }


            //Mobile
            //move it to the alpha column
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_video == 'undefined' ) {

                $('.alpha .bottom-banner').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                mgid_flags.mobile_center_c_video = 'loaded';

            }else{
                //Desktop Widget
                if(  typeof mgid_flags.video_rc == 'undefined' ){

                    $('.beta .widget_slot:eq(2)').after('<div id="M498915ScriptRootC' + SITE_INFO['mgid_video_rc'] + '"></div>');

                    Utils.load_script($url + SITE_INFO['mgid_video_rc'] + ".js");
                    mgid_flags.video_rc = 'loaded';
                }
            }

        }

    }

    if(siteName == 'defense'){
        $url = 'https://jsc.mgid.com/r/e/realcleardefense.com.';
        //Homepage only
        if($('body').hasClass('home')){
            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.defense_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="M498918ScriptRootC' + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.defense_carousell = 'loaded';

            }

            //Left column widget
            if(typeof mgid_flags.defense_hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="M498918ScriptRootC' + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.defense_hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.defense_hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM').before('<div id="M498918ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.defense_hp_rc = 'loaded';
            }

        }


        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(3)').length > 0) {

                        $('.beta .widget_slot:eq(3)').before('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="M498918ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }




    }

    if(siteName == 'policy'){
        $url = 'https://jsc.mgid.com/r/e/realclearpolicy.com.';
        //Homepage only
        if($('body').hasClass('home')){
            //<!-- Composite Start --> <div id="M498914ScriptRootC991834"> </div> <script src="https://jsc.mgid.com/r/e/realclearpolicy.com.991834.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.policy_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="M498914ScriptRootC' + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.policy_carousell = 'loaded';

            }

            //Right Column
            if(typeof mgid_flags.policy_hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM').before('<div id="M498914ScriptRootC' + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.policy_hp_rc = 'loaded';
            }

        }


        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(3)').length > 0) {

                        $('.beta .widget_slot:eq(3)').before('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="M498914ScriptRootC' + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'history'){
        $url = 'https://jsc.mgid.com/r/e/realclearhistory.com.';
        var target_unit = 'M498922ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.history_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.history_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.history_hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.history_hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.history_hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.history_hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(3)').length > 0) {

                        $('.beta .widget_slot:eq(3)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'religion'){
        $url = 'https://jsc.mgid.com/r/e/realclearreligion.org.';
        var target_unit = 'M498919ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.hp_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.hp_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(3)').length > 0) {

                        $('.beta .widget_slot:eq(3)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'energy'){
        $url = 'https://jsc.mgid.com/r/e/realclearenergy.org.';
        var target_unit = 'M498917ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.hp_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.hp_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(3)').length > 0) {

                        $('.beta .widget_slot:eq(3)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                if( typeof $("#jsSite").attr("data-gaTag") !== 'undefined' && $("#jsSite").attr("data-gaTag") == 'API'){
                    return;
                }

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'education'){
        $url = 'https://jsc.mgid.com/r/e/realcleareducation.com.';
        var target_unit = 'M498920ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.hp_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.hp_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(2)').length > 0) {

                        $('.beta .widget_slot:eq(2)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'books'){
        $url = 'https://jsc.mgid.com/r/e/realclearbooks.com.';
        var target_unit = 'M498924ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.hp_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.hp_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(2)').length > 0) {

                        $('.beta .widget_slot:eq(2)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }


        }


    }

    if(siteName == 'health'){
        $url = 'https://jsc.mgid.com/r/e/realclearhealth.com.';
        var target_unit = 'M498916ScriptRootC';

        if($('body').hasClass('home')){

            //<!-- Composite Start --> <div id="M498915ScriptRootC991941"> </div> <script src="https://jsc.mgid.com/r/e/realclearworld.com.991941.js" async></script> <!-- Composite End -->
            if(typeof mgid_flags.hp_carousell == 'undefined'){

                $('.alpha .list-view #popular').before('<div class="line"></div><div id="' + target_unit + SITE_INFO['mgid_hp_carosell'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_carosell'] + ".js");
                mgid_flags.hp_crousell = 'loaded';

            }
            //Left column widget
            if(typeof mgid_flags.hp_lc == 'undefined'){

                $('.gamma #most-read-box').after('<div id="' + target_unit + SITE_INFO['mgid_hp_lc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_lc'] + ".js");
                mgid_flags.hp_lc = 'loaded';
            }
            //Right Column
            if(typeof mgid_flags.hp_rc == 'undefined'){

                $('.beta .RC-AD-BOX-BOTTOM-600').before('<div id="' + target_unit + SITE_INFO['mgid_hp_rc'] + '"></div>');
                Utils.load_script($url + SITE_INFO['mgid_hp_rc'] + ".js");
                mgid_flags.hp_rc = 'loaded';
            }

        }

        if($('body').hasClass('article')){

            //Mobile
            //After the comments
            if (document.body.clientWidth < 768 && typeof mgid_flags.mobile_center_c_article == 'undefined' ) {

                $('.alpha #comments-container').after('<div id="'+ target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                mgid_flags.mobile_center_c_article = 'loaded';

            }else{

                //Desktop or window larger then 768px will load on the right column
                if(  typeof mgid_flags.beta_rc_top == 'undefined' ) {

                    if( $('.beta .widget_slot:eq(2)').length > 0) {

                        $('.beta .widget_slot:eq(2)').before('<div id="' + target_unit + SITE_INFO['mgid_article_rc_id'] + '"></div>');
                        //load script for this unit
                        Utils.load_script($url + SITE_INFO['mgid_article_rc_id'] + ".js");
                        mgid_flags.beta_rc_top = 'loaded';
                    }
                }

            }

            //Will load after the fith paragraph
            if(  typeof mgid_flags.article_carousel == 'undefined'  ) {

                $('.article-body-text p').eq(5).after('<div id="' + target_unit + SITE_INFO['mgid_article_carousel'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_carousel'] + ".js");
                mgid_flags.article_carousel = 'loaded';

            }
            //Will load after the 12 paragraph
            if(  typeof mgid_flags.in_c_p12 == 'undefined'  ) {

                $('.article-body-text p').eq(12).after('<div id="' + target_unit + SITE_INFO['mgid_article_in_content_p12'] + '"></div>');
                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_in_content_p12'] + ".js");
                mgid_flags.in_c_p12 = 'loaded';

            }

            if( typeof mgid_flags.bf_comments == 'undefined'){

                if($('.alpha .comments-wrapper').length > 0 ){
                    //standard format
                    $('.alpha .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                }else{
                    //Long format
                    if($('.alpha-long .no-comments').length > 0){
                        $('.alpha-long .no-comments').after('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }else{
                        $('.alpha-long .comments-wrapper').before('<div id="' + target_unit + SITE_INFO['mgid_article_bf_comments'] + '"></div>');
                    }

                }

                //load script for this unit
                Utils.load_script($url + SITE_INFO['mgid_article_bf_comments'] + ".js");
                mgid_flags.bf_comments = 'loaded';

            }

        }

    }
    
}

function check_ios_app()
{
    // check if the user is using the ios app

    let userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test( userAgent),
    firefox = /firefox/.test( userAgent ),
    opera = /opera/.test( userAgent ),
    chrome = /chrome/.test( userAgent ),
    ios = /iphone|ipad/.test( userAgent );

    if (ios) {
        if (!safari && !firefox && !opera && !chrome) {
            // ios app
            $('.RC-AD').hide();
            $(".RC-AD-BOX-MIDDLE").parent().hide();
            
            all_ads_disabled = true;

            return true;
        }
    }

    return false;
}

$(window).scroll(function() {
    //we check if the user has purchased the ad-free version
    if( readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1 ) {
        $('[data-spotim-module=pitc]').hide();
    }
    var noAds = document.querySelector('[data-no-ads]');
    if(noAds){
        // $('[data-spotim-module=pitc]').hide();
        // $('[data-spotim-module=pitc]').css('display', 'none');
        $('[data-mini-ad-unit=true]').hide();
        $('[data-mini-ad-unit=true]').css('display', 'none');
    }
});

function mgid_init(){
    //We make a query selector to the data-no-ads class
    var noAds = document.querySelector('[data-no-ads]');
    //If the data target exists, we return
    if(noAds){
        $('.mixi_unit').remove();
        $('.mixi_unit').css('display', 'none');
        $('.fark-header').remove();
        $('.fark-header').css('display', 'none');
        return;
    }
    /**
     * Setting set from the cms to hide inline post/article mgid ads on certain posts
     */
    if(typeof NO_INLINE_ADS !== 'undefined' && NO_INLINE_ADS == true){
        console.log("EXITING MGID EARLY AS NO INLIINE ADS ALLOWED", NO_INLINE_ADS);
        return;
    }

    //for education SITE_INFO['name'] because siteName is set after function gets called

    if(siteName == 'politics' || siteName == 'science' || siteName == 'defense' || siteName == 'world' || siteName == 'policy' || siteName == 'history' || siteName == 'religion' || siteName == 'energy' || siteName == 'education' || siteName == 'books' || siteName == 'health' ) {

        if (Utils.get_query_param('mgid') == 1 || $('body').hasClass('article')) {

            var event_data = {
                'ge_action': 'articles enabled',
                'ge_category': 'MGID',
                'ge_label': 'article',
                'ge_noninteraction': true
            };
            send_ga_event(event_data);

            //$(window).on('scroll resize', load_mgid_units).scroll().resize();
            // will call the function to load
            load_mgid_units();

        } else if (Utils.get_query_param('mgid') == null) { //Math.random() < .25 &&

            //$(window).on('scroll resize', load_mgid_units).scroll().resize();
            console.log('MGID Loaded');

            var body_class = $('body').attr('class');
            var event_data = {
                'ge_action': 'enabled',
                'ge_category': 'MGID',
                'ge_label': body_class,
                'ge_noninteraction': true
            };

            send_ga_event(event_data);
            //Loads the units on the
            load_mgid_units();
        } else {

            var body_class = $('body').attr('class');
            var event_data = {
                'ge_action': 'disabled',
                'ge_category': 'MGID',
                'ge_label': body_class,
                'ge_noninteraction': true
            };

            send_ga_event(event_data);
        }
    }
}

/*social media skd*/
var fb_sdk =document.createElement('script');
fb_sdk.type='text/javascript';
fb_sdk.async=true;
fb_sdk.crossOrigin = 'anonymous';
fb_sdk.nonce = 'LyDJj0Y2'
fb_sdk.src='https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v10.0';
var fb_h=document.getElementsByTagName('script')[0];
fb_h.parentNode.insertBefore(fb_sdk,fb_h);

//TWITTER JS SDK
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");

/*
  Description: Loads jwplayer and plays a playlist specified in the script tag
   src url's query string.
  Browser/Devices: Any up to date browser except IE.
*/
(function() {

    var has_init_jw_player = false;

    // START APP
    window.start_jw_player_library = function(){

        if(has_init_jw_player){
            return;
        }

        has_init_jw_player = true;

        var div_id = 'jw_player_video_anchor';

        // check should load right away
        if( jw_player_can_load(div_id) ){
            loadLibrary(div_id);
        // or else trigger lazy loading
        }else{
            lazy_init_jw_player(div_id);
        }
    }

    // check if jw player should load
    function jw_player_can_load(selector){

        // on non-mobile load right away
        // UPDATE - now lazy on desktop too
        /*if( window.innerWidth >= 728 ){
            return true;
        }*/

        if( $('#'+selector) ) {
            // Find width of container, so you can calculate height based on 
            // assumed aspect ratio. Use half that height as offset when 
            // detecting if in viewport, so player doesn't load then instantly float.
            var offset = parseInt( ($('#'+selector).width() * 0.5625) / 2) + 1;

            if( $('#'+selector).inViewport(offset) ){
                return true;
            }
        }
        
        return false;
    }

    // listen for when the div becomes visible in viewport
    function lazy_init_jw_player(selector){

        var timeout_id = null;

        var lazy_init_callback = function(){

            clearTimeout(timeout_id);
            timeout_id = setTimeout(function(){
                
                if( jw_player_can_load(selector) ){
                    loadLibrary(selector);
                    $(window).off("scroll rezise", lazy_init_callback);
                    clearTimeout(timeout_id);
                }
            }, 100);
        }

        $(window).on('scroll rezise', lazy_init_callback).scroll().resize();
    }
  
    // UTILITY FUNCTIONS //
    function hasClass(el, className) {
        return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
    }
    
    function addClass(el, className) {
        if (el.classList) el.classList.add(className);
        else if (!hasClass(el, className)) el.className += ' ' + className;
    }
    
    function removeClass(el, className) {
        if (el.classList) el.classList.remove(className);
        else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
    }
  
    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
  
    // MAIN FUNCTIONS
  
    function loadLibrary(selector) {
  
        console.log("LOAD JW PLAYER LIBRARY");
  
        // Get URL of script tag
        // var scripts = document.querySelectorAll('script[src*="realclear_jw_widget_v2.js"]');
  
        // var myScript = scripts[scripts.length - 1];
  
        // Get id and auto|mute parameters from URL
        // var jw_id = getParameterByName("id", myScript.src);
  
        var anchor = document.getElementById(selector);
  
        if(!anchor){
            return;
        }
  
        var jw_id = anchor.dataset.id;
  
        // Write container for player
        var jw_div = "realclear_jwplayer_"+jw_id;
        var html = '\
            <style>\
                #realclear_jwplayer_container {\
                    position:relative;\
                    cursor:pointer;\
                }\
                #realclear_jwplayer_container .realclear_jwplayer_overlay {\
                    cursor:pointer;\
                    position:absolute;\
                    top:0;bottom:0;left:0;right:0;\
                }\
                #realclear_jwplayer_container.noclick .realclear_jwplayer_overlay {\
                    pointer-events:none;\
                }\
                #realclear_jwplayer_container .pause_play {\
                    position: absolute;\
                    bottom: 0px;\
                    left: 32px;\
                    padding: 10px;\
                    z-index: 10000;\
                }\
                #realclear_jwplayer_container .pause_play .inner{\
                    cursor: pointer;\
                    background: rgba(255,255,255, 0.5);\
                    width: 25px;\
                    height: 25px;\
                    border-radius: 25px;\
                    padding: 2px 0 0 2.4px;\
                }\
                #realclear_jwplayer_container .play .inner{\
                    padding: 2px 0 0 4px;\
                }\
                #realclear_jwplayer_container .pause_play:hover .inner {\
                    background: rgba(255,255,255, 1);\
                }\
                #realclear_jwplayer_container .audio {\
                    position: absolute;\
                    bottom: 0px;left: 0px;\
                    padding: 10px;\
                    z-index: 10000;\
                }\
                #realclear_jwplayer_container .audio .inner {\
                    cursor: pointer;\
                    background: rgba(255,255,255, 0.5);\
                    width: 25px;\
                    height: 25px;\
                    border-radius: 25px;\
                    padding: 2px 0 0 2px;\
                }\
                #realclear_jwplayer_container .audio:hover .inner {\
                    background: rgba(255,255,255, 1);\
                }\
                #realclear_jwplayer_container .audio img:not(.active) {\
                    display:none;\
                }\
                #realclear_jwplayer_container .close {\
                    position: absolute;\
                    top: -5px;right: -5px;\
                    padding: 10px;\
                    z-index: 10000;\
                }\
                #realclear_jwplayer_container .close .inner {\
                    cursor: pointer;\
                    background: rgba(255,255,255, 0.5);\
                    width: 25px;\
                    height: 25px;\
                    border-radius: 25px;\
                    padding: 5px 0 0 6px;\
                }\
                #realclear_jwplayer_container .close:hover .inner {\
                    background: rgba(255,255,255, 1);\
                }\
                #realclear_jwplayer_parent_1 {\
                    background:black;width:100%;\
                }\
                #realclear_jwplayer_parent_2 {\
                    margin:0 auto;width:100%;clear:both;overflow:hidden;\
                }\
            </style>\
            <div id="realclear_jwplayer_parent_1">\
                <div id="realclear_jwplayer_parent_2">\
                    <div id="realclear_jwplayer_container">\
                        <div id="'+jw_div+'"></div>\
                    </div>\
                </div>\
            </div>\
        ';
  
        if( $('#realclear_jwplayer_parent_1').length == 0 ){
            $(anchor).after(html);
        }
  
        // https://cdn.jwplayer.com/libraries/{key}.js
        var script = document.createElement('script');
        script.async = 1;
        script.src = "https://cdn.jwplayer.com/libraries/EAYoNgFe.js";
        script.onload = function() {
            setupPlayer(jw_div, jw_id);
        }
        document.head.appendChild(script);
    }
  
    function setupPlayer(jw_div, jw_id) {
  
        // [description_url], dynamic but doesn't seem to work.
        // So we'll populate this manually with the URI js detects.
        var jw_desc_url = "%5Bdescription_url%5D";
        jw_desc_url = encodeURI(window.location.href);

        window.jwplayer_hp_is_ad = false;

        // Get moat targetting so we can add it to cust_params
        var moat_cust_params = "";
        if(typeof window.moatPrebidApi != 'undefined') {
            var moat_targetting = window.moatPrebidApi.getMoatTargetingForPage();
            moat_cust_params = "%26"+encodeURIComponent(new URLSearchParams(moat_targetting).toString());
        }

        var cust_params = "";

        if( $('body').hasClass('home') || $('body').hasClass('polls')  ){ 
            cust_params = "&cust_params=site%3D__item-site__%26jwplayer_placement%3Dwidget_player"+moat_cust_params;
        }
  
        // Setup "chromeless" jwplayer
        var player = jwplayer(jw_div);
        var current_link_index = 0;

        player.setup({
            playlist:           "https://cdn.jwplayer.com/v2/playlists/"+jw_id,
            controls:           false,
            autostart:          true,
            mute:               true,
            nextUpDisplay:      false,
            repeat:             true,
            preload:            "auto",
            onclick:            "link",
            displaydescription: false,
            displaytitle:       false,
            //aspectratio:   "4:3",
            advertising: {
                client: "googima",
                //adscheduleid: "RV3tOnoJ", //test schedule setup on JWPlayer
                adscheduleid: "P3Te5eca", // Random 8-char alpha-num string
                schedule: [
                    {
                        tag: "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480|640x360|400x300|300x186&iu=/1004503/RC_video_preroll_640_by_480&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=%5Breferrer_url%5D&description_url="+jw_desc_url+"&correlator=%5Btimestamp%5D"+cust_params,
                        "offset": "pre",
                    },
                    {
                        tag: "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480|640x360|400x300|300x186&iu=/1004503/RC_video_preroll_640_by_480&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=%5Breferrer_url%5D&description_url="+jw_desc_url+"&correlator=%5Btimestamp%5D"+cust_params,
                        "offset": 30, // 30 seconds
                    },
                    {
                        tag: "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480|640x360|400x300|300x186&iu=/1004503/RC_video_preroll_640_by_480&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=%5Breferrer_url%5D&description_url="+jw_desc_url+"&correlator=%5Btimestamp%5D"+cust_params,
                        "offset": 60, // 60 seconds
                    }
                ],
                "bids": {
                    // Configure the ad partners
                    "bidders": [{
                        "id": "257907",
                        "name": "Spotx"
                        //"pubid": "{PUBLISHER_ID}"
                    }],
                    "settings": {
                        "mediationLayerAdServer": "dfp",
                        "floorPriceCents": 200,
                        "buckets": [{
                            "increment": 10,
                            "min": 2,
                            "max": 100
                        }],
                        "consentManagement": {
                            "gdpr": {
                                "cmpApi": "iab",
                                "rules": {
                                    "purpose": "basicAds",
                                    "enforcePurpose": true,
                                    "enforceVendor": true
                                },
                                "defaultGdprScope": true,
                                "timeout": 0 // GDPR timeout 0ms
                            },
                            "usp": {
                                "cmpApi": "iab",
                                "timeout": 0 // US Privacy timeout 0ms
                            }
                        }
                    }
                }                
            },
            floating: { // floating disabled so we can handle it manually
                mode: "never",
            },
        });
  
        var pause, play;
        player.on('ready', function(data) {
  
            createCookie("jw_player_shown_new", "1", 2, true);
  
            var on_dst_close_notifier_data = {
                'ge_action' : 'Called Tag',
                'ge_category' : 'JW Player',
                'ge_label' : 'Page: home',
                'ge_index' : null,
                'ge_noninteraction' : true
            };
        
            send_notifier_event(on_dst_close_notifier_data);
  
            // Implement overlay, audio control and close btn
  
            var container = document.querySelector('#realclear_jwplayer_container .jw-wrapper');
  
            var overlay_el = document.createElement('div');
            addClass(overlay_el, "realclear_jwplayer_overlay");
  
            var audio_el = document.createElement('div');
            addClass(audio_el, "audio");
            audio_el.innerHTML = '<div class="inner"><img class="muted active" src="/asset/img/jw_player/muted.png" width="20" alt="Muted" /><img class="unmuted" src="/asset/img/jw_player/unmuted.png" width="20" alt="Unmuted" /></div>';
  
            // Enable mute button
            audio_el.onclick = function(event) {
  
                event.stopPropagation();
                if( player.getMute() ) {
                    player.setMute(false);
                    removeClass(
                        document.querySelector('#realclear_jwplayer_container .audio .muted'), 
                        "active"
                    );
                    addClass(
                        document.querySelector('#realclear_jwplayer_container .audio .unmuted'), 
                        "active"
                    );
                } else {
                    player.setMute(true);
                    addClass(
                        document.querySelector('#realclear_jwplayer_container .audio .muted'), 
                        "active"
                    );
                    removeClass(
                        document.querySelector('#realclear_jwplayer_container .audio .unmuted'), 
                        "active"
                    );
                }
            };
  
            var close_el = document.createElement('div');
            addClass(close_el, "close");
            close_el.innerHTML = '<div class="inner"><img src="/asset/img/jw_player/close.png" width="14" alt="Close" /></div>';
  
            // Enable close button
            close_el.onclick = function(event) {
                event.stopPropagation();
                player.remove();
                createCookie("jw_player_close_button_clicked", "1", 2, true);
  
                var on_dst_close_notifier_data = {
                    'ge_action' : 'Close Player',
                    'ge_category' : 'JW Player',
                    'ge_label' : 'Page: home',
                    'ge_index' : null,
                    'ge_noninteraction' : false
                };
            
                send_notifier_event(on_dst_close_notifier_data);
            };

            pause = document.createElement('div');
            addClass(pause, "pause");
            addClass(pause, "pause_play");
            pause.innerHTML = '<div class="inner"><img src="/asset/img/jw_player/pause.png" width="20" alt="Pause" /></div>';

            pause.onclick = function() {
                var state = player.getState();
                console.log("STATE", state);

                player.pause();

                pause.style.display = 'none';
                play.style.display = 'block';

                var on_dst_close_notifier_data = {
                    'ge_action' : 'Pause Player',
                    'ge_category' : 'JW Player',
                    'ge_label' : 'Page: home',
                    'ge_index' : null,
                    'ge_noninteraction' : false
                };
            
                send_notifier_event(on_dst_close_notifier_data);
            };

            play = document.createElement('div');
            addClass(play, "play");
            addClass(play, "pause_play");
            play.innerHTML = '<div class="inner"><img src="/asset/img/jw_player/play2.png" width="20" alt="Play" /></div>';
            play.style.display = 'none';

            play.onclick = function() {
                var state = player.getState();
                console.log("STATE", state);

                player.play();
                play.style.display = 'none';
                pause.style.display = 'block';

                var on_dst_close_notifier_data = {
                    'ge_action' : 'Play Player',
                    'ge_category' : 'JW Player',
                    'ge_label' : 'Page: home',
                    'ge_index' : null,
                    'ge_noninteraction' : false
                };
            
                send_notifier_event(on_dst_close_notifier_data);
            };
  
            container.appendChild(overlay_el);
            container.appendChild(audio_el);
            container.appendChild(close_el);
            container.appendChild(pause);
            container.appendChild(play);
  
            // If inline video not 50% visible at least, float video.
            var observer = new IntersectionObserver(function(entries, observer) {
  
                for(var i = 0; i < entries.length; i++) {
                    if( entries[i].intersectionRatio < 0.5 ) {
                        // player.setConfig({
                        //     aspectratio: "4:3",
                        // });
                        player.setFloating(true);
                    } else {
                        // player.setConfig({
                        //     aspectratio: "16:9",
                        // });
                        player.setFloating(false);
                    }
                }
  
            }, {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            });
            observer.observe(document.querySelector('#realclear_jwplayer_container'));

            // Assign click function for overlay
            document.getElementById("realclear_jwplayer_container")
                .setAttribute(
                    "onclick", 
                    "window.jwplayer_hp_click(event);"
                );
  
        });
        // When playlist item changes, find video permalink URL and make clicks go to it.
        player.on('playlistItem', function(data){
  
            var link = get_link(data.item.description, 0);
            
            apply_link(link);
        });
        // When an ad starts, disable pointer events on overlay
        player.on('adBreakStart', function() {
            removeClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            addClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            window.jwplayer_hp_is_ad = true;
        });
        player.on('adStarted', function() {
            removeClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            addClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            window.jwplayer_hp_is_ad = true;
        });

        // When an ad ends, re-enabled pointer events on overlay
        player.on('adBreakEnd', function() {
            removeClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            window.jwplayer_hp_is_ad = false;
        });
        player.on('adComplete', function() {
            removeClass(document.getElementById("realclear_jwplayer_container"), "noclick");
            window.jwplayer_hp_is_ad = false;
        });

        /**
         * @see https://developer.jwplayer.com/jwplayer/docs/jw8-javascript-api-reference#jwplayeronadblock
         */
        player.on('adblock', function(){

            var on_dst_close_notifier_data = {
                'ge_action' : 'Adblock Detected',
                'ge_category' : 'JW Player',
                'ge_label' : 'Page: home',
                'ge_index' : null,
                'ge_noninteraction' : true,
            };

            send_notifier_event(on_dst_close_notifier_data);
        });

        /**
         * @see https://developer.jwplayer.com/jwplayer/docs/jw8-javascript-api-reference#jwplayeronadclick
         */
        player.on('adClick', function(event){

            var state = player.getState();
            console.log("ADCLICK", "STATE", state, 'event', event);
            
            play.style.display = 'block';
            pause.style.display = 'none';

            var on_dst_close_notifier_data = {
                'ge_action' : 'Ad Clicked',
                'ge_category' : 'JW Player',
                'ge_label' : 'Page: home',
                'ge_index' : null,
                'ge_noninteraction' : false,
            };

            send_notifier_event(on_dst_close_notifier_data);
        });

        player.on('adPause', function(event){

            var state = player.getState();
            console.log("AD PAUSE", "STATE", state, 'event', event);
            
            play.style.display = 'block';
            pause.style.display = 'none';
        });

        player.on('adPlay', function(event){

            var state = player.getState();
            console.log("AD PLAY", "STATE", state, 'event', event);
            
            play.style.display = 'none';
            pause.style.display = 'block';
        });

        // Remove interval just in case it already exists
        if(typeof link_interval !== 'undefined') {
            window.clearInterval(link_interval);
        }

        // Find proper link depending on seconds passed,
        // and assuming link should change every 15 seconds.
        // Protections built in for if video repeats.
        var link_interval = window.setInterval(function() {

            var state = player.getState();
            if( state == 'paused' ){
                play.style.display = 'block';
                pause.style.display = 'none';
            }

            var playlists = player.getPlaylist();

            if(typeof playlists[0].description === 'undefined') {
                // Not available yet. Takes a few moments to load playlist.
                return; 
            }

            var playlist = playlists[player.getPlaylistIndex()];

            var links_count = get_links_count(playlist.description);

            var seconds_passed = player.getPosition();

            var link_index = Math.floor(seconds_passed / 15) % links_count;

            apply_link(get_link(playlist.description, link_index));

            //console.log("seconds_passed: "+seconds_passed);
            //console.log("links_count: "+links_count);
            //console.log("link_index: "+link_index);
            //console.log("link: "+get_link(playlist.description, link_index));

        },500); // Every 1/2 second
    }

    function get_filtered_links(link_str) {

        var links = link_str.split(/\r?\n/);

        // remove any empty elements in array, in case editors use 2 or more newlines
        // trim for any beginning or ending whitespace in same filter
        var filtered_links = links.filter(function(el) {
            var trimmed_str = el.trim();
            if(trimmed_str.length != 0) {
                return trimmed_str;
            }
        });

        return filtered_links;
    }

    function get_links_count(link_str) {

        var filtered_links = get_filtered_links(link_str);

        return filtered_links.length;
    }

    function get_link(link_str, index) {

        var filtered_links = get_filtered_links(link_str);
        current_link_index = index;

        return filtered_links[index];
    }

    function apply_link(url) {

        window.jwplayer_hp_click_url = url;
    }

    window.jwplayer_hp_click = function(event) {

        if( !hasClass(event.target, "realclear_jwplayer_overlay") ) {
            // This is probably catapultx
            return;

        } else if( !window.jwplayer_hp_is_ad ) {

            // window.open(window.jwplayer_hp_click_url, '_blank');

            let url = window.jwplayer_hp_click_url;

            if(url != null){

                let utm_vars = `utm_campaign=JW_Promo_Player&utm_medium=Direct_${encodeURIComponent(document.body.classList.value)}&utm_source=${player.getPlaylistIndex()}-${current_link_index}`;

                if( !url.includes('?') ){
                    url = url+'?'+utm_vars;
                }else{
                    url = url+'&'+utm_vars;
                }

                console.log(url);
                window.open(url, '_blank');
            }

        } else {
            // Probably an ad
            return;
        }
    };
  
  }());

/*GA Events for ADBlocker Actions*/

$(document).on('click', '.offer-allow-ads', function(e){
    var data = {
        'ge_action' : 'Offer allow ads',
        'ge_category' : 'Adblocker Modal',
        'ge_label' : 'Instructions to disable it',
        'ge_noninteraction' : false
    };
    send_ga_event(data);
});
$(document).on('click', '.offer-login', function(e){
    var data = {
        'ge_action' : 'Offer Login btn',
        'ge_category' : 'Adblocker Modal',
        'ge_label' : 'To Dashboard',
        'ge_noninteraction' : false
    };
    send_ga_event(data);
});
$(document).on('click','.offer-buy-ads',function(e){
    var data = {
        'ge_action' : 'Offer Buy Subscription',
        'ge_category' : 'Adblocker Modal',
        'ge_label' : 'To subscriptions Page',
        'ge_noninteraction' : false
    };
    send_ga_event(data);
});

function get_taboola_loader(){
    !function (e, f, u, i) {
        if (!document.getElementById(i)){
            e.async = 1;
            e.src = u;
            e.id = i;
            f.parentNode.insertBefore(e, f);
        }
    }(document.createElement('script'),
        document.getElementsByTagName('script')[0],
        '//cdn.taboola.com/libtrc/theaffinitymediaexchangetame-rcp/loader.js',
        'tb_loader_script');
    if(window.performance && typeof window.performance.mark == 'function')
    {window.performance.mark('tbl_ic');}
}
function runConfiantScript() {

    var sites_with_confiant = ["defense"];

    if(sites_with_confiant.includes(SITE_INFO['name'])){
        console.log("Confiant....");
        /* Confiant dfp ad security */
        /* Wrapper for RealClearPolitics, generated on 2018-06-04T11:10:43-04:00 */

        // If page with first URL segment matches, use Confiant
        var confiant_list = {
            'home'     : true, // 'home' isn't a url segment, but we use this when no segment found
            'articles' : true,
            'video'    : true,
            'epolls'   : true,
            'elections': true,
            'cartoons' : true,
            'authors'  : true,
            'daily_newsletters' : true,
            'links' : true,
            'events' : true,
        };
  
        // Find first url segment, see if it matches any in list, make sure it's true
        var do_confiant = false;
        var url_segments = location.pathname.split('/');
        
        if( typeof url_segments[1] !== 'undefined' && url_segments[1] != '') {
        
            for (var segment in confiant_list) {
            if (confiant_list.hasOwnProperty(segment)) {
        
                if( typeof confiant_list[url_segments[1]] !== 'undefined' && confiant_list[url_segments[1]] == true) {
                do_confiant = true;
                }
            }
            }
        } else {
        
            // If no first segment, must be homepage
            if( typeof confiant_list['home'] !== 'undefined' && confiant_list['home'] == true) {
            do_confiant = true;
            }
        
        }
  
        if(do_confiant) {
    
            /*(function() {
                var w = window;
                var h = 'clarium.global.ssl.fastly.net';
                w._clrm = w._clrm || {};
                w._clrm.gpt = {
                    propertyId: '7Wu_Kxa62SVklAT2KI86xg35u9c',
                    confiantCdn: h,
                    sandbox: 0,
                    mapping: 'W3siaSI6MiwidCI6Int7b319Ont7d319eHt7aH19IiwicCI6MCwiRCI6MSwiciI6W119LHsiaSI6NiwidCI6Int7Y299fTp7e3d9fXh7e2h9fSIsInAiOjUwLCJEIjowLCJyIjpbeyJ0IjoiZXgiLCJzIjpudWxsLCJ2IjoiY28ifV19XQ==',
                    activation: '|||NTU2MzIyNDM=,|||MzYwMTYyOTM=,|||NDcxNzk5NDQz,|||MzI1OTM3NzM=,|||MjM4NjI5NjY0NQ==,|||MjM4NTc2NjMwMQ==',
                    callback: function(blockingType, blockingId, isBlocked, wrapperId, tagId, impressionData) {
                        //console.log("w00t one more bad ad nixed.", arguments);
                        _gaq.push(['_trackEvent', 'Confiant', 'blockingType: '+blockingType, 'isBlocked: '+isBlocked]); 
                    }
                };
                var e = document.createElement('script');
                e.async = true;
                e.src = '//' + h + '/gpt/a/wrap.js';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(e, s);
            })();*/
        
            var confiant_script = document.createElement('script');
            confiant_script.type = 'text/javascript';
            confiant_script.async = true; 
            confiant_script.src = 'https://cdn.confiant-integrations.net/7Wu_Kxa62SVklAT2KI86xg35u9c/gpt_and_prebid/config.js';
            var confiant_scriptx = document.getElementsByTagName('script')[0];
            confiant_scriptx.parentNode.insertBefore(confiant_script, confiant_scriptx);
        }

    }

}


/* ORIGINAL CONTENT WIDGET HOMEPAGE CENTER COLUMN*/

var summaryArray = document.querySelectorAll('.summary');
var summaryBtnArray = document.querySelectorAll('#summary-btn');
var readLessBtnArray = document.querySelectorAll('#read-less-btn');

summaryBtnArray.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        summaryArray[index].style.display = 'block';
        summaryBtnArray[index].style.display = 'none';
        readLessBtnArray[index].style.display = 'inline-block';
    })
});

readLessBtnArray.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        summaryArray[index].style.display = 'none';
        summaryBtnArray[index].style.display = 'inline-block';
        readLessBtnArray[index].style.display = 'none';
    })
})