// FUNCTIONS / VARIABLES USED BY ALL OUR RCMG ACCOUNT SCRIPTS

var dyn_verticals = [
    'www1.realclearpolitics.com',
  'www1.realclearmarkets.com',
  'www1.realclearscience.com',
  'www1.realcleardefense.com',
  'www1.realclearworld.com',
  'www1.realclearhistory.com',
  'www1.realclearpolicy.com',
  'www1.realclearenergy.org',
  'www1.realclearhealth.com',
  'www1.realclearreligion.org',
  'www1.realcleareducation.com',
  'www1.realclearbooks.com',
  'www1.realclearinvestigations.com'
];

// Moved this to master
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getDomain(){
  var path = window.location.host;
  if(path.substr(0,3)=='www'){
    var per=path.indexOf('.')
    per=per+1;
    path=path.substr(per);
  }
  return path;
}

function validEmail(email){      
  var emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailReg.test(email); 
}

// Cookie functions
// From: plainjs.com example

function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}

function setCookie(name, value, days) {

    var d = new Date;
    d.setTime(d.getTime() + 24*60*60*1000*days);

    var cookie_domain_clean = document.domain.replace("www.", "");
    cookie_domain_clean = cookie_domain_clean.replace("www1.", "");

    document.cookie = name + "=" + value + ";path=/;domain=."+cookie_domain_clean+";expires=" + d.toGMTString();
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie(name) { 

  setCookie(name, '', -1); 

  // Temp... leave running for a bit to clear people's old version of cookies,
  // where we did www.realclearpolitics.com instead of .realclearpolitics.com
  var d = new Date;
  d.setTime(d.getTime() + 24*60*60*1000*(-1));
  document.cookie = name + "=;path=/;expires=" + d.toGMTString();
}

// OUR cookie functions

function token_cookies_exist() {

  if(getCookie('rcmg_token') && getCookie('rcmg_guid')) {
    return true;
  }
  return false;
}

function clear_token_cookies(refresh_after) {

  if(typeof refresh_after === 'undefined') {
    refresh_after = false;
  }

  deleteCookie('rcmg_token');
  deleteCookie('rcmg_guid');
  deleteCookie('ev_ss');
  deleteCookie('ex_ss');
  deleteCookie('rcmg_username');
  deleteCookie('evaf');
  deleteCookie('rcmg_newsletters');
  deleteCookie('rcmg_unique_id');
  deleteCookie('user_access');

  // Loop through all verticals (except current) to set cookies

  for(var i = 0; i < dyn_verticals.length; i++) {

    var domain_arr = dyn_verticals[i].split('.');
    var current_domain = domain_arr[domain_arr.length - 2];

    // Remove www1.realclearworld.com once it has https on www1
    if(domain_clean != current_domain /*&& dyn_verticals[i] != 'www1.realclearworld.com'*/) {

      $.getJSON('//'+dyn_verticals[i]+'/asset/top/rcmg_users_v2/rcmg_vertical_sign_out.php?jsoncallback=?', 
      function(data) {
        reload_when_verticals_done_delete(refresh_after); 
      }.bind(refresh_after));
    } else {
      // Runs the callback manually
      reload_when_verticals_done_delete(refresh_after);
    }
  }
}

var reload_counter_delete = 0;

function reload_when_verticals_done_delete(refresh_after) {
  reload_counter_delete++;
  if(reload_counter_delete >= dyn_verticals.length) {

    if(refresh_after) {
      console.log('refresh after delete');
      location.reload(true);
    }
    reload_counter_delete = 0;
  }
}

// POLYFILLS //

// .bind(), used for controlling scope in callback or async-run functions
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype; 
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
function clone_obj(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone_obj(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone_obj(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// RCMG API ////////////////////////////////////////////////////////////////////

function rcmg_api_call(method, post_data, callback) {

  // Evolok testing
  if(getUrlParameter('evo_test') == 'true') {
    post_data['evo_test'] = true;
  }

  // Add site data
  post_data['site'] = getDomain();

  var now_time = new Date().getTime();

  $.ajax({
    url: window.location.protocol + "//util.realclearpolitics.com/rcmg_users_v2/api.php?cache_bust="+now_time+"&method="+method+"&jsoncallback=?",
    type: "POST",
    crossDomain: true,
    data: post_data,
    success: callback,
    statusCode: {
      500: function() {
        console.log('500 error');
        // Report this 500 error for diagnostics
        $.getJSON(window.location.protocol + "//util.realclearpolitics.com/rcmg_users_v2/error_500.php?method="+method, function(response) {
          console.log('-------- RCMG API ERROR --------');
        });
      }.bind(method)
    }
  });
}

/*
this function will subscribe users using a maichimp exclusive method
when users unsubscribe from all the newsletters at the bottom of the email we can't subscribed them again with the api
so we need this function allong with an embeded form you have to create in mailchimp
since we are using our own ajax call I recommend remmoving all the JS script that comes with the original form
@input: takes selection of the form
@return: a callback for success and error
@action: sends post request to mailchimp
*/
function mc_embedded_subscribe (mc_form, callback) { // this calls mailchimp
  $.ajax({
      type        : mc_form.attr('method'),
      url         : mc_form.attr('action').replace('/post?', '/post-json?').concat('&c=?'), //important to make ajax request work from our end
      data        : mc_form.serialize(), //serialize the form data
      cache       : false,
      dataType    : 'json',
      contentType : "application/json; charset=utf-8",
      error       : function(jqXHR, exception ) { //error handling
          var msg = '';
          if (jqXHR.status === 0) {
              msg = 'Not connect.\n Verify Network.';
          } else if (jqXHR.status == 404) {
              msg = 'Requested page not found. [404]';
          } else if (jqXHR.status == 500) {
              msg = 'Internal Server Error [500].';
          } else if (exception === 'parsererror') {
              msg = 'Requested JSON parse failed.';
          } else if (exception === 'timeout') {
              msg = 'Time out error.';
          } else if (exception === 'abort') {
              msg = 'Ajax request aborted.';
          } else {
              msg = 'Uncaught Error.\n' + jqXHR;
          }
          rcmg_api_call('mc_error_email', { // get user newsletters again after form submit
              error_message : msg,
              failure_url  : window.location.href,
          }, function(response) {
              console.log('-------- MC ERROR --------');
              console.log(response);
            });
          
          },
          success     : callback
      });
    }
    
function rcmg_api_first_error(messages) {

  for(var i = 0; i < messages.length; i++) {
    if(!messages[i].success) {
      return messages[i].message;
    }
  }

  return 'Unspecified error.';
}

function load_PM_lib() {

	// Init Product Management widgets... needed for all to work.

  var pmDomain = "https://rcp.evolok.net/pm/api/v2";
  var stripeKey = "pk_live_HMAmIvW53TwP4iFdxIWpBx9J";

  // Use live key and url, unless querystring parameter designates a test env
  if(getUrlParameter('evo_test') == 'true') {
    pmDomain = "https://rcp.uat.evolok.net/pm/api/v2";
    stripeKey = "pk_test_DsMdGIQm0JaudOgUcCKdHHto";
  }

	EV.PM.init({
	  pmDomain: pmDomain,
	  version: 2,
	  stripeKey: stripeKey
	});
}

/*Toastr Options Globaly*/
if(typeof toastr !== 'undefined'){
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "200",
        "hideDuration": "500",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

}



