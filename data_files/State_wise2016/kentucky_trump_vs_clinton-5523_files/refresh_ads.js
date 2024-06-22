var ads_refresh_queue = [];
var ads_refresh_queue_interval = null;
// var dont_refresh_ads = [];
// var dont_refresh_class = [];

// function changeDef(e){
//     for (var ad_slot in ads_info) { // loop through all ads
//         for(var i = 0; i < e.composedPath().length; i++){
//             if(e.composedPath()[i].id == ad_slot){
//                 console.log("AD SLOT CHANGED", ad_slot);
//                 dont_refresh(ad_slot);
//             }
//         }
//     }
// }

// function dont_refresh(ad_slot){
//     ads_refresh_queue.forEach(function(element, indice, array) { // loop through refresh queue
//         if(element.ad_id == ad_slot){ // check ad id is the same as the one we are looking for
//             // dont_refresh_ads.push(ads_refresh_queue[indice]); // add ad to dont refresh array
//             // ads_refresh_queue[indice].class += " dont-refresh"; // add class to ad slot
//             ads_refresh_queue[indice].dont_refresh = true; // add class to ad slot
//             ads_refresh_queue[indice].refresh_time = 86400; // set refresh time to max
//             console.log(ads_refresh_queue[indice]);
//             // console.log('AD DELETE FROM REFRESH ARRAY', dont_refresh_ads[dont_refresh_ads.length - 1]);
//             // ads_refresh_queue.splice(indice, 1); // delete ad from refresh queue
//             return;
//         }
//     });
// }
// document.addEventListener('mouseover', changeDef);
// document.addEventListener('onclick', changeDef);

if(typeof createCookie != 'function') {
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

if(typeof eraseCookie != 'function') {
    function eraseCookie(name) {
        createCookie(name,"",-1);
    }
}

if(typeof getDomain != 'function') {
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

function auto_refresh_ads_service(){

    // console.log("INIT AUTO REFRESH ADS SERVICE");

    // ads_refresh_queue
    ads_refresh_queue_interval = setInterval(function() {
        
        var now = get_ad_refresh_time();
        // console.log("AUTO REFRESH QUEUE INTERVAL RUN AT ", now, ads_refresh_queue);
        // console.log("BROSER VISIBILITY", browser_tab_is_visible);

        if(browser_tab_is_visible == false){
            // console.log("BROWSER TAB IS NOT ACTIVE");
            return;
        }
        
        if(ads_refresh_queue.length == 0){
            // console.log("NOTHING IN QUEUE TO REFRESH");
            return;
        }

        for (let i = (ads_refresh_queue.length - 1); i >= 0; i--) {
            
            var ad_slot     = ads_refresh_queue[i];
            var selector    = '#'+ad_slot.ad_id;
            
            // if(ad_slot.dont_refresh == true){
            //     console.log(ad_slot);
            //     return;
            // }

            // console.log("CHECKING IF THIS SLOT SHOULD REFRESHED", ad_slot, i);
            // console.log("IS VISIBLE: ", $(selector).is(':visible'), "IS IN VIEWPORT: ", $(selector).inViewport());

            if( ad_slot.in_process_to_refresh == true ){
                // console.log("AD IS ALREADY IN THE PROCESS OF BEING REFRESHED", ad_slot.class);
                continue;
            }

            if( $(selector).length == 0 ){
                ads_refresh_queue.splice(i, 1);
                continue;
            }
            
            // console.log("ELEMENT: ", selector);
            
            if( check_ad_slot_visiblity(selector) ){

                // if ad has already gone through the count down refresh it as soon as possible
                if( ad_slot.refresh_asap == true ){
                    
                    // console.log("REFRESHING THIS SLOT ASAP", ad_slot);
                    refresh_ad_slot(ad_slot);
                    ads_refresh_queue.splice(i, 1);

                // else count down to refresh it
                }else{
                    ads_refresh_queue[i].in_process_to_refresh = true;
                    run_ad_delay_refresh_test(ad_slot, selector);
                }
            }
        }

    }, 2000);
}

function run_ad_delay_refresh_test(ad_slot, selector){
    // if(ad_slot.dont_refresh == true){
    //     console.log(ad_slot);
    //     return;
    // }

    var index = null;

    setTimeout(function() {
        
        // if still visible / in viewport trigger refresh
        if( check_ad_slot_visiblity(selector) ){

            var refresh_time = ( typeof ad_slot.refresh_time !== 'undefined' && ad_slot.refresh_time !== null && ad_slot.refresh_time > 0 ) ? ad_slot.refresh_time : 40000;

            setTimeout(function(){

                index = get_queue_ad_index_by_id(ad_slot.ad_id);

                // if not visible after the count down then don't refresh but set to refresh asap
                if(browser_tab_is_visible == false || check_ad_slot_visiblity(selector) == false){
                    // console.log("AD NOT VISIBLE ON COUNT DOWN END", ad_slot);
                    ads_refresh_queue[index].refresh_asap           = true;
                    ads_refresh_queue[index].in_process_to_refresh  = false;
                    return;
                }
                
                // console.log("REFRESHING THIS SLOT", ad_slot);
                refresh_ad_slot(ad_slot);

                if(index > -1){
                    ads_refresh_queue.splice(index, 1);
                }

            }, (refresh_time - 2000));

        // else revert that the ad is in the process of being refreshed
        }else{

            index = get_queue_ad_index_by_id(ad_slot.ad_id);
            
            if(index > -1){
                ads_refresh_queue[index].in_process_to_refresh = false;
            }

        }

    }, 2000);
}

function get_queue_ad_index_by_id(id){
    return ads_refresh_queue.map(function(x){ return x.ad_id}).indexOf(id);
}

function refresh_ad_slot(ad_slot){
    // if(ad_slot.dont_refresh == true){
    //     console.log(ad_slot);
    //     return;
    // }
    if(typeof PREBIDDING_ENABLED !== 'undefined' && PREBIDDING_ENABLED == true) {

        console.log("REFRESH WITH PREBID", ad_slot);
        pbjs.que.push(function() {
            pbjs.requestBids({
                timeout: PREBID_TIMEOUT, //set by publir
                adUnitCodes: [ad_slot.ad_id],
                bidsBackHandler: function() {
                    pbjs.setTargetingForGPTAsync([ad_slot.ad_id]);
                    googletag.pubads().refresh([ad_slot.slot_definition]);
                }
            });
        });

    }else{
        
        console.log("REFRESH WITHOUT PREBID", ad_slot);
        googletag.cmd.push(function() {
            googletag.pubads().refresh([ad_slot.slot_definition]);
        });
    }

}

function check_ad_slot_visiblity(selector){
    return $(selector).is(':visible') === true && $(selector).inViewport() == true;
}

/**
 * In master.js but in case master.js is not included like on 3rd party widgets
 */
if( typeof browser_tab_is_visible === 'undefined' ){

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
            createCookie('browser_tab_is_visible',1, 1);
        }
    }

}

function add_to_refresh_queueu(ad_render_event){
    
    try{
        var ad_slot = find_ad_slot_from_event(ad_render_event);
    }catch(e){
        // console.log("Unable to find ad slot to queue", e);

        return;
    }

    // if(ad_slot.dont_refresh == true){
    //     console.log(ad_slot);
    //     return;
    // }

    // console.log("add_to_refresh_queueu", ad_slot);

    /**
     * Check if ad has already been added to refresh queue so as to not add that ad twice
     */
    var index = ads_refresh_queue.map(function(ad){
        return ad.ad_id;
    }).indexOf(ad_slot.ad_id);

    if(index == -1 && (typeof ad_slot.no_refresh == 'undefined' || ad_slot.no_refresh == false) ){

        ad_slot.queued_at = get_ad_refresh_time();
        ads_refresh_queue.push(ad_slot);  

    }
}

function find_ad_slot_from_event(event){

    var slot_name = event.slot.getAdUnitPath();
    // console.log("FIND AD SLOT FROM EVENT", ads_info, event);

    for (var key in ads_info) {
        
        if( ads_info[key].name == slot_name ){
            var copy_ad = ads_info[key];
            copy_ad.ad_id = key;

            // once ad is set to start refreshing this becomes true
            copy_ad.in_process_to_refresh   = false;

            // if ad has run it's refresh count down but wasn't visible refresh asap when possible
            copy_ad.refresh_asap            = false;
            
            return copy_ad;
        }
    }

    throw new Error("Ad not found");
}

function get_ad_refresh_time(){
    return parseInt(new Date().getTime() / 1000);
}
