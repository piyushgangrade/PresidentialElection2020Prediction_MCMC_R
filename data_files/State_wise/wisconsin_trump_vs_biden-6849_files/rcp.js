//RCP SCRIPTING

/* Confiant dfp ad security */
/* Wrapper for RealClearPolitics, generated on 2018-06-04T11:10:43-04:00 */

// If page with first URL segment matches, use Confiant
var confiant_list = {
  //'home'     : true, // 'home' isn't a url segment, but we use this when no segment found
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


var notif_banner =  '<div id="large_notif_wrapper" class="nt_fixed" style="display:none;">\
                        <span class="close pointy push_right close_large_notif"></span>\
                        <div id="large_notif_container">\
                            <div id="large_notif_content">\
                                <div id="large_notif_text">\
                                    <p>Would you like to receive browser notifications?</p>\
                                </div>\
                                <div id="large_notif_button">\
                                    <button type="button" class="notif_btn notif_btn_action" id="enable_notifications">Enable</button>\
                                </div>\
                            </div>\
                            <div id="notif_banner_content" style="display: none;">\
                                <div id="notif_banner_text">\
                                    <p>Receive browser notifications?</p>\
                                </div>\
                                <div id="notif_banner_button">\
                                    <button type="button" class="notif_btn notif_btn_action banner_notif_button" id="enable_notifications">Enable</button>\
                                </div>\
                            </div>\
                        </div>\
                    </div>';

$(document).ready(function(){


  //notifications functions
  /*var n_browser = navigator.browserInfo.browser;
    var n_os = navigator.osInfo.os;
    //var banner_cook = readCookie('notification_banner');
    if(!banner_cook){
      if(notif_browser(n_browser) && notif_os(n_os) && siteName == "politics"){
            $(notif_banner).prependTo('body');
            var window_width = $(document).width();
            setTimeout(function(){
                if(window_width < 768){
                    $('#masthead-container').css('margin-top', '93px');
                    if(!$("body").hasClass("home")){
            $('#large_notif_wrapper').css({'top':'0', 
                            'position':'fixed'});
            $('#masthead-wrapper').css('top', '93px');
            $('#container').css('padding-top', '103px');
          }
              }else{
                if(!$("body").hasClass("home")){
            $('#large_notif_wrapper').css({'top':'0', 
                            'position':'fixed'});
            $('#masthead-wrapper').css('top', '150px');
            $('#container').css('padding-top', '150px');
          }
              }

                $('#large_notif_wrapper').slideDown();

                var bc = $("body").attr("class");
                _gaq.push(['_trackEvent', 'Notifications', 'Auto Top Banner', bc, null, true]);
            }, 1000);

          setTimeout(function(){
            if(!$('#notif_banner_content').is(':visible')){
              switch_to_banner(window_width);
            }
          }, 10000);
          createCookie('notification_banner','1','30');
      }
    }*/
    //end of notifications function
    

  /*
  //NEWSINC VIDEO IN-BODY 
  //data-config-video-id="30389281"
    newsinc_output = '<div class="ndn_article_body_title">Article Continues Below</div><div class="ndn_separator"></div><div class="ndn_embed" data-config-widget-id="2" style="width:638px;height:359px" data-config-type="VideoPlayer/Single" data-config-tracking-group="12672" data-config-playlist-id="993" data-config-site-section="realclear"></div><div class="ndn_separator"></div';

    //ADD BEFORE 6TH PARAGRAPH
    $( "div.article-body-text p" ).each(function( index ) {
        //console.log( index + ": " + $( this ).text() );
        if(index==5){
            $(this).prepend(newsinc_output);
        }
    });
    //LOAD NEWSINK SCRIPT
    var s_bk =document.createElement('script'); 
    s_bk.type='text/javascript'; 
    s_bk.async=true;  
    s_bk.src='//launch.newsinc.com/js/embed.js';
    var x_bk=document.getElementsByTagName('script')[0];
    x_bk.parentNode.insertBefore(s_bk,x_bk);
    */

    /*
    //LOCKERDOME POLITICS ARTICLE AD 
  $('#comments-container').after('<div class="clear" style="margin-top:10px;"></div><div class="ndn_article_body_title">Advertisement</div><div id="ld-8584-1267"></div>');
  (function(w,d,s,i){
    w.ldAdInit=w.ldAdInit||[];
    w.ldAdInit.push({
      slot:8988720963702375,
      size:[0, 0],
      id:"ld-8584-1267"
    }); 
    if(!d.getElementById(i)){
      var j=d.createElement(s),p=d.getElementsByTagName(s)[0];
      j.async=true;
      j.src="//cdn2.lockerdome.com/_js/ajs.js";
      j.id=i;p.parentNode.insertBefore(j,p);
    }
  })(window,document,"script","ld-ajs");    */

    //click handlers for custom topic pages
    //top promotional articles
    $('body.custom-topic .promos2014 a').on('click', function(event){
        event.preventDefault();
        entry_id = $(this).attr('data-entry-id');
        link_url = $(this).attr('href');
        title = $(this).text().replace('’',"'");

        trackclick_cross_domain(event, entry_id, title, siteName, 'Custom Topic: ', 'Top promo articles' );
    });

    //most recent articles
    //top promotional articles
    $('body.custom-topic .recent-articles a').on('click', function(event){
        event.preventDefault();
        entry_id = $(this).attr('data-entry-id');
        link_url = $(this).attr('href');
        title = $(this).text().replace('’',"'");

        trackclick_cross_domain(event, entry_id, title, siteName, 'Custom Topic: ', 'Recent articles' );

    });

    //click handler for the beta links
    $('body.custom-topic .beta .module a').on('click', function(event){
        event.preventDefault();
        entry_id = '';
        link_url = $(this).attr('href');
        title = $(this).text().replace('’',"'");

        section_title = $(this).closest('.module').find('h4').text();

        trackclick_cross_domain(event, entry_id, title, siteName, 'Custom Topic: ', section_title );

    });

    //click handler for usafacts widget
    if( $('.beta .usafacts').length ) {
      $('.beta .usafacts a').on('click', function(event){
          event.preventDefault();
          entry_id = '';
          link_url = $(this).attr('href');
          title = 'USAFacts Sidebar';
          section_title = 'polls';

          trackclick_cross_domain(event, entry_id, title, siteName, 'Custom Widget: ', section_title );

      });
    }

    

});



//notifications functions
function switch_to_banner(window_width){
  $('#large_notif_content').slideUp();
  $('#large_notif_wrapper').addClass('notif_banner');
  $('#notif_banner_content').show();
  if(!$("body").hasClass("home")){
    $('#container').css('padding-top', '45px');
    $('#masthead-wrapper').css('top', '35px');
  }
  if(window_width >= 768){
      $('#container').css('padding-top', '35px');
  }else{
      $('#masthead-container').css('margin-top', '35px');
      $('.flex-viewport').css('margin-top', '35px');

  }
}

$(document).on('click', '.notif_btn_action', function(){
    /*var commenter_id = readCookie('realclear_user');
    if(!commenter_id){
        commenter_id = 0;
    }
    var this_url = encodeURIComponent(location.href);
    var bc = $("body").attr("class");
    _gaq.push(['_trackEvent', 'Notifications', 'Click', 'Banner Enable']);
    var notif_url = 'https://notifications.realclearpolitics.com/web_notifications/sign_up.html?';
    var query_string = 'site_shortname='+global_data_loc+'&site='+siteName+'&section='+bc+'&auto_list_ids='+auto_list_ids+'&commid='+commenter_id+'&url='+this_url+'&enable=1';
    window.location = notif_url+query_string;*/
    /*
    * Disabled notifications temporary
    * */
    //notifs.register();
});

$(document).on('click', '.close_large_notif', function(){
    $('#large_notif_wrapper').hide();
    $('#notif_banner_content').hide();
    $('#large_notif_content').hide();
    $('#container').css('padding-top', '0px');
    $('#masthead-container').css('margin-top', 'inherit');
    $('.flex-viewport').css('margin-top', 'inherit');

    if(!$("body").hasClass("home")){
      $('#masthead-wrapper').css('top', '0');
    $('#container').css('padding-top', '10px');
    $('.progress-bar').css('top', '0');
  }
    notif_banner_enabled = false;
});
//end of notifications function

$(document).ready(function(){
  if( $("body").hasClass("home") || $("body").hasClass("polls") ){
    
    window.rcp_page_refresh_interval = setInterval(function() {
      //console.log("reload page interval");
      Utils.global_settings.link_clicked =  true;

      //create DST FLAG cookie if 1) autorefresh event, and 2) ON a non-active tab
      //console.log('browser_visible: '+browser_tab_is_visible);
      if(readCookie('autorefresh') == null && browser_tab_is_visible==false){
          makeCookieautoRefreshCookie('autorefresh',1); 
      }
      
      // if modal shown exit early
      if(typeof admiral_gdpr_modal_active !== 'undefined' && admiral_gdpr_modal_active === true){
        return;
      }

      window.location.reload();

    }, 360000); //6mins 

  }else if( !$("body").hasClass("video") && !$("body").hasClass("dash") && !$("body").hasClass("article") && !$("body").hasClass("static") && !$("body").hasClass("custom-topic") ){
    //refresh all pages except video, dash, article, static, custom-topics
    window.rcp_page_refresh_interval = setInterval(function() {
      //console.log("reload page interval");
      Utils.global_settings.link_clicked =  true;

      //create DST FLAG cookie if 1) autorefresh event, and 2) ON a non-active tab
      //console.log('browser_visible: '+browser_tab_is_visible);
      if(readCookie('autorefresh') == null && browser_tab_is_visible==false){
          makeCookieautoRefreshCookie('autorefresh',1); 
      }

      
      window.location.reload();

    }, 600000); //10mins
  }

  // on create your own map poll pages don't refresh
  if( $("body").hasClass("maps") && window.location.pathname.indexOf('create_your_own') > -1 ){
    clearInterval(window.rcp_page_refresh_interval);
  }

});



// Polls

var advanced_filter_data = {};

$(function(){

  // Create widgets
  create_widgets();

  // More Polling Data button

  if($('#more_table_data').length > 0)
  {
    $('#more_table_data').click(function()
    {
      add_spinner($('#more_table_data_footer .spinner'));
      get_table_data();
    });
  }

  // Embed Chart

  if($('.chart_wrapper .embed .embed_link').length > 0)
  {
    $('.chart_wrapper .embed .embed_link').click(function()
    {
      $('.chart_wrapper .embed_container').toggle();
    });

    $('.chart_wrapper .embed_container #widget_close').click(function()
    {
      $('.chart_wrapper .embed_container').toggle();
    });

    $('#widget_preview').click(function(){
      jQuery.facebox({ div: '#embed_widget' })
      $('#embed_facebox').html('<div id="embed_widget">'+$('#embed_iframe').val()+'</div>');
      var content=$('#embed_facebox').html();
      jQuery.facebox(content);
    });

    $('.widget_size').click(function(){
      $('#widget_custom_width').val('');
      $('.widget_size').removeClass('on');
      $('.widget_custom').removeClass('on');
      $(this).addClass('on');
      var size=$(this).attr('name');
      var poll_id=$('#poll_id').val();
      var clean_poll_title=$('#clean_poll_title').val();
      $('#embed_code').val('<script type="text/javascript" src="http://charts.realclearpolitics.com/widget_embed.js?id='+poll_id+'&width='+size+'&height=338&key='+clean_poll_title+'"></script>');
      $('#embed_iframe').val('<iframe src="http://charts.realclearpolitics.com/widget_embed.html?id='+poll_id+'&width='+size+'" width="'+size+'" height="338" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>');
    });

    $('#widget_custom_width').click(function(){
      $('.widget_size').removeClass('on');
      $('.widget_custom').addClass('on');
    });

    $('#widget_custom_width').keyup(function(){
      var size=$(this).val();
      var poll_id=$('#poll_id').val();
      var clean_poll_title=$('#clean_poll_title').val();
      if(size!=parseInt(size)){
        size=450
      }else if(size<180){
        size=450
      }
      $('#embed_code').val('<script type="text/javascript" src="http://charts.realclearpolitics.com/widget_embed.js?id='+poll_id+'&width='+size+'&height=338&key='+clean_poll_title+'"></script>');
      $('#embed_iframe').val('<iframe src="http://charts.realclearpolitics.com/widget_embed.html?id='+poll_id+'&width='+size+'" width="'+size+'" height="338" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>');
    });
  }

  init_quick_links_advanced_filter();

  // Stackable responsive tables
  /*if($('#polling-data-rcp table.data.large').length > 0 || $('#polling-data-full table.data.large').length > 0 )
  {
    $('#polling-data-rcp table.data.large, #polling-data-full table.data.large').stacktable();
    $('#polling-data-full table.data.large').stacktable();
  }*/
});

///////////////////////////////////
// QUICK LINKS / ADVANCED FILTER //
///////////////////////////////////

function init_quick_links_advanced_filter() {

  // Quick links

  // Overlay opens quick links (the first time only)
  if( $('.polls_header_dropdown .quick_links_content .overlay').length > 0 )
  {
    $('.polls_header_dropdown .quick_links_content .overlay').click(function()
    {
      /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
        $(this).parent().parent().find('.quick_links_content').removeClass('preview');
      }*/
      toggle_dropdown_content($(this).parent());
    });
  }

  if($('.polls_header_dropdown .open .quick_links_title').length > 0)
  {
    $('.polls_header_dropdown .open .quick_links_title').click(function()
    {
      /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
        $(this).parent().parent().find('.quick_links_content').removeClass('preview');
      }*/
      toggle_dropdown_content($(this).parent().parent().find('.quick_links_content'));
    });
  }

  if($('.polls_header_dropdown .open .arrow').length > 0)
  {
    $('.polls_header_dropdown .open .arrow').click(function()
    {
      if( $('.polls_header_dropdown .quick_links_content').is(':visible') ) {
        /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
          $(this).parent().parent().find('.quick_links_content').removeClass('preview');
        }*/
        toggle_dropdown_content($(this).parent().parent().find('.quick_links_content'));
      } else if( $('.polls_header_dropdown .filter_content').is(':visible') ) {
        toggle_dropdown_content($(this).parent().parent().find('.filter_content'));
      } else {
        toggle_dropdown_content($(this).parent().parent().find('.quick_links_content'));
      }
    });
  }

  if($('.polls_header_dropdown .open .filter_title').length > 0)
  {
    $('.polls_header_dropdown .open .filter_title').click(function()
    {
      toggle_dropdown_content($(this).parent().parent().find('.filter_content'));
    });
  }
  if( $('.polls_header_2_dropdown .quick_links_content .overlay').length > 0 )
  {
    $('.polls_header_2_dropdown .quick_links_content .overlay').click(function()
    {
      /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
        $(this).parent().parent().find('.quick_links_content').removeClass('preview');
      }*/
      toggle_dropdown_2_content($(this).parent());
    });
  }

  if($('.polls_header_2_dropdown .open .quick_links_title').length > 0)
  {
    $('.polls_header_2_dropdown .open .quick_links_title').click(function()
    {
      /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
        $(this).parent().parent().find('.quick_links_content').removeClass('preview');
      }*/
      toggle_dropdown_2_content($(this).parent().parent().find('.quick_links_content'));
    });
  }

  if($('.polls_header_2_dropdown .open .arrow').length > 0)
  {
    $('.polls_header_2_dropdown .open .arrow').click(function()
    {
      if( $('.polls_header_2_dropdown .quick_links_content').is(':visible') ) {
        /*if($(this).parent().parent().find('.quick_links_content.preview').length > 0) {
          $(this).parent().parent().find('.quick_links_content').removeClass('preview');
        }*/
        toggle_dropdown_2_content($(this).parent().parent().find('.quick_links_content'));
      } else if( $('.polls_header_2_dropdown .filter_content').is(':visible') ) {
        toggle_dropdown_2_content($(this).parent().parent().find('.filter_content'));
      } else {
        toggle_dropdown_2_content($(this).parent().parent().find('.quick_links_content'));
      }
    });
  }

  if($('.polls_header_2_dropdown .open .filter_title').length > 0)
  {
    $('.polls_header_2_dropdown .open .filter_title').click(function()
    {
      toggle_dropdown_2_content($(this).parent().parent().find('.filter_content'));
    });
  }

  // Load advanced filter races
  if($('#af_year').length > 0)
  {
    var af_url = "/epolls/includes/advanced_filter.json";
    var af_year = "2023"; // Just a default value

    if( typeof $('.polls_header_2_dropdown').attr('data-year') !== 'undefined' ) {
      af_year = $('.polls_header_2_dropdown').attr('data-year');
    }
    if(af_year == '2018_test') {
      af_year = '2018';
    }
    if(af_year == '2019') {
      af_year = '2020';
    }
    if( parseInt(af_year) < 2016) {
      af_year = '2023';
    }
    if( af_year != '2016') {
      af_url = "/epolls/includes/advanced_filter_"+af_year+".json";
    }
    $.getJSON(af_url, function(data)
    {
      advanced_filter_data = data;

      auto_suggest_races();

      var year_html = '';
      var state_html = '';
      var type_html = '';
      var state_arr = [];
      var type_arr = [];

      for(var i = 0; i < data.year_data.length; i++)
      {
        year_html += '<option value="'+data.year_data[i].year_id+'">'+data.year_data[i].year_name+'</option>';

        for(var j = 0; j < data.year_data[i].year_states.length; j++)
        {
          state_arr[parseInt(data.year_data[i].year_states[j]['id'])] = data.year_data[i].year_states[j]['state'];
        }
        for(var j = 0; j < data.year_data[i].year_types.length; j++)
        {
          type_arr[parseInt(data.year_data[i].year_types[j]['id'])] = data.year_data[i].year_types[j]['races'];
        }
      }

      for(var i = 0; i < state_arr.length; i++)
      {
        if(typeof state_arr[i] !== 'undefined')
        {
          if(i == 61) { // National, put on top
            state_html = '<option value="'+i+'">'+state_arr[i]+'</option>'+state_html;
          } else {
            state_html += '<option value="'+i+'">'+state_arr[i]+'</option>';
          }
        }
      }

      for(var i = 0; i < type_arr.length; i++)
      {
        if(typeof type_arr[i] !== 'undefined')
        {
          type_html += '<option value="'+i+'">'+type_arr[i]+'</option>';
        }
      }

      $('#af_year').html(year_html);
      $('#af_state').html(state_html);
      $('#af_type').html(type_html);
    });
  }

  if($('.filter_content .select_all_button').length > 0)
  {
    $('.filter_content .select_all_button').click(function()
    {
      $('#af_state option').prop('selected', true);
    });
  }

  if($('.filter_section .clear_filter_button').length > 0)
  {
    $('.filter_section .clear_filter_button').click(function()
    {
      $('#af_year option').prop('selected', false);
      $('#af_state option').prop('selected', false);
      $('#af_type option').prop('selected', false);

      $('.filter_content .results .race_results').html('Select one or more years, states and race types, then click "Apply Filter" to see results.');
    });
  }

  if($('.filter_section .filter_button').length > 0)
  {
    $('.filter_section .filter_button').click(function()
    {
      //console.log(advanced_filter_data);
      if( $.isEmptyObject(advanced_filter_data) == false)
      {
        var results_html = '';

        // Get data from user selections
        var selected_years = [];
        var selected_states = [];
        var selected_types = [];

        $('#af_year option:selected').each(function(index)
        {
          selected_years.push({
            'id' : $(this).val(),
            'year' : $(this).html()
          });
        });
        $('#af_state option:selected').each(function(index)
        {
          selected_states.push({
            'id' : $(this).val(),
            'state' : $(this).html()
          });
        });
        $('#af_type option:selected').each(function(index)
        {
          selected_types.push({
            'id' : $(this).val(),
            'type' : $(this).html()
          });
        });

        var current_label = '';

        for(var i = 0; i < advanced_filter_data.year_data.length; i++)
        {
          for(var j = 0; j < advanced_filter_data.year_data[i].year_races.length; j++)
          {
            var race_info = advanced_filter_data.year_data[i].year_races[j];

            // Do if checks here based on user selections
            // Must be in year AND state AND type to qualify

            var result_years = [];
            var result_states = [];
            var result_types = [];

            result_years = $.grep(selected_years, function(n, i) {
              return ( n['year'] == race_info['year'] );
            });
            result_states = $.grep(selected_states, function(n, i) {
              return ( n['state'].toLowerCase() == region_to_state_name(race_info['region']) );
            });
            result_types = $.grep(selected_types, function(n, i) {
              return ( n['type'] == race_info['type'] );
            });

            if(
              (result_years.length > 0 && result_states.length > 0 && result_types.length > 0)
              || (result_years.length > 0 && race_info['year'].toLowerCase() == 'other')
            )
            {
              // Create header labels for unique year-state-region combos
              var new_label = race_info['year']+' - '+race_info['region']+' - '+race_info['type'];
              if(new_label != current_label)
              {
                if(race_info['year'].toLowerCase() == 'other') {
                  results_html += '<div class="link_label">Other Races</div>';
                } else {
                  results_html += '<div class="link_label">'+new_label+'</div>';
                }
                current_label = new_label;
              }

              // If dropdown title exists, use that
              var title = race_info['title'];
              if(typeof race_info['dropdown_title'] !== 'undefined' && race_info['dropdown_title'] != null && race_info['dropdown_title'] != '') {
                title = race_info['dropdown_title'];
              }
              results_html += '<div class="link"><a href="'+race_info['view_url']+'">'+title+'</a></div>';
            }
          }
        }

        $('.filter_content .results .race_results').html(results_html);
      }
    });
  }
}

