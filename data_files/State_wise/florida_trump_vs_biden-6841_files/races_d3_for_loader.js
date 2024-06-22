
var HOUR = 60 * 60 * 1000;
var DAY = HOUR * 24;
var YEAR = DAY * 365;

var ZOOM_DURATION = 500;
var TOOLTIP_HEIGHT = 29;

var final_date = "";

var timestamp = new Date();

var resize_ok = false;

var orig_width = 584; // with right col

var race_chart_preview = 0;

var charts_info = {}; // Holds all d3 objects for chart

function init_settings_and_populate_chart(unique_id) {

  var chart_selector = '.chartdiv_'+unique_id;
  var url = $(chart_selector).attr('data-url');

  orig_width = 584; // with right col
  if( $('#container .layout_1').length > 0) {
    orig_width = 784; // no right col
  }

  generateChartData(url, chart_selector);
}

function candidate_to_aff_letter(c) {
  switch (c.name.toLowerCase()) {
    case 'clinton':
    case 'biden':
      return 'D'
      break;
    case 'trump':
      return 'R';
      break;
    default:
  }

  if(c.affiliation != '') {
    return c.affiliation.slice(0,1);
  }

  return '';
}

function color_lookup(c_color, c_name, c_aff)
{
  if(c_color==""){
    var myColor="";
    if(c_aff == "")
    {
      switch (c_name.toLowerCase()) {
        case "disapprove":
            myColor="#FF0000";
            break;
        case "approve":
            myColor="#000000";
            break;
        case "trump":
            myColor="#D30015";
            break;
        case "biden":
        case "clinton":
            myColor="#3B5998";
            break;
        default:
          myColor="#000000";
      }
    }
    else
    {
      switch (c_aff.toLowerCase()) {
        case "republican":
            myColor="#D30015";
            break;
        case "democrat":
            myColor="#3B5998";
            break;
        default:
          myColor="#000000";
      }
    }

    return myColor;
  }
  else {
    return c_color;
  }
}

function generateChartData(chart_data_url, chart_selector)
{

  var preview_suffix = '';
  if(typeof race_chart_preview != 'undefined' && race_chart_preview == 1) {
    preview_suffix = '_preview';
  }
  var my_url = chart_data_url+'?'+timestamp.getTime()+'';

  $.ajax({
    url: my_url,
    dataType: 'json',
    cache: 'false',
    success: function(json) {

      charts_info[chart_selector] = {};
      charts_info[chart_selector].charts = [];
      charts_info[chart_selector].candidate_name = [];
      charts_info[chart_selector].candidate_color = [];
      charts_info[chart_selector].old_width = 0;
      charts_info[chart_selector].spread_candidates_flipped = false;

      charts_info[chart_selector].y_axis = [];

      if( $(chart_selector).attr('data-y-axis') ) {
        var y_axis_str = $(chart_selector).attr('data-y-axis');
        y_axis_str = y_axis_str.replace(/\s/g, "");
        charts_info[chart_selector].y_axis = y_axis_str.split(',');
      }

      charts_info[chart_selector].spread_only = false;
      charts_info[chart_selector].prevent_flip = false;

      if( $(chart_selector).attr('data-spread-only') ) {
        charts_info[chart_selector].spread_only = $(chart_selector).attr('data-spread-only');
      }

      if( $(chart_selector).attr('data-prevent-flip') ) {
        charts_info[chart_selector].prevent_flip = $(chart_selector).attr('data-prevent-flip');
      }

      charts_info[chart_selector].custom_y_t_ticks = false;

      if( $(chart_selector).attr('data-y-ticks') > 0 ) {
        charts_info[chart_selector].custom_y_t_ticks = $(chart_selector).attr('data-y-ticks');
      }

      var spread = $(chart_selector).attr('data-spread');

      charts_info[chart_selector].spread_chart = 0;
      if(spread) {
        charts_info[chart_selector].spread_chart = 1;
      }

      charts_info[chart_selector].chart_height_override = parseInt($(chart_selector).attr('data-chart-height'));
      charts_info[chart_selector].LINE_CHART_HEIGHT = parseInt($(chart_selector).attr('data-chart-height'));
      charts_info[chart_selector].spread_chart_height = 60;

      if( charts_info[chart_selector].spread_only ) {
        charts_info[chart_selector].spread_chart_height = charts_info[chart_selector].chart_height_override - 40;
      }

      var chart_data=[];
      var date_a='';
      var date_b='';

      $(chart_selector).parent().attr('style', 'background:#fff !important;');
      var hist_data_points = json.rcp_avg;
      hist_data_points = hist_data_points.reverse();

      // If "underestimated" span exists anywhere, assume "underestimated" value exists, and to display it
      var unique_id = $(chart_selector).attr('data-unique-id');
      var und = $(".chartdiv_"+unique_id).parent().parent().find(".underestimated");
      if(und.length > 0 
        && typeof hist_data_points[hist_data_points.length - 1]['underestimated'] !== 'undefined'
        ) {

        var und_val = hist_data_points[hist_data_points.length - 1]['underestimated'];

        var und_str = "Dem";

        if(und_val < 0) {
          und_str = "GOP";
        }

        if(und_val == 0) {
          und_str = "Tie";
        } else {
          und_str += " by "+Math.abs(und_val).toFixed(1);
        }

        for(var i = 0; i < und.length; i++) {
          und[i].innerHTML = und_str;
        }
      }

      if( charts_info[chart_selector].spread_only ) {
        
        charts_info[chart_selector].candidate_color[0] = "#3B5998";
        charts_info[chart_selector].candidate_color[1] = "#D30015";
        charts_info[chart_selector].candidate_name[0] = json.candidates[0];
        charts_info[chart_selector].candidate_name[1] = json.candidates[1];

        // If second candidate ahead, switch to showing them on positive y-axis
        if( !charts_info[chart_selector].prevent_flip && parseFloat(hist_data_points[hist_data_points.length - 1]['spread']) < 0) {
          charts_info[chart_selector].spread_candidates_flipped = true;
          charts_info[chart_selector].candidate_color[0] = "#D30015";
          charts_info[chart_selector].candidate_color[1] = "#3B5998";
          charts_info[chart_selector].candidate_name[0] = json.candidates[1];
          charts_info[chart_selector].candidate_name[1] = json.candidates[0];
        }
      }

      $.each(hist_data_points,function(i,a){

        if( charts_info[chart_selector].spread_only || ( typeof a.after_last_entered_avg === 'undefined' || a.after_last_entered_avg == false ) ) {

          var date_a=new Date(a.date);
          date_b=new Date(date_a.getFullYear(), date_a.getMonth(), date_a.getDate(), 0, 0, 0, 0)

          if( $(chart_selector).attr('data-start-date') ) {
            var start_date = new Date($(chart_selector).attr('data-start-date'));
            if( start_date.getTime() > date_b.getTime() ) { return; } // equivalent of "continue"
          }

          if(i==0){
            first_date=date_b;
          }
          
          var temp_chart_data=[];

          if( charts_info[chart_selector].spread_only ) {

            if(final_date * 1000 > date_b.getTime() || final_date == '')
              {
                var spread_val = a.spread;
                if(charts_info[chart_selector].spread_candidates_flipped) {
                  spread_val = spread_val * -1;
                }

                chart_data.push({
                  date: date_b,
                  value: 0,
                  spread: spread_val,
                });
                last_date = date_b;
              }

          } else {

            $.each(a.candidate,function(j,b){

              if( b.status != null && (b.status == '2' || b.status == '0') ) {
                return true; // like a 'continue' for $.each
              }
              if(!$.isArray(chart_data[j])){
                chart_data[j]=[]
              }
              charts_info[chart_selector].candidate_name[j] = b.name;
              if(charts_info[chart_selector].candidate_name[j] == '') {
                charts_info[chart_selector].candidate_name[j] = b.affiliation;
              }
              var filtered_value = null;

              if( $.isNumeric(b.value) ) {
                filtered_value = parseFloat(b.value);
              } else {
                
              }
              charts_info[chart_selector].candidate_color[j]=color_lookup(b.color, b.name, b.affiliation)
              temp_chart_data.push({date: date_b,value: filtered_value});
            });

            // This wasn't working if candidate 1 or 2 was empty (uncommon)
            // Now it goes through and finds the top two candidates, no matter their placement
            var top_vals = [];

            $.each(temp_chart_data,function(k,c){
              if($.isNumeric(c.value)) {
                top_vals.push(c.value);
              }
            });

            top_vals.push(0);
            top_vals.push(0);

            var spread = top_vals[0] - top_vals[1];

            $.each(temp_chart_data,function(k,c){
              if(final_date * 1000 > c.date.getTime() || final_date == '')
              {
                chart_data[k].push({
                  date: c.date,
                  value: c.value,
                  spread: spread
                });
                last_date = c.date;
              }
            });
          }

        }

      });

      // Show chart key if needed
      if( $(chart_selector).attr('data-chart-key') ) {

        var last_key = hist_data_points.length - 1;

        var key_html = '';

        hist_data_points[last_key]['candidate'].forEach(function(c, i) {

          var c_value = c.value;
          if(typeof c_value === 'string') {
            c_value = parseFloat(c_value);
          }

          key_html += '<tr><td class="candidate">';
          key_html += '<div class="value"><span style="background: '+color_lookup(c.color, c.name, c.affiliation)+';">'+c_value.toFixed(1)+'</span></div>';
          key_html += '<div class="desc">'+c.name;

          if($(chart_selector).attr('data-chart-aff')) {
            var chart_aff_class="";
            if($(chart_selector).attr('data-chart-aff-desktop-only')) {
              chart_aff_class="desktop_only";
            }
            key_html += ' <span class="aff '+chart_aff_class+'">('+candidate_to_aff_letter(c)+')</span>';
          }

          if(i == 0) {

            // Calculate spread if not provided
            var key_spread = 0;
            if(typeof hist_data_points[last_key].spread === 'undefined') {
              key_spread = parseFloat(hist_data_points[last_key].candidate[0]['value']) - parseFloat(hist_data_points[last_key].candidate[1]['value']);
              key_spread = key_spread.toFixed(1);
            } else {
              key_spread = hist_data_points[last_key].spread.toFixed(1);
            }

            key_html += '<span style="color: '+color_lookup(c.color, c.name, c.affiliation)+';">+'+key_spread+'</span>';
          }
          key_html += '</div>';
          key_html += '</td></tr>';
        });


        $(chart_selector).parent().parent().find('.chart_legend tbody').html(key_html);
      }

      // Show chart key for spread chart if needed

      if( $(chart_selector).attr('data-spread-chart-key') && charts_info[chart_selector].spread_only ) {

        var last_key = hist_data_points.length - 1;

        var key_html = 'Tie';
        var key_color = '#666666';
        var key_aff;

        var spread = parseFloat(hist_data_points[last_key]['spread']);

        if(spread > 0) {
          key_aff = '(D)';
          key_color = charts_info[chart_selector].candidate_color[0];
          key_html = charts_info[chart_selector].candidate_name[0] + ' '+key_aff+' <span class="score" style="color:'+key_color+';">+'+spread.toFixed(1)+'</span>';
        } else {
          key_aff = '(R)';
          key_color = charts_info[chart_selector].candidate_color[1];
          key_html = charts_info[chart_selector].candidate_name[1] + ' '+key_aff+' <span class="score" style="color:'+key_color+';">+'+Math.abs(spread).toFixed(1)+'</span>';
        }

        if(charts_info[chart_selector].spread_candidates_flipped) {
          if(spread > 0) {
            key_color = charts_info[chart_selector].candidate_color[1];
            key_html = charts_info[chart_selector].candidate_name[1] + ' '+key_aff+' <span class="score" style="color:'+key_color+';">+'+spread.toFixed(1)+'</span>';
          } else {
            key_color = charts_info[chart_selector].candidate_color[0];
            key_html = charts_info[chart_selector].candidate_name[0] + ' '+key_aff+' <span class="score" style="color:'+key_color+';">+'+Math.abs(spread).toFixed(1)+'</span>';
          }
        }

        $(chart_selector).parent().parent().find('.chart_legend .candidate .score_line .text').html(key_html);

        var d = new Date(hist_data_points[last_key]['date']);
        var date_str = '';

        if( $(chart_selector).attr('data-days-until') ) {

          var election_d = new Date($(chart_selector).attr('data-days-until'));
          var days_diff = Math.round((election_d - d)/(1000*60*60*24));
          date_str = days_diff + " Days To Election";

        } else {

          date_str = d.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }

        $(chart_selector).parent().parent().find('.chart_legend .candidate .value.date').html(date_str);
        //$(chart_selector).parent().parent().find('.chart_legend .candidate .color_bar').attr('style', 'background: '+key_color+';');
        //$(chart_selector).parent().parent().find('.chart_legend .candidate .color_bar').html(key_aff);
      }

      var du = $(".chartdiv_"+unique_id).parent().parent().find(".days_until");

      if(du.length > 0 && $(chart_selector).attr('data-days-until')) {

        var last_key = hist_data_points.length - 1;
        var d = new Date(hist_data_points[last_key]['date']);
        var election_d = new Date($(chart_selector).attr('data-days-until'));
        var days_diff = Math.round((election_d - d)/(1000*60*60*24));

        for(var i = 0; i < du.length; i++) {
          du[i].innerHTML = days_diff;
        }
      }

      // Convert into data D3 can use

      if( charts_info[chart_selector].spread_only ) {

        charts_info[chart_selector].charts.push(chart_data);

      } else {

        for(var i = 0; i < chart_data.length; i++)
        {
          var temp_arr = [];
          for(var j = 0; j < chart_data[i].length; j++)
          {
            temp_arr.push({
              'date': chart_data[i][j].date,
              'value': chart_data[i][j].value,
              'spread': chart_data[i][j].spread
            });
          }
          charts_info[chart_selector].charts.push(temp_arr);
        }
      }

      if(final_date == '') {
        final_date=last_date;
      }
      if(typeof last_date !== 'undefined') {
        generate_chart(chart_selector);
        resize_chart();
      }
    }
  });
}

function closest_in_ordered_array(num, arr)
{
  var data = [];
  var curr = arr[0];
  var index = 0;
  var diff = Math.abs (num - curr);
  for (var val = 0; val < arr.length; val++) {
    var newdiff = Math.abs (num - arr[val]);
    if (newdiff < diff) {
      diff = newdiff;
      curr = arr[val];
      index = val;
    }
  }
  data['x'] = curr;
  data['index'] = index;
  return data;
}

var chart_width;
var chart_height;

var extra_offset = 15;

var min_array = [];
var max_array = [];

var make_x_axis;
var make_y_axis;
var make_y_axis_t;

var y;

var x_ticks = 5;

margin = {
  top: 5,
  right: 5,
  bottom: 30,
  left: 38
};

function generate_chart(chart_selector)
{

  charts_info[chart_selector].paths = [];
  charts_info[chart_selector].lines = [];
  charts_info[chart_selector].combined_chart = [];
  charts_info[chart_selector].y_t_ticks = 4;
  if( charts_info[chart_selector].spread_only ) {
    charts_info[chart_selector].y_t_ticks = 8;
  }
  if( charts_info[chart_selector].custom_y_t_ticks ) {
    charts_info[chart_selector].y_t_ticks = charts_info[chart_selector].custom_y_t_ticks;
  }

  resize_ok = false;

  margin = {
    top: 5,
    right: 5,
    bottom: 30,
    left: 38
  };

  orig_height = 400;
  if(typeof charts_info[chart_selector].chart_height_override !== "undefined") {
    orig_height = charts_info[chart_selector].chart_height_override + 40;
  }

  chart_width = orig_width - margin.left - margin.right;
  chart_height = orig_height - margin.top - margin.bottom;
  charts_info[chart_selector].chart_height = (charts_info[chart_selector].chart_height_override + 40) - margin.top - margin.bottom;
  // Set initial date points

  var date_max = d3.max(charts_info[chart_selector].charts[0], function (d) {
      return d.date;
    });
  var date_min = d3.min(charts_info[chart_selector].charts[0], function (d) {
      return d.date;
    });

  if( charts_info[chart_selector].spread_only ) {
    charts_info[chart_selector].combined_chart = charts_info[chart_selector].charts[0];
  } else {

    for(var i = 0; i < charts_info[chart_selector].charts[0].length; i++)
    {
      var temp_obj = {};
      temp_obj.values = [];
      temp_obj.spread = charts_info[chart_selector].charts[0][i].spread.toFixed(1);
      temp_obj.date = new Date(charts_info[chart_selector].charts[0][i].date);
      for(var j = 0; j < charts_info[chart_selector].charts.length; j++) {
        if(typeof charts_info[chart_selector].charts[j][i] !== 'undefined' && charts_info[chart_selector].charts[j][i].value !== null) {
          temp_obj.values.push(charts_info[chart_selector].charts[j][i].value.toFixed(1));
        } else {
          temp_obj.values.push(null);
        }
      }
      charts_info[chart_selector].combined_chart.push(temp_obj);
    }
  }

  // Start D3

  charts_info[chart_selector].x_domain = d3.time.scale()
    .domain(d3.extent(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    }))
    .range([0, chart_width - 20]);

  if( !charts_info[chart_selector].spread_only ) {

    for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
    {
      min_array.push(d3.min(charts_info[chart_selector].charts[i], function (d) {
        return d.value;
      }));
      max_array.push(d3.max(charts_info[chart_selector].charts[i], function (d) {
        return d.value;
      }));
    }
  }

  var t_min = d3.min(charts_info[chart_selector].charts[0], function (d) {
      return d.spread;
    });
  var t_max = d3.max(charts_info[chart_selector].charts[0], function (d) {
      return d.spread;
    });

  /*if(charts_info[chart_selector].y_axis.length == 2) {
    t_max = parseInt(charts_info[chart_selector].y_axis[0]);
    t_min = parseInt(charts_info[chart_selector].y_axis[1]);
  }*/

  if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart != 1) {
    charts_info[chart_selector].spread_chart_height = 0;
  }

  if( !charts_info[chart_selector].spread_only ) {

    charts_info[chart_selector].y = d3.scale.linear()
      .domain([Math.min.apply(Math,min_array), Math.max.apply(Math,max_array)])
      //.domain([Math.min(min_array[0], min_array[1]), Math.max(max_array[0], max_array[1])])
      .range([charts_info[chart_selector].chart_height-30-charts_info[chart_selector].spread_chart_height, 10]);
  }

  charts_info[chart_selector].y_t = d3.scale.linear()
    .domain([t_min, t_max])
    .range([charts_info[chart_selector].LINE_CHART_HEIGHT + charts_info[chart_selector].spread_chart_height, charts_info[chart_selector].LINE_CHART_HEIGHT]);

  charts_info[chart_selector].x_data = [];

  reset_x_data(chart_selector);

  charts_info[chart_selector].brush_race_chart = d3.svg.brush();

  if( typeof width_init == 'undefined' || width_init >= 768 ) {
    charts_info[chart_selector].brush_race_chart
      .x(charts_info[chart_selector].x_domain)
      .on("brush", brushmove.bind(chart_selector))
      .on("brushend", brushend.bind(chart_selector));
  }

  if( !charts_info[chart_selector].spread_only ) {

    for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
    {
      charts_info[chart_selector].lines.push( d3.svg.line()
        .defined(function(d) { return d.values[$(this).attr('data-cnum')] != null; })
        .x(function (d) {
          return charts_info[chart_selector].x_domain(d.date);
        })
        .y(function (d) {
          return charts_info[chart_selector].y(d.values[$(this).attr('data-cnum')]);
        })
      );
    }
  }

  charts_info[chart_selector].area_t = d3.svg.area()
    .x(function (d) {
      return charts_info[chart_selector].x_domain(d.date);
    })
    .y1(function (d) {
      return charts_info[chart_selector].y_t(d.spread);
    });

  if(t_min > 0) {
    charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(t_min - 1));
  } else if(t_max < 0) {
    charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(t_max + 1));
  } else {
    charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(0));
  }

  charts_info[chart_selector].line_t = d3.svg.line()
    .x(function (d) {
      return charts_info[chart_selector].x_domain(d.date);
    })
    .y(function (d) {
      return charts_info[chart_selector].y_t(d.spread);
    });

  charts_info[chart_selector].svg = d3.select(chart_selector)
    .append("svg:svg")
    .attr('width', orig_width)
    .attr('height', orig_height)
    /*.attr('viewBox', '0 0 ' + orig_width + ' ' + orig_height)
    .attr('preserveAspectRatio', 'xMidYMid')*/
    .append("svg:g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.behavior.zoom().scale(0.9));

  charts_info[chart_selector].svg.append("svg:rect")
    .attr("width", chart_width)
    .attr("height", orig_height)
    .attr("class", "plot");

  make_x_axis = function () {
    return d3.svg.axis()
      .scale(charts_info[chart_selector].x_domain)
      .orient("bottom")
      .ticks(x_ticks);
  };

  if( !charts_info[chart_selector].spread_only ) {
    make_y_axis = function () {
      return d3.svg.axis()
        .scale(charts_info[chart_selector].y)
        .orient("left")
        .ticks(8);
    };
  }

  make_y_axis_t = function () {
    return d3.svg.axis()
      .scale(charts_info[chart_selector].y_t)
      .orient("left")
      .ticks(charts_info[chart_selector].y_t_ticks);
  };

  charts_info[chart_selector].xAxis = d3.svg.axis()
    .scale(charts_info[chart_selector].x_domain)
    .orient("bottom")
    .ticks(5);

  if( !charts_info[chart_selector].spread_only ) {

    charts_info[chart_selector].yAxis = d3.svg.axis()
      .scale(charts_info[chart_selector].y)
      .orient("left")
      .ticks(8);
  }

  charts_info[chart_selector].yAxis_t = d3.svg.axis()
    .scale(charts_info[chart_selector].y_t)
    .orient("left")
    .ticks(charts_info[chart_selector].y_t_ticks);

  charts_info[chart_selector].svg.append("g")
    .attr("class", "x axis")
    .attr("clip-path", "url(#clip_"+chart_selector+")")
    .attr("transform", "translate(0," + charts_info[chart_selector].chart_height + ")")
    .call(charts_info[chart_selector].xAxis);

  if( !charts_info[chart_selector].spread_only ) {

    charts_info[chart_selector].svg.append("g")
      .attr("class", "y axis")
      .call(charts_info[chart_selector].yAxis);
  }

  if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1)
  {
    charts_info[chart_selector].svg.append("g")
      .attr("class", "y_t axis")
      .call(charts_info[chart_selector].yAxis_t);

    charts_info[chart_selector].svg.append("g")
      .attr("class", "y_t grid")
      .call(make_y_axis_t()
      .tickSize(-chart_width, 0, 0)
      .tickFormat(""));
  }

  charts_info[chart_selector].svg.append("g")
    .attr("class", "brush")
    .call(charts_info[chart_selector].brush_race_chart)
    .selectAll('rect')
    .attr('height', charts_info[chart_selector].chart_height);

  if( !charts_info[chart_selector].spread_only ) {

    charts_info[chart_selector].svg.append("g")
      .attr("class", "y grid")
      .call(make_y_axis()
      .tickSize(-chart_width, 0, 0)
      .tickFormat(""));
  }

  charts_info[chart_selector].clip = charts_info[chart_selector].svg.append("svg:clipPath")
    .attr("id", "clip_"+chart_selector)
    .append("svg:rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", chart_width)
    .attr("height", charts_info[chart_selector].chart_height);

  var chartBody = charts_info[chart_selector].svg.append("g")
    .attr("clip-path", "url(#clip_"+chart_selector+")");

  if( !charts_info[chart_selector].spread_only ) {

    for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
    {
      charts_info[chart_selector].paths.push( chartBody.append("svg:path")
        .datum(charts_info[chart_selector].combined_chart)
        .attr("class", "candidate_line candidate_line_"+i)
        .attr("data-cnum", i)
        .attr("stroke", charts_info[chart_selector].candidate_color[i])
        .attr("d", charts_info[chart_selector].lines[i])
      );
    }
  }

  var chart_id = $(chart_selector).attr('data-unique-id');

  if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1)
  {
    var grad = chartBody.append("defs")
      .append("linearGradient")
      .attr("id", "grad_"+chart_id)
      .attr("x2", "0")
      .attr("y2", "100%");

    var midpoint = ((charts_info[chart_selector].y_t(0)-charts_info[chart_selector].LINE_CHART_HEIGHT) / charts_info[chart_selector].spread_chart_height);

    grad.append("stop").attr("offset", "0").attr("stop-color", charts_info[chart_selector].candidate_color[0]);
    grad.append("stop").attr("offset", midpoint).attr("stop-color", charts_info[chart_selector].candidate_color[0]);
    grad.append("stop").attr("offset", midpoint).attr("stop-color", charts_info[chart_selector].candidate_color[1]);
    grad.append("stop").attr("offset", "1").attr("stop-color", charts_info[chart_selector].candidate_color[1]);

    var path_t_area = chartBody.append("svg:path")
      .datum(charts_info[chart_selector].combined_chart)
      .attr("class", "spread_area")
      .style("fill", "url(#grad_"+chart_id+")")
      .attr("d", charts_info[chart_selector].area_t);

    var path_t = chartBody.append("svg:path")
      .datum(charts_info[chart_selector].combined_chart)
      .attr("class", "spread_line")
      .attr("d", charts_info[chart_selector].line_t);

    // Graph separator

    var graph_sep = charts_info[chart_selector].svg.append('line')
      .attr({
        'x1': 0,
        'y1': charts_info[chart_selector].LINE_CHART_HEIGHT - 10,
        'x2': chart_width,
        'y2': charts_info[chart_selector].LINE_CHART_HEIGHT - 10
      })
      .attr('class', 'graph_sep');
  }

  // Vertical line

  var verticalLine = charts_info[chart_selector].svg.append('line')
    .attr("opacity", 0)
    .attr({
      'x1': 0,
      'y1': 0,
      'x2': 0,
      'y2': charts_info[chart_selector].chart_height
    })
    .attr('class', 'verticalLine');

  var circles = [];

  if( !charts_info[chart_selector].spread_only ) {

    for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
    {
      var circle_temp = charts_info[chart_selector].svg.append("circle")
        .attr("opacity", 0)
        .attr("class", "candidate_circle")
        .attr('fill', charts_info[chart_selector].candidate_color[i])
        .attr({
          r: 6
        });
      circles.push(circle_temp);
    }
  }

  if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1)
  {
    var spread_circle = charts_info[chart_selector].svg.append("circle")
      .attr("opacity", 0)
      .attr("class", "spread_circle")
      .attr({
        r: 6
      });
  }

  // Set tooltip and circle colors

  for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
  {
    $(chart_selector).find('.candidate_tooltip[data-cnum="'+i+'"]').css('background', charts_info[chart_selector].candidate_color[i]);
  }

  charts_info[chart_selector].svg.on('mouseout', function()
  {
    d3.select(chart_selector + " .verticalLine").attr("opacity", 0);
    for(var i = 0; i < circles.length; i++) {
      circles[i].attr("opacity", 0);
    }
    if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1) {
      spread_circle.attr("opacity", 0);
      $(chart_selector).find(".spread_tooltip").css("opacity", 0);
    }
    $(chart_selector).find(".candidate_tooltip").css("opacity", 0);
    $(chart_selector).find(".date_tooltip").css("opacity", 0);
  });

  charts_info[chart_selector].svg.on('mouseover', function()
  {
    d3.select(chart_selector + " .verticalLine").attr("opacity", 1);

    if( !charts_info[chart_selector].spread_only ) {
      for(var i = 0; i < circles.length; i++) {
        circles[i].attr("opacity", 1);
      }
    }
    if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1) {
      spread_circle.attr("opacity", 1);
      $(chart_selector).find(".spread_tooltip").css("opacity", 1);
    }
    if( !charts_info[chart_selector].spread_only ) {
      $(chart_selector).find(".candidate_tooltip").css("opacity", 1);
    }
    $(chart_selector).find(".date_tooltip").css("opacity", 1);
  });

  charts_info[chart_selector].svg.on('mousemove', function ()
  {
    var pos = closest_in_ordered_array(d3.mouse(this)[0], charts_info[chart_selector].x_data);
    var xPos = pos.x;
    var index = pos.index;
    d3.select(chart_selector + " .verticalLine").attr("transform", function () {
      return "translate(" + xPos + ",0)";
    });
    var x_offset = 0;
    var can_tooltip_x_offset = 0;
    var offset_dir = 'left';
    var clear_offset_dir = 'right';
    var offset_mult = 1;

    if(xPos > chart_width / 2) {
      x_offset = -20;
      x_offset_spread = -90;
      offset_dir = 'right';
      clear_offset_dir = 'left';
      can_tooltip_x_offset = chart_width + extra_offset + 15;
      offset_mult = -1;
    } else {
      x_offset = 60;
      x_offset_spread = x_offset;
      offset_dir = 'left';
      clear_offset_dir = 'right';
      can_tooltip_x_offset = 60;
      offset_mult = 1;
    }

    var d = new Date(charts_info[chart_selector].combined_chart[index].date);
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var date_string = "";
    var date_top_offset = 5;

    if( $(chart_selector).attr('data-days-until') ) {
      var election_d = new Date($(chart_selector).attr('data-days-until'));
      var days_diff = Math.round((election_d - d)/(1000*60*60*24));
      date_string = days_diff + " Days To Election";
      date_top_offset = -5;
    } else {
      date_string = monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    var date_left = xPos - 16;
    if(date_left < 0) {
      date_left = 0;
    } else if(date_left > chart_width - $(chart_selector).find(".date_tooltip").width() + 21) {
      date_left = chart_width - $(chart_selector).find(".date_tooltip").width() + 21;
    }

    $(chart_selector).find(".date_tooltip").html(date_string);
    $(chart_selector).find(".date_tooltip")
      .css("left", date_left)
      .css("top", charts_info[chart_selector].chart_height + date_top_offset);

    if( !charts_info[chart_selector].spread_only ) {

      for(var i = 0; i < circles.length; i++)
      {
        if( typeof charts_info[chart_selector].charts[i][index] === 'undefined') {
          circles[i].attr("opacity", 0);
          $(chart_selector).find('.candidate_tooltip[data-cnum="'+i+'"]').hide();
          continue;
        }

        var pathLength = charts_info[chart_selector].paths[i].node().getTotalLength();
        var x = xPos;
        var beginning = x,
        end = pathLength,
        target;
        var target_offset = 0;

        var y_pos = charts_info[chart_selector].y(charts_info[chart_selector].charts[i][index].value);

        while (true)
        {
          target = Math.floor((beginning + end) / 2);

          try {
            pos = charts_info[chart_selector].paths[i].node().getPointAtLength(target - target_offset);
          } catch(err) {
            break;
          }

          if ((target === end || target === beginning) && pos.x !== x) {
            break;
          }
          if (pos.x > x) end = target;
          else if (pos.x < x) beginning = target;
          else break; //position found
        }

        if(charts_info[chart_selector].combined_chart[index].values[i] === null)
        {
          circles[i].attr("opacity", 0);
          $(chart_selector).find('.candidate_tooltip[data-cnum="'+i+'"]').hide();
          continue;
        }

        circles[i].attr("opacity", 1)
          .attr("cx", x)
          .attr("cy", y_pos);

        $(chart_selector).find('.candidate_tooltip[data-cnum="'+i+'"]')
          .show()
          .css(offset_dir, (x*offset_mult) + can_tooltip_x_offset)
          .css(clear_offset_dir, 'auto')
          .css("top", y_pos - (TOOLTIP_HEIGHT / 2) + 3);

        // Check if name should be included
        var name_include = '';
        if( $(chart_selector).attr('data-names') == '1' ) {
          name_include = charts_info[chart_selector].candidate_name[i]+' ';
        }

        $(chart_selector).find('.candidate_tooltip[data-cnum="'+i+'"]').html(name_include+charts_info[chart_selector].combined_chart[index].values[i]);
      }

      // Fix overlapping tooltips
      var tooltip_height_arr = [];
      function height_compare(a,b) {
        if (a['offset_top'] < b['offset_top'])
          return -1;
        if (a['offset_top'] > b['offset_top'])
          return 1;
        return 0;
      }
      $(chart_selector).find('.candidate_tooltip').each(function()
      {
        // Populate array pointing to tooltips in order of height
        tooltip_height_arr.push({
          'tooltip' : $(this),
          'offset_top' : $(this).offset().top
        });
      });

      tooltip_height_arr.sort(height_compare);

      for(var i = 1; i < tooltip_height_arr.length; i++)
      {
        if( tooltip_height_arr[i]['tooltip'].is(':visible') && tooltip_height_arr[i]['offset_top'] - tooltip_height_arr[i-1]['offset_top'] < TOOLTIP_HEIGHT )
        {
          var new_top_offset = tooltip_height_arr[i-1]['offset_top'] + TOOLTIP_HEIGHT;
          tooltip_height_arr[i]['tooltip'].offset({ top: new_top_offset});
          tooltip_height_arr[i]['offset_top'] = new_top_offset;
        }
      }
    }

    if(typeof charts_info[chart_selector].spread_chart !== 'undefined' && charts_info[chart_selector].spread_chart == 1)
    {

      var pathLength = path_t.node().getTotalLength();
      var x = xPos;
      var beginning = x,
      end = pathLength,
      target;
      while (true)
      {
        target = Math.floor((beginning + end) / 2);
        pos = path_t.node().getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== x) {
          break;
        }
        if (pos.x > x) end = target;
        else if (pos.x < x) beginning = target;
        else break; //position found
      }

      spread_circle.attr("opacity", 1)
        .attr("cx", x)
        .attr("cy", pos.y);

      $(chart_selector).find(".spread_tooltip")
        .css("left", x + x_offset_spread)
        .css("top", pos.y - (TOOLTIP_HEIGHT / 2) + 3);


      var spread_text = '';

      //if(pos.y > y_t(0))
      if(parseFloat(charts_info[chart_selector].combined_chart[index].spread) < 0)
      {
        spread_text = charts_info[chart_selector].candidate_name[1];
        $(chart_selector).find(".spread_tooltip").css("background", charts_info[chart_selector].candidate_color[1]);
        $(chart_selector).find(".spread_circle").attr("fill", charts_info[chart_selector].candidate_color[1]);
      }
      else
      {
        spread_text = charts_info[chart_selector].candidate_name[0];
        $(chart_selector).find(".spread_tooltip").css("background", charts_info[chart_selector].candidate_color[0]);
        $(chart_selector).find(".spread_circle").attr("fill", charts_info[chart_selector].candidate_color[0]);
      }

      $(chart_selector).find(".spread_tooltip").html(spread_text + ' +' + Math.abs(charts_info[chart_selector].combined_chart[index].spread));
    }
  });

  // Set controls

  $(chart_selector).parent().parent().find('.chart_reset').click(function() {
    reset_zoom(chart_selector);
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(chart_selector).parent().parent().find('.chart_max').addClass('selected');
  });
  $(chart_selector).parent().parent().find('.chart_max').click(function() {
    reset_zoom(chart_selector);
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
  });
  $(chart_selector).parent().parent().find('.chart_2y').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (YEAR * 2));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_1y').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - YEAR);
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_6m').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (YEAR / 2));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_3m').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (YEAR / 4));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_30d').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (DAY * 30));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_14d').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (DAY * 14));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });
  $(chart_selector).parent().parent().find('.chart_7d').click(function()
  {
    var date_2 = d3.max(charts_info[chart_selector].combined_chart, function (d) {
      return d.date;
    });
    var date_1 = new Date(date_2.getTime() - (DAY * 7));
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    $(this).addClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });

  $(chart_selector).parent().parent().find('.chart_datepicker').datepicker({
    minDate: date_min,
    maxDate: date_max
  });

  $(chart_selector).parent().parent().find('.chart_apply').click(function()
  {
    var date_1 = new Date($(chart_selector).parent().parent().find('.from_date').val());
    var date_2 = new Date($(chart_selector).parent().parent().find('.to_date').val());
    $(chart_selector).parent().parent().find('.race_charts_button').removeClass('selected');
    change_zoom(date_1, date_2, chart_selector);
  });

  // Set initial zoom level

  var selected_label;
  if(screen.width <= 414 && typeof $(chart_selector).attr('data-selected-mobile') !== 'undefined') {
    selected_label = $(chart_selector).attr('data-selected-mobile');
  } else {
    selected_label = $(chart_selector).attr('data-selected');
  }
  if(typeof selected_label !== 'undefined' && selected_label.length > 0) {
    $(chart_selector).parent().parent().find('.chart_'+selected_label).click();
  }

  function zoomed(chart_selector)
  {

    charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION).select(".x.axis").call(charts_info[chart_selector].xAxis);
    if( !charts_info[chart_selector].spread_only ) {
      charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION).select(".y.axis").call(charts_info[chart_selector].yAxis);
    }
    charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION).select(".y_t.axis").call(charts_info[chart_selector].yAxis_t);
    
    if( !charts_info[chart_selector].spread_only ) {
      charts_info[chart_selector].svg.select(".y.grid")
        .call(make_y_axis()
        .tickSize(-chart_width, 0, 0)
        .tickFormat(""));
      for(var i = 0; i < charts_info[chart_selector].lines.length; i++)
      {
        charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION)
          .select(".candidate_line_"+i)
          .attr("d", charts_info[chart_selector].lines[i]);
      }
    }
    charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION)
      .select(".spread_area")
      .attr("class", "spread_area")
      .attr("d", charts_info[chart_selector].area_t);
    charts_info[chart_selector].svg.transition().duration(ZOOM_DURATION)
      .select(".spread_line")
      .attr("class", "spread_line")
      .attr("d", charts_info[chart_selector].line_t);
    reset_x_data(chart_selector);
    
  }

  function brushmove()
  {
    if(typeof charts_info[chart_selector].brush_race_chart.extent !== 'undefined') {
      var extent = charts_info[chart_selector].brush_race_chart.extent();
    }
  }

  function brushend()
  {
    if(typeof charts_info[chart_selector].brush_race_chart.extent !== 'undefined') {
      var dates = charts_info[chart_selector].brush_race_chart.extent();
      // Return if same date (happens if you single click chart)
      var date_1 = new Date(dates[0]);
      var date_2 = new Date(dates[1]);

      $(this).parent().parent().find('.race_charts_button').removeClass('selected');
      change_zoom(date_1, date_2, chart_selector);
    }
  }

  function change_zoom(date_1, date_2, chart_selector)
  {
    if(date_1.getTime() == date_2.getTime()) {
      return;
    }

    charts_info[chart_selector].x_domain.domain([date_1, date_2]);

    var zoom_mins = [];
    var zoom_maxs = [];

    if( !charts_info[chart_selector].spread_only ) {
      for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
      {
        var min_zoom = d3.min(charts_info[chart_selector].combined_chart, function (d) {
            var time = d.date.getTime();
            if(date_1.getTime() <= time && date_2.getTime() >= time) {
              if(d.values[i] === null) {
                return 100; // High so the min isn't changed
              } else {
                return parseFloat(d.values[i]);
              }
            }
          });
        var max_zoom = d3.max(charts_info[chart_selector].combined_chart, function (d) {
            var time = d.date.getTime();
            if(date_1.getTime() <= time && date_2.getTime() >= time) {
              if(d.values[i] === null) {
                return 0;
              } else {
                return parseFloat(d.values[i]);
              }
            }
          });
        zoom_mins.push(min_zoom);
        zoom_maxs.push(max_zoom);
      }
    }

    var t_min_zoom = d3.min(charts_info[chart_selector].charts[0], function (d) {
        var time = d.date.getTime();
        if(date_1.getTime() <= time && date_2.getTime() >= time) {
          return d.spread;
        }
      });
    var t_max_zoom = d3.max(charts_info[chart_selector].charts[0], function (d) {
        var time = d.date.getTime();
        if(date_1.getTime() <= time && date_2.getTime() >= time) {
          return d.spread;
        }
      });

    if(charts_info[chart_selector].y_axis.length == 2) {
      t_max_zoom = parseInt(charts_info[chart_selector].y_axis[0]);
      t_min_zoom = parseInt(charts_info[chart_selector].y_axis[1]);
    }

    if( !charts_info[chart_selector].spread_only ) {
      charts_info[chart_selector].y.domain([Math.min.apply(Math,zoom_mins), Math.max.apply(Math,zoom_maxs)]);
    }
    charts_info[chart_selector].y_t.domain([t_min_zoom - 1, t_max_zoom + 1]);

    if(t_min_zoom > 0) {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(t_min_zoom - 1));
    } else if(t_max_zoom < 0) {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(t_max_zoom + 1));
    } else {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(0));
    }

    zoomed(chart_selector);

    d3.select(chart_selector + " .brush").call(charts_info[chart_selector].brush_race_chart.clear());

    /*min = d3.min(charts_info[chart_selector].combined_chart, function (d) {
        return d.date;
      });
    max = d3.max(charts_info[chart_selector].combined_chart, function (d) {
        return d.date;
      });*/
  }

  function reset_x_data(chart_selector)
  {
    charts_info[chart_selector].x_data = [];
    for(var i = 0; i < charts_info[chart_selector].combined_chart.length; i++) {
      charts_info[chart_selector].x_data[i] = charts_info[chart_selector].x_domain(charts_info[chart_selector].combined_chart[i].date);
    }
  }

  function reset_zoom(chart_selector)
  {
    min_x = d3.min(charts_info[chart_selector].combined_chart, function (d) {
        return d.date;
      });
    max_x = d3.max(charts_info[chart_selector].combined_chart, function (d) {
        return d.date;
      });
    var min_y_arr = [];
    var max_y_arr = [];

    if( !charts_info[chart_selector].spread_only ) {
      for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
      {
        var min_y = d3.min(charts_info[chart_selector].combined_chart, function (d) {
          if(d.values[i] === null) {
            return 100; // high number so the min isn't changed
          } else {
            return parseFloat(d.values[i]);
          }
        });
        var max_y = d3.max(charts_info[chart_selector].combined_chart, function (d) {
          if(d.values[i] === null) {
            return 0;
          } else {
            return parseFloat(d.values[i]);
          }
        });
        min_y_arr.push(parseFloat(min_y));
        max_y_arr.push(parseFloat(max_y));
      }
    }
    min_y_t = d3.min(charts_info[chart_selector].charts[0], function (d) {
        return d.spread;
      });
    max_y_t = d3.max(charts_info[chart_selector].charts[0], function (d) {
        return d.spread;
      });

    if(charts_info[chart_selector].y_axis.length == 2) {
      max_y_t = parseInt(charts_info[chart_selector].y_axis[0]);
      min_y_t = parseInt(charts_info[chart_selector].y_axis[1]);
    }

    charts_info[chart_selector].x_domain.domain([min_x, max_x]);
    if( !charts_info[chart_selector].spread_only ) {
      charts_info[chart_selector].y.domain([Math.min.apply(Math,min_y_arr), Math.max.apply(Math,max_y_arr)]);
    }
    charts_info[chart_selector].y_t.domain([min_y_t - 1, max_y_t + 1]);
    if(min_y_t > 0) {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(min_y_t - 1));
    } else if(max_y_t < 0) {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(max_y_t + 1));
    } else {
      charts_info[chart_selector].area_t.y0(charts_info[chart_selector].y_t(0));
    }
    zoomed(chart_selector);
  }

  resize_ok = true;

  fix_tablet_phone_scroll();
}

var timeout_resize_ok = false;
var timeout_set = false;

function resize_chart()
{
  if(resize_ok)
  {
    if(timeout_resize_ok)
    {
      $(".chartdiv").each(function() {

        if( $(this).find('svg').length == 0 ) {
          return;
        }

        var chart_selector = '.chartdiv_'+$(this).attr('data-unique-id');

        orig_width = parseInt($(this).outerWidth());
        chart_width = orig_width - margin.left - margin.right;

        // Resize chart height
        var new_height = '360';
        if(typeof $(this).attr('data-chart-height') !== 'undefined')
        {
          if(screen.width <= 414) {
            new_height = parseInt($(this).attr('data-chart-height-mobile'));
          } else {
            new_height = parseInt($(this).attr('data-chart-height'));
          }
          $(this).attr('style', 'height:'+new_height+'px');

          charts_info[chart_selector].chart_height_override = new_height - 40;
          charts_info[chart_selector].LINE_CHART_HEIGHT = charts_info[chart_selector].chart_height_override - charts_info[chart_selector].spread_chart_height;
          
        }

        if(charts_info[chart_selector].old_width == chart_width) {
          return;
        }
        charts_info[chart_selector].old_width = chart_width;

        charts_info[chart_selector].x_domain.range([0, chart_width - 20]);

        if( !charts_info[chart_selector].spread_only ) {

          charts_info[chart_selector].svg.select('.y.axis')
            .call(charts_info[chart_selector].yAxis);

          for(var i = 0; i < charts_info[chart_selector].charts.length; i++)
          {
            charts_info[chart_selector].svg.selectAll('.candidate_line.candidate_line_'+i)
              .attr('d', charts_info[chart_selector].lines[i]);
          }
        }
        x_ticks = Math.max(Math.floor(orig_width/100), 2);

        timeout_resize_ok = false;

        $(this).find('svg').remove();
        generate_chart(chart_selector);
      });
      
    }
    else if(!timeout_set)
    {
      timeout_set = true;
      setTimeout(function(){
        timeout_resize_ok = true;
        timeout_set = false;
        resize_chart();
      }, 300);
    }

  }
}

d3.select(window).on('resize', resize_chart);

/* Prevent tablet and phone scroll */
var touched_chart = false;

function fix_tablet_phone_scroll() {

  $(function()
  {
    $(".chart_container").on("dragstart dragenter dragover dragleave drag drop dragend mousedown mouseup mouseover mouseout mousemove click", function(event)
    {
      if(touched_chart) {
        event.stopPropagation();
        $("#chart_container").attr("style", "pointer-events: none");
        $("#chartdiv").attr("style", "pointer-events: none");
        $("#chartdiv svg").attr("style", "pointer-events: none");
      }
    });

    $(".chart_container").on("tap touchend touchstart touchmove touchleave touchenter touchcancel", function(event){
      touched_chart = true;
      brush_race_chart = {};
      $("#chartdiv .brush").remove();
      event.stopPropagation();
      $("#chart_container").attr("style", "pointer-events: none");
      $("#chartdiv").attr("style", "pointer-events: none");
      $("#chartdiv svg").attr("style", "pointer-events: none");
    });
  });
}