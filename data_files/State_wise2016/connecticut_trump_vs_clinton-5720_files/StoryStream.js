var $StoryStream = {}; //Global var to contain story stream logic

$StoryStream.stories = []; //Container array for cached content items.
                           //Will be filled continuously with story objects.
$StoryStream.stories_to_print = []; //Container array for content items about to be appended to the DOM.
$StoryStream.today = new Date(); //Today's date, will use it to generate initial Month/Year values.
$StoryStream.month = $StoryStream.today.getMonth();
$StoryStream.year = $StoryStream.today.getFullYear();
$StoryStream.is_finished = false; //Flag to tell whether or not to keep trying to append stories.
$StoryStream.scroll_continue_done = true; //Whether the continue_stream from a scroll is finished
$StoryStream.position = 0; //Current position in the global feed array
$StoryStream.limit = 10; //Number of stories to display at a time
$StoryStream.filter = ['entry', 'article', 'tweet', 'image', 'video', 'poll']; // The types to include
$StoryStream.topic = "clinton";
$StoryStream.container;
$StoryStream.print_type = 'stories'; // Can also be 'widget'
$StoryStream.fail_count = 0; // Counts how many 404s have happened
$StoryStream.fail_limit = 24; // How many 404s until it quits.
$StoryStream.date_checker = [];//keeps track of months pulled to prevent the same month from being pulled
$StoryStream.item_tracker = {};//keeps track of double added items to json archives
$StoryStream.blocked_list = ['penis', 'vitamin_d']; //prohibited terms to

all_ads_disabled = false;

$StoryStream.ads_enabled = function(){
    //it will see
    var name = 'topic';
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    var search_query = match && decodeURIComponent(match[1].replace(/\+/g, ' '));


    if(this.blocked_list.includes(search_query)){
        all_ads_disabled = true;
    }

};

$StoryStream.month_num_to_text = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

$StoryStream.finished_callback = function() {
    // Called when finished loading (and 404 limit reached)
    // Meant to be overridden
};

$StoryStream.content_filter = function(type_array) { //Filter feed content
    //Take a content type array
    //and refresh DOM items based on the new rules.
    this.filter = type_array;
    this.visible = 0;
    this.position = 0;
    this.container.html("");
    this.is_finished = false;
    this.continue_stream();
};

$StoryStream.fetch_article = function() {
    //Gets the JSON archive at /json/trending_articles.json
    //YYYY and MM are determined by $StoryStream.year and $StoryStream.month
    //Then, decrement month so next call will grab the previous month.

    var dateparts = new Date(this.year,this.month,01).toISOString().split("-");
    $.ajax({
        dataType: 'json',
        url: "/json/trending_articles.json",
        context: this,
        success: function(data, textStatus, jqXHR) {
            this.decrement_month(); //Prepare for the next month
            
            for(var i=0;i<data.length;i++) {
                this.stories.push(data[i]);
            }
            this.is_finished = true;
            this.continue_stream();
        },
        statusCode: {
            404: function() {
                this.fail_callback();
            },
            403: function() {
                this.fail_callback();
            }
        }
    });
};

$StoryStream.fetch_and_continue_stream = function() {
    //Gets the JSON archive at /topic/{alpha}/{TagName}/YYYY/MM.json
    //YYYY and MM are determined by $StoryStream.year and $StoryStream.month
    //Then, decrement month so next call will grab the previous month.

    if(this.check_dates_grabbed(this.year+'-'+this.month) == 0){
        var dateparts = new Date(this.year,this.month,01).toISOString().split("-");
    }else{
        this.decrement_month();
        var dateparts = new Date(this.year,this.month,01).toISOString().split("-");
    }
    //console.log('here fetch_and_continue_stream top');
    //console.log("/topic/"+this.topic.substring(0, 1)+"/"+this.topic+"/"+dateparts[0]+"/"+dateparts[1]+".json?v=1");
    $.ajax({
        dataType: 'json',
        url: "/topic/"+this.topic.substring(0, 1)+"/"+this.topic+"/"+dateparts[0]+"/"+dateparts[1]+".json?v=1",
        context: this,
        success: function(data, textStatus, jqXHR) {
            //console.log('here - fetch_and_continue_stream success');
            this.decrement_month(); //Prepare for the next month

            for(var i=0;i<data.length;i++) {
                this.stories.push(data[i]);
            }

            this.continue_stream();
        },
        statusCode: {
            404: function() {
                //console.log('here 404 - fetch_and_continue_stream fail');
                this.fail_callback();
            },
            403: function() {
                //console.log('here 403 - fetch_and_continue_stream fail');
                this.fail_callback();
            }
        }
    }).complete(function(jqXHR, textStatus) {
       // console.log('jqXHR');
        //console.log(jqXHR);
        //console.log('textStatus');
        //console.log(textStatus);
    });
};

$StoryStream.check_dates_grabbed = function(current_date) {
    var found = 0;
    for(var i in this.date_checker){
        if(this.date_checker[i] == current_date){
            found = 1;
            break;
        }
    }

    if(found == 0){
        this.date_checker.push(current_date);
    }

    return found;
}

$StoryStream.fail_callback = function() {

    this.fail_count++;
    //If fetching the month failed past the fail limit,
    //assume there are no more feeds.
    if(this.fail_count >= this.fail_limit) {
        this.is_finished=true;
        this.finished_callback();
    } else {
        this.decrement_month();
        this.fetch_and_continue_stream();
    }
};

$StoryStream.print_stories = function(stories_array) {
    //Adds entries to DOM
    var story_strings = [];
    var display = "block";
    
    for(var i=0; i<stories_array.length; i++) {
        if(this.filter.indexOf(stories_array[i].type) != -1) {
            this.visible++;
            story_strings.push(
               "<div style=\"display: "+display+"\" class=\"content_item "+stories_array[i].type+"\">"
            );
            var heading1 =  	typeof(stories_array[i].heading1)!=="undefined"?stories_array[i].heading1:"";
            var heading2 =  	typeof(stories_array[i].heading2)!=="undefined"?stories_array[i].heading2:"";
            var date =		    typeof(stories_array[i].date)!=="undefined"?stories_array[i].date:"";
            var content_url = 	typeof(stories_array[i].content_url)!=="undefined"?stories_array[i].content_url:"";
            var img_url =   	typeof(stories_array[i].img_url)!=="undefined"?stories_array[i].img_url:"";
            var body =		    typeof(stories_array[i].body)!=="undefined"?stories_array[i].body:"";
            var type =		    typeof(stories_array[i].type)!=="undefined"?stories_array[i].type:"";
            var tags =		    typeof(stories_array[i].tags)!=="undefined"?stories_array[i].tags:"";
            var score =         typeof(stories_array[i].score)!=="undefined"?stories_array[i].score:"";

            story_strings.push("<p><strong>"+type+": <a href='"+content_url+"'>"+
            heading1+"</a></strong> - "+date+"</p>");
            if(img_url) {
                story_strings.push("<img class='content_img' src='"+img_url+"'>");
            }
            story_strings.push("</div>");
        }
    }
   this.container.append(story_strings.join(""));
};

$StoryStream.print_stories_widget = function(stories_array) {

    var story_strings = [];

    for(var i=0; i<stories_array.length; i++)
    {
        if(this.filter.indexOf(stories_array[i].type) != -1)
        {
            this.visible++;

            var heading1 =      typeof(stories_array[i].heading1)!=="undefined"?stories_array[i].heading1:"";
            var heading2 =      typeof(stories_array[i].heading2)!=="undefined"?stories_array[i].heading2:"";
            var date =          typeof(stories_array[i].date)!=="undefined"?stories_array[i].date:"";
            var type =          typeof(stories_array[i].type)!=="undefined"?stories_array[i].type:"";
            var content_url =   typeof(stories_array[i].content_url)!=="undefined"?stories_array[i].content_url:"";
            var img_url =       typeof(stories_array[i].img_url)!=="undefined"?stories_array[i].img_url:"";
            var body =          typeof(stories_array[i].body)!=="undefined"?stories_array[i].body:"";
            var id =            typeof(stories_array[i].id)!=="undefined"?stories_array[i].id:"";
            
            var id_num = id != '' ? id.split('-')[1] : '';

            var item_date = new Date(date);

            var li_class = type;

            story_strings.push('<li class="'+li_class+'">');
            story_strings.push('<div class="content_wrapper">');

            story_strings.push('<div class="item_date" data-ms="'+item_date.getTime()+'"></div>');
            
            if(type == 'tweet') {
                story_strings.push('<blockquote class="twitter-tweet" lang="en">');
                story_strings.push('<p lang="en" dir="ltr">'+body+'</p>');
                story_strings.push('&mdash; '+heading1+' (@'+heading2+') <a href="https://twitter.com/'+heading2.toLowerCase()+'/status/'+id_num+'">'+this.month_num_to_text[item_date.getMonth()]+' '+item_date.getDate()+', '+item_date.getFullYear()+'</a>');
                story_strings.push('</blockquote>');
                story_strings.push('<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>');
            } else {
                story_strings.push('<div class="title"><a href="'+content_url+'">'+heading1+'</a></div>');
            }
            if(img_url && type != 'tweet') {
                story_strings.push('<a href="'+content_url+'"><img class="content_img" src="'+img_url+'" alt="'+heading1+'"></a>');
            }

            story_strings.push('</div>');
            story_strings.push('</li>');
        }
    }

    this.container.append(story_strings.join(""));
};

$StoryStream.decrement_month = function() {
    var newdate = new Date(this.year, this.month-1, 1);
    this.year = newdate.getFullYear();
    this.month = newdate.getMonth();
};

$StoryStream.continue_stream = function() {

    //Append items from the feed, up to 10
    for(var i=this.position; i<this.stories.length; i++ ){ //Loop through the whole collection if necessary
        if(typeof(this.stories[i])!=="undefined" && this.filter.indexOf(this.stories[i].type) != -1) { //If the filter wants this item, add it
            this.stories_to_print.push(this.stories[i]);
        }
        this.position++;
        if(this.stories_to_print.length >= this.limit) { break; } //Quit the loop early if enough are found
    }
    
    //Otherwise get the next feed and repeat
    //  (unless there are no more feeds)
    if(!this.is_finished && this.stories_to_print.length < this.limit) {
        this.fetch_and_continue_stream();
    } else {
        this.scroll_continue_done = true;
    }
    
    if(this.print_type == 'stories') {
        this.print_stories(this.stories_to_print); //Prints and increments "visible"
    } else if(this.print_type == 'widget') {
        this.print_stories_widget(this.stories_to_print); //Prints and increments "visible"
    }
    this.stories_to_print = [];

    this.finished_callback();
};

$StoryStream.ads_enabled();
