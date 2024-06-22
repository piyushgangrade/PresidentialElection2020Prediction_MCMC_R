//used with createcookie function to match domain
function getDomLoc(){
	var path = window.location.host;
	if(path.substr(0,3)=='www'){
		var per=path.indexOf('.')
		per=per+1;
		path=path.substr(per);
	}
	return path;
}

//gets querystring variable value
function getQuery(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	}
}

function buildCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/; domain=."+getDomLoc()+"";
}


//used to check if cookie exists
function checkCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

mobile_redirect = getQuery('mobile_redirect');

if(mobile_redirect == "false"){
	buildCookie("rc_mobile","0",-1); //DELETES COOKIE
}else if(mobile_redirect=="true"){
	buildCookie("rc_mobile","1",365); //CREATES COOKIE
}

var isHome = document.getElementById("home");
if(isHome){
	if( screen.width<768 && !navigator.userAgent.match(/Windows Phone/i) && (mobile_redirect!="false" && typeof mobile_redirect == "undefined") ){ //if mobile but not windows phone
		document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=1" >');		
	}else if( checkCookie("rc_mobile")==1 || mobile_redirect=="true" ){
		document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=1" >');
	}
	
}else{
	if( typeof mobile_redirect == "undefined" || (checkCookie("rc_mobile")==1 || mobile_redirect=="true") ){ 
		document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=1" >');		
	}
}


function loadDesktop(){
	var deskLink = location.pathname+'?mobile_redirect=false';
	window.location.replace(deskLink);
}

function loadMobile(){
	var mobLink = location.pathname+'?mobile_redirect=true';
	window.location.replace(mobLink);
}
	