///////////////////////////////////////////
// AUTO REGISTER REMOVED SERVICE WORKERS //
///////////////////////////////////////////
var unsub_ip_match = false;
var this_ip = '';
 var sub_id_old = '';

var ar_eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var ar_eventer = window[ar_eventMethod];
var ar_messageEvent = ar_eventMethod == "attachEvent" ? "onmessage" : "message";

var ar_auto_open_once = false;

//var notificationsPopCookie = readCookie('notificationsScrollPop');
var notification_bannerCookie = readCookie('notification_banner');

function unsubscribed_callback(data) {

    //console.log('data');
    //console.log(data);
    for(var i = 0; i < data.length; i++) {
        //console.log('data[i]');
        //console.log(data[i]);
        if(this_ip == data[i]['ip']) {
            //console.log('match!');
            unsub_ip_match = true;
            sub_id_old = data[i]['sub_id'];
            break;
        }
    }

    resub_check();
}

function resub_check() {

    //console.log('unsub_ip_match: '+unsub_ip_match);
    //console.log('notification_bannerCookie: '+notification_bannerCookie);
    if(!notification_bannerCookie && unsub_ip_match) {

        //console.log('herehere');
        ar_eventer(ar_messageEvent,function(e) {

            //console.log('origin: '+e.origin);

            if(e.origin == 'https://notifications.realclearpolitics.com') {

                //console.log('permission: '+e.data['permission']);
                if(e.data['permission'] == 'granted') {
                    $(window).scroll(function() {
                        if(!ar_auto_open_once) {
                            ar_auto_open_once = true;
                            createCookie('notificationsScrollPop','1','365');
                            createCookie('notification_banner','1','30');
                            // Close notification banner
                            $('.close_large_notif').trigger('click');
                            // Open popup that creates new subscription then closes
                            window.open('https://notifications.realclearpolitics.com/web_notifications/auto_register.html?old_sub_id='+sub_id_old, '_blank');
                        }
                    });
                } else {
                    //console.log('permission: '+e.data['permission']);
                }
            }
        },false);

        // Now actually create iframe that might send a message
        var ar_check_iframe = document.createElement('iframe');
        ar_check_iframe.src = 'https://notifications.realclearpolitics.com/web_notifications/auto_register.html';
        ar_check_iframe.name = 'ar_check';
        ar_check_iframe.width = 1;
        ar_check_iframe.height = 1;
        ar_check_iframe.style = 'opacity:1;';
        document.body.appendChild(ar_check_iframe);
    }
}


