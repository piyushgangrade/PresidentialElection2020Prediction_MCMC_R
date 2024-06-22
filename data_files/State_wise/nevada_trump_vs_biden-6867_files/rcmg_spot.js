// If user clicks on submit (see if they are logged in)
document.addEventListener('spot-im-login-start', function(event) {
    console.log('spot-im-login-start sent');
    console.log(event.detail);

    loginModal.loadModal("sign-in-up");

    loginModal.login_success = function () {
      
      rcmg_auth();
      login_spot_im();
    };
});


if(getCookie('rcmg_token') && getCookie('rcmg_guid')) {
  login_spot_im();
} else {
  logout_spot_im(); // Because Spot.IM wants logout on every non-sso pageload
}

function login_spot_im() {

  // Start SSO process
  if (window.SPOTIM && window.SPOTIM.startSSO) {
    console.log('here1');
    startSSO();
  } else {
    console.log('here2');
    document.addEventListener('spot-im-api-ready', startSSO, false);
  }
}

// Listen for Logout action
function logout_spot_im() {
  
  if(window.SPOTIM && window.SPOTIM.logout){
    window.SPOTIM.logout();
  } else {
    document.addEventListener('spot-im-api-ready', function() { window.SPOTIM.logout(); }, false);
  }
}

function login_callback(response, completeSSOCallback)
{ 
  if(typeof response !== 'undefined' && typeof response.data !== 'undefined' && 
    typeof response.data['code_b'] !== 'undefined') {

    if(typeof completeSSOCallback !== 'undefined') {
      completeSSOCallback(response.data['code_b']);
    }

  } else {
    console.log("Spot.IM code_b retreival error:");
    console.log(response);

    logout_spot_im(); // Because Spot.IM wants logout on every non-sso pageload
  }
    
  //if there is a php error (we check with js first, sometimes an error might get to php we double check)       
  if(response.success){
    jQuery(document).trigger('close.facebox'); 
  }else{
    $('#errorDisplay').html(rcmg_api_first_error(response.messages));
  }
}

function cookie_sso(codeA, completeSSOCallback)
{
  console.log({
    'codeA': codeA,
    'completeSSOCallback': completeSSOCallback
  })
  // call your backend to receive codeB and return it
  // to Spot.IM via completeSSOCallback function
  
  var rcmg_token = getCookie('rcmg_token');
  var rcmg_guid = getCookie('rcmg_guid');

  var data_send = {
    token: rcmg_token,
    guid: rcmg_guid,
    userAgent: navigator.userAgent
  };

  if(typeof codeA !== 'undefined') {
    data_send['code_a'] = codeA;
  }

  rcmg_api_call('spot_login', data_send, function(response) {

    login_callback(response, completeSSOCallback);

    // if this fails, delete cookies and refresh?
  });
}

var spot_im_callback = function(codeA, completeSSOCallback) {

  var rcmg_token = getCookie('rcmg_token');
  var rcmg_guid = getCookie('rcmg_guid');

  if(rcmg_token && rcmg_guid) {
    cookie_sso(codeA, completeSSOCallback);
  } else {
    // Not logged in (no cookies) so no SSO
  }
};

function startSSO() {

  window.SPOTIM.startSSO(spot_im_callback).then(function(result) {
    // result.type === 'SSO_Complete'
    // or
    // result.type === 'SSO_AlreadyLoggedIn'
    console.log('spotim result:');
    console.log(result);

    // SUCCESSFULLY LOGGED IN

  }).catch(function(reason){
    // reason contains error details
    console.log("Spot.IM startSSO error:");
    console.log(reason);

    // Tries one more time
    if(reason == "Can't start SSO process since SSO is in progress") {
      startSSO();
    }
  });
}

/*testing Deployment sync
* 10/14/20
* */