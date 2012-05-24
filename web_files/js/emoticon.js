var iconsStandard = [
	":blush:",":confused:",":cool:",":crying:",":devil:",":dirty:",":erm:",":glasses:",":green:",":happy:",":kiss:",":laugh:",":mad:",":nervous:",":omg:",":sad:",":smile:",":surprised:",":tongue:",":wink:"
];

var iconsExtra = [
	":Angry-Mad.gif:",":Angry-No.gif:",":Angry-Sweaty.gif:",":Angry-YUNO.gif:",":Anticipating-Determined.gif:",":Anticipating-PFFFTCCHCHCHHFFFTTT.gif:",":Cereal-Cereal.gif:",
	":Cereal-Newspaper.gif:",":FuckYea-ChallengeAccepted.gif:",":FuckYea-Drunk.gif:",":FuckYea-FuckYea.gif:",":FuckYea-GTFO.gif:",":Gropaga.png:",
	":Happy-Contentment.gif:",":Happy-EverythingWentBetterThanExpected.gif:",":Happy-GirlHappy.gif:",":Happy-Happy.gif:",":Happy-High.gif:",":Happy-Hopeful.gif:",":Happy-Nice.gif:",
	":Happy-OpenMouth.gif:",":Happy-SoMuchWin.gif:",":Happy-Stoned.gif:",":IAmDisappoint.png:",":Laughing-AintThatSomeShit.png:",":Laughing-AwwwYea.png:",":Laughing-BigGrin.png:",
	":Laughing-FuckThat.gif:",":Laughing-LOL.gif:",":Lust-MeGusta.gif:",":Lust-NoMeGusta.gif:",":Neutral-Dude,ComeOn.gif:",":Neutral-Herp.gif:",
	":Neutral-Hmm.gif:",":Neutral-PokerFace.png:",":Neutral-PokerFace2.png:",":Neutral-Tongue.gif:",":Rage-FullPanelRage.png:",":Rage-Gasp.gif:",":Rage-Girl.gif:",":Rage-Girl2.gif:",
	":Rage-Imminent.gif:",":Rage-Intense.png:",":Rage-Original.png:",":Rage-Pig.gif:",":RetardDog.gif:",":Sad-Actually.png:",":Sad-Actually.ItsNotOkay.gif:",":Sad-Baww.gif:",
	":Sad-ForeverAlone.gif:",":Sad-Friends.gif:",":Sad-GirlWhyHands.gif:",":Sad-OhNo.gif:",":Sad-Okay.gif:",":Sad-WhyHands.gif:",":Seriously-GirlWhat.gif:",":Seriously-Suspicious.gif:",
	":Seriously-What.gif:",":Surprised-Disgusted.gif:",":Surprised-Milk.gif:",":Surprised-Oooh.gif:",":Surprised-StareDad.gif:",":Troll-Baby.gif:",
	":Troll-Douchebag.png:",":Troll-Excited.gif:",":Troll-Foiled.gif:",":Troll-GirlTroll.gif:",":Troll-JumpingTrolldad.png:",":Troll-Melvin.gif:",":Troll-MelvinSad.gif:",
	":Troll-Troll.gif:",":Troll-TrollDad.gif:",":Lust-FapFapFap.png:"
];

function showExtra(){
	$("#showmorespan").hide();
	$("#ads").hide();
	$("#moreemoticonswrapper").show();
	
	if ($("#moreemoticons").html() == ""){
		var emoticonsHtml = "";
		
		for(var i = 0; i < iconsExtra.length; i++){
			var iconStripped = iconsExtra[i].substring(1, iconsExtra[i].length-1);
			emoticonsHtml += ('<img onclick="insertEmoticon(\'' + iconsExtra[i] + '\');" class="emoticonextra" src="emoticon?' + iconStripped + '">');
		}
		
		$("#moreemoticons").html(emoticonsHtml);
	}
}

function hideExtra(){
	$("#moreemoticonswrapper").hide();
	$("#showmorespan").show();
	$("#ads").show();
}

function replaceEmoticons(text){
	for(var i = 0; i < iconsStandard.length; i++){
		text = text.replace(new RegExp(iconsStandard[i], 'gi'), '<img class="emoticonreal" src="http://' + document.domain + '/emoticon?' + iconsStandard[i].substring(1, iconsStandard[i].length-1) + '.gif">');
	}
	for(var i = 0; i < iconsExtra.length; i++){
		text = text.replace(new RegExp(iconsExtra[i], 'gi'), '<img class="emoticonreal" src="http://' + document.domain + '/emoticon?' + iconsExtra[i].substring(1, iconsExtra[i].length-1) + '">');
	}
	
	return text;
}

function displayEmoticons(){
	var emoticonsHtml = "";
	
	for(var i = 0; i < iconsStandard.length; i++){
		var iconStripped = iconsStandard[i].substring(1, iconsStandard[i].length-1);
		emoticonsHtml += ('<img onclick="insertEmoticon(\'' + iconsStandard[i] + '\');" class="emoticon" src="emoticon?' + iconStripped + '.gif">');
	}
	
	$("#emoticonsholder").html(emoticonsHtml);
}

function insertEmoticon(text) {
	if (!$('#textinput').is(':disabled')){
		var txtarea = document.getElementById('textinput');
		var scrollPos = txtarea.scrollTop;
		var strPos = 0;
		var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
			"ff" : (document.selection ? "ie" : false ) );
		if (br == "ie") { 
			txtarea.focus();
			var range = document.selection.createRange();
			range.moveStart ('character', -txtarea.value.length);
			strPos = range.text.length;
		}
		else if (br == "ff") strPos = txtarea.selectionStart;
	
		var front = (txtarea.value).substring(0,strPos);  
		var back = (txtarea.value).substring(strPos,txtarea.value.length); 
		txtarea.value=front+text+back;
		strPos = strPos + text.length;
		if (br == "ie") { 
			txtarea.focus();
			var range = document.selection.createRange();
			range.moveStart ('character', -txtarea.value.length);
			range.moveStart ('character', strPos);
			range.moveEnd ('character', 0);
			range.select();
		}
		else if (br == "ff") {
			txtarea.selectionStart = strPos;
			txtarea.selectionEnd = strPos;
			txtarea.focus();
		}
		txtarea.scrollTop = scrollPos;
	}
}