var http = require('http'),
	https = require('https'),
    fs = require('fs'),
	urlParse = require('url'),
	mime = require('mime'),
	qs = require('querystring'),
	mongodb = require('mongodb'),
	database = new mongodb.Db('zuchat', new mongodb.Server("127.0.0.1", 27017, {}), {}),
	CollectionChats, CollectionMessages,
	EventType = { Connected : 0, Typing: 1, Message: 2 },
	Gender = { Male: 0, Female: 1, Anyone: 2 };

database.open(function (error, client) {
	if (error) console.log(error);
	CollectionChats = new mongodb.Collection(client, 'chats');
	CollectionMessages = new mongodb.Collection(client, 'messages');
});

process.on('uncaughtException', function (err) {
	console.log(err.stack);
});
	
Array.prototype.remove = function(from, to){
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

function MakeID(){
	var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < 5; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
};

var staticSiteBase = __dirname + '/web_files/', staticFiles, staticEmoticons;
function createFileMap(staticPaths){
	var fileArray = new Array();
	for (var i = 0; i < staticPaths.length; i++){
		var staticPath = staticSiteBase + staticPaths[i];
		var fileNames = fs.readdirSync(staticPath);
		for(var f = 0; f < fileNames.length; f++){
			if (fileNames[f] != '_notes') fileArray[fileNames[f]] = fs.readFileSync(staticPath + fileNames[f]);
		}
	}
	return fileArray;
};

function loadFiles(){
	staticFiles = createFileMap(['css/', 'js/', 'img/', 'html/']);
	staticEmoticons = createFileMap(['emoticons/']);
}
loadFiles();


function Chat(id, gender, chatWith){
	this.ChatID = id;
	this.PartnerID = null;
	this.UserGender = gender;
	this.ChatWith = chatWith;
	this.EventHandle = null;
	this.HeartBeat = new Date();
};
var Chats = new Array();

function CleanupTimeouts(){
	var currentStamp = new Date();
	for(var i = 0; i < Chats.length; i++){
		if (currentStamp - Chats[i].HeartBeat > 11500){
			HandleDisconnect(Chats[i]);
			CleanupTimeouts();
			return;
		}
	}
}
setInterval(function(){CleanupTimeouts();}, 3000);


/*Chat Methods */
	function FindChat(id){
		for(var i = 0; i < Chats.length; i++){
			if (Chats[i].ChatID == id) return Chats[i];
		}
		return null;
	};
	
	//WHAM!! Super efficient and reliable messaging
	function SendEvent(chatID, eventType, data){
		var matchingChat = FindChat(chatID);
		if (matchingChat == null) return;
		if (matchingChat.EventHandle == null){
			setTimeout(function(){SendEvent(chatID, eventType, data)}, 100);
			return;
		}
		matchingChat.EventHandle.writeHead(200, {'Content-Type': 'text/plain'});
		matchingChat.EventHandle.end('[' + JSON.stringify({'Type': eventType, 'Data': data}) + ']');
		matchingChat.EventHandle = null;
	};
	
	function RemoveDead(id){
		for(var i = 0; i < Chats.length; i++){
			if (Chats[i].ChatID == id){
				Chats.remove(i);
				return;
			}
		}
	}
	
	function HandlePartnerConnect(matchingChat, partnerChat){
		matchingChat.PartnerID = partnerChat.ChatID;
		SendEvent(matchingChat.ChatID, EventType.Connected, '1');
	};
	
	function HandleClose(response){
		if (response == null) return;
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end();
	};

	function HandleStart(request, response){
		var cookies = {};
		request.headers.cookie && request.headers.cookie.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
		});
		var newChat = new Chat(MakeID(), cookies.gender, cookies.chatwith);
		Chats.push(newChat);
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(newChat.ChatID);

		var historyStat = newChat.UserGender + '-' + newChat.ChatWith;
		CollectionChats.update({name: historyStat}, {$inc:{count: 1 }}, {upsert:true});
		
	};
	
	function HandleEvents(response, matchingChat){
		HandleClose(matchingChat.EventHandle);
		matchingChat.EventHandle = response;
		if (matchingChat.PartnerID == null){
			for(var i = 0; i < Chats.length; i++){
				var foundMatch = false;
				if (Chats[i].PartnerID == null && Chats[i].ChatID != matchingChat.ChatID){
					if (matchingChat.ChatWith == 'anyone' && Chats[i].ChatWith == 'anyone') 
						foundMatch = true;
					else if (matchingChat.ChatWith == Chats[i].UserGender && Chats[i].ChatWith == matchingChat.UserGender)
						foundMatch = true;
					else if (matchingChat.ChatWith == Chats[i].UserGender && Chats[i].ChatWith == 'anyone')
						foundMatch = true;
				}
				if (foundMatch){
					HandlePartnerConnect(matchingChat, Chats[i]);
					HandlePartnerConnect(Chats[i], matchingChat);
					break;
				}
			}
		}
	};
	
	function HandleTyping(matchingChat, POST){
		var partnerChat = FindChat(matchingChat.PartnerID);
		if (partnerChat != null)
			SendEvent(partnerChat.ChatID, EventType.Typing, POST['msg']);
	};
	
	function HandleSend(matchingChat, POST){
		var partnerChat = FindChat(matchingChat.PartnerID);
		if (partnerChat != null){
			SendEvent(partnerChat.ChatID, EventType.Message, POST['msg']);
			if (matchingChat != null){
				var historyStat = matchingChat.UserGender + '-' + matchingChat.ChatWith;
				CollectionMessages.insert({type: historyStat, chatid: matchingChat.ChatID, partnerid: matchingChat.PartnerID, message: POST['msg']});
			}
		}
	};
	
	function HandleDisconnect(matchingChat){
		var partnerChat = FindChat(matchingChat.PartnerID);
		if (partnerChat != null){
			SendEvent(partnerChat.ChatID, EventType.Connected, '0');
			RemoveDead(partnerChat.ChatID);
		}
		RemoveDead(matchingChat.ChatID);
	};
/* .... */

function HandleStats(response){
	CollectionChats.find({}).toArray(function(err, docs){
		CollectionMessages.count(function(err2, count){
			var Stats = {};
			Stats.Online = Chats.length;
			Stats.History = {};
			Stats.Matches = {};
			Stats.Messages = count;
	
			for (var i = 0; i < Chats.length; i++){
				var statId = Chats[i].UserGender + '-' + Chats[i].ChatWith;
				if (Stats.Matches[statId] == undefined) Stats.Matches[statId] = 0;
				Stats.Matches[statId]++;
			}
			
			for (matched in docs){
				Stats.History[docs[matched].name] = docs[matched].count;
			}
			
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.end(JSON.stringify(Stats));
		})
	});
}

http.createServer(function(request, response){
	var urlParts = urlParse.parse(request.url, true);
	var requestedFile = urlParts.pathname.substring(1);
	this.response = response;
	if (request.method == 'POST'){
		if (requestedFile == 'start') HandleStart(request, response);
		else {
			var body = '';
			request.on('data', function(data){ body += data; });
			request.on('end', function(){
				var POST = qs.parse(body);
				var matchingChat = FindChat(POST['id']);
				if (matchingChat != null){
					matchingChat.HeartBeat = new Date();
					switch(requestedFile){
						case 'events':
							HandleEvents(response, matchingChat);
							break;
						case 'typing':
							HandleTyping(matchingChat, POST);
							break;
						case 'send':
							HandleSend(matchingChat, POST);
							break;
						case 'disconnect':
							HandleDisconnect(matchingChat);
							break;
					}
					if (requestedFile != 'events') HandleClose(response);
				}
				else if (requestedFile == 'downloadlog'){
					response.writeHead(200, {'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="zuChat conversation log.html"'});
					response.end(staticFiles['log.html'].toString('utf8').replace('<!--LOGITEMS-->', decodeURIComponent(POST['log'])));
				}
			});
		}
	}
	else{
		switch(requestedFile){
			case 'statsvalues':
				HandleStats(response);
				break;
			case 'kill':
				response.end('killed');
				process.exit(0);
				break;
			case 'reload':
				loadFiles();
				response.end('reloaded');
				break;
			case 'emoticon':
				var imagePath = urlParse.parse(request.url).search.substring(1);
				if (imagePath in staticEmoticons){
					response.writeHead(200, {'Content-Type': mime.lookup(imagePath)});	
					response.end(staticEmoticons[imagePath]);
				}
				else response.end();
				break;
			case 'home':
				response.writeHead(302, {'Content-Type': 'text/plain', 'Location': '/', 'Set-Cookie': ['showhome=true']});
				response.end();
				break;
			default:
				switch(requestedFile){
					case '': requestedFile = 'index.html'; break;
					case 'about': requestedFile = 'about.html'; break;
					case 'stats': requestedFile = 'stats.html'; break;
					case 'verify': requestedFile = 'verify.html'; break;
					default:
						if (staticFiles[requestedFile] === undefined) requestedFile = 'none.html';
						break;
				}
				response.writeHead(200, {'Content-Type': mime.lookup(requestedFile)});	
				response.end(staticFiles[requestedFile]);
				break;
		}
	}
	
}).listen(1338);

console.log('Setup successfully');




/* Facebook is an ugly creature (NOW handled client-side)*/
/*	var FacebookInfo = {
	AppID: '213199302051720',
	AppSecret: '86bf09cf3049fcee5642f9718cf75f86',
	VerficationUrl: 'http://zuchat.com/verify',
	CookieExpireData: '; max-age=31622400'
};

function HandleVerify(response, urlParts){
		if (urlParts.query['chatwith'] == 'anyone'){
			response.writeHead(302, {'Content-Type': 'text/plain', 'Location': '/', 'Set-Cookie': ['showhome=false', 'gender=anyone', 'chatwith=anyone']});
			response.end();
		}
		else if (urlParts.query['code'] == undefined){
			var facebookUrl = 'http://www.facebook.com/dialog/oauth?client_id=' + FacebookInfo.AppID
				+ '&redirect_uri=' + encodeURIComponent(FacebookInfo.VerficationUrl + '?chatwith=' + urlParts.query['chatwith'])
				+ '&state=' + MakeID();
			response.writeHead(302, {'Content-Type': 'text/plain', 'Location': facebookUrl, 'Set-Cookie': ['explain=true', 'requestedchatwith=' + urlParts.query['chatwith']]});
			response.end();
		}
		else if (urlParts.query['code'] != undefined){
			var tokenUrl = '/oauth/access_token?client_id=' + FacebookInfo.AppID
				+ '&redirect_uri=' + encodeURIComponent(FacebookInfo.VerficationUrl + '?chatwith=' + urlParts.query['chatwith'])
				+ '&client_secret=' + FacebookInfo.AppSecret
				+ '&code=' + urlParts.query['code'];
				
			var data = '';
			https.get({host: 'graph.facebook.com', path: tokenUrl }, function(result){
				result.setEncoding('utf8');
				result.on('data', function(d){ data += d; });
				result.on('end', function(){
					var token = qs.parse(data).access_token;
					data = '';
					https.get({host: 'graph.facebook.com', path: "/me?access_token=" + token}, function(result){
						result.setEncoding('utf8');
						result.on('data', function(d){ data += d; });
						result.on('end', function(){
							response.writeHead(302, {'Content-Type': 'text/plain', 'Location': '/', 'Set-Cookie': [
								'showhome=false' + FacebookInfo.CookieExpireData, 
								'gender=' + JSON.parse(data).gender + FacebookInfo.CookieExpireData, 
								'chatwith=' + urlParts.query['chatwith'] + FacebookInfo.CookieExpireData, 
								'explain=false' + FacebookInfo.CookieExpireData]});
							response.end();
						});
					});
				});
			});
		}
		else{
			console.log('4) just sending to chatwith');
			response.writeHead(302, {'Content-Type': 'text/plain', 'Location': '/chatwith=' + urlParts.query['chatwith'], 'Set-Cookie': ['explain=true']});
			response.end();
		}
	}*/
/* .... */