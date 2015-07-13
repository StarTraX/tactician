/* jshint -W099 */ //remove warning about mixed spaces and tabs???
var WEB_HOST ; //= "http://192.168.0.6:8080/dashboard/";	
Pebble.addEventListener("ready",load_data); //deleted for case 
/*
Pebble.addEventListener("ready",function(){ //DEBUG code for  Case# 465260
 	
		Pebble.sendAppMessage({ 
		"44": "0", //	FLAGDATALOADED, // 42 number of course divisions in this series
		 }, function(e) { //Success callback
			 	//commsTimer(); //start the timer once all the data is loaded
			 	console.log("FLAGDATALOADED sent");
			 	dispData();
				  //Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
  						},
			function(e) { //Fail callback
				//console.log('sendAppMessage courseDivCount:'+courseDivCount + " courseDivsList: "+ courseDivsList);
				//Pebble.showSimpleNotificationOnPebble("Upload (8) failed, retrying: ","current course menu"); 						
				//setTimeout(function(){flagDataLoaded();},1000);
				}
			 );
});	
*/
Pebble.addEventListener("showConfiguration",
  function(e) {
	  //console.log("showConfiguration: ");
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
);
var selectedWindow = "";
var presentPosData, startLinePoints;
Pebble.addEventListener("appmessage", function(e) {
	var mURL;
	var mRequest = new XMLHttpRequest(); 
	for (var msgIdx in e.payload ){
		switch( Number(msgIdx)){
			case 100:  	// selected WINDOW request for different data
				selectedWindow = e.payload[msgIdx];
				//console.log("PHONE received: \""+selectedWindow+"\"");
				if (newDataFlag)
					dispData();	
				break;
			case 101:	// selected course
				set_course(e.payload[msgIdx]);
				break;
			case 102:	// from next_mark window	
				if ( e.payload[msgIdx] === 0){
					console.log("Next_mark : manual start");
					mURL =  WEB_HOST + "startNav.php";
					mRequest = new XMLHttpRequest(); //for navStart.php
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);
				}
				else {
					mURL =  WEB_HOST + "markFwdBack.php?indicator="+e.payload[msgIdx];
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);	
				}
				break;
			case 103: // from start_line
				mURL = WEB_HOST +
					"startLinePress.php?whichEnd="+  e.payload[msgIdx]; // Updates & gets location data string
				mRequest.open("GET", mURL, true);
				mRequest.send(null);
				if (e.payload[msgIdx] == "BOAT") print_division();  //refresh course wirh new start line (boat)
				break;
			case 104:	 // Start time 10, 5, 4 mins, as minutes
				startTime = Number(presentPosData.timeMs) + Number(e.payload[msgIdx]) *1000 ; // to thous
				mURL = WEB_HOST +"startLinePress.php?startTime="+  startTime; // Updates & gets location data string
				mRequest.open("GET", mURL, true);
				mRequest.send(null);
				break;
			case 105:	 //  selected course PLUS BRG to mark(s)					
				set_courseWithBrg(e.payload[msgIdx]);
				break;
		} //switch
	} //for
} //anonymous appmessage callback function
);  //Pebble.addEventListener("appmessage",	
		
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


//SECTION: LOAD DATA -------------------
/* jshint -W099 */ //remove warning about mixed spaces and tabs???
var courses; // the BIG clubs/series/...object
/*
* reads the course with pebbleGetCourses and
* sends it as text as appMessage #37
*/
function load_data(){
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "HERE") ; 
	if(localStorage.settings ){
		settings = JSON.parse(localStorage.settings );
		if (settings.role){
			//Pebble.showSimpleNotificationOnPebble("DEBUG","ROLE: "+settings.role) ; 
			WEB_HOST = settings.role=="admin"?"http://localhost:8080/dashboard/":"http://192.168.43.1:8080/dashboard/";
			//Pebble.showSimpleNotificationOnPebble("DEBUG - WEB_HOST: ", WEB_HOST) ; 
			/* --------------TESTING */
			//WEB_HOST = settings.role=="admin"?"http://localhost:8080/dashboard/":"http://localhost:8080/dashboard//";
			Pebble.sendAppMessage({ 
			"56": settings.role//admin" or "crew""									   					   
			}, function(e) { //Success callback														  
			},
			function(e) { //Fail callback	
				//Pebble.showSimpleNotificationOnPebble("Failed to get role from Master phone") ; 							  
			});
			readSettings(); // from gpsanimator.com with php
			readPolars(); //this can be done before watch is ready
			print_division();
			get_selected_series();
			return;
		}
		else
			Pebble.showSimpleNotificationOnPebble("DEBUG","No ROLE: ") ; 
	}
	Pebble.showSimpleNotificationOnPebble("Not registered","Please log in through Tactician's SETTINGS on your phone");
	var pebbleConfigURL = "http://gpsanimator.com/tactician/pebbleConfig";
	Pebble.openURL(pebbleConfigURL);
	return;
}
function print_division(){
	var url = WEB_HOST + "pebbleGetCourses.php?print_division"; // gets current course as formatted text string
	var readCoursesRequest = new XMLHttpRequest(); 
	readCoursesRequest.open("GET", url, true);
	readCoursesRequest.send(null);
	readCoursesRequest.onreadystatechange = function () {
		  if (readCoursesRequest.readyState == 4 ){
			   	if(readCoursesRequest.status == 200){ // or 404 not found	
					//Pebble.showSimpleNotificationOnPebble("CurrentCourse", readCoursesRequest.responseText);
					//console.log("CurrentCourse", readCoursesRequest.responseText);
					 upload_division(readCoursesRequest.responseText);
		//console.log(readCoursesRequest.responseText);
					testHttpFlags(2);
				}
				else
			Pebble.showSimpleNotificationOnPebble("HTTP Fail(2)", "Check that your web server is running on "+WEB_HOST); 	
		  }
		};
}
function upload_division(mText){
	Pebble.sendAppMessage({ 
		"37": mText//formatted current course										   					   
		}, function(e) { //Success callback
			testHttpFlags(5);
			 //Pebble.showSimpleNotificationOnPebble("CurrentCourse","Success"); 							  
		},
		function(e) { //Fail callback	
			//Pebble.showSimpleNotificationOnPebble("Upload (5) failed, retrying:","print division"); 
			setTimeout(function(){print_division();},1000);
		}
	);
}
function get_selected_series(){ //read selected series from selectedSeries.txt
	var url = WEB_HOST + "pebbleGetSelectedSeries.php"; 
	var http = new XMLHttpRequest(); 
	http.open("GET", url, true);	
	http.send(null);
	http.onreadystatechange = function () {
		  if (http.readyState == 4 ){
			   	if(http.status == 200){ // or 404 not found	
					var selectedSeries = JSON.parse(http.responseText); // JSON object of all courses & marks in seelected Series
					//console.log("get_selected_series\n"+ http.responseText); 
					testHttpFlags(3);
 					testHttpFlags(6); //Here to manage obsolescence of upload_all_courses
					testHttpFlags(4);testHttpFlags(7); //obsolete  get_current_course
					setTimeout(function(){populateDivsFromSeries(selectedSeries);},1000); //work-around for occasional latency issue
				}
				else
					Pebble.showSimpleNotificationOnPebble("HTTP Fail(3)", "Check that your web server is running");
		 	}
		};	
}

