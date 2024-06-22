/*

2018 Live Results App - Vue.js app

Summary:
Displays results in three different places on homepage:
Top level results for Sen/Gov/House
Key races for Sen/Gov/House
Map Slider for Sen/Gov/House

Dependencies:
Vue js 2.5.13
Axios 0.18.0

Browser Requirements:
IE9+

Table of Contents:

Shared Variables and Functions
Alpha 1 widget
Alpha 2 widget
Beta 1 widget

Technical Notes:

Each page is handled as a separate vue app, with it's own component.
Except in the case of the homepage, which has three separate apps, one per widget.

The homepage has a special process for fetching data due to multiple apps on the same page.
It uses a function that accumulates callbacks, but only does one fetch at a time.
This reduced the amount of times homepage.json is retrieved.

*/

// HOMEPAGE DATA FETCH /////////////////////////////////////////////////////////

var rcp_refresh_interval = 90; // Seconds between auto refresh
var rcp_hp_fetching_data = false;
var rcp_hp_fetch_callbacks = [];

var E2020_PUB_PATH = '/elections/live_results/2020';

var rcp_cache_bust = function() {
  // Returns a unique value that is different every 10 sec
  return Math.round(new Date().getTime() / 10000);
}

var rcp_hp_fetch_data = function(callback) {

  rcp_hp_fetch_callbacks.push(callback);

  if(!rcp_hp_fetching_data) {

    rcp_hp_fetching_data = true;
    //axios.get('/elections/live_results/2018/homepage.json?cache_bust='+rcp_cache_bust())
    axios.get(E2020_PUB_PATH+'/homepage.json?cache_bust='+rcp_cache_bust())
    .then(function(response) {

      for(var i = 0; i < rcp_hp_fetch_callbacks.length; i++) {
        rcp_hp_fetch_callbacks[i](response);
      }
      rcp_hp_fetch_callbacks = [];
      rcp_hp_fetching_data = false;
    });

    // axios.get('/json/ap_results/2016_general/data_president.json?cache_bust='+rcp_cache_bust())
    // .then(function(response) {

    //   // for(var i = 0; i < rcp_hp_fetch_callbacks.length; i++) {
    //   //   rcp_hp_fetch_callbacks[i](response);
    //   // }
    //   // rcp_hp_fetch_callbacks = [];
    //   // rcp_hp_fetching_data = false;
    // });
  }
}

// FUNCTIONS TO HELP SHARE METHODS ACROSS APPS /////////////////////////////////

var rcp_merge_methods = function(obj1,obj2) {

    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

var rcp_shared_methods = {

  capitalize_string : function(str) {
      return str.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
  },

  electoral_votes_for_state : function(region_key) {

    var states = {
      'AK' : 3,
      'AL' : 9,
      'AR' : 6,
      'AZ' : 11,
      'CA' : 55,
      'CO' : 9,
      'CT' : 7,
      'DC' : 3,
      'DE' : 3,
      'FL' : 29,
      'GA' : 16,
      'HI' : 4,
      'IA' : 6,
      'ID' : 4,
      'IL' : 20,
      'IN' : 11,
      'KS' : 6,
      'KY' : 8,
      'LA' : 8,
      'MA' : 11,
      'MD' : 10,
      'ME' : 4,
      'MI' : 16,
      'MN' : 10,
      'MO' : 10,
      'MS' : 6,
      'MT' : 3,
      'NC' : 15,
      'ND' : 3,
      'NE' : 5,
      'NH' : 4,
      'NJ' : 14,
      'NM' : 5,
      'NV' : 6,
      'NY' : 29,
      'OH' : 18,
      'OK' : 7,
      'OR' : 7,
      'PA' : 20,
      'RI' : 4,
      'SC' : 9,
      'SD' : 3,
      'TN' : 11,
      'TX' : 38,
      'UT' : 6,
      'VA' : 13,
      'VT' : 3,
      'WA' : 12,
      'WI' : 10,
      'WV' : 5,
      'WY' : 3,
    };

    if(typeof states[region_key] === 'undefined') {
      return 0;
    } else {
      return states[region_key];
    }
  },

  races_with_vote_totals : function(races) {

    // Requires 'races' object be fully populated with data

    for(var i = 0; i < races.length; i++) {

      var vote_total = 0;

      for(var j = 0; j < races[i].reportingUnit.candidates.length; j++) {

        var c = races[i].reportingUnit.candidates[j];

        vote_total += parseInt(c.voteCount);
      }

      races[i]['voteTotal'] = vote_total;
    }

    return races;
  },

  electoral_display : function(postal) {

    var val = this.electoral_votes_for_state(postal.toUpperCase());

    if(postal.toUpperCase() == 'ME') {
      val = '3*';
    } else if(postal.toUpperCase() == 'NE') {
      val = '4*';
    }

    return val;
  },

  state_name_display : function(state_name, seat_name, election_type) {

    var final_name = state_name + (seat_name != null ? ' '+this.seat_display(seat_name) : '');

    if(election_type == 'senate') {
      if(final_name == 'Arizona Special') {
        return 'Arizona';
      }
    }

    if(election_type == 'president') {
      if(final_name == "District of Columbia") {
        return 'D.C.';
      }
    }

    return final_name;
  },

  net_display : function(num) {

    if(num > 0) {
      return '(+'+num+')';
    } else if(num < 0) {
      return '('+num+')';
    } else {
      return '';
    }
  },

  has_winner : function(race) {

    var winner = this.find_winner(race);

    if( typeof winner.party !== 'undefined' ) {
      return true;
    }

    return false;
  },

  winner_party : function(race) {

    var winner = this.find_winner(race);

    if( typeof winner.party !== 'undefined' ) {
      return winner.party.toLowerCase();
    }

    return '';
  },

  winner_is_pickup : function(race) {

    var winner = this.find_winner(race);

    if( typeof winner.party !== 'undefined' ) {

      if(race.holding_party != this.party_name_to_basename(winner.party)) {
        return true;
      }
    }

    return false;
  },

  winner_hold_pickup_text : function(race) {

    var winner = this.find_winner(race);
    var text = '';

    if( typeof winner.party !== 'undefined' ) {

      var winner_party = winner.party;

      if(winner['first'] == 'Bernie' && winner['last'] == 'Sanders') {
        winner_party = 'Dem';
      }

      text += winner_party + ' ';

      if(race.holding_party != this.party_name_to_basename(winner.party)) {
        text += 'Pickup';
      } else {
        text += 'Hold';
      }
    }
  
    var is_runoff = this.find_runoff(race);
    if(Object.keys(is_runoff).length > 0){
      text = 'Runoff';
    }

    // Temporarily hide runoff for GA Senate (non-special) 2020
    /*if(race['raceID'] == "12301") {
      text = '';
    }*/

    // Called LA5 for top candidates so it would flow into GOP numbers,
    // but still displayin as runoff using this logic
    if(race['raceID'] == "20052") {
      text = 'GOP Hold/Runoff';
    }

    text = text.replace("Dem", "<span class='full'>Dem</span><span class='short'>D</span>");
    text = text.replace("GOP", "<span class='full'>GOP</span><span class='short'>R</span>");

    return text;
  },

  vote_perc_display : function(num, total) {

    if(total > 0) {
      return (Math.round((parseInt(num) / parseInt(total)) * 1000) / 10).toFixed(1);
    } else {
      return "0.0";
    }
  },

  party_name_to_basename : function(bn) {

    if(bn == 'GOP') {
      return 'gop';
    } else if(bn == 'Dem') {
      return 'dem';
    } else {
      return bn.toLowerCase().replace(/ /g,"_");
    }
  },

  party_basename_to_name : function(bn) {

    if(bn == 'gop') {
      return 'GOP';
    } else if(bn == 'dem') {
      return 'Dem';
    } else {
      return bn.charAt(0).toUpperCase() + bn.slice(1); // Capitalize
    }
  },

  find_winner : function(race) {

    for(var i = 0; i < race.reportingUnit.candidates.length; i++) {

      var c = race.reportingUnit.candidates[i];

      if(c.winner_override != null && c.winner_override.toLowerCase() == 'x') {
        return c;
      }
    }

    for(var i = 0; i < race.reportingUnit.candidates.length; i++) {

      var c = race.reportingUnit.candidates[i];

      if(c.winner != null && c.winner.toLowerCase() == 'x') {
        return c;
      }
    }

    return {};
  },

  find_runoff : function(race) {
    
    for(var i = 0; i < race.reportingUnit.candidates.length; i++) {

      var c = race.reportingUnit.candidates[i];

      if(c.winner_override != null ) {
        if(c.winner_override.toLowerCase() == 'r'){
          return c;
        }
      }
    }

    for(var i = 0; i < race.reportingUnit.candidates.length; i++) {

      var c = race.reportingUnit.candidates[i];

      if(c.winner != null) {
        if(c.winner.toLowerCase() == 'r'){
          return c;
        } 
      }
    }

    return {};
  },

  candidates_with_party : function(candidates, party, limit) {

    // NOTE: Right now a limit of anything over 0 does the same thing:
    // returns highest voted candidate for that party

    var cwp = this.find_objects(candidates, 'party', party);
    
    // Find one matching candidate with most votes
    var top_index = 0;
    var top_votes = 0;
    var return_candidates = [];

    if(cwp.length > 0 && limit > 0) {

      for(var i = 0; i < cwp.length; i++) {

        if(parseInt(cwp[i].voteCount) > top_votes) {
          top_votes = cwp[i].voteCount;
          top_index = i;
        }

        // GA Special override of what candidates show in Dem and GOP fields

        if(cwp[i]['ru_id'] == "2057" && party == 'GOP' && cwp[i]['last'] == "Loeffler") {
          top_index = i;
          break;
        }
        if(cwp[i]['ru_id'] == "2057" && party == 'Dem' && cwp[i]['last'] == "Warnock") {
          top_index = i;
          break;
        }
      }
      return_candidates.push(cwp[top_index]);
    }
    return return_candidates;
  },

  column_candidates : function(candidates, col_num) {

    if(candidates[0]['ru_id'] == "2057") {

      // GA Special override of what candidates show in "other" columns

      var return_candidates = [];

      for(var i = 0; i < candidates.length; i++) {

        if(candidates[i]['last'] == 'Collins') {
          return_candidates.push(candidates[i]);
        }
      }

      return return_candidates;

    } else {

      // Default behavior

      return this.find_objects(candidates, 'show_in_column', col_num, 1);
    }
    
  },

  any_column_candidates : function(races, col_num) {

    for(var i = 0; i < races.length; i++) {

      var candidates = races[i]['reportingUnit']['candidates'];

      // If any races are GA special, return true because we are showing a third candidate
      if(candidates[0]['ru_id'] == "2057") {
        return true;
      }

      // Default behavor, find if any candidates marked as "show_in_column"
      for(var j = 0; j < candidates.length; j++) {
        if(candidates[j]['show_in_column'] == col_num) {
          return true;
        }
      }
    }

    return false;
  },

  find_objects : function(arr_of_objs, key, val, limit) {

    var objects = [];

    var count = 0;

    if(typeof limit === 'undefined') {
      limit = 9999999999999999999999;
    }

    for(var i = 0; i < arr_of_objs.length; i++) {

      if( typeof arr_of_objs[i][key] === 'undefined' ) {
        continue;
      }

      if( arr_of_objs[i][key] == val ) {

        objects.push(arr_of_objs[i]);
        count++;
        if(count >= limit) {
          break;
        }
      }
    }

    return objects;
  },

  seat_display : function(seat_str) {

    if(seat_str == 'Unexpired Term') {
      return 'Special';
    }

    return seat_str.replace('District', '<span class="district_label">District</span>');
  },

  party_display : function(c) {

    if( (c['first'] == 'Bernie' && c['last'] == 'Sanders') || (c['first'] == 'Angus' && c['last'] == 'King') ) {
      return 'Dem';
    }

    return c['party'];
  },

  race_detail_link : function(race, page_basename) {

    if(race.seatName == 'Unexpired Term' && race.statePostal == 'GA') {
      //return '';
      return E2020_PUB_PATH+'/state/'+race.reportingUnit.statePostal.toLowerCase()+'/'+this.featured_race_type_to_race_type(page_basename)+'/'+race.reportingUnit.statePostal.toLowerCase()+'_special.html';
    } else { 
      return E2020_PUB_PATH+'/state/'+race.reportingUnit.statePostal.toLowerCase()+'/'+this.featured_race_type_to_race_type(page_basename)+'/';
    }
  },

  featured_race_type_to_race_type : function(str) {

    var type_matchup = {
      "senate" : "senate",
      "governor" : "governor",
      "house" : "house",
      "house_top_50" : "house",
      "house_northeast" : "house",
      "house_midwest" : "house",
      "house_south" : "house",
      "house_west" : "house",
      "house_alt" : "house",
      "president" : "president", //DN
    };

    return type_matchup[str];
  },

  display_precincts_perc : function(race) {

    /*if(race.officeName == 'U.S. Senate' && race.stateName == 'Arizona') {
      return '(---%)';
    }*/

    //return '('+Math.round(Number(race.reportingUnit.precinctsReportingPct))+'%)';
    return '('+Math.round(Number(race.reportingUnit.precinctsReportingPct_rcp))+'%)';
  },

  get_candidate_data1 : function(last_name, get_value, cand){

    var cand = this.president_summary.candidates;
    if(typeof cand !== 'undefined' && cand.length > 0){
      for(i=0; i < cand.length; i++){
        var c = cand[i];
        if(c.last == last_name){
          
          var val = c[get_value];
          //=START = Just incase we need to override electoral count total
          // if(get_value == 'electWon' && last_name == 'Trump'){
          //   val = parseInt(val) + 16;
          // }
          // if(get_value == 'electWon' && last_name == 'Biden'){
          //   val = parseInt(val) + 16;
          // }
          //=END = 
          return val;
        }
      }
    }
    
  },
};

/////////////////////////////////
// LIVE RESULTS ALPHA 1 WIDGET //
/////////////////////////////////

Vue.component('rc-widget-live-results-alpha-1', {
  template: '\
\
  <div class="container">\
\
    <div class="e2018_banner">\
      <div class="text">&bigstar; <span>Election 2020</span> &bigstar;</div>\
    </div>\
\
    <div class="e2018_top_results">\
      \
      <div class="top_result">\
        <div class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">President</a></div>\
        <div class="score">\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
          <div v-show="first_load_done" class="party dem">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Biden/Harris</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="electoral_summary.Biden + \'\' "></a></div>\
          </div>\
          <div v-show="first_load_done" class="party gop">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Trump/Pence</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="electoral_summary.Trump + \'\' "></a></div>\
          </div>\
        </div>\
      </div>\
      \
      <!--<div class="top_result">\
        <div class="title"><a :href="\''+E2020_PUB_PATH+'/governor/\'">Governors PP</a></div>\
        <div class="score">\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
          <div v-show="first_load_done" class="party dem">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/governor/\'">Democrats</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/governor/\'" v-html="won_seats.governor.dem + \'\' + net_display(net_seats.governor.dem)"></a></div>\
          </div>\
          <div v-show="first_load_done" class="party gop">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/governor/\'">Republicans</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/governor/\'" v-html="won_seats.governor.gop + \'\' + net_display(net_seats.governor.gop)"></a></div>\
          </div>\
        </div>\
      </div>-->\
      \
      <div class="top_result">\
        <div class="title"><a :href="\''+E2020_PUB_PATH+'/senate/\'">U.S. Senate</a></div>\
        <div class="score">\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
          <div v-show="first_load_done" class="party dem">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/senate/\'">Democrats</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/senate/\'" v-html="won_seats.senate.dem + \'*\' + net_display(net_seats.senate.dem)"></a></div>\
          </div>\
          <div v-show="first_load_done" class="party gop">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/senate/\'">Republicans</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/senate/\'" v-html="won_seats.senate.gop + \'\' + net_display(net_seats.senate.gop)"></a></div>\
          </div>\
        </div>\
      </div>\
\
      <div class="top_result">\
        <div class="title"><a :href="\''+E2020_PUB_PATH+'/house/\'">U.S. House</a></div>\
        <div class="score">\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
          <div v-show="first_load_done" class="party dem">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/house/\'">Democrats</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/house/\'" v-html="won_seats.house.dem + \'\' + net_display(net_seats.house.dem)"></a></div>\
          </div>\
          <div v-show="first_load_done" class="party gop">\
            <div class="title"><a :href="\''+E2020_PUB_PATH+'/house/\'">Republicans</a></div>\
            <div class="score"><a :href="\''+E2020_PUB_PATH+'/house/\'" v-html="won_seats.house.gop + \'\' + net_display(net_seats.house.gop)"></a></div>\
          </div>\
        </div>\
      </div>\
\
    </div>\
\
    <div class="e2018_stars">********2020********</div>\
\
  </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "president_summary" : {},
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "won_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "net_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      }
    }
  },
  created : function() {

    this.get_data_for_alpha_1();

    // Start refresh cron
    this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_alpha_1();
      }
    },

    get_data_for_alpha_1 : function() {

      this.loading = true;
      // Retrieve live results data
      rcp_hp_fetch_data(function(response) {

        // Successfully retrieved data
        this.won_seats = response.data.won_seats;
        this.net_seats = response.data.net_seats;
        this.president_summary = response.data.president_summary;
        this.electoral_summary = response.data.electoral_summary;

        this.first_load_done = true;
        this.loading = false;

      }.bind(this));
    },

  })
}); // END rc-widget-live-results-alpha-1

