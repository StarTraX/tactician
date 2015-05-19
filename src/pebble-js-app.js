/* jshint -W099 */ //remove warning about mixed spaces and tabs???
var WEB_HOST ; //= "http://192.168.0.6:8080/dashboard/";	
Pebble.addEventListener("ready",load_data);

Pebble.addEventListener("showConfiguration",
  function(e) {
	var pebbleConfigURL = "http://gpsanimator.com/tactician/pebbleConfig";
	Pebble.openURL(pebbleConfigURL);
	}
); //addEventListener showConfiguration
var settings = {};	

Pebble.addEventListener('webviewclosed',					
  function(e) {// calls configData.php which unpacks the config data and writes them to the phone's local storage
	if (e.response != "cancel"){
		var configObj = JSON.parse(e.response); // it's assumed to be a JSON object
		settings = configObj.settings; //"yachtLength":"12","gpsBehindBow":"8","perfStyle":"2","divIdx":"0","startingPolars":"startingPolars.txt","racingPolars":"racingPolars.txt","clubIdx":0,"seriesIdx":"4","PHPSESSID":"b26254b83b75dbd4f803d6adaddc3b89"}
		//console.log("Settings: "+JSON.stringify(settings));	  
		localStorage.settings = JSON.stringify(settings); // available for next login			
		if (configObj.settings.role=="admin"){ // this has to be here, not in the gpsanimator.com/pebbleConfig script  
			var configData = configObj.configData;
			var http = new XMLHttpRequest(); // writing stuff for Logger: userName, seq, dongle MacAddress
			var mURL = "http://localhost:8080/dashboard/configData.php";
			http = new XMLHttpRequest(); //for navStart.php		
			var params = "configData="+encodeURI(JSON.stringify(configData));
			http.open("POST", mURL, true);
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.setRequestHeader("Content-length", params.length);
			http.setRequestHeader("Connection", "close");
			http.send(params);
			http.onreadystatechange = function () {
				if (http.readyState == 4 && http.status == 200 ){
						//console.log ("configData response: "+http.responseText);
					} // if readyState == 4
				}; //onreadystatechange	  
			}
 		load_data();
	} // if not cancel
}//anonymous callback function
	  
    //Pebble.showSimpleNotificationOnPebble('Configuration window returned: ');
);
var watchPhase, selectedWindow, presentPosData, startLinePoints;
Pebble.addEventListener("appmessage",						
	 function(e) {
		 var mURL;
		 var mRequest = new XMLHttpRequest(); 
		for (var msgIdx in e.payload ){
			if (msgIdx == 100){ // selected WINDOW 
				selectedWindow = e.payload[msgIdx];
				//console.log("received: "+selectedWindow);
				if (selectedWindow.substr(0,5)=="start" )
					watchPhase = "start";
				else if (selectedWindow.substr(0, 4) =="perf" )
					watchPhase = "perf";
				else if (selectedWindow.substr(0, 3)=="nav" )
					watchPhase = "nav";
			}
			//console.log("watchPhase: "+watchPhase);
			if (msgIdx == 101){// selected course
			set_course(e.payload[msgIdx]);
			}
			else if (msgIdx == 102){// from next_mark window
				
				if ( e.payload[msgIdx] === 0){
					console.log("Next_mark : manual start");
					mURL =  WEB_HOST + "startNav.php";
					mRequest = new XMLHttpRequest(); //for navStart.php
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);
					mRequest.onreadystatechange = function () {
						  if (mRequest.readyState == 4 && mRequest.status == 200 ){
						   } // if readyState == 4
					}; //onreadystatechange
				}
				else {
					mURL =  WEB_HOST + "markFwdBack.php?indicator="+e.payload[msgIdx];
					//console.log("sending: "+mURL );
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);	
					mRequest.onreadystatechange = function () {
							if (mRequest.readyState == 4 && mRequest.status == 200 ){
								var resp = mRequest.responseText;	
							  	console.log ("markFwdBack.php: with "+  e.payload[msgIdx] + " returned with "+resp);
						   } // if readyState == 4
						}; //onreadystatechange	
				}
			}
			else if (msgIdx == 103){// from start_line
				//console.log ("start_line  with "+  e.payload[msgIdx] );
				mURL = WEB_HOST +"startLinePress.php?whichEnd="+  e.payload[msgIdx]; // Updates & gets location data string
				mRequest.open("GET", mURL, true);
				mRequest.send(null);
				mRequest.onreadystatechange = function () {
					if (mRequest.readyState == 4 ){
						if(mRequest.status == 200){
						} // if status == 200
					} // if readyState == 4
				}; //onreadystatechange
				if (e.payload[msgIdx] == "BOAT") print_division();  //refresh course wirh new start line (bot)
			}
			else if (msgIdx == 104){// Start time 10, 5, 4 mins, as minutes
				startTime = Number(presentPosData.timeMs) + Number(e.payload[msgIdx]) *1000 ; // to thous
				mURL = WEB_HOST +"startLinePress.php?startTime="+  startTime; // Updates & gets location data string
				mRequest.open("GET", mURL, true);
				mRequest.send(null);
				mRequest.onreadystatechange = function () {
					if (mRequest.readyState == 4 ){
						if(mRequest.status == 200){
						} // if status == 200
					} // if readyState == 4
				}; //onreadystatechange
			}
			else if (msgIdx == 105){//  selected course PLUS BRG to mark(s)					
				set_courseWithBrg(e.payload[msgIdx]);
			}
		}
});  //Pebble.addEventListener("appmessage",	
						
function set_course(courseIdx){
	//console.log("set_course: "+courseIdx);
	var url = WEB_HOST + "pebbleGetCourses.php?set_course="+courseIdx; 
	var set_courseRequest = new XMLHttpRequest(); 
	set_courseRequest.open("GET", url, true);	
	set_courseRequest.send(null);
	set_courseRequest.onreadystatechange = function () {
		  if (set_courseRequest.readyState == 4 ){
			   	if(set_courseRequest.status == 200){ // or 404 not found	
					print_division(); //refresh 
				}				
			  else {
				  setTimeout(function(){set_course(courseIdx);},1000);
			  }
		}
	};								  										  
}
function set_courseWithBrg(idxPlusBrg){
	//console.log("set_courseWithBrg: "+idxPlusBrg);
	var url = WEB_HOST + "pebbleGetCourses.php?set_courseWithBrg="+idxPlusBrg; 
	var http = new XMLHttpRequest(); 
	http.open("GET", url, true);	
	http.send(null);
	http.onreadystatechange = function () {
		  if (http.readyState == 4 ){
			   	if(http.status == 200){ // or 404 not found	
					print_division(); //refresh 					
				}				
			  else {
				  setTimeout(function(){set_course(idxPlusBrg);},1000);
			  }
		}
	};								  										  
}

var httpFlags = 0; //1: polars, 2, division, 4:all course, 8: current course
var readPolarsRequest = new XMLHttpRequest(); //for read Polars data
var targets, starting; // objects holding racing and starting [polars]
function readPolars(){
	readThesePolars("racing");
}
function readThesePolars(whichPolars){
	//Pebble.showSimpleNotificationOnPebble("readPolars",whichPolars);
	var url = WEB_HOST + "pebbleGetPolars.php?"+ whichPolars ; // gets polars in a json string
	readPolarsRequest.open("GET", url, true);
	readPolarsRequest.send(null);
	readPolarsRequest.onreadystatechange = function () {
		  if (readPolarsRequest.readyState == 4 ){
			   	if(readPolarsRequest.status == 200){ // or 404 not found
				   	var mData = readPolarsRequest.responseText;
					//Pebble.showSimpleNotificationOnPebble("readPolarsRequest.responseText",readPolarsRequest.responseText);
				   	if (mData.length >0){
						var polarArray = JSON.parse(readPolarsRequest.responseText);
						if (whichPolars=="racing")
							targets = new polarClass(polarArray);
							//Pebble.showSimpleNotificationOnPebble("targets.UpwindTWAs[1]: ",targets.upwindTWAs[1]);
						else if (whichPolars=="starting"){
							starting = new polarClass(polarArray);
						}
					}// length > 0	
					if (whichPolars=="racing")
						readThesePolars("starting");
					else if (whichPolars=="starting")
						testHttpFlags(1);
				}//status == 200
			  	else 
				  Pebble.showSimpleNotificationOnPebble("HTTP Fail(1)","Check your web server is running");
			} //readyState == 4
		   }; //onreadystatechange 		
}


