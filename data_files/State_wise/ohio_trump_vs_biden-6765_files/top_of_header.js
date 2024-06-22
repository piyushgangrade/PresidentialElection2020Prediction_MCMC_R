/*

top_of_header.js
----------------

Script loaded on all sites, first in header

Requirements:

  Place as first inline script tag in header, synchronous
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
  UTILITY FUNCTIONS
  ADMIRAL GDPR

*/

////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES / CONSTANTS ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Redirect to root on that query string per Ivan
if( window.location.search == '?state=nwa' ){
    window.location.replace('/');
}

//set SITE_PAGE for Google Analytics default - will change per module "body.class" in site configs area if need be
//ONLY List Mod uses rc-load-widgets.js currently - Once updated this check will include Video Pages - all other pages get SITE_PAGE="story"
var SITE_PAGE = document.querySelector("#jsSite").getAttribute("data-site-page");
if (typeof SITE_PAGE === "undefined" || SITE_PAGE == "") {
    SITE_PAGE = 'story'; // Default value
}

//get "OAS_TAG" for specific page to control specific targeting for Google Analytics
var GA_TAG = document.querySelector("#jsSite").getAttribute("data-gaTag");

var stream_tags = {}; // ?

//var RC_welcome_interval; //TRACKING INVERVAL FOR welcome_ad
//var RC_homepage_video_interval; // ?

if (typeof NO_IC === 'undefined') {
    var NO_IC = false;
}

