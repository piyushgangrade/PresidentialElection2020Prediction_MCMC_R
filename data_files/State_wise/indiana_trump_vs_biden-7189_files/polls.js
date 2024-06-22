
// TEMP if certain dyn page, redirect to www
if(window.location.href == 'https://dyn.realclearpolitics.com/epolls/2017/senate/al/alabama_senate_special_election_moore_vs_jones-6271.html') {
  window.location = 'https://www.realclearpolitics.com/epolls/2017/senate/al/alabama_senate_special_election_moore_vs_jones-6271.html';
}

// Init Datadome
!function(a,b,c,d,e,f){a.ddjskey=e;a.ddoptions=f||null;var m=b.createElement(c),n=b.getElementsByTagName(c)[0];m.async=1,m.src=d,n.parentNode.insertBefore(m,n)}(window,document,"script","https://js.datadome.co/tags.js","3ACEBA20A5E1BB7C78506502845CE0", { ajaxListenerPath: true });


var resize_timeout_polling_table;

$(window).resize(throttle_resize_polling_table);

// Sticky polls header with distroscale
/*$( window ).scroll(function() {

  //this class comes into existance when the user clicks on the DST close button - 
  if( $('.polls_header_and_banner').hasClass('force_no_sticky') ){
    return;
  }

  if( $('#ds_cpp').length && $('.polls_header_and_banner').length && $(document).scrollTop() > 55 ) {
    $('.polls_header_and_banner').addClass('stick');
  } else {
    $('.polls_header_and_banner').removeClass('stick');
  }
});*/

function throttle_resize_polling_table()
{
  window.clearTimeout(resize_timeout_polling_table);
  resize_timeout_polling_table = setTimeout(window_resize_polling_table, 70);
}

function window_resize_polling_table()
{
  var w_width = window.innerWidth;
  $('.polling_dt').each(function()
  {
    if( w_width < parseInt($(this).attr('data-diag')) ) {
      $(this).addClass('go_diag');
    } else {
      $(this).removeClass('go_diag');
    }
  });

  // Mark beta-container if within range
  if( w_width < parseInt($('.polling_dt').attr('data-diag')) + 325 ) {
    $('body.polls .beta-container').addClass('one_col');
    $('body.polls .alpha').addClass('one_col');
  } else {
    $('body.polls .beta-container').removeClass('one_col');
    $('body.polls .alpha').removeClass('one_col');
  }

  // Make first column of larger polling data table same width as top version
  if( $('#polling-data-rcp').length && $('#polling-data-full').length ) {

    var top_table_width = $('#polling-data-rcp table.data tr td:first-child').width();
    $('#polling-data-full table.data tr td:first-child').width(top_table_width);
  }
}

function init_polls_dropdown() {

  var i;
  var elems = document.querySelectorAll('.search_by_race'); // Works back to IE8

  for(i in elems) {
    elems[i].onchange = polls_dropdown_change;
  }

  // New dropdowns
  var i;
  var elems = document.querySelectorAll('.dropdown_president');

  for(i in elems) {
    elems[i].onchange = polls_dropdown_change;
  }
  
  var i;
  var elems = document.querySelectorAll('.dropdown_senate');

  for(i in elems) {
    elems[i].onchange = polls_dropdown_change;
  }
  
  var i;
  var elems = document.querySelectorAll('.dropdown_governor');

  for(i in elems) {
    elems[i].onchange = polls_dropdown_change;
  }
}

function polls_dropdown_change() {
  window.location.href = this.options[this.selectedIndex].value;
}

