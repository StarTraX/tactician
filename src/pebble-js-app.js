Pebble.addEventListener("ready",function() {
	setTimeout(	flagDataLoaded
		,2000); // trial'n'error found this the best delay to ensure it always starts without the Double free error
		});

function flagDataLoaded( ){
	Pebble.sendAppMessage({ 
		"44": "0", //	FLAGDATALOADED, // 		
		}, function(e) { //success
		}, function(e) { //Fail callback 
	});	
	setTimeout(startHTTP,5000); // wait 5 secs for admin response before starting HTTP client connection
}	
Pebble.addEventListener("appmessage", listenForMsgs);
var adminRole = false; 
var sentFirstWindImage = false;

function bytesToHex(b,count ) {
	//var hexChar ="0123456789abcdef";
 	var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "A", "B", "C", "D", "E", "F"];
	var hexString = "";
	for (var i=0; i< count; i++){
		hexString += (hexChar[(b[i] >> 4) & 0x0f] + hexChar[b[i] & 0x0f]);
	}
return hexString;
}


function listenForMsgs(e) {		
	//console.log("HERE: listenForMsgs");			
	var mURL;
	for (var msgIdx in e.payload ){
		if (msgIdx == 106 && e.payload[msgIdx] =="app_startup_final") { // watch has received the 43 COURSEDIVS from Logger, so  is "admin" & was connected to
			adminRole= true;
			Pebble.removeEventListener("appmessage", listenForMsgs);				
		}
		else if (msgIdx == 100){ // payload contains current Window
			//console.log("Received from watch: "+ e.payload[msgIdx]);
			currentWindow = e.payload[msgIdx];
			if (currentWindow.substr(0,4) =="wind" ){ // wind[Rose|Recent]
				if(sentFirstWindImage ==true){
					currentWindow = currentWindow+"EVEN";
					sentFirstWindImage=false;	
				}
				else {
					currentWindow = currentWindow+"ODD";
					sentFirstWindImage=true;	
				}				
			}
			var url = localStorage.WEB_HOST + "/readNavDataJson.php?currentWindow="+ currentWindow; 
			//console.log("url: "+ url);
			var request = new XMLHttpRequest(); 
			request.open("GET", url, true);
			request.send(null);
			request.onreadystatechange = function () {
				if (request.readyState == 4 ){
				   	if(request.status == 200){ 
						var response = request.responseText;
						//console.log(" from PWS. length"+ response.length + " response: "+ response);
						if ( response.length == 0){
							console.log("Found 0 length");						
						}
						else {
							var msgObj = JSON.parse( request.responseText);	
							if (msgObj[60] != undefined ){
								//console.log("Window: "+currentWindow + ": Base64: " + msgObj[60])
								console.log (currentWindow+ ", encoded: "+ msgObj[60].substr(0,8));
								var raw = atob(msgObj[60]);
								//var raw =	Base64.decode(msgObj[60])
								//console.log (currentWindow+ ", bytesToHex: "+bytesToHex(raw, 3));
									msgObj[60]= raw;
									console.log (currentWindow + " charCodeAt(3) (224?): "+ msgObj[60].charCodeAt(3));

								//console.log ("atob [60] convert OK. Length: "+ msgObj[60].length);
							}
							if (msgObj[61] != undefined ){
								console.log (currentWindow+ ", encoded: "+ msgObj[61].substr(0,8));
								var raw = atob(msgObj[61]);
								msgObj[61]= raw;
							}
							
							Pebble.sendAppMessage(msgObj
								, function(e) { //Success callback	
									//console.log(currentWindow + " Received OK");
									},
									function(e) { //Fail callback	
									//	console.log(currentWindow + "Receive FAILED");
									}
								);
							
						}
					}
					else
						Pebble.showSimpleNotificationOnPebble("HTTP Fail", "Check that your web server is running on "+ url); 						}
			};	 //onReadyStateChange						
		} // if msgIdx == 100
	} //for msgIdx in payload
}

localStorage.name = 'myLocalStorage';
var WEB_HOST ;
function startHTTP(){
	if (adminRole==true ) { // did we get an "app_startup_final" msg to indicate we're an admin user?
		return;
	}
	if (localStorage.WEB_HOST != null)
		console.log("Starting HTTP at " + localStorage.WEB_HOST) ;
	else {
		console.log("No local storege.WEB_HOST")  ;
		localStorage.WEB_HOST = "http://192.168.43.1:8080/dashboard";
	}
localStorage.WEB_HOST = "http://192.168.0.4:8080/dashboard"; //DEVELOPMENT...DEBUGGING
	
}