/* extract the division/courses for the current series
from the courses object  
*/
function populateDivsFromSeries(selectedSeries) { //modelled on getSeriesFromSelect, passes JSON object to pebble
	LOCAL_MAG_VAR = selectedSeries.clubMagVar;
	var courseDivsList = "";
	var courseDivCount = 0;
	for (var courseIdx in selectedSeries.courses){
		var thisCourse = selectedSeries.courses[courseIdx];
		courseDivCount ++;
		courseDivsList += thisCourse.number +" "+ thisCourse.wind +"|"+
			(thisCourse.divisions[0].hasDistMarks === undefined?"-1":thisCourse.divisions[0].hasDistMarks)+ ":"; 
		// 0 or 1 used for 44 course with 04 mark st 4 Nm from  BJ
		//courseIdx+":";  // | delimited within : delimited		
	}
	//console.log('courseDivsList: '+ courseDivsList);
	uploadDivs(courseDivCount,courseDivsList );
}
function uploadDivs(courseDivCount,courseDivsList ){
	//Pebble.showSimpleNotificationOnPebble("courseDivCount",courseDivCount); 
	//console.log("COURSEDIVS: "+courseDivsList );
	Pebble.sendAppMessage({ 
		"42": courseDivCount, //	COURSEDIVSCOUNT, // 42 number of course divisions in this series
		"43": courseDivsList ,// COURSEDIVS, //43 the | and : separated list of divs
		 }, function(e) { //Success callback
				 testHttpFlags(8);
				 // Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
  						},
			function(e) { //Fail callback
				//console.log('sendAppMessage courseDivCount:'+courseDivCount + " courseDivsList: "+ courseDivsList);
				//Pebble.showSimpleNotificationOnPebble("Upload (8) failed, retrying: ","current course menu"); 						
				setTimeout(function(){uploadDivs(courseDivCount,courseDivsList );},1000);
				}
	);	
}
function readSettings(){
	var url = "http://www.gpsanimator.com/tactician/pebbleConfig/readSettings.php?seq="+settings.seq; 
	var http = new XMLHttpRequest(); 
	http.open("GET", url, true);	
	http.send(null);
	http.onreadystatechange = function () {
		  if (http.readyState == 4 ){
			   	if(http.status == 200){ // or 404 not found	
				   //Pebble.showSimpleNotificationOnPebble("SETTINGS",http.responseText); 			
					settings = JSON.parse(http.responseText);
					 testHttpFlags(9);
				}
			 // else 
				  // Pebble.showSimpleNotificationOnPebble("HTTP Fail(9)", "Check that your web server is running on "+WEB_HOST); 
		 }
	};

}
/*
flags for loading data from Logger via HTTP
*/
/*
flags for loading data from Logger via HTTP
httpFlags incremented by 2^(flag-1): e.g. 1->2^0=1, 2->2^1=2; 5-> 2^4 = 16 9->2^8=256
*/
var alreadyRunning=false; //handles return from SETTINGS/config when already running
function testHttpFlags(flag){
	var mask=Math.pow(2,(flag-1));
	httpFlags = httpFlags | mask;
	if (httpFlags==511){ // all received
		httpFlags=0; //ready for the configuration
		if (settings.clubIdx === undefined) //settings came from the closing of pebbleConfig
			//TODO put settings in localStorage. If missing, prompt with pebbleConfig
			settings.clubIdx=0;
		if (settings.seriesIdx === undefined)
			settings.seriesIdx = 0;
		if (settings.divIdx === undefined)
			settings.divIdx = 0;
		if (settings.yachtLength === undefined)
			settings.yachtLength = 12;
		YACHT_LENGTH  = settings.yachtLength; 
		if (settings.gpsBehindBow === undefined)
			settings.gpsBehindBow = 8;		
		GPS_BEHIND_BOW= settings.gpsBehindBow; 
		if (settings.perfStyle === undefined)
			settings.perfStyle = 2;
		STYLE = settings.perfStyle;
		if (alreadyRunning!== true){
			flagDataLoaded();
			alreadyRunning=true;
		}
	}

}
function flagDataLoaded( ){
	Pebble.sendAppMessage({ 
		"44": "0", //	FLAGDATALOADED, // 
		 }, function(e) { //Success callback
			 		commsTimer(); //start the timer once all the data is loaded
			 		//console.log("commsTimer started");
				  //Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
  						},
			function(e) { //Fail callback
				//console.log('sendAppMessage courseDivCount:'+courseDivCount + " courseDivsList: "+ courseDivsList);
				//Pebble.showSimpleNotificationOnPebble("Upload (8) failed, retrying: ","current course menu"); 						
				setTimeout(function(){flagDataLoaded();},1000);
				}
	);	
}	
var readNavDataRequest = new XMLHttpRequest(); //for read NavData
var pollComplete= false;
var lastPolledTimeStamp = 0;

function commsTimer(){
	var commsTimerTimeStamp = Date.now();
	var commsTimerElapsedTime = commsTimerTimeStamp - lastPolledTimeStamp ;
	//console.log( "commsTimerElapsedTime: "+ commsTimerElapsedTime +  " pollComplete: " +pollComplete);
	if (commsTimerElapsedTime > 3000 || pollComplete === true){ // 3000
		lastPolledTimeStamp = commsTimerTimeStamp;
		readNavData();
	}	
	setTimeout(function(){commsTimer();},1000); 
}

var prevNavData = " ";
var newDataFlag = true;
var JSONcombinedData = "";
function readNavData(){
	pollComplete = false;
	var url = WEB_HOST + "readCombinedData.php?cacheBuster="+new Date().getTime(); // gets location data and start line string
	readNavDataRequest.open("GET", url, true);
	readNavDataRequest.send(null);
	readNavDataRequest.onreadystatechange = function () {
		  if (readNavDataRequest.readyState == 4 ){
			   	if(readNavDataRequest.status == 200){ // or 404 not found
				   	var mData = readNavDataRequest.responseText;
				   	if (mData.length >0){
						JSONcombinedData = mData;
						if (mData !=prevNavData){ //Only send changed data - enables watch to monitor data receipt
							prevNavData = mData;
							newDataFlag = true;
							//dispData();   	
						}	
						else{
							newDataFlag = false;
							//console.log("readNavData: Same data");
							pollComplete = true;
						}
					}
					//else console.log("readNavData: Length ZERO");
			   	} // if status == 200
			  // else console.log("readNavDataRequest.status not 200:" +readNavDataRequest.status);
				  
		   } // if readyState == 4	
		//else	console.log("readNavDataRequest.readyState not 4:" +readNavDataRequest.readyState);
	}; //onreadystatechange 
}

//SECTION: diap_data
/* jshint -W099 */ //remove warning about mixed spaces and tabs???
//var prevTimeMs = 0;
var damping=3;
var compassPoints = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW", "N"];
var navDataFlag = false; // set while waiting for response
//var STYLE;  //set from Settings/Configuration
var LOCAL_MAG_VAR ;  //set from courses.clubs[settings.clubIdx].magVar
var YACHT_LENGTH ;  //set from Settings/Configuration
var GPS_BEHIND_BOW ;  //set from Settings/Configuration
var MIN_ANGLE_FOR_NEXT_MARK = 100; //degrees 
var MIN_ANGLE_FOR_UPWIND = 60; //degrees, used for calc layline upwind
var nmToMetres = 1852;
var upwindTarget, downwindTarget;

function loggerDataType (){
		this.log = 0; 
		this.compass = 0; 
		this.SOG = 0; 
		this.COG = 0; 
		this.TWS = 0; 
		this.TWD = 0; 
		this.wptDist = 0; 
		this.wptBrgTrue = 0; 
		this.wptVMG = 0; 
		this.TWA = 0; 
}
var dampedValues;
dampedValues = new loggerDataType();
var prevValues = new loggerDataType();

function dampSpeed(prevVal, thisVal){
	var dampedValue = Number(prevVal) + (thisVal -prevVal)/(damping+1);	
	dampedValue = Math.round(dampedValue * 10)/10 ; // round to one decimal
	if (isNaN(dampedValue)) return thisVal;
	return dampedValue;
}
/*
 * Takes 
 * Returns formatted angle 0 : x : 360
 */
function dampAngle(prevVal, thisVal){
	var delta = thisVal - prevVal;// change in angle (degrees
	delta += (delta < -180 ? 360 : (delta > 180 ?-360 : 0)); //normalize to -180<a<180
	delta /= (damping+1);
	var dampedValue = Number(prevVal) + delta;
	dampedValue += (dampedValue < 0 ? 360 : (dampedValue >= 360 ? -360 : 0));
	dampedValue =  Math.round(dampedValue); //round to whole number of degrees
	dampedValue = (dampedValue <10? "00" : (dampedValue <100 ? "0" : " "))+dampedValue;
	if (isNaN(dampedValue)) return thisVal;
	return dampedValue;
}
var prevTimeMs = 0;

function dispData(){ // uses global JSONcombinedData
	navDataFlag = false; // no longer waiting for response
	var combinedData =JSON.parse(JSONcombinedData); 
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "HERE");
	presentPosData =combinedData.presentPosData;
	startLinePoints=combinedData.startLinePoints;
	startTime = Number(startLinePoints.startTime); // sets start time from StartLineData	
	prevTimeMs = presentPosData.timeMs;
	var reportTime = new Date(Number(presentPosData.timeMs));
	var formattedReportTime = (reportTime.getHours()<10?"0":"")+reportTime.getHours() + ":"+
		(reportTime.getMinutes()<10?"0":"")+reportTime.getMinutes() + ":"+
		(reportTime.getSeconds()<10?"0":"")+reportTime.getSeconds() + " (GPS)" ;
	//formattedTime ="GPS "+(mMins<10?"0":"")+mMins + ":"+ (mSecs<10?"0":"")+mSecs;
	//Pebble.showSimpleNotificationOnPebble("reportTime",formattedTime);
	//dampedValues = new loggerDataType;
	dampedValues.log =dampSpeed(prevValues.log, presentPosData.log);	// damp the speed values 
	dampedValues.SOG =dampSpeed(prevValues.SOG, presentPosData.SOG);
	dampedValues.TWS =dampSpeed(prevValues.TWS, presentPosData.TWS);
	dampedValues.wptVMG =dampSpeed(prevValues.wptVMG, presentPosData.wptVMG);
	dampedValues.lat =dampSpeed(prevValues.lat, presentPosData.lat); // for start line solution
	dampedValues.lon =dampSpeed(prevValues.lon, presentPosData.lon);
	
	dampedValues.COG =dampAngle(prevValues.COG, presentPosData.COG);	// damp the direction values 
	dampedValues.TWD =dampAngle(prevValues.TWD, presentPosData.TWD);	// TWD (Magnetic - from Sailcomp compass)
	dampedValues.wptBrgTrue =dampAngle(prevValues.wptBrgTrue, presentPosData.wptBrgTrue);	// damp the direction values 
	dampedValues.compass =dampAngle(prevValues.compass, presentPosData.compass);	// damp the direction values
	dampedValues.TWA= dampedValues.TWD -dampedValues.compass ; // calc True Wind Angle (using Mag compass and Mag TWD)
	dampedValues.TWA +=360*(dampedValues.TWA<-180?1:(dampedValues.TWA>180?-1:0)); // -180<TWA<180

	//--------------------PERFORMANCE stuff.
	upwindTarget = targets.calcTargets(dampedValues.TWS); // use Target TWA and BTC for lay-line calc
	downwindTarget = targets.calcDownwindTargets(dampedValues.TWS); //DOWNwind targets
	var TWAToMark = dampedValues.TWA - presentPosData.wptBearingDegs; // TWA of direct course from current pos to mark
	TWAToMark+=360*(TWAToMark <-180?1:(TWAToMark>180?-1:0));
	var pointOfSailing;	// Decide which polars to use depending on TWA to mark
	var VMG = dampedValues.log*Math.cos(dampedValues.TWA*Math.PI/180); //use log, not SOG for precision
	var perfTgtBTV, perfTgtTWA,perfTgtVMG, perfActualVMG,perfPcDisp;
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "XXX");

	if (Math.abs(TWAToMark) < upwindTarget.TWA){  // on a beat
		//Pebble.showSimpleNotificationOnPebble("DEBUG", "Beat");
		pointOfSailing = "Beat";		
		perfTgtBTV = Math.round(upwindTarget.BTV*10)/10;
		perfTgtTWA= Math.round(upwindTarget.TWA);
		perfTgtVMG= Math.round(upwindTarget.VMG*10)/10;
		perfActualVMG= Math.round(VMG*10)/10;						
		perfPcDisp = pointOfSailing+":"+
			Math.abs(Math.round(100*VMG / upwindTarget.VMG))+"%";
	}
	else if (Math.abs(TWAToMark) > downwindTarget.TWA ){// on a Run to the next mark
		pointOfSailing = "Run";
		perfTgtBTV = Math.round(downwindTarget.BTV*10)/10;
		perfTgtTWA = Math.round(downwindTarget.TWA);
		perfTgtVMG = Math.round(downwindTarget.VMG*10)/10;
		perfActualVMG = Math.round(VMG*10)/10;		
		perfPcDisp = pointOfSailing+":"+
			Math.abs(Math.round(100*VMG / downwindTarget.VMG))+"%";
	}
	else { //Reaching
		if ( Math.abs(TWAToMark)< targets.calcJibKiteCrossoverTwa(dampedValues.TWS))
			pointOfSailing = "Jib reach";
		else 
			pointOfSailing = "Shy kite";

		var tgtBTV = targets.calcReachBTV(dampedValues.TWS, dampedValues.TWA );
		perfTgtBTV = Math.round(tgtBTV*10)/10;
		perfTgtTWA = Math.round(Math.abs(dampedValues.TWA));
		perfTgtVMG = Math.round(tgtBTV*10)/10;
		var intPerfActualVMG = dampedValues.log*Math.cos( presentPosData.wptBearingDegs*Math.PI/180); //wptBearingDegs should be 180.
		perfActualVMG = Math.round(intPerfActualVMG*10)/10;
		var reachPerformance = Math.round(perfActualVMG /tgtBTV * 100); //
		perfPcDisp =pointOfSailing+":"+ Math.abs(reachPerformance)+"%";
	}			
	//------------------------------NAVIGATION STUFF
	var COGMagDegs = Math.round(Number(dampedValues.COG)- LOCAL_MAG_VAR);
	COGMagDegs += 360*(COGMagDegs<=0?1:0); //COG is True, not Mag
	var wptDispDisp;
	if (presentPosData.WptDist < 1){
		wptDispDisp = Math.round(presentPosData.WptDist*nmToMetres) +" m";
	}
	else {
		wptDispDisp = Math.round(presentPosData.WptDist*100)/100 + " Nm";
	}
	var nextLegAWADisp,nextLegAWSDisp,apparent, nextLegTWA,BTV,nextLegText;
	if (presentPosData.nextLegName !="FINISHED"){
		// what is the next leg: Beat, jib reach, Kite reach, kite downwind (with gybes)?
		nextLegTWA = Math.round(dampedValues.TWD - presentPosData.nextLegHDG) ; //nextLegHDG is deg's +ve is stbd tack/gybe
		nextLegTWA += 360*(nextLegTWA <-180?1:(nextLegTWA >180?-1:0));
		for (var twsIdx = 0; twsIdx < targets.targetTWS.length; twsIdx++ ){
			if 	(Math.abs(dampedValues.TWS) <=targets.targetTWS[twsIdx] ){ // find the index for this TWS
				break;}}
		nextLegText = "";
		if (Math.abs(nextLegTWA) <= targets.upwindTWAs[twsIdx] ){ // a work
			nextLegText =  "Beat";
			apparent = calcApparent(dampedValues.TWS, upwindTarget.TWA, upwindTarget.BTV  );
			nextLegAWADisp= Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
		else if (Math.abs(nextLegTWA) <= targets.minTwaForKite[twsIdx]){// jib reach
			BTV = targets.calcReachBTV(dampedValues.TWS, dampedValues.TWA );
			apparent = calcApparent(dampedValues.TWS, nextLegTWA, BTV  );
			nextLegText = "Jib reach-" + (apparent.AWA >0?"Stbd":"Port") ;
			nextLegAWADisp = Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
		else if (Math.abs(nextLegTWA) <= targets.downwindTWAs[twsIdx]) {// kite reach	
			BTV = targets.calcReachBTV(dampedValues.TWS, dampedValues.TWA );
			apparent = calcApparent(dampedValues.TWS, nextLegTWA, BTV  );
			nextLegText = "Kite reach-"+(apparent.AWA >0?"Stbd":"Port") ;
			nextLegAWADisp = Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
		else {// downwind kite
			nextLegText = "Kite run";
			apparent = calcApparent(dampedValues.TWS, downwindTarget.TWA, upwindTarget.BTV  );
			nextLegAWADisp = Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
	}
		// LAY-LINE calc
	var HDG_tgt, markAngle, layLineDist, layLineTime, wptETI, wptETA, secondsToWpt,
		formattedWptETA;
	if (dampedValues.TWA >0) { // stbd tack
		 HDG_tgt = Number(dampedValues.TWD) - upwindTarget.TWAt*180/Math.PI; // if stbd
		 markAngle = dampedValues.wptBrgTrue - HDG_tgt ; // both True not Magnetic
	} 
	else {// Port tack
		 HDG_tgt = Number(dampedValues.TWD) + upwindTarget.TWAt*180/Math.PI; 
		 markAngle = HDG_tgt -dampedValues.wptBrgTrue; // both True not Magnetic
	}
	markAngle +=360*(markAngle<-180?1:( markAngle >180?-1:0)); // to -180:0:180
	if (dampedValues.SOG > 0 && // not if stationary
		presentPosData.WptDist > 0 && // only if valid wpt dist
		Math.abs(markAngle )< MIN_ANGLE_FOR_NEXT_MARK && // not if going away from mark
		Math.abs(dampedValues.TWA )< MIN_ANGLE_FOR_UPWIND   // not downwind
		){
			var layLine = calcLayLine( // * returns Obj. dist: metres* 	.time: seconds to lay-line *  .ETI : seconds to mark via lay-line
				 presentPosData.WptDist, //nm
				 markAngle,  // -180<= markAngle <180
				 //upwindTarget.TWAt*180/Math.PI,  // -180<TWA<180
				 upwindTarget.TWA,  // -180<TWA<180
				 //upwindTarget.BTVt /knotsToMps // knots
				 upwindTarget.BTV // knots
			); 
			if (layLine.dist< 0.5){ //< 1000 metres, show metres, else Nm
				layLineDist = Math.round(layLine.dist * nmToMetres) + " m";
				}
			else{
				layLineDist = Math.round(layLine.dist*10)/10 + " Nm";
				}
			layLineTime = secondsToMinSecs(layLine.secondsToLayLine);	
			secondsToWpt = presentPosData.WptDist/dampedValues.wptVMG* 3600;
			wptETI = secondsToMinSecs(secondsToWpt);
			wptETA =  new Date(Number(presentPosData.timeMs) + layLine.ETI*1000);
			formattedWptETA = (wptETA.getHours()<10?"0":"") + wptETA.getHours() + ":"+
				(wptETA.getMinutes()<10?"0":"") + wptETA.getMinutes()  ;		
	}
	else if (Math.abs(dampedValues.TWA )>= MIN_ANGLE_FOR_UPWIND){ // use dampedValues.wptVMG, presentPosData.WptDist
		layLineDist = " ";
		layLineTime= " ";	
		secondsToWpt = presentPosData.WptDist/dampedValues.wptVMG* 3600;
		wptETI = secondsToMinSecs(secondsToWpt);
		wptETA =  new Date(Number(presentPosData.timeMs) + secondsToWpt*1000);
		formattedWptETA = (wptETA.getHours()<10?"0":"") + wptETA.getHours() + ":"+
			(wptETA.getMinutes()<10?"0":"") + wptETA.getMinutes()  ;	
	}
	else { //TODO downwind Lay-Line
		layLineDist= " ";
		layLineTime = " ";
		wptETI =" ";
		wptETA =" ";
	} 
	var compassDisp = (dampedValues.compass<10?"00":(dampedValues.compass<100?"0":""))+Math.round(dampedValues.compass);
	// ------------------Calc and display current/tide set 
	var currentSpeed, currentAngleDegsMag, currentCompassPoint, effect;
	var ARads = ( dampedValues.COG - (Number(dampedValues.compass) + LOCAL_MAG_VAR)) * Math.PI/180; // GPS COG - compass Hdg 
	var currentSpeedKts = Math.sqrt(dampedValues.log*dampedValues.log + dampedValues.SOG* dampedValues.SOG -
			 2*dampedValues.log*dampedValues.SOG *Math.cos(ARads));
	if (currentSpeedKts < 0.05) {
		currentAngleDegsMag = "N/A";
		currentSpeed = "0";}
	else{  
		if (dampedValues.log < dampedValues.SOG ){ //angle C, COG to set angle is acute: set is slowing us down
			var anglec = Math.asin(dampedValues.log*Math.sin(ARads)/currentSpeedKts);// gives internal angle
			var anglecDegs = anglec*180/Math.PI;
			 currentAngleDegsMag = Number(dampedValues.COG) + LOCAL_MAG_VAR  + anglecDegs;
		}
		else{ // angle B, compass to set angle is acute (sin rule only works with acute angles!)
			var angleb = Math.asin(dampedValues.SOG*Math.sin(ARads)/currentSpeedKts); // gives internal angle
			var anglebDegs = angleb*180/Math.PI;
			currentAngleDegsMag = Number(dampedValues.compass)  + (180-  anglebDegs);
		 }	
		var mCount = 0;
		while (true){
			if (currentAngleDegsMag<0 ) currentAngleDegsMag += 360;
			else if (currentAngleDegsMag> 360) currentAngleDegsMag -= 360;
			else break;
			if (++mCount >2) break; // safety route to stop runaway if the logic fails!
		}
		currentSpeed =Math.round(currentSpeedKts*10)/10;
		currentAngleDegsMag = Math.round(currentAngleDegsMag);
		for (var idx = 0; idx <= 16; idx++){
			if (idx *22.5 + 11.25 >currentAngleDegsMag ){
				currentCompassPoint = compassPoints[idx];
				break;}	}
		currentAngleDegsMag = Math.round(currentAngleDegsMag) +" ("+currentCompassPoint+")";
	}
	effect = Math.round((dampedValues.SOG -dampedValues.log)*10)/10;	 
	
	/*
	Current in the TO- direction, opposite of wind
	 1m: SSW-1.2 34
	 5m: S- 2.5  35
	 20m: NE 0.2  36 */
	var msgObj  ;
	if (selectedWindow.substr(0,5)=="start" ){// display start-line details and solution
		if (startLinePoints.boatLat === undefined) // not till response from startLine HTTP request
			return;	
		 msgObj = calcStartSolution(formattedReportTime);
	}
		
	for (var prevValuesIdx in prevValues) // e previous values
		prevValues[prevValuesIdx] = dampedValues[prevValuesIdx];

	if  (selectedWindow == "performance"){
		msgObj = {
		"1": "Log "+ dampedValues.log, //PERFACTUALBTV
		"2": "Act TWA "+Math.abs(dampedValues.TWA), //PERFACTUALTWA	
		"3": "TWS " + dampedValues.TWS , //TWS
		"4": "TWD "+  dampedValues.TWD, //TWD
		"5": "Tgt BTV " + perfTgtBTV, //PERFTGTBTV
		"6": "Tgt TWA " + perfTgtTWA, //PERFTGTTWA
		"7": "Tgt VMG " + perfTgtVMG, //PERFTGTVMG
		"8": "Act VMG " + perfActualVMG, //PERFACTUALVMG
	 	"9": perfPcDisp, //PERFPCDISP
			 };
	}
	else  if  (selectedWindow == "navigation"){	
		msgObj = { 
			"1": "Log "+ dampedValues.log, //PERFACTUALBTV
			"5": "Tgt BTV " + perfTgtBTV, //PERFTGTBTV
			"10": "SOG " +  Math.round(dampedValues.SOG*10)/10 ,//SOG
			"11": "COG(M) "+(COGMagDegs<10?"00":(COGMagDegs<100?"0":""))+COGMagDegs, //COG
			"25" : "Temp " + Number(presentPosData.wTemp), //water temp TEMP
			"26" : "Depth(m) " + presentPosData.depthM , //depth metres DEPTH
			"32" : "Hdg(M) " +compassDisp, //COMPASS
			"33" : "Tide/set: ", //section heading //CURRENTHDG
			"34": presentPosData.current1, //Current 1 minute
			"35": presentPosData.current5, //Current 5 minute
			"36": presentPosData.current20, //Current 20 minute
		};
	}
	else if (selectedWindow == "nav_next_mark"){
		msgObj = {
			"12" : presentPosData.legIdx+": "+ presentPosData.WptName, //WptName
			"13" : "Dist " + wptDispDisp, // next mark distance WPTDISPDIST
			"14" : "Brg C " +presentPosData.wptBearingClock , //BRGCLOCK
			"15" : "Brg D " + presentPosData.wptBearingDegs,  //degrees relative to current heading  BRGDEGS
			"16" : "VMG " + dampedValues.wptVMG ,// WPTVMG
			"17" : "Brg(M) "+ Math.round(dampedValues.wptBrgTrue -LOCAL_MAG_VAR), //WPTBRGMAG	
			"27" : "ETI " + wptETI, //WPTETI
			"28" : "ETA " + formattedWptETA,  //WPTETA
			 "29" : "Lay-line:" ,  //LAYLINEHDG
			"30" : "   Time "+ layLineTime, //LAYLINETIME
			"31" : "   Dist " + layLineDist, //LAYLINEDIST
			 };
	}
	else if (selectedWindow == "nav_next_leg"){
		msgObj = {
			"18" : nextLegText, //Next Lepoint of sailing NEXTLEGDESC
			"19" : presentPosData.nextLegName, //next leg name NEXTLEGNAME
			"20": "Hdg(M)" + Math.round(presentPosData.nextLegHDG), //next leg heading NEXTLEGHDG
			"21" : "TWA "+ nextLegTWA,  //NEXTLEGTWA
			"22" : "TWS " +  dampedValues.TWS,  //NEXTLEGTWS
			"23" : "AWA "+ nextLegAWADisp, //NEXTLEGAWA
			"24" : "AWS " +nextLegAWSDisp, //NEXTLEGAWS
		};
	}
/*
	else if (selectedWindow == "windRose"){
		var windDirImageS = combinedData.windDirImageS;
		windDirImageData = windDirImageS.windDirImage; // Array of numbers
		msgObj = {
			"57" : windDirImageData //wind rose image bit array
		};
	}

	else if (selectedWindow == "windRecent"){
		var windDirImageS = combinedData.windDirImageS;
		var windDirRecent = windDirImageS.windDirRecent; // {array, mean }
		msgObj = {
			"58": windDirRecent.windDirImageRecent,
			"59": windDirRecent.mean
		};		
	}*/
	else if (selectedWindow == "windRose"||selectedWindow == "windRecent"){
		var windDirImageS;
		if (selectedWindow == "windRose")
			windDirImageS = combinedData.windDirImageS.windRose; // Array[2][1296]
		else
			windDirImageS = combinedData.windDirImageS.windRecent; // Array[2][1296]
		Pebble.sendAppMessage({ 
			"60": windDirImageS[0] //0,2,4..	EVEN			
			}, function(e) { //Success callback	
				//console.log("PHONE Sent first(EVEN) BYTES SUCCESS:")				
				Pebble.sendAppMessage({ //send second part on ACK of first part
						"61": windDirImageS[1], //1,3,5..		ODD	
						"0" : formattedReportTime //GPS Time 	
						}, function(e) { //Success callback	
						//console.log("PHONE Sent second(ODD) BYTES SUCCESS:")					
					},function(e) { //Fail callback	
					//console.log("PHONE Sent second(ODD) BYTES FAILED:")  ; 								
					}	//fail callback
				);//send second part AppMessage
			},function(e) { //Fail callback	
				//console.log("PHONE Sent first(EVEN) BYTES FAILED:")  ; 								
			}	//fail callback	
			
			);//sendAppMessage
		
	}
	// else it's none, but send time as a heartbeat 
		
	if (msgObj === undefined){ // always tack these on for the Navigation Menu
		msgObj ={} ;}
	msgObj["0"] = formattedReportTime; //GPS Time
	msgObj["12"] =  presentPosData.legIdx+": "+ presentPosData.WptName; //WptName
	msgObj["19"] =  presentPosData.nextLegName; //next leg name NEXTLEGNAME
	Pebble.sendAppMessage(msgObj, function(e) { //Success callback
		lastPolledTimeStamp = Date.now();	//managing the polling process
		pollComplete = true;
		},
		function(e) { //Fail callback
			 //console.log("NavDatSend FAIL");
		}
	);	
} 

/*
 * calcApparent (TWS: knots, mps, TWA: degrees, BTV:kts, mps
 * returns AWA:degrees, AWS: kts/mps
 */
function calcApparent(TWS, TWA, BTV){
	var retObj={};
	var twaRad = TWA*Math.PI/180;
	retObj.AWS = Math.sqrt(BTV*BTV +TWS*TWS +2*TWS*BTV*Math.cos(twaRad) ); //cosine rule with + not - as TWA is the external angle
	retObj.AWA = Math.asin(TWS/retObj.AWS*Math.sin(twaRad))*180/Math.PI; // sine rule
	return retObj;
}
/**
 * Time and dist to Lay-line plus ETI to mark
 * range: dist to mark, nm
 * markAngle: angle, degs from current position to mark, -180<=markAngle<180
 * TWA: True Wind Angle, degrees -180<=TWA<=180. -ve is to left
 * BTV: SOG in knots
 * returns Obj. dist: nm
 *  .time: seconds to lay-line
 *  .ETI : seconds to mark via lay-line
 */
function calcLayLine(range, markAngle, TWA, BTV){
	var hoursToSeconds = 3600;
	var layLine = {};
	var Q = Math.PI*(1- 2*TWA/180); // external tacking angle in rads
	var MA = markAngle * Math.PI/180; // in rads
	layLine.dist = range*Math.sin(Math.PI -(Q + MA))/Math.sin(Q); // Nm
	var L2 = range*Math.sin(MA)/Math.sin(Q); //dist, nm along lay-line to mark
	layLine.secondsToLayLine = layLine.dist /BTV*hoursToSeconds; //seconds 
	layLine.ETI = (layLine.dist + L2)/BTV*hoursToSeconds; //millisecs  
	return layLine;
}
function secondsToMinSecs( mSeconds){
	 var isNeg = false;
	 if (mSeconds <0){
		 mSeconds *=-1;
		 isNeg = true;
	 }
	  var roundSecs = Math.round(mSeconds);
	  var Mins =  Math.floor(mSeconds/60);
	  var remSecs = roundSecs - 60* Mins;
	 return ((isNeg?"-":" ")+Mins + ":" + (remSecs<10?"0":"") + remSecs );
}

//SECTION:CALC_START
/* jshint -W099 */ //remove warning about mixed spaces and tabs???
var yacht = {};
yacht.prevValues = {};
var HDGr, BTVr;
var degs2metres = 111120; // metres per degree of latitiude
var knotsToMps = 0.5144444; // convert knots to metres/sec
var startTime=0;  //when active, startTime is a  timeStamp (ms since epoch) of the start time
function calcStartSolution(formattedReportTime, currentCourse){ // start line & solution
	var startingTargets =starting.calcTargets(dampedValues.TWS); // use Target TWA and BTC for lay-line calc
	var msgObj = {};
	var cosLatRatio = Math.cos(startLinePoints.boatLat*Math.PI/180);
	var boat={} ;
	var pin = {};
	//Transform YACHT POSITION wrt boat->pin
	yacht.xMtrs = dampedValues.lat *degs2metres;	
	yacht.yMtrs = dampedValues.lon * cosLatRatio*degs2metres;
	boat.xMtrs = startLinePoints.boatLat *degs2metres;	
	boat.yMtrs = startLinePoints.boatLon * cosLatRatio*degs2metres;
	pin.xMtrs = startLinePoints.pinLat *degs2metres;
	pin.yMtrs = startLinePoints.pinLon * cosLatRatio*degs2metres;
	yacht.xMtrs -= boat.xMtrs; 
	yacht.yMtrs -= boat.yMtrs; 
	pin.xMtrs -= boat.xMtrs; 
	pin.yMtrs -= boat.yMtrs; 
	boat.xMtrs = 0;
	boat.yMtrs = 0;
	//(B) Rotate Yacht round Boat->Pin	
	pin.r = Math.sqrt(pin.xMtrs*pin.xMtrs + pin.yMtrs*pin.yMtrs ) ; // line length, == 
	pin.theta = Math.atan2(pin.yMtrs, pin.xMtrs);
	yacht.r = Math.sqrt(yacht.xMtrs*yacht.xMtrs + yacht.yMtrs*yacht.yMtrs );
	yacht.theta = Math.atan2(yacht.yMtrs, yacht.xMtrs);	
	yacht.xMtrs = yacht.r*Math.cos(yacht.theta - pin.theta);
	yacht.yMtrs = yacht.r*Math.sin(yacht.theta - pin.theta);
	pin.xMtrs = pin.r;
	pin.yMtrs = 0;
	//transform TWD wrt start line
	var TwdRotatedRads  = (Number(dampedValues.TWD) + LOCAL_MAG_VAR)* Math.PI/180 - pin.theta; // true wind direction (True) Rads rotated to line
	var twdRotatedDegs = TwdRotatedRads*180/Math.PI; // TWD rotated to Start Line
	twdRotatedDegs += 360*(twdRotatedDegs<0?1:(twdRotatedDegs>360?-1:0)); // normalize to -0<=x<=360
	var lineBias = Math.round((twdRotatedDegs - 90 ));
	// transform YACHT HEADING wrt start line
	HDGr = dampedValues.COG* Math.PI/180 - pin.theta; //current heading (True) rotated to line
	HDGr += 2*Math.PI*(HDGr < 0?1:HDGr > 2* Math.PI?-1:0);  //normalize to 0<=x<=2pi
	BTVr = dampedValues.SOG * knotsToMps ; // current speed, over the ground in m/s

	var MAX_BIAS_ANGLE_FOR_UPWIND = startingTargets.TWA; // in degrees
	var prefEnd, prefDist;
	var lineTime, lineSpeed;
	var solutionTime = ""; // time to tack(off wind) or time to line (Beat)
	var solutionPos = ""; // line position (off wind) or boats from line (Beat)
	var solutionStatus;
	yacht.zSecs = (presentPosData.timeMs -startTime )/1000; // time to go, -ve to zero to , 
	var lineDist = yacht.yMtrs + GPS_BEHIND_BOW*Math.sin(HDGr)  ; // Actual dist plus GPS pos from bow (behind line is negative
	// first the start line display:
	if (Math.abs(lineBias)>=MAX_BIAS_ANGLE_FOR_UPWIND) { //upwind start solution. behind line and inside 5 mins
			prefEnd = "Dn Wind";
			prefDist= " ";
			lineTime = "";
			lineSpeed = "";
	}
	else{
		prefEnd = (lineBias>=0?"BOAT":"PIN");
		prefDist = Math.abs(Math.round(pin.r * Math.cos(TwdRotatedRads)));
		//console.log("prefEnd:"+prefEnd);
		var reachTWADegs = 90 +lineBias;
		var reachSpeedKts = starting.calcReachBTV(dampedValues.TWS, reachTWADegs ); // starting target reaching speed in this TWS
		lineTime = "Time " + Math.round(pin.r/reachSpeedKts/knotsToMps); // LINETIME
		lineSpeed = "At "	+ Math.round(reachSpeedKts*10)/10; // LINESPEED					
	}
	// Now the starting solution
	solutionTime = "";
	solutionPos = "";
	if (yacht.zSecs >180 )// gun time time is more than 3 minutes ago
		solutionStatus =  "Timer off.";
	else if (yacht.zSecs < -600 ) {
		solutionStatus = "Outside 5 mins";
	}			
	else if (lineDist > 0 ){ // over the line
		if( yacht.zSecs > 0){ //  and after the gun
			solutionStatus= "Navigating."	;					
			startTime = 0; //stop the timer to prevent any further action on the starting page
			var mURL = "startNav.php";
			var mRequest = new XMLHttpRequest(); //for navStart.php
			mRequest.open("GET", mURL, true); 
			mRequest.send(null);
		}
		else {
			solutionStatus = "OCS!!!";
			solutionTime ="Return to start";
			solutionPos = "Now";
		}
	}
	else if (Math.abs(lineBias)>=MAX_BIAS_ANGLE_FOR_UPWIND) { //upwind start solution. behind line and inside 5 mins
		// calc time & dist to line using starting reaching polars assume course is towards the first mark
		// Barging (above pin) or below pin  
			solutionStatus = "Downwind start";
			solutionTime ="Bias: "+lineBias;
			solutionPos = "N/A";
	}
	else{ //Upwind start line, inside 2 mins and behind the line
		// Starting Time & Distance Solution
		if ((HDGr <= TwdRotatedRads+ startingTargets.TWAt && //between start to luff on Port and 20 degs eased on stbd
		  		HDGr >= TwdRotatedRads - startingTargets.TWAt - 0.35 ) ||// we have started to tack onto,  or are on,  stbd tack. .35 ~=20 deg's					solutionStatus = "Beat to the line";
		  		yacht.zSecs > -45){// OR inside 45 sec's so it continues to do T&D if we bear away
			solutionStatus="FINAL BEAT!";
			var theoreticalDistToLine = -yacht.yMtrs/Math.sin(TwdRotatedRads - startingTargets.TWAt)  - GPS_BEHIND_BOW  ; // dist (mtres) based on location and Target TWA + pos of GPS from bow
			var boatsFromLine = Math.round(10*theoreticalDistToLine / YACHT_LENGTH)/10  ; // our yacht length rounded to 1 decimal
			var timeToBurn = Math.round(-yacht.zSecs - theoreticalDistToLine/ startingTargets.BTVt); // +ve: EARLY, -ve: LATE
			solutionTime =  (timeToBurn>0?"BURN "+ timeToBurn : "LATE by " + (-timeToBurn));
			solutionPos = boatsFromLine + " boats" ;
		}
		else { // reaching to the start line, do the complicated start solution stuff
			// calculate position WRT the ZONE - can we get to where on the line
			// time  to PIN based on heading to pin: 
			var TWAToEnd =Math.abs(TwdRotatedRads - Math.atan2(yacht.yMtrs, (pin.xMtrs - yacht.xMtrs)))*180/Math.PI;
			//console.log("TWATo Pin: "+TWAToEnd );
			var BTVToEnd; 
			if (TWAToEnd> startingTargets.TWAt){ // reach to the pin
				BTVToEnd=starting.calcReachBTV(dampedValues.TWS, TWAToEnd )*knotsToMps;		//mps	
				yacht.timeToPin = Math.sqrt((yacht.xMtrs -pin.xMtrs) *(yacht.xMtrs -pin.xMtrs) + yacht.yMtrs*yacht.yMtrs)/BTVToEnd;
			}
			else  //work to the pin}
				yacht.timeToPin = Number.MAX_VALUE;
				// time to BOAT
			TWAToEnd =Math.abs(TwdRotatedRads - Math.atan2(yacht.yMtrs, yacht.xMtrs))*180/Math.PI;
			//console.log("TWATo BOAT: "+TWAToEnd );
			if (TWAToEnd> startingTargets.TWAt){ // reach to the BOAT
				BTVToEnd= starting.calcReachBTV(dampedValues.TWS, TWAToEnd )*knotsToMps;		//mps	
				yacht.timeToBoat = Math.sqrt(yacht.xMtrs *yacht.xMtrs + yacht.yMtrs*yacht.yMtrs)/BTVToEnd;
			}
			else  //work to the pin}
				yacht.timeToBoat = Number.MAX_VALUE;
			//--- now check the Zone pos ---
			if (yacht.timeToPin > Math.abs(yacht.zSecs)) { 
				if (yacht.timeToBoat > Math.abs(yacht.zSecs))
					solutionStatus="NEITHER END";
				else	
					solutionStatus="LATE FOR PIN";
			}
			else {
				if (yacht.timeToBoat > Math.abs(yacht.zSecs))
					solutionStatus="LATE FOR BOAT.";
				else 	
					solutionStatus="IN THE ZONE";
			}
			//console.log("yacht.timeToBoat: " +yacht.timeToBoat + " yacht.timeToPin: "+ yacht.timeToPin);
			// now, calc line pos from this pos'n and heading
			if (HDGr > 3*Math.PI/2){// going away, so no solution:
				solutionTime = "On Stbd tack, ";
				solutionPos = "Going away.";
			}
			else { // not heading away, so calculate start line solution
				var Q ={}; 	 
				// Calculations algorithm
				var beatAngle = TwdRotatedRads - startingTargets.TWAt; //Target beat angle to the line (rads)
				var m1 = Math.tan(beatAngle); // true wind angle (grad) of the beat to the line
				var m2 = startingTargets.BTVt*Math.sin(beatAngle);  // beat speed to the line (m/s)
				//console.log("m2: "+m2) ;
				var m3 = Math.tan(HDGr); //reach angle to line
				var c3 = yacht.yMtrs - m3*yacht.xMtrs ;
				var m4 = BTVr*Math.sin(HDGr); 
				var c4 = yacht.yMtrs  - m4*yacht.zSecs ;
				var tackPoint = {};
				tackPoint.zSecs = c4/(m2-m4);
				tackPoint.yMtrs = m2*tackPoint.zSecs;
				tackPoint.xMtrs = (tackPoint.yMtrs - c3)/m3;
				var c1 = tackPoint.yMtrs - m1*tackPoint.xMtrs;
				Q.xMtrs = -c1/m1 ;
				var pcLine = Q.xMtrs/pin.xMtrs*100 ; //% of line
				solutionTime ="Tack in " + Math.round(tackPoint.zSecs -yacht.zSecs)+ " secs."; // time to tack point
				if (pcLine < 0) solutionPos = "Above Boat";
				else if (pcLine < 20) solutionPos = "Boat End";
				else if (pcLine < 40) solutionPos = "Mid Boat";
				else if (pcLine < 60) solutionPos = "Middle";
				else if (pcLine < 80) solutionPos = "Mid Pin";
				else if (pcLine < 100) solutionPos = "Pin End";
				else solutionPos = "Below Pin" ;
			}//heading for the line off the wind
		}// off the wind or beating
	}//upwind start

		
	//---------------------------------------
	if (selectedWindow == "start_line"){
		msgObj = {"0":  formattedReportTime, //GPS Time
			"45" :"Len (m) " + Math.round(pin.r), //LINELENGTH
			"46" : "Bias " + lineBias, //LINEBIAS
			"47" : "Pref " + prefEnd, //PREFEND
			"48" : "By (m) " + prefDist, //PREFDIST
			"49" : lineTime, // LINETIME
			"50" : lineSpeed, // LINESPEED	
				};
	}
	else if (selectedWindow == "start_solution"){
		msgObj = {	
			"51" : (yacht.zSecs < 300?secondsToMinSecs(-yacht.zSecs) + " to START" :formattedReportTime), // VTIMER
			"52" : solutionStatus, //SOLUTIONSTATUS			
			"53" : solutionTime, //SOLUTIONTIME time to line  or time to tack
			"54" : solutionPos , //SOLUTIONPOS line distance or line position
				};
		//console.log("Solution Status: "+solutionStatus);
			//console.log("|"+ msgObj[51]+"|"+msgObj[52] +"|"+ msgObj[53]+"|"+msgObj[54]);

	}
	return msgObj;
} //calcSolution


//SECTION: POLARS_CLASS
/* jshint -W099 */ //remove warning about mixed spaces and tabs???
function polarClass(polarArray){ //passed racing(targets) or starting polars array
	this.targetTWS = [];
	this.polarAngles=[];
	this.polars=[];
	for (var colIdx=1; colIdx < polarArray[0].length; colIdx ++ ) // top row from second column has TWS
		this.targetTWS[colIdx -1] = polarArray[0][colIdx];
	for (var rowIdx=1; rowIdx <polarArray.length; rowIdx ++ ) // left hand column has polar angles
		this.polarAngles[rowIdx -1] = polarArray[rowIdx][0];
	for ( rowIdx = 1; rowIdx < polarArray.length; rowIdx++){ // set up central polars array
		this.polars[rowIdx-1] = [];
		for ( colIdx = 1; colIdx < polarArray[0].length; colIdx++)
			this.polars[rowIdx -1][colIdx-1] = polarArray[rowIdx][colIdx];
	}
	this.upwindTWAs = this.polars[0];
	this.upwindSpeeds = this.polars[1];
	this.downwindTWAs = this.polars[2];
	this.downwindSpeeds = this.polars[3];
	this.minTwaForKite = this.polars[4];
	
	this.calcTargets= function(TWS){ //return TWA (Rads) and BTV (m/s) for current dampedValues.TWS and STYLE
		var target = {};
		for (var tgtIdx = 1; tgtIdx < this.targetTWS.length; tgtIdx++ ){ // find the tacking speed and angle for this TWS. Assumes TWS between 0 and 35, reasonable?
			if ( dampedValues.TWS <= this.targetTWS [tgtIdx]){
				var mRange = this.targetTWS[tgtIdx] - this.targetTWS[tgtIdx -1]; // dist min to max of current wind range
				var mScale = (TWS -this.targetTWS[tgtIdx -1])/mRange; //ratio of where current  wind speed lies in the range
				target.TWA = Number(this.upwindTWAs[tgtIdx -1]) + mScale * (this.upwindTWAs[tgtIdx] -this.upwindTWAs[tgtIdx -1]); //degrees
				target.TWAt = target.TWA*Math.PI/180; //assume linear range	Radians		
				target.BTV = (Number(this.upwindSpeeds[tgtIdx -1]) + mScale * (this.upwindSpeeds[tgtIdx] -this.upwindSpeeds[tgtIdx -1]) ); //Knots
				target.VMG = target.BTV*Math.cos(target.TWAt); // knots
			//target.BTV *= styleRates[STYLE]/100; // moderate beat speed according to STYLE
				//target.BTVt = knotsToMps*target.BTV*styleRates[STYLE]/100; // m/s
				target.BTVt = knotsToMps*target.BTV; // m/s
				break;} }
			return target;
	};
	/*
 * return downwind targets for current TWS
 * used in calculating NEXT LEG apparent wind speed.
 */
	this.calcDownwindTargets= function(TWS){ 
		var target = {};
		for (var tgtIdx = 1; tgtIdx < this.targetTWS.length; tgtIdx++ ){ // find the tacking speed and angle for this TWS. Assumes TWS between 0 and 35, reasonable?
			if ( TWS <= this.targetTWS [tgtIdx]){
				var mRange = this.targetTWS[tgtIdx] - this.targetTWS[tgtIdx -1]; // dist min to max of current wind range
				var mScale = (
					-this.targetTWS[tgtIdx -1])/mRange; //ratio of where current  wind speed lies in the range
				target.TWA = Number(this.downwindTWAs[tgtIdx -1]) + mScale * (this.downwindTWAs[tgtIdx] -this.downwindTWAs[tgtIdx -1]); //degrees
				target.TWAt = target.TWA*Math.PI/180; //assume linear range	Radians		
				target.BTV = (Number(this.downwindSpeeds[tgtIdx -1]) + mScale * (this.downwindSpeeds[tgtIdx] -this.downwindSpeeds[tgtIdx -1]) ); //Knots
				//target.BTVt = knotsToMps*target.BTV*styleRates[STYLE]/100; // m/s
				target.BTVt = knotsToMps*target.BTV; // m/s
				target.VMG = target.BTV*Math.cos(target.TWA*Math.PI/180); // knots
				break;} }
		return target;
	};
	/**
 * returns the crossover TWA (degrees)
 * where a kite performs better than a jib in the current TWS.
 * Interpolation: TWS < min, use min, TWS > max, use max
 */
	this.calcJibKiteCrossoverTwa = function(TWS){
		//Pebble.showSimpleNotificationOnPebble("targetTWS.length", targetTWS.length);
		for (var tgtIdx = 1; tgtIdx < this.targetTWS.length; tgtIdx++ ){ // do't interpolate 
			if ( TWS <= this.targetTWS [tgtIdx])		
				return this.minTwaForKite[tgtIdx] ;
		}			
		return this.minTwaForKite[tgtIdx -1] ; // over maximum listed
	};
	/*
 * calcReach TWS:kts/m/s, TWA degrees
 * returns the BTV for that TWS and TWA - weighted average point of "the square"
 * Used to plan 1. the reach leg of the start and 
 * 2. the next leg if a reach
 * Assumes that Beating TWA <TWA < Running TWA 
 */
	this.calcReachBTV= function(TWS, TWA ){
		//Pebble.showSimpleNotificationOnPebble("DEBUG", "In calcReachBTV");
		TWA = Math.abs(TWA); // remove -ve TWA
		TWA -= 180*(TWA> 180?1:0); // 0<=x<=180
		var windAngleIdx, s, t;
		for (var twsIdx = 1; twsIdx < this.targetTWS.length; twsIdx++ ){ //bounds of TWS
			if ( TWS <= this.targetTWS [twsIdx]){ // this is the next higher wind speed
				var windRange = this.targetTWS [twsIdx] - this.targetTWS [twsIdx-1]; // the scale
				s = (TWS - this.targetTWS [twsIdx-1])/windRange; //
				for (windAngleIdx = 7; windAngleIdx < this.polarAngles.length; windAngleIdx ++){ // start search at 2nd row of reaching polars
					if (TWA <=this.polarAngles[windAngleIdx ] ) {
						var angleRange =this.polarAngles[windAngleIdx] - this.polarAngles[windAngleIdx -1];
						t = (TWA - this.polarAngles[windAngleIdx -1 ])/angleRange; //
						break; // found next higher reaching angle
					} //if
				} //for
				break; // found next higher TWS to use	
			} //if		
		} //for	 
		if (windAngleIdx == this.polarAngles.length){ //wind angle is greater than max dowunind polar, so use max value
			windAngleIdx --;
		}
		var a = Number(this.polars[windAngleIdx-1][twsIdx-1]); 
		var b = Number(this.polars[windAngleIdx-1][twsIdx]); 
		var c = Number(this.polars[windAngleIdx][twsIdx -1]); 
		var d = Number(this.polars[windAngleIdx][twsIdx]); 
		var ab = a + (b -a)*s;
		var cd = c + (d -c)*s;
		return ab + (cd- ab)*t;	 //knots	
	};
	
}
	
