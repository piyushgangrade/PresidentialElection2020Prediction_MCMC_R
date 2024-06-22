/*

Favorability Ratings - Vue.js app

Summary:
Loads select favorability rating numbers

Dependencies:
Vue js 2.5.13
Axios 0.18.0

Browser Requirements:
IE9+

*/

Vue.component('fav-ratings-beta', {
  template: '\
    <div class="favorability_ratings_widget">\
      <div class="election_header_main">\
        <a href="/epolls/other/other/FavorabilityRatingsPoliticalLeaders.html">Favorability Ratings: U.S. Political Leaders</a>\
      </div>\
      \
      <table id="fav_ratings_table" border="0" cellpadding="0" cellspacing="0">\
        <tbody>\
          <tr class="header_row">\
            <th class="name"></th>\
            <th class="fav">Favorable</th>\
            <th class="unfav">Unfavorable</th>\
            <th class="spread">Spread</th>\
          </tr>\
          <tr v-for="(data, index) in fav_data" v-if="index < fav_num">\
            <td class="name"><a :href="data.data.link" v-html="data.first_name+\' \'+data.last_name"></a></td>\
            <td class="fav"><a :href="data.data.link" v-html="typeof data.data.rcp_avg !== \'undefined\' ? data.data.rcp_avg[0].candidate[0].value : \'\'"></a></td>\
            <td class="unfav"><a :href="data.data.link" v-html="typeof data.data.rcp_avg !== \'undefined\' ? data.data.rcp_avg[0].candidate[1].value : \'\'"></a></td>\
            <td class="spread"><a :href="data.data.link" :class="data.highest.toLowerCase()" v-html="data.spread_str"></a><span v-html="data.arrow"></span></td>\
          </tr>\
        </tbody>\
      </table>\
      \
      <div class="expand" @click="fav_num += 10; expanded = true;" v-if="!expanded">Expand for More</div>\
      \
    </div>\
  ',
  data : function() {
    return {
      promises : [],
      fav_num : 14,
      expanded : true,
      fav_data : [
        { id: 6677, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Joe', last_name:'Biden' },
        { id: 5493, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Donald', last_name:'Trump' },
        { id: 7966, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Ron', last_name:'DeSantis' },
        { id: 6690, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Kamala', last_name:'Harris' },
        { id: 6729, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Kevin', last_name:'McCarthy' }, 
        { id: 7971, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Hakeem', last_name:'Jeffries' },            
        { id: 6674, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Chuck', last_name:'Schumer' },
        { id: 6672, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Mitch', last_name:'McConnell' },

        // { id: 6677, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Joe', last_name:'Biden' },
        // { id: 6690, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Kamala', last_name:'Harris' },
        // { id: 5493, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Donald', last_name:'Trump' },
        // { id: 7966, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Ron', last_name:'DeSantis' },
        // { id: 6673, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Nancy', last_name:'Pelosi' },        
        // { id: 6729, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Kevin', last_name:'McCarthy' },
        // { id: 6674, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Chuck', last_name:'Schumer' },
        // { id: 6672, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Mitch', last_name:'McConnell' },
        
        //{ id: 3468, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Paul', last_name:'Ryan' },
        //{ id: 6675, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Elizabeth', last_name:'Warren' },
        //{ id: 5263, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Bernie', last_name:'Sanders' },
        //{ id: 3469, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Joe', last_name:'Biden' },
        //{ id: 6013, arrow:'', spread_str:'', highest:'', data: [], first_name: 'Mike', last_name:'Pence' },
      ],
      cache_bust : Math.floor((new Date()).getTime() / 25000), // Changes every 25 seconds
    }
  },
  created : function() {
    this.load_content();
  },
  methods : {
    isXML : function( elem ) {
      // documentElement is verified for cases where it doesn't yet exist
      // (such as loading iframes in IE - #4833) 
      var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

      return documentElement ? documentElement.nodeName !== "HTML" : false;
    },
    id_to_historical_data_recent_url : function(id) {
      return '/poll/race/'+id+'/historical_data.json?cache_bust='+this.cache_bust;
    },
    show_arrow : function( race, c1, c2, spread_current, p1, p2 ) {

      var arrow = '';

      return arrow;

      if(race['poll_override_trend'] == '1') {
        return arrow;
      }

      // Instead of using latest RCP avg for date, find latest rcp avg that has a spread DIFFERENT from the previous

      var first_avg = race['rcp_avg'][0];
      var prev_avg = first_avg;
      var latest_different_rcp_avg = first_avg;

      if(typeof race['rcp_avg'][1] !== 'undefined') {

        for(i = 1; i < race['rcp_avg'].length; i++) {

          var avg = race['rcp_avg'][i];

          for(var j = 0; j < avg['candidate'].length; j++) {

            if(avg['candidate'][j]['name'] == c1) {
              c1_score = avg['candidate'][j]['value'];
            } else if(avg['candidate'][j]['name'] == c2) {
              c2_score = avg['candidate'][j]['value'];
            }
          }

          var spread_old = parseFloat(c1_score) - parseFloat(c2_score);
          spread_old = Math.round(spread_old * 10) / 10;
          if(spread_current != spread_old) {

            latest_different_rcp_avg = race['rcp_avg'][i-1];
            prev_avg = avg;
            break;
          }
        }
      }
      
      var rcp_avg_date = new Date(latest_different_rcp_avg['date']);
      var time_diff = Math.abs(today_date.getTime() - rcp_avg_date.getTime());
      var days_diff = Math.ceil(time_diff / (1000 * 3600 * 24));

      var c1_score = 0;
      var c2_score = 0;

      if(days_diff <= 2 && typeof race['rcp_avg'][1] !== 'undefined')
      {
        // It's within 24 hours (technically 47:59 I think)
        // Compare previous score to new score
        for(var j = 0; j < prev_avg['candidate'].length; j++) {

          if(prev_avg['candidate'][j]['name'] == c1) {
            c1_score = prev_avg['candidate'][j]['value'];
          } else if(prev_avg['candidate'][j]['name'] == c2) {
            c2_score = prev_avg['candidate'][j]['value'];
          }
        }

        var spread_old = parseFloat(c1_score) - parseFloat(c2_score);
        spread_old = Math.round(spread_old * 10) / 10;
        if(spread_current > spread_old) {
          arrow = '<img class="arrow" src="/images/bg_election_2010_trend_up_'+p1.toLowerCase()+'.gif" alt="Trending Up">';
        } else if(spread_current < spread_old) {
          arrow = '<img class="arrow" src="/images/bg_election_2010_trend_down_'+p1.toLowerCase()+'.gif" alt="Trending Down">';
        }
      }

      if(days_diff <= 2) {

        // Arrow editor overrides
        var editor_arrow = race['rcp_avg'][0]['arrow_spread'];

        if(editor_arrow == '1') {
          arrow = '<span class="arrow"></span>';
        } else if(editor_arrow == '2') {
          arrow = '<img class="arrow" src="/images/bg_election_2010_trend_up_'+p1.toLowerCase()+'.gif" alt="Trending Up">';
        } else if(editor_arrow == '3') {
          arrow = '<img class="arrow" src="/images/bg_election_2010_trend_down_'+p1.toLowerCase()+'.gif" alt="Trending Down">';
        }
      }

      return arrow;
    },
    getParameterByName : function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    //
    load_content : function() {

      // Load all senate json
      this.fav_data.forEach(function(singleElement) {
        this.promises.push(axios({
          method : 'get',
          url : this.id_to_historical_data_recent_url(singleElement.id),
          validateStatus: function (status) {
            return status < 500;
          }
        }));
      }.bind(this));

      axios.all(this.promises)
      .catch(function(error) {
        console.log(error);
      })
      .then(function(results) {

        // Fav Ratings
        for(var i = 0; i < this.fav_data.length; i++) {
          for(var j = 0; j < results.length; j++) {
            if(typeof results[j].data !== 'undefined' && 
              typeof results[j].data.id !== 'undefined' && 
              this.fav_data[i].id == results[j].data.id) {

              this.fav_data[i].data = results[j].data;

              break;
            }
          }
        }

        for(var i = 0; i < this.fav_data.length; i++) {

          if(typeof this.fav_data[i]['data']['rcp_avg'] !== 'undefined') {

            var highest_score = 0;
            var highest_name = '';
            var highest_aff = '';
            var second_highest_score = 0;
            var second_highest_name = '';
            var second_highest_aff = '';

            for(var j = 0; j < this.fav_data[i]['data']['rcp_avg'][0]['candidate'].length; j++) {

              var c = this.fav_data[i]['data']['rcp_avg'][0]['candidate'][j];

              var this_name = c['name'];
              var this_score = c['value'];
              var this_aff = c['name'];

              if(this_score > highest_score) {
                second_highest_score = highest_score;
                second_highest_name = highest_name;
                second_highest_aff = highest_aff;
                highest_score = this_score;
                highest_name = this_name;
                highest_aff = this_aff;
              } else if(this_score > second_highest_score) {
                second_highest_score = this_score;
                second_highest_name = this_name;
                second_highest_aff = this_aff;
              }
            }

            var spread_current = parseFloat(highest_score) - parseFloat(second_highest_score);
            var spread = Math.round(spread_current * 10) / 10;
            var spread_str = '';
            if(spread > 0) {
              var sign = '+';
              if(highest_name.toLowerCase() == 'unfavorable') {
                sign = '-';
              }
              spread_str = sign+(Math.floor(spread*10)/10).toFixed(1);
            } else {
              spread_str = 'Tie';
            }

            var arrow = this.show_arrow(this.fav_data[i]['data'], highest_name, second_highest_name, spread, highest_aff, second_highest_aff);
          
            this.fav_data[i]['arrow'] = arrow;
            this.fav_data[i]['spread_str'] = spread_str;
            this.fav_data[i]['highest'] = highest_aff;
          }
        }

      }.bind(this));
    }
  }
});

// Start App
new Vue({
  el: '#fav-ratings-app',
  template: '<fav-ratings-beta/>',
});