$(function(){

  fill_four_years_ago_rows();

  window_resize_polling_table();

  init_quick_links();


  //preview = getQueryVariable('preview');
  //console.log('test:'+preview) 
  //if(preview=='true'){

    //$('.RC-AD-BOTTOM-BANNER').after("<div id='taboolaWidget' data-module='polls' data-type='polls'></div>");
    //taboolaWidget();

    //$('.RC-AD-BOTTOM-BANNER').after("<div id='revContentWidget'></div>");
    //loadRevContentWidgets(); 

  //}

  // Bold the current page in map_nav (legacy)
  $('#under-title .map_nav a').each(function() {

    var link_arr = $(this).attr('href').split('/');
    var file_name = link_arr[link_arr.length - 1];
    var folder_name = link_arr[link_arr.length - 2];
    var url_arr = window.location.href.split('.html');
    var this_url = url_arr[0]+'.html';
    var this_ulr_arr = this_url.split('/');
    var this_file_name = this_ulr_arr[this_ulr_arr.length - 1];
    var this_folder_name = this_ulr_arr[this_ulr_arr.length - 2];

    //console.log('file_name: '+file_name);
    //console.log('this_file_name: '+this_file_name);
    if(file_name == this_file_name && folder_name == this_folder_name) {
      $(this).attr('style', 'font-weight:bold;');
    }
  });

  // Bold the current page in map_nav (2022+)
  $('#under-title-desktop .map_nav a, #under-title-phone .map_nav a').each(function() {

    var link_arr = $(this).attr('href').split('/epolls/');
    var link_url = link_arr[1];

    var this_url_arr = window.location.href.split('/epolls/');
    var this_url = this_url_arr[1];

    console.log(this_url+', '+link_url);

    if(this_url == link_url) {
      $(this).attr('style', 'font-weight:bold;');
    }
  });

  // Bold the current page in compare_links
  $('.compare_links a').each(function() {

    var link_arr = $(this).attr('href').split('/');
    var file_name = link_arr[link_arr.length - 1];
    var folder_name = link_arr[link_arr.length - 2];
    var url_arr = window.location.href.split('.html');
    var this_url = url_arr[0]+'.html';
    var this_ulr_arr = this_url.split('/');
    var this_file_name = this_ulr_arr[this_ulr_arr.length - 1];
    var this_folder_name = this_ulr_arr[this_ulr_arr.length - 2];

    if(file_name == this_file_name && folder_name == this_folder_name) {
      $(this).attr('style', 'font-weight:bold;');
    }
  });
});

var quick_link_data = {};
var quick_link_top_senate_races = [];
var quick_link_top_governor_races = [];
var quick_link_year = '';

function finish_quick_links() {

  if(typeof quick_link_data.quick_links === 'undefined' || 
    typeof quick_link_data.dropdowns === 'undefined') {

    return;
  }

  var html = ' \
    <div class="quick_links_content"> \
    '+atob(quick_link_data.quick_links['html_base64'])+' \
    </div> \
    <div class="filter_content"> \
      \
      <div class="filter_section"> \
        <h4>Year</h4> \
        <select class="multi_select" id="af_year" name="af_year[]" multiple="multiple"> \
        \
        </select> \
      </div> \
      \
      <div class="filter_section"> \
        <h4>State <button class="select_all_button">&larr; Select All</button></h4> \
        <select class="multi_select" id="af_state" name="af_state[]" multiple="multiple"> \
        \
        </select> \
      </div> \
      \
      <div class="filter_section"> \
        <h4>Type</h4> \
        <select class="multi_select" id="af_type" name="af_type[]" multiple="multiple"> \
        \
        </select> \
      </div> \
      \
      <div class="filter_section"> \
        <button class="filter_button">Apply Filter</button> \
        <button class="clear_filter_button">Clear Filter</button> \
      </div> \
      \
      <div class="results"> \
        <h4>Results</h4> \
        <div class="race_results"> \
          Select one or more years, states and race types, then click "Apply Filter" to see results. \
        </div> \
      </div> \
      \
    </div> \
    <div class="open"> \
      <div class="arrow"><img src="/asset/img/grey-bg-chev.png" alt="Arrow" /></div> \
      <div class="quick_links_title">Quick <span>Poll/Map</span> Links</div> \
      <div class="find_a_poll_title"><span>Find <span class="large">Any</span><span class="small">a</span> Poll</span> <input type="text" id="find_a_poll" name="find_a_poll" placeholder="Try \'State,\' or \'Candidate\'" /></div> \
      '+quick_link_data.dropdowns+' \
    </div> \
  ';

  $('.polls_header_2_dropdown').html(html);

  init_polls_dropdown();

  // From rcp.js, must be run again
  init_quick_links_advanced_filter();
}

function init_quick_links() {

  // Load quick links dynamically if appropriate
  // "false &&" temporarily disables
  var year = '';
  if($('.polls_header_2_dropdown').attr('data-year')) {
    year = $('.polls_header_2_dropdown').attr('data-year');
  }
  if(year != '' && $('.polls_header_2_dropdown').length && 
    typeof $('.polls_header_2_dropdown').attr('data-year') !== 'undefined') {

    //var year = parseInt( $('.polls_header_2_dropdown').attr('data-year') );
    var year = $('.polls_header_2_dropdown').attr('data-year');

    // Default values are for 2022
    var year_id = 32;
    var senate_map_id = 35;
    var governor_map_id = 36;
    quick_link_top_senate_races = ['AZ','FL','IN','MI','MS_SENATE_2','MN_SENATE_2','MO','MT','NJ','NV','ND','OH','PA','TN','TX','WV','WI'];
      quick_link_top_governor_races = ['AK','AZ','CO','FL','GA','IL','IA','KS','MD','MI','MN','NV','NM','OH','OR','TN','TX','WI'];
    quick_link_year = '2020';

    if(year == '2018_test' || year == '2018') {

      year_id = 28;
      senate_map_id = 35;
      governor_map_id = 36;
      quick_link_top_senate_races = ['AZ','FL','IN','MI','MS_SENATE_2','MN_SENATE_2','MO','MT','NJ','NV','ND','OH','PA','TN','TX','WV','WI'];
      quick_link_top_governor_races = ['AK','AZ','CO','FL','GA','IL','IA','KS','MD','MI','MN','NV','NM','OH','OR','TN','TX','WI'];
      quick_link_year = '2018';
    }

    // Get senate and gov map json, and quick links
    var ql_cache_bust = Math.floor(Date.now() / (1000 * 60 * 5) ); // Every 5 min

    $.getJSON('/quick_links/'+year_id+'.json?cache='+ql_cache_bust, function(data) { 
      quick_link_data.quick_links = data;
      finish_quick_links();
    });
    /*$.getJSON('/epolls/json/'+senate_map_id+'_map.js?cache='+ql_cache_bust, function(data) { 
      quick_link_data.senate = data;
      finish_quick_links();
    });
    $.getJSON('/epolls/json/'+governor_map_id+'_map.js?cache='+ql_cache_bust, function(data) { 
      quick_link_data.governor = data;
      finish_quick_links();
    });*/
    $.ajax({
      url: '/epolls/2022/widget/dropdown.html?cache='+ql_cache_bust,
      'dataType': 'html'
    }).done(function(data) {
      quick_link_data.dropdowns = data;
      finish_quick_links();
    });
  
  } else {

    init_polls_dropdown();
  }
}

/* Use for Four Years Ago rows on RCP Electoral Spread table */

var state_races_2016 = {
  "AZ": [
    {
        "id": "6087", // 4-way  //Wed, 24 Aug 2016
        "start_date": "2016-08-24",
    },
    {
        "id": "6088", // 3-way  //Wed, 24 Aug 2016
        "start_date": "2016-08-24",
    },
    {
        "id": "5832", // 2-way  //Mon, 25 Apr 2016
        "start_date": "2016-04-25",
    },
  ],
  "AR": [
    {
        "id": "6137", // 4-way  //Fri, 23 Sep 2016
        "start_date": "2016-09-23",
    },
    {
        "id": "5977", // 3-way  //Fri, 23 Sep 2016
        "start_date": "2016-09-23",
    },
    {
        "id": "5899", // 2-way  //Fri, 23 Sep 2016
        "start_date": "2016-09-23",
    },
  ],
  "CA": [
    {
        "id": "6083", // 4-way   //Tue, 13 Sep 2016
        "start_date": "2016-09-13",
    },
    {
        "id": "6002", // 3-way  //Thu, 28 Jul 2016
        "start_date": "2016-07-28",
    },
    {
        "id": "5849", // 2-way  //Tue, 05 Apr 2016
        "start_date": "2016-04-05",
    },
  ],
  "CO": [
    {
        "id": "5974", // 4-way  //Wed, 13 Jul 2016
        "start_date": "2016-07-13",
    },
    {
        "id": "5973", // 3-way  //Thu, 14 Jul 2016
        "start_date": "2016-07-14",
    },
    {
        "id": "5751", // 2-way  //Sat, 09 Jul 2016
        "start_date": "2016-07-09",
    },
  ],
  "FL" : [
    {
      "id" : "5963", // 4-way
      "start_date" : "2016-06-21",
    },
    {
      "id" : "5956", // 3-way
      "start_date" : "2016-06-07",
    },
    {
      "id" : "5635", // 2-way
      "start_date" : "2015-09-15",
    },
  ],
  "NH" : [
    {
      "id" : "6022", // 4-way
      "start_date" : "2016-08-04",
    },
    {
      "id" : "6023", // 3-way
      "start_date" : "2016-08-04",
    },
    {
      "id" : "5596", // 2-way
      "start_date" : "2015-09-06",
    },
  ],
  "IA" : [
    {
      "id" : "5981", // 4-way
      "start_date" : "2016-07-12",
    },
    {
      "id" : "6007", // 3-way
      "start_date" : "2016-08-11",
    },
    {
      "id" : "5597", // 2-way
      "start_date" : "2015-09-06",
    },
  ],
  "MO" : [
    {
      "id" : "6009", // 4-way
      "start_date" : "2016-07-29",
    },
    {
      "id" : "6077", // 3-way
      "start_date" : "2016-07-29",
    },
    {
      "id" : "5609", // 2-way
      "start_date" : "2016-03-12",
    },
  ],
  "GA" : [
    {
      "id" : "5954", // 4-way
      "start_date" : "2016-07-25",
    },
    {
      "id" : "5968", // 3-way
      "start_date" : "2016-07-25",
    },
    {
      "id" : "5741", // 2-way
      "start_date" : "2016-05-07",
    },
  ],
  "MI" : [
    {
      "id" : "6008", // 4-way   //Sun, 17 Jul 2016
      "start_date" : "2016-07-17",
    },
    {
      "id" : "5953", // 3-way   //Mon, 18 Jul 2016
      "start_date" : "2016-07-18",
    },
    {
      "id" : "5533", // 2-way  //Fri, 21 Aug 2015
      "start_date" : "2015-08-21",
    },
  ],
  "NC" : [
    /*{
      "id" : "5972", // 4-way  //Sun, 26 Jun 2016
      "start_date" : "2016-06-26",
    },*/
    {
      "id" : "5951", // 3-way  //Tue, 09 Aug 2016
      "start_date" : "2016-08-09",  
    },
    {
      "id" : "5538", // 2-way  //Tue, 16 Feb 2016
      "start_date" : "2016-02-16",
    },
  ],
  "OH" : [
    {
      "id" : "5970", // 4-way   //Wed, 13 Jul 2016
      "start_date" : "2016-07-13",
    },
    {
      "id" : "5969", // 3-way  //Wed, 13 Jul 2016
      "start_date" : "2016-07-13",
    },
    {
      "id" : "5634", // 2-way  //Wed, 09 Mar 2016
      "start_date" : "2016-03-09",
    },
  ],
  "PA" : [
    {
      "id" : "5964", // 4-way   //Tue, 21 Jun 2016
      "start_date" : "2016-06-21",
    },
    {
      "id" : "5965", // 3-way   //Tue, 21 Jun 2016
      "start_date" : "2016-06-21",
    },
    {
      "id" : "5633", // 2-way  //Thu, 10 Mar 2016
      "start_date" : "2016-03-10",
    },
  ],
  "WI" : [
    {
      "id" : "5976", // 4-way   //Sun, 24 Jul 2016
      "start_date" : "2016-07-24",
    },
    {
      "id" : "5975", // 3-way   //Wed, 13 Jul 2016
      "start_date" : "2016-07-13",
    },
    {
      "id" : "5659", // 2-way  //Mon, 07 Nov 2016
      "start_date" : "2016-11-07",
    },
  ],
  "NV": [
    {
        "id": "6086", // 4-way
        "start_date": "2016-09-11",
    },
    {
        "id": "6004", // 3-way
        "start_date": "2016-07-15",
    },
    {
        "id": "5891", // 2-way
        "start_date": "2016-07-11",
    },
  ],
  "ME": [
    {
        "id": "6091", // 4-way
        "start_date": "2016-08-08",
    },
    {
        "id": "6092", // 3-way
        "start_date": "2016-09-13",
    },
    {
        "id": "5896", // 2-way
        "start_date": "2016-08-11",
    },
  ],
  "TX": [
    {
        "id": "6104", // 4-way
        "start_date": "2016-09-15",
    },
    {
        "id": "6105", // 3-way
        "start_date": "2016-09-15",
    },
    {
        "id": "5694", // 2-way
        "start_date": "2016-08-12",
    },
  ],
  "MN": [
    {
        "id": "6138", // 4-way
        "start_date": "2016-09-26",
    },
    {
        "id": "6139", // 3-way
        "start_date": "2016-09-26",
    },
    {
        "id": "5591", // 2-way
        "start_date": "2015-11-09",
    },
  ],
};

/* Four Years Ago rows on RCP Electoral Spread table */
/* Currently used just for trump and clinton 2016 races, assumes as much */
function fill_four_years_ago_rows() {

  if($('body.maps .battlegrounds td.four_years_ago').length == 0) {
    return;
  }
  
  $('body.maps .battlegrounds td.four_years_ago').each(function(el) {

    // Get proper race ID for 2016 given postal. Determine based on availability
    // of 4-way vs 2-way based on dates each started, using pre-constructed array

    var race_postal = $(this).attr('data-postal');

    if(typeof state_races_2016[race_postal] === 'undefined') {
      return;
    }

    // Use this if doing 4 years ago on this date
    //var fya_date = new Date();
    //fya_date.setFullYear( fya_date.getFullYear() - 4 );
    //var fya_ymd = fya_date.getUTCFullYear() + "-" + (fya_date.getUTCMonth() + 1) + "-" + fya_date.getUTCDate();
    
    // Use this if doing days-until-election comparison 2020 vs 2016
    var date_offset = (24*60*60*1000) * 1456;
    var fya_date = new Date();
    fya_date.setHours(0,0,0,0);
    fya_date.setTime( fya_date.getTime() - date_offset );
    var fya_ymd = fya_date.getUTCFullYear() + "-" + (fya_date.getUTCMonth() + 1) + "-" + fya_date.getUTCDate();

    var race_id = 0;

    state_races_2016[race_postal].some(function(r) {

      var r_date = new Date(r.start_date);
      if( r_date.getTime() < fya_date.getTime() ) {
        race_id = r.id;
        return true;
      }
    }.bind(this));

    if(race_id == 0) { // use last race if no match found
      race_id = state_races_2016[race_postal][state_races_2016[race_postal].length - 1].id;
    }

    var cache_bust = Math.floor(Date.now() / (1000 * 60 * 5) ); // Every 5 min

    $.getJSON('/poll/race/'+race_id+'/historical_data.json?cache='+cache_bust, function(data) { 

      // Calculate and show spread for today's date four years ago

      var fya_avg = {};

      data.rcp_avg.some(function(avg) {

        // This method might be off by an hour. Revisit if better accuracy needed.
        // Might want to test from locales in other timezones
        var avg_date = new Date(avg.date);
        var avg_ymd = avg_date.getUTCFullYear() + "-" + (avg_date.getUTCMonth() + 1) + "-" + avg_date.getUTCDate();
        
        if( avg_ymd == fya_ymd ) {
          fya_avg = avg;
          return true;
        } else if ( avg_date.getTime() < fya_date.getTime() ){
          fya_avg = avg;
          return true;
        }

      }.bind(this));

      var spread_str = "";

      var clinton_val = 0;
      var trump_val = 0;

      fya_avg['candidate'].forEach(function(c) {
        if(c.name.toLowerCase() == 'clinton') {
          clinton_val = parseFloat(c.value);
        } else if(c.name.toLowerCase() == 'trump') {
          trump_val = parseFloat(c.value);
        }
      });

      if(trump_val == 0 || clinton_val == 0) {
        return;
      }

      if(clinton_val == trump_val) {
        spread_str = "Tie";
      } else if(clinton_val > trump_val) {
        spread_str = "Clinton +"+(clinton_val-trump_val).toFixed(1);
      } else if(clinton_val < trump_val) {
        spread_str = "Trump +"+(trump_val-clinton_val).toFixed(1);
      }

      $(this).html("<a href="+data.link+">"+spread_str+"</a>");

      $(this).addClass('loaded');

    }.bind(this));
  });
}