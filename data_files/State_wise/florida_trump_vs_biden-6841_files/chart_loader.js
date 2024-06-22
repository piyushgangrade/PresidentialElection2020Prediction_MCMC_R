//////////////////////
// RCP Chart Loader //
//////////////////////

/*

Summary: Loads one or more charts on a page

Dependencies:
vue.min.js (or vue.js for dev mode) 2.5.13 (standalone version)
races_d3_for_loader.js (for creating chart)

Browser Requirements:
IE11 or modern browser

*/



// IE forEach polyfil
if(window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}
if(window.HTMLCollection && !HTMLCollection.prototype.forEach) {
  HTMLCollection.prototype.forEach = Array.prototype.forEach;
}
// IE 'includes' polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    } 
    if (start === undefined) { start = 0; }
    return this.indexOf(search, start) !== -1;
  };
}
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, "includes", {
    enumerable: false,
    value: function(obj) {
        var newArr = this.filter(function(el) {
          return el == obj;
        });
        return newArr.length > 0;
      }
  });
}

Vue.component('rc-chart', {

  props: {
    url: {
      type: String,
      default: "/epolls/json/6247_historical.js",
    },
    title: {
      type: String,
      default: "",
    },
    title_phone: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "General Election: X vs. X",
    },
    spread_chart_key_link: {
      type: String,
      default: "",
    },
    chart_aff: {
      type: Boolean,
      default: false,
    },
    chart_aff_desktop_only: {
      type: Boolean,
      default: false,
    },
    spread: {
      type: Boolean,
      default: false,
    },
    spread_only: {
      type: Boolean,
      default: false,
    },
    y_ticks: {
      type: Number,
      default: 0,
    },
    chart_key: {
      type: Boolean,
      default: false,
    },
    spread_chart_key: {
      type: Boolean,
      default: false,
    },
    prevent_flip: {
      type: Boolean,
      default: false,
    },
    flip_chart_titles_not_phone: {
      type: Boolean,
      default: false,
    },
    spread_chart_key_title: {
      type: String,
      default: "",
    },
    chart_height: {
      type: Number,
      default: 440,
    },
    chart_height_mobile: {
      type: Number,
      default: 370,
    },
    zooms_desktop: {
      type: Array,
      default: function() { return ["14D","30D","3M","6M","1Y","2Y","MAX"] },
    },
    zooms_mobile: {
      type: Array,
      default: function() { return ["14D","30D","3M","6M","1Y","MAX"] },
    },
    y_axis: {
      type: Array,
      default: function() { return [] },
    },
    default_zoom_desktop: {
      type: String,
      default: "3M",
    },
    default_zoom_mobile: {
      type: String,
      default: "30D",
    },
    days_until: {
      type: String,
      default: "",
    },
    start_date: {
      type: String,
      default: "",
    },
  },

  template: '\
    <div>\
\
      <div class="chart_wrapper" :class="{\'spread_only\' : spread_only}"> \
\
        <div class="chart_header"> \
\
          <div class="chart_branding small_legend"> \
\
            <div class="logo"><img src="http://www.realclearpolitics.com/asset/img/logo/logo-sub.gif" alt="RealClearPolitics"></div> \
\
            <div v-if="flip_chart_titles_not_phone" class="subtitle" :class="{\'not_phone\': flip_chart_titles_not_phone, \'flipped_on_phone\' : flip_chart_titles_not_phone}" v-html="subtitle"></div> \
            <div class="title" :class="{\'flipped_on_phone\' : flip_chart_titles_not_phone, \'phone_only\': title_phone.length > 0}" v-html="title"></div> \
            <div v-if="title_phone.length > 0" class="title" :class="{\'flipped_on_phone\' : flip_chart_titles_not_phone, \'not_phone\': title_phone.length > 0}" v-html="title_phone"></div> \
            <div class="subtitle" :class="{\'phone_only\': flip_chart_titles_not_phone}" v-html="subtitle"></div> \
\
          </div> \
\
          <table v-if="chart_key" class="chart_legend small_legend" data-p-type="0">\
            <tbody></tbody>\
          </table>\
\
          <table v-else-if="spread_chart_key" data-p-type="0" class="chart_legend small_legend">\
            <tbody>\
              <tr>\
                <td class="candidate">\
                  <div v-if="spread_chart_key_title.length > 0" class="value" style="color: black; font-weight: bold;" v-html="spread_chart_key_title"></div>\
                  <div v-else class="value date" style="color: black; font-weight: bold;" ></div>\
                  <span class="score_line"> \
                    <a v-if="spread_chart_key_link.length > 0" :href="spread_chart_key_link" class="text"></a> \
                    <span v-else class="text"></span> \
                  </span> \
                </td>\
              </tr>\
            </tbody>\
          </table>\
\
        </div> \
        <div class="chart_container"> \
          <div \
            id="chartdiv" \
            class="chartdiv"\
            :class="\'chartdiv_\'+unique_chart_id" \
            :data-unique-id="unique_chart_id" \
            :data-spread="spread" \
            :data-chart-key="chart_key"\
            :data-spread-chart-key="spread_chart_key"\
            :data-spread-only="spread_only" \
            :data-y-ticks="y_ticks" \
            :data-prevent-flip="prevent_flip" \
            :data-url="url" \
            :style="\'height:\'+chart_height+\'px;\'" \
            :data-chart-height="chart_height" \
            :data-chart-height-mobile="chart_height_mobile" \
            :data-selected="default_zoom_desktop.toLowerCase()" \
            :data-selected-mobile="default_zoom_mobile.toLowerCase()" \
            :data-y-axis="y_axis"\
            :data-chart-aff="chart_aff"\
            :data-chart-aff-desktop-only="chart_aff_desktop_only"\
            :data-days-until="days_until"\
            :data-start-date="start_date"\
            data-names="1"\
          > \
            <div class="candidate_tooltip" data-cnum="0">--</div> \
            <div class="candidate_tooltip" data-cnum="1">--</div> \
            <div class="candidate_tooltip" data-cnum="2">--</div> \
            <div class="candidate_tooltip" data-cnum="3">--</div> \
            <div class="candidate_tooltip" data-cnum="4">--</div> \
            <div class="candidate_tooltip" data-cnum="5">--</div> \
            <div class="candidate_tooltip" data-cnum="6">--</div> \
            <div class="candidate_tooltip" data-cnum="7">--</div> \
            <div class="candidate_tooltip" data-cnum="8">--</div> \
            <div class="candidate_tooltip" data-cnum="9">--</div> \
            <div class="candidate_tooltip" data-cnum="10">--</div> \
            <div class="candidate_tooltip" data-cnum="11">--</div> \
            <div class="candidate_tooltip" data-cnum="12">--</div> \
            <div class="candidate_tooltip" data-cnum="13">--</div> \
            <div class="candidate_tooltip" data-cnum="14">--</div> \
            <div class="candidate_tooltip" data-cnum="15">--</div> \
            <div class="candidate_tooltip" data-cnum="16">--</div> \
            <div class="candidate_tooltip" data-cnum="17">--</div> \
            <div class="candidate_tooltip" data-cnum="18">--</div> \
            <div class="candidate_tooltip" data-cnum="19">--</div> \
            <div class="candidate_tooltip" data-cnum="20">--</div> \
            <div class="candidate_tooltip" data-cnum="21">--</div> \
            <div class="candidate_tooltip" data-cnum="22">--</div> \
            <div class="candidate_tooltip" data-cnum="23">--</div> \
            <div class="date_tooltip">--</div> \
            <div class="spread_tooltip">--</div> \
          </div> \
        </div> \
\
        <div id="charttools"> \
          <div class="from">From: <input id="from_date" class="from_date chart_datepicker"></div> \
          <div class="to">to: <input id="to_date" class="to_date chart_datepicker"></div> \
          <input id="chart_apply" class="race_charts_button chart_apply" value="Apply" type="button"> \
          <div class="zoom">\
            <input \
              v-for="zoom in zooms" \
              :id="\'chart_\'+zoom.toLowerCase()"\
              class="race_charts_button rcb_none"\
              :class="[{\'rcb_normal\' : zooms_desktop.includes(zoom)}, {\'rcb_mobile\' : zooms_mobile.includes(zoom)}, \'chart_\'+zoom.toLowerCase() ]"\
              :value="zoom"\
              type="button"\
            >\
            <input id="chart_reset" class="chart_reset race_charts_button" value="Reset" type="button">\
          </div>\
        </div> \
\
        <table class="embed" cellpadding="0" cellspacing="0" border="0">\
          <tr> \
            <td><a href="http://www.realclearpolitics.com"><img src="/asset/img/logo/realclearpolitics_logo_word_only_124.png" /></a></td> \
            <td align="right"><img src="/images/blank.png" /></td>\
          </tr>\
        </table>\
      </div> \
      <div class="clear"></div> \
    </div>\
  </div> \
  ', 

  data : function() {
    return {
      zooms : ["7D","14D","30D","3M","6M","1Y","2Y","MAX"],
      unique_chart_id : this.getRandomInt(100000000000,999999999999),
    }
  },

  mounted : function() {

    //this.get_odds_data();
    init_settings_and_populate_chart(this.unique_chart_id);
  },

  methods : {

    getRandomInt : function(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    },

  }
});

// Load app

if(document.querySelector('rc-chart')) {
  document.querySelectorAll('rc-chart').forEach(function(elem) {
    new Vue({
      el: elem
    });
  });
}