// Start App
if(document.getElementById('live_results_alpha_1')) {
  new Vue({
    el: '#live_results_alpha_1'
  });
}
if(document.getElementById('live_results_alpha_1_mobile')) {
  new Vue({
    el: '#live_results_alpha_1_mobile'
  });
}

/////////////////////////////////
// LIVE RESULTS ALPHA 2 WIDGET //
/////////////////////////////////

Vue.component('rc-widget-pres-row', {
  props: ['races', 'race', 'election_type'],
  template: '\
<tr :class="[{\'race\' : true}, winner_party(race), {\'pickup\' : winner_is_pickup(race)}, {\'winner\' : has_winner(race)}]">\
  <td class="name"><div><a :href="race_detail_link(race, election_type.basename)" v-html="state_name_display(race.stateName, race.seatName, election_type.basename)+\' (\'+electoral_display(race.statePostal)+\')\'"></a></div></td>\
  <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1)" class="candidate">\
    <span v-if="election_type.basename != \'president\'" v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
  </td>\
  <td v-if="candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1).length == 0"></td>\
  <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1)" class="candidate">\
    <span v-if="election_type.basename != \'president\'" v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
  </td>\
  <td v-if="candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1).length == 0"></td>\
  <td v-for="candidate in column_candidates(race.reportingUnit.candidates, 1)" class="candidate other_party">\
    <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
  </td>\
  <td class="other_party" v-if="column_candidates(race.reportingUnit.candidates, 1).length == 0 && any_column_candidates(races[election_type.basename], 1)"></td>\
  <td class="spacer"></td>\
  <td class="percent_in"><div v-html="display_precincts_perc(race)"></div></td>\
  <!--<td class="hold"><div v-html="winner_hold_pickup_text(race)"></div></td>-->\
</tr>\
  ',

  methods : rcp_merge_methods(rcp_shared_methods, {

  }),

});

Vue.component('rc-widget-live-results-alpha-2', {
  props: {
    blacklist: {
      type: Array,
      default: function() { return [] },
    },
    house_alt: {
      type: Boolean,
      default: false,
    },
  },
  template: '\
\
  <div class="container">\
\
    <div class="e2018_results_blocks">\
\
      <div v-for="election_type in election_types" v-if="blacklist.indexOf(election_type.basename) == -1" class="results_block">\
\
        <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
        <div class="title">\
          <div class="text">&middot; <a :href="\''+E2020_PUB_PATH+'/\'+election_type.basename+\'/\'" v-html="election_type.name"></a> &middot;</div>\
          <div class="refresh" @click="fetch_data">Refresh</div>\
        </div>\
\
        <div v-if="first_load_done" class="overview">\
          <span v-if="election_type.basename == \'president\'" > \
            <span class="dem">Biden/Harris <a class="score" :href="\''+E2020_PUB_PATH+'/\'+election_type.basename+\'/\'" v-html="vote_percent_display_pres(\'Biden\') + \' (\' + electoral_summary.Biden + \')      \' "></a></span>\
            <span class="gop">Trump/Pence <a class="score" :href="\''+E2020_PUB_PATH+'/\'+election_type.basename+\'/\'" v-html="vote_percent_display_pres(\'Trump\')+ \' (\' + electoral_summary.Trump + \')\' "></a></span>\
          </span>\
          <span v-else> \
            <span class="dem">Democrats <a class="score" :href="\''+E2020_PUB_PATH+'/\'+election_type.basename+\'/\'" v-html="won_seats[election_type.basename][\'dem\'] + ( election_type.basename == \'senate\' ? \'* \' : \' \' ) + net_display(net_seats[election_type.basename][\'dem\'])"></a></span>\
            <span class="gop">Republicans <a class="score" :href="\''+E2020_PUB_PATH+'/\'+election_type.basename+\'/\'" v-html="won_seats[election_type.basename][\'gop\'] + \' \' + net_display(net_seats[election_type.basename][\'gop\'])"></a></span>\
          </span>\
        </div>\
\
        <!-- President -->\
          <template v-if="election_type.basename == \'president\'">\
            <!-- Full Column -->\
            <table v-if="first_load_done" class="races full_column">\
              <template v-for="(ct, cti) in closing_times_index_define">\
                <tbody>\
                  <tr>\
                    <th v-html="ct"></th>\
                    <th>Biden</th>\
                    <th>Trump</th>\
                    <th class="spacer"></th>\
                    <th class="other_party" v-if="any_column_candidates(races[election_type.basename], 1)"></th>\
                    <th class="percent_in"></th>\
                    <!--<th></th>-->\
                  </tr>\
                  <rc-widget-pres-row \
                    v-for="race in races[election_type.basename]"\
                    v-if="closing_times[race.statePostal] == cti"\
                    :races="races"\
                    :race="race"\
                    :election_type="election_type"\
                    :cti="cti"\
                  ></rc-widget-pres-row>\
                </tbody>\
              </template>\
            </table>\
            <!-- Two Column -->\
            <table v-if="first_load_done" class="races left_column">\
              <template v-for="(ct, cti) in closing_times_index_define">\
                <tbody>\
                  <tr>\
                    <th v-html="ct"></th>\
                    <th>Biden</th>\
                    <th>Trump</th>\
                    <th class="spacer"></th>\
                    <th class="other_party" v-if="any_column_candidates(races[election_type.basename], 1)"></th>\
                    <th class="percent_in"></th>\
                    <!--<th></th>-->\
                  </tr>\
                  <rc-widget-pres-row \
                    v-for="(race, race_index) in races[election_type.basename]"\
                    v-if="closing_times[race.statePostal] == cti && order_in_closing_time(race_index) % 2 == 1"\
                    :races="races"\
                    :race="race"\
                    :election_type="election_type"\
                    :cti="cti"\
                  ></rc-widget-pres-row>\
                </tbody>\
              </template>\
            </table>\
            \
            <table v-if="first_load_done" class="races right_column">\
              <template v-for="(ct, cti) in closing_times_index_define">\
                <tbody>\
                  <tr>\
                    <th></th>\
                    <th>Biden</th>\
                    <th>Trump</th>\
                    <th class="spacer"></th>\
                    <th class="other_party" v-if="any_column_candidates(races[election_type.basename], 1)"></th>\
                    <th class="percent_in"></th>\
                    <!--<th></th>-->\
                  </tr>\
                  <rc-widget-pres-row \
                    v-for="(race, race_index) in races[election_type.basename]"\
                    v-if="closing_times[race.statePostal] == cti && order_in_closing_time(race_index) % 2 == 0"\
                    :races="races"\
                    :race="race"\
                    :election_type="election_type"\
                    :cti="cti"\
                  ></rc-widget-pres-row>\
                  <tr v-if="last_in_closing_time_even(cti)"><td colspan="99">&nbsp;</td></tr>\
                </tbody>\
              </template>\
            </table>\
            \
          </template>\
        <!-- Other like senate, gov, house -->\
        <table v-if="first_load_done" class="races">\
          <tbody v-if="election_type.basename != \'president\'">\
          <tr>\
            <th></th>\
            <th>Democrat</th>\
            <th>Republican</th>\
            <th class="spacer"></th>\
            <th class="other_party" v-if="any_column_candidates(races[election_type.basename], 1)"></th>\
            <th class="percent_in"></th>\
            <th></th>\
          </tr>\
            <tr v-for="race in races[election_type.basename]" :class="[{\'race\' : true}, winner_party(race), {\'pickup\' : winner_is_pickup(race)}, {\'winner\' : has_winner(race) || [\'Georgia Special\', \'Georgia\'].indexOf(state_name_display(race.stateName, race.seatName, election_type.basename)) > -1}, {\'is_ga_special\': [\'Georgia Special\', \'Georgia\'].indexOf(state_name_display(race.stateName, race.seatName, election_type.basename)) > -1}]">\
              <td class="name"><div><a :href="race_detail_link(race, election_type.basename)" v-html="state_name_display(race.stateName, race.seatName, election_type.basename)"></a></div></td>\
              <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1)" class="candidate">\
                <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
              </td>\
              <td v-if="candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1).length == 0"></td>\
              <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1)" class="candidate">\
                <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
              </td>\
              <td v-if="candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1).length == 0"></td>\
              <td v-for="candidate in column_candidates(race.reportingUnit.candidates, 1)" class="candidate other_party" :style="state_name_display(race.stateName, race.seatName, election_type.basename) == \'Georgia Special\' ? \'font-weight:normal;\' : \'\'">\
                <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
              </td>\
              <td class="other_party" v-if="column_candidates(race.reportingUnit.candidates, 1).length == 0 && any_column_candidates(races[election_type.basename], 1)"></td>\
              <td class="spacer"></td>\
              <td class="percent_in"><div v-html="display_precincts_perc(race)"></div></td>\
              <td class="hold"><div v-html="winner_hold_pickup_text(race)"></div></td>\
            </tr>\
        </tbody>\
        </table>\
\
        <div class="footer" v-html="election_type.footer"></div>\
\
      </div>\
\
    </div>\
\
  </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "president_summary" : {},
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "races" : {
        "president" : [],
        "senate" : [],
        "house" : [],
        "governor" : []
      },
      "election_types" : [
        {
          "name" : "President",
          "basename" : "president",
          "footer" : "<a href='"+E2020_PUB_PATH+"/president/'>Click Here For All Presidential Results</a>"
        },
        {
          "name" : "Senate",
          "basename" : "senate",
          "footer" : "<a href='"+E2020_PUB_PATH+"/senate/'>Click Here For All Senate Results</a>"
        },
        {
          "name" : "House",
          "basename" : "house",
          "footer" : "<a href='"+E2020_PUB_PATH+"/house/'>All House Results</a> <span class='hide_on_phone_portrait'>| <a href='"+E2020_PUB_PATH+"/house_top_50/'>Top Races</a> </span>| <a href='"+E2020_PUB_PATH+"/house_northeast/'>Northeast</a> | <a href='"+E2020_PUB_PATH+"/house_midwest/'>Midwest</a> | <a href='"+E2020_PUB_PATH+"/house_south/'>South</a> | <a href='"+E2020_PUB_PATH+"/house_west/'>West</a>"
        },
        {
          "name" : "Governors",
          "basename" : "governor",
          "footer" : "<a href='"+E2020_PUB_PATH+"/governor/'>Click Here For All Governor Results</a>"
        },
      ],
      "won_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "net_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "last_index": 0,
      "president_total_votes":0,
      "candidate_vote_counts":{},
      // "closing_times_index_define": [
      //   "6:00PM ET",  // 0
      //   "7:00PM ET",  // 1
      //   "7:30PM ET",  // 2
      //   "8:00PM ET",  // 3
      //   "8:30PM ET",  // 4
      //   "9:00PM ET",  // 5
      //   "10:00PM ET", // 6
      //   "11:00PM ET", // 7
      //   "12:00AM ET", // 8
      //   "1:00AM ET",  // 9
      // ],
      "closing_times_index_define": [
        "",  // 0
        //"",  // 1
        // "",  // 2
        // "",  // 3
        // "",  // 4
        // "7:30PM ET",  // 2
        // "8:00PM ET",  // 3
        // "8:30PM ET",  // 4
        // "9:00PM ET",  // 5
        // "10:00PM ET", // 6
        // "11:00PM ET", // 7
        // "12:00AM ET", // 8
        // "1:00AM ET",  // 9
        // "",           // 10
      ],
      // "closing_times": {  //Index for each state - see function for definishion closing_times_index_define
      //   "IN": 0,
      //   "KY": 0, 
      //   "FL": 1,
      //   "GA": 1,
      //   "SC": 1,
      //   "VA": 1,
      //   "VT": 1,
      //   "NC": 2,
      //   "OH": 2,
      //   "WV": 2,
      //   "AL": 3,
      //   "CT": 3,
      //   "DE": 3,
      //   "FL": 3,
      //   "IL": 3,
      //   "KS": 3,
      //   "ME": 3,
      //   "MD": 3,
      //   "MA": 3,
      //   "MI": 3,
      //   "MS": 3,
      //   "MO": 3,
      //   "NH": 3,
      //   "NJ": 3,
      //   "ND": 3,
      //   "OK": 3,
      //   "PA": 3,
      //   "RI": 3,
      //   "SD": 3,
      //   "TN": 3,
      //   "TX": 5,
      //   "DC": 3,
      //   "AR": 4,
      //   "AZ": 5,
      //   "CO": 5,
      //   "KS": 3,
      //   "LA": 5,
      //   "MI": 3,
      //   "MN": 5,
      //   "NE": 5,
      //   "NM": 5,
      //   "NY": 5,
      //   "ND": 3,
      //   "SD": 3,
      //   "WI": 5,
      //   "WY": 5,
      //   "ID": 6,
      //   "IA": 6,
      //   "MT": 6,
      //   "NV": 6,
      //   "OR": 6,
      //   "UT": 6,
      //   "CA": 7,
      //   "ID": 6,
      //   "OR": 6,
      //   "WA": 7,
      //   "AK": 9,
      //   "HI": 8,
      // }
      "closing_times": {  //Index for each state - see function for definishion closing_times_index_define
        "AZ": 0,
        "GA": 0,
        "NC": 0,
        "MN": 0,
        "PA": 0,
        "WI": 0,
        "NV": 0,
        "MI": 0,
        "IA": 0,
        "OH": 0,
        "TX": 0,
        "FL": 0,
        "IN": 1,
        "KY": 1, 
        "SC": 1,
        "VA": 1,
        "VT": 1,
        "WV": 1,
        "AL": 1,
        "CT": 1,
        "DE": 1,
        "IL": 1,
        "KS": 1,
        "ME": 1,
        "MD": 1,
        "MA": 1,
        "MS": 1,
        "MO": 1,
        "NH": 1,
        "NJ": 1,
        "ND": 1,
        "OK": 1,
        "RI": 1,
        "SD": 1,
        "TN": 1,
        "DC": 1,
        "AR": 1,
        "CO": 1,
        "KS": 1,
        "LA": 1,
        "NE": 1,
        "NM": 1,
        "NY": 1,
        "ND": 1,
        "SD": 1,
        "WY": 1,
        "ID": 1,
        "MT": 1,
        "OR": 1,
        "UT": 1,
        "CA": 1,
        "ID": 1,
        "OR": 1,
        "WA": 1,
        "AK": 1,
        "HI": 1,
      }
    }
  },
  created : function() {

    this.get_data_for_alpha_2();

    // Start refresh cron
    this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_alpha_2();
      }
    },

    get_data_for_alpha_2 : function() {

      this.loading = true;
      // Retrieve live results data
      rcp_hp_fetch_data(function(response) {

        // Successfully retrieved data

        this.won_seats = response.data.won_seats;
        this.net_seats = response.data.net_seats;
        this.president_summary = response.data.president_summary;
        this.electoral_summary = response.data.electoral_summary;

        // Calculate vote totals for each race based on candidates
        if(this.house_alt) {
          this.races['house'] = this.races_with_vote_totals(response.data.homepage_races['house_alt']);
        } else {
          this.races['house'] = this.races_with_vote_totals(response.data.homepage_races['house']);
        }

        this.races['senate'] = this.races_with_vote_totals(response.data.homepage_races['senate']);
        this.races['governor'] = this.races_with_vote_totals(response.data.homepage_races['governor']);
        this.races['president'] = this.races_with_vote_totals(response.data.homepage_races['president']);

        //Calculate vote count percentages and assign to object
        this.calculate_candites_votes();
        
        //Assign Closing Time Index
        this.assign_closing_time_index();

        //sort by closing time index
        // this.races['president'].sort(function(a,b) {
        //   return (a.closing_time_index > b.closing_time_index) ? 1 : -1;
        // });

        this.races['president'].sort(function(a,b) {
          //return (a.closing_time_index > b.closing_time_index) ? 1 : -1;
          //Order by closing_time_index first
          if (a.closing_time_index > b.closing_time_index) {
            return 1;
          } else if (a.closing_time_index < b.closing_time_index) { 
              return -1;
          }
      
          // Then by Display Order
          if (a.display_order < b.display_order) { 
              return -1;
          } else if (a.display_order > b.display_order) {
              return 1
          } else { // nothing to split them
              return 0;
          }

          // // Then by Alphabet
          // if (a.stateName < b.stateName) { 
          //     return -1;
          // } else if (a.stateName > b.stateName) {
          //     return 1
          // } else { // nothing to split them
          //     return 0;
          // }
        });
        

        //assign counter (1,2,3, etc) to each time index
        this.assign_closing_time_index_tracker();

        this.first_load_done = true;
        this.loading = false;

      }.bind(this));
    },

    vote_percent_display_pres : function(cand){
      return this.candidate_vote_counts[cand] + '%';
    },
    calculate_candites_votes : function(){

      var total_votes = 0;
      for(p=0; p < this.president_summary.candidates.length; p++){
        var can = this.president_summary.candidates[p];
        total_votes += parseInt(can.voteCount);
      }
      
      for(p=0; p < this.president_summary.candidates.length; p++){
        var can = this.president_summary.candidates[p];
        
        var name = can.last;
        var can_vote_count = parseInt(can.voteCount);
        
        var percent = (can_vote_count / total_votes) * 100;

        if(total_votes == 0 || total_votes == 'undefined'){
          this.candidate_vote_counts[name] = 0;
        }else{
          this.candidate_vote_counts[name] = percent.toFixed(1);
        }
        
      }

    },
    order_in_closing_time : function(race_index) {

      for(var i = 0; i < this.closing_times_index_define.length; i++) {
        var current_count = 0;
        for(var j = 0; j < this.races.president.length; j++) {
          if(this.closing_times[this.races.president[j].statePostal] == i) {
            current_count++;
            if(j == race_index) {
              return current_count;
            }
          }
        }
      }
      return 0;
    },
    last_in_closing_time_even : function(cti) {

      var current_count = 0;
      for(var j = 0; j < this.races.president.length; j++) {
        if(this.closing_times[this.races.president[j].statePostal] == cti) {
          current_count++;
        }
      }
      return current_count % 2 ? true : false;
    },
    closing_times_races : function(closing_time_index1){

      var race =  this.races['president'].filter(function(c) {
        return c.closing_time_index == closing_time_index1;
      });

      return race;

    },
    assign_closing_time_index : function (){
      var president_data = this.races['president'];

      for(i=0; i < president_data.length; i++){
        var state_postal = president_data[i].statePostal;

        this.races['president'][i]['closing_time_index'] = this.closing_times[state_postal];

        //D.N Display order for Top States
        if(state_postal == "FL"){ this.races['president'][i]['display_order'] = 0; }
        else if(state_postal == "PA"){ this.races['president'][i]['display_order'] = 1; }
        else if(state_postal == "MI"){ this.races['president'][i]['display_order'] = 2; }
        else if(state_postal == "OH"){ this.races['president'][i]['display_order'] = 3; }
        else if(state_postal == "WI"){ this.races['president'][i]['display_order'] = 4; }
        else if(state_postal == "MN"){ this.races['president'][i]['display_order'] = 5; }
        else if(state_postal == "IA"){ this.races['president'][i]['display_order'] = 6; }
        else if(state_postal == "NC"){ this.races['president'][i]['display_order'] = 7; }
        else if(state_postal == "GA"){ this.races['president'][i]['display_order'] = 8; }
        else if(state_postal == "TX"){ this.races['president'][i]['display_order'] = 9; }
        else if(state_postal == "AZ"){ this.races['president'][i]['display_order'] = 10; }
        else if(state_postal == "NV"){ this.races['president'][i]['display_order'] = 11; }
        else { this.races['president'][i]['display_order'] = 12; }

      }
    },
    assign_closing_time_index_tracker : function (){
      var president_data = this.races['president'];
      var counter = 0;
      var last_counter = 0;
      var close_index = null;
      for(i=0; i < president_data.length; i++){
          close_index = president_data[i].closing_time_index;
        //last_counter
        if( last_counter != close_index ){
          counter = 0;
          this.races['president'][i]['closing_tracker_index'] = counter;
        }else{
          this.races['president'][i]['closing_tracker_index'] = counter;
        }
        counter = counter + 1;
        last_counter = close_index;
      }
    }

  })
}); // END rc-widget-live-results-alpha-2

// Start App

if(document.querySelector('rc-widget-live-results-alpha-2')) {
  document.querySelectorAll('rc-widget-live-results-alpha-2').forEach(function(elem) {
    new Vue({
      el: elem
    });
  });
}

/////////////////////////////////
// LIVE RESULTS ALPHA 3 WIDGET // 3 side by side maps
/////////////////////////////////

Vue.component('rc-widget-live-results-alpha-3', {
  template: '\
\
    <div class="container">\
\
      <div class="hp_map_chart_widget">\
        <h3>\
          <span><span class="letter">R</span>eal <span class="letter">C</span>lear <span class="letter">P</span>olitics <span class="letter">E</span>lection <span class="year">2020</span></span>\
        </h3>\
        <div class="map_chart_content">\
          <div v-for="election_type in election_types" :class="[\'section\', \'electoral_map\', election_type.basename]">\
            \
            <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
            <div class="score_line">\
              <div class="title"><a :href="election_type.link" v-html="election_type.name"></a></div>\
              <div class="scores" v-if="election_type.basename == \'president\'" >\
                <span style="font-size:12px;" class="dem"><a :href="election_type.link" v-html="electoral_summary.Biden + \' Joe Biden\'"></a></span>\
                <span style="font-size:12px;" class="gop"><a :href="election_type.link" v-html="\'Donald Trump \'+ electoral_summary.Trump"></a></span>\
              </div>\
              <div class="scores" v-if="election_type.basename !== \'president\'" >\
                <span class="dem"><a :href="election_type.link" v-html="won_seats[election_type.basename].dem + (election_type.basename == \'senate\' ? \'*\' : \'\') + net_display(net_seats[election_type.basename].dem)+\' Dem\'"></a></span>\
                <span class="gop"><a :href="election_type.link" v-html="\'GOP \'+won_seats[election_type.basename].gop + net_display(net_seats[election_type.basename].gop)"></a></span>\
              </div>\
            </div>\
            <div class="map">\
              <a :href="election_type.link">\
                <img :src="img_map[election_type.basename]" :alt="election_type.name+\' Live Results 20108\'" />\
              </a>\
              <span class="map_ut">\
                <a :href="election_type.link" v-html="election_type.footer_txt"></a>\
              </span>\
            </div>\
          </div>\
\
        </div>\
      </div>\
\
    </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "president_summary" : {},
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "img_map" : {
        "president" : "",
        "senate" : "",
        "house" : "",
        "governor" : ""
      },
      "election_types" : [
        {
          "name" : "President",
          "basename" : "president",
          "link" : E2020_PUB_PATH+'/president/',
          "footer_txt" : "All President Results"
        },
        {
          "name" : "Senate",
          "basename" : "senate",
          "link" : E2020_PUB_PATH+'/senate/',
          "footer_txt" : "All Senate Results"
        },
        {
          "name" : "House",
          "basename" : "house",
          "link" : E2020_PUB_PATH+'/house/',
          "footer_txt" : "All House Results"
        },
        // {
        //   "name" : "Governors",
        //   "basename" : "governor",
        //   "link" : E2020_PUB_PATH+'/governor/',
        //   "footer_txt" : "All Governor Results"
        // }
      ],
      "won_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "net_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      }
    }
  },
  created : function() {

    this.get_data_for_alpha_3();

    // Start refresh cron
    this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_alpha_3();
      }
    },

    get_data_for_alpha_3 : function() {

      this.loading = true;
      // Retrieve live results data
      rcp_hp_fetch_data(function(response) {

        // Successfully retrieved data

        this.won_seats = response.data.won_seats;
        this.net_seats = response.data.net_seats;
        this.president_summary = response.data.president_summary;
        this.electoral_summary = response.data.electoral_summary;

        this.img_map['president'] = E2020_PUB_PATH+"/live_map_president_thumb.png?cache_bust="+rcp_cache_bust();
        this.img_map['senate'] = E2020_PUB_PATH+"/live_map_senate_thumb.png?cache_bust="+rcp_cache_bust();
        this.img_map['house'] = E2020_PUB_PATH+"/live_map_house_thumb.png?cache_bust="+rcp_cache_bust();
        this.img_map['governor'] = E2020_PUB_PATH+"/live_map_governor_thumb.png?cache_bust="+rcp_cache_bust();

        this.first_load_done = true;
        this.loading = false;

      }.bind(this));
    },
  })
}); // END rc-widget-live-results-alpha-3


// Start App
if(document.getElementById('live_results_alpha_3')) {
  new Vue({
    el: '#live_results_alpha_3'
  });
}
if(document.getElementById('live_results_alpha_3_mobile')) {
  new Vue({
    el: '#live_results_alpha_3_mobile'
  });
}

////////////////////////////////
// LIVE RESULTS BETA 1 WIDGET //
////////////////////////////////

Vue.component('rc-widget-live-results-beta-1', {
  template: '\
\
    <div class="container">\
\
      <div class="e2018_map_widget">\
\
        <div class="title">Election 2020 Results</div>\
\
        <ul class="nav">\
          <li :class="{ \'active\' : current_page == \'president\' }" @click="set_current_page(\'president\')">President</li>\
          <li :class="{ \'active\' : current_page == \'senate\' }" @click="set_current_page(\'senate\')">Senate</li>\
          <li :class="{ \'active\' : current_page == \'house\' }" @click="set_current_page(\'house\')">House</li>\
          <!--<li :class="{ \'active\' : current_page == \'governor\' }" @click="set_current_page(\'governor\')">Governor</li>-->\
        </ul>\
\
        <div class="pages">\
          <div class="page president" v-if="current_page == \'president\'">\
          \
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
  \
      <div class="score" v-if="current_page == \'president\'">\
            <div v-show="first_load_done" class="party dem">\
              <span class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="electoral_summary.Biden"></a></span>\
              <span class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Biden/Harris</a></span>\
            </div>\
            <div v-show="first_load_done" class="party gop">\
              <span class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Trump/Pence</a></span>\
              <span class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="electoral_summary.Trump"></a></span>\
            </div>\
          </div>\
          <div class="score" v-if="current_page !== \'president\'">\
            <div v-show="first_load_done" class="party dem">\
              <span class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="won_seats.president.dem + \'\' + net_display(net_seats.president.dem)"></a></span>\
              <span class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Democrats</a></span>\
            </div>\
            <div v-show="first_load_done" class="party gop">\
              <span class="title"><a :href="\''+E2020_PUB_PATH+'/president/\'">Republicans</a></span>\
              <span class="score"><a :href="\''+E2020_PUB_PATH+'/president/\'" v-html="won_seats.president.gop + \'\' + net_display(net_seats.president.gop)"></a></span>\
            </div>\
          </div>\
  \
          <div class="map"><a :href="\''+E2020_PUB_PATH+'/president/\'"><transition name="fade"><img :key="img_map[\'president\']" :src="img_map[\'president\']" alt="President Live Results 2020" /></transition></a></div>\
  \
        </div>\
\
          <div class="page senate" v-if="current_page == \'senate\'">\
            \
            <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
            <div class="score">\
              <div v-show="first_load_done" class="party dem">\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/senate/\'" v-html="won_seats.senate.dem + \'*\' + net_display(net_seats.senate.dem)"></a></span>\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/senate/\'">Democrats</a></span>\
              </div>\
              <div v-show="first_load_done" class="party gop">\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/senate/\'">Republicans</a></span>\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/senate/\'" v-html="won_seats.senate.gop + \'\' + net_display(net_seats.senate.gop)"></a></span>\
              </div>\
            </div>\
\
            <div class="map"><a :href="\''+E2020_PUB_PATH+'/senate/\'"><transition name="fade"><img :key="img_map[\'senate\']" :src="img_map[\'senate\']" alt="Senate Live Results 2020" /></transition></a></div>\
\
          </div>\
\
          <div class="page house" v-if="current_page == \'house\'">\
            \
            <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
            <div class="score">\
              <div v-show="first_load_done" class="party dem">\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/house/\'" v-html="won_seats.house.dem + \'\' + net_display(net_seats.house.dem)"></a></span>\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/house/\'">Democrats</a></span>\
              </div>\
              <div v-show="first_load_done" class="party gop">\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/house/\'">Republicans</a></span>\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/house/\'" v-html="won_seats.house.gop + \'\' + net_display(net_seats.house.gop)"></a></span>\
              </div>\
            </div>\
\
            <div class="map"><a :href="\''+E2020_PUB_PATH+'/house/\'"><transition name="fade"><img :key="img_map[\'house\']" :src="img_map[\'house\']" alt="House Live Results 2020" /></transition></a></div>\
\
          </div>\
\
          <!--<div class="page governor" v-if="current_page == \'governor\'">\
            \
            <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
            <div class="score">\
              <div v-show="first_load_done" class="party dem">\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/governor/\'" v-html="won_seats.governor.dem + \'\' + net_display(net_seats.governor.dem)"></a></span>\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/governor/\'">Democrats</a></span>\
              </div>\
              <div v-show="first_load_done" class="party gop">\
                <span class="title"><a :href="\''+E2020_PUB_PATH+'/governor/\'">Republicans</a></span>\
                <span class="score"><a :href="\''+E2020_PUB_PATH+'/governor/\'" v-html="won_seats.governor.gop + \'\' + net_display(net_seats.governor.gop)"></a></span>\
              </div>\
            </div>\
\
            <div class="map"><a :href="\''+E2020_PUB_PATH+'/governor/\'"><transition name="fade"><img :key="img_map[\'governor\']" :src="img_map[\'governor\']" alt="Governor Live Results 2018" /></transition></a></div>\
\
          </div>-->\
\
        </div>\
\
      </div>\
\
    </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "current_page" : "president",
      "pages" : ["president","senate","house"],
      "seconds_per_tab" : 15,
      "tab_interval": 0,
      "img_map" : {
        "president" : "",
        "senate" : "",
        "house" : "",
        "governor" : ""
      },
      "president_summary" : {},
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "won_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "net_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      }
    }
  },
  created : function() {

    this.get_data_for_beta_1();

    // Start refresh cron
    this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);

    // Start timer for switching tab
    this.tab_interval = setInterval(function() {

      var tab_index = this.pages.indexOf(this.current_page);
      tab_index += 1;
      if(tab_index > this.pages.length - 1) {
        tab_index = 0;
      }
      this.current_page = this.pages[tab_index];

    }.bind(this), this.seconds_per_tab * 1000);
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    set_current_page : function(pagename) {
      this.current_page = pagename;
      clearInterval(this.tab_interval);
    },

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_beta_1();
      }
    },

    get_data_for_beta_1 : function() {

      this.loading = true;
      // Retrieve live results data
      rcp_hp_fetch_data(function(response) {

        // Successfully retrieved data

        this.won_seats = response.data.won_seats;
        this.net_seats = response.data.net_seats;
        this.president_summary = response.data.president_summary;
        this.electoral_summary = response.data.electoral_summary;

        // Refresh images
        var types = ['president','senate','house','governor'];
        for(var i = 0; i < types.length; i++) {
          if(this.current_page == types[i]) {
            // Do smart loading
            img = new Image();
            var vue_this = this;
            var src = E2020_PUB_PATH+"/live_map_"+types[i]+"_thumb.png?cache_bust="+rcp_cache_bust();
            var callback_apply = function(callback, vue_this, types, i, src) {
              callback(vue_this, types, i, src);
            }
            img.onload = callback_apply(function(vue_this, types, i, src) {
              vue_this.img_map[types[i]] = src;
              vue_this.loading = false;
            }, vue_this, types, i, src);

            img.src = src;
          } else {
            // Just change src... that way images in pages not loaded won't load... reducing http requests
            this.img_map[types[i]] = E2020_PUB_PATH+"/live_map_"+types[i]+"_thumb.png?cache_bust="+rcp_cache_bust();
          }
        }

        this.first_load_done = true;

      }.bind(this));
    },

  })
}); // END rc-widget-live-results-beta-1

// Start App
if(document.getElementById('live_results_beta_1')) {
  new Vue({
    el: '#live_results_beta_1'
  });
}
if(document.getElementById('live_results_beta_1_mobile')) {
  new Vue({
    el: '#live_results_beta_1_mobile'
  });
}

////////////////////////////////
// LIVE RESULTS LANDING PAGES //
////////////////////////////////

Vue.component('rc-widget-live-results-body', {
  props: ['page_basename','page_name','page_sub'],
  template: '\
\
    <div class="container">\
\
      <div class="e2018_details">\
\
        <div class="title">\
\
          <h2><span class="year">2020</span> <span class="first">E</span>lection: <span class="first" v-html="page_name.charAt(0)"></span>{{ page_name.substring(1) }}</h2>\
          <h3 v-if="page_sub" v-html="page_sub"></h3>\
\
        </div>\
\
        <ul class="top_nav">\
          <li v-for="result in top_results">\
            <a class="top" :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">2020 Election {{ result.name }}</a>\
            <a class="bottom" :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">Live Results</a>\
          </li>\
        </ul>\
\
        <div class="top_results">\
\
          <div class="result" v-for="(result, result_index) in top_results">\
\
            <div class="title">2020 {{ result.name }} <!--Results--> </div>\
            \
           <div class="score" v-if="result_index == 0" >\
              <div v-if="loading && page_basename == \'president\' " class="e2018_spinner"><div><div></div></div></div>\
              <div v-show="first_load_done" class="party dem" >\
                <div class="title"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">Biden/Harris</a></div>\
                <div class="score"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'" v-html="electoral_summary.Biden"></a></div>\
              </div>\
              <div v-show="first_load_done" class="party gop" >\
                <div class="title"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">Trump/Pence</a></div>\
                <div class="score"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'" v-html="electoral_summary.Trump"></a></div>\
              </div>\
            </div>\
\
           <div class="score" v-if="result_index > 0" >\
              <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
              <div v-show="first_load_done" class="party dem" >\
                <div class="title"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">Democrats</a></div>\
                <div class="score"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'" v-html="won_seats[result.basename].dem + (result.basename==\'senate\' ? \'*\' : \'\') + net_display(net_seats[result.basename].dem)"></a></div>\
              </div>\
              <div v-show="first_load_done" class="party gop" >\
                <div class="title"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'">Republicans</a></div>\
                <div class="score"><a :href="\''+E2020_PUB_PATH+'/\'+result.basename+\'/\'" v-html="won_seats[result.basename].gop + \'\' + net_display(net_seats[result.basename].gop)"></a></div>\
              </div>\
            </div>\
\
            <div class="states">\
              <select v-model="dropdown_link[result.basename]" @change="go_to_dropdown_link(result.basename)" v-if="typeof state_links[result.basename] !== \'undefined\'">\
                <option :selected="true" value="0"> <!--Individual--> Race Results - {{ result.name }}</option>\
                <option v-for="link in state_links[result.basename]" :value="link.link" v-html="link.name"></option>\
              </select>\
            </div>\
\
          </div>\
\
        </div>\
\
        <div class="house_pages_nav" v-if="featured_race_type_to_race_type(page_basename) == \'house\'">\
          <a :class="{\'active\' : page_basename == \'house\' }" href="'+E2020_PUB_PATH+'/house/">All House Results</a> &middot; \
          <a :class="{\'active\' : page_basename == \'house_top_50\' }" href="'+E2020_PUB_PATH+'/house_top_50/">Top Races</a> &middot; \
          <a :class="{\'active\' : page_basename == \'house_northeast\' }" href="'+E2020_PUB_PATH+'/house_northeast/">Northeast</a> &middot; \
          <a :class="{\'active\' : page_basename == \'house_midwest\' }" href="'+E2020_PUB_PATH+'/house_midwest/">Midwest</a> &middot; \
          <a :class="{\'active\' : page_basename == \'house_south\' }" href="'+E2020_PUB_PATH+'/house_south/">South</a> &middot; \
          <a :class="{\'active\' : page_basename == \'house_west\' }" href="'+E2020_PUB_PATH+'/house_west/">West</a>\
        </div>\
\
        <div class="e2018_stars" v-else>****************</div>\
\
        <div class="results_block">\
\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
          <div class="title">\
            <div class="text">&middot; <a :href="\''+E2020_PUB_PATH+'/\'+page_basename+\'/\'" v-html="page_name"></a> &middot;</div>\
            <div class="refresh" @click="fetch_data">Refresh</div>\
          </div>\
\
          <div v-if="first_load_done && page_basename == \'president\' " class="overview">\
            <span class="dem">Biden/Harris <a class="score" :href="\''+E2020_PUB_PATH+'/\'+page_basename+\'/\'" v-html="vote_percent_display_pres(\'Biden\') + \' (\' + electoral_summary.Biden + \')      \' "></a></span>\
            <span class="gop">Trump/Pence <a class="score" :href="\''+E2020_PUB_PATH+'/\'+page_basename+\'/\'" v-html="vote_percent_display_pres(\'Trump\')+ \' (\' + electoral_summary.Trump + \')\' "></a></span>\
          </div>\
          <div v-if="first_load_done && page_basename != \'president\' " class="overview">\
            <span class="dem">Democrats <a class="score" :href="\''+E2020_PUB_PATH+'/\'+featured_race_type_to_race_type(page_basename)+\'/\'" v-html="won_seats[featured_race_type_to_race_type(page_basename)][\'dem\'] + (page_basename==\'senate\' ? \'*\' : \' \') + net_display(net_seats[featured_race_type_to_race_type(page_basename)][\'dem\'])"></a></span>\
            <span class="gop">Republicans <a class="score" :href="\''+E2020_PUB_PATH+'/\'+featured_race_type_to_race_type(page_basename)+\'/\'" v-html="won_seats[featured_race_type_to_race_type(page_basename)][\'gop\'] + \' \' + net_display(net_seats[featured_race_type_to_race_type(page_basename)][\'gop\'])"></a></span>\
          </div>\
\
          <div class="map" v-if="is_main_type(page_basename)">\
            <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
            <transition name="fade"><img class="map_image" :key="img_map" :src="img_map" :alt="page_name+\' Live Results 2018\'" /></transition>\
          </div>\
\
          <table v-if="first_load_done" class="races">\
            <tbody>\
              <tr>\
                <th></th>\
                <th>Democrat</th>\
                <th>Republican</th>\
                <th></th>\
                <th></th>\
                <th v-if="any_column_candidates(races[page_basename], 1)"></th>\
                <th v-if="any_column_candidates(races[page_basename], 2)"></th>\
                <th v-if="any_column_candidates(races[page_basename], 3)"></th>\
              </tr>\
\
              <template v-for="(race, index) in races[page_basename]">\
\
                <tr v-if="page_basename != \'house_top_50\' && featured_race_type_to_race_type(page_basename) == \'house\' && (index == 0 || races[page_basename][index-1][\'stateName\'] !== race[\'stateName\'])">\
                  <td class="state" :colspan="5+(any_column_candidates(races[page_basename], 1) ? 1 : 0)+(any_column_candidates(races[page_basename], 2) ? 1 : 0)+(any_column_candidates(races[page_basename], 3) ? 1 : 0)" v-html="race[\'stateName\']"></td>\
                </tr>\
\
                <tr :class="[{\'race\' : true}, winner_party(race), {\'pickup\' : winner_is_pickup(race)}, {\'winner\' : has_winner(race) || [\'Georgia Special\', \'Georgia\'].indexOf(state_name_display(race.stateName, race.seatName, page_basename)) > -1},{\'is_ga_special\': [\'Georgia Special\', \'Georgia\'].indexOf(state_name_display(race.stateName, race.seatName, page_basename)) > -1}]">\
                  \
                  <td class="name"><div><a :href="race_detail_link(race, page_basename)" v-html="state_name_display(race.stateName, race.seatName, page_basename)"></a></div></td>\
                  \
                  <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1)" class="candidate">\
                    <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
                  </td>\
                  <td v-if="candidates_with_party(race.reportingUnit.candidates, \'Dem\', 1).length == 0"></td>\
                  \
                  <td v-for="candidate in candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1)" class="candidate">\
                    <span v-html="candidate.last"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
                  </td>\
                  <td v-if="candidates_with_party(race.reportingUnit.candidates, \'GOP\', 1).length == 0"></td>\
                  \
                  <td v-for="candidate in column_candidates(race.reportingUnit.candidates, 1)" class="candidate" :style="state_name_display(race.stateName, race.seatName, page_basename) == \'Georgia Special\' ? \'font-weight:normal;\' : \'\'">\
                    <span v-html="candidate.last+\' \'+party_display(candidate)"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
                  </td>\
                  <td v-if="column_candidates(race.reportingUnit.candidates, 1).length == 0 && any_column_candidates(races[page_basename], 1)"></td>\
                  \
                  <td v-for="candidate in column_candidates(race.reportingUnit.candidates, 2)" class="candidate" v-if="state_name_display(race.stateName, race.seatName, page_basename) != \'Georgia Special\'">\
                    <span v-html="candidate.last+\' \'+party_display(candidate)"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
                  </td>\
                  <td v-if="( column_candidates(race.reportingUnit.candidates, 2).length == 0 && any_column_candidates(races[page_basename], 2) ) || state_name_display(race.stateName, race.seatName, page_basename) == \'Georgia Special\'"></td>\
                  \
                  <td v-for="candidate in column_candidates(race.reportingUnit.candidates, 3)" class="candidate" v-if="state_name_display(race.stateName, race.seatName, page_basename) != \'Georgia Special\'">\
                    <span v-html="candidate.last+\' \'+party_display(candidate)"></span> <span v-html="vote_perc_display(candidate.voteCount, race.voteTotal)"></span>\
                  </td>\
                  <td v-if="( column_candidates(race.reportingUnit.candidates, 3).length == 0 && any_column_candidates(races[page_basename], 3) ) || state_name_display(race.stateName, race.seatName, page_basename) == \'Georgia Special\'"></td>\
\
                  <td class="percent_in"><div v-html="display_precincts_perc(race)"></div></td>\
                  \
                  <td class="hold"><div v-html="winner_hold_pickup_text(race)"></div></td>\
\
                </tr>\
\
              </template>\
            </tbody>\
          </table>\
\
        </div>\
        \
        <!-- Bottom Location of Map -->\
\
      </div>\
\
    </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "current_page" : "senate",
      "img_map" : "",
      "president_summary" : {},
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "state_links": [],
      "races" : {
        "governor" : [],
        "house" : [],
        "senate" : [],
        "house_top_50" : [],
        "house_northeast" : [],
        "house_midwest" : [],
        "house_south" : [],
        "house_west" : [],
        "president" : []
      },
      "dropdown_link" : {
        "governor" : "0",
        "house" : "0",
        "senate" : "0",
        "president" : "0"
      },
      "candidate_vote_counts":{},
      "top_results": [
        {
          "name" : "President",
          "basename" : "president"
        },
        {
          "name" : "Senate",
          "basename" : "senate"
        },
        {
          "name" : "House",
          "basename" : "house"
        },
        {
          "name" : "Governors",
          "basename" : "governor"
        } 
      ],
      "won_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      },
      "net_seats": {
        "president": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "senate": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "governor": {
          "gop": 0,
          "dem": 0,
          "other": 0
        },
        "house": {
          "gop": 0,
          "dem": 0,
          "other": 0
        }
      }
    }
  },
  created : function() {

    this.get_data_for_page();

    // Start refresh cron
    this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    is_main_type : function(type) {
      for(var i = 0; i < this.top_results.length; i++) {
        if(this.top_results[i]['basename'] == type) {
          return true;
        }
      }

      return false;
    },

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_page();
      }
    },

    get_data_for_page : function() {

      this.loading = true;
      axios.get(E2020_PUB_PATH+'/homepage.json?cache_bust='+rcp_cache_bust())
    .then(function(response) {

          this.president_summary = response.data.president_summary;
          this.electoral_summary = response.data.electoral_summary;

          //Calculate vote count percentages and assign to object
          this.calculate_candites_votes();

      }.bind(this));
      // Retrieve live results data
      //axios.get('/elections/live_results/2018/'+this.page_basename+'.json?cache_bust='+rcp_cache_bust())
      axios.get(E2020_PUB_PATH+'/'+this.page_basename+'.json?cache_bust='+rcp_cache_bust())
      .then(function(response) {

        this.won_seats = response.data.won_seats;
        this.net_seats = response.data.net_seats;
        this.state_links = response.data.state_links;

        this.races[this.page_basename] = this.races_with_vote_totals(response.data.races);

        // Refresh images
        // Do smart loading
        img = new Image();
        var vue_this = this;
        var src = E2020_PUB_PATH+"/live_map_"+this.page_basename+".png?cache_bust="+rcp_cache_bust();
        var callback_apply = function(callback, vue_this, src) {
          callback(vue_this, src);
        }
        img.onload = callback_apply(function(vue_this, src) {
          vue_this.img_map = src;
          vue_this.loading = false;
        }, vue_this, src);

        img.src = src;

        this.first_load_done = true;

      }.bind(this));
    },
    go_to_dropdown_link : function(bn) {

      if(this.dropdown_link[bn] != "0") {
        window.location.href = this.dropdown_link[bn];
      }
    },

    vote_percent_display_pres : function(cand){
      return this.candidate_vote_counts[cand] + '%';
    },
    calculate_candites_votes : function(){

      var total_votes = 0;
      for(p=0; p < this.president_summary.candidates.length; p++){
        var can = this.president_summary.candidates[p];
        total_votes += parseInt(can.voteCount);
      }
      
      for(p=0; p < this.president_summary.candidates.length; p++){
        var can = this.president_summary.candidates[p];
        
        var name = can.last;
        var can_vote_count = parseInt(can.voteCount);
        
        var percent = (can_vote_count / total_votes) * 100;

        if(total_votes == 0 || total_votes == 'undefined'){
          this.candidate_vote_counts[name] = 0;
        }else{
          this.candidate_vote_counts[name] = percent.toFixed(1);
        }
        
      }

    },

  })
}); // END rc-widget-live-results-body

// GOVERNOR LANDING PAGE
Vue.component('rc-widget-live-results-governor', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="governor" \
      page_name="Governors"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_governor')) {
  new Vue({
    el: '#live_results_governor'
  });
}

// HOUSE LANDING PAGE
Vue.component('rc-widget-live-results-house', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house" \
      page_name="House"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house')) {
  new Vue({
    el: '#live_results_house'
  });
}

// PRESIDENT LANDING PAGE
Vue.component('rc-widget-live-results-president', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="president" \
      page_name="President"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_president')) {
  new Vue({
    el: '#live_results_president'
  });
}

// SENATE LANDING PAGE
Vue.component('rc-widget-live-results-senate', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="senate" \
      page_name="Senate"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_senate')) {
  new Vue({
    el: '#live_results_senate'
  });
}

// HOUSE TOP 50 LANDING PAGE
Vue.component('rc-widget-live-results-house-top-50', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house_top_50" \
      page_name="House"\
      page_sub="Top Races"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house_top_50')) {
  new Vue({
    el: '#live_results_house_top_50'
  });
}

// HOUSE NORTHEAST LANDING PAGE
Vue.component('rc-widget-live-results-house-northeast', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house_northeast" \
      page_name="House"\
      page_sub="Northeast"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house_northeast')) {
  new Vue({
    el: '#live_results_house_northeast'
  });
}

// HOUSE MIDWEST LANDING PAGE
Vue.component('rc-widget-live-results-house-midwest', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house_midwest" \
      page_name="House"\
      page_sub="Midwest"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house_midwest')) {
  new Vue({
    el: '#live_results_house_midwest'
  });
}

// HOUSE SOUTH LANDING PAGE
Vue.component('rc-widget-live-results-house-south', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house_south" \
      page_name="House"\
      page_sub="South"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house_south')) {
  new Vue({
    el: '#live_results_house_south'
  });
}

// HOUSE WEST LANDING PAGE
Vue.component('rc-widget-live-results-house-west', {
  template: '\
\
  <div class="container">\
\
    <rc-widget-live-results-body\
      page_basename="house_west" \
      page_name="House" \
      page_sub="West"\
    ></rc-widget-live-results-body>\
\
  </div>\
\
  '
});

// Start App
if(document.getElementById('live_results_house_west')) {
  new Vue({
    el: '#live_results_house_west'
  });
}

///////////////////////
// STATE LEVEL PAGES //
///////////////////////

Vue.component('reporting-unit', {
  props: ['data','type','electoral_summary'],
  template: '\
\
  <div class="reporting_unit">\
    <div class="header">\
      <span class="title" v-if="data[\'level\'] != \'state\'">{{ data[\'county_name\'] ? data[\'county_name\']+county_str(data) : data[\'district_name\'] }} </span>\
      <span class="title" v-else>Final Results</span>\
      <span v-if="any_runoff(data[\'candidates\'])" class="runoff pickup">Runoff</span>\
      <span v-if="typeof data[\'pickup_status\'] !== \'undefined\' && data[\'pickup_status\'].length > 0" :class="[data[\'pickup_status\'].toLowerCase(), ( [\'gop\',\'dem\'].indexOf(data[\'winner_aff\'].toLowerCase()) > -1 ? data[\'winner_aff\'].toLowerCase() : \'ind\' )]" v-html="data[\'winner_aff\']+\' \'+data[\'pickup_status\']"></span>\
      <span class="reporting">{{ data[\'precincts_reporting_rcp\'] }}% Reporting</span>\
      <span v-if="type == \'president\'" class="reporting">Electoral Votes: {{ electoral_votes_for_state(data[\'region_key\']) }}</span>\
    </div>\
    <table class="candidate"><tbody>\
      <tr v-if="type == \'president\'" class="ru_head">\
        <td colspan="4"></td>\
        <td>Pop. Vote</td>\
        <td>Electoral</td>\
      </tr>\
      <tr v-for="c in data[\'candidates\']">\
        <td class="affiliation">\
          <span class="winner"><img v-if="c[\'winner\'] == \'X\' || c[\'winner\'] == \'R\'" src="/images/check_winner.png" alt="checkmark"></span>\
          <span :class="[\'bubble\', ( [\'gop\',\'dem\'].indexOf(c[\'affiliation\'].toLowerCase()) > -1 ? c[\'affiliation\'].toLowerCase() : \'ind\' )]" v-html="c[\'affiliation\']"></span>\
        </td>\
        <td class="name" v-html="c[\'first_name\']+\' \'+c[\'last_name\']"></td>\
        <td class="percentage" v-html="c[\'percentage\']+\'%\'"></td>\
        <td class="bar"><span class="bar_container"><span :class="[\'bar_inner\', ( [\'gop\',\'dem\'].indexOf(c[\'affiliation\'].toLowerCase()) > -1 ? c[\'affiliation\'].toLowerCase() : \'ind\' )]" :style="\'width:\'+c[\'percentage\']+\'%;\'"></span></span></td>\
        <td class="votes" v-html="parseInt(c[\'votes\']).toLocaleString()"></td>\
        <td class="electoral_votes" v-html="find_electoral_score(type, data[\'region_key\'], c[\'last_name\'])"></td>\
      </tr>\
    </tbody></table>\
  </div>\
\
  ',

  created: function() {
    //console.log('candidates');
    //console.log(this.data['candidates']);
  },
  
  methods : rcp_merge_methods(rcp_shared_methods, {

    find_electoral_score : function(type, state_postal, last_name) {

      if(type != 'president') {
        return '';
      } else {
        var score = this.electoral_summary.states[state_postal][last_name];
        if(score == 0) {
          return '';
        } else {
          return score;
        }
      }
    },

    county_str : function(race) {

      if(race['region_key'] != 'ME' 
      && race['region_key'] != 'MA' 
      && race['region_key'] != 'NH' 
      && race['region_key'] != 'RI' 
      && race['region_key'] != 'VT' ) {
        return ' County';
      }

      return '';
    },

    any_runoff : function(candidates) {
      //console.log(candidates);
      return candidates.some(function(c) {
        return c['winner'] == 'R';
      });
    },

  })
});

Vue.component('rc-widget-live-results-state', {
  props: ['state_postal','state_type','special'],
  template: '\
\
    <div class="e2018_state">\
\
      <div class="e2018_stars">****************</div>\
\
      <div class="title">\
\
        <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
\
        <h2 v-if="state_postal !== \'ga\' ">2020 {{ capitalize_string(map_state_data[\'state_name\']) }} {{ capitalize_string(state_type) }} Election Results</h2>\
        <h2 v-if="state_postal == \'ga\' && special !== \'gaspecial\' ">2020 {{ capitalize_string(map_state_data[\'state_name\']) }} {{ capitalize_string(state_type) }} Election Results</h2>\
        <h2 v-if="state_postal == \'ga\' && special == \'gaspecial\' ">2020 {{ capitalize_string(map_state_data[\'state_name\']) }} Special {{ capitalize_string(state_type) }} Election Results</h2>\
        \
      </div>\
\
          <a v-for="ns in nav_sections"></a>\
      <div class="pages_nav">\
      <!--<a \
          v-for="ns in nav_sections" v-if="ns == \'president\' || ns == \'house\' || (ns == \'senate\' && map_state_data[\'insenate\'] == \'1\') || (ns == \'governor\' && map_state_data[\'ingov\'] == \'1\')" \
          :href="\''+E2020_PUB_PATH+'/state/\'+state_postal+\'/\'+ns+\'/\'" \
          v-html="capitalize_string(map_state_data[\'state_name\'])+\' \'+capitalize_string(ns)"\
          :class="{\'active\' : ns == state_type}"\
        ></a>-->\
        <a \
          v-for="ns in nav_sections_special"\
            v-if="state_postal == \'ga\' && ns !== \'senate_special\' && (ns == \'senate_special\' || ns == \'president\' || ns == \'house\' || (ns == \'senate\' && map_state_data[\'insenate\'] == \'1\') || (ns == \'governor\' && map_state_data[\'ingov\'] == \'1\') )" \
              :href="\''+E2020_PUB_PATH+'/state/\'+state_postal+\'/\'+ns+\'/\'" \
              v-html="capitalize_string(map_state_data[\'state_name\'])+\' \'+capitalize_string(ns)"\
              :class="{\'active\' : ns == state_type}"\
          \
        ></a>\
        <a \
        v-for="ns in nav_sections_special"\
          v-if="state_postal == \'ga\' && ns == \'senate_special\' && (ns == \'senate_special\' || ns == \'president\' || ns == \'house\' || (ns == \'senate\' && map_state_data[\'insenate\'] == \'1\') || (ns == \'governor\' && map_state_data[\'ingov\'] == \'1\') )" \
          :href="\''+E2020_PUB_PATH+'/state/ga/senate/ga_special.html\'" \
          v-html="capitalize_string(map_state_data[\'state_name\'])+\' \'+\' Special\'"\
            :class="{\'active\' : ns == state_type}"\
      ></a>\
        <a \
          v-for="ns in nav_sections_special"\
            v-if="state_postal !== \'ga\' && (ns == \'president\' || ns == \'house\' || (ns == \'senate\' && map_state_data[\'insenate\'] == \'1\') || (ns == \'governor\' && map_state_data[\'ingov\'] == \'1\') )" \
            :href="\''+E2020_PUB_PATH+'/state/\'+state_postal+\'/\'+ns+\'/\'" \
            v-html="capitalize_string(map_state_data[\'state_name\'])+\' \'+capitalize_string(ns)"\
            :class="{\'active\' : ns == state_type}"\
          \
        ></a>\
      </div>\
\
      <div class="container">\
\
        <reporting-unit\
          v-if="first_load_done && state_type != \'house\'"\
          :data="top_race(state_postal,special)"\
          :type="state_type"\
          :electoral_summary="electoral_summary"\
        ></reporting-unit>\
\
      </div>\
\
      <div id="mymap">\
        <div id="map_loading"></div>\
        <div id="map_container">\
          <div id="map_county_popup">\
            <div class="window"></div>\
            <div class="exit"><img src="/images/x_icon.png" alt="x" /></div>\
          </div>\
          <div id="map_zoom_out"></div>\
          <div id="map_canvas"></div>\
          <div id="info"></div>\
          <div id="map-legend">\
            <table cellspacing="0" cellpadding="0" border="0">\
              <tr>\
                <td><img src="/images/dem-2.gif" /> Dem</td>\
                <td><img src="/images/gop-2.gif" /> Gop</td>\
                <td><span style="width:13px;height:8px;background:#9933cc;display:inline-block;" ></span> Other</td>\
              </tr>\
            </table>\
          </div>\
        </div>\
      </div>\
\
      <div class="reporting_units">\
\
        <reporting-unit\
          v-for="ru in reporting_units"\
          :key="ru.id"\
          :data="ru"\
          :type="state_type"\
          :electoral_summary="electoral_summary"\
        ></reporting-unit>\
\
      </div>\
\
    </div>\
\
  ',
  data : function() {
    return {
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "electoral_summary" : {
        "Biden" : 0,
        "Trump" : 0,
      },
      "map_state_data" : {
        "type" : map_state_data['type'],
        "state" : map_state_data['state'],
        "ingov" : map_state_data['ingov'],
        "insenate" : map_state_data['insenate'],
        "state_name" : map_state_data['state_name']
      },
      "nav_sections" : ['president','senate','governor','house'],
      "nav_sections_special" : ['president','senate','governor','house','senate_special'],
      "reporting_units" : [],
      "top_ru" : []
    }
  },
  created : function() {

    this.get_data_for_state();
    
    // Start refresh cron
    /*this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);*/
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_state();
      }
    },

    get_data_for_state : function() {

      this.loading = true;
      // Retrieve live results data
      var file_name = 'counties_'+this.state_type;
      if(this.state_type == 'house') {
        file_name = 'districts_'+this.state_type;
      }

      axios.get(E2020_PUB_PATH+'/homepage.json?cache_bust='+rcp_cache_bust())
      .then(function(response) {
        this.president_summary = response.data.president_summary;  //
        this.electoral_summary = response.data.electoral_summary;
      }.bind(this));
      
      axios.get(E2020_PUB_PATH+'/'+file_name+'.json?cache_bust='+rcp_cache_bust())
      .then(function(response) {
        // // Successfully retrieved data

        // Set global variable for d3 map, then trigger
        window.map_county_data = response.data.map_county_data;
        console.log('about to call county_map_data_done_loading');
        window.county_map_data_done_loading();

        // Grab this state's reporting units
        for(var i = 0; i < response.data.map_county_data.election.race.length; i++) {

          var race = response.data.map_county_data.election.race[i];

          if (race['region_key'].toLowerCase() == this.state_postal) {  //Original filter

            if (race['region_key'].toLowerCase() == 'ga') {
              console.log(race);
              if (this.special == 'gaspecial') {  //Georgia Special
                var is_special_flag = 0;
                for (c = 0; c < race.candidates.length; c++) {
                  if (race.candidates[c].last_name == 'Loeffler') {
                    is_special_flag = 1;
                  }
                }

                if (is_special_flag == 1) { 
                  this.reporting_units.push(race);

                }
              } else {   // Normal Georgia Senate, President, House, and Governor if any
                var is_regular_flag = 0;
                for (r = 0; r < race.candidates.length; r++) {
                  if (race.candidates[r].last_name == 'Perdue') {
                    is_regular_flag = 1;
                  }
                }

                if (is_regular_flag == 1) {  //Georgia Senate
                  this.reporting_units.push(race);
                }else{ //Georgia President, House, and Governor if any
                  this.reporting_units.push(race); //
                }
              }

            } else {
              //Everything else except Georgia
              this.reporting_units.push(race);

            }
          } 

        }

        // Grab top level reporting unit
        this.top_ru = response.data.top_level_ru;

        this.first_load_done = true;
        this.loading = false;

      }.bind(this));
    },
    top_race : function(postal,special) {
      
      for(var i = 0; i < this.top_ru.length; i++) {

        // if(this.top_ru[i]['region_key'].toLowerCase() == postal.toLowerCase()) {  //Original
        //   return this.top_ru[i];
        // }

        var the_top_ru = this.top_ru[i];

        if (this.top_ru[i]['region_key'].toLowerCase() == postal.toLowerCase()) {  //Original filter

          if (this.top_ru[i]['region_key'].toLowerCase() == 'ga') {
            
            if (special == 'gaspecial') {
              var is_special_flag = 0;
              for (c = 0; c < the_top_ru.candidates.length; c++) {
                if (the_top_ru.candidates[c].last_name == 'Loeffler') {
                  is_special_flag = 1;
                }
              }

              if (is_special_flag == 1) { 
                return this.top_ru[i];

              }
            } else { // Normal Georgia Senate, President, House, and Governor if any
              var is_regular_flag = 0;
              for (r = 0; r < the_top_ru.candidates.length; r++) {
                if (the_top_ru.candidates[r].last_name == 'Perdue') {
                  is_regular_flag = 1;
                }
              }

              if (is_regular_flag == 1) { //Georgia Senate
                return this.top_ru[i];
              }else{ //Georgia President, House, and Governor if any
                return this.top_ru[i];
              }
            }
          } else {
            return this.top_ru[i];

          }
        } 

      }

      return {};
    },

  })
});

// Start App
if(document.getElementById('live_results_state')) {
  new Vue({
    el: '#live_results_state'
  });
}

Vue.component('reporting-unit-closeup', {
  props: ['data','title','postal'],
  template: '\
\
  <div class="reporting_unit">\
    <div class="header">\
      <a class="title" :href="\''+E2020_PUB_PATH+'/state/\'+postal.toLowerCase()+\'/president/\'" v-html="title"></a>\
      <span class="reporting">{{ data[\'precincts_reporting_rcp\'] }}% Reporting</span>\
    </div>\
    <table class="candidate"><tbody>\
      <tr v-for="c in data[\'candidates\']" v-if="c.last_name == \'Biden\' || c.last_name == \'Trump\'">\
        <td class="affiliation">\
          <span class="winner"><img v-if="c[\'winner\'] == \'X\' || c[\'winner\'] == \'R\'" src="/images/check_winner.png" alt="checkmark"></span>\
        </td>\
        <td class="name" v-html="c[\'last_name\']"></td>\
        <td class="percentage" v-html="c[\'percentage\']+\'%\'"></td>\
        <td class="bar"><span class="bar_container"><span :class="[\'bar_inner\', ( [\'gop\',\'dem\'].indexOf(c[\'affiliation\'].toLowerCase()) > -1 ? c[\'affiliation\'].toLowerCase() : \'ind\' )]" :style="\'width:\'+c[\'percentage\']+\'%;\'"></span></span></td>\
        <td class="votes" v-html="parseInt(c[\'votes\']).toLocaleString()"></td>\
      </tr>\
      <tr>\
        <td colspan="5" :class="vote_spread(data[\'candidates\']).affiliation" class="spread"><a :href="\''+E2020_PUB_PATH+'/state/\'+postal.toLowerCase()+\'/president/\'" v-html="vote_spread(data[\'candidates\']).votes"></a></td>\
      </tr>\
    </tbody></table>\
  </div>\
\
  ',

  created: function() {
    
  },

  methods : rcp_merge_methods(rcp_shared_methods, {

    vote_spread : function(candidates) {

      var top_votes = 0;
      var sec_votes = 0;
      var top_i = 0;
      var sec_i = 0;
      for(var i = 0; i < candidates.length; i++) {
        var v = parseInt(candidates[i].votes);
        if(v > top_votes) {
          sec_votes = top_votes;
          sec_i = top_i;
          top_votes = v;
          top_i = i;
        } else if(v > sec_votes) {
          sec_votes = v;
          sec_i = i;
        }
      }

      var spread = (top_votes - sec_votes).toLocaleString();

      return {
        "affiliation" : candidates[top_i].affiliation.toLowerCase(),
        "votes": candidates[top_i].last_name+' +'+spread,
      };
    }
  })
});

Vue.component('rc-widget-state-closeups', {
  template: '\
\
    <div class="container">\
\
      <div class="e2018_map_widget">\
\
        <div class="title">2020 Results - State Details</div>\
\
        <div class="state_closeups_container">\
\
          <div v-if="loading" class="e2018_spinner"><div><div></div></div></div>\
  \
          <reporting-unit-closeup\
            v-if="first_load_done"\
            :data="top_race(\'AZ\',\'\')"\
            postal="AZ"\
            title="Arizona"\
          ></reporting-unit-closeup>\
  \
          <reporting-unit-closeup\
            v-if="first_load_done"\
            :data="top_race(\'GA\',\'\')"\
            postal="GA"\
            title="Georgia"\
          ></reporting-unit-closeup>\
  \
          <reporting-unit-closeup\
            v-if="first_load_done"\
            :data="top_race(\'NC\',\'\')"\
            postal="NC"\
            title="North Carolina"\
          ></reporting-unit-closeup>\
\
        </div>\
\
      </div>\
\
    </div>\
\
  ',
  data : function() {
    return {
      "state_type" : "president",
      "loading_interval" : 0,
      "loading" : true,
      "first_load_done" : false,
      "reporting_units" : [],
      "top_ru" : []
    }
  },
  created : function() {

    this.get_data_for_state();
    
    // Start refresh cron
    /*this.loading_interval = setInterval(function() {
      this.fetch_data();
    }.bind(this), rcp_refresh_interval * 1000);*/
  },
  methods : rcp_merge_methods(rcp_shared_methods, {

    fetch_data : function() {

      if(!this.loading) {
        this.get_data_for_state();
      }
    },

    get_data_for_state : function() {

      this.loading = true;
      // Retrieve live results data
      var file_name = 'counties_'+this.state_type;
      if(this.state_type == 'house') {
        file_name = 'districts_'+this.state_type;
      }
      
      axios.get(E2020_PUB_PATH+'/'+file_name+'.json?cache_bust='+rcp_cache_bust())
      .then(function(response) {
        // // Successfully retrieved data

        // Grab this state's reporting units
        for(var i = 0; i < response.data.map_county_data.election.race.length; i++) {

          var race = response.data.map_county_data.election.race[i];

          if (race['region_key'].toLowerCase() == this.state_postal) {  //Original filter

            if (race['region_key'].toLowerCase() == 'ga') {
              console.log(race);
              if (this.special == 'gaspecial') {  //Georgia Special
                var is_special_flag = 0;
                for (c = 0; c < race.candidates.length; c++) {
                  if (race.candidates[c].last_name == 'Loeffler') {
                    is_special_flag = 1;
                  }
                }

                if (is_special_flag == 1) { 
                  this.reporting_units.push(race);

                }
              } else {   // Normal Georgia Senate, President, House, and Governor if any
                var is_regular_flag = 0;
                for (r = 0; r < race.candidates.length; r++) {
                  if (race.candidates[r].last_name == 'Perdue') {
                    is_regular_flag = 1;
                  }
                }

                if (is_regular_flag == 1) {  //Georgia Senate
                  this.reporting_units.push(race);
                }else{ //Georgia President, House, and Governor if any
                  this.reporting_units.push(race); //
                }
              }

            } else {
              //Everything else except Georgia
              this.reporting_units.push(race);

            }
          } 

        }

        // Grab top level reporting unit
        this.top_ru = response.data.top_level_ru;

        this.first_load_done = true;
        this.loading = false;

      }.bind(this));
    },
    nav_ga_special_href : function(data, special, state_postal) {
      
      return '';
    },
    top_race : function(postal,special) {

      var top_ru = JSON.parse(JSON.stringify(this.top_race_pre_sorted(postal,special)));

      top_ru['candidates'].sort(function(a,b) {
        return parseInt(a.votes) > parseInt(b.votes) ? -1 : 1;
      });

      return top_ru;
    },
    top_race_pre_sorted : function(postal,special) {
      
      for(var i = 0; i < this.top_ru.length; i++) {

        var the_top_ru = this.top_ru[i];

        if (this.top_ru[i]['region_key'].toLowerCase() == postal.toLowerCase()) {  //Original filter

          if (this.top_ru[i]['region_key'].toLowerCase() == 'ga') {
            
            if (special == 'gaspecial') {
              var is_special_flag = 0;
              for (c = 0; c < the_top_ru.candidates.length; c++) {
                if (the_top_ru.candidates[c].last_name == 'Loeffler') {
                  is_special_flag = 1;
                }
              }

              if (is_special_flag == 1) { 
                return this.top_ru[i];
              }
            } else { // Normal Georgia Senate, President, House, and Governor if any
              var is_regular_flag = 0;
              for (r = 0; r < the_top_ru.candidates.length; r++) {
                if (the_top_ru.candidates[r].last_name == 'Perdue') {
                  is_regular_flag = 1;
                }
              }

              if (is_regular_flag == 1) { //Georgia Senate
                return this.top_ru[i];
              }else{ //Georgia President, House, and Governor if any
                return this.top_ru[i];
              }
            }
          } else {
            return this.top_ru[i];
          }
        } 

      }

      return {};
    },

  })
});

// Start App
var all_closeups = document.querySelectorAll('rc-widget-state-closeups');
if(all_closeups.length > 0) {
  for(var i = 0; i < all_closeups.length; i++) {
    new Vue({
      el: all_closeups[i]
    });
  }
}
