var introMessage = "Don't start a conversation by asking for gender! There are the above chat sections for that... you are in '<i>chat with anyone</i>.'";
var uploadialogcolor;
var chatid = '';

function setCookie(c_name,value,exdays)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name){
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++){
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_name) return unescape(y);
	}
}

function getUrlVars(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

var gender, chatwith, explain, showhome, requestedChatWith;
function readCookies(){
	gender = getCookie("gender");
	chatwith = getCookie("chatwith");
	explain = getCookie("explain");
	showhome = getCookie("showhome");
	requestedChatWith = getCookie("requestedchatwith");
	
	if (gender == null || gender == "") gender = 'anyone';
	if (chatwith == null || chatwith == "") chatwith = 'anyone';
	if (explain == null || explain == "") explain = "false";
	if (showhome == null || showhome == "") showhome = "true";
	if (requestedChatWith == null || requestedChatWith == "") requestedChatWith = "anyone";
}	
function gotData(data){
	if (data.gender == undefined){
		setCookie('showhome', 'true', 365);
		setCookie('explain', 'true', 365);
		setCookie('gender', 'anyone', 365);
	}
	else{
		setCookie('showhome', 'false', 365);
		setCookie('explain', 'false', 365);
		setCookie('gender', data.gender, 365);
		setCookie('chatwith', requestedChatWith, 365);
	}
	window.location.hash = '';
	readCookies();
	PreparePage();
}

$(document).ready(function(){
	readCookies();
	var accessToken = window.location.hash.substring(1);
	if (accessToken.indexOf('access_token') != -1){
		var url = "https://graph.facebook.com/me?" + [accessToken, 'callback=gotData'].join('&');
		var script = document.createElement('script');
		script.src = url;
		document.body.appendChild(script);
	}
	else{
		PreparePage();
	}
});
	
function PreparePage(){
	if (explain == "true") showExplain();
	displayselectedchat();
	displayEmoticons();

	window.onbeforeunload = function() { if (mainState == 1) quickDisconnect(); }
	
	$(document).keydown(function(e){
		if (e.keyCode == 27) if (!$('#mainbutton').is(':disabled')) setTimeout("mainClick();", 1);
	});

	$('#textinput').bind('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code != 27){
			clearTimeout(typingTimer);
			typingTimer = setTimeout("monitorTyping()", 5000);
			setTimeout(function(){
				if(start_type == false && $("#textinput").val() != "") {
					start_type = true;
					$.post('typing', {
						id: chatid,
						msg: "1"
					});
			}}, 30);
			if(code == 13) {
				clearTimeout(typingTimer);
				start_type = false;
				sendMessage();
				return false;
			}
		}
	});

	if ($.browser.msie){
		$(window).bind('blur', function(){ pageVisible = false; });
		$(window).bind('focus', function(){ pageVisible = true; });
	}
	else{
    	$(document).bind('focusout', function(){ pageVisible = false; });
    	$(document).bind('focusin', function(){ pageVisible = true; });
	}


	jQuery.download = function(url, data, method){
		if( url && data ){ 
			data = typeof data == 'string' ? data : jQuery.param(data);
			var inputs = '';
			jQuery.each(data.split('&'), function(){ 
				var pair = this.split('=');
				inputs+='<input type="hidden" name="'+ pair[0] +'" value="'+ pair[1] +'" />'; 
			});
			jQuery('<form action="'+ url +'" method="'+ (method||'post') +'">'+inputs+'</form>')
			.appendTo('body').submit().remove();
		};
	};


	uploadialogcolor = $("#uploaddialog").css("background-color");
	$("#uploaddialog").mouseover(function() {
		$("#uploaddialog").css("background-color", "#d7d7d7");
	}).mouseout(function(){
		setUploadDialogDefault();
	});

	resetUploadBox();

	var noop = function(event) {event.stopPropagation(); event.preventDefault(); }
	window.addEventListener("dragenter", noop, false);
	window.addEventListener("dragexit", noop, false);
	window.addEventListener("dragover", noop, false);
	window.addEventListener('drop', function(event){ noop(event); uploadStarted(event.dataTransfer.files[0]); }, false);
}


var typingTimer, start_type=false, lastKnownTyping = false;
function monitorTyping(){
	if (start_type == true){
		if ($("#textinput").val() == ""){
			start_type = false;
			$.post('typing', {
				id: chatid,
				msg: "0"
			});
		}
		else{
			typingTimer = setTimeout("monitorTyping()", 5000);
		}
	}
}

function displayTyping(isTyping){
	lastKnownTyping = isTyping;
	if (isTyping){
		$('#typing').remove();
		$('#log').append('<div id="typing">Stranger is typing...</div>');
	}
	else
		$('#typing').remove();
		
	$("#log").scrollTop($("#log")[0].scrollHeight);
}

var pageVisible = true, alertIndex = false, alertedTimer;
function messageAlert(){
	alerted = true;
	var defaultTitle = "zuChat";
	var alertTitle = "*** zuChat ***";
	var newTitle = defaultTitle;
	if (alertIndex) newTitle = alertTitle;
	alertIndex = !alertIndex;
	
	if (!pageVisible){
		clearTimeout(alertedTimer);
		alertedTimer = setTimeout("messageAlert()", 1000);
	}
	else newTitle = defaultTitle;
	document.title = newTitle;
}

function displayselectedchat(){
	if (showhome == "false"){
		$("#chat").show();
		$("#chatselectorwrapper").show();
		$("#intro").hide();
		
		var selectedChatWith = chatwith;
		var children = document.getElementById('chatselectorwrapper').getElementsByTagName('span');
		var i = 0;
		for (i = 0; i < children.length; i++)
		{
			var spanTarget = children[i];
			if (selectedChatWith == children[i].id)
				$(spanTarget).addClass('chatselectoron');
			else
				$(spanTarget).removeClass('chatselectoron');
		}
		
		switch(gender){
			case 'anyone':
				$('body').removeClass('maleback');
				$('body').removeClass('femaleback');
			  break;
			case 'female':
				$('body').removeClass('maleback');
				$('body').addClass('femaleback');
			  break;
			case 'male':
				$('body').removeClass('femaleback');
				$('body').addClass('maleback');
			  break;
		}
		if (mainState == 1){
			mainClick();
		}
		$('#log').html('<div id="status">Click new to begin chatting with ' + (chatwith == 'anyone' ? chatwith : (chatwith + 's')) + '</div>');
	}
	else{
		$("#intro").show();
	}
}

function showExplain(){
	$('#overlay').show();
	$('#explain').css('visibility','visible').hide().fadeIn(500);
	$('.chatwith').html(requestedChatWith + 's');
}

function cancelExplain(){
	$('#overlay').hide();
	$('#explain').hide();
	setCookie("explain", "false", "365");
}

function chatselected(selectedchatwith, showexplain){
	requestedChatWith = selectedchatwith;
	
	if (selectedchatwith == 'anyone' || gender != 'anyone' ){
		setCookie('showhome', 'false', 365);
		setCookie('gender', gender, 365);
		setCookie('chatwith', selectedchatwith, 365);
		chatwith = selectedchatwith;
		showhome = 'false';
		displayselectedchat();
		//window.location.href = 'http://' + window.location.host;
	}
	else{	
		if (showexplain && gender == 'anyone') showExplain(selectedchatwith);
		else{
			setCookie('explain', 'true', 365);
			setCookie('showhome', 'true', 365);
			setCookie('requestedchatwith', requestedChatWith, 365);
			var redirectUrl = window.location.protocol + "//" + window.location.host;
			window.location.href = 'https://www.facebook.com/dialog/oauth?' + ['client_id=213199302051720', 'redirect_uri=' + encodeURIComponent(redirectUrl), 'response_type=token'].join('&');
		}
	}
}

function mainClick(){
	$('#mainbutton').attr('disabled', 'disabled');
	switch(mainState){
		case 0: //new
			mainState = 1;
			startNew();
			break;
		case 1: //disconnect
			sendDisconnect();
			break;
	}
}

function downloadLog(){
	$.download('/downloadlog','log=' + encodeURIComponent($('#logwrap').html()));
}

var mainState = 0;
function startNew(){
	//$('#log').empty();
	document.getElementById('log').innerHTML = "";
	
	var connecting = [];
	connecting['status'] = 'connecting';
	handleUpdates(connecting);
	
	$.ajax({
		type: "POST",
		url: "start",
		dataType: "text",
		data: { "gender": gender, "chatwith": chatwith},
		cache: false,
		success: function(data){
			if(data != null && data.msg != '')
			{
				chatid = data;
				checkUpdate();
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){  
			//alert('error '+ textStatus + " (" + errorThrown + ")");   
		}  
	});
}

function handleUpdates(updates){
	if (mainState == 1){
		for (var i = 0; i < updates.length; i++) { 
			switch(updates[i].Type){
				case 0:
					if (updates[i].Data == "1"){
						messageAlert();
						var dismessage = chatwith =='anyone' ? 'Chatting with partner' : 'You are a ' + gender + ' chatting with ' + chatwith;
						if (chatwith == 'anyone'){
							dismessage += "<br/>" + introMessage;
						}
						displayMessage(true, false, dismessage, true);
						$("#mainbutton").removeAttr('disabled');
						$("#mainbuttontext").html("Disconnect");
						$("#textinput").removeAttr('disabled');
						$("#textinput").focus();
						mainState = 1;
					}
					else{
						if (mainState != 0){
							messageAlert();
							displayMessage(true, false, "Partner disconnected", false);
							showLogDownloadLink();
							$("#mainbutton").removeAttr('disabled');
							$("#mainbuttontext").html("New");
							$('#textinput').attr('disabled', 'disabled');
							$("#log").focus();
							mainState = 0;
							displayTyping(false);
						}
					}
					break;
				case 1:
					if (updates[i].Data == "1" && mainState == 1) displayTyping(true);
					else  displayTyping(false);
					break;
				case 2:
					messageAlert();
					displayMessage(false, false, updates[i].Data, false);
					displayTyping(false);
					break;
			}
		}
	
		if ("status" in updates) {
			switch(updates['status']){
				case 'connecting':
					displayMessage(true, false, "Looking for partner...", true);
					break;
				case 'youdisconnected':
					messageAlert();
					displayMessage(true, false, "You disconnected", false);
					showLogDownloadLink();
					$("#mainbutton").removeAttr('disabled');
					$("#mainbuttontext").html("New");
					$('#textinput').attr('disabled', 'disabled');
					$("#log").focus();
					mainState = 0;
					displayTyping(false);
					break;
			}
		}
	}
}

function showLogDownloadLink(){
	if ($("#log").children().length > 4){
		$("#log").html("<div id='logwrap' style='width:100%;'>" + $("#log").html() + "</div>");
		displayMessage(true, false, "Do you want to keep this conversation? <span onclick='downloadLog();' class='linkstyle'>Download the log</span>", false);
	}
}

function displayMessage(status, fromMe, message, updateold){
	if (status)
		if (updateold && $('#status').length > 0){
			$('#status').html(message);
		}
		else{
			$('#log').append('<div id="status" class="logentry">' + message + '</div>');
		}
	else{
		var from = "";
		if (fromMe)
			from = "<span class='fromMe'>You: </span>";
		else
			from = "<span class='fromStranger'>Stranger: </span>";
		
		var url_regexp = /(https?:\/\/[A-Za-z0-9~\/._\?\&=\-%#\+:\;,\@\']+)/;
		message = message.replace(/(<.*?>)/ig,"");
		message = message.replace(url_regexp, function($0, $1) { return '<a target="_blank" href="' + $1 +'">' + $1 + '</a>'; });
		message = replaceEmoticons(message);
		message = replaceImages(message);

		$('#log').append('<div class="logentry">' + from + message + '</div>');
		displayTyping(lastKnownTyping);
	}
	$("#log").scrollTop($("#log")[0].scrollHeight);
}

function checkUpdate(){
	if (mainState == 1){
		$.ajax({
			type: "POST",
			url: "events",
			data: { "id": chatid},
			dataType: 'json',
			timeout: 7500,
			cache: false,
			success: function(data){
				handleUpdates(data);
				checkUpdate();
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){  
				checkUpdate();
				//alert('error '+ textStatus + " (" + errorThrown + ")");   
			}  
		});
	}
}

function quickDisconnect(){	
	var myajaxrequest;
	var activexmodes=["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]
	if (window.ActiveXObject){
		for (var i=0; i<activexmodes.length; i++){
			try { 
				myajaxrequest = new ActiveXObject(activexmodes[i]);
				break;
			}
			catch(e) { }
		}
	}
	else myajaxrequest = XMLHttpRequest();
	
	
	
	var parameters = "id=" + chatid;
	myajaxrequest.open("POST", "disconnect", false);
	myajaxrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	myajaxrequest.send(parameters);
	
	var connecting = [];
	connecting['status'] = 'youdisconnected';
	handleUpdates(connecting);
}

function sendDisconnect(){
	$.post('disconnect', { id: chatid });
	var connecting = [];
	connecting['status'] = 'youdisconnected';
	handleUpdates(connecting);
}

function sendMessage(){
	if ($("#textinput").val().search(/[^\n\s]/)!=-1){
		var messageStr = $("#textinput").val().replace(/(<.*?>)/ig,"");
		displayMessage(false, true, messageStr, false);
		
		$.post('send', {
			id: chatid,
			msg: messageStr
		});
	}
	$("#textinput").val("");
}