var SITE_NAME = document.querySelector("#jsSite").getAttribute("data-site");
var SITES_INFO = [
    {
        name: 'politics',
        prebid_src: '//a.publir.com/platform/264.js',
        // prebid_src: '//www.realclearpolitics.com/asset/publr/264.js',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearPolitics',
        // facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/RealClearPolitics-27088225427/timeline/',
        // twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RealClearNews',
        twitter_related: 'RealClearNews,rcpvideo,TomBevanRCP',
        global_site_url: window.location.protocol+'//www.realclearpolitics.com',
        // A.A. Change for distro to white 05/21/2020
        // site_color: '#DC0000',
        site_color: '#fff',
        site_heading_color: '#DC0000',
        FB_app_id: '1593718380910611',
        global_data_loc: 'rcp',
        // REVCONTENT -- SPONSORED CONTENT IDS
        revc_id: 'rcjsload_802e64',
        revc_w: '39765',
        revc_id_side: '', // we do not have code for politics
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '56045',
        // Newsletter Promo Pop-up Auto List Select
        auto_list_ids: 'a4db5f2336|51f930c5ce|8c65b915a9|d6a76c9ec3|9da46952f0|7d83b1601b',
        spot_production_id: 'sp_v0xu5oCZ',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_e4431c0a82261742f007d36f767de82097f19bc6',
        admiral_id: 'kheWDeYGeFPPn7sQ-PfpnFawLUdDWzyeHyG7KzHYdGNzzO_EGgYRxGbqTxWp63lYO7EQQhO99Vs_A',
        admiral_enabled: true,
        admiral_url_1 : "https://railwayreason.com/v2cgevh9N3T8eapu9Bq3LmUn_Amx90mHuGKM6Ao5Yjibc61aEGilINy0",
        admiral_url_2 : "https://railwayreason.com/v2wlcoJ0AZPNPP506liflnxoX9I2q-oQLym08RXKKl1J3QsqfVw3G9_EhWskktjFQKcyi7VKV",

        mgid_hp_id : '970897',
        mgid_hp_after_covid: '970904',
        mgid_hp_rc: '970898',

        mgid_polls_id: '977408',
        mgid_polls_rc: '970911',
        mgid_polls_carousel: '981991',

        mgid_article_rc_id : '970917',
        mgid_article_in_content_p12 : '970919',
        mgid_article_carousel: '977485',
        mgid_article_bf_comments: '976893',
        mgid_amp_article: '970922',

        mgid_video: '970342',
        mgid_video_rc: '977465',

        mgid_election_carousel : '970915',

        google_analytics_tracking_code : 'UA-31527-1',
        google_analytics4_id: 'G-PLW1TH538V',

        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'science',
        prebid_src: '//a.publir.com/platform/369.js',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearScience',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearscience/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/rcscience',

        twitter_related: 'rcscience',
        global_site_url: window.location.protocol+'//www.realclearscience.com',
        site_color: '#37414A',
        site_heading_color: '#37414A',
        FB_app_id: '815061235213552',
        global_data_loc: 'rcsc',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '267b89dc8a',

        spot_production_id: 'sp_8lO2c91e',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: '', //GC_5fe7981788ab4d52787073ab4ba4da08736240ce
        admiral_id : 'temdm_2ZpTy9S13Z0BrBi-JKGtm5kMoz1_C2bS4471uYWtpIP-nzW7kCv5_PAfCnVFOVccUeoNwoQ',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2qsg3AXFECKl1KZWF5x5M-wPnhFG81KwIEMKhk8FEo9vUepmzCjmNr0",
        admiral_url_2: "https://railwayreason.com/v2sqjxdVQfHTCgyGMUY3RE4Yv7YYNocLw8KV5yRzai22cuXpYghIK850VFBEUGBjTGDV1w29T",

        mgid_hp_carosell: '992065',
        mgid_hp_lc: '992064',
        mgid_hp_rc: '992060',
        mgid_article_carousel: '992068',
        mgid_article_rc_id: '992067',
        mgid_article_in_content_p12: '992069',
        mgid_article_bf_comments: '992071',
        mgid_video: '992075',
        mgid_video_rc: '992072',

        google_analytics_tracking_code : 'UA-31527-30',
        google_analytics4_id: 'G-9RKYPPRHPC',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'world',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearWorld',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/RealClearWorld/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RealClearWorld',

        twitter_related: 'RealClearNews',
        global_site_url: window.location.protocol+'//www.realclearworld.com',
        site_color: '#0C124D',
        site_heading_color: '#0C124D',
        FB_app_id: '2093313384226659',
        global_data_loc: 'rcw',

        //rev content
        revc_id: 'rcjsload_ff92c1',
        revc_w: '44988',
        revc_id_side: 'rcjsload_33e8a5',
        revc_w_side: '44989',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: 'd519acabbf|9960d29f6a|1630639ffc',

        spot_production_id: 'sp_LQqoi1VA',

        evolok_enabled: true,
        story_stream_related: false,
        gotchosen_id: 'GC_26a00fabb18c91dc38b21cfd18c00f09f22bf991',
        admiral_id : 'rmxHjWev3FqAzk5j_n04matxVkmsq9iBfWV6LK1YcoCMa1CQi0QN7HyP8r723rYdvkdJd6-92Cljg',
        admiral_enabled : true,
        admiral_url_1 : "https://railwayreason.com/v2lxuP7ypkm_QNv3G4n9dsK5CpnRHq0t1nMxnGkZXI4i3odeafJ2sEIc",
        admiral_url_2 : "https://railwayreason.com/v2bed-MQN6S0xlPTZDwta5l_wbgJlKJE0uNs9kobGCYdq3TW8NsyXDrWYzr9WQaLOksUnInLe",

        mgid_hp_carosell: '991932',
        mgid_hp_lc : '991928',
        mgid_hp_rc: '991926',

        mgid_article_rc_id: '991940',
        mgid_article_carousel: '991941',
        mgid_article_in_content_p12: '991944',
        mgid_article_bf_comments: '991947', //Smart Scroll
        mgid_video_rc: '991949',
        mgid_video: '991958',

        google_analytics_tracking_code : 'UA-31527-20',
        google_analytics4_id: 'G-H5PNYZERGY',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com',
    },
    {
        name: 'health',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearHealth',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearhealth/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RealClearHealth',

        twitter_related: 'realclearhealth',
        global_site_url: window.location.protocol+'//www.realclearhealth.com',
        site_color: '#DBB706',
        site_heading_color: '#DBB706',
        FB_app_id: '1767191100208431',
        global_data_loc: 'rche',

        //rev content
        revc_id: 'rcjsload_114cfb',
        revc_w: '45008',
        revc_id_side: 'rcjsload_d59572',
        revc_w_side: '45009',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        //Newsletter Promo Pop-up Auto List Select
        auto_list_ids: 'b4baf6b587',

        spot_production_id: 'sp_C6rOxoF6',

        evolok_enabled: false,
        story_stream_related: true,
        gotchosen_id: 'GC_88287009d64ebb9e5c1323cbcfa8acd524684150',
        admiral_id: 'woubv-ItxJzaF_-GdmVY-AK3Lclvjrftq9IJ_UD1m_p2Eq5e-LLbOJQCESJBBc7rgEBzG4RkIc7cw',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2quqZ8hdw8E6GLl_C16SwAxcfgm03A6e9xAj752CRYz54lUjsFrRxrA",
        admiral_url_2: "https://railwayreason.com/v2qpil-Rbvg1Wr-Smw5LS-PXBpjK5XShF3TqjZS7sI2cJitTt_YD0FTXlFjHL-hIvVQ7nbW3n",


        mgid_hp_rc: '991885',
        mgid_hp_id: '',
        mgid_hp_lc: '991887',
        mgid_hp_carosell: '991889',
        mgid_article_rc_id: '991895',
        mgid_article_carousel: '991903',
        mgid_article_in_content_p12: '991905',
        mgid_article_bf_comments: '991906',

        google_analytics_tracking_code : 'UA-31527-45',
        google_analytics4_id: 'G-99PE1ZH4XZ',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com',
    },
    {
        name: 'investigations',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearInvestigations',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearinvestigations/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RCInvestigates',

        twitter_related: 'realclearinvestigations',
        global_site_url: window.location.protocol+'//www.realclearinvestigations.com',
        site_color: '#5d5d5d',
        site_heading_color: '#5d5d5d',
        FB_app_id: '1615740298756569',
        global_data_loc: 'rci',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: 'd042379c8d',

        spot_production_id: 'sp_fGGCea9F',

        evolok_enabled: false,
        story_stream_related: true,
        admiral_id : '', //We need one for investigations

        google_analytics_tracking_code : 'UA-31527-50',
        google_analytics4_id: 'G-236E64831K',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'defense',
        prebid_src: '//a.publir.com/platform/371.js',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearDefense',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realcleardefense/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RCDefense',

        twitter_related: 'RCDefense',
        global_site_url: window.location.protocol+'//www.realcleardefense.com',
        site_color: '#485228',
        site_heading_color: '#485228',
        FB_app_id: '1640169792979601',
        global_data_loc: 'rcd',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '694f73a8dc',

        spot_production_id: 'sp_DzWAHE1J',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_2547344cf6e04e73ce1abfadff9da2186b8ebafb',
        admiral_id : 'bau8KpBCi8nIUG6LYT2ZdaFe6Igr0UjcXZY-ecbD_Lpngc7cL-SYNW-XD7o29HdRy1MMGUePR0xUg',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2dhqkydcypfgk5lQGGq0GNO_4eBkERX72zPSlHawcanHIbpawecgI3Y",
        admiral_url_2: "https://railwayreason.com/v2kjtSnkrmq4NcQENZ6s55jZVb_8PAQcZBRnC_kbtYRZPy2KUuQdawbYw2ubSiA3obmHVR2hS",

        mgid_hp_carosell: '991975',
        mgid_hp_lc: '991971',
        mgid_hp_rc: '991969',
        mgid_article_carousel: '991982',
        mgid_article_in_content_p12: '991985', //impact
        mgid_article_bf_comments: '991986',
        mgid_article_rc_id: '991980',

        google_analytics_tracking_code : 'UA-31527-39',
        google_analytics4_id: 'G-TWM4RZTSYC',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'

    },
    {
        name: 'energy',
        prebid_src: '//a.publir.com/platform/462.js',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearEnergy',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearenergy/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realclearenergy',

        twitter_related: 'realclearenergy',
        global_site_url: window.location.protocol+'//www.realclearenergy.org',
        site_color: '#70AB41',
        site_heading_color: '#70AB41',
        FB_app_id: '255745351486296',
        global_data_loc: 'rce',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '462961a8ae|7d83b1601b',

        spot_production_id: 'sp_yhuNbXOh',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_f92cf3e7212877dba6e1d6fb969addc15917131a',
        admiral_id : 'dvaPUwYLIWX6he1MyEZtFQaFGj9MDjdHQ8XEeq-oLmCR7IffR3aiHfawPYzrNzmghfxIk3v9AXw3Q',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2xerQ1ypeCT9mTPQQbMkUnF1FE9zlvxFISj7gHIDuEMEeGgnk1egXag",
        admiral_url_2: "https://railwayreason.com/v2ynb4CjafF9fsViBI1jvkx_PwmJLdYVvlkFNFPO3SViwNZmJi8hTmcIBSIr4CBhZ9M7XYT-A",

        mgid_hp_rc: '991800',
        mgid_hp_lc: '991799',
        mgid_hp_id: '991804',
        mgid_hp_carosell: '991803',
        mgid_article_rc_id: '991805',
        mgid_article_carousel: '991811',
        mgid_article_in_content_p12: '991812',
        mgid_article_bf_comments: '991813',

        google_analytics_tracking_code : 'UA-31527-32',
        google_analytics4_id: 'G-TX117980T8',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'policy',
        prebid_src: '//a.publir.com/platform/461.js',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearPolicy',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearpolicy',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realclearpolicy',

        twitter_related: 'realclearpolicy',
        global_site_url: window.location.protocol+'//www.realclearpolicy.com',
        //site_color: '#37414A',
        site_color: '#65198e',
        site_heading_color: '#65198e',
        FB_app_id: '1815769415347224',
        global_data_loc: 'rcpc',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: 'ebf02493b3|113ee1bc69',

        spot_production_id: 'sp_YRUF6DPr',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_e2ef102a0ff5f0d4f77141e685d917450278897d',
        admiral_id : 'gucGPwZxS7-7JNZATFAg6Z1FyqZxi9EhwIZIyz-Dnj9WYluAUlDdfo7MQXUDmLMqBcL0HtQDe92ag',
        admiral_enabled: true,
        admiral_url_1:"https://railwayreason.com/v2pwngyVkzRLt8DJbZnOu5w_D6_j9BimntF0SskeHCenl5kJueN5Pe-4",
        admiral_url_2: "https://railwayreason.com/v2xlh00a-LY_SsxBZK1mq-S-6DYiKRancB_8GOgj5XtX8iJOVF0l3JvV0knVn5p-u1eHJczLI",

        mgid_hp_carosell: '991834',
        mgid_hp_rc: '991833',
        mgid_article_rc_id: '991837',
        mgid_article_carousel: '991838',
        mgid_article_in_content_p12: '991839',
        mgid_article_bf_comments: '991841',

        google_analytics_tracking_code : 'UA-31527-37',
        google_analytics4_id: 'G-4RE28NLWGL',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com',
    },
    {
        name: 'religion',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearReligion',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearreligion',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realclearrelig',

        twitter_related: 'realclearreligion',
        global_site_url: window.location.protocol+'//www.realclearreligion.org',
        site_color: '#81C0C8',
        site_heading_color: '#81C0C8',
        FB_app_id: '346345255724798',
        global_data_loc: 'rcr',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '7f0a4512a1',

        spot_production_id: 'sp_QKKE0vl2',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_4fd3da3e573b20bda65b0e8d498e0c6909be936b',
        admiral_id : 'hqqD5RfuLRn7OWQjbTcF-4DXxGUxGUpn_7VwNanhglTPZ2RTJt5nHhCMmgEEW5XcoLcv3FXmC073Q',
        admiral_enabled : true,
        admiral_url_1: "https://railwayreason.com/v2mozhkMDp1M_frp30UEIyIK6gAAjo6MhtzIpUdA_Hkjo5quxtAiaU5Q",
        admiral_url_2: "https://railwayreason.com/v2goylpMYvcXPde_W4KibvkVTH2iFmcjVkzJLmYp7zJ-Er7QAq1t0HTLBpQBWMCA4kTLMzh39",

        mgid_hp_id: '992026',
        mgid_hp_rc: '992025',
        mgid_hp_lc: '',
        mgid_article_rc_id: '992028',
        mgid_article_carousel: '992029',
        mgid_article_bf_comments: '992037',
        mgid_article_in_content_p12: '',

        google_analytics_tracking_code : 'UA-31527-29',
        google_analytics4_id: 'G-68333N9JR7',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'

    },
    {
        name: 'education',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearEducation',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realcleareducation',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realcleared',

        twitter_related: 'realcleared',
        global_site_url: window.location.protocol+'//www.realcleareducation.com',
        site_color: '#8b0000',
        site_heading_color: '#8b0000',
        FB_app_id: '1734472916875035',
        global_data_loc: 'rced',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '8a051b373b',

        spot_production_id: 'sp_4wiiImwx',

        evolok_enabled: false,
        story_stream_related: true,
        gotchosen_id: 'GC_4d726c2f8be9384b8213df11ce85e79f05438901',
        admiral_id: 'gej5jYTzEOg_bxW2QsnizGhVQfz5aF81yvBGEW_lY7aXT7o1fPE0nL46NK1DgknvbYRJ0uOdcw9pek',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2fldR9yFZFoR739O92FGejN4SPYdrVKDWIvk0VINu02hj37CwFMNcEFL",
        admiral_url_2: "https://railwayreason.com/v2lcjDNM7jySxyqyKhyCMkx-ujJbTlJbRHFuW7TbpPv-mWenijuO-Bh5dAw88DB4vwYVhN2snHA",

        mgid_hp_rc: '991868',
        mgid_hp_lc: '991871',
        mgid_hp_carosell: '991873',
        mgid_article_rc_id: '991879',
        mgid_article_in_content_p12: '991965', //impact
        mgid_article_bf_comments: '991966',
        mgid_article_carousel: '991881',

        google_analytics_tracking_code : 'UA-47207322-1',
        google_analytics4_id: 'G-YGR71RDLZN',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'books',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearBooks',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearbooks',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realclearbooks',

        twitter_related: 'realclearbooks',
        global_site_url: window.location.protocol+'//www.realclearbooks.com',
        site_color: '#017ba8',
        site_heading_color: '#017ba8',
        FB_app_id: '336545073384960',
        global_data_loc: 'rcb',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: 'ea772b1135',

        spot_production_id: 'sp_sJMa8VBM',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_08cbadf551e2af130ce5a70c29c788e3bbde01fe',
        admiral_id: 'edfWdEafIytNBbG_o4jkBxjAnh1qWKYLmmk0m3T3o4brV0kQDf26rOxDt5K9NghHou_BPKVV9hQqM4',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2ofuADVym5Ps7hDm_oEBSy8DWib4JA8RYuSMpb01FTHf8VKhzGT-QeLx",
        admiral_url_2: "https://railwayreason.com/v2hubKLNHqVqPkLv9wsJGeGuwB47DEHd5zaS3CvLc3Nt--yvoami7KP_tmBNt-rdY208gDszgKA",

        mgid_hp_rc: '992002',
        mgid_hp_id: '992006',
        mgid_hp_lc: '',
        mgid_hp_carosell: '992004',
        mgid_article_rc_id: '992007',
        mgid_article_carousel: '992009',
        mgid_article_in_content_p12: '992011',
        mgid_article_bf_comments: '992012',

        google_analytics_tracking_code : 'UA-31527-35',
        google_analytics4_id: 'G-GFXX3HWTB9',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'history',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearHistory',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearhistory',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/realclearhistry',

        twitter_related: 'realclearhistry',
        global_site_url: window.location.protocol+'//www.realclearhistory.com',
        site_color: '#cc6600',
        site_heading_color: '#cc6600',
        FB_app_id: '377784295946894',
        global_data_loc: 'rchi',

        //rev content
        revc_id: 'rcjsload_bbbfdc',
        revc_w: '44986',
        revc_id_side: 'rcjsload_1c39c0',
        revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: 'fbced764bd', // Update with new list id

        spot_production_id: 'sp_0xpjnq0B', //SPOT Production

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_e97f0ff112ae2aaa0aec5780e51c7e70e4cba1e2',
        admiral_id : 'ssr79JFuvbQxZYBmufynXnTYiHr1nceWcrR_dP5tFdONJ2nRjGTU_gMZCqc3SPmgjDttgy6gZezihg',
        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2dmeFmUUON80WhCqrPd2Aj0C0TZZSsEltO9H40n7abtBOaVqdM4UMguZ",
        admiral_url_2: "https://railwayreason.com/v2rkpS-aG26dg2U2LQAravhx3EyC47FmAKam377-7_YCBPIZqJ2Kl5ajUupNnsVZlwwXRumGyRQ",


        mgid_hp_rc: '991968',
        mgid_hp_lc: '991972',
        mgid_hp_carosell: '991979',
        mgid_article_rc_id: '991983',
        mgid_article_carousel: '992027',
        mgid_article_in_content_p12: '992030',
        mgid_article_bf_comments: '992034',

        google_analytics_tracking_code : 'UA-31527-34',
        google_analytics4_id: 'G-PTB2HN0HHT',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'

    },
    {
        name: 'markets',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearMarkets',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearmarkets',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/rc_markets',

        twitter_related: 'rc_markets',
        global_site_url: window.location.protocol+'//www.realclearmarkets.com',
        site_color: '#669933',
        site_heading_color: '#669933',
        FB_app_id: '1798801117051770',
        global_data_loc: 'rcm',

        //M.B. REMOVED 1.9.17
        //rev content
        //revc_id: 'rcjsload_bbbfdc',
        //revc_w: '44986',
        //revc_id_side: 'rcjsload_1c39c0',
        //revc_w_side: '44987',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '1f71a1eaa2', // Update with new list id

        spot_production_id: 'sp_9W7bDUIH',

        evolok_enabled: true,
        story_stream_related: true,
        gotchosen_id: 'GC_b10b9282e82eb93c968d2888fbc0aa757483040c',
        admiral_id: 'jgrdUt_QJrysUdQxcjEwC0-XJPAeOkpsrtcwUMs_OVHXSowdxlbgUEcgy3fNJZKLAnRpDoN3vgwyg',
        ic_ads_close: [
            {
                'body_class' : 'home',
                'ads' : ['ic_970x250_1'],
            },
            {
                'body_class' : 'article',
                'ads' : ['ic_728x90_1'],
            }
        ],

        admiral_enabled: true,
        admiral_url_1: "https://railwayreason.com/v2wqhdSEm3PWcA1bNIbaHtdPQ5RhmZ2KxIlknAW-AB7jFpx24UVjjLzM",
        admiral_url_2: "https://railwayreason.com/v2oms424pJudKaREss-_pPpWWIxGgRY2_s0qAcodfrkmQfc5XP-HmQcR2VaOUk_bdAoeurcfq",

        google_analytics_tracking_code : 'UA-31527-19',
        google_analytics4_id: 'G-4X55KGZR7F',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'publicaffairs',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: true,
        lazy_ads: true,
        site_title: 'RealClearPublicAffairs',
        //facebook link for main icon in new header menu bar
        facebook_url: 'https://www.facebook.com/realclearpublicaffairs/',
        //twitter link for main icon in new header menu bar
        twitter_url: 'https://twitter.com/RealClearPublicAffairs',

        twitter_related: 'realclearpublicaffairs',
        global_site_url: window.location.protocol+'//www.realclearpublicaffairs.com',
        site_color: '#013220',
        site_heading_color: '#013220',
        FB_app_id: '',
        global_data_loc: 'rcpa',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',

        auto_list_ids: '',

        spot_production_id: 'sp_rIO3togj',

        evolok_enabled: false,
        story_stream_related: true,
        admiral_id: '',

        google_analytics_tracking_code : 'UA-31527-53',
        google_analytics4_id: 'G-2NK0JMCMRW',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    }, 
    {
        name: 'foundation',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: true,
        lazy_ads: false,
        site_title: 'RealClearFoundation',
        //facebook link for main icon in new header menu bar
        facebook_url: '',
        //twitter link for main icon in new header menu bar
        twitter_url: '',

        twitter_related: 'realclearfoundation',
        global_site_url: window.location.protocol+'//www.realclearfoundation.org',
        site_color: '#5d5d5d',
        site_heading_color: '#5d5d5d',
        FB_app_id: '',
        global_data_loc: 'rcfo',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',
        auto_list_ids: '',
        spot_production_id: '',
        evolok_enabled: false,
        story_stream_related: false,
        admiral_id: '',

        google_analytics_tracking_code : 'UA-31527-55',
        google_analytics4_id: 'G-GQVV38G14C',

    }, 
    {
        name: 'wire',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: true,
        lazy_ads: false,
        site_title: 'RealClearWire',
        //facebook link for main icon in new header menu bar
        facebook_url: '',
        //twitter link for main icon in new header menu bar
        twitter_url: '',

        twitter_related: 'realclearwire',
        global_site_url: window.location.protocol+'//www.realclearwire.com',
        site_color: '#fff',
        site_heading_color: '#DC0000',
        FB_app_id: '',
        global_data_loc: 'rcwr',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',
        auto_list_ids: '',
        spot_production_id: '',
        evolok_enabled: false,
        story_stream_related: true,
        admiral_id: '',

        google_analytics_tracking_code : '',
        google_analytics4_id: 'G-XN9R6Z69TD',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'pennsylvania',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearPennsylvania',
        //facebook link for main icon in new header menu bar
        facebook_url: '',
        //twitter link for main icon in new header menu bar
        twitter_url: '',

        twitter_related: 'realclearpennsylvania',
        global_site_url: window.location.protocol+'//www.realclearpennsylvania.com',
        site_color: '#002a86',
        site_heading_color: '#DC0000',
        FB_app_id: '',
        global_data_loc: 'rcpenn',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',
        auto_list_ids: '',
        spot_production_id: '',
        evolok_enabled: false,
        story_stream_related: true,
        admiral_id: '',

        google_analytics_tracking_code : 'UA-31527-56',
        google_analytics4_id: 'G-XN9R6Z69TD',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
    {
        name: 'florida',
        prebid_src: '',
        prebid_src_lazy: '',
        disable_all_ads: false,
        lazy_ads: true,
        site_title: 'RealClearFlorida',
        //facebook link for main icon in new header menu bar
        facebook_url: '',
        //twitter link for main icon in new header menu bar
        twitter_url: '',

        twitter_related: 'realclearflorida',
        global_site_url: window.location.protocol+'//www.realclearflorida.com',
        site_color: '#a80534',
        site_heading_color: '#DC0000',
        FB_app_id: '',
        global_data_loc: 'rcfl',
        // ZERG SPONSORED CONTENT SITE ID
        zerg_id: '',
        auto_list_ids: '',
        spot_production_id: '',
        evolok_enabled: false,
        story_stream_related: true,
        admiral_id: '',

        google_analytics_tracking_code : 'UA-31527-57',
        google_analytics4_id: 'G-REWEG4GWZD',
        google_one_tap_client_id: '777032588331-0hh0seafv6nl1qima6eo3c8v07l4svjn.apps.googleusercontent.com'
    },
];

// Find site info based on detected site
var SITE_INFO = {};
var SITE_INFO_INDEX = SITES_INFO.map(function(site){ return site.name; }).indexOf(SITE_NAME);
if( SITE_INFO_INDEX > -1 ){
    SITE_INFO = SITES_INFO[SITE_INFO_INDEX];
}

var LAZY_EXPAND = 150;
if (window.outerWidth < 768) {
    LAZY_EXPAND += 50;
}

// Config lazysizes library to look at ads - needs to be before the lazy sizes script
window.lazySizesConfig = window.lazySizesConfig || {};
window.lazySizesConfig.lazyClass = 'RC-AD'; // instead of default 'lazyload'
window.lazySizesConfig.loadMode = 2; // 1 - only load visible elements, 2 - loads "very near"
window.lazySizesConfig.expand = LAZY_EXPAND; // expands the calculated visual viewport area in all directions, so that elements can be loaded before they become visible
window.lazySizesConfig.loadHidden = false; // should delay loading of fixed ads until they appear
window.lazySizesConfig.init = false; // Do not initialize on load. Init manually when ready.

/*! lazysizes - v1.3.1 */
!function(a,b){var c=b(a,a.document);a.lazySizes=c,"object"==typeof module&&module.exports?module.exports=c:"function"==typeof define&&define.amd&&define(c)}(window,function(a,b){"use strict";if(b.getElementsByClassName){var c,d=b.documentElement,e=a.HTMLPictureElement&&"sizes"in b.createElement("img"),f="addEventListener",g=a[f],h=a.setTimeout,i=a.requestAnimationFrame||h,j=/^picture$/i,k=["load","error","lazyincluded","_lazyloaded"],l={},m=Array.prototype.forEach,n=function(a,b){return l[b]||(l[b]=new RegExp("(\\s|^)"+b+"(\\s|$)")),l[b].test(a.className)&&l[b]},o=function(a,b){n(a,b)||(a.className=a.className.trim()+" "+b)},p=function(a,b){var c;(c=n(a,b))&&(a.className=a.className.replace(c," "))},q=function(a,b,c){var d=c?f:"removeEventListener";c&&q(a,b),k.forEach(function(c){a[d](c,b)})},r=function(a,c,d,e,f){var g=b.createEvent("CustomEvent");return g.initCustomEvent(c,!e,!f,d||{}),a.dispatchEvent(g),g},s=function(b,d){var f;!e&&(f=a.picturefill||c.pf)?f({reevaluate:!0,elements:[b]}):d&&d.src&&(b.src=d.src)},t=function(a,b){return(getComputedStyle(a,null)||{})[b]},u=function(a,b,d){for(d=d||a.offsetWidth;d<c.minSize&&b&&!a._lazysizesWidth;)d=b.offsetWidth,b=b.parentNode;return d},v=function(b){var c,d=0,e=a.Date,f=function(){c=!1,d=e.now(),b()},g=function(){h(f)},j=function(){i(g)};return function(){if(!c){var a=125-(e.now()-d);c=!0,6>a&&(a=6),h(j,a)}}},w=function(){var e,k,l,u,w,y,z,A,B,C,D,E,F,G,H=/^img$/i,I=/^iframe$/i,J="onscroll"in a&&!/glebot/.test(navigator.userAgent),K=0,L=0,M=0,N=0,O=function(a){M--,a&&a.target&&q(a.target,O),(!a||0>M||!a.target)&&(M=0)},P=function(a,b){var c,d=a,e="hidden"!=t(a,"visibility");for(B-=b,E+=b,C-=b,D+=b;e&&(d=d.offsetParent);)e=(t(d,"opacity")||1)>0,e&&"visible"!=t(d,"overflow")&&(c=d.getBoundingClientRect(),e=D>c.left&&C<c.right&&E>c.top-1&&B<c.bottom+1);return e},Q=function(){var a,b,d,f,g,h,i,j,m;if((w=c.loadMode)&&8>M&&(a=e.length)){for(b=0,N++,G>L&&1>M&&N>3&&w>2?(L=G,N=0):L=w>1&&N>2&&6>M?F:K;a>b;b++)if(e[b]&&!e[b]._lazyRace)if(J)if((j=e[b].getAttribute("data-expand"))&&(h=1*j)||(h=L),m!==h&&(z=innerWidth+h,A=innerHeight+h,i=-1*h,m=h),d=e[b].getBoundingClientRect(),(E=d.bottom)>=i&&(B=d.top)<=A&&(D=d.right)>=i&&(C=d.left)<=z&&(E||D||C||B)&&(l&&3>M&&!j&&(3>w||4>N)||P(e[b],h))){if(W(e[b]),g=!0,M>9)break;M>6&&(L=K)}else!g&&l&&!f&&4>M&&4>N&&w>2&&(k[0]||c.preloadAfterLoad)&&(k[0]||!j&&(E||D||C||B||"auto"!=e[b].getAttribute(c.sizesAttr)))&&(f=k[0]||e[b]);else W(e[b]);f&&!g&&W(f)}},R=v(Q),S=function(a){o(a.target,c.loadedClass),p(a.target,c.loadingClass),q(a.target,S)},T=function(a,b){try{a.contentWindow.location.replace(b)}catch(c){a.src=b}},U=function(a){var b,d,e=a.getAttribute(c.srcsetAttr);(b=c.customMedia[a.getAttribute("data-media")||a.getAttribute("media")])&&a.setAttribute("media",b),e&&a.setAttribute("srcset",e),b&&(d=a.parentNode,d.insertBefore(a.cloneNode(),a),d.removeChild(a))},V=function(){var a,b=[],c=function(){for(;b.length;)b.shift()();a=!1};return function(d){b.push(d),a||(a=!0,i(c))}}(),W=function(a){var b,d,e,f,g,i,k,t=H.test(a.nodeName),v=t&&(a.getAttribute(c.sizesAttr)||a.getAttribute("sizes")),w="auto"==v;(!w&&l||!t||!a.src&&!a.srcset||a.complete||n(a,c.errorClass))&&(w&&(k=a.offsetWidth),a._lazyRace=!0,M++,V(function(){a._lazyRace&&delete a._lazyRace,p(a,c.lazyClass),(g=r(a,"lazybeforeunveil")).defaultPrevented||(v&&(w?(o(a,c.autosizesClass),x.updateElem(a,!0,k)):a.setAttribute("sizes",v)),d=a.getAttribute(c.srcsetAttr),b=a.getAttribute(c.srcAttr),t&&(e=a.parentNode,f=e&&j.test(e.nodeName||"")),i=g.detail.firesLoad||"src"in a&&(d||b||f),g={target:a},i&&(q(a,O,!0),clearTimeout(u),u=h(O,2500),o(a,c.loadingClass),q(a,S,!0)),f&&m.call(e.getElementsByTagName("source"),U),d?a.setAttribute("srcset",d):b&&!f&&(I.test(a.nodeName)?T(a,b):a.src=b),(d||f)&&s(a,{src:b})),(!i||a.complete)&&(i?O(g):M--,S(g))}))},X=function(){if(!l){if(Date.now()-y<999)return void h(X,999);var a,b=function(){c.loadMode=3,R()};l=!0,c.loadMode=3,M||R(),g("scroll",function(){3==c.loadMode&&(c.loadMode=2),clearTimeout(a),a=h(b,99)},!0)}};return{_:function(){y=Date.now(),e=b.getElementsByClassName(c.lazyClass),k=b.getElementsByClassName(c.lazyClass+" "+c.preloadClass),F=c.expand,G=F*c.expFactor,g("scroll",R,!0),g("resize",R,!0),a.MutationObserver?new MutationObserver(R).observe(d,{childList:!0,subtree:!0,attributes:!0}):(d[f]("DOMNodeInserted",R,!0),d[f]("DOMAttrModified",R,!0),setInterval(R,999)),g("hashchange",R,!0),["focus","mouseover","click","load","transitionend","animationend","webkitAnimationEnd"].forEach(function(a){b[f](a,R,!0)}),/d$|^c/.test(b.readyState)?X():(g("load",X),b[f]("DOMContentLoaded",R),h(X,2e4)),R(e.length>0)},checkElems:R,unveil:W}}(),x=function(){var a,d=function(a,b,c){var d,e,f,g,h=a.parentNode;if(h&&(c=u(a,h,c),g=r(a,"lazybeforesizes",{width:c,dataAttr:!!b}),!g.defaultPrevented&&(c=g.detail.width,c&&c!==a._lazysizesWidth))){if(a._lazysizesWidth=c,c+="px",a.setAttribute("sizes",c),j.test(h.nodeName||""))for(d=h.getElementsByTagName("source"),e=0,f=d.length;f>e;e++)d[e].setAttribute("sizes",c);g.detail.dataAttr||s(a,g.detail)}},e=function(){var b,c=a.length;if(c)for(b=0;c>b;b++)d(a[b])},f=v(e);return{_:function(){a=b.getElementsByClassName(c.autosizesClass),g("resize",f)},checkElems:f,updateElem:d}}(),y=function(){y.i||(y.i=!0,x._(),w._())};return function(){var b,e={lazyClass:"lazyload",loadedClass:"lazyloaded",loadingClass:"lazyloading",preloadClass:"lazypreload",errorClass:"lazyerror",autosizesClass:"lazyautosizes",srcAttr:"data-src",srcsetAttr:"data-srcset",sizesAttr:"data-sizes",minSize:40,customMedia:{},init:!0,expFactor:1.7,expand:d.clientHeight>630?d.clientWidth>890?500:410:359,loadMode:2};c=a.lazySizesConfig||a.lazysizesConfig||{};for(b in e)b in c||(c[b]=e[b]);a.lazySizesConfig=c,h(function(){c.init&&y()})}(),{cfg:c,autoSizer:x,loader:w,init:y,uP:s,aC:o,rC:p,hC:n,fire:r,gW:u}}});

/* ipinfo.io */
/*if (SITE_INFO['name'] === 'politics') {

    var el = document.createElement("script");
    el.src = "https://ipinfo.io/json?callback=ipinfo_callback&token=7dc214d07ce43b";
    el.async = true;
    el.onerror = function(e){
        // ipinfo.io failed to load
    }
    document.querySelector('head').appendChild(el);

    function ipinfo_callback(data) {

        // Get domain if available
        if( typeof data !== "undefined" ) {

            var domain_parts = [];
            var domain_str = "";

            if( typeof data.company !== "undefined"
            && typeof data.company.domain !== "undefined") {

                domain_str = data.company.domain;
            }

            else if( typeof data.asn !== "undefined"
            && typeof data.asn.domain !== "undefined") {

                domain_str = data.asn.domain;
            }
            
            domain_parts = domain_str.split(".");

            // Get TLD if available from company. If not available, do asn

            if(domain_parts.length > 1) {

                var tld = domain_parts[domain_parts.length - 1].toLowerCase();

                if(tld == "gov" || tld == "mil" || tld == "senate" || tld == "house") {

                    // send to GA
                    window._gaq = window._gaq || [];
                    _gaq.push(['_setCustomVar', 
                        2, // slot, 1-5
                        'Gov TLD', // name of custom variable
                        tld, // value
                        1 // Scope = Visitor
                    ]);
                    _gaq.push(['_setCustomVar', 
                        3, // slot, 1-5
                        'Gov Domain', // name of custom variable
                        domain_str, // value
                        1 // Scope = Visitor
                    ]);
                    // Might need to do a _trackEvent here so custom var gets delivered
                }
            }
        }
    }
}*/

// ADS /////////////////////////////////////////////////////////////////////////

var AD_ID = '1004503';
var HAS_INIT_ADS = false;

var ads_info = {
    'div-gpt-ad-1390595004947-7' : {
        'sizes' : [
            [728, 90], [970, 90], [970, 250]
        ],
        'name' : '/'+AD_ID+'/RC_728_by_90_top',
        'class' : 'RC-AD-TOP-BANNER',
        'loaded' : false,
        'closeable_pages' : ['home', 'article', 'polls', 'video', 'maps'],
        //'ic_override' : '//ads.investingchannel.com/adtags/realclearmarkets/economics/728x90.js',
        'slot_definition' : null
    },
    'div-gpt-ad-1390595004947-6' : {
        'sizes' : [
            [728, 90]
        ],
        'name' : '/'+AD_ID+'/RC_728_by_90_bottom',
        'class' : 'RC-AD-BOTTOM-BANNER',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1416850836025-4' : {
        'sizes' : [
            [300, 600]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_600_bottom',
        'class' : 'RC-AD-BOX-BOTTOM-600',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-3' : {
        'sizes' : [
            [300, 250]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_bottom',
        'class' : 'RC-AD-BOX-BOTTOM',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-5' : {
        'sizes' : [
            [300, 250], [300, 600], [300, 1050]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_top',
        'class' : 'RC-AD-BOX-TOP',
        'loaded' : false,
        'closeable_pages' : [],
        //'ic_override' : '//ads.investingchannel.com/adtags/realclearmarkets/economics/300x250.js',
        'slot_definition' : null
    },
    'div-gpt-ad-1390595004947-4' : {
        'sizes' : [
            [300, 250]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_middle',
        'class' : 'RC-AD-BOX-MIDDLE',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-2' : { // NOT IN PUBLIR 264
        'sizes' : [
            [160, 600]
        ],
        'name' : '/'+AD_ID+'/RC_160_by_600_top',
        'class' : 'RC-AD-SKY-TOP',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-1' : { // NOT IN PUBLIR 264
        'sizes' : [
            [160, 600]
        ],
        'name' : '/'+AD_ID+'/RC_160_by_600_bottom',
        'class' : 'RC-AD-SKY-BOTTOM',
        'loaded' : false,
        'closeable_pages' : []
    },
    'div-gpt-ad-1416850836025-5' : { // NOT IN PUBLIR 264
        'sizes' : [
            [300, 250]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_widget',
        'class' : 'RC-AD-BOX-WIDGET',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1340813990105-0' : { // NOT IN PUBLIR 264
        'sizes' : [
            [320, 50]
        ],
        'name' : '/'+AD_ID+'/RC_mobile',
        'class' : 'RC-AD-MOBILE-BANNER',
        'loaded' : false,
        'closeable_pages' : ['home', 'article', 'polls', 'video', 'maps', 'elections'],
        'styles' : {'background': '#fff'}, //needs to be an object
        'slot_definition' : null,
        'refresh_time': 20000, //refresh this ad every 30 seconds
    },
    'div-gpt-ad-welcome' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [1, 1]
        ],
        'name' : '/'+AD_ID+'/RC_1_by_1_welcome',
        'class' : 'RC-AD-WELCOME',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1416850836025-7' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [250,180]
        ],
        'name' : '/'+AD_ID+'/RC_Lc',
        'class' : 'RC-AD-LC',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
        'refresh_time': 600000, //refresh this ad every 10 minutes
        'no_refresh': true, // don't refresh this ad
    },
    'div-gpt-ad-1601314966506-0' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [216, 40] /*, [250,250], [250,360], */
        ],
        'name' : '/'+AD_ID+'/RC_Lc_2',
        'class' : 'RC-AD-LC-2',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
        'refresh_time': 600000, //refresh this ad every 10 minutes
    },
    'div-gpt-ad-1448303538392-0' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [970,90],[970,250]
        ],
        'name' : '/'+AD_ID+'/RC_970_by_90',
        'class' : 'RC-AD-TOP-BANNER-BIG',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-8' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [300, 250]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_carousel',
        'class' : 'RC-AD-BOX-MOBILE_1',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1390595004947-9' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [300, 250]
        ],
        'name' : '/'+AD_ID+'/RC_300_by_250_house',
        'class' : 'RC-AD-BOX-MOBILE_2',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
    'div-gpt-ad-1496845181660-0' : { // NOT IN PUBLIR 264, 369
        'sizes' : [
            [1, 1]
        ],
        'name' : '/'+AD_ID+'/RC_1_by_1_tynt',
        'class' : 'RC-AD-TYNT',
        'loaded' : false,
        'closeable_pages' : [],
        'slot_definition' : null,
    },
};

var LAZY_ADS_ENABLED = false;
if (typeof SITE_INFO['lazy_ads'] !== 'undefined' && SITE_INFO['lazy_ads'] == true) {
    LAZY_ADS_ENABLED = true;
}

var PREBIDDING_ENABLED = false;
if (typeof SITE_INFO['prebid_src'] !== 'undefined' && SITE_INFO['prebid_src'] != '') {
    PREBIDDING_ENABLED = true;
}

////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function readCookie(name) {

    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function createCookie(name, value, days, expire_in_hours) {

    if (days) {
        //allows us to set cookie expirations based on hours rather than days
        if (typeof expire_in_hours !== 'undefined' && expire_in_hours == true) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/; domain=." + getDomain() + "";
}

//used with createcookie function to match domain
function getDomain() {

    var path = window.location.host;
    if (path.substr(0, 3) == 'www') {
        var per = path.indexOf('.')
        per = per + 1;
        path = path.substr(per);
    }
    return path;
}

function eraseCookie(name) {

    createCookie(name, "", -1);
}

////////////////////////////////////////////////////////////////////////////////
// CARBON ADS ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function init_carbon_analytics(){
    !function(a,l,b,c,k,s,t,g,A){a.CustomerConnectAnalytics=k,a[k]=a[k]||function(){
        (a[k].q=a[k].q||[]).push(arguments)},g=l.createElement(b),A=l.getElementsByTagName(b)[0],
        g.type="text/javascript",g.async=!0,g.src=c+"?id="+s+"&parentId="+t,A.parentNode.insertBefore(g,A)
        }(window,document,"script","//carbon-cdn.ccgateway.net/script","cca",window.location.hostname,"761b5fa204");        
}

function init_ads(){
    !function(a,e){a.cca=a.cca||{},a.cca.tapPrebidQue=[],a.cca.tapGAMQue=[];var n=a.cca;a.pbjs=a.pbjs||{que:[]};var t=a.pbjs;t.que.push(function(){t.onEvent("bidWon",function(a){n.tapReady||n.tapPrebidQue.push(JSON.stringify(a))})}),a.googletag=a.googletag||{cmd:[]};var c=a.googletag;c.cmd.push(function(){c.pubads().addEventListener("slotRenderEnded",function(a){n.tapReady||n.tapGAMQue.push(a)})})}(window);
}

function init_targeting(){
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(function () {
        if (window.googletag.pubads().getTargeting('carbon_segment').length === 0) {
            var carbon = JSON.parse(window.localStorage.getItem('ccRealtimeData'));
            window.googletag.pubads().setTargeting('carbon_segment', carbon ? carbon.audiences.map(function (i) { return i.id; }) : []);
        }
    });
}

function init_carbon_ads(){
    init_carbon_analytics();
    init_ads();
    init_targeting();
}


////////////////////////////////////////////////////////////////////////////////
// ADMIRAL GDPR ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

window.gdpr_header = true;
window.run_loadAds = false;
window.gptWasAdded = false;
window.gpt_loaded_num = 0;

// Check if eu-cookie exists
if (typeof SITE_INFO['admiral_enabled'] !== 'undefined' && SITE_INFO['admiral_enabled']) {
    load_admiral();
} else {
    addGPTTag();
}

function admiral_onerror() {
    
    // In case of admiral script being blocked, just run rest of ad loading process.
    if(typeof admiral_has_error === 'undefined' || admiral_has_error == false) { // so we only load once
        console.log("Admiral blocked. Proceed with rest of ad script.");
        window.admiral_has_error = true;
        addGPTTag();
    }
}

function load_admiral() {
    
    ///////////////////////////////
    // START ADMIRAL SCRIPT CALL //
    ///////////////////////////////
    // Customizations are: onerror functions, and SITE_INFO for src
    !(function(o, n, t) {
        t = o.createElement(n), o = o.getElementsByTagName(n)[0], t.async = 1, t.setAttribute("onerror", "admiral_onerror()"), t.src = SITE_INFO['admiral_url_1'], o.parentNode.insertBefore(t, o)
    })(document, "script"), (function(o, n) {
        o[n] = o[n] || function() {
            (o[n].q = o[n].q || []).push(arguments)
        }
    })(window, "admiral");
    !(function(c, e, o, t, n) {
        function r(o, t) {
            (function n() {
                try {
                    return 0 < (localStorage.getItem("v4ac1eiZr0") || "").split(",")[4]
                } catch (o) {}
                return !1
            })() && (t = c[e].pubads()) && t.setTargeting("admiral-engaged", "true")
        }(n = c[e] = c[e] || {}).cmd = n.cmd || [], typeof n.pubads === o ? r() : typeof n.cmd.unshift === o ? n.cmd.unshift(r) : n.cmd.push(r)
    })(window, "googletag", "function");;;
    !(function(a, i, t, e) {
        var n = i[t];
        !(function r() {
            if (!window.frames[e]) {
                var t = a.body;
                if (t) {
                    var n = a.createElement("iframe");
                    n.style.display = "none", n.name = e, t.appendChild(n)
                } else setTimeout(r, 5)
            }
        })();
        var c = [];

        function o(i) {
            if (i && i.data) {
                var e, t = "__tcfapiCall",
                    c = "string" == typeof i.data && 0 <= i.data.indexOf(t);
                (e = c ? ((function a(t) {
                    try {
                        return JSON.parse(t)
                    } catch (n) {}
                })(i.data) || {})[t] : (i.data || {})[t]) && n(e.command, e.version, function(t, n) {
                    var a = {
                        __tcfapiReturn: {
                            returnValue: t,
                            success: n,
                            callId: e.callId
                        }
                    };
                    i.source.postMessage(c ? JSON.stringify(a) : a, "*")
                }, e.parameter)
            }
        }
        "function" != typeof n && (n = i[t] = i[t] || function f() {
            for (var t = [], n = 0; n < arguments.length; n++) t.push(arguments[n]);
            if (!t.length) return c;
            "ping" === t[0] ? t[2]({
                gdprAppliesGlobally: !!i.__cmpGdprAppliesGlobally,
                cmpLoaded: !1,
                cmpStatus: "stub"
            }) : 0 < t.length && c.push(t)
        }, i.addEventListener ? i.addEventListener("message", o, !1) : i.attachEvent && i.attachEvent("onmessage", o))
    })(document, window, "__tcfapi", "__tcfapiLocator");;
    !(function(t, n, i, u, e, o) {
        var a = n[i];

        function r(t) {
            if (t) {
                var u = (t.data || {})[i + "Call"];
                u && n[i](u.command, u.version, function(n, i) {
                    t.source.postMessage({
                        __uspapiReturn: {
                            returnValue: n,
                            success: i,
                            callId: u.callId
                        }
                    }, "*")
                })
            }
        }
        if ((function c() {
                if (!window.frames[u]) {
                    var n = t.body;
                    if (n) {
                        var i = t.createElement("iframe");
                        i.style.display = "none", i.name = u, n.appendChild(i)
                    } else setTimeout(c, 5)
                }
            })(), "function" != typeof a) {
            var s = {
                getUSPData: function(n, i) {
                    return n !== 1 ? i && i(null, !1) : i && i({
                        version: null,
                        uspString: null
                    }, !1)
                }
            };
            a = n[i] = function(n, i, t) {
                return s[n](i, t)
            }, n.addEventListener ? n.addEventListener("message", r, !1) : n.attachEvent && n.attachEvent("onmessage", r)
        }
        o = t.createElement(e), t = t.getElementsByTagName(e)[0], o.setAttribute("onerror", "admiral_onerror()"), o.src = SITE_INFO['admiral_url_2'], t.parentNode.insertBefore(o, t)
    })(document, window, "__uspapi", "__uspapiLocator", "script");
    /////////////////////////////
    // END ADMIRAL SCRIPT CALL //
    /////////////////////////////
    
    // Create callback
    admiral("after", "cmp.loaded", function (data) {

        var gdpr_applies = false;
        if (data.gdprAppliesGlobally || data.euVisitor) {
            gdpr_applies = true;
        }
        // Keep track of whether GPT tag was loaded

        if (gdpr_applies && !data.consentKnown) {
            // If GDPR applies based on your configuration, but
            // no choice has been made, then don't load GPT tag
            // until the user has made a choice
            admiral("after", "cmp.updated", function () {
                addGPTTag();
            });
        } else {
            // If GDPR doesn't apply based on your configuration,
            // or if there is prior consent, then load the GPT tag
            addGPTTag();
        }
    });
}

function addGPTTag() {

    if (gptWasAdded) return;

    // Load Moat on approved sites
    if( ['politics','policy'].indexOf(SITE_NAME) > -1 ) {
        load_moat();
    }

    var el = document.createElement("script");
    el.src = "https://www.googletagservices.com/tag/js/gpt.js";
    el.async = true;
    el.onreadystatechange = gpt_loaded;
    el.onload = gpt_loaded;
    el.onerror = function(e){
        gpt_loaded();
    }

    document.querySelector('head').appendChild(el);

    if (PREBIDDING_ENABLED) {
        var prebid_el = document.createElement("script");
        prebid_el.src = SITE_INFO['prebid_src'];
        prebid_el.id = 'headerbidder';
        prebid_el.async = true;

        // if prebid call gpt loaded here
        prebid_el.onreadystatechange = gpt_loaded;
        prebid_el.onload = gpt_loaded;
        prebid_el.onerror = function(e){
            gpt_loaded();
        }

        document.querySelector('head').appendChild(prebid_el);
    }

    gptWasAdded = true;
}

function gpt_loaded() {

    // if prebid enabled, this needs to check to make sure gpt_loaded has been called twice
    gpt_loaded_num++;
    if(PREBIDDING_ENABLED && gpt_loaded_num < 2) {
      return;
    }

    // Wait until MOAT loaded, if an attempt to load it was made
    if(typeof window.moat_loaded_on_realclear != 'undefined' && !window.moat_loaded_on_realclear) {
        return;
    }

    window.run_loadAds = true;
    if (typeof evolok_init !== 'undefined') {
        evolok_init();
    }

    // Load Carbon on approved sites
    if( [
        'politics','books','health','education','energy',
        'religion','policy','investigations','history',
        'world','defense','markets','science'
    ].indexOf(SITE_NAME) > -1 ) {
        //init_carbon_ads(); // Disabled
    }
}

function load_moat() {

    window.moat_loaded_on_realclear = false;

    var el = document.createElement("script");
    el.src = "https://z.moatads.com/realclearmediaheader300485513262/moatheader.js";
    el.async = true;
    el.onload = function() {
        window.moat_loaded_on_realclear = true;
        gpt_loaded();
    };
    el.onerror = function(e){
        window.moat_loaded_on_realclear = true; // allows evolok to init even when adblock being used
        console.log("Error loading MOAT.");
    };
    
    document.querySelector('head').appendChild(el);
}

function mbid_iframe_insert()
{
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute('title', 'Mbid cookie-sync' );
    ifrm.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    ifrm.setAttribute("src", "https://mbid.marfeelrev.com/static/cookie-sync.html");
    ifrm.style.width = "1px";
    ifrm.style.height = "1px";
    ifrm.style.display = 'none';

    document.addEventListener("DOMContentLoaded", function() {
        document.body.appendChild(ifrm);
    });
}

mbid_iframe_insert();