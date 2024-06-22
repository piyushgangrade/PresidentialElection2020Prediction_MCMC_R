
var HOUR = 60 * 60 * 1000;
var DAY = HOUR * 24;
var YEAR = DAY * 365;

var ZOOM_DURATION = 500;
var TOOLTIP_HEIGHT = 29;

var LINE_CHART_HEIGHT = 300;
var spread_chart_height = 60;
if(typeof chart_height_override !== "undefined") {
	LINE_CHART_HEIGHT = chart_height_override - spread_chart_height;
}

var hist_data_points;

var date_a='';
var date_b='';
var chart_data=[];
//var chart_r = [];
//var chart_d = [];
var charts = [];
var candidate_name=[];
var candidate_color=[];
var timestamp = new Date();

var resize_ok = false;

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

function generateChartData(pid)
{
	var preview_suffix = '';
	if(typeof race_chart_preview != 'undefined' && race_chart_preview == 1) {
		preview_suffix = '_preview';
	}
	var my_url='/epolls/json/'+pid+'_historical'+preview_suffix+'.js?'+timestamp.getTime()+'';

	$.ajax({
		url: my_url,
		dataType: 'jsonp',
		jsonpCallback: 'return_json',
		cache: 'false',
		success: function(json) {
			$('.chart_container').attr('style', 'background:#fff !important;');
			hist_data_points = json.poll.rcp_avg;
			hist_data_points = hist_data_points.reverse();
			$.each(hist_data_points,function(i,a){

				var date_a=new Date(a.date);
				date_b=new Date(date_a.getFullYear(), date_a.getMonth(), date_a.getDate(), 0, 0, 0, 0)

				if(i==0){
					first_date=date_b;
				}

				//console.log(a.candidate);

				var temp_chart_data=[];
				$.each(a.candidate,function(j,b){

					if( b.status != null && (b.status == '2' || b.status == '0') ) {
						temp_chart_data.push({});
						return true; // like a 'continue' for $.each
					}
					if(!$.isArray(chart_data[j])){
						chart_data[j]=[]
					}
					candidate_name[j] = b.name;
					if(candidate_name[j] == '') {
						candidate_name[j] = b.affiliation;
					}
					var filtered_value = null;
					/*if(b.value !== null && b.value !== undefined) {
						filtered_value = b.value;
					}*/
					if( $.isNumeric(b.value) ) {
						filtered_value = parseFloat(b.value);
					} else {
						//console.log(date_b);
						//console.log(b);
					}
					candidate_color[j]=color_lookup(b.color, b.name, b.affiliation)
					temp_chart_data.push({date: date_b,value: filtered_value});
				});

				/*var max_val = 0;
				var max_key = 0;
				for(var i = 0; i < temp_chart_data.length; i++)
				{
					if($.isNumeric(temp_chart_data[i].value) && temp_chart_data[i].value > max_val)
					{
						max_val = temp_chart_data[i].value;
						max_key = i;
					}
				}

				temp_chart_data.splice(max_key, 1);*/

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

					if(typeof c.date === "undefined") { return true; }

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
			});

			// Convert into data D3 can use

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
				charts.push(temp_arr);
			}
			if(final_date == '') {
				final_date=last_date;
			}
			if(typeof last_date !== 'undefined') {
				generate_chart();
				resize_chart();
			}
		}
	});
}

$(function()
{
	var race_id;

	if( $('#chartdiv').attr('data-type') == 'spread' ) {
		race_id = $('#poll_id').attr('data-race-id');
	} else {
		race_id = $('#poll_id').val();
	}

	// Initial width calculation
		orig_width = 584;
		// If layout_1, then wide version
		if( $('#container .layout_1').length > 0) {
			orig_width = 784;
		}
		//orig_height = chart_container_height;

	if(typeof d3 === 'undefined')
	{
		$('#chartdiv .candidate_tooltip').remove();
		$('#chartdiv .date_tooltip').remove();
		$('#chartdiv .spread_tooltip').remove();
		$('#chartdiv').html('<img src="/poll/race/' + race_id + '/chart.png" alt="chart" />');
		$('#charttools').html('To see an interactive version of our chart please upgrade your browser to one of the following: <a href="https://www.google.com/chrome/browser/">Google Chrome</a> | <a href="https://www.mozilla.org/firefox/">Mozilla Firefox</a> | <a href="http://windows.microsoft.com/en-us/internet-explorer/download-ie">Microsoft Internet Explorer</a>')
	}
	else {
		generateChartData(race_id);
	}
});

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

/*function prev_in_ordered_array(i_date, chart_d, chart_r)
{
	var data = {};
	var target_time = new Date(i_date).getTime() / 1000;
	var prev_index = 0;
	var new_time = new Date(chart_d[0].date).getTime() / 1000;
	for (var i = 0; i < chart_d.length; i++)
	{
		new_time = new Date(chart_d[i].date).getTime() / 1000;
		if(new_time > target_time) {
			break;
		}
		prev_index = i;
	}
	data.d_value = chart_d[prev_index].value;
	data.r_value = chart_r[prev_index].value;
	data.spread = chart_d[prev_index].spread;
	data.date = new Date(i_date);
	return data;
}*/

var chart_width;
var chart_height;

var extra_offset = 15;

var paths = [];
var lines = [];

var min_array = [];
var max_array = [];

var make_x_axis;
var make_y_axis;
var make_y_axis_t;

var xAxis;
var yAxis;
var yAxis_t;

var y;
var x_domain;

var x_ticks = 5;

margin = {
	top: 5,
	right: 5,
	bottom: 30,
	left: 38
};

var svg;
var brush_race_chart;

function generate_chart()
{
	resize_ok = false;
	paths = [];

	margin = {
		top: 5,
		right: 5,
		bottom: 30,
		left: 38
	};

	/*orig_width = 584;

	// If layout_1, then wide version
	if( $('#container .layout_1').length > 0) {
		orig_width = 784;
		extra_offset = 0;
	}*/

	orig_height = 400;
	if(typeof chart_height_override !== "undefined") {
		orig_height = chart_height_override + 40;
	}

	chart_width = orig_width - margin.left - margin.right;
	chart_height = orig_height - margin.top - margin.bottom;

	// Set initial date points

	var combined_chart = [];

	var date_max = d3.max(charts[0], function (d) {
			return d.date;
		});
	var date_min = d3.min(charts[0], function (d) {
			return d.date;
		});

	for(var i = 0; i < charts[0].length; i++)
	{
		var temp_obj = {};
		temp_obj.values = [];
		temp_obj.spread = charts[0][i].spread.toFixed(1);
		temp_obj.date = new Date(charts[0][i].date);
		for(var j = 0; j < charts.length; j++) {
			if(typeof charts[j][i] !== 'undefined' && charts[j][i].value !== null) {
				temp_obj.values.push(charts[j][i].value.toFixed(1));
			} else {
				temp_obj.values.push(null);
			}
		}
		combined_chart.push(temp_obj);
	}

	//console.log(charts);
	//console.log(combined_chart);

	// Start D3

	x_domain = d3.time.scale()
		.domain(d3.extent(combined_chart, function (d) {
			return d.date;
		}))
		.range([0, chart_width - 20]);

	for(var i = 0; i < charts.length; i++)
	{
		min_array.push(d3.min(charts[i], function (d) {
			return d.value;
		}));
		max_array.push(d3.max(charts[i], function (d) {
			return d.value;
		}));
	}
	var t_min = d3.min(charts[0], function (d) {
			return d.spread;
		});
	var t_max = d3.max(charts[0], function (d) {
			return d.spread;
		});

	if(typeof spread_chart !== 'undefined' && spread_chart != '1') {
		spread_chart_height = 0;
	}

	y = d3.scale.linear()
		.domain([Math.min.apply(Math,min_array), Math.max.apply(Math,max_array)])
		//.domain([Math.min(min_array[0], min_array[1]), Math.max(max_array[0], max_array[1])])
		.range([chart_height-30-spread_chart_height, 10]);

	var y_t = d3.scale.linear()
		.domain([t_min, t_max])
		.range([LINE_CHART_HEIGHT + spread_chart_height, LINE_CHART_HEIGHT]);

	var x_data = [];

	reset_x_data();

	brush_race_chart = d3.svg.brush();

	if( typeof width_init == 'undefined' || width_init >= 768 ) {
		brush_race_chart
			.x(x_domain)
			.on("brush", brushmove)
			.on("brushend", brushend);
	}

	for(var i = 0; i < charts.length; i++)
	{
		lines.push( d3.svg.line()
			.defined(function(d) { return d.values[$(this).attr('data-cnum')] != null; })
			.x(function (d) {
				return x_domain(d.date);
			})
			.y(function (d) {
				return y(d.values[$(this).attr('data-cnum')]);
			})
		);
	}

	var area_t = d3.svg.area()
		.x(function (d) {
			return x_domain(d.date);
		})
		.y1(function (d) {
			return y_t(d.spread);
		});

	if(t_min > 0) {
		area_t.y0(y_t(t_min - 1));
	} else if(t_max < 0) {
		area_t.y0(y_t(t_max + 1));
	} else {
		area_t.y0(y_t(0));
	}

	var line_t = d3.svg.line()
		.x(function (d) {
			return x_domain(d.date);
		})
		.y(function (d) {
			return y_t(d.spread);
		});

	svg = d3.select('#chartdiv')
		.append("svg:svg")
		.attr('width', orig_width)
		.attr('height', orig_height)
		/*.attr('viewBox', '0 0 ' + orig_width + ' ' + orig_height)
		.attr('preserveAspectRatio', 'xMidYMid')*/
		.append("svg:g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(d3.behavior.zoom().scale(0.9));

	svg.append("svg:rect")
		.attr("width", chart_width)
		.attr("height", orig_height)
		.attr("class", "plot");

	make_x_axis = function () {
		return d3.svg.axis()
			.scale(x_domain)
			.orient("bottom")
			.ticks(x_ticks);
	};

	make_y_axis = function () {
		return d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(8);
	};

	make_y_axis_t = function () {
		return d3.svg.axis()
			.scale(y_t)
			.orient("left")
			.ticks(4);
	};

	xAxis = d3.svg.axis()
		.scale(x_domain)
		.orient("bottom")
		.ticks(5);

	yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(8);

	yAxis_t = d3.svg.axis()
		.scale(y_t)
		.orient("left")
		.ticks(4);

	svg.append("g")
		.attr("class", "x axis")
		.attr("clip-path", "url(#clip)")
		.attr("transform", "translate(0," + chart_height + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	if(typeof spread_chart !== 'undefined' && spread_chart == '1')
	{
		svg.append("g")
			.attr("class", "y_t axis")
			.call(yAxis_t);

		svg.append("g")
			.attr("class", "y_t grid")
			.call(make_y_axis_t()
			.tickSize(-chart_width, 0, 0)
			.tickFormat(""));
	}

	svg.append("g")
		.attr("class", "brush")
		.call(brush_race_chart)
		.selectAll('rect')
		.attr('height', chart_height);

	svg.append("g")
		.attr("class", "y grid")
		.call(make_y_axis()
		.tickSize(-chart_width, 0, 0)
		.tickFormat(""));

	var clip = svg.append("svg:clipPath")
		.attr("id", "clip")
		.append("svg:rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", chart_width)
		.attr("height", chart_height);

	var chartBody = svg.append("g")
		.attr("clip-path", "url(#clip)");

	for(var i = 0; i < charts.length; i++)
	{
		/*var path_temp = chartBody.append("svg:path")
			.datum(combined_chart)
			.attr("class", "candidate_line")
			.attr("stroke", candidate_color[i])
			.attr("d", lines[i]);
		paths.push(path_temp);*/
		paths.push( chartBody.append("svg:path")
			.datum(combined_chart)
			.attr("class", "candidate_line candidate_line_"+i)
			.attr("data-cnum", i)
			.attr("stroke", candidate_color[i])
			.attr("d", lines[i])
		);
	}

	//kjakfsdjkasdf.kajfiejf = 284;

	if(typeof spread_chart !== 'undefined' && spread_chart == '1')
	{
		var grad = chartBody.append("defs")
			.append("linearGradient")
			.attr("id", "grad")
			.attr("x2", "0")
			.attr("y2", "100%");

		var midpoint = ((y_t(0)-LINE_CHART_HEIGHT) / spread_chart_height);

		grad.append("stop").attr("offset", "0").attr("stop-color", candidate_color[0]);
		grad.append("stop").attr("offset", midpoint).attr("stop-color", candidate_color[0]);
		grad.append("stop").attr("offset", midpoint).attr("stop-color", candidate_color[1]);
		grad.append("stop").attr("offset", "1").attr("stop-color", candidate_color[1]);

		var path_t_area = chartBody.append("svg:path")
			.datum(combined_chart)
			.attr("class", "spread_area")
			.style("fill", "url(#grad)")
			.attr("d", area_t);

		var path_t = chartBody.append("svg:path")
			.datum(combined_chart)
			.attr("class", "spread_line")
			.attr("d", line_t);

		// Graph separator

		var graph_sep = svg.append('line')
			.attr({
				'x1': 0,
				'y1': LINE_CHART_HEIGHT - 10,
				'x2': chart_width,
				'y2': LINE_CHART_HEIGHT - 10
			})
			.attr('class', 'graph_sep');
	}

	// Vertical line

	var verticalLine = svg.append('line')
		.attr("opacity", 0)
		.attr({
			'x1': 0,
			'y1': 0,
			'x2': 0,
			'y2': chart_height
		})
		.attr('class', 'verticalLine');

	var circles = [];

	for(var i = 0; i < charts.length; i++)
	{
		var circle_temp = svg.append("circle")
			.attr("opacity", 0)
			.attr("class", "candidate_circle")
			.attr('fill', candidate_color[i])
			.attr({
				r: 6
			});
		circles.push(circle_temp);
	}

	if(typeof spread_chart !== 'undefined' && spread_chart == '1')
	{
		var spread_circle = svg.append("circle")
			.attr("opacity", 0)
			.attr("class", "spread_circle")
			.attr({
				r: 6
			});
	}

	// Set tooltip and circle colors

	for(var i = 0; i < charts.length; i++)
	{
		$('.candidate_tooltip[data-cnum="'+i+'"]').css('background', candidate_color[i]);
	}

	svg.on('mouseout', function()
	{
		d3.select(".verticalLine").attr("opacity", 0);
		for(var i = 0; i < circles.length; i++) {
			circles[i].attr("opacity", 0);
		}
		if(typeof spread_chart !== 'undefined' && spread_chart == '1') {
			spread_circle.attr("opacity", 0);
			$(".spread_tooltip").css("opacity", 0);
		}
		$(".candidate_tooltip").css("opacity", 0);
		$(".date_tooltip").css("opacity", 0);
	});

	svg.on('mouseover', function()
	{
		d3.select(".verticalLine").attr("opacity", 1);
		for(var i = 0; i < circles.length; i++) {
			circles[i].attr("opacity", 1);
		}
		if(typeof spread_chart !== 'undefined' && spread_chart == '1') {
			spread_circle.attr("opacity", 1);
			$(".spread_tooltip").css("opacity", 1);
		}
		$(".candidate_tooltip").css("opacity", 1);
		$(".date_tooltip").css("opacity", 1);
	});

	svg.on('mousemove', function ()
	{
		var pos = closest_in_ordered_array(d3.mouse(this)[0], x_data);
		var xPos = pos.x;
		var index = pos.index;
		d3.select(".verticalLine").attr("transform", function () {
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

		var d = new Date(combined_chart[index].date);
		var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
		var date_string = monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
		var date_left = xPos - 16;
		if(date_left < 0) {
			date_left = 0;
		} else if(date_left > chart_width - $(".date_tooltip").width() + 21) {
			date_left = chart_width - $(".date_tooltip").width() + 21;
		}

		$(".date_tooltip").html(date_string);
		$(".date_tooltip")
			.css("left", date_left)
			.css("top", chart_height + 5);

		for(var i = 0; i < circles.length; i++)
		{
			if( typeof charts[i][index] === 'undefined') {
			  circles[i].attr("opacity", 0);
			  $('.candidate_tooltip[data-cnum="'+i+'"]').hide();
			  continue;
			}

			var pathLength = paths[i].node().getTotalLength();
			var x = xPos;
			var beginning = x,
			end = pathLength,
			target;
			var target_offset = 0;

			var y_pos = y(charts[i][index].value);

			/*console.log(charts[i][index].value);
			console.log(x_data[index]);
			console.log(y_pos);
			console.log('---');*/

			while (true)
			{
				target = Math.floor((beginning + end) / 2);

				try {
					pos = paths[i].node().getPointAtLength(target - target_offset);
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

			if(combined_chart[index].values[i] === null)
			{
				circles[i].attr("opacity", 0);
				$('.candidate_tooltip[data-cnum="'+i+'"]').hide();
				continue;
			}

			circles[i].attr("opacity", 1)
				.attr("cx", x)
				.attr("cy", y_pos);

			$('.candidate_tooltip[data-cnum="'+i+'"]')
				.show()
				.css(offset_dir, (x*offset_mult) + can_tooltip_x_offset)
				.css(clear_offset_dir, 'auto')
				.css("top", y_pos - (TOOLTIP_HEIGHT / 2) + 3);

			// Check if name should be included
			var name_include = '';
			if( $('#chartdiv').attr('data-names') == '1' ) {
				name_include = candidate_name[i]+' ';
			}

			$('.candidate_tooltip[data-cnum="'+i+'"]').html(name_include+combined_chart[index].values[i]);
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
		$('.candidate_tooltip').each(function()
		{
			// Populate array pointing to tooltips in order of height
			tooltip_height_arr.push({
				'tooltip' : $(this),
				'offset_top' : $(this).offset().top
			});
		});

		tooltip_height_arr.sort(height_compare);

		//console.log('height_arr');
		//console.log(tooltip_height_arr);

		for(var i = 1; i < tooltip_height_arr.length; i++)
		{
			/*var next_tooltip_offset = 0;
			for(var j = i; j < tooltip_height_arr.length; j++)
			{
				if(tooltip_height_arr[j-1]['offset_top'])
			}*/
			if( tooltip_height_arr[i]['tooltip'].is(':visible') && tooltip_height_arr[i]['offset_top'] - tooltip_height_arr[i-1]['offset_top'] < TOOLTIP_HEIGHT )
			{
				var new_top_offset = tooltip_height_arr[i-1]['offset_top'] + TOOLTIP_HEIGHT;
				tooltip_height_arr[i]['tooltip'].offset({ top: new_top_offset});
				tooltip_height_arr[i]['offset_top'] = new_top_offset;
			}
		}

		/*var pathLength = path_r.node().getTotalLength();
		var x = xPos;
		var beginning = x,
		end = pathLength,
		target;
		while (true)
		{
			target = Math.floor((beginning + end) / 2);
			pos = path_r.node().getPointAtLength(target);
			if ((target === end || target === beginning) && pos.x !== x) {
				break;
			}
			if (pos.x > x) end = target;
			else if (pos.x < x) beginning = target;
			else break; //position found
		}
		approve_circle.attr("opacity", 1)
			.attr("cx", x)
			.attr("cy", pos.y);

		$(".approve_tooltip")
			.css("left", x + x_offset)
			.css("top", pos.y - TOOLTIP_HEIGHT_HALF);
		$(".approve_tooltip").html(combined_chart[index].r_value);*/


		if(typeof spread_chart !== 'undefined' && spread_chart == '1')
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

			$(".spread_tooltip")
				.css("left", x + x_offset_spread)
				.css("top", pos.y - (TOOLTIP_HEIGHT / 2) + 3);


			var spread_text = '';

			//if(pos.y > y_t(0))
			if(parseFloat(combined_chart[index].spread) < 0)
			{
				spread_text = candidate_name[1];
				$(".spread_tooltip").css("background", candidate_color[1]);
				$(".spread_circle").attr("fill", candidate_color[1]);
			}
			else
			{
				spread_text = candidate_name[0];
				$(".spread_tooltip").css("background", candidate_color[0]);
				$(".spread_circle").attr("fill", candidate_color[0]);
			}

			$(".spread_tooltip").html(spread_text + ' +' + Math.abs(combined_chart[index].spread));
		}
		// Reposition tooltips if they are on top of eachother
		/*var d_top = parseInt($(".disapprove_tooltip").css('top'), 10);
		var r_top = parseInt($(".approve_tooltip").css('top'), 10);
		var t_top = parseInt($(".spread_tooltip").css('top'), 10);
		var date_top = parseInt($(".date_tooltip").css('top'), 10);
		var d_left = parseInt($(".disapprove_tooltip").css('left'), 10);
		var r_left = parseInt($(".approve_tooltip").css('left'), 10);
		var t_left = parseInt($(".spread_tooltip").css('left'), 10);
		var date_left = parseInt($(".date_tooltip").css('left'), 10);
		var tooltip_height = 27;
		var midpoint = 0;
		var dist = 0;

		if( t_top > date_top - tooltip_height ) {
			$(".spread_tooltip").css('top', date_top - tooltip_height);
		}
		if( d_top > t_top - tooltip_height ) {
			$(".disapprove_tooltip").css('top', t_top - tooltip_height);
		}
		if( r_top > t_top - tooltip_height ) {
			$(".approve_tooltip").css('top', t_top - tooltip_height);
		}
		if( r_top > d_top - tooltip_height && r_top < d_top + tooltip_height ) {
			if( r_top > d_top ) {
				dist = r_top - d_top;
				midpoint = r_top - (dist / 2);
				$(".disapprove_tooltip").css('top', midpoint - (tooltip_height / 2));
				$(".approve_tooltip").css('top', midpoint + (tooltip_height / 2));
			} else if( r_top < d_top ) {
				dist = d_top - r_top;
				midpoint = d_top - (dist / 2);
				$(".approve_tooltip").css('top', midpoint - (tooltip_height / 2));
				$(".disapprove_tooltip").css('top', midpoint + (tooltip_height / 2));
			} else {
				midpoint = d_top;
				$(".disapprove_tooltip").css('top', midpoint - (tooltip_height / 2));
				$(".approve_tooltip").css('top', midpoint + (tooltip_height / 2));
			}
		}*/
	});

	// Set controls

	$('#chart_reset').click(function() {
		reset_zoom();
		$('.race_charts_button').removeClass('selected');
		$('#chart_max').addClass('selected');
	});
	$('#chart_max').click(function() {
		reset_zoom();
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
	});
	$('#chart_2y').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (YEAR * 2));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_1y').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - YEAR);
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_6m').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (YEAR / 2));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_3m').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (YEAR / 4));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_30d').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (DAY * 30));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_14d').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (DAY * 14));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});
	$('#chart_7d').click(function()
	{
		var date_2 = d3.max(combined_chart, function (d) {
			return d.date;
		});
		var date_1 = new Date(date_2.getTime() - (DAY * 7));
		$('.race_charts_button').removeClass('selected');
		$(this).addClass('selected');
		change_zoom(date_1, date_2);
	});

	$('.chart_datepicker').datepicker({
		minDate: date_min,
		maxDate: date_max
	});

	$('#chart_apply').click(function()
	{
		var date_1 = new Date($('#from_date').val());
		var date_2 = new Date($('#to_date').val());
		$('.race_charts_button').removeClass('selected');
		change_zoom(date_1, date_2);
	});

	/*if( $('#save_chart_image') )
	{
		$('#save_chart_image').click(function()
		{
			var content = $('#chartdiv svg')
				.attr('xmlns', 'http://www.w3.org/2000/svg')
				.attr('version', 1.1)
				.outerHTML().trim();
			var canvas = document.getElementById("chart_canvas");
			console.log(content);
			canvg(canvas, content);
			var svg_img_src = canvas.toDataURL('image/png');
			$('#chart_image').attr('src', svg_img_src);
		});
	}*/

	// Set initial zoom level

	var selected_label;
	if(screen.width <= 414 && typeof $('#chartdiv').attr('data-selected-mobile') !== 'undefined') {
		selected_label = $('#chartdiv').attr('data-selected-mobile');
	} else {
		selected_label = $('#chartdiv').attr('data-selected');
	}
	if(typeof selected_label !== 'undefined' && selected_label.length > 0) {
		$('#chart_'+selected_label).click();
	}

	function zoomed()
	{
		//console.log(d3.event.translate);
		//console.log(d3.event.scale);
		svg.transition().duration(ZOOM_DURATION).select(".x.axis").call(xAxis);
		svg.transition().duration(ZOOM_DURATION).select(".y.axis").call(yAxis);
		svg.transition().duration(ZOOM_DURATION).select(".y_t.axis").call(yAxis_t);
		svg.select(".y.grid")
			.call(make_y_axis()
			.tickSize(-chart_width, 0, 0)
			.tickFormat(""));
		for(var i = 0; i < lines.length; i++)
		{
			svg.transition().duration(ZOOM_DURATION)
				.select(".candidate_line_"+i)
				.attr("d", lines[i]);
		}
		svg.transition().duration(ZOOM_DURATION)
			.select(".spread_area")
			.attr("class", "spread_area")
			.attr("d", area_t);
		svg.transition().duration(ZOOM_DURATION)
			.select(".spread_line")
			.attr("class", "spread_line")
			.attr("d", line_t);
		reset_x_data();
	}

	function brushmove()
	{
		if(typeof brush_race_chart.extent !== 'undefined') {
			var extent = brush_race_chart.extent();
		}
	}

	function brushend()
	{
		if(typeof brush_race_chart.extent !== 'undefined') {
			var dates = brush_race_chart.extent();
			// Return if same date (happens if you single click chart)
			var date_1 = new Date(dates[0]);
			var date_2 = new Date(dates[1]);

			//alert('dates[0]: '+dates[0]);
			//alert('dates[1]: '+dates[1]);

			$('.race_charts_button').removeClass('selected');
			change_zoom(date_1, date_2);
		}
	}

	function change_zoom(date_1, date_2)
	{
		if(date_1.getTime() == date_2.getTime()) {
			return;
		}

		x_domain.domain([date_1, date_2]);

		var zoom_mins = [];
		var zoom_maxs = [];

		for(var i = 0; i < charts.length; i++)
		{
			var min_zoom = d3.min(combined_chart, function (d) {
					var time = d.date.getTime();
					if(date_1.getTime() <= time && date_2.getTime() >= time) {
						if(d.values[i] === null) {
							return 100; // High so the min isn't changed
						} else {
							return parseFloat(d.values[i]);
						}
					}
				});
			var max_zoom = d3.max(combined_chart, function (d) {
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

		var t_min_zoom = d3.min(charts[0], function (d) {
				var time = d.date.getTime();
				if(date_1.getTime() <= time && date_2.getTime() >= time) {
					return d.spread;
				}
			});
		var t_max_zoom = d3.max(charts[0], function (d) {
				var time = d.date.getTime();
				if(date_1.getTime() <= time && date_2.getTime() >= time) {
					return d.spread;
				}
			});

		y.domain([Math.min.apply(Math,zoom_mins), Math.max.apply(Math,zoom_maxs)]);
		y_t.domain([t_min_zoom - 1, t_max_zoom + 1]);

		if(t_min_zoom > 0) {
			area_t.y0(y_t(t_min_zoom - 1));
		} else if(t_max_zoom < 0) {
			area_t.y0(y_t(t_max_zoom + 1));
		} else {
			area_t.y0(y_t(0));
		}

		zoomed();

		d3.select(".brush").call(brush_race_chart.clear());

		min = d3.min(combined_chart, function (d) {
				return d.date;
			});
		max = d3.max(combined_chart, function (d) {
				return d.date;
			});

		/*clear_button.on('click', function(){
			x_domain.domain([min, max]);
			zoomed();
			clear_button.remove();
		});*/
	}

	function reset_x_data()
	{
		x_data = [];
		for(var i = 0; i < combined_chart.length; i++) {
			x_data[i] = x_domain(combined_chart[i].date);
		}
	}

	function reset_zoom()
	{
		min_x = d3.min(combined_chart, function (d) {
				return d.date;
			});
		max_x = d3.max(combined_chart, function (d) {
				return d.date;
			});
		var min_y_arr = [];
		var max_y_arr = [];
		for(var i = 0; i < charts.length; i++)
		{
			var min_y = d3.min(combined_chart, function (d) {
				if(d.values[i] === null) {
					return 100; // high number so the min isn't changed
				} else {
					return parseFloat(d.values[i]);
				}
			});
			var max_y = d3.max(combined_chart, function (d) {
				if(d.values[i] === null) {
					return 0;
				} else {
					return parseFloat(d.values[i]);
				}
			});
			min_y_arr.push(parseFloat(min_y));
			max_y_arr.push(parseFloat(max_y));
		}
		if(typeof chart_spread_0_y_axis !== 'undefined' && chart_spread_0_y_axis == 1) {
			min_y_t = 0; // Forces Spread chart to start y index at 0  // New 3/27/23
		}else {
			min_y_t = d3.min(charts[0], function (d) {
				return d.spread;
			});
		}
		
		max_y_t = d3.max(charts[0], function (d) {
				return d.spread;
			});
		x_domain.domain([min_x, max_x]);
		y.domain([Math.min.apply(Math,min_y_arr), Math.max.apply(Math,max_y_arr)]);
		y_t.domain([min_y_t - 1, max_y_t + 1]);
		if(min_y_t > 0) {
			area_t.y0(y_t(min_y_t - 1));
		} else if(max_y_t < 0) {
			area_t.y0(y_t(max_y_t + 1));
		} else {
			area_t.y0(y_t(0));
		}
		zoomed();
	}

	resize_ok = true;
}

var timeout_resize_ok = false;
var timeout_set = false;
var old_width = 0;

function resize_chart()
{
	if(resize_ok)
	{
		if(timeout_resize_ok)
		{
			//console.log('width: '+parseInt($("#chartdiv").outerWidth()));
			orig_width = parseInt($("#chartdiv").outerWidth());
			chart_width = orig_width - margin.left - margin.right;
			//orig_height = parseInt($("#chartdiv").outerHeight());

			// Resize chart height
			var new_height = '360';
			if(typeof $("#chartdiv").attr('data-chart-height') !== 'undefined')
			{
				if(screen.width <= 414) {
					new_height = $("#chartdiv").attr('data-chart-height-mobile');
				} else {
					new_height = $("#chartdiv").attr('data-chart-height');
				}
				$("#chartdiv").attr('style', 'height:'+new_height+'px');
				chart_height_override = new_height - 40;
				LINE_CHART_HEIGHT = chart_height_override - spread_chart_height;
			}

			if(old_width == chart_width) {
				return;
			}
			old_width = chart_width;

			x_domain.range([0, chart_width - 20]);

			svg.select('.y.axis')
				.call(yAxis);

			for(var i = 0; i < charts.length; i++)
			{
				svg.selectAll('.candidate_line.candidate_line_'+i)
					.attr('d', lines[i]);
			}
			x_ticks = Math.max(Math.floor(orig_width/100), 2);

			timeout_resize_ok = false;

			$('#chartdiv svg').remove();
			generate_chart();
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
