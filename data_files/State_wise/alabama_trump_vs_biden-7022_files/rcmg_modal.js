
var loginModal = {};

loginModal.productActive = false;
loginModal.modal_loaded = false;
loginModal.register_success = false;
loginModal.signin = false;
loginModal.confirm = false;
loginModal.fromProduct = false;
loginModal.success_from_product = true; //this will only get set to false only if the user hits cancel on the confirm to login.

window.FB_app_id = '493268447718105';

// this function gets triggered before the sso login.
//the purpose is to extend it and perform some sort of logic.
loginModal.beforeapi = function(email){
    /**
     * This will check if the cookie that was set on initial payment process
     *
     */

    //var success_email = readCookie('success_email');

    if(success_email == 'undefined' || success_email == null || success_email == '')
    {
        //cookie it dosnet exist
    }else{
        if(success_email != email)
        {
            //if the emails do not match your subscription email while trying to login via sso
            //console.log('emails dont match and our records indicate that you have purchased a subscription with this email' + success_email);

            //var r = confirm('Our records indicate that you have an ad-free account associated with this email('+ success_email +') the emails dont match with our records.  Would you like to continue?');

            //if(r){
              //  console.log('continue');
                //this.success_from_product = true;
            //}
            //else{
              //  console.log('exit');
                //this.success_from_product = false;
            //}


        }

    }

};

loginModal.load_fb_init = function(){
  // Fb init

  window.fbAsyncInit = function () {

    //console.log('fbAsyncInit');
    //console.log(typeof FB);

    FB.init({
      appId: FB_app_id,
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v4.0',
      status: true
    });

    check_login();

    //FB.AppEvents.logPageView();

  };

  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    js.onload = function(){
      fbAsyncInit();
    }

    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
  //
  //makes the body hidden
  $('body').css({
    overflow: 'hidden'
  });
}

loginModal.productData = [
  //this could come dinamicly from a db
  {
    'main_header': 'Premium Subscription'
  }, {
    'product_image': '//util.realclearpolitics.com/rcmg_users/assets/product.png'
  }, {
    'secondary_header': 'Our Digital Offer Includes:'
  }, {
    'list_items': [
      'insightful, award-winning writers',
      'Downlad our IOS app and get a free issue',
      'Have the latest issue at your fingertips whenever'
    ]
  },
];

loginModal.socialMediaImages = 'www.realclearpolitics.com/asset/img/social-icon-set.png';

loginModal.rcmg_logo = 'http://util.realclearpolitics.com/rcmg_users/assets/rcmg_logo.png';

loginModal.signOut = function (refresh_after) {

  if(typeof refresh_after === 'undefined') {
    refresh_after = false;
  }

  clear_token_cookies(refresh_after);
  //function to log out from facebook

}

loginModal.slideContent = function () {

  //$('.product-wrapper').animate({left: '-720px'}, 'slow'); 
  //if this goes from the sign in 
  if (this.signin) {
    $('.product-wrapper').animate({
      left: '-720px'
    }, 'slow');
    $('.sign-in-out-wrapper').animate({
      left: '0px'
    }, 'slow');
  } else if (this.confirm) {
    $('.sign-in-out-wrapper').animate({
      left: '-720px'
    }, 'slow');
    $('.confirmation-wrapper').animate({
      left: '0px'
    }, 'slow');
  }
}

loginModal.breadcrums = function () {
  var html = '<div class="breadcrumbs"> \
            <ul> \
              <li class="active">Login Portal<span class="arrow-right"></span></li> \
              <li class="">Confirmation <span class="arrow-right"></span></li> \
            </ul> \
          </div>';

  return html;
}

loginModal.loadBreadcrumbs = function () {
  $('.rcmg-user-dashboard').prepend(this.breadcrums());
}

loginModal.form = function () {
    at_class = '';
    privacy_link = '/privacy';
    terms_of_service_link = '/terms_of_service';

    if(siteName == 'americanthinker.com'){
        at_class = 'american-thinker';
        privacy_link = '/static/privacy_policy';
        terms_of_service_link = '/static/comments_faqs';
    }

  var html = '<div class="sign-in-out-wrapper"> \
            <a href="javascript:void(0);" class="close sign-in-up" data-trigger="close"></a> \
            <div class="right-side '+ at_class +'"> \
              <div class="rcmg-logo"></div><!--Image place holder for logo--> \
              <div class="right-outer-wrapper"> \
                <h1 class="center have-account"> \
                  Do you already have an account? \
                </h1> \
              <a href="javascript:void(0);" onClick="loginModal.loadSignInModal() " class="btn btn-signup submit">Sign In</a> \
              </div><!--End of outer wrapper--> \
            </div><!--end of right side--> \
          <div class="left-side"> \
              <!-- SIGN UP FORM WIDN SSO OPTIONS ON TOP--> \
              <div class="top_sso_options">\
                <h1>Sign In</h1> \
                <div class="signin_step signin_step_1">Step 1</div>\
                <div class="tos_wrapper">\
                  <input type="checkbox" name="tos_accept" id="tos_accept">\
                  <label for="tos_accept">I agree to the <a target="_blank" href="'+ privacy_link +'.html">Privacy Policy</a> and <a target="_blank" href="'+ terms_of_service_link +'.html">Terms of Service</a></label>\
                </div>\
                 <div class="member-options">\
                    <div class="includes">\
                        <h2>BECOME A MEMBER<br /></h2>\
                        <ul class="product-includes">\
                            <li>Free Daily Newsletters</li>\
                            <li>Unlimited Access to Articles</li>\
                            <li>Free platform to share your voice </li>\
                        </ul>\
                    </div>\
                </div>\
                <div class="signin_step signin_step_2">Step 2</div>\
                <div class="sso-wrapper"> \
                   <a id="f-sign-in" href="javascript:void(0);" class="fb-btn" onClick="login()"> \
                      <i class="icon fb"></i> \
                      <span class="social-text">Facebook</span> \
                    </a> \
                  <!--<a href="javascript:void(0);" class="btn"> \
                      <i class="icon twitter"></i> \
                      <span class="social-text">Twitter</span> \
                    </a>--> \
                  <!--<a href="javascript:void(0);" class="btn-google"> \
                    <i class="icon google"></i> \
                    <span class="social-text">Google</span> \
                  </a>-->\
                  <div id="g-sign-in"></div> \
                </div> \
                <span class="or_wrapper"> \
                  <span class="or">OR</span> \
                  <hr class="ruler"> \
                </span> \
              </div> \
              <!-- FORM STARTS HERE--> \
              <div class="form-wrapper"> \
                <h1 class="change-header">Create Your RealClear Account</h1> \
                <div class="errorDisplay"></div> \
                <form id="login-form-signup" autocomplete="off"> \
                  <label for="name">Username</label> \
                  <input type="text" name="name" placeholder="Username" required  class="required" /> \
                  <label for="email">Email</label> \
                  <input type="email" name="email" placeholder="Email" class="required" required /> \
                  <div class="input_group"> \
                    <div class="left"> \
                      <label for="first_name">First Name</label> \
                      <input type="text" name="first_name" placeholder="First Name" class="required" required /> \
                    </div> \
                    <div class="right"> \
                      <label for="last_name">Last Name</label> \
                      <input type="text" name="last_name" placeholder="Last Name" class="required" required /> \
                    </div> \
                  </div> \
                  <div class="input_group"> \
                    <div class="left"> \
                      <label for="password">Password</label> \
                      <input type="password" name="pass" placeholder="Password" class="required" required /> \
                    </div> \
                    <div class="right"> \
                      <label for="passConfirm">Password Confirmation</label> \
                      <input type="password" name="passconfirm" placeholder="Password Confirmation" class="required" required /> \
                    </div> \
                  </div> \
                  <input type="hidden" name="zelda" id="zelda" /> \
                  <div class="submit-wrapper register-btn"> \
                    <input type="submit" class="btn btn-center submit register" data-trigger="confirmation" value="Register" disabled> \
                  </div> \
                </form> \
              </div> <!--End of form wrapper--> \
              <!-- FORM END HERE--> \
            </div> \
          </div><!--End of sign in up form-->';
  return html;
}

loginModal.gapi_interval = '';

loginModal.loadForm = function () {

  //loads the script dynamicly
  // append_google_link()
  
  // This is so interval doesn't multiply on multiple loadForm calls
  // if(this.gapi_interval != '') {
  //   clearInterval(this.gapi_interval);
  // }
  // this.gapi_interval = setInterval(startApp, 1000);


  if (this.fromProduct) {
    //if it comes from the product page

    $('.rcmg-user-dashboard').append(this.form());
    //this.loadBreadcrumbs();

  } else {

    this.loadUserModal();

    $('.rcmg-user-dashboard').append(this.form());

    this.loadSignUpMarkup();
    $('.form-wrapper').html(this.signinModal());

    $('.rcmg-user-dashboard .sign-in-out-wrapper').css({
      left: '0px',
    });
  }

  // load google one tap if url param doesn't exists
  if (!getUrlParameter('action')){
    loadGoogleOneTap();
  }

}

loginModal.UserModal = function () {
  /*
  Loads the html markup for the modal
      
  */
  var html = ' \
      <div class="rcmg-outer-wrapper"> \
        <div class="overlay-active"></div> \
        <div class="rcmg-user-dashboard"></div> \
      </div><!--rcmg-outer-wrapper-->';

  return html;

}

loginModal.loadUserModal = function () {

  var result = this.UserModal();
  //if it already exist remove it
  //if comes from the product 
  //animate the screen/modal
  //then remove

  $('.rcmg-outer-wrapper').remove();

  $('body').append(result);
}

loginModal.signinModal = function () {

  var html = ' \
      <div class="loginform"> \
        <div class="errorDisplay"></div> \
        <form id="signin-user" autocomplete="off"> \
          <label for="email">Email/Username </label> \
          <input type="email" tabindex="1" name="user-email" placeholder="Email" class="required" required /> \
          <label for="password">Password <a href="javascript:void(0);" class="forgot-ep sign-in-up" data-trigger="forgot_credentials">(Forgot Password?)</a></label> \
          <input type="password" tabindex="2" name="password" placeholder="Password" class="required" required/> \
          <input type="hidden" name="zelda" id="zelda" /> \
          <div class="submit-wrapper register-btn"> \
            <a href="javascript:void(0);" class="btn submit sign-in" data-trigger="confirmation"> \
              Sign In \
            </a> \
          </div> \
        </form> \
      </div>';

  return html;
}

loginModal.loadSignInModal = function () {

  var result = this.signinModal();

  $('.form-wrapper').html(result);

  $('.left-side h1.change-header').html('');

  $('.left-side .top_sso_options > h1').html('Sign In');

  $('.sso-wrapper').removeClass('register_mode');

  this.loadSignUpMarkup();

  $('.sso-wrapper').show();
  $('.tos_wrapper').hide();
  $('.or_wrapper').show();
  $('.or_wrapper').removeClass('signup');
  $('#login-form-signup').show();
  $('.signin_step').hide();
    //this is for the modal to show hide which option
    $('.top_sso_options').removeClass('register-active');
}

loginModal.closed = function () {}

loginModal.close = function () {
    if(getDomain() == 'americanthinker.com'){
        if(typeof parent !== 'undefined'){
            parent.postMessage('mrfCloseIframe', 'https://www.americanthinker.com');
        }
    }



  $('.rcmg-outer-wrapper').remove();

  $('body').css({
    overflow: 'auto'
  });

  this.closed();
}

loginModal.registerMarkup = function () {

  var html = ' \
        <h1 class="center have-account"> \
          Would you like to Register? \
        </h1> \
        <a href="javascript:void(0);" onclick="loginModal.loadSignUpModal(); " class="btn btn-signup submit">Register</a> \
      ';

  return html;

}

loginModal.loadSignUpMarkup = function () {
  var result = this.registerMarkup();

  $('.right-outer-wrapper').html(result);

}

loginModal.SignUpModal = function () {

  var html = '\
          <div class="errorDisplay"></div> \
          <div class="loading"><img alt="loading" src="/asset/top/rcmg_users_v2/loader.gif" /></div> \
          <form id="login-form-signup" autocomplete="off"> \
            <label for="name">Username</label> \
            <input type="text" name="name" placeholder="Username" class="required" required /> \
            <label for="email">Email</label> \
            <input type="email" name="email" placeholder="Email" class="required" required /> \
            <div class="input-group invalid-email-group-check" style="display:none">\
                <label for="invalid_user_email_confirm"><input type="checkbox"  id="invalid_user_email_confirm" name="invalid_user_email_confirm" /> I confirm this is a valid email address</label>\
            </div>\
            <div class="input_group"> \
              <div class="left"> \
                <label for="first_name">First Name</label> \
                <input type="text" name="first_name" placeholder="First Name" class="required" required /> \
              </div> \
              <div class="right"> \
                <label for="last_name">Last Name</label> \
                <input type="text" name="last_name" placeholder="Last Name" class="required" required /> \
              </div> \
            </div> \
            <div class="input_group"> \
              <div class="left"> \
                <label for="password">Password</label> \
                <input type="password" name="pass" placeholder="Password" class="required" required /> \
              </div> \
              <div class="right"> \
                <label for="passConfirm">Password Confirmation</label> \
                <input type="password" name="passconfirm" placeholder="Password Confirmation" class="required" required /> \
              </div> \
            </div> \
            <input type="hidden" name="zelda" id="zelda" /> \
            <div class="submit-wrapper register-btn"> \
              <input type="submit" class="btn btn-center submit register" data-trigger="confirmation" value="Register" disabled> \
            </div> \
          </form>';
  return html;

}

loginModal.SignInMarkup = function () {

  var html = '\
          <h1 class="center have-account"> \
            Do you already have an account? \
          </h1> \
          <a href="javascript:void(0);" onclick="loginModal.loadSignInModal() " class="btn btn-signup submit">Sign In</a> \
            ';
  return html;
}

loginModal.loadSignUpModal = function () {

  var result = this.SignUpModal();
  var result2 = this.SignInMarkup();

  $('.form-wrapper').html(result);

  $('.right-outer-wrapper').html(result2);
  $('.top_sso_options').addClass('register-active');

  $('.left-side h1.change-header').html('Create Your RealClear Account');
  $('.left-side .top_sso_options > h1').html('Create Your RealClear Account');

  $('.sso-wrapper').addClass('register_mode');

  //keeps the state of the input values
  display_inputs();

  $('.sso-wrapper').hide();
  $('.tos_wrapper').show();
  $('.or_wrapper').hide();
  $('.or_wrapper').addClass('signup');
  $('#login-form-signup').hide();
  $('.signin_step_1').show();
  $('.signin_step_1').addClass('space');

  $('#tos_accept').prop('checked', false);

  $('#tos_accept').unbind('change');
  $('#tos_accept').change(function() {
    
    if(this.checked) {

      $('#login-form-signup').show();
      $('.sso-wrapper').show();
      $('.or_wrapper').show();
      $('.signin_step_2').show();
      $('.signin_step_1').removeClass('space');
        $('.register-active .member-options').hide();

    } else {

      $('#login-form-signup').hide();
      $('.sso-wrapper').hide();
      $('.or_wrapper').hide();
      $('.signin_step_2').hide();
      $('.signin_step_1').addClass('space');
        $('.register-active .member-options').show();
    }
  });
}

loginModal.after_subscription = function() {

  console.log('after_subscription');

  // Hide left section so they can't switch to resiter or sign in, depending
  $('.rcmg-outer-wrapper .right-outer-wrapper').hide();

  $('.rcmg-outer-wrapper .loading').show();
  $('.form-wrapper #login-form-signup').hide();

  rcmg_api_call('get_user_info', {
    guid      : getCookie('rcmg_guid'),
    token     : getCookie('rcmg_token'),
    userAgent : navigator.userAgent
  }, function(response) {

    console.log(response.success);

    if (response.success) {

      // Redirect to homepage
      window.location.href = 'https://www.'+window.site_url;

    } else {

      if(getCookie('rcmg_purchase_token')) {

        // Determine user registration status
        rcmg_api_call('purchase_user_status', {
          purchase_token : getCookie('rcmg_purchase_token')
        }, function(response) {

          if (response.success) {

            // User has confirmed account

            if(response.data.password_exists) {
              // Show log in with email prefilled

              $('.rcmg-outer-wrapper .loading').hide();
              $('.form-wrapper #login-form-signup').show();
              $('.rcmg-user-dashboard .right-side a.btn-signup').trigger('click');
              $('#signin-user input[name=user-email]').val(response.data.email);
            } else {

              // Load signup preloaded with info

              $('.left-side h1.change-header').remove();
              $('.left-side h1').html('Confirm Your RealClear Account');
              $('.submit-wrapper.register-btn input').val('Confirm');

              $('.form-wrapper #login-form-signup input[name="name"]').val(response.data.username);
              $('.form-wrapper #login-form-signup input[name="email"]').val(response.data.email);
              $('.form-wrapper #login-form-signup input[name="first_name"]').val(response.data.first_name);
              $('.form-wrapper #login-form-signup input[name="last_name"]').val(response.data.last_name);

              // Trigger availability checks
              $('.form-wrapper #login-form-signup input[name="name"]').trigger('blur');
              $('.form-wrapper #login-form-signup input[name="email"]').trigger('blur');

              // Read-only email field
              $('.form-wrapper #login-form-signup input[name="email"]').attr('readonly', 'readonly');

              $('.rcmg-outer-wrapper .loading').hide();
              $('.form-wrapper #login-form-signup').show();
            }
            
          } else {
            // Load signup
            $('.rcmg-outer-wrapper .loading').hide();
            $('.form-wrapper #login-form-signup').show();
          }

        });
      } else {
        // Load signup
        $('.rcmg-outer-wrapper .loading').hide();
        $('.form-wrapper #login-form-signup').show();
      }
    }
  });
}

loginModal.login_success = function (fn_ln_exist) {}

loginModal.productMarkup = function () {
  var items = '';

  $.each(this.productData[3].list_items, function (i, val) {
    items += '<li><span class="checkmark"></span> ' + val + ' </li>';
  });

  var html = ' <div class="product-wrapper"> \
            <a href="javascript:void(0);" class="close sign-in-up" data-trigger="close"></a> \
            <h2>' + this.productData[0].main_header + '</h2> \
            <span><hr></span> \
              <div class="product-image" style="background:url(' + this.productData[1].product_image + ') no-repeat center;  background-size:cover" ></div> \
              <div class="product-pos"> \
                <h2> ' + this.productData[2].secondary_header + '</h2> \
                <ul class="benefits"> \
                ' + items + ' \
                </ul> \
              </div> \
              <!-- FORM STARTS HERE--> \
              <div class="submit-wrapper"> \
                <a href="javascript:void(0);" class="btn submit sign-in-up" data-trigger="sign-in-up"> \
                  Next \
                </a> \
              </div> \
              <!-- FORM END HERE--> \
            </div>';

  return html;
}

loginModal.loadProduct = function () {
  var result = this.productMarkup();
  this.loadUserModal();
  $('.rcmg-user-dashboard').html(result);

}

loginModal.LoadSignupForm = function () {

}

loginModal.confirmationMarkup = function () {
  var html = '<div class="confirmation-wrapper"> \
            <a href="#" class="close sign-in-up" data-trigger="close"></a> \
            <div class="logo-wrapper"> \
              <img class="rcmg-confirmation-logo" src="' + this.rcmg_logo + '" /> \
            </div> \
            <h1>Account Confirmation</h1> \
              <div class="product-pos"> \
                <p>Thank you for registering. You will receive a confirmation email shorty. Please click the confirmation link in that email in order to activate your account. Then you will be able to login with the username and password you provided. </p> \
              </div> \
              <!-- FORM STARTS HERE--> \
              <div class="submit-wrapper"> \
                <a href="#" class="btn submit sign-in-up" data-trigger="close"> \
                  Close \
                </a> \
              </div> \
              <!-- FORM END HERE--> \
            </div>';

  return html;
}

loginModal.loadConfirmation = function () {
  var result = this.confirmationMarkup();

  $('.rcmg-user-dashboard').append(result);

}

loginModal.fn_ln_markup = function(){
  
  var html = ' \
    <div class="fn_ln"> \
      <form id="fn_ln_form" autocomplete="off"> \
        <label for="first_name">First Name:</label> \
        <input type="text" name="first_name" id="first_name" /> \
        <label for="last_name">Last Name:</label> \
        <input type="text" name="last_name" id="last_name" /> \
        <br /> \
        <br /> \
        <a href="javascript:void(0);" class=" btn btn-center fn_ln_submit">Update Profile and Continue</a> \
      </form> \
    </div> ';
      
  return html;
      
}

loginModal.password_reset_markup = function(){
  
  var html = ' \
    <div class="rest-password"> \
      <form id="reset-password-form" autocomplete="off"> \
        <label for="new-password">New Password:</label> \
        <input type="password" name="new_password" id="new-password" /> \
        <label for="confirm-password">Confirm Password</label> \
        <input type="password" name="confirm_password" id="confirm-password" /> \
        <br /> \
        <br /> \
        <a href="javascript:void(0);" class=" btn btn-center reset-password-submit">Reset Password</a> \
      </form> \
    </div> ';
      
  return html;
      
}

loginModal.loadModal = function (data, reset_key) {
  check_if_mobile();
  this.load_fb_init();
  
  switch (data) {

    case 'product':
      //this will load the product

      //flag means it comes from the product secton
      this.fromProduct = true;
      this.loadProduct();

      break;

    case 'enter-fn-ln':

      $('.rcmg-outer-wrapper').html('');
      //this loads the outer markup
      //this.loadUserModal();
      this.loadForm();

      $('.right-outer-wrapper').html('');
      $('.rcmg-user-dashboard .or').parent().html('');
      //this will only get trigger if we use the util proccess
      $('.sso-wrapper').html('');
      $('.left-side h1').html('Additional Information Needed<br />Please Enter First and Last Name');
      
      var result = this.fn_ln_markup();
      
      $('.form-wrapper').html(result);

      break;

    case 'sign-in-up':
      //this will load the sign in up form
      this.signin = true;

      this.loadForm();

      if (this.fromProduct == true) {
        this.slideContent();
        //if the flags are set it removes the content from which ever flag was set
        this.removeContent();
      }

      this.add_site_class();

      this.signin = false;
      this.fromProduct = false;

      break;

    case 'confirmation':
      //this will load the confirmation

      this.confirm = true;
      this.loadConfirmation();

      this.slideContent();

      //if the flags are set it removes the content from which ever flag was set
      this.removeContent();

      this.signin = false;
      this.confirm = false;

      break;

    case 'password-reset':
      
      $('.rcmg-outer-wrapper').html('');
      //this loads the outer markup
      //this.loadUserModal();
      this.loadForm();
      
      $('.right-outer-wrapper').html('');
      //this will only get trigger if we use the util proccess
      $('.sso-wrapper').html('');
      $('.or_wrapper').hide();
      $('.left-side h1').html('Password Reset');
      
      var result = this.password_reset_markup();
      
      $('.form-wrapper').html(result);
      $('#reset-password-form').append('<input type="hidden" name="reset_key" value="'+reset_key+'" />');
      
      break;
      
    case 'register':

      this.loadForm();
      this.loadSignUpModal();

      this.add_site_class();

      break;
      
    case 'login_after_email_confirm_subscription':

      /*
      
      Check if logged in
        Yes: redirect to homepage
        No: Check if have existing confirmed account, not made on subscription
          Yes: Go to login. On login success, redirect to homepage
          No: Check if account does exist as made on subscription
            Yes: Go to a page similar to register that is prefilled. On completion
            it will go to the homepage.
            No: Go to the standard register page.

      */

      console.log('starting modal for "login_after_email_confirm_subscription"');

      this.loadForm();
      this.loadSignUpModal();
      this.after_subscription(); 

      break;

    case 'close':
      this.close();

      break;
    case 'forgot_credentials':

      this.load_forgot_email();
      break;
      
    case 'enter_username':
      
      //this.loadForm();
      var result = this.username_exist_form();
      $('.form-wrapper').html(result);
      
      break

    default:
      //nothing 
  }

}

loginModal.add_site_class = function (){
    if(getDomain() == 'americanthinker.com' || getDomain == 'admin.americanthinker.com'){
        $('.rcmg-user-dashboard .right-side').addClass('american-thinker');
    }
}

loginModal.removeContent = function () {

  if (this.fromProduct) {
    setTimeout(function () {
      $('.product-wrapper').remove();
    }, 1000)

  } else if (this.confirm) {
    setTimeout(function () {
      $('.sign-in-out-wrapper').remove();
    }, 1000);

  }
}

loginModal.forgotEmailMarkup = function () {
  var html = ' \
      <div class="loginform"> \
        <div class="errorDisplay"></div> \
        <form id="forgot_credentials" autocomplete="off"> \
          <label for="user_displayname">Username</label>\
          <input type="text" name="user_displayname" placeholder="Username" >\
          <span><span class="or">OR</span><hr class="ruler"></span>\
          <label for="email">Email</label> \
          <input type="email" name="user-email" placeholder="Email" /> \
          <input type="hidden" name="zelda" id="zelda" /> \
          <div class="submit-wrapper register-btn"> \
            <input type="submit" value="Reset" class="btn btn-center forgot_credentials" /> \
            <a class="back-login" href="javascript:void(0);" onclick="loginModal.loadSignInModal() ">Back to Login</a>\
          </div> \
        </form> \
      </div>';

  return html;
}

loginModal.load_forgot_email = function () {
  var result = this.forgotEmailMarkup();

  $('.form-wrapper').html(result);
  //replaced the headding
  $('.left-side h1').text('Forgot Password');
    $('.left-side span:first-of-type').css({ display : 'none'});
  $('.left-side .sso-wrapper').css({ display : 'none' });
  $('.left-side #forgot_credentials span').css({ display: 'block !important'});

}

loginModal.username_exist_form = function(){
  var html = ' <div class="errorDisplay"></div> \
  <form id="username_exist" autocomplete="off"> \
    <label for="name">Username:</label> \
    <input type="text" name="name" required> \
    <input type="hidden" name="user_email" > \
    <input type="hidden" name="sso_type" > \
    <input type="submit" class="btn btn-center submit" value="Continue" disabled > \
  </form> ';
  return html;
}

loginModal.fb_access_email_markup = function () {
  var html = ' \
      <div class="fb-email-access"> \
        <h2>Email Address is Required!</h2> \
          <p>In order to sign in we will need to confirm your email address.  Please allow, or Register a new account to continue.</p> \
        <div class="fb_optons"> \
        <a href="javascript:void(0);" class="btn allow_fb"> Allow </a> \
        <a href="javascript:void(0);" class="btn btn-signup" onClick="loginModal.loadSignUpModal(); "> Register </a> \
        </div> \
      </div>';

  return html;
}

loginModal.load_fb_access_response = function () {
  var response = this.fb_access_email_markup();
  $('.form-wrapper').html(response);
}


//click heandlers for 
$(document).on('click', '.sign-in-up', function () {

  loginModal.loadModal($(this).attr('data-trigger'));

});
  //modal accessing fb email permision
$(document).on('click', '.allow_fb', function () {
  login();
});

/*$(document).on('click', '.g-signin2', function(googleUser){
  onSignIn(googleUser);
});*/

//click hendeler for the registering to a new user
$(document).on('submit', '#login-form-signup', function (event) {
  //function to trigger the register function
  event.preventDefault();

  //console.log('register');
  rcmg_register();


});

$(document).on('submit','#forgot_credentials', function (event) {
  event.preventDefault();
  
  //console.log('forgot_credentials');
  rcmg_forgot_pass();

});

$(document).on('click', '.reset-password-submit', function () {
  //console.log('reset password submit');
  //make the call to the function to trigger the get method
  rcmg_reset_pass();

});

$(document).on('click', '.fn_ln_submit', function () {
  //console.log('first name last name submit');
  //make the call to the function to trigger the get method
  $(this).html('<span class="processing"><img style=" top:0; width:42px; height: 42px; position: absolute; transform:translate(-50%); left:50%" src="/asset/top/rcmg_users_v2/loader.gif" /></span>');
  rcmg_update_fn_ln();

});


$(document).on('blur', '#login-form-signup input[name=name]', function () {
  var value = $(this).val()
  save_inputs('name', value);
  
});

$(document).on('blur', '#login-form-signup input[name=email]', function () {
  var value = $(this).val()
  save_inputs('email', value);
});


$(document).on('click', '.sign-in', function () {
  //function to trigger the signin funciton
  //console.log('sign-in');
  rcmg_sign_in();
});

$(document).on('click', '.btn-google',function(){
  $('.sso-wrapper .btn-google .google').css({
    'background': 'url(//util.realclearpolitics.com/comments/images/spinner_email.gif) no-repeat center',
  });
});

/*
$(document).on('keypress', '#login-form-signup', function (e) {
  if (e.which == 13) {
    rcmg_register();
  }
});
*/
$(document).on('keypress', '#signin-user', function (e) {
  if (e.which == 13) {
    rcmg_sign_in();
  }
});

$(document).on('keypress', '.forgot_credentials', function(e) {
  if (e.which == 13) {
    rcmg_forgot_pass();
  }
});

$(document).on('submit','#username_exist',function(event){

  event.preventDefault();
  
  //var email = $('#username_exist input[name=user_email]').val();
  var display_name = $('#username_exist input[name=name]').val();
  var sso_type = $('#username_exist input[name=sso_type]').val();
  
  check_username(display_name, '#username_exist');
  
  if(!username_taken) {

    if(sso_type == 'facebook') {
      login(display_name);
    } else if(sso_type == 'google') {
      google_sso_success(window.google_user, display_name);
    }
  }
  
})



$(document).ready(function () {
  //check_login();
  //console.log('status_from .ready');
  check_if_mobile();


  //this event handeler is to save the status of the form

});
//loads the value of preexisting content if there was any
var name, email;

function save_inputs(input, value) {

  switch (input) {
    case 'name':
      name = value;
      break;
    case 'email':
      email = value;
      break;
  }
}

function display_inputs() {
  $('#login-form-signup input[name=name]').val(name);
  $('#login-form-signup input[name=email]').val(email);
}

function check_if_mobile() {
  var window_width = $(window).width();
  var window_height = $(window).height();
  
  //console.log('width: ' + window_width);
  //console.log('height ' + window_height);

  if (window_width < 415) {
    $('.rcmg-user-dashboard').css({height : window_height + 'px'});
    
    //console.log(window_height);
    //console.log('end of height');
    
  }
}

// function append_google_link() {
//   var link = document.createElement('script');
//   link.type = 'text/javascript';
//   link.src = 'https://apis.google.com/js/platform.js';
//   $('head').append(link);
//   console.log('Append Link:');
//   //<script src="https://apis.google.com/js/platform.js" async defer>

// }




function login(custom_display_name) {
  $('.sso-wrapper a.fb-btn i').css({
    'background': 'url(//util.realclearpolitics.com/comments/images/spinner_email.gif) no-repeat center',
  });//'<img class="spinner" src="//util.realclearpolitics.com/comments/images/spinner_email.gif" />');
  
  //console.log('FB?');
  //console.log(typeof FB);
  //this loads the fc init
  //loginModal.load_fb_init()

  if(typeof custom_display_name === 'undefined') {
    custom_display_name = '';
  }
  
  if (typeof FB !== 'undefined') {

    FB.login(function (response) {
      //console.log(response);
      check_login();
      
      if (response.status === 'connected') {
        //console.log('connected');
        //console.log(response);
        if(custom_display_name != '') {
          info(custom_display_name);
        } else {
          info();
        }

        //check if the perision are granted
      } else if (response.status === 'not_authorized') {
        //console.log('not authorized');
      } else {
        //console.log('not Loged in to any ');
        $('.sso-wrapper a.fb-btn i').css({
          background: ''
        });
      }
    }.bind(custom_display_name), {
      scope: 'email',
      auth_type: 'rerequest',
      return_scopes: true,
    });
  }

  return false;
}

function check_login() {

  if (typeof FB !== 'undefined') {

    FB.getLoginStatus(function (response) {

      if (response.status === 'connected') {

        //console.log('connected');

      } else if (response.status === 'not_authorized') {

        //console.log('not authorized');

      } else {
        //console.log('not logged in');
      }
    });
  }
}

function info(custom_display_name) {

  if(typeof custom_display_name === 'undefined') {
    custom_display_name = '';
  }

  FB.api('/me', 'GET', {
    fields: 'name,first_name,last_name,email,picture,id, gender, locale,age_range'
  }, function (response) {
    //console.log('function info-start');
    //console.log(response);
    permision_granted(response, custom_display_name);

    //we can pass the email of the user
    //creating some sort of cookie 
    //$('.right-outer-wrapper').append('<div class="fb-info" ><img src="' + response.picture.data['url'] + '" /><span class="name">'+ response.name +'</span></div>');

  }.bind(custom_display_name));
}

function permision_granted(response_1, custom_display_name) {
  //console.log('permision_granted');
  FB.api('/me/permissions', 'GET', function (response) {
    //console.log(response);
    //checks to see if the email access is granted
    if (response.data[0].permission == 'email' && response.data[0].status == 'granted') {
      //console.log('access granted to email');
      //at this point we can make an ajax call to add the user email to our system
      //the response will return if the user was successfully added or else will return the errors
      //console.log('permision_granted');
      //check if username grabed from the email alreay exist
      //if it does prompt the user with a form


      //loginModal.beforeapi(response_1.email);

        add_fb_user(response_1, custom_display_name);

      


    } else {
      //if the user has block pop ups nothing will happen
      //should display a message to register if 

      //load a form to have the user enter primary key 
      //login();
      loginModal.load_fb_access_response();
      //console.log('needs to re log in');
    }

  }.bind(custom_display_name));
}




//google init scirpts
var googleUser = {};

// var startApp = function () {
  
//   // console.log(typeof gapi);
//   if (typeof gapi !== 'undefined') {
//     clearInterval(loginModal.gapi_interval);
//     gapi.load('auth2', function () {
//       // Retrieve the singleton for the GoogleAuth library and set up the client.
//       auth2 = gapi.auth2.init({
//         client_id: google_one_tap_client_id,
//         cookiepolicy: 'single_host_origin',
//         // Request scopes in addition to 'profile' and 'email'
//         //scope: 'additional_scope'
//       });
//       //console.log('google success');
//       attachSignin(document.getElementById('g-sign-in'));
//     });
//   }

// };

// Disabled register button check

var checked_tos = false;

function check_register_btn() {

  if(checked_display_name == true && checked_email == true){
    $('#login-form-signup input[type=submit]').attr('disabled',false);
  } else {
    $('#login-form-signup input[type=submit]').attr('disabled',true);
  }
  
}

//CHECK EMAIL MAKE SURE NOT ALREADY BEING USED
var checked_email = false;
var checked_email_counter = 0;
  
  $(document).on('blur','#login-form-signup input[name=email]', function() {
    var email = $(this).val();

    if(email == ''){
        $('#login-form-signup label[for=email]').html('Email Address is Required');
        $('#login-form-signup input[name=email]').addClass("fill");
        return;
    }

    rcmg_api_call('check_email', {
      user_email: email,
      zelda: "",
        site: getDomain()
    }, function(response) {

      if(response.success){  
        
        $('#login-form-signup input[name=email]').removeClass("fill");
        $('#login-form-signup label[for=email]').html('*is available'); 

        $('#login-form-signup a.register').attr('disabled',true);

        checked_email = true;
         
      }else{
          //email is not valid
        $('#login-form-signup input[name=email]').addClass("fill"); 
        $('#login-form-signup label[for=email]').html('* '+rcmg_api_first_error(response.messages));
         
         checked_email = false;
         checked_email_counter++;

         if(checked_email_counter >= 2){
             $('.invalid-email-group-check').show();

         }

      }

      check_register_btn();
      
    });   
  });

  //click hadler for the invalid user email confirm checkbox
$(document).on('change', '#invalid_user_email_confirm', function(){
    if($(this).is(":checked")) {
        //if its checked we will set checked email flag
        $('#login-form-signup .register').attr('disabled',false);
        checked_email = true;
    }else{
        $('#login-form-signup .register').attr('disabled',true);
        checked_email = false;
    }
});
//button to verify
$(document).on('click', '#response-confirm-email', function(){
    $('.invalid-email-group-check').show();
    //$('#invalid_user_email_confirm').prop('checked', true);

    $(this).hide();
})


$(document).on('blur' ,'#login-form-signup input[name=name]', function() {
    var username = $(this).val();                     
    check_username(username, '#login-form-signup');

    
  });

$(document).on('blur', '#username_exist input[name=name]',function(){
  var username = $(this).val();                     
  check_username(username, '#username_exist');
  // this is a fallback just in case it doesnt happen in the ajax call
  if(!username_taken){
    $('#username_exist input[type=submit]').attr('disabled',false);
  }else {
    $('#username_exist input[type=submit]').attr('disabled',true);
  }
  
});


var username_taken = false;
var checked_display_name = false;

function check_username(username, form){

  rcmg_api_call('check_username', {
    user_name: username,
    zelda: "",
      site: getDomain()
  }, function(response) {

    // notify user of result
    if(response.success) { 
      $( form + ' input[name=name]').removeClass("fill");
      $( form + ' label[for=name]').html('*is available'); 
      username_taken = false;
    } else {
      $( form +' input[name=name]').addClass("fill"); 
      $( form + ' label[for=name]').html('*'+rcmg_api_first_error(response.messages));
      username_taken = true;
    }

    // this will disabgled the button only on the username form
    if(response.success){
      $('#username_exist input[type=submit]').attr('disabled',false);
      checked_display_name = true;
    } else {
      $('#username_exist input[type=submit]').attr('disabled',true);
      checked_display_name = false;
    }

    check_register_btn();

  }.bind(form));
}

window.google_user = '';

function attachSignin(element) {

  //console.log(element.id);
  auth2.attachClickHandler(element, {},
    google_sso_success,
    function (error) {
      //alert(JSON.stringify(error, undefined, 2));
      //if we need to display some sort of error we can trigger it here
      //console.log('error allowing google user');
    
      $('.sso-wrapper .btn-google .google').css({
        'background': '',
      });
    });
}

function google_sso_success(googleUser, custom_display_name) {

  if (typeof auth2 != 'undefined') {
    var profile = auth2.currentUser.get().getBasicProfile();
    var display_name = profile.getName();

    if (typeof custom_display_name !== 'undefined') {
      display_name = custom_display_name;
    }

    var email = profile.getEmail();
    var name = display_name;
    var first_name = profile.getGivenName();
    var last_name = profile.getFamilyName();
    var profile_picture_url = profile.getImageUrl();

    add_g_user(email, name, profile_picture_url, first_name, last_name);
  }
}

/*Testing
* Oct 7th 2020
* */