function UploadComplete(imageID){
	newUpload();
	if (imageID == "none")
		alert("Upload failed");
	else
		$("#uploadedimages").append('<img class="imageuploadthumb" onclick="insertImage(\'' + imageID + '\');" src="http://i.imgur.com/' + imageID + 's.jpg" title="Click to insert" alt="Loading..."/>');
}

function insertImage(imageID){
	insertEmoticon("imageupload::" + imageID + "::");
}

function replaceImages(text){
	var re = new RegExp("imageupload::([^<]{5})::");
	while(true){
		var matchN = re.exec(text);
		if (matchN == null){
			break;
		}
		var matchT = matchN[1];
		var replaceSub = "imageupload::" + matchT + "::";
		var randomFix = Math.floor(Math.random()*1111);
		text = text.replace(replaceSub, "<span style='font-style:italic' id='loading" + matchT + randomFix + "'><img src='loading.gif'/>Image loading...</span><div id='loadingimg" + matchT + randomFix + "' style='width:0px;height:0px'><a target='_blank' href='http://i.imgur.com/" + matchT + ".jpg'><img onload='replaceLoadingImage(\"" + matchT + randomFix + "\");' border='0' src='http://i.imgur.com/" + matchT + "l.jpg' title='Click to enlarge' /></a></div>");
	}
	return text;	
}

function replaceLoadingImage(imgID){
	$("#loading" + imgID).hide();
	$("#loadingimg" + imgID).css("height", "");
	$("#loadingimg" + imgID).css("width", "");
}

function displayUploadBox(show){
	if ($.browser.msie) {
		alert("Internet Explorer does not support this feature. Get a real browser!");
		return;
	}
	if (show == $('#uploadbox').is(':visible')) return;
	if (show) {
		$('#uploadbox').show();
		$('#uploadimage').hide();
		var test1 = parseInt($("#log").css("bottom"));
		var test2 = parseInt($("#uploadbox").css("height"));
		$("#log").css("bottom", test1 + test2 + 10);

	} else {
		$('#uploadbox').hide();
		$('#uploadimage').show();
		$("#log").css("bottom", "");
	}
}

function clearUploadBox(){
	$('#uploadedimages').html('');
}

function uploadStarted(file){
	displayUploadBox(true);
	if (!file || !file.type.match(/image.*/)){
		UploadComplete('none');
		return;
	}
	
	var fd = new FormData();
	fd.append("image", file);
	fd.append("key", "7312ed9fe5e89d07d7065055d200a379");
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://api.imgur.com/2/upload.json");
	xhr.onload = function(){ UploadComplete(JSON.parse(xhr.responseText).upload.image.hash); };
	xhr.send(fd);
	
	$("#uploaddialog").hide();
	$("#loadinggif").show();
}

function resetUploadBox(){
	$("#file_upload_form").replaceWith('<input name="file_upload_form" id="file_upload_form" type="file" accept="image/*" onchange="uploadStarted(this.files[0]);" />');
}

function newUpload(){
	setUploadDialogDefault();
	resetUploadBox();
	$("#loadinggif").hide();
	$("#uploaddialog").show();
}

function setUploadDialogDefault(){
	$("#uploaddialog").css("background-color", uploadialogcolor);
}