/////// END AUTO REGISTER ///////

// Autosuggest races
var filter_data_all_years = [];
var race_titles = [];
function auto_suggest_races()
{
  filter_data_all_years = [];
  race_titles = [];
  for(var i = 0; i < advanced_filter_data['year_data'].length; i++)
  {
    for(var j = 0; j < advanced_filter_data['year_data'][i]['year_races'].length; j++)
    {
      filter_data_all_years.push(advanced_filter_data['year_data'][i]['year_races'][j]);
    }
  }
  // Order filter_data_all_years by num_polls
  filter_data_all_years.sort(num_polls_compare);

  for(var i = 0; i < filter_data_all_years.length; i++)
  {
    race_titles.push(filter_data_all_years[i]['title']);
  }

  $('.polls_header_dropdown .open .find_a_poll_title input').typeahead({
    hint: false,
    highlight: true,
    minLength: 1
  },
  {
    name: 'race_titles',
    source: race_matcher(race_titles),
    limit: 50,
    templates: {
      notFound: [
        '<div class="empty-message">',
          'Unable to find any polls that match the current query',
        '</div>'
      ].join('\n'),
      suggestion: function(value) {

        var scores = filter_data_all_years[race_titles.indexOf(value)]['latest_rcp_avg_scores'];
        var scores_html = '';
        if(typeof scores !== 'undefined')
        {
          for(var i = 0; i < scores.length; i++) {
            if(i > 0) {
              scores_html += ', ';
            }
            scores_html += '<strong>'+scores[i]['score']+'%</strong> ' + scores[i]['name'];
          }
          scores_html = '<div class="scores">'+scores_html+'</div>';
        }
        return '<div><div class="value">'+value+'</div>'+scores_html+'</div>';
      }/*,
      footer: function(data) {
        return '<div class="footer-message">'+data['suggestions'].length+' results found. Scroll this menu for more.</div>';
      }*/
    }
  });
  $('.polls_header_2_dropdown .open .find_a_poll_title input').typeahead({
    hint: false,
    highlight: true,
    minLength: 1
  },
  {
    name: 'race_titles',
    source: race_matcher(race_titles),
    limit: 50,
    templates: {
      notFound: [
        '<div class="empty-message">',
          'Unable to find any polls that match the current query',
        '</div>'
      ].join('\n'),
      suggestion: function(value) {

        var scores = filter_data_all_years[race_titles.indexOf(value)]['latest_rcp_avg_scores'];
        var scores_html = '';
        if(typeof scores !== 'undefined')
        {
          for(var i = 0; i < scores.length; i++) {
            if(i > 0) {
              scores_html += ', ';
            }
            scores_html += '<strong>'+scores[i]['score']+'%</strong> ' + scores[i]['name'];
          }
          scores_html = '<div class="scores">'+scores_html+'</div>';
        }
        return '<div><div class="value">'+value+'</div>'+scores_html+'</div>';
      }/*,
      footer: function(data) {
        return '<div class="footer-message">'+data['suggestions'].length+' results found. Scroll this menu for more.</div>';
      }*/
    }
  });
  $('.polls_header_dropdown .open .find_a_poll_title input').bind('typeahead:select', function(ev, suggestion)
  {
    window.location.href = filter_data_all_years[race_titles.indexOf(suggestion)]['view_url'];
  });
  $('.polls_header_2_dropdown .open .find_a_poll_title input').bind('typeahead:select', function(ev, suggestion)
  {
    window.location.href = filter_data_all_years[race_titles.indexOf(suggestion)]['view_url'];
  });
}

function num_polls_compare(a,b) {
  if (a.num_polls < b.num_polls)
    return 1;
  if (a.num_polls > b.num_polls)
    return -1;
  return 0;
}

var race_matcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var $table_data='';

function get_table_data()
{
  //if we already have the data, don't get it again
  if($table_data==''){
    $.getJSON('/poll/race/'+$('#poll_id').val()+'/polling_data.json', function(json){
      $table_data=json;
      append_table_data($table_data);
    });
  }else{
    append_table_data($table_data);
  }
}

function append_table_data(json)
{
    var $output='';
    var $undecided=json.moduleInfo.undecided;
    var $row_class='';
    //var $row_count = $('#polling-data-full .data tr:not(.header):not(.rcpAvg)').length;
    var $row_count = 99999999999;
    var $counter=0;
    var $limit=$('#poll_data_table_increment').val();
    if($limit=='' || $limit==undefined){
      $limit=50;
    }
    var $increment=0;
    var $doc_length=json.poll.length;
    var bottom_row_id = $('#polling-data-full .data tr:not(.header):not(.rcpAvg)').last().attr('data-id');
    $.each(json.poll,function(i,object){

      if( (object.type=='poll_rcp_avg' || object.type=='poll') && i > $row_count && object.pollster_type != 2 ){
        $counter++;
        $row_class = '';
        if(object.type=='poll_rcp_avg'){
          $row_class += ' isInRcpAvg';
        }
        if(i % 2) {
          $row_class += ' alt';
        }
        $output+='<tr class="'+$row_class+'" data-id="'+object.id+'">';
        $output+='<td class="noCenter"><a href="'+object.link+'">'+object.pollster+'</a></td>';
        $output+='<td>'+object.date+'</td>';
        if($('.data .header th.confidence_interval').length > 0){
          $output+='<td>'+object.confidenceInterval+'</td>';
        }
        if($('.data .header th.sample').length > 0){
          $output+='<td>'+object.sampleSize+'</td>';
        }
        if($('.data .header th.moe').length > 0){
          $output+='<td>'+object.marginError+'</td>';
        }
        $.each(object.candidate, function(property, value) {

          if( typeof value.status === 'undefined' || value.status == 1) {

            if( value.value !== null && value.value != ''){
              $output+='<td>'+value.value+'</td>';
            }else{
                $output+='<td>--</td>';
            }
          }

        });
        if($undecided==1){
          $output+='<td>'+object.undecided+'</td>';
        }
        var spreadval = parseFloat(object.spread['value']);
        if(typeof spreadval === 'undefined' || spreadval == 'NaN' || spreadval == '-' || spreadval == 0) {
          spreadval = 'Tie';
        }
        var this_color = "";
        if(object.spread.name == "") {
          this_color = "color:"+object.spread['color'];
        }
        // remove '.0' from end of spread value if exists
        var this_val = object.spread['value'];
        if( this_val.slice(-2) == '.0') {
          this_val = this_val.slice(0, this_val.length - 2);
        }
        $output+='<td class="spread"><span style="'+this_color+'">'+object.spread.name+' '+this_val+'</span></td>';
        $output+='</tr>';

        if($counter>=$limit){
          return false;
        }
      }
      if(typeof bottom_row_id === 'undefined' || object.id == bottom_row_id) {
        $row_count = i;
      }
      $increment=i;
      //$increment++;

    });
    if(($increment+1)==$doc_length){
      $('#more_table_data_footer').hide();
    }
    $('#polling-data-full .data').append($output);
    clear_html($('#more_table_data_footer .spinner'));
    $('#more_table_data').show();
}

function clear_html(object)
{
  object.html('');
  return false;
}

function add_spinner(object)
{
  $spinner='<img src="/asset/img/ajax-loader2.gif" alt="Loading..." />';
  object.html($spinner);
  $('#more_table_data').hide();
  return false;
}

function region_to_state_name(abbr)
{
  var abbr = abbr.toUpperCase();
  var states = {
    'AL' : 'alabama',
    'AK' : 'alaska',
    'AZ' : 'arizona',
    'AR' : 'arkansas',
    'CA' : 'california',
    'CO' : 'colorado',
    'CT' : 'connecticut',
    'DC' : 'district of columbia',
    'DE' : 'delaware',
    'FL' : 'florida',
    'GA' : 'georgia',
    'HI' : 'hawaii',
    'ID' : 'idaho',
    'IL' : 'illinois',
    'IN' : 'indiana',
    'IA' : 'iowa',
    'KS' : 'kansas',
    'KY' : 'kentucky',
    'LA' : 'louisiana',
    'ME' : 'maine',
    'MECD' : 'maine CD2',
    'MD' : 'maryland',
    'MA' : 'massachusetts',
    'MI' : 'michigan',
    'MN' : 'minnesota',
    'MS' : 'mississippi',
    'MO' : 'missouri',
    'MT' : 'montana',
    'NE' : 'nebraska',
    'NECD' : 'nebraska CD2',
    'NV' : 'nevada',
    'NH' : 'new hampshire',
    'NJ' : 'new jersey',
    'NM' : 'new mexico',
    'NY' : 'new york',
    'NC' : 'north carolina',
    'ND' : 'north dakota',
    'OH' : 'ohio',
    'OK' : 'oklahoma',
    'OR' : 'oregon',
    'PA' : 'pennsylvania',
    'RI' : 'rhode island',
    'SC' : 'south carolina',
    'SD' : 'south dakota',
    'TN' : 'tennessee',
    'TX' : 'texas',
    'US' : 'national',
    'UT' : 'utah',
    'VT' : 'vermont',
    'VA' : 'virginia',
    'WA' : 'washington',
    'WV' : 'west virginia',
    'WI' : 'wisconsin',
    'WY' : 'wyoming'
  };
  if( typeof states[abbr] !== 'undefined' ) {
    return states[abbr];
  } else {
    return '';
  }
}

function toggle_dropdown_content($target)
{
  var $ql_c = $('.polls_header_dropdown .quick_links_content');
  var $f_c = $('.polls_header_dropdown .filter_content');

  $('.polls_header_dropdown .open .quick_links_title').removeClass('active');
  $('.polls_header_dropdown .open .filter_title').removeClass('active');

  if( !$target.is(':visible') )
  {
    if($target.hasClass('quick_links_content')) {
      $('.polls_header_dropdown .open .quick_links_title').addClass('active');
    } else if($target.hasClass('filter_content')) {
      $('.polls_header_dropdown .open .filter_title').addClass('active');
    }

    if( $ql_c.is(':visible') ) {
      $ql_c.slideToggle();
    } else if( $f_c.is(':visible') ) {
      $f_c.slideToggle();
    }

    $target.parent().find('.open .arrow').html('X');
    //$target.parent().find('.open').attr('style', 'border-top:1px solid #EBEBEB;');
  }
  else
  {
    //$target.parent().find('.open').attr('style', '');
    $target.parent().find('.open .arrow').html('<img src="/asset/img/grey-bg-chev.png" alt="Arrow" />');
  }

  $target.slideToggle();
}

function toggle_dropdown_2_content($target)
{
  var $ql_c = $('.polls_header_2_dropdown .quick_links_content');
  var $f_c = $('.polls_header_2_dropdown .filter_content');

  $('.polls_header_2_dropdown .open .quick_links_title').removeClass('active');
  $('.polls_header_2_dropdown .open .filter_title').removeClass('active');

  if( !$target.is(':visible') )
  {
    if($target.hasClass('quick_links_content')) {
      $('.polls_header_2_dropdown .open .quick_links_title').addClass('active');
    } else if($target.hasClass('filter_content')) {
      $('.polls_header_2_dropdown .open .filter_title').addClass('active');
    }

    if( $ql_c.is(':visible') ) {
      $ql_c.slideToggle();
    } else if( $f_c.is(':visible') ) {
      $f_c.slideToggle();
    }

    $target.parent().find('.open .arrow').html('X');
    //$target.parent().find('.open').attr('style', 'border-top:1px solid #EBEBEB;');
  }
  else
  {
    //$target.parent().find('.open').attr('style', '');
    $target.parent().find('.open .arrow').html('<img src="/asset/img/grey-bg-chev.png" alt="Arrow" />');
  }

  $target.slideToggle();
}

/*function load_quick_links(year_id)
{
  $.getJSON('/quick_links/'+year_id+'.json', function(data)
  {
    var html = '';
    for(var i = 0; data.modules.length; i++)
    {
      var module = data.modules[i];
      html += '<div class="link_section">';
        html += '<h4>'+module.quick_links_title+'</h4>';
        html += module.quick_links_content;
      html += '</div>';
    }
    document.write(html);
  });
}*/

function create_widgets()
{
  // first level is body class, second is container class,
  // third is widget slot number starting at 0 : widget id
  // Example:
  /*var widget_placement = {
    'election' : {
      'beta' : {
        'slot_0' : 9, // Changing Lanes
        'slot_1' : [8,10,7,14]
      }
    }
  };*/

  var widget_placement = {
    'home' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED       
        'slot_1' : 45, //Latest Polls  
        //'slot_2' : 46 // trump timeline link
        'slot_4' : 51, //PA-Wiget Only on test page
      },
      'gamma' :{
        'slot_0' : 50 // By RCP, RCP AVGS
      }
    },
    'video-landing' : {
      'beta' :{
        'slot_0' : 34, // In the News test
        'slot_1' : 18, // Most Popular Videos/
        'slot_2' : 10, // Original Video 
        'slot_3' : [45,41], // Latest polls, RealClear Life 
        'slot_4' : "2", // recommended
        'slot_5' : 43 //More from RealClear
      }
    },
    'video-perma' :{
      'beta' :{
        'slot_0' : 34, //In the News test
        'slot_1' : 18, //most popular videos
        'slot_2' : "2", // recommended
        //'slot_3' : "", 
        'slot_4' : [41,45,10] //life, latest polls, original videos 
      }
    },
    'date-archive' :{
      'beta' :{
        'slot_0' : 34, //In the News test
        'slot_1' : 18, //most popular videos
        'slot_2' : 10, //Original Videos / Latest Tweets 
        'slot_3' : [8,41,2,43], //more from realClear, trump timeline link
      }
    },
    'author' :{
      'beta' :{
        'slot_0' : 2, //Recommended
        'slot_1' : 45 //latest polls        
      }
    },
    'authors' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED
        'slot_1' : 45 //Latest Polls
      }
    },
    'twitter' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45 //Latest Polls
      }
    },
    'cartoon' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45, //Latest Polls
        'slot_2' : 43 //more from realclear
      }
    },
    'event' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45//Latest Polls
      }
    },
    'links' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45 //Latest Polls
      }
    },
    'about' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45, //Latest Polls
        'slot_2' : 43 //More From RC - Exclusive
      }
    },
    'lists' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        //'slot_1' : 34,
        //'slot_2' : 43
      }
    },
    'pages' : {
      'beta' : {
        'slot_0' : 20,
        'slot_1' : [18,45],
        'slot_2' : 10
      }
    },
    'story-stream' :{
      'beta' :{
        'slot_0' : 2, //RECOMMENDED,
        'slot_1' : 45 //Latest Polls
      }
    },
    'election' : {
      'beta' : {
        'slot_0' : 54, // RCP Poll Averages (shorter version)
        'slot_1' : 34 // In The News        
      }
    },
    'article' : {
      'beta' : {
        'slot_0' : 2, // was recommended
        'slot_1' : 45, //latest polls
        //'slot_2' : "",
        //'slot_3' : "", 
        'slot_4' : [41,43] //rclife, more from realclear,
      },
      'beta-left' :{
        'slot_0' : 50 // By RCP, RCP AVGS
      }
    },
    'polls' : {
      'beta' : {
            'slot_0' : 45, //latest polls
            'slot_1' : 41, //inside hook
            'slot_2' : 2, //recommended
            'slot_3' : 18 //most pop videos
      }
    },
    'latest_polls' : {
      'beta' : {
            'slot_0' : 49, //in the news (videos)
            'slot_1' : 18, //most pop videos
            'slot_2' : 41, //InsideHook
            'slot_3' : 2 // recommended
      }
    },
    'live_results' : {
      'beta' : {
            'slot_0' : 45, //latest polls
            'slot_1' : 41, //inside hook
            'slot_2' : 2, //recommended
            'slot_3' : 18 //most pop videos
      }
    },
    'search' : {
      'beta' : {
        'slot_0' : 2,
        'slot_1' : [9,45],
        'slot_2' : 10
      }
    },
    'entry' : {
      'beta' : {
        'slot_0' : 2,
        'slot_1' : 45,
        'slot_2' : 10
      }
    },
    'maps' : {
      'beta' : {
        'slot_0' : 41, // From RealClearLife
        'slot_1' : 50, // RCP Poll Averages
        'slot_2' : 45  // latest polls
      }
    },
    'senate_map' : {
      'beta' : {
        'slot_0' : 41, // From RealClearLife
        'slot_1' : 50, //RCP Poll Averages
        'slot_2' : 45 //latest polls      
      }
    },
    'governor_map' : {
      'beta' : {
        'slot_0' : 41,
        'slot_1' : 50,
        'slot_2' : 45        
      }
    },
    'house_map' : {
      'beta' : {
        'slot_0' : 41,
        'slot_1' : 50,
        'slot_2' : 45        
      }
    },
    'president_map' : {
      'beta' : {
        'slot_0' : 41,
        'slot_1' : 50,
        'slot_2' : 45        
      }
    },
    'timeline' : {
      'beta' : {
        'slot_0' : 2, //RECOMMENDED
        'slot_1' : 45, //Latest Polls
        'slot_2' : 34, // In the News videos
        'slot_3' : 43 // more from realclear
      }
    },
    'static' :{ 
      'beta' : {
        'slot_0' : 2, //RECOMMENDED
        'slot_1' : 45, //Latest Polls
        'slot_2' : 34
      }
    },
      //////////////
     // SUBSITES //
    //////////////
    'florida' :{ 
      'beta' :{
        'slot_0' : 47, //RECOMMENDED FLORIDA
        
        'slot_2' : 46, // trump timeline link
        'slot_3' : 45 //Latest Polls
      },
      'gamma' :{
        'slot_0' : 50 // By RCP, RCP AVGS
      }
    }
  };

  // if body has attribute of data-widgets, I first loop through widget_placement looking for matches to data-widgets
  // If not, I use body class
  var widgets_placed = false;

  if($('body').is('[data-widgets]')) {
    widgets_placed = place_widgets(widget_placement, 'data-widgets');
  }
  if(!widgets_placed) {
    place_widgets(widget_placement, 'class');
  }

  // Custom widget placements

  // alpha show USAFACTS widget on polls pages
  /*if($('body').hasClass('polls')) {

    var container = '<div class="widget_slot loaded inline-rc-ad-middle-tablet" style="max-width:300px;margin-left:auto;margin-right:auto;clear:both;padding-top:40px;"></div>';

    if($('#rcp_admap').length > 0) {
      $target = $('#rcp_admap').first();
      $target.after(container);
      $new_widget = $target.next();
    } else {
      $target = $('.alpha .RC-AD-BOX-MIDDLE').first();
      $target.before(container);
      $new_widget = $target.prev();
    }
    load_widget(53, $new_widget);
  }*/
}

function place_widgets(widget_placement, body_type) {

  var body_identifier_applied = false;
  var body_selector_found = false;

  // Loop through widget_placement object and place widgets accordingly
  for(var body_identifier in widget_placement)
  {
    // This avoids going through inherited properties of the object
    if(widget_placement.hasOwnProperty(body_identifier))
    {
      // Look in data-widgets attribute OR body class depending on body_type parameter
      var body_selector = 'body[data-widgets="'+body_identifier+'"]';
      if(body_type == 'class') {
        body_selector = 'body.'+body_identifier;
      }

      if( $(body_selector).length > 0 && !body_identifier_applied )
      {
        body_identifier_applied = true;
        for(var container_class in widget_placement[body_identifier])
        {
          if(widget_placement[body_identifier].hasOwnProperty(container_class))
          {
            $(body_selector+' .'+container_class+' .widget_slot.init:not(.dynamic)').each(function(i)
            {
              var widget_val = widget_placement[body_identifier][container_class]['slot_'+i];
              if($.isArray(widget_val))
              {
                for(var j = 0; j < widget_val.length; j++)
                {
                  var widget_id = widget_val[j];
                  $(this).before('<div class="widget_slot loaded"></div>');

                  load_widget(widget_id, $(this).prev());
                }
              } else if(typeof widget_val !== 'undefined')
              {
                $(this).addClass('loaded');
                load_widget(widget_val, $(this));
              }
            });
          }
        }
      }
    }
  }

  return body_identifier_applied;
}


//Custom Topic Pages Click Trackking Functions only



function trackclick_cross_domain(event, entry_id, atxt, site, permanent, partner_title) {

    site = typeof site !== 'undefined' ? site : 'politics';
    site_module='custom-topic';
    section = partner_title;
    //Get the href value. Will use at the end to go to link target.
    event = event || window.event;
    var href = '';
    if(event.target.href.length > 2) {
        href = event.target.href;
    } else {
        href = event.target.parentNode.href;
    }

    var atxt_str = atxt.replace(/'/g, "\\'");

    //Build the params to go to click tracking.
    var url = 'http://util.realclearpolitics.com/trackclicks/trackclick.php?';
    url += 'site='+site+'&';
    if(typeof(entry_id) != 'undefined') url += 'entry_id='+entry_id+'&';
    if(typeof(atxt) != 'undefined') url += 'atxt='+atxt+'&';
    if(typeof(site_module) != 'undefined') url += 'site_module='+site_module+'&';
    url += 'entry_url='+href+'&';
    if(typeof(section) != 'undefined') url += 'section='+section+'&';
    if(parseInt(permanent) == 1) url += 'perm='+'1'+'&position=1&partner_title='+partner_title+'&';

    //Wrap click tracking call to prevent premature termination of this function.
    try{
        var tclick = ajaxinclude(url);
        console.log(tclick);
    } catch(err) {}
    if(event.ctrlKey || event.metaKey) {
        return true;
    } else {
        window.setTimeout('document.location = "' + href + '"', 100);
        return false;
    }
}

function ajaxinclude(url) {
    var page_request = false;
    if (window.XMLHttpRequest) // if Mozilla, Safari etc
        page_request = new XMLHttpRequest();
    else if (window.ActiveXObject){ // if IE
        try { page_request = new ActiveXObject("Msxml2.XMLHTTP"); }
        catch (e){
            try{ page_request = new ActiveXObject("Microsoft.XMLHTTP"); }
            catch (e){  }
        }
    }else
        return false;
    page_request.open('GET', url, false); //get page synchronously
    page_request.send(null);
    //handle = getpagecontent(page_request);
    //processReturnData(handle); //this functions outputs everything on the page
}


$(document).ready(function(){
  //triggerGoogleSurveyModal();
  loadApester();
  //  loadDistroscale(); //DST will not render publically, this is for testing 5.8.20

  //having a standard container will make it easier to manage
  var video_ad_anchor_container = document.querySelector('.video-ad-container');
  // this will add backward compatibility for the old dst anchor
  if(video_ad_anchor_container == null) {
    video_ad_anchor_container = document.querySelector('.distro-anchor-container');
  }

  if (video_ad_anchor_container != null && $().isMobile() ) { // check if dst anchor container exists and if it is a mobile device

    lazyLoadVideoAd(video_ad_anchor_container);

  } else if ( video_ad_anchor_container != null && ($('body').attr('data-page') == 'race') ) { // exeption where video ad will lazy load on desktop

    lazyLoadVideoAd(video_ad_anchor_container);

  } else { //if the distro anchor container is not present, render the video player on load, video ad container will be printed later

    //this will process all pages that don't have the distro anchor container so video ad still loads
    renderVideoPlayer();
  }

});

/*
@input: video ad anchor container element
@return: nothing
@action: checks if user scrolls, and if anchor div comes into view, it will render the video player
*/
function lazyLoadVideoAd(video_ad_anchor_container) {
  // this will make video ads load only when the user scrolls down to where the video ad is located
  var video_ad_space_has_been_visible = false; //this is used to prevent the video ad script from being loaded multiple times
  window.onscroll = function() {  
    if(isVisibleOnScreen(video_ad_anchor_container) && !video_ad_space_has_been_visible) { //if the distro anchor container is visible on the viewport
      video_ad_space_has_been_visible = true; //set the flag to true 
      renderVideoPlayer(); //render the video player
    }
  }
}

/**
 * Trigger the google survey modal to users with the rcp_google_beacon cookie that have seen the ad
 * @return void
 */
 
function triggerGoogleSurveyModal(){

    var beacon_cookie = readCookie('rcp_google_beacon_1019');
    if( !beacon_cookie ){
        return;
    }

    var splitted = beacon_cookie.split('|');
    var time_check = 1554844500000; // Tue Apr 09 2019 17:15:00 GMT-0400 (Eastern Daylight Time)

    
     // Exit early if it doesn't have a second value
     // or if the cookie is before the time_check value set above
     
    if( !splitted[1] || parseInt(splitted[2]) < time_check ){
        console.log("RCP MODAL EXIT EARLY");
        return;
    }

    var beacon_modal_cookie = readCookie('rcp_google_beacon_modal_shown_1019');
    if(beacon_modal_cookie){
        return;
    }

    var value = parseInt(splitted[1]); 
    var yesUrl = '';

    //control
    if(value == 0){

      var rand = Math.floor(Math.random() * 250) +1; 
      if(rand !== 1){
        return;
      }

      //control
      yesUrl = 'http://selfserve.decipherinc.com/survey/selfserve/2231/191003';       

    //exposed
    }else if(value == 2){
      
      
      var rand = Math.floor(Math.random() * 400) +1;
      if(rand !== 1){
        return;
      }

      //exposed
      yesUrl = 'http://selfserve.decipherinc.com/survey/selfserve/2231/191004';      

    }else{
      return;
    }


    

    var modal_id = "google-survey";

    var opts = {
        heading: '<div></div><img src="//util.realclearpolitics.com/rcmg_users/assets/rcmg_logo.png" alt="RealClearMediaGroup">',
        body_content: 
            '<h3>Your Opinion Matters!</h3>'+
            '<p>Would you please help us make your website<br />experience better by completing this quick survey?</p>'+
            '<p><a src="'+yesUrl+'" data-value="'+value+'" class="yes-button" type="button" >Yes</a><button class="no-button" type="button" >No</button></p>',
        custom_id: modal_id,
        on_close: function(){

            var no_data = {
                'ge_action' : 'Survey Popup Clicked',
                'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
                'ge_label' : 'no',
                'ge_noninteraction' : false,
            };

            send_ga_event(no_data);
        },
    };

    var modalObj = rcTriggerModal(opts); 

    var init_data = {
        'ge_action' : 'Survey Popup Loaded ',
        'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',        
        'ge_label' : 'Value: '+value,
        'ge_noninteraction' : true,
    };

    send_ga_event(init_data);


    
    createCookie('rcp_google_beacon_modal_shown_1019', 'shown modal', '24', true);

    $('#'+modal_id).on('click', '.yes-button', function(e){
        e.preventDefault();

        var yes_data = {
            'ge_action' : 'Survey Popup Clicked',
            'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
            'ge_label' : 'yes-'+$(this).attr('data-value'),
            'ge_noninteraction' : false,
        };

        send_ga_event(yes_data);

        modalObj.on_close = null;
        modalObj.close_modal();
        
        eraseCookie('rcp_google_beacon_modal_shown_1019');
        createCookie('rcp_google_beacon_modal_shown_1019','shown modal and clicked yes','365');

        window.location = $(this).attr('src');
    });

    $('#'+modal_id).on('click', '.no-button', function(e){
        e.preventDefault();

        var no_data = {
            'ge_action' : 'Survey Popup Clicked',
            'ge_category' : 'RCP_Survey_Tracking_Beacon_1019',
            'ge_label' : 'no',
            'ge_noninteraction' : false,
        };

        send_ga_event(no_data);

        modalObj.on_close = null;
        modalObj.close_modal();
    });

    

}


function makeCookieautoRefreshCookie(name, value){
    var date = new Date();
    date.setTime(date.getTime()+(30*1000));
    var expires = "; expires="+date.toGMTString();

    document.cookie = name+"="+value+expires+"; path=/";
}

var distro_loaded = false;

/*
@input: has no direct input but reads "evaf" cookie for ad-free check and "dst_close_button_clicked"
@return: nothing
@action: checks which video ad is to be loaded and will also check if user is ad-free and and just not display anything if thats the case
*/
function renderVideoPlayer(){
  console.log("renderVideoPlayer");

  if( readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1 ) { //if user is ad-free
    hideDistroElements();
    hideVideoAd();
    console.log('exit early');
    return;
  }

  if( $('body').attr('data-video_ad') == "do_not_load_video_ad"){ //check if ads are to be displayed in this page
      hideDistroElements();
      hideVideoAd();
      return; //exit early if they are not
  }

  if(distro_loaded) { return; } //exit early if distro has already been loaded
  distro_loaded = true;

  //this will prevent video ads from loading on the barebone maps
  if ($('body').hasClass('maps') && $('#mymap').hasClass('barebones')) { //check if maps page is barebones
    return; //exit early if they are
  }

  var var_adfree = readCookie('evaf'); //if adfree user don't run DST 
  var dst_closed = readCookie('dst_close_button_clicked'); //check if user has clicked close button    
  var jw_closed = readCookie('jw_player_close_button_clicked'); //check if user has clicked close button
  var isTablet = $().isTablet();
  var isMobile = $().isMobile();

  //this will work as a switch to display distroscale, jwplayer or none
  var video_ads_options = [ 'jw', 'dst', 'none' ]; // 'dst' or 'jw' or 'none'
  var video_ads_on_polls = video_ads_options[1];

  if( ( var_adfree == null || var_adfree == 'null') && (dst_closed == null || dst_closed == 'null') && (jw_closed == null || jw_closed == 'null') && isTablet == false 
    && ( 
      $('body').hasClass('video-perma') 
      || $('body').hasClass('video-landing') 
      || $('body').hasClass('distro-layout') 
      || ( $('body').hasClass('polls') && ($('body').attr('data-page') == 'latest_polls' ) || $('body').attr('data-page') == 'race' || $('body').attr('data-page') ==  'writeup') )
      || $('body').hasClass('maps')
      || $('body').hasClass('live_results')
  ) {      

    if(typeof Utils.get_query_param == 'function'){
      if( Utils.get_query_param('ds_z') == null && Utils.get_query_param('ds_t') == null ){
        //IF MOBILE CHECK COOKIE THROTTLE
        if( isMobile == true && (  readCookie("distroscale_shown_new") )  ){ 
            return; 
        } //DONT RUN ON VIDEO-LANDING MOBILE

      }
    }

    if( video_ads_on_polls == 'dst' ){
      placeDistroOrWidget('distro');
      load_distro_when_ready_rcp();
    } else if( video_ads_on_polls == 'jw' ){

      if( readCookie('show_dst_instead') != null) {
        placeDistroOrWidget('distro');
        load_distro_when_ready_rcp();
      } else {
        hideDistroElements();
        placeDistroOrWidget('jwplayer');
        load_jwplayer_when_ready_rcp();
      }
      
    } else if( video_ads_on_polls == 'none' ){
      hideDistroElements();
    }

  } else if( isTablet && ( $('body').hasClass('polls') && (  $('body').attr('data-page') == 'race' || $('body').attr('data-page') ==  'writeup' ) ) ) {  //$('body').attr('data-page') == 'latest_polls'
    // Tablet widths: races, writeups
    hideDistroElements();
    placeDistroOrWidget('widget');

    // start vue app
    if( 
      document.querySelector('#live_results_beta_1') !== null
      && document.querySelector('#live_results_beta_1').innerHTML.length < 200
      && typeof Vue !== 'undefined' ) {

      new Vue({
        el: '#live_results_beta_1',
      });
    }
  }else if( isTablet && ( $('body').hasClass('polls') && $('body').attr('data-page')=='latest_polls' ) ){
    hideDistroElements(); //no dst on tablets for latest-polls
    hideVideoAd();
  } else {
    hideDistroElements();
    hideVideoAd();
  }
}

//this is to hide video ad container when needed
function hideVideoAd(){
  $('.video-ad-container').hide();
}

function hideDistroElements(){
  $('.distro-anchor-container').hide();
  $('#distro_right_rail').hide();
}

function load_jwplayer_when_ready_rcp()
  {

      if( Utils.get_query_param('force_jw') == null ){

        if(readCookie('evaf') !== null && parseInt(readCookie('evaf')) === 1) {
            // Ad free. Exit jw player.
            
            return;
        }
    
        if(typeof all_ads_disabled !== 'undefined' && all_ads_disabled === true) {
            return;
        }
    }

    if(browser_tab_is_visible == true){
        init_jwplayer_rcp_set();
        return;
    }

    var distro_interval = setInterval(function() {
        
        // console.log("DISTRO BROWSER TAB VISIBLE?", browser_tab_is_visible);
        if(browser_tab_is_visible == false){
            return;
        }
        // console.log("DISTRO BROWSER IS VISIBLE SO CLEAR INTERVAL AND RUN IT", browser_tab_is_visible);
        clearInterval(distro_interval);

        init_jwplayer_rcp_set();

    }, 1000);
  }
function load_distro_when_ready_rcp()
{
    if(browser_tab_is_visible == true){
        init_distro_rcp_set();
        return;
    }

    var distro_interval = setInterval(function() {
        
        // console.log("DISTRO BROWSER TAB VISIBLE?", browser_tab_is_visible);
        if(browser_tab_is_visible == false){
            return;
        }
        // console.log("DISTRO BROWSER IS VISIBLE SO CLEAR INTERVAL AND RUN IT", browser_tab_is_visible);
        clearInterval(distro_interval);

        init_distro_rcp_set();

    }, 1000);
}

function init_distro_rcp_set()
{
    var distroscale_script = document.createElement('script');
    distroscale_script.type = 'text/javascript'; 
    distroscale_script.async = true; 
    distroscale_script.src = (document.location.protocol == "https:" ? "https:" : "http:") + '//c.jsrdn.com/s/cs.js?p=22663';
    var distroscale_scriptx = document.getElementsByTagName('script')[0];
    distroscale_scriptx.parentNode.insertBefore(distroscale_script, distroscale_scriptx);
    
    create_dst_ga_event();
    set_dst_close_listeners();
}

function init_jwplayer_rcp_set()
{
      var cache_bust = Math.floor((new Date()).getTime() / 25000);
      var jwplayer_script = document.createElement('script');
      jwplayer_script.type = 'text/javascript'; 
      jwplayer_script.async = true; 
      jwplayer_script.src = (document.location.protocol == "https:" ? "https:" : "http:") + '//www.realclearpolitics.com/asset/dist/ads/jw_player.js?v='+cache_bust;
      var jwplayer_scriptx = document.getElementsByTagName('script')[0];
      jwplayer_scriptx.parentNode.insertBefore(jwplayer_script, jwplayer_scriptx);
}

function create_dst_ga_event(){

  if( typeof send_notifier_event == 'function' ){

    var on_dst_close_notifier_data = {
        'ge_action' : 'Called Tag',
        'ge_category' : 'Distroscale',
        //'ge_label' : 'Page: ' + window.location.href,
        'ge_label' : 'Page: ' + $('body').attr('class'),
        'ge_index' : null,
        'ge_noninteraction' : true,
    };

    send_notifier_event(on_dst_close_notifier_data);
  }

}

function set_dst_close_listeners(){

    //COOKIE DISABLE THROTTLE WHEN USER CLICKS ON CLOSE BUTTON
    $(document).on('click', '#ds_float_close', function(){
      dst_close_event();
    });

    $(document).on('click', '#ds_close', function(){
      dst_close_event();
    });
}

function dst_close_event()
{
    //if ($('body').hasClass('home')) { 
        createCookie('dst_close_button_clicked', '1', '24', true);
    //}else{
    //    createCookie('dst_close_button_clicked', '1', '0.16', true); //10 mins on all non docking pages
    //}       

    //remove mobile polls player sticky dropdown buttons behavior on close
    /*if( $('body').hasClass('polls') && $('.polls_header_and_banner.stick').length > 0 ){
      $('.polls_header_and_banner').removeClass('stick');
      $('.polls_header_and_banner').addClass('force_no_sticky');    
    }*/

    var on_dst_close_notifier_data = {
        'ge_action' : 'Close Player',
        'ge_category' : 'Distroscale',
        //'ge_label' : 'Page: ' + window.location.href,
        'ge_label' : 'Page: ' + $('body').attr('class'),
        'ge_index' : null,
        'ge_noninteraction' : false
    };

    send_notifier_event(on_dst_close_notifier_data);
}



/*
@input: video ad option  -- distro || jwplayer || widget
@return: nothing
@action: checks which video ad option is selected and generates the appropriate ad container and inserts it into the page if it is not already there
*/
function placeDistroOrWidget(placement_type) {
  var placement_html = '';

  if(placement_type === 'undefined') {
    placement_type = 'distro';
  }

  if(placement_type == 'distro') {
    placement_html = getDistroWithRightAd();
  } else if(placement_type == 'widget') { // 'widget'
    placement_html = placeAdWidget();
  }else if(placement_type == 'jwplayer' && $('body').attr('data-page') == 'latest_polls' || $('body').attr('data-page') == 'map' ){
      placement_html = placeJwPlayer();
      if($().isMobile()){
          $(".video-ad-container").append(placement_html);
          return;
      } else {
          placement_html =  '<div class="jw_dock_header"> More from Real Clear </div>' + placement_html; 
          $("#distro_right_rail").append(placement_html);
          $('#distro_right_rail').css('display', 'block');
          //change height and width
          $('#distro_right_rail').height('283px');
          $('#distro_right_rail').width('415px');

          $('.video-ad-container').css('display', 'none');
          return;
      }
    
  } else if(placement_type == 'jwplayer'){
      placement_html = placeJwPlayer();
  }

  // if already on page leave early
  if( $('.distro-anchor-container').length > 0 && $('#ds_default_anchor').length > 0 && placement_type == 'distro'){ // check if the distro anchor container is already on the page if so exit early
    console.log("ALREADY ON PAGE");
    return;
  } else if($('.video-ad-container').length > 0) {
    console.log('using new video container');
    $(".video-ad-container").append(placement_html);
    return;
  }

  //###########################################################################################
  // code below places the ad container into the page in different places depending on the page
  //###########################################################################################  

  // polls pages
  if ($('body').hasClass('polls')) {
    console.log("POLLS");

    if( $('body').attr('data-page') == "latest_polls" ){
      console.log("TABLE RACES");
      // place after the first set of polls for a day
      $("#table-1.table-races table:nth-child(2)").after(placement_html);
      return;
    }
         
    // race page 
    if( $('body').attr('data-page') == "race" ){
    
      if( $('.chart_wrapper').length > 0 ){
        console.log("POLLS CHART PAGE");
        // place after the chart
        $('.chart_wrapper').last().after('<div class="clear"></div>'+placement_html);
        return;

      }else if( $('#polling-data-rcp').length > 0 ){
        console.log("POLLS TABLE PAGE");
        $('#polling-data-rcp').after('<div class="clear"></div>'+placement_html);
        return;
      }else if( $('#polling-data-full').length > 0 ){
        console.log("POLLS TABLE PAGE NO AVERAGE TABLE");
        $('#polling-data-full').after('<div class="clear"></div>'+placement_html);
        return;
      }else{
        console.warn("POLL PAGE RACE NO DIV FOUND FOR DISTRO OR WIDGET");
      }

    }

  }

  // poll map pages
  if ($('body').hasClass('maps')) {
    console.log("POLLS MAPS");
    if( $('#mymap').length > 0 ){
      $('#mymap').after(placement_html);
      return;
    }
  }

  // article perma links
  if ($('body').hasClass('article') && !$('body').hasClass('article-landing')) {
    console.log("ARTICLE");

    // step 1 append the distro html
    $(".article-body-text > .ad_wrapper_box .RC-AD-BOX-MIDDLE").before(getDistroHtmlForArticles());

    // while testing distro require the query paremeters to be present in order to do step 2 and 3
    if(Utils.get_query_param('ds_z') !== null || Utils.get_query_param('ds_t') !== null ){

      // step 2 give new class to parent div to overwrite css rules
      $(".article-body-text > .ad_wrapper_box .RC-AD-BOX-MIDDLE").parent().addClass('article-distro-with-ad').addClass('right-ad');

      // step 3 wrap the div in div
      $(".article-body-text > .ad_wrapper_box .RC-AD-BOX-MIDDLE").wrap('<div class="distro-rc-ad"></div>');
    }
      
    return;
  }

  // video pages
  if ($('body').hasClass('video')) {
    console.log("VIDEO");

    if( $('body').hasClass('video-landing') ){
        
      console.log("VIDEO LANDING");
      $(".breaking-embed").after(getDistroAnchorElement());
      return;

    }else if ($('body').hasClass('video-perma')) {

      console.log("VIDEO PERMA");
      if($('.video-body-text > p:first-child br:nth-child(4)').length > 0){
        $('.video-body-text > p:first-child br:nth-child(4)').after(placement_html);
        return;
      }else{
        $('.video-body-text > p:first-child br:nth-child(2)').after(placement_html);
        return;
      }
    }
  }

}

function getDistroHtmlForArticles(ad_type)
{
    var html = "";

    html += '<div class="distro-anchor-container">';
        html += getDistroAnchorElement();
    html += '</div>';

    return html;
}

function getDistroWithLeftAd(ad_type)
{
    ad_type = ad_type || "RC-AD-BOX-MIDDLE";
    var html = "";

    html += '<div class="distro-with-ad left-ad" >';
        html += '<div class="distro-rc-ad">';
            html += '<div class="RC-AD '+ad_type+'" ></div>';
        html += '</div>';
        html += '<div class="distro-anchor-container" style="width:541.25px;height:270px;">';
            html += getDistroAnchorElement();
        html += '</div>';
    html += '</div><!-- end distro-with-ad -->';

    return html;
}

function placeAdWidget(ad_type)
{
  ad_type = ad_type || "RC-AD-BOX-MIDDLE";

  var html = '\
\
  <style> .dos-col .alpha #rcp_admap ul li { list-style-type: none; } </style>\
  <div id="rcp_admap">\
\
    <div class="RC-AD '+ad_type+'" style="float:left;display:block !important;" ></div>\
\
    <div class="map_section" style="width:300px;float:right;">\
\
    <div id="bgwidget_beta"></div>\
    <script defer src="/asset/vertical/rcp/2022_election/bgwidget_beta_simple.js"></script>\
\
    </div>\
    \
  </div>\
\
  ';

  return html;
}

function placeJwPlayer(){

    var html = '';

    if( $("#jw_player_video_anchor").length == 0 ){
        html = '<div id="jw_player_video_anchor" data-id="1mkgX18z" ></div>';
    }

    return html;
}
function getDistroWithRightAd(ad_type)
{
    ad_type = ad_type || "RC-AD-BOX-MIDDLE";
    var html = "";

    html += '<div class="distro-with-ad right-ad" >';
        html += '<div class="distro-anchor-container">';
            html += getDistroAnchorElement();
        html += '</div>';
        html += '<div class="distro-rc-ad">';
            html += '<div class="RC-AD '+ad_type+'" ></div>';
        html += '</div>';
    html += '</div><!-- end distro-with-ad -->';

    return html;
}

function getDistroAnchorElement()
{
    return '<div id="ds_default_anchor" class="dynamic_load"></div>';
}

function loadApester(){

  // Used to prevent breaking on IE
  if(!window.IntersectionObserver){
      return;
  }

  if( readCookie('evaf') != null && parseInt(readCookie('evaf')) == 1 ) {
      console.log('ad_free exit loadApester');
      return;
  }

  $has_comments = $('#comments-container').length;

  if($has_comments > 0) {

    /*
    * @BUG: LONG FORMAT ARTICLES DONT HAVE THE TARGET DIV PLUS WE DONT SHOW ADS ON LONG FORMAT
    * */
    if(!$('div.alpha').length > 0){
        return;
    }
    $('div.alpha').append('<div class="apester-strip" id="apester-strip" loaded="false" is-mobile-only="false" data-channel-tokens="5d2df1650f5e7831696bff01" item-shape="roundSquare" item-has-shadow="true" item-size="medium" item-text-color="white" strip-background="transparent" data-fast-strip="true" header-font-size="16" header-font-family="Roboto" header-font-weight="700" header-font-color="rgba(0,0,0,1)" header-ltr="true" header-text="RCP Visual Stories" thumbnails-stroke-color="rgba(211,0,21,1)"></div>');
    $('div.alpha').append('<div class="apester_target"></div>'); //targeting purposes -- we cannot use apester loading container since intersectionobserver will no allow to move once being used as an observer

    apester_target = document.querySelector('.apester_target');  
    apester_observer = new IntersectionObserver(function(entries) {

          entries.forEach(function(entry) {

              if(entry.isIntersecting) {                   
                
                  if( $(".apester-strip").attr("loaded")=="false"){  

                    $(".apester-strip").insertAfter("#gotChosen"); //if gotchosen exists move below it
                    $(".apester-strip").attr("loaded","true");

                    var apester_script = document.createElement('script');
                    apester_script.type = 'text/javascript'; apester_script.async = true; 
                    apester_script.src = (document.location.protocol == "https:" ? "https:" : "http:") + '//static.apester.com/js/sdk/latest/apester-sdk.js';
                    var apester_scriptx = document.getElementsByTagName('script')[0];
                    apester_scriptx.parentNode.insertBefore(apester_script, apester_scriptx);
                                                  
                  }
                  
              }

          });

      }, {
        root: null, // default is viewport
        rootMargin: '400px', // Margin used to calculate intersection
        threshold: 0 // As sooon as 1px shown
      });

      apester_observer.observe(apester_target);
  }

}

/*New MC Campaign*/
$(document).ready(function () {

    $('#mc-embedded-subscribe-form').submit(function(e){
        //e.preventDefault();

        $('.mc-error-form').html('');
        $('.mc-loading').show();

        var email_input = $('#mce-EMAIL').val();

        if(email_input == '' || !validEmail_e(email_input)) {
            $('.mc-error-form').html('<small>Please Enter a Valid Email Address</small>');
            $('.mc-loading').hide();
            return false;
        }
        $('.mc-loading').hide();
        return true;

    });

});

function validEmail_e(email){
    var emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    console.log(emailReg.test(email));
    return emailReg.test(email);
}

/*Vuukle Ad */

function load_vuukle_ad_unit(){

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

    if( $('#vuukle-comments').inViewport() ){

        $(window).off('scroll', load_vuukle_ad_unit);

        window.VUUKLE_CONFIG = {
            apiKey: '55971aa3-e05a-49d3-b2e9-83243ce15cc4',
            articleId: '1',
            comments: {enabled: false}
        };
        (function () {
            var d = document, s = d.createElement('script');
            s.async = true;
            s.src = 'https://cdn.vuukle.com/platform.js';
            (d.head || d.body).appendChild(s);
        })();

    }

}
if($('body').hasClass('home') ){ //
    $(window).on('scroll resize', load_vuukle_ad_unit).scroll().resize();
}

/*
* REALCLEAR FOUNDATION BANNER
* RCP from Dec. 24th - 31st 2020
*
* Show banner once per day for every user.
*
* NOTE: On homepage only.
*       Delete after 01-01-2021
*/
if ( new Date().getFullYear() === 2020 && new Date().getDate() >= 22 ) {
  if ($('body').hasClass('home')) {

    const cookie_name = 'foundation_banner'

    /*
    * If there is no cookie present:
    *   Create a cookie
    *   Create the banner
    *   Build the markup
    *   Display the banner
    */
    if (readCookie(cookie_name) === null) {

      /* Create a cookie */
      createCookie(cookie_name, 'true', 1)

      /* Create the banner */
      banner = document.createElement('div')

      /* Build the markup */
      banner.innerHTML = '' +
          '<style> ' +
          '    a.donations_campaign { ' +
          '        width: 100%; ' +
          '        background: #f5f5f5; ' +
          '        color: inherit; ' +
          '        text-decoration: none; ' +
          '        display: block; ' +
          '        margin-bottom: 5px; ' +
          '        overflow: auto; ' +
          '    } ' +
          '    a.donations_campaign * { ' +
          '        box-sizing: border-box; ' +
          '    } ' +
          '    a.donations_campaign > img.logo { ' +
          '        padding: 15px 20px; ' +
          '        height: 90px; ' +
          '        display: block; ' +
          '        float: left; ' +
          '        min-width: 164px; ' +
          '    } ' +
          '    a.donations_campaign > .donate_btn { ' +
          '        float: right; ' +
          '        background: #f72f21; ' +
          '        color: white; ' +
          '        text-transform: uppercase; ' +
          '        border-radius: 3px; ' +
          '        box-shadow: 3px 3px 5px 0px rgba(0,0,0,0.75); ' +
          '        margin: 24px 60px 0; ' +
          '        padding: 12px 8px; ' +
          '    } ' +
          '    a.donations_campaign > p { ' +
          '        font-weight: bold; ' +
          '        font-size: 1.2em; ' +
          '        padding-top: 10px; ' +
          '    } ' +
          '    @media only screen and (max-width: 767px) { ' +
          '        body.home #container .flex-viewport .mobile-slider { ' +
          '            margin-top: 0 !important; ' +
          '        } ' +
          '        a.donations_campaign { ' +
          '            margin-top: 75px; ' +
          '        } ' +
          '        a.donations_campaign p{ ' +
          '            text-align: center; ' +
          '        } ' +
          '        a.donations_campaign > img.logo { ' +
          '            height: auto; ' +
          '            width: 30%; ' +
          '        } ' +
          '        a.donations_campaign > .donate_btn { ' +
          '            margin: 16px 27px; ' +
          '            padding: 6px 4px; ' +
          '        } ' +
          '        a.donations_campaign > p { ' +
          '            font-size: 1em; ' +
          '            padding-top: 0; ' +
          '        } ' +
          '    } ' +
          '    @media only screen and (max-width: 549px) { ' +
          '        a.donations_campaign > img.logo { ' +
          '            padding: 30px 10px; ' +
          '        } ' +
          '        a.donations_campaign > .donate_btn { ' +
          '            margin: 30px 17px; ' +
          '            padding: 6px 4px; ' +
          '        } ' +
          '    } ' +
          '    @media only screen and (max-width: 465px) { ' +
          '        a.donations_campaign > img.logo { ' +
          '            min-width: 100px; ' +
          '        } ' +
          '        a.donations_campaign > .donate_btn { ' +
          '            font-size: 0.8em; ' +
          '        } ' +
          '    } ' +
          '    @media only screen and (max-width: 413px) { ' +
          '        a.donations_campaign > p { ' +
          '            clear: both; ' +
          '            padding: 10px; ' +
          '            text-align: center; ' +
          '        } ' +
          '        a.donations_campaign > img.logo { ' +
          '            padding: 15px 10px 0; ' +
          '            width: 40%; ' +
          '        } ' +
          '        a.donations_campaign > .donate_btn { ' +
          '            margin: 15px 17px 0; ' +
          '            padding: 6px 4px; ' +
          '        } ' +
          '    } ' +
          '</style>' +
          '<a class="donations_campaign" href="https://www.realclearfoundation.org/donations.html?utm_source=health_hp_banner&amp;utm_medium=webpage&amp;utm_campaign=dec_2020_year_end_donations">' +
          '<img class="logo" src="https://www.realclearpolitics.com/asset/img/foundation_logo_grey.png" alt="RealClearFoundation"/>' +
          '<div class="donate_btn">Donate Now</div>' +
          '<p style="font-size:1.1em; text-align: center;">An investment in the maintenance of democracy:' +
          '<br/>please consider making a year-end donation.\n' +
          '</p>' +
          '</a>'

      /* Display the banner */
      document.querySelector('.RC-AD-MOBILE-BANNER').insertAdjacentElement('beforebegin', banner)
    }
  }
}