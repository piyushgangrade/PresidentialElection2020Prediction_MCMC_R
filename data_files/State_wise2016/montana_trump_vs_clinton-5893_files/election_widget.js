/*

Homepage Election Widget - Vue.js app

Summary:
3 tab election widget. President Senate House

Dependencies:
Vue js 2.5.13
Axios 0.18.0

Browser Requirements:
IE11 or Modern

*/
  
Vue.component('election-widget', {

  template: '<div class="hp_election_widget">\
\
    <div class="mast">\
\
      <div class="title">RealClearPolitics Election 2020</div>\
\
      <ul class="nav">\
\
        <li @click="click_active_tab(\'president\')" :class="{ active : active_tab == \'president\' }">President</li>\
        <li @click="click_active_tab(\'senate\')" :class="{ active : active_tab == \'senate\' }">Senate</li>\
        <li @click="click_active_tab(\'house\')" :class="{ active : active_tab == \'house\' }">House</li>\
\
      </ul><!-- .nav -->\
\
    </div><!-- .mast -->\
\
    <ul class="tabs">\
\
      <li class="tab president" v-show="active_tab == \'president\'">\
\
        <table class="results">\
\
          <tbody>\
\
            <tr class="header">\
\
              <td>Election 2020</td>\
              <td>Biden</td>\
              <td>Trump</td>\
              <td>Spread</td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'nat_avg\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'nat_avg\'][\'url\']">RCP <span class="tablet_portrait_and_below_only">Poll</span><span class="not_tablet_portrait_and_below">National</span> Average</a></td>\
              <td><a :href="files[\'nat_avg\'][\'url\']" v-html="files[\'nat_avg\'][\'data\'][\'biden\']"></a></td>\
              <td><a :href="files[\'nat_avg\'][\'url\']" v-html="files[\'nat_avg\'][\'data\'][\'trump\']"></a></td>\
              <td :class="files[\'nat_avg\'][\'data\'][\'spread_arrow\']"><a :href="files[\'nat_avg\'][\'url\']" :class="files[\'nat_avg\'][\'data\'][\'spread_aff\']" v-html="files[\'nat_avg\'][\'data\'][\'spread\']"></a></td>\
\
            </tr>\
\
            <tr v-if="!files[\'top_bg\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'top_bg\'][\'url\']">Top Battlegrounds</a></td>\
              <td><a :href="files[\'top_bg\'][\'url\']" v-html="files[\'top_bg\'][\'data\'][\'biden\']"></a></td>\
              <td><a :href="files[\'top_bg\'][\'url\']" v-html="files[\'top_bg\'][\'data\'][\'trump\']"></a></td>\
              <td :class="files[\'top_bg\'][\'data\'][\'spread_arrow\']"><a :href="files[\'top_bg\'][\'url\']" :class="files[\'top_bg\'][\'data\'][\'spread_aff\']" v-html="files[\'top_bg\'][\'data\'][\'spread\']"></a></td>\
\
            </tr>\
\
            <tr v-if="!files[\'latest_bo\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'latest_bo\'][\'url\']">Latest Betting Odds</a></td>\
              <!--<td><a>--</a></td>\
              <td><a>--</a></td>-->\
              <!--<td><a :href="files[\'latest_bo\'][\'url\']" v-html="files[\'latest_bo\'][\'data\'][\'biden\']"></a></td>-->\
              <!--<td><a :href="files[\'latest_bo\'][\'url\']" v-html="files[\'latest_bo\'][\'data\'][\'trump\']"></a></td>-->\
              <td><a :href="files[\'latest_bo\'][\'url\']">--</a></td>\
              <td><a :href="files[\'latest_bo\'][\'url\']">--</a></td>\
              <td></td>\
\
            </tr>\
\
          </tbody>\
\
          <tbody>\
\
            <tr class="header">\
\
              <td>Electoral College</td>\
              <td>Biden</td>\
              <td>Trump</td>\
              <td>Toss Ups</td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'electoral_map\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'electoral_map\'][\'url\']">RCP Electoral Map</a></td>\
              <td><a :href="files[\'electoral_map\'][\'url\']" v-html="files[\'electoral_map\'][\'data\'][\'biden\']"></a></td>\
              <td><a :href="files[\'electoral_map\'][\'url\']" v-html="files[\'electoral_map\'][\'data\'][\'trump\']"></a></td>\
              <td class="tossups"><a :href="files[\'electoral_map\'][\'url\']" v-html="files[\'electoral_map\'][\'data\'][\'tossups\']"></a></td>\
\
            </tr>\
\
            <tr v-if="!files[\'electoral_map_ntu\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'electoral_map_ntu\'][\'url\']">No Toss Up States</a></td>\
              <td><a :href="files[\'electoral_map_ntu\'][\'url\']" v-html="files[\'electoral_map_ntu\'][\'data\'][\'biden\']"></a></td>\
              <td><a :href="files[\'electoral_map_ntu\'][\'url\']" v-html="files[\'electoral_map_ntu\'][\'data\'][\'trump\']"></a></td>\
              <td></td>\
\
            </tr>\
\
          </tbody>\
\
          <tbody>\
\
            <tr class="header">\
\
              <td>Battlegrounds \
\
                <ul v-if="files[\'battlegrounds_pres\'][\'loaded\']" class="battlegrounds_switcher">\
\
                  <li @click="click_active_pres(1)" :class="{ active : active_pres == 1 }"><img class="dot_1" :src="\'/images/bg_battlegrounds_\'+(active_pres == 1 ? \'on\' : \'off\')+\'.png\'"></li>\
                  <li @click="click_active_pres(2)" :class="{ active : active_pres == 2 }"><img class="dot_1" :src="\'/images/bg_battlegrounds_\'+(active_pres == 2 ? \'on\' : \'off\')+\'.png\'"></li>\
\
                </ul><!-- .battlegrounds_switcher -->\
\
              </td>\
              <td>Biden</td>\
              <td>Trump</td>\
              <td>Spread</td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'battlegrounds_pres\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <template v-else v-for="(state, s_index) in files[\'battlegrounds_pres\'][\'data\'][\'state_data\']">\
              <tr v-if="Math.ceil((s_index + 1) / per_page_pres) == active_pres" >\
\
                <td><a :href="state.url" v-html="state.name"></a></td>\
                <td><a :href="state.url" v-html="state.biden"></a></td>\
                <td><a :href="state.url" v-html="state.trump"></a></td>\
                <td :class="state.spread_arrow"><a :href="state.url" v-html="state.spread"></a></td>\
\
              </tr>\
            </template>\
\
          </tbody>\
\
          <tbody class="vs">\
\
            <tr class="header">\
\
              <td>2020 vs. 2016</td>\
              <td>2020</td>\
              <td>2016</td>\
              <td>Spread</td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'summary\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'summary\'][\'data\'][\'top_bg\'][\'url\']">Top Battlegrounds</a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'top_bg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'top_bg\'][\'2020\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'top_bg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'top_bg\'][\'2016\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'top_bg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'top_bg\'][\'spread\']"></a></td>\
\
            </tr>\
\
            <tr v-if="!files[\'summary\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'summary\'][\'data\'][\'nat_avg\'][\'url\']">RCP <span class="tablet_portrait_and_below_only">Poll</span><span class="not_tablet_portrait_and_below">National</span> Average</a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'nat_avg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'nat_avg\'][\'2020\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'nat_avg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'nat_avg\'][\'2016\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'nat_avg\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'nat_avg\'][\'spread\']"></a></td>\
\
            </tr>\
\
            <tr v-if="!files[\'summary\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <tr v-else>\
\
              <td><a :href="files[\'summary\'][\'data\'][\'fav\'][\'url\']">Favorability Ratings</a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'fav\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'fav\'][\'2020\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'fav\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'fav\'][\'2016\']"></a></td>\
              <td><a :href="files[\'summary\'][\'data\'][\'fav\'][\'url\']" v-html="files[\'summary\'][\'data\'][\'fav\'][\'spread\']"></a></td>\
\
            </tr>\
\
          </tbody>\
\
        </table><!-- .results -->\
\
        <div class="footer">\
\
          <a href="/epolls/2020/president/2020_elections_electoral_college_map.html">Electoral Map</a> | \
          <a href="/epolls/2020/president/2020_elections_electoral_college_map_no_toss_ups.html">No Toss Ups</a> | \
          <a href="/epolls/2020/senate/2020_elections_senate_map.html">Senate Map</a> | \
          <a href="/epolls/latest_polls/elections/">Latest Polls</a>\
\
        </div><!-- .footer -->\
\
      </li><!-- .tab.president -->\
\
      <li class="tab senate" v-show="active_tab == \'senate\'">\
\
        <ul class="top_boxes">\
\
          <li>\
\
            <div class="title"><a href="/epolls/2020/senate/2020_elections_senate_map.html">Battle for Senate</a></div>\
\
            <ul class="scores" v-if="!files[\'senate_map\'][\'loaded\']">\
              <li><div class="loading_row"></div></li>\
            </ul>\
            <ul class="scores" v-else>\
\
              <li class="dem"><a :href="files[\'senate_map\'][\'url\']" v-html="files[\'senate_map\'][\'data\'][\'dems\']"></a></li>\
              <li class="tossups"><a :href="files[\'senate_map\'][\'url\']" v-html="files[\'senate_map\'][\'data\'][\'tossups\']"></a></li>\
              <li class="gop"><a :href="files[\'senate_map\'][\'url\']" v-html="files[\'senate_map\'][\'data\'][\'gop\']"></a></li>\
\
            </ul><!-- .scores -->\
\
          </li>\
\
          <li>\
\
            <div class="title"><a href="/epolls/2020/senate/2020_elections_senate_map_no_toss_ups.html">No Toss Ups</a></div>\
\
            <ul class="scores" v-if="!files[\'senate_map_ntu\'][\'loaded\']">\
              <li><div class="loading_row"></div></li>\
            </ul>\
            <ul class="scores" v-else>\
\
              <li class="dem"><a :href="files[\'senate_map_ntu\'][\'url\']" v-html="files[\'senate_map_ntu\'][\'data\'][\'dems\']"></a></li>\
              <li class="gop"><a :href="files[\'senate_map_ntu\'][\'url\']" v-html="files[\'senate_map_ntu\'][\'data\'][\'gop\']"></a></li>\
\
            </ul><!-- .scores -->\
\
          </li>\
\
        </ul><!-- .top_boxes -->\
\
        <table class="results">\
\
          <tbody>\
\
            <tr class="header">\
\
              <td>State</td>\
              <td>Spread</td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'battlegrounds_senate\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <template v-else v-for="(state, s_index) in files[\'battlegrounds_senate\'][\'data\'][\'state_data\']">\
              <tr>\
\
                <td><a :href="state.url" v-html="state.name"></a></td>\
                <td :class="state.spread_arrow"><a :href="state.url" :class="state.spread_aff" v-html="state.spread"></a></td>\
\
              </tr>\
            </template>\
\
            <tr v-if="!files[\'senate_map_bg\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <template v-else v-for="(state, s_index) in files[\'senate_map_bg\'][\'data\'][\'state_data\']">\
              <tr>\
\
                <td><a :href="state.url" v-html="state.name"></a></td>\
                <td><a :href="state.url" :class="state.affiliation" v-html="state.status"></a></td>\
\
              </tr>\
            </template>\
\
          </tbody>\
\
        </table><!-- .results -->\
\
        <div class="footer">\
\
          <a href="/epolls/2020/senate/2020_elections_senate_map.html">RCP Senate Map</a> | \
          <a href="/epolls/2020/senate/2020_elections_senate_map_no_toss_ups.html">No Toss Up Map</a> | \
          <a href="/epolls/latest_polls/senate/">Latest Senate Polls</a>\
\
        </div><!-- .footer -->\
\
      </li><!-- .tab.senate -->\
\
      <li class="tab house" v-show="active_tab == \'house\'">\
\
        <ul class="top_boxes">\
\
          <li>\
\
            <div class="title"><a href="/epolls/2020/house/2020_elections_house_map.html">Battle for House</a></div>\
\
            <ul class="scores" v-if="!files[\'house_map\'][\'loaded\']">\
              <li><div class="loading_row"></div></li>\
            </ul>\
            <ul class="scores" v-else>\
\
              <li class="dem"><a :href="files[\'house_map\'][\'url\']" v-html="files[\'house_map\'][\'data\'][\'dems\']"></a></li>\
              <li class="tossups"><a :href="files[\'house_map\'][\'url\']" v-html="files[\'house_map\'][\'data\'][\'tossups\']"></a></li>\
              <li class="gop"><a :href="files[\'house_map\'][\'url\']" v-html="files[\'house_map\'][\'data\'][\'gop\']"></a></li>\
\
            </ul><!-- .scores -->\
\
          </li>\
\
          <li>\
\
            <div class="title"><a href="/epolls/other/2020_generic_congressional_vote-6722.html">Generic Vote</a></div>\
\
            <ul class="scores" v-if="!files[\'generic_ballot\'][\'loaded\']">\
              <li><div class="loading_row"></div></li>\
            </ul>\
            <ul class="scores" v-else>\
\
              <li class="full" :class="files[\'generic_ballot\'][\'data\'][\'spread_aff\']"><a :href="files[\'generic_ballot\'][\'url\']" v-html="files[\'generic_ballot\'][\'data\'][\'spread\']"></a></li>\
\
            </ul><!-- .scores -->\
\
          </li>\
\
        </ul><!-- .top_boxes -->\
\
        <a class="map_image" href="/epolls/2020/house/2020_elections_house_map.html">\
\
          <img src="/images/downloads/40.png" alt="House Map 2020">\
\
        </a><!-- .map_image -->\
\
        <table class="results">\
\
          <tbody>\
\
            <tr class="header">\
\
              <td colspan="2" style="text-align: center;">Toss Up Races \
\
                <ul v-if="files[\'battlegrounds_house\'][\'loaded\']" class="battlegrounds_switcher">\
\
                  <template v-for="n in Math.ceil(files[\'battlegrounds_house\'][\'data\'][\'state_data\'].length / per_page_house)"><li @click="click_active_house(n)" :class="{ active : active_house == n }"><img class="dot_1" :src="\'/images/bg_battlegrounds_\'+(active_house == n ? \'on\' : \'off\')+\'.png\'"></li>&nbsp;</template>\
\
                </ul><!-- .battlegrounds_switcher -->\
\
              </td>\
\
            </tr><!-- .header -->\
\
            <tr v-if="!files[\'battlegrounds_house\'][\'loaded\']"><td colspan="4"><div class="loading_row"></div></td></tr>\
            <template v-else v-for="(state, s_index) in files[\'battlegrounds_house\'][\'data\'][\'state_data\']">\
              <tr v-if="Math.ceil((s_index + 1) / per_page_house) == active_house" >\
\
                <td><a :href="state.url" v-html="state.state"></a></td>\
                <td><a :href="state.url" v-html="state.title"></a></td>\
\
              </tr>\
            </template>\
\
          </tbody>\
\
        </table><!-- .results -->\
\
        <div class="footer">\
\
          <a href="/epolls/2020/house/2020_elections_house_map.html">RCP House Map</a> | \
          <a href="/epolls/other/2020_generic_congressional_vote-6722.html">Generic Ballot</a> | \
          <a href="/epolls/latest_polls/house/">Latest House Polls</a>\
\
        </div><!-- .footer -->\
\
      </li><!-- .tab.house -->\
\
    </ul><!-- .tabs -->\
\
  </div><!-- .hp_election_widget -->',

  data : function() {
    return {
      cache_bust : Math.floor((new Date()).getTime() / 25000), // Changes every 25 seconds
      active_tab : 'president',
      active_tab_timer_list : [
        'president','president','president','president',
        'senate','senate',
        'house',
      ],
      active_tab_index : 0,
      active_tab_interval : 0,
      active_tab_seconds : 15,
      active_pres : 1,
      active_pres_interval : 0,
      active_pres_seconds : 45,
      per_page_pres : 6,
      active_house : 1,
      active_house_interval : 0,
      active_house_seconds : 20,
      per_page_house : 3,
      tab_timer_paused : false,
      files : {
        "nat_avg" : {
          "loaded" : false,
          "url" : "/epolls/2020/president/us/general_election_trump_vs_biden-6247.html",
          "title" : "RCP National Average",
          "data_url" : "/poll/race/6247/historical_data.json",
          "data" : {
            "biden" : 0,
            "trump" : 0,
            "spread" : "", 
            "spread_arrow" : "",
            "spread_aff" : "",
          },
        },
        "top_bg" : {
          "loaded" : false,
          "url" : "/elections/trump-vs-biden-top-battleground-states/",
          "title" : "Top Battlegrounds",
          "data_url" : "/json/battleground_script/key_battleground_states_2020_spread_average_long.json",
          "arrow_url" : "/widgets/2020_top_battleground_arrow.json",
          "data" : {
            "biden" : 0,
            "trump" : 0,
            "spread" : "", 
            "spread_arrow" : "",
            "spread_aff" : "",
          },
        },
        "latest_bo" : {
          "loaded" : false,
          "url" : "/elections/betting_odds/2020_president/",
          "title" : "Latest Betting Odds",
          "data_url" : "/json/odds/event_odds_1_final.json",
          "data" : {
            "biden" : 0,
            "trump" : 0,
            "spread" : "", 
          },
        },
        "electoral_map" : {
          "loaded" : false,
          "url" : "/epolls/2020/president/2020_elections_electoral_college_map.html",
          "title" : "RCP Electoral Map",
          "data_url" : "/poll/map/map_42.json",
          "data" : {
            "biden" : 0,
            "trump" : 0,
            "tossups" : "", 
          },
        },
        "electoral_map_ntu" : {
          "loaded" : false,
          "url" : "/epolls/2020/president/2020_elections_electoral_college_map_no_toss_ups.html",
          "title" : "No Toss Up States",
          "data_url" : "/poll/map/map_42_ntu.json",
          "data" : {
            "biden" : 0,
            "trump" : 0,
          },
        },
        "summary" : {
          "loaded" : false,
          "data_url" : "/json/battleground_script/summary.json",
          "data" : {
            "top_bg" : {
              "2020" : 0,
              "2016" : 0,
              "spread" : "",
              "url" : "/epolls/2020/president/us/trump-vs-biden-top-battleground-states-2020-vs-2016/",
            },
            "nat_avg" : {
              "2020" : 0,
              "2016" : 0,
              "spread" : "",
              "url" : "/epolls/2020/president/us/trump-vs-biden-national-polls-2020-vs-2016/",
            },
            "fav" : {
              "2020" : 0,
              "2016" : 0,
              "spread" : "",
              "url" : "/epolls/2020/president/us/trump-vs-biden-favorability-ratings-2020-vs-2016/",
            },
          },
        },
        "battlegrounds_pres" : {
          "loaded" : false,
          "data_url" : "/widgets/bgwidget_pres_2020_races.json",
          "data" : {
            "state_data" : [],
          }
        },
        "battlegrounds_senate" : {
          "loaded" : false,
          "data_url" : "/widgets/bgwidget_senate_2020_races.json",
          "data" : {
            "state_data" : [],
          }
        },
        "battlegrounds_house" : {
          "loaded" : false,
          "data_url" : "/widgets/bgwidget_house_2020_races.json",
          "data" : {
            "state_data" : [],
          }
        },
        "senate_map" : {
          "loaded" : false,
          "url" : "/epolls/2020/senate/2020_elections_senate_map.html",
          "title" : "RCP Senate Map",
          "data_url" : "/poll/map/map_41.json",
          "data" : {
            "dems" : 0,
            "gop" : 0,
            "tossups" : "", 
          },
        },
        "senate_map_ntu" : {
          "loaded" : false,
          "url" : "/epolls/2020/senate/2020_elections_senate_map_no_toss_ups.html",
          "title" : "No Toss Up States",
          "data_url" : "/poll/map/map_41_ntu.json",
          "data" : {
            "dems" : 0,
            "gop" : 0,
          },
        },
        "senate_map_bg" : {
          "loaded" : false,
          "url" : "/epolls/2020/senate/2020_elections_senate_map.html",
          "title" : "RCP Senate Map Battlegrounds",
          "data_url" : "/poll/map/map_41.json",
          "data" : {
            "state_data" : [],
          },
          "state_list" : ["mt","mn","me","sc","co","ks"],
        },
        "house_map" : {
          "loaded" : false,
          "url" : "/epolls/2020/house/2020_elections_house_map.html",
          "title" : "RCP House Map",
          "data_url" : "/poll/map/map_40.json",
          "data" : {
            "dems" : 0,
            "gop" : 0,
            "tossups" : "", 
          },
        },
        "generic_ballot" : {
          "loaded" : false,
          "url" : "/epolls/other/2020_generic_congressional_vote-6722.html",
          "title" : "Generic Vote",
          "data_url" : "/poll/race/6722/historical_data.json",
          "data" : {
            "spread" : "",
          },
        },
      },
    };
  },

  mounted : function() {
    this.load_data();
    this.active_tab_init();
    this.active_pres_init();
  },

  methods : {

    click_active_house : function(num) {

      this.active_house = num;
      this.active_house_init();
      this.active_pres_init();
      this.active_tab_init();
    },

    active_house_init : function() {

      clearInterval(this.active_house_interval);
      this.active_house_interval = setInterval(function() {

        if(this.active_house == 4) {
          this.active_house = 1;
        } else {
          this.active_house++;
        }

      }.bind(this), 1000 * this.active_house_seconds);
    },

    click_active_pres : function(num) {

      this.active_pres = num;
      this.active_pres_init();
      this.active_house_init();
      this.active_tab_init();
    },

    active_pres_init : function() {

      clearInterval(this.active_pres_interval);
      this.active_pres_interval = setInterval(function() {

        if(this.active_pres == 1) {
          this.active_pres = 2;
        } else {
          this.active_pres = 1;
        }

      }.bind(this), 1000 * this.active_pres_seconds);
    },

    click_active_tab : function(str) {

      this.active_tab = str;
      this.active_tab_index = this.active_tab_timer_list.indexOf(str);

      clearInterval(this.active_tab_interval);
      this.tab_timer_paused = true;

      this.active_pres = 1;
      this.active_house = 1;

      this.active_house_init();
      this.active_pres_init();
    },

    active_tab_init : function() {

      if(this.tab_timer_paused) { return; }

      clearInterval(this.active_tab_interval);
      this.active_tab_interval = setInterval(function() {

        if(this.active_tab_index >= this.active_tab_timer_list.length - 1) {
          this.active_tab_index = 0;
        } else {
          this.active_tab_index++;
        }
        this.active_tab = this.active_tab_timer_list[this.active_tab_index];

      }.bind(this), 1000 * this.active_tab_seconds);
    },

    load_data : function() {

      axios.get(this.files['nat_avg']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['nat_avg']['data']['biden'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][0]['candidate'], 'biden'));
        this.files['nat_avg']['data']['trump'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][0]['candidate'], 'trump'));
        this.files['nat_avg']['data']['spread'] = this.spread_from_values(['Biden', 'Trump'], [this.files['nat_avg']['data']['biden'], this.files['nat_avg']['data']['trump']]);
        this.files['nat_avg']['data']['spread_aff'] = this.spread_aff_from_values(['dem', 'gop'], [this.files['nat_avg']['data']['biden'], this.files['nat_avg']['data']['trump']]);

        if(typeof response['data']['rcp_avg'][1] !== "undefined") {
          var biden_prev = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][1]['candidate'], 'biden'));
          var trump_prev = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][1]['candidate'], 'trump'));
          this.files['nat_avg']['data']['spread_arrow'] = this.get_spread_arrow(
            ['dem', 'gop'], 
            [this.files['nat_avg']['data']['biden'], this.files['nat_avg']['data']['trump']],
            [biden_prev,trump_prev], 
            response['data']['rcp_avg'][0]['date'], 
            response['data']['rcp_avg'][0]['arrow_spread']
          );
        }

        this.files['nat_avg']['loaded'] = true;

      }.bind(this));

      axios.all([
        axios.get(this.files['top_bg']['data_url']+'?cache='+this.cache_bust),
        axios.get(this.files['top_bg']['arrow_url']+'?cache='+this.cache_bust),
      ])
      .then(function(response) {

        var r1 = response[0];

        this.files['top_bg']['data']['biden'] = this.v_one_dec(this.val_from_candidates(r1['data']['rcp_avg'][0]['candidate'], 'biden'));
        this.files['top_bg']['data']['trump'] = this.v_one_dec(this.val_from_candidates(r1['data']['rcp_avg'][0]['candidate'], 'trump'));
        this.files['top_bg']['data']['spread'] = this.spread_str_from_val(['Biden', 'Trump'], r1['data']['rcp_avg'][0]['spread']);
        this.files['top_bg']['data']['spread_aff'] = this.spread_aff_from_spread_val(['dem', 'gop'], r1['data']['rcp_avg'][0]['spread']);

        var prev_index = 1;
        r1['data']['rcp_avg'].some(function(avg, i) {
          if(avg['after_last_entered_avg'] == false) {
            prev_index = i + 1;
            return true;
          }
        });

        if(typeof r1['data']['rcp_avg'][prev_index] !== "undefined") {

          var biden_cur = this.val_from_candidates(r1['data']['rcp_avg'][prev_index-1]['candidate'], 'biden');
          var trump_cur = this.val_from_candidates(r1['data']['rcp_avg'][prev_index-1]['candidate'], 'trump');
          var biden_prev = this.val_from_candidates(r1['data']['rcp_avg'][prev_index]['candidate'], 'biden');
          var trump_prev = this.val_from_candidates(r1['data']['rcp_avg'][prev_index]['candidate'], 'trump');
          
          this.files['top_bg']['data']['spread_arrow'] = this.get_spread_arrow(
            ['dem', 'gop'], 
            [biden_cur, trump_cur],
            [biden_prev,trump_prev], 
            r1['data']['rcp_avg'][prev_index-1]['date'], 
            r1['data']['rcp_avg'][prev_index-1]['arrow_spread']
          );
        }

        if(response[1]['data']['override'] != 'default') {
          this.files['top_bg']['data']['spread_arrow'] = response[1]['data']['override'];
        }

        this.files['top_bg']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['latest_bo']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['latest_bo']['data']['biden'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_event_odds'][0]['averages']['candidates'], 'joe biden'));
        this.files['latest_bo']['data']['trump'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_event_odds'][0]['averages']['candidates'], 'donald trump'));
        
        this.files['latest_bo']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['electoral_map']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['electoral_map']['data']['biden'] = response['data']['election']['module_info']['total_dem'];
        this.files['electoral_map']['data']['trump'] = response['data']['election']['module_info']['total_gop'];
        this.files['electoral_map']['data']['tossups'] = response['data']['election']['module_info']['total_tu'];
        
        this.files['electoral_map']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['electoral_map_ntu']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['electoral_map_ntu']['data']['biden'] = response['data']['election']['module_info']['total_dem'];
        this.files['electoral_map_ntu']['data']['trump'] = response['data']['election']['module_info']['total_gop'];
        
        this.files['electoral_map_ntu']['loaded'] = true;

      }.bind(this));

      // President Battleground States

      axios.get(this.files['battlegrounds_pres']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        var axios_gets = response.data.race_ids_pres_2020.map(function(item) {
          return axios.get('/poll/race/'+item+'/historical_data.json?cache='+this.cache_bust);
        }.bind(this));

        axios.all(axios_gets).then(function(response) {

          response.forEach(function(r) {

            var new_data = {};

            new_data['url'] = r['data']['link'];
            new_data['name'] = this.state_abbr_to_str(r['data']['state']);
            new_data['biden'] = this.v_one_dec(this.val_from_candidates(r['data']['rcp_avg'][0]['candidate'], 'biden'));
            new_data['trump'] = this.v_one_dec(this.val_from_candidates(r['data']['rcp_avg'][0]['candidate'], 'trump'));
            new_data['spread'] = this.spread_from_values(['Biden', 'Trump'], [new_data['biden'], new_data['trump']]);
            new_data['spread_aff'] = this.spread_aff_from_values(['dem', 'gop'], [new_data['biden'], new_data['trump']]);

            if(typeof r['data']['rcp_avg'][1] !== "undefined") {
              var biden_prev = this.v_one_dec(this.val_from_candidates(r['data']['rcp_avg'][1]['candidate'], 'biden'));
              var trump_prev = this.v_one_dec(this.val_from_candidates(r['data']['rcp_avg'][1]['candidate'], 'trump'));
              new_data['spread_arrow'] = this.get_spread_arrow(
                ['dem', 'gop'], 
                [new_data['biden'], new_data['trump']],
                [biden_prev,trump_prev], 
                r['data']['rcp_avg'][0]['date'], 
                r['data']['rcp_avg'][0]['arrow_spread']
              );
            }

            this.files['battlegrounds_pres']['data']['state_data'].push(new_data);

          }.bind(this));

          this.files['battlegrounds_pres']['loaded'] = true;

        }.bind(this));

      }.bind(this));

      // House Battleground States

      axios.get(this.files['battlegrounds_house']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        var axios_gets = [];

        response.data.race_ids_house_2020.forEach(function(item) {
          axios_gets.push('/poll/race/'+item+'/polling_data.json?cache='+this.cache_bust);
          axios_gets.push('/poll/race/'+item+'/candidates.json?cache='+this.cache_bust);
        }.bind(this));

        axios.all(axios_gets.map(function(g) { return axios.get(g); })).then(function(response) {

          var new_data = {};

          console.log(response);

          response.forEach(function(r) {

            console.log(r);

            if(typeof r['data']['moduleInfo'] !== 'undefined') { // polling_data

              new_data = {};
              new_data['title'] = '';

              new_data['url'] = r['data']['moduleInfo']['link'];
              //new_data['title'] = r['data']['moduleInfo']['title'].split(' - ').pop();
              new_data['state'] = this.state_abbr_to_str(r['data']['moduleInfo']['state']);
              if(typeof r['data']['moduleInfo']['house_district'] !== 'undefined') {
                var district_num = r['data']['moduleInfo']['house_district'];
                var district_str = "CD "+district_num;
                if(district_num == 0) {
                  district_str = "At Large";
                }
                new_data['state'] += ' '+district_str;
              }

            } else if(typeof r['data']['candidates'] !== 'undefined') { // candidates

              var active_candidate_count = 0;

              r['data']['candidates'].forEach(function(c, i) {

                if(c['candidate_status'] != "0") {

                  if(active_candidate_count > 0) {
                    new_data['title'] += ' vs. ';
                  }

                  new_data['title'] += c['candidate_last_name']+' ('+c['candidate_affiliation'].charAt(0)+')';

                  active_candidate_count++;
                }

              }.bind(this));

              this.files['battlegrounds_house']['data']['state_data'].push(new_data);

            }

          }.bind(this));

          this.files['battlegrounds_house']['loaded'] = true;

        }.bind(this));

      }.bind(this));

      axios.get(this.files['senate_map']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['senate_map']['data']['dems'] = response['data']['election']['module_info']['total_dem']+' Dems';
        this.files['senate_map']['data']['gop'] = 'GOP '+response['data']['election']['module_info']['total_gop'];
        this.files['senate_map']['data']['tossups'] = response['data']['election']['module_info']['total_tu'];
        
        this.files['senate_map']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['senate_map_ntu']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['senate_map_ntu']['data']['dems'] = response['data']['election']['module_info']['total_dem']+' Dems';
        this.files['senate_map_ntu']['data']['gop'] = 'GOP '+response['data']['election']['module_info']['total_gop'];
        
        this.files['senate_map_ntu']['loaded'] = true;

      }.bind(this));

      // Senate Battleground States

      axios.get(this.files['battlegrounds_senate']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        var axios_gets = response.data.race_ids_senate_2020.map(function(item) {
          return axios.get('/poll/race/'+item+'/historical_data.json?cache='+this.cache_bust);
        }.bind(this));

        axios.all(axios_gets).then(function(response) {
          
          response.forEach(function(r) {

            var new_data = {};

            var item = r['data']['rcp_avg'];
            var first_spread = 0;

            var index_of_last_change = -1;
            var stopper = 0;
            item.forEach(function (v, i) {
              
              var can1 = v['candidate'][0]['value'];
              var can2 = v['candidate'][1]['value'];
              var spread = (can1-can2);
              if(i == 0){
                first_spread = spread;
              }
              if(i > 0 && first_spread != spread & stopper == 0){
                index_of_last_change = i;
                stopper = 1;
              }

            });

            new_data['url'] = r['data']['link'];
            new_data['name'] = this.state_abbr_to_str(r['data']['state']);
            new_data['spread'] = this.spread_from_candidates(r['data']['rcp_avg'][0]['candidate']);
            new_data['spread_aff'] = this.spread_aff_from_candidates(r['data']['rcp_avg'][0]['candidate']);

            if(typeof r['data']['rcp_avg'][index_of_last_change] !== "undefined") {
              var prev_spread = this.spread_from_candidates(r['data']['rcp_avg'][index_of_last_change]['candidate']);
              var aff_prev = this.spread_aff_from_candidates(r['data']['rcp_avg'][index_of_last_change]['candidate']);
              
              new_data['spread_arrow'] = this.get_spread_arrow_from_spreads(
                new_data['spread'], 
                prev_spread,
                new_data['spread_aff'],
                aff_prev,
                r['data']['rcp_avg'][0]['date'], 
                r['data']['rcp_avg'][0]['arrow_spread']
              );

            }

            this.files['battlegrounds_senate']['data']['state_data'].push(new_data);
          }.bind(this));

          this.files['battlegrounds_senate']['loaded'] = true;

        }.bind(this));

      }.bind(this));

      // Senate Battleground State from Map

      axios.get(this.files['senate_map_bg']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        var state_data = [];

        this.files['senate_map_bg']['state_list'].forEach(function(s) {

          response.data.election.race.forEach(function(r) {

            if(r.region_key.toLowerCase() == s) {
              state_data.push({
                url: r.url,
                name: r.name,
                status: this.status_filter(r.status),
                affiliation : this.status_to_aff(r.status),
              });
            }

          }.bind(this));

        }.bind(this));

        this.files['senate_map_bg']['data']['state_data'] = state_data;
        
        this.files['senate_map_bg']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['house_map']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['house_map']['data']['dems'] = response['data']['election']['module_info']['total_dem']+' Dems';
        this.files['house_map']['data']['gop'] = 'GOP '+response['data']['election']['module_info']['total_gop'];
        this.files['house_map']['data']['tossups'] = response['data']['election']['module_info']['total_tu'];
        
        this.files['house_map']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['generic_ballot']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['generic_ballot']['data']['democrats'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][0]['candidate'], 'democrats'));
        this.files['generic_ballot']['data']['republicans'] = this.v_one_dec(this.val_from_candidates(response['data']['rcp_avg'][0]['candidate'], 'republicans'));
        this.files['generic_ballot']['data']['spread'] = this.spread_from_values(['Democrats', 'Republicans'], [this.files['generic_ballot']['data']['democrats'], this.files['generic_ballot']['data']['republicans']]);
        this.files['generic_ballot']['data']['spread_aff'] = this.spread_aff_from_values(['dem', 'gop'], [this.files['generic_ballot']['data']['democrats'], this.files['generic_ballot']['data']['republicans']]);

        this.files['generic_ballot']['loaded'] = true;

      }.bind(this));

      axios.get(this.files['summary']['data_url']+'?cache='+this.cache_bust)
      .then(function(response) {

        this.files['summary']['data']['top_bg']['2020'] = response.data['top_bg']['2020'];
        this.files['summary']['data']['top_bg']['2016'] = response.data['top_bg']['2016'];
        this.files['summary']['data']['top_bg']['spread'] = response.data['top_bg']['diff'];
        this.files['summary']['data']['nat_avg']['2020'] = response.data['nat']['2020'];
        this.files['summary']['data']['nat_avg']['2016'] = response.data['nat']['2016'];
        this.files['summary']['data']['nat_avg']['spread'] = response.data['nat']['diff'];
        this.files['summary']['data']['fav']['2020'] = response.data['fav']['2020'];
        this.files['summary']['data']['fav']['2016'] = response.data['fav']['2016'];
        this.files['summary']['data']['fav']['spread'] = response.data['fav']['diff'];

        this.files['summary']['loaded'] = true;

      }.bind(this));
    },

    status_filter : function(str) {
      return str.replace('Leaning', 'Leans');
    },

    get_spread_arrow : function( aff_arr, current_arr, prev_arr, latest_date, arrow_override ) {

      // Determine arrow for spread

      var rcp_avg_date = new Date(latest_date);
      var today_date = new Date();
      var time_diff = Math.abs(today_date.getTime() - rcp_avg_date.getTime());
      var days_diff = Math.ceil(time_diff / (1000 * 3600 * 24));

      var spread_dir = "";
      var spread_aff = "";

      // If spread arrow overridden in CMS for an RCP Avg value, do so here
      if(typeof arrow_override !== 'undefined' && arrow_override != 0) {

        if(arrow_override == 1) {
          return "";
        } else if(arrow_override == 2) {
          spread_dir = "up";
        } else if(arrow_override == 3) {
          spread_dir = "down";
        }

        var spread_current = parseFloat(this.v_one_dec(parseFloat(current_arr[0]) - parseFloat(current_arr[1])));
        if(spread_current > 0 ) {
          spread_aff = aff_arr[0];
        } else {
          spread_aff = aff_arr[1];
        }

      } else if(days_diff <= 2 ) {

        var spread_current = parseFloat(this.v_one_dec(parseFloat(current_arr[0]) - parseFloat(current_arr[1])));
        var spread_prev = parseFloat(this.v_one_dec(parseFloat(prev_arr[0]) - parseFloat(prev_arr[1])));
        
        // determine direction by looking at previous spread and candidate

        if(spread_current == spread_prev) {

          return "";

        } else if(spread_current > spread_prev ) {

          if(spread_current < 0) {
            spread_dir = "down";
            spread_aff = aff_arr[1];
          } else {
            spread_dir = "up";
            spread_aff = aff_arr[0];
          }

        } else {
          
          if(spread_current > 0) {
            spread_dir = "down";
            spread_aff = aff_arr[0];
          } else {
            spread_dir = "up";
            spread_aff = aff_arr[1];
          }
        }
      } else {
        return "";
      }

      return 'arrow_'+spread_dir+'_'+spread_aff;
    },

    get_spread_arrow_from_spreads : function (spread_cur, spread_prev, aff_cur, aff_prev, latest_date, arrow_override) {

      var rcp_avg_date = new Date(latest_date);
      var today_date = new Date();
      var time_diff = Math.abs(today_date.getTime() - rcp_avg_date.getTime());
      var days_diff = Math.ceil(time_diff / (1000 * 3600 * 24));
     
      var spread_dir = "";
      var spread_aff = "";

      if(spread_cur == spread_prev) {
        return "";
      }
      if(spread_cur == 'Tie') {
        if(aff_prev == 'dem') {
          spread_aff = "dem";
          spread_dir = "down"
        } else if(aff_prev == 'gop') {
          spread_aff = "gop";
          spread_dir = "down"
        }
      } else {

        // If spread arrow overridden in CMS for an RCP Avg value, do so here
        if(typeof arrow_override !== 'undefined' && arrow_override != 0) {
          
          if(arrow_override == 1) {
            return "";
          } else if(arrow_override == 2) {
            spread_dir = "up";
          } else if(arrow_override == 3) {
            spread_dir = "down";
          }

          spread_aff = aff_cur;

        } else if(days_diff <= 2 ) {

          var spread_cur_score = parseFloat(spread_cur.split(' +')[1]);
          var spread_prev_score = parseFloat(spread_prev.split(' +')[1]);
          if(spread_cur_score == spread_prev_score) {

            return "";

          } else if(aff_cur != aff_prev) {

            spread_dir = "up";
            spread_aff = aff_cur;

          } else if(spread_cur_score > spread_prev_score ) {

            if(spread_cur_score < 0) {
              spread_dir = "down";
              spread_aff = aff_prev;
            } else {
              spread_dir = "up";
              spread_aff = aff_cur;
            }

          } else {
            
            if(spread_cur_score > 0) {
              spread_dir = "down";
              spread_aff = aff_cur;
            } else {
              spread_dir = "up";
              spread_aff = aff_prev;
            }
          }

        } else {
          return "";
        }
      }
      return 'arrow_'+spread_dir+'_'+spread_aff;
    },

    status_to_aff : function(status) {

      if(status.toLowerCase().includes('gop')) {
        return 'gop';
      } else if(status.toLowerCase().includes('dem')) {
        return 'dem';
      } else {
        return 'tie';
      }
    },

    val_from_candidates : function(candidates, c_name) {

      var c_val = 0;

      candidates.forEach(function(c) {

        if(c['name'].toLowerCase() == c_name) {
          c_val = c['value'];
        }

      }.bind(this));

      return c_val;
    },

    spread_from_values : function( c_arr, v_arr, no_dec ) {

      if(typeof no_dec === 'undefined') {
        no_dec = false;
      }

      var v1 = parseFloat(v_arr[0]);
      var v2 = parseFloat(v_arr[1]);
      var spread_val = v1 - v2;
      var spread_val_str = spread_val;
      if(!no_dec) {
        spread_val_str = this.v_one_dec(Math.abs(spread_val));
      }

      if(spread_val > 0) {
        return c_arr[0]+' +'+spread_val_str;
      } else if(spread_val < 0) {
        return c_arr[1]+' +'+spread_val_str;
      } else {
        return 'Tie';
      }
    },

    spread_from_candidates : function( c_arr ) {
      var first_c_index = 0;
      var second_c_index = 0;
      var first_c_score = 0;
      var second_c_score = 0;
      c_arr.forEach(function(c, i) {
        var v = parseFloat(c.value);
        if(v >= first_c_score) {
          second_c_score = first_c_score;
          first_c_score = v;
          second_c_index = first_c_index;
          first_c_index = i;
        } else if(v >= second_c_score) {
          second_c_score = v;
          second_c_index = i;
        }
      }.bind(this));

      if(first_c_score > second_c_score) {
        var spread_val = first_c_score - second_c_score;
        return c_arr[first_c_index].name+' ('+c_arr[first_c_index].affiliation.charAt(0)+') +'+this.v_one_dec(spread_val);
      } else {
        return 'Toss Up';
      }
    },

    spread_aff_from_candidates : function( c_arr ) {

      var first_c_index = 0;
      var second_c_index = 0;
      var first_c_score = 0;
      var second_c_score = 0;
      c_arr.forEach(function(c, i) {
        var v = parseFloat(c.value);
        if(v >= first_c_score) {
          second_c_score = first_c_score;
          first_c_score = v;
          second_c_index = first_c_index;
          first_c_index = i;
        } else if(v >= second_c_score) {
          second_c_score = v;
          second_c_index = i;
        }
      }.bind(this));

      if(first_c_score > second_c_score) {
        return this.aff_from_party(c_arr[first_c_index].affiliation);
      } else {
        return '';
      }
    },

    aff_from_party : function( party ) {

      if(party.toLowerCase() == 'republican') {
        return 'gop';
      } else if(party.toLowerCase() == 'democrat') {
        return 'dem';
      } else {
        return 'tie';
      }
    },

    spread_aff_from_values : function( aff_arr, v_arr ) {

      var v1 = parseFloat(v_arr[0]);
      var v2 = parseFloat(v_arr[1]);

      if(v1 > v2) {
        return aff_arr[0];
      } else if(v1 > v2) {
        return aff_arr[1];
      } else {
        return '';
      }
    },

    spread_str_from_val : function(c_arr, s_val) {

      if(parseFloat(s_val) > 0) {
        return c_arr[0]+' +'+this.v_one_dec(s_val);
      } else if(parseFloat(s_val) < 0) {
        return c_arr[1]+' +'+this.v_one_dec(Math.abs(s_val));
      } else {
        return 'Tie';
      }
    },

    spread_aff_from_spread_val : function( aff_arr, s_val ) {

      if(parseFloat(s_val) > 0) {
        return aff_arr[0];
      } else if(parseFloat(s_val) < 0) {
        return aff_arr[1];
      } else {
        return '';
      }
    },

    v_one_dec: function (value) {
        var the_value = parseFloat(value);
        return the_value.toFixed(1);
    },

    state_abbr_to_str : function(abbr) {

      abbr = abbr.toUpperCase();
      var states = {
        'AL' : 'Alabama',
        'AK' : 'Alaska',
        'AZ' : 'Arizona',
        'AR' : 'Arkansas',
        'CA' : 'California',
        'CO' : 'Colorado',
        'CT' : 'Connecticut',
        'DC' : 'District of Columbia',
        'DE' : 'Delaware',
        'FL' : 'Florida',
        'GA' : 'Georgia',
        'HI' : 'Hawaii',
        'ID' : 'Idaho',
        'IL' : 'Illinois',
        'IN' : 'Indiana',
        'IA' : 'Iowa',
        'KS' : 'Kansas',
        'KY' : 'Kentucky',
        'LA' : 'Louisiana',
        'ME' : 'Maine',
        'MECD2' : 'Maine CD2',
        'MD' : 'Maryland',
        'MA' : 'Massachusetts',
        'MI' : 'Michigan',
        'MN' : 'Minnesota',
        'MS' : 'Mississippi',
        'MO' : 'Missouri',
        'MT' : 'Montana',
        'NE' : 'Nebraska',
        'NV' : 'Nevada',
        'NH' : 'New Hampshire',
        'NJ' : 'New Jersey',
        'NM' : 'New Mexico',
        'NY' : 'New York',
        'NC' : 'North Carolina',
        'ND' : 'North Dakota',
        'OH' : 'Ohio',
        'OK' : 'Oklahoma',
        'OR' : 'Oregon',
        'PA' : 'Pennsylvania',
        'RI' : 'Rhode Island',
        'SC' : 'South Carolina',
        'SD' : 'South Dakota',
        'TN' : 'Tennessee',
        'TX' : 'Texas',
        'US' : 'National',
        'UT' : 'Utah',
        'VT' : 'Vermont',
        'VA' : 'Virginia',
        'WA' : 'Washington',
        'WV' : 'West Virginia',
        'WI' : 'Wisconsin',
        'WY' : 'Wyoming',
      };

      if(typeof states[abbr] !== 'undefined') {
        return states[abbr];
      } else {
        return '';
      }

    },

  },

});

if(!$().isMobile()){
  if(document.querySelector('.alpha #hp_election_widget') != null) {
    document.querySelector('.alpha #hp_election_widget').style.display="none";
  }
} 

//enables ability to have multipe widgets running at once
Array.prototype.slice.call(document.querySelectorAll('#hp_election_widget')).filter(
  function (item,index) { 
    if(item.style.display!="none"){
        // Start App          
          new Vue({
            el: item,
            template: '<election-widget></election-widget>',
          });          
    }
  } 
);

/*
// Start App
if( document.querySelector('#hp_election_widget') !== null ) {
  new Vue({
    el: '#hp_election_widget',
    template: '<election-widget></election-widget>',
  });
} */