// JavaScript Document
//it veritfys that the signup form form from the modal gets filled out correctlly

$(document).ready(function () {
  rcmg_auth();
});

var confirm_same_email = 'We notice you are attempting to log in with an email address different from the one used to purchase an ad-free experience. If this is intentional, click OK. If not, please cancel and fill the email used to purchase ad-free.';

var domain = document.domain;
domain = domain.replace(".com", "").replace(".org", "");
var domain_clean = domain.replace("www.", "");
domain_clean = domain_clean.replace("www1.", "");
var domain_abbr;

if( domain_clean == "realclearpolitics" ){
  domain_abbr = 'RCP';
}else if( domain_clean == "realclearworld" ){
  domain_abbr = 'RCW';
}else if( domain_clean == "realcleardefense" ){
  domain_abbr = 'RCD';
}else if( domain_clean == "realclearmarkets" ){
  domain_abbr = 'RCM';
}else if( domain_clean == "realclearscience" ){
  domain_abbr = 'RCS';
}else if( domain_clean == "realclearhistory" ){
  domain_abbr = 'RCH';
}else if( domain_clean == "realclearpolicy" ){
  domain_abbr = 'RCP';
}else if( domain_clean == "realclearreligion" ){
  domain_abbr = 'RCR';
}else if( domain_clean == "realclearenergy" ){
  domain_abbr = 'RCE';
}else if( domain_clean == "realclearbooks" ){
  domain_abbr = 'RCE';
}else if(domain_clean == 'americanthinker'){
    domain_abbr = 'AT';
}else{
  domain_abbr = 'RealClear';
}

//function to see if someone is signed in
function rcmg_auth() {

  var auth_content = '';
  //if signed in cookie exists, display accordingly
  if (getCookie('rcmg_guid')) {

    auth_content = rcmg_auth_in(); //username|signout menu
    $('.rcmg_auth').html(auth_content);

    $("#comments-container").show();
    $(".comments-count .show").hide();
    $(".comments-count .hide").show();
    if(typeof rcp_page_refresh_interval !== 'undefined') {
      clearInterval(rcp_page_refresh_interval); //CLEARS THE REFRESH INTERVAL SET ON rcp.js
    }

  } else {
    auth_content = rcmg_auth_out(); //signed out menu -> signup|signin        
    $('.rcmg_auth').html(auth_content);
  }

  var rcmg_user_link = $(".rcmg_auth a");

  $(rcmg_user_link).click(function () {
    var rcmg_user_link_class = $(this).attr("class");

    //alert(rcmg_user_link_class);

    if (rcmg_user_link_class == "rcmg_sign_in") { //pass "register"
      loginModal.loadModal("sign-in-up");

      loginModal.login_success = function (fn_ln_exist) {
        
        rcmg_auth();

          if(siteName == 'politics') {
              login_spot_im();
          }else if(siteName == 'americanthinker.com'){
              location.reload();
          } else {
              //location.reload();
          }
      };

    } else if( rcmg_user_link_class == "rcmg_register" ){
      loginModal.loadModal("register");

      /*loginModal.login_success = function (fn_ln_exist) {
        location.reload();
      };*/
    } else if (rcmg_user_link_class == "rcmg_sign_out") {
      //call sign out func and kill cookies then rewrite links to sign up.. \ sign in...
      var refresh_after = true;
      /*if(siteName == 'politics') { this is cousing errors
        refresh_after = false;
      }*/
      rcmg_sign_out(refresh_after);

      /*loginModal.login_success = function (fn_ln_exist) {
        location.reload();
      };*/

    } else if (rcmg_user_link_class == "rcmg_account") {
      //log user into dashboard and redirect to profile tab...
      location.assign('/dashboard/');
    }
  });
}

function rcmg_auth_out() {
  var content = '';

  //CHECK IF DISQUS COMMENTS MODULE IS ON THE PAGE
  //if(document.getElementById("disqus_thread")){
  if ($("#disqus_thread").length > 0) {
    //content += '<div class="comments-missing-permissions">You must be logged in to post a comment.</div>';
  }
  //content += '<a class="sign_up_pop" href="javascript:void(\'0\');">Sign up</a> | <a class="sign_in_pop" href="javascript:void(\'0\');">Sign in</a>';

  content += '<div class="logged_in_to_comment">You must be logged in to comment.</div><span class="rcmg_user_account_label">' + domain_abbr + ' Account:</span> <a class="rcmg_sign_in" href="javascript:void(\'0\');">Login</a>  <a class="rcmg_register" href="javascript:void(\'0\');">Register</a>';

  return content;

}

function rcmg_auth_in() {
  var welcome_message = 'Account Info';

  if (getCookie('rcmg_username')) {
    welcome_message = getCookie('rcmg_username') + '\'s account';
    welcome_message = welcome_message.replace('+', ' ');
  }
  return '<span class="rcmg_user_account_label">' + domain_abbr + ' Account:</span> <a class="rcmg_account" href="javascript:void(\'0\');">'+welcome_message+'</a>  <a class="rcmg_sign_out" href="javascript:void(\'0\')">Sign out</a>';
}

function rcmg_sign_out(refresh_after) {
  
  if(typeof refresh_after === 'undefined') {
    refresh_after = false;
  }

  if( siteName == 'politics' || siteName == 'markets' || siteName == 'science' || siteName == 'world' || siteName == 'defense' || siteName == 'history' || siteName == 'policy' || siteName == 'religion' || siteName == 'energy' || siteName == 'books' || siteName == 'florida' || siteName == "pennsylvania" || siteName == "publicaffairs"){
      EV.Core.UI.logout();// this function only needs to get triggered for the verticals that have Evolok
  }
    
  clear_token_cookies(refresh_after);
  rcmg_auth();


  //this is only going to affect AT
    if(siteName == 'americanthinker.com'){
        if(typeof logout_disqus === 'function') {
            logout_disqus();
        } else if(typeof logout_vuukle === 'function') {
            logout_vuukle();
        }
    } else {
        if(typeof logout_spot_im === 'function') {
            logout_spot_im();
        }
    }

}

/*AT Disqus OATH*/
function add_diqus_user()
{
    disqus_at_ping();
}

function disqus_at_receiveMessage(event)
{
    if(event.origin !== 'http://util.realclearpolitics.com')
        return;

    setCookie('vuukle_sso_auth', event.data.data.auth_token, 365);

    add_sso_response(event.data);

    $('.disqus-login').remove();
    vuukleSSO();

    location.reload();

}

function disqus_at_ping(){
    window.open('https://disqus.com/api/oauth/2.0/authorize/?client_id=3gB4b312qWfqyQdXqw6DPdw8cJKMeh5NLdQmU88jwLcyWtCmGp18FrU9vv3jNxxy&scope=read,write,email&response_type=code&redirect_uri=http://util.realclearpolitics.com/rcmg_users_v2/disqus_oath_api.php','','width=400,height=400,scrollbars=yes');
}


$(document).on('click', '.disqus-oath',function (e) {
    add_diqus_user();
});


window.addEventListener("message", disqus_at_receiveMessage, false);


/*AT Disqus Oath end*/


function rcmg_register() {

  confirmSignUp();


  // CHECKS THE EMAIL MAKE SURE IT DOES NOT ALREAY EXIST

}

function rcmg_sign_in() {

  var verified = true;
  var errorString = '';

  var user_email = $('#signin-user input[name=user-email]').val();
  var user_username = $('#signin-user input[name=user-email]').val();
  var user_password = $('#signin-user input[name=password]').val();
  

  errorString = '';

  //ads the processing ajax loader
    $('.left-side .submit-wrapper a.sign-in').html('<span class="processing"><img style=" top:0; width:42px; height: 42px; position: absolute; transform:translate(-50%); left:50%" src="/asset/top/rcmg_users_v2/loader.gif" /></span>');


    var has_amp = user_email.indexOf('@') !== -1 //true
    var has_dot = user_email.indexOf('.') !== -1 //true
    var is_username = false;
    //var user_username = '';
    
    if( has_amp && has_dot ){
       if (validEmail(user_email) == false || user_email == '') {
            verified = false;
            errorString = '*Email address not valid.';
            $('#signin-user label[for=email]').text(errorString).addClass('txt-error');
        }
    }else{

        if(user_username == ''){ // username/email can not be empty
            verified = false;
            errorString = '*UserName/Email Can Not Be empty';
            $('#signin-user label[for=email]').text(errorString).addClass('txt-error');

        }

        is_username = true;
        user_email = '';
    }

  if (user_password == '') {
    verified = false;
    errorString = '*Please fill in password field.';
    $('#signin-user label[for=password]').text(errorString).addClass('txt-error');
    $('#signin-user label[for=password]').append(' <a href="javascript:void(0);" class="forgot-ep sign-in-up" data-trigger="forgot_credentials">(Forgot Password?)</a>');
  }

  if(verified == false){
      $('.left-side .submit-wrapper a.sign-in').html('Sign in');

  }

  if (verified == true) {

    if( readCookie('rcmg_purchase_email') && readCookie('rcmg_purchase_email') != user_email) {
      
      if(window.confirm(confirm_same_email)) {
        // continue
      } else {
        $('label[for=email]').html("The email you purchased with was "+readCookie('rcmg_purchase_email')).addClass('txt-error');
        $('#signin-user input[name=user-email]').addClass('fill');
        $('#signin-user input[name=user-email]').val('');
        $('#signin-user input[name=user-email]').focus();
        $('#signin-user input[name=user-email]').prop('autofocus');
        $('.left-side .submit-wrapper a.sign-in').html('Sign in');
        return;
      }
    }
    rcmg_api_call('form_login', {
      userAgent: navigator.userAgent,
      WURFL: window.WURFL,
      email: user_email,
      username: user_username,
      password: user_password,
      rcmg_system: 0
    }, function(response) {

      if (response.success) {

        var reload_on_login = true;

        loginModal.loadModal('close');

        if(getUrlParameter('action') == 'login_after_email_confirm_subscription') {
          window.location.href = '//'+window.location.hostname;
        }

        loginModal.login_success(response.data.fn_ln_exist);

        rcmg_setLocalCookies(
          {
              guid: response.data.rcmg_guid,
              token: response.data.rcmg_token,
              username: response.data.rcmg_username,
              ev_ss: response.data.ev_ss,
              ex_ss: response.data.ex_ss,
              accu_weather_loc_key: response.data.accu_weather_loc_key,
              has_evaf: response.data.has_evaf,
              rcmg_newsletters: response.data.rcmg_newsletters,
              is_unsubscribed: response.data.is_unsubscribed,
              rcmg_product_type: response.data.rcmg_product_type,
              rcmg_liveramp: response.data.rcmg_liveramp,
              user_access: response.data.user_access,
          },
          reload_on_login
        );

      } else if ( !response.success ) {

        // if password error
        if(typeof response.data.password_error !== 'undefined') {
            $('label[for=email]').html('Email/Username').removeClass('txt-error');

            $('label[for=password]').html(response.data.password_error).addClass('txt-error');
            $('#signin-user input[name=password]').addClass('fill');
            $('#signin-user input[name=password]').val('');

        }

        // if no password set on account
        if (typeof response.data.no_pwd_error !== 'undefined') {

          $('label[for=password]').html(response.data.no_pwd_error).addClass('txt-error');
          $('#signin-user input[name=password]').addClass('fill');
      }

        // if email error
        if(typeof response.data.email_error !== 'undefined') {

          $('label[for=email]').html(response.data.email_error).addClass('txt-error');
          $('#signin-user input[name=email]').addClass('fill');
          $('#signin-user input[name=email]').val('');
          $('#signin-user input[name=password]').val('');
        }

        if(typeof response.data.confirmed_email_required !== 'undefined'){

            var html = '<div class="requires-user-confirmation-email">' +
                '        <div class="error">' +
                '           <p> '+ response.data.confirmed_email_required + '</p>' +
                '           <p>If you cannot find your confirmation email, even after checking spam folder, please <a href="https://www.realclearpolitics.com/contact.html">contact us</a> and we will help you as soon as we can.</p>'+
                '        </div>' +
                '    </div>';

            $('.loginform').html(html);

        }

        $('.left-side .submit-wrapper a.sign-in').html('Sign in');

        // email not found error not yet handled

      }
    });

  }
}

function confirmSignUp() {

  var dataVerified = verifyData('.required');

    if(typeof processing != "undefined" && processing == true){
        return;
    }

  if (dataVerified) {
      processing = true;
      //$('#login-form-signup input[type=submit]').attr('disabled', true);
      //$('.left-side .submit-wrapper').append('<span class="processing">processing...<img src="//util.realclearpolitics.com/comments/images/spinner_email.gif" /></span>');
      $('.submit-wrapper.register-btn').html('<span class="processing"><img style=" top:0; width:42px; height: 42px; position: absolute; transform:translate(-50%); left:50%" src="/asset/top/rcmg_users_v2/loader.gif" /></span>');


      var c = $('#login-form-signup');
    var zelda = c.find('input[name=zelda]').val();
    var user_email = c.find('input[name=email]').val();
    var display_name = c.find('input[name=name]').val();
    var first_name = c.find('input[name=first_name]').val();
    var last_name = c.find('input[name=last_name]').val();
    var user_pass = c.find('input[name=pass]').val();
    var user_pass_again = c.find('input[name=passconfirm]').val();


    if (zelda == '') {
      var current_loc = window.location.pathname;

      rcmg_api_call('form_register', {
        user_email:          user_email,
        user_password:       user_pass,
        user_password_again: user_pass_again,
        user_name:           display_name,
        user_first_name:     first_name,
        user_last_name:      last_name,
        redirect_to:         'https://' + location.host + current_loc,
        zelda:               zelda,
          site:             getDomain()
      }, function(response) {

        if (response.success) {

          if(typeof response.data.confirmed_after_purchase !== 'undefined' && response.data.confirmed_after_purchase) {
            //window.location.href = '//'+window.location.hostname;
            location.reload(true);
          }

          loginModal.register_success = true;
          loginModal.loadModal('confirmation');
          $('.processing').remove();

        } else {

          $('.change-header').html('');
          $('#login-form-signup').html('');
          $('.errorDisplay').html(rcmg_api_first_error(response.messages));
          $('.processing').html('');

          //Error occured placed the button back
            $submit_btn = '<input type="submit" class="btn btn-center submit register" data-trigger="confirmation" value="Register">';
            $('#login-form-signup .submit-wrapper.register-btn').html($submit_btn);

        }
          processing = false;

        $('.think').html('');
      });
    }
  }
}

function verifyData(toVerify) {
  var verified = true;
  var errorString = '';
  var c = $('#login-form-signup');
  var name = c.find('input[name=name]').val();
  var email = c.find('input[name=email]').val();
  var password = c.find('input[name=pass]').val();
  var password_again = c.find('input[name=passconfirm]').val();
  var invalid_user_email_confirm = $('input[name=invalid_user_email_confirm]').is(':checked');



  $('' + toVerify + '').each(function () {
    if (this.value == "") {
      $(this).addClass("fill");
      verified = false;
    } else {
      $(this).removeClass("fill");
    }
  });

  //alert(verified+'none empty');
    //skip this if user email comes back as invalid email for the second time or more

if(invalid_user_email_confirm == false){

    if (!validEmail(email) && c.find('input[name=email]').val()) {
        verified = false;
        c.find('input[name=email]').addClass("fill");
        errorString = '*Email address not valid.';
        c.find('label[for=email]').text(errorString);
        c.find('label[for=email]').addClass('txt-error');

    }
}




  if (password != c.find('input[name=passconfirm]').val()) {
    verified = false;
    c.find('input[name=passconfirm]').addClass("fill");
    errorString = '*Passwords do not match.';
    c.find('label[for=passConfirm]').text(errorString);
    c.find('label[for=passConfirm]').addClass('txt-error');
  }

  if (verified == false) {
    errorString += '<div>*Highlighted fields are invalid or missing. </div>';
    $('#errorDisplay').html(errorString);
  } else {
    $('.errorDisplay').html('');
  }

  return verified;

}

function validEmail(email) {
  var emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailReg.test(email);
}

function rcmg_forgot_pass() {

    var user_email = $('#forgot_credentials input[name=user-email]').val();
    var zelda = $('#forgot_credentials input[name=zelda]').val();
    var user_displayname = $('#forgot_credentials input[name=user_displayname]').val();

    if(user_email.length > 0 || user_displayname.length > 0){

    if(user_email.length > 0 && !validEmail(user_email)) {

      $('#forgot_credentials input[name=user-email]').addClass('fill');
      $('#forgot_credentials label[for=email]').text('Email Address Not Valid')

        } else {

        var btn_submit = '<input type="submit" value="Reset" class="btn btn-center forgot_credentials">';

        $('#forgot_credentials .submit-wrapper').html('<div class="loading" style="display:block !important;"><img alt="loading" src="/asset/top/rcmg_users_v2/loader.gif" /></div>');

        $('.errorDisplay').html('');

        if (zelda == '') {

            rcmg_api_call('request_new_password', {
                zelda: zelda,
                user_email: user_email,
                siteName: getDomain(),
                user_displayname: user_displayname
            }, function (response) {

                if (response.success) {
                    $('#forgot_credentials').html(response.messages[0]['message']);
                } else {

                    if(user_email.length > 0){
                        $('label[for=email]').text(response.messages[0].message);
                    }else if(user_displayname.length > 0) {
                        $('label[for=user_displayname]').text(response.messages[0].message);
                    }else{
                        $('.errorDisplay').html(rcmg_api_first_error(response.messages));
                    }

                    $('#forgot_credentials .submit-wrapper').html( btn_submit );

                }

            });
        }
    }


    }else{
        $('.errorDisplay').html("We need your email or your username to continue");
    }

}

// function rcmg_setLocalCookies(guid, token, username, ev_ss, ex_ss, refresh_after, accu_weather_loc_key, has_evaf, rcmg_newsletters, rcmg_product_type = null) {
function rcmg_setLocalCookies(cookie_array, refresh_after) {
    if (typeof refresh_after === 'undefined') {
        refresh_after = false;
    }

    let accu_weather_loc_key = cookie_array['accu_weather_loc_key'] || null;
    let has_evaf = cookie_array['has_evaf'] || false;

  console.info('Console: hit cookie function to log in globally!!!');

  deleteCookie('rcmg_purchase_email');

  deleteCookie('rcmg_guid');
  deleteCookie('rcmg_token');
  deleteCookie('ev_ss');
  deleteCookie('ex_ss');
  deleteCookie('rcmg_username');
  deleteCookie('rcmg_newsletters');
  deleteCookie('is_unsubscribed'); //this is for mailchimp newsletter master list
  deleteCookie('rcmg_product_type');
  deleteCookie('rcmg_unique_id');
  deleteCookie('user_access');

  if(accu_weather_loc_key){
  deleteCookie('accu_weather_loc_key');
  }

  if(has_evaf){
      deleteCookie('evaf');
  }

    /*
    * Updating cookies expiration to last 365 days
    * keeping trak of when a user login
    * */
    setCookie('rcmg_guid', cookie_array['guid'], 365);
    setCookie('rcmg_token', cookie_array['token'], 365);
    setCookie('ev_ss', cookie_array['ev_ss'], 365);
    setCookie('ex_ss', cookie_array['ex_ss'], 365);
    setCookie('rcmg_username', cookie_array['username'], 365);
    setCookie('rcmg_newsletters', cookie_array['rcmg_newsletters'], 365);
    setCookie('is_unsubscribed', cookie_array['is_unsubscribed'], 365);
    setCookie('rcmg_product_type', cookie_array['rcmg_product_type'], 30);
    setCookie('rcmg_unique_id', cookie_array['rcmg_liveramp'], 365);
    if(cookie_array['user_access'] != false) {
      setCookie('user_access', cookie_array['user_access'], 365);
    }

  if(accu_weather_loc_key){
      setCookie('accu_weather_loc_key', accu_weather_loc_key, 365);
  }

  if(has_evaf){
      createCookie('evaf','1','365');
  }

  if (typeof parent !== 'undefined' && siteName == 'amerianthinker.com') {
      parent.postMessage('mrfLoginConfirmed', 'https://www.americanthinker.com');
  }


  // Loop through all verticals (except current) to set cookies only if site is not american thinker

  /*Flag to temprary disable masslogin on all our sites*/
  var mass_login = false;

  if (siteName != 'americanthinker.com') {

      for (var i = 0; i < dyn_verticals.length; i++) {

          var domain_arr = dyn_verticals[i].split('.');
          var current_domain = domain_arr[domain_arr.length - 2];


            // Remove www1.realclearworld.com once it has https on www1



          if (domain_clean != current_domain /*&& dyn_verticals[i] != 'www1.realclearworld.com'*/) {

                var dyn_data = {
                  rcmg_guid: encodeURIComponent(cookie_array['guid']),
                  rcmg_token: encodeURIComponent(cookie_array['token']),
                  rcmg_username: encodeURIComponent(cookie_array['username']),
                  ev_ss: encodeURIComponent(cookie_array['ev_ss']),
                  ex_ss: encodeURIComponent(cookie_array['ex_ss']),
                  rcmg_unique_id: encodeURIComponent(cookie_array['rcmg_liveramp']),
                  user_access : encodeURIComponent(cookie_array['user_access']),
                };

                if(dyn_verticals[i] == 'www1.realclearpolitics.com'){
                    //this is to test
                    $.ajax({
                        url: '//' + dyn_verticals[i] +  '/asset/top/rcmg_users_v2/rcmg_vertical_sign_in.php?jsoncallback=?',
                        data : { 'rcmg_token' : cookie_array['token']},
                        dataType: 'json',
                        complete : function(res){
                            console.log(res);
                        }
                    });
                }

                $.getJSON('//' + dyn_verticals[i] + '/asset/top/rcmg_users_v2/rcmg_vertical_sign_in.php?jsoncallback=?', dyn_data,
                    function (data) {
                        console.log(data);
                    }
                  ).complete(function() { // Happens on success OR fail
                    reload_when_verticals_done(refresh_after);
                  }.bind(refresh_after));


          } else {
              console.log('callback immediately');
              // Runs the callback manually
              reload_when_verticals_done(refresh_after);
          }

      } //end of for loop
  }

}

var reload_counter = 0;

function reload_when_verticals_done(refresh_after) {
  
  reload_counter++;
  //console.log('inside callback, counter : '+reload_counter);
  if(reload_counter >= dyn_verticals.length) {

    if(refresh_after) {
      //console.log('refresh after');
      location.reload(true);
    }
    reload_counter = 0;
  }
}

var sso_data = {
  sso_type : '',
  orig_response : {},
  display_name : ''
}

function add_sso_response(response) {

  // This requires the existance of 'sso_data' object on window

  if(response.success) {

    if(response.data.display_name_taken) {

      //new user from facebook
      //load the modal for the user to enter a display name that does not exist in the system
      loginModal.loadModal('enter_username', '');
      $('.errorDisplay').html(response.messages[0]['message']);
      $('#username_exist input[name=user_email]').val(response.data.email);
      $('#username_exist input[name=sso_type]').val(sso_data.sso_type);          
    
    } else if(response.data.status == 'tos_needed') {

      // Ask user to accept ToS and Privacy

      // Create Modal Styles
      var tos_modal_style = document.createElement('style');
      var tos_modal_css = '\
        .tos_modal { background: rgba(0,0,0,0.5); position: absolute;top:0;bottom:0;left:0;right:0;z-index:9999999999999; }\
        .tos_modal_inner { text-align: center; background: white; box-shadow: 2px 2px 2px 2px #505050; padding: 20px; position: fixed;top: 50%;left:50%;transform: translate(-50%, -50%);box-sizing:border-box;min-width:320px; border: solid 2px #36a3f0;}\
        .tos_modal_title { font-size:25px;margin-bottom: 10px; border-bottom: 1px solid #dcdcdc; }\
        .tos_modal_terms { margin-bottom: 10px; }\
        .tos_modal .btn { display: inline-block;cursor: pointer; padding: 3px 5px; background-color: #36a3f0; border-radius: 2px; color: #fff; }\
        .tos_modal .btn:hover { background: #ddd; }\
        .tos_modal .btn.btn-yes { margin-right: 20px; }\
        .tos_modal .btn.btn-no {  }\
         ';

      // Add the modal styles dynamically
      if(tos_modal_style.styleSheet){
        tos_modal_style.styleSheet.cssText = tos_modal_css;
      } else {
        tos_modal_style.appendChild(document.createTextNode(tos_modal_css));
      }
      document.querySelector('head').appendChild(tos_modal_style);

      // Create Modal
      var tos_modal = document.createElement('div');
      tos_modal.setAttribute('class', 'tos_modal');

      tos_modal.innerHTML = '\
        <div class="tos_modal_inner">\
          <div class="tos_modal_title">Terms of Service / Privacy Policy</div>\
          <div class="tos_modal_terms">\
            I agree to the <a href="/privacy.html">Privacy Policy</a> and <a href="/terms_of_service.html">Terms of Service</a>\
          </div>\
          <div class="btn btn-yes">I Agree</div>\
          <div class="btn btn-no">No / Cancel</div>\
        </div>\
      ';
      document.querySelector('body').appendChild(tos_modal);

      // Init agree/disagree buttons
      $('.tos_modal .btn-yes').click(function() {

        $('.tos_modal .btn-yes').html('');
        $('.tos_modal .btn-yes').attr('style', 'background: rgba(0, 0, 0, 0) url("//util.realclearpolitics.com/comments/images/spinner_email.gif") no-repeat scroll center center');
        
        if(sso_data.sso_type == 'facebook') {

          add_fb_user(sso_data.orig_response, sso_data.display_name, true);

        } else if(sso_data.sso_type == 'google') {
          
          add_g_user(
            sso_data.orig_response.email, 
            sso_data.display_name, 
            sso_data.orig_response.picture.data.url, 
            sso_data.orig_response.first_name, 
            sso_data.orig_response.last_name, 
            true
          );
        }

      });

      $('.tos_modal .btn-no').click(function() {

        location.reload();
      });

    } else {

      // now we can redirect them to any portal or update the user icon
      // with the user information
      rcmg_setLocalCookies(
        {
            guid: response.data.rcmg_guid,
            token: response.data.rcmg_token,
            username: response.data.rcmg_username,
            ev_ss: response.data.ev_ss,
            ex_ss: response.data.ex_ss,
            accu_weather_loc_key: response.data.accu_weather_loc_key,
            has_evaf: response.data.has_evaf,
            rcmg_newsletters: response.data.rcmg_newsletters,
            is_unsubscribed: response.data.is_unsubscribed,
            rcmg_product_type: response.data.rcmg_product_type,
            rcmg_liveramp: response.data.rcmg_liveramp,
            user_access: response.data.user_access,
        },
        true
      );

      //will redirect the user to the dashboard
        if(siteName != 'americanthinker.com'){
            notifications_enabled(response.data.user_id);
        }

      if(getUrlParameter('action') == 'login_after_email_confirm_subscription') {
        window.location.href = '//'+window.location.hostname;
      }

      loginModal.login_success(response.data.fn_ln_exist);

    }

  } else {
    $('#login-form-signup').html('');
    $('.errorDisplay').html(rcmg_api_first_error(response.messages)).addClass('txt-error');
    $('.processing').html('');
  }

  $('.think').html('');

}

function add_fb_user(response, custom_display_name, tos_accepted) {

  if(typeof tos_accepted === 'undefined') {
    var tos_accepted = false;
  }

  var name = response.email.substring(0, response.email.lastIndexOf("@"));

  if(typeof custom_display_name !== 'undefined' && custom_display_name != '') {
    name = custom_display_name;
  }

  // If purchase email exists and it is different than FB email, give warning
  if( readCookie('rcmg_purchase_email') && readCookie('rcmg_purchase_email') != response.email) {
    if(window.confirm(confirm_same_email)) {
      // continue
    } else {
      // Refresh page
      location.reload();
    }
  }

  sso_data.sso_type = 'facebook';
  sso_data.orig_response = response;
  sso_data.display_name = custom_display_name;
  
  rcmg_api_call('add_fb_user', {
    userAgent : navigator.userAgent,
    WURFL : window.WURFL,
    user_email : response.email,
    user_name : name,
    user_first_name : response.first_name,
    user_last_name : response.last_name,
    user_picture_url : response.picture.data.url,
    tos_accepted : (tos_accepted ? '1' : '0')
  }, add_sso_response);
}

function add_g_user(email, name, profile_picture_url, first_name, last_name, tos_accepted) {

  if(typeof tos_accepted === 'undefined') {
    var tos_accepted = false;
  }

  // If purchase email exists and it is different than FB email, give warning
  if( readCookie('rcmg_purchase_email') && readCookie('rcmg_purchase_email') != email) {
    if(window.confirm(confirm_same_email)) {
      // continue
    } else {
      // Refresh page
      location.reload();
    }
  }

  var name_from_email = email.substring(0, email.lastIndexOf("@"));

  sso_data.sso_type = 'google';
  sso_data.orig_response = {
    email: email,
    first_name: first_name,
    last_name: last_name,
    picture: {
      data: {
        url: profile_picture_url
      }
    }
  };
  sso_data.display_name = name;

  rcmg_api_call('add_google_user', {
    userAgent: navigator.userAgent,
    WURFL: window.WURFL,
    user_email: email,
    user_name: name,
    user_first_name: first_name,
    user_last_name: last_name,
    user_picture_url: profile_picture_url,
    tos_accepted : (tos_accepted ? '1' : '0')
  }, add_sso_response);
}


function notifications_enabled(user_id) {

  if (notifs.enabled == true) {
    notifs.subscription.user_id = user_id;
    notifs.save();
  }
}

function rcmg_reset_pass() { //get the user input values

  var password = $('input[name=new_password]').val();
  var conf_pass = $('input[name=confirm_password]').val();
  var reset_key = $('#reset-password-form input[name=reset_key]').val();


  var error = false;
  if (password == '') {
    $('#reset-password-form input[name=new_password]').addClass('fill');
    error = true; //will post to reset password
  } else if (conf_pass == '') {
    $('#reset-password-form input[name=confirm_password]').addClass('fill');
    error = true;
  } else if (password !== conf_pass) { //errors
    alert('Passwords do not match');
    error = true;
  }
  if (!error) {

    rcmg_api_call('form_new_password', {
      reset_key: reset_key,
      new_password: password,
        site: getDomain()
    }, function(response) {

      if (response.success) {
          $('.form-wrapper').html(response.messages[0]['message']);
          $('.form-wrapper').append('<br /><br /><a href="/dashboard/" class="btn btn-center">Log in</a>');
        } else {
          $('.sso-wrapper').html(rcmg_api_first_error(response.messages));
        }
    });
  }
}

function rcmg_update_fn_ln() { //get the user input values

  var first_name = $('input[name=first_name]').val();
  var last_name = $('input[name=last_name]').val();

  var error = false;

  if (first_name == '') {
    $('#fn_ln_form input[name=first_name]').addClass('fill');
    error = true;
  } else if (last_name == '') {
    $('#fn_ln_form input[name=last_name]').addClass('fill');
    error = true;
  }

  if (!error) {

    rcmg_api_call('enter_fn_ln', {
      guid       : getCookie('rcmg_guid'),
      token      : getCookie('rcmg_token'),
      userAgent  : navigator.userAgent,
      first_name : first_name,
      last_name  : last_name
    }, function(response) {

      if (response.success) {
        loginModal.loadModal('close');
        loginModal.fn_ln_success();
      } else {
        $('.errorDisplay').html(rcmg_api_first_error(response.messages));
        $('.fn_ln_submit').html('Update Profile and Continue');
      }
    });
  }
}


/*NEW FEATURE ADDED IT WILL ONLY AFFECT MARKETS */
$(document).ready(function(){

    if(siteName == 'politics' || siteName == 'markets' || siteName == 'science' || siteName == 'world' || siteName == 'defense' || siteName == 'history' || siteName == 'policy' || siteName == 'religion' || siteName == 'energy' || siteName == 'books' || siteName == "florida" || siteName == "pennsylvania" || siteName == "publicaffairs"){

        if (getCookie('rcmg_username')) {
            // replase + with space
            var username = getCookie('rcmg_username').replace(/\+/g, ' ');
            var welcome = '<a class="welcome-login" href="/dashboard/">Welcome ' + username + '</a> ';
            var welcome_2 = '<a class="welcome-login" href="/dashboard/">' + username + '</a> ';
            var logout_link = '<a href="javascript:void(0)" class="rcmg-sign-out">Logout</a>';
            var separator = '<span>|</span> ';


            $(".home-account").html(welcome + separator + logout_link);
            $('.inner-account').html(welcome + separator + logout_link); //inner pages

            setTimeout(function () {
                //$('.welcome-login').attr('href', window.location.href + 'dashboard').text( getCookie('rcmg_username')); //waiting for the mobile navigation to load before trying to change its contents
                $('.static.welcome-login').hide();
                $('.static.welcome-login').after('<div class="mobile-logged-in-user-options home-account"></div>');
                $('.mobile-logged-in-user-options').html(welcome_2 + separator + logout_link);

            },250);



        }else{
            EV.Core.UI.logout();
        }

        $(document).on('click', '.rcmg-sign-out', function(){
            google.accounts.id.disableAutoSelect();
            loginModal.signOut(true);
            EV.Core.UI.logout();
            location.reload();
        });

        $(".welcome-login").click(function(ev){
            ev.stopPropagation();
            ev.preventDefault();

            if (getCookie('rcmg_username')) {
                location.assign('/dashboard/');
            }else{
                loginModal.loadModal("sign-in-up");
            }

        });
    }

});


/*Google SSO One Tap Login*/
//loads google library

if(siteName !== 'americanthinker' && !getUrlParameter('action')) {

    url = 'https://accounts.google.com/gsi/client';
    Utils.load_script(url);

    window.onload = function () {

        if (!readCookie('rcmg_guid') && !Utils.global_settings.realclear_ad_block_check) { // if policy and if user is not using ad-blocker

          loadGoogleOneTap();
        }

    }

    function loadGoogleOneTap() {
      google.accounts.id.initialize({
        client_id: google_one_tap_client_id,
        callback: handleGoogleCredentialResponse
      });
      google.accounts.id.renderButton(
          document.getElementById("g-sign-in"),
          { theme: "outline", size: "large" , type: "icon"}  // customization attributes
      );
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // try next provider if OneTap is not displayed or skipped
        }
      });
    }

    function handleGoogleCredentialResponse(response) {
        rcmg_api_call('google_one_tap_login', {
            clientId: response.clientId,
            credential: response.credential,
            userAgent: navigator.userAgent
        }, function (response) {

            var reload_on_login = true;

            if (response.success) {
                //server verification went well
                //create cookies to login user
                rcmg_setLocalCookies(
                  {
                      guid: response.data.user.rcmg_guid,
                      token: response.data.user.rcmg_token,
                      username: response.data.user.rcmg_username,
                      ev_ss: response.data.ev_ss,
                      ex_ss: response.data.ex_ss,
                      accu_weather_loc_key: response.data.user.accu_weather_loc_key,
                      has_evaf: response.data.user.has_evaf,
                      rcmg_newsletters: response.data.user.rcmg_newsletters,
                      is_unsubscribed: response.data.user.is_unsubscribed,
                      rcmg_product_type: response.data.user.rcmg_product_type,
                      rcmg_liveramp: response.data.user.rcmg_liveramp,
                      user_access: response.data.user.user_access,
                  },
                  reload_on_login
                );

            }
        });

    }
}