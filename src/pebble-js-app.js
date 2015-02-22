/* jshint -W099 */ //remove warning about mixed spaces and tabs???
//var WEB_HOST = "http://192.168.0.6:8080/dev/";	
//var WEB_HOST = "http://192.168.43.1:8080/dev/";
//var TACTICIAN_HOST = "http://gpsanimator.com/tactician/pebbleConfig";
var WEB_HOST = "http://localhost:8080/dashboard/";
var startTime=0;  //when active, startTime is a  timeStamp (ms since epoch) of the start time
Pebble.addEventListener("showConfiguration",
  function(e) {
	//var pebbleConfigURL = WEB_HOST+"pebbleConfig.php";
	var pebbleConfigURL = "http://gpsanimator.com/tactician/pebbleConfig";
	Pebble.openURL(pebbleConfigURL);
	}
); //addEventListener showConfiguration
var settings = {};	
Pebble.addEventListener('webviewclosed',
					
  function(e) {
	 //console.log('webviewclosed' + e.response);
	if (e.response != "cancel"){
			  settings = e.response;
			//  load_data();
	//}// if
		var config = JSON.parse(e.response); // it's assumed to be a JSON object
		settings = config.settings;
		//console.log (JSON.stringify(config.configData));
		var mRequest = new XMLHttpRequest(); 
		var mURL =  WEB_HOST + "configData.php"; //sends json object
		 mRequest = new XMLHttpRequest(); //for navStart.php		
		var params = "configData="+encodeURI(JSON.stringify(config.configData));
		mRequest.open("POST", mURL, true);
		mRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		mRequest.setRequestHeader("Content-length", params.length);
		mRequest.setRequestHeader("Connection", "close");
		mRequest.send(params);
		mRequest.onreadystatechange = function () {
			if (mRequest.readyState == 4 && mRequest.status == 200 ){
				var resp = mRequest.responseText;	
				console.log ("configData response: "+resp);
				load_data();	
			} // if readyState == 4
		}; //onreadystatechange	  
	} // if not cancel
}//anonymous function
	  
    //Pebble.showSimpleNotificationOnPebble('Configuration window returned: ');
);
Pebble.addEventListener("ready",
  function(e) {	 
	  // Pebble.showSimpleNotificationOnPebble("Data loading","Please wait for \"Data Loaded\". "+
		//								  " If long delay, restart Tactician.");
	  load_data();	  

  }// eventListener callback
);//addEventListener ready

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
							//var resp = mRequest.responseText;	
							//   console.log ("startNav.php: Nav started with "+resp);
						   } // if readyState == 4
					}; //onreadystatechange
				}
				else {
					mURL =  WEB_HOST + "markFwdBack.php?indicator="+e.payload[msgIdx];
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);	
					mRequest.onreadystatechange = function () {
							if (mRequest.readyState == 4 && mRequest.status == 200 ){
							//var resp = mRequest.responseText;	
							  //console.log ("markFwdBack.php: with "+  e.payload[msgIdx] + " returned with "+resp);
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
							//startLinePressResponse(startLineRequest.responseText);		   		
						} // if status == 200
					} // if readyState == 4
				}; //onreadystatechange
				if (e.payload[msgIdx] == "BOAT") print_division();  //refresh course wirh new start line (bot)
			}
			else if (msgIdx == 104){// Start time 10, 5, 4 mins, as minutes
				console.log ("presentPosData.timeMs: "  + presentPosData.timeMs + "Number:" + Number(presentPosData.timeMs) ) ;
				startTime = Number(presentPosData.timeMs) + Number(e.payload[msgIdx]) *1000 ; // to thous
				console.log ("startTime: "  + startTime ) ;
				mURL = WEB_HOST +"startLinePress.php?startTime="+  startTime; // Updates & gets location data string
				mRequest.open("GET", mURL, true);
				mRequest.send(null);
				mRequest.onreadystatechange = function () {
					if (mRequest.readyState == 4 ){
						if(mRequest.status == 200){
							//startLinePressResponse(startLineRequest.responseText);		   		
						} // if status == 200
					} // if readyState == 4
				}; //onreadystatechange
			}
		}
});  //Pebble.addEventListener("appmessage",	
						
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

function set_course(courseIdx){
	console.log("set_course: "+courseIdx);
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

var httpFlags = 0; //1: polars, 2, division, 4:all course, 8: current course
var readPolarsRequest = new XMLHttpRequest(); //for read Polars data
var targets, starting; // objects holding racing and starting [polars]
function readPolars(){
	readThesePolars("racing");
	//readThesePolars("starting");  //done on success of HTTP
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
							//Pebble.showSimpleNotificationOnPebble("starting.UpwindTWAs[1]: ",starting.upwindTWAs[1]);
						}
						//debug 
						//Pebble.showSimpleNotificationOnPebble("targets.UpwindTWAs[1]: ",targets.upwindTWAs[1]);
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
var degs2metres = 111120; // metres per degree of latitiude
var yacht = {};
yacht.prevValues = {};
var readNavDataRequest = new XMLHttpRequest(); //for read NavData
//var selectCourseRequest = new XMLHttpRequest(); //called to set the race course
//var startLineRequest = new XMLHttpRequest(); //called once only Ping Start line button request
//var windWebRequest = new XMLHttpRequest(); //called for Read Wind Direction Speed
//var refreshCourseRequest = new XMLHttpRequest(); //called at 4 minutes to refresh the course

var compassPoints = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW", "N"];

//var loop = true;
var navDataFlag = false; // set while waiting for response
//var navDataCount = 0;
//var TWSDataFlag = false; // set while waiting for response
//var TWSDataCount = 0;
//var TWDDataFlag = false; // set while waiting for response
//var TWDDataCount = 0;
//var WIND_CYCLES = 5; //seconds per cycle
//var startTime=0;  //when active, startTime is a  timeStamp (ms since epoch) of the start time

//var styleDescs = [" ","Agressive","Standard","Defensive"];
//var styleRates = [100, 90, 83, 75];
var STYLE;  //set from Settings/Configuration
var knotsToMps = 0.5144444; // convert knots to metres/sec
var LOCAL_MAG_VAR ;  //set from courses.clubs[settings.clubIdx].magVar
var YACHT_LENGTH ;  //set from Settings/Configuration
var GPS_BEHIND_BOW ;  //set from Settings/Configuration


var HDGr, BTVr;
//var useGpsLatLon = false ; //true when testing with 
//var panelsArray; var currentPanelIdx;
var MIN_ANGLE_FOR_NEXT_MARK = 100; //degrees 
var MIN_ANGLE_FOR_UPWIND = 60; //degrees, used for calc layline upwind
var nmToMetres = 1852;
//var loopCounter = 0;
var pollComplete= false;
var lastPolledTimeStamp = 0;
var upwindTarget, downwindTarget;

function commsTimer(){
	var commsTimerTimeStamp = Date.now();
	if (commsTimerTimeStamp - lastPolledTimeStamp > 3000 || pollComplete === true){
			lastPolledTimeStamp = commsTimerTimeStamp;
			readNavData();
		}	
	//if(timerCount++ <10)
	setTimeout(function(){commsTimer();},1000); 
}
function calcStartSolution(formattedReportTime, currentCourse){ // start line & solution
	var startingTargets =starting.calcTargets(dampedValues.TWS); // use Target TWA and BTC for lay-line calc
	//console.log("dampedValues.TWS: "+dampedValues.TWS);
	/*console.log("startingTargets: .TWA: "+startingTargets.TWA+
			" .TWAt: "+startingTargets.TWAt+ 
			" .BTV: "+startingTargets.BTV +
			" .VMG: "+startingTargets.VMG +
			" .BTVt: "+startingTargets.BTVt
			   ) ; */

	var msgObj = {};
	var cosLatRatio = Math.cos(startLinePoints.boatLat*Math.PI/180);
	var boat={} ;
	var pin = {};
	//Transform POSITION wrt boat->pin
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

	var MAX_BIAS_ANGLE_FOR_UPWIND = startingTargets.TWAt*180/Math.PI; // in degrees
	var prefEnd, prefDist;
	var lineTime, lineSpeed;
	var solutionTime = ""; // time to tack(off wind) or time to line (Beat)
	var solutionPos = ""; // line position (off wind) or boats from line (Beat)
	var solutionStatus;
	if (Math.abs(lineBias)>=MAX_BIAS_ANGLE_FOR_UPWIND) { //upwind
		prefEnd = "Dn Wind";
		prefDist= " ";
		lineTime = "";
		lineSpeed = "";
	}
	else{ //Upwind start line
		prefEnd = (lineBias>=0?"BOAT":"PIN");
		prefDist = Math.abs(Math.round(pin.r * Math.cos(TwdRotatedRads)));
		var reachTWADegs = 90 +lineBias;
		var reachSpeedKts = starting.calcReachBTV(dampedValues.TWS, reachTWADegs );
		//console.log("reachSpeedKts: "+reachSpeedKts);
		lineTime = "Time " + Math.round(pin.r/reachSpeedKts/knotsToMps); // LINETIME
		lineSpeed = "At "	+ Math.round(reachSpeedKts*10)/10; // LINESPEED					
		// Starting Time & Distance Solution
		yacht.zSecs = (presentPosData.timeMs -startTime )/1000; // time to go, -ve to zero to , 
		if (yacht.zSecs >180 )// gun time time is more than 3 minutes ago
			solutionStatus =  "Timer off.";
		else if (yacht.zSecs < -600 ){ 
			solutionStatus = "Outside 5 mins";
		}
		else { // inside 5 minutes 
			var lineDist = yacht.yMtrs + GPS_BEHIND_BOW*Math.sin(HDGr)  ; // Actual dist plus GPS pos from bow (behind line is negative
			if (lineDist > 0 ){ // over the line
				solutionStatus = "Over the the line";
				solutionTime ="";
				solutionPos = "";
				if( yacht.zSecs > 0){ //  and after the gun
					solutionStatus= "Navigating."	;					
					startTime = 0; //stop the timer to prevent any further action on the starting page
					var mURL = "startNav.php";
					var mRequest = new XMLHttpRequest(); //for navStart.php
					mRequest.open("GET", mURL, true); 
					mRequest.send(null);
					mRequest.onreadystatechange = function () {
					   if (mRequest.readyState == 4 && mRequest.status == 200 ){
							//var resp = mRequest.responseText;	
						   //	alert ("startNav.php: Nav started with "+resp);
					   } // if readyState == 4
					}; //onreadystatechange
				}			
			}// over the line
			else { // behind the line				
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
				else { // off the wind and behind the line 
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
			}// behind the line
		}// inside 5 mins
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
	}
	return msgObj;
} //calcSolution

function readNavData(){

	pollComplete = false;
	var url = WEB_HOST + "readCombinedData.php?cacheBuster="+new Date().getTime(); // gets location data and start line string
	readNavDataRequest.open("GET", url, true);
	readNavDataRequest.send(null);
	readNavDataRequest.onreadystatechange = function () {
		  if (readNavDataRequest.readyState == 4 ){
			   	if(readNavDataRequest.status == 200){ // or 404 not found
				   	var mData = readNavDataRequest.responseText;
				   	if (mData.length >0)
			   			//Pebble.showSimpleNotificationOnPebble("Message",readNavDataRequest.responseText);
						dispData(readNavDataRequest.responseText);   		
			   	} // if status == 200
		   } // if readyState == 4		
	}; //onreadystatechange 
}
	
//var prevTimeMs = 0;
var damping=3;
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
var dampedValues = new loggerDataType();
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
var missedCyclesGPS = 0 ; // counts the number of times the server has failed to update the GPS time
var prevTimeMs = 0;

function dispData(JSONcombinedData){
		
	//Pebble.showSimpleNotificationOnPebble("dispData received", JSONcombinedData);
	navDataFlag = false; // no longer waiting for response
	var combinedData =JSON.parse(JSONcombinedData); 
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "HERE");
	presentPosData =combinedData.presentPosData;
	startLinePoints=combinedData.startLinePoints;
	startTime = Number(startLinePoints.startTime); // sets start time from StartLineData	
	/*
	var timeSinceLastGPS = presentPosData.timeMs - prevTimeMs;

	if (timeSinceLastGPS === 0){ //no GPS time update, Logger has not updated navData - something's frozen at the server
		if (++missedCyclesGPS ==MISSED_CYCLES_ALERT_LIMIT){ //serious.. missed too much time
			//flashBackground(); 
		}			
		return; // no GPS time change, so nothing to update
	}
	*/
	missedCyclesGPS=0;
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
	
	//Pebble.showSimpleNotificationOnPebble("DEBUG","HERE");

	//PERFORMANCE stuff.
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
		//Pebble.showSimpleNotificationOnPebble("DEBUG", "Run");
		pointOfSailing = "Run";
		perfTgtBTV = Math.round(downwindTarget.BTV*10)/10;
		perfTgtTWA = Math.round(downwindTarget.TWA);
		perfTgtVMG = Math.round(downwindTarget.VMG*10)/10;
		perfActualVMG = Math.round(VMG*10)/10;		
		perfPcDisp = pointOfSailing+":"+
			Math.abs(Math.round(100*VMG / downwindTarget.VMG))+"%";
	}
	else { //Reaching
		//Pebble.showSimpleNotificationOnPebble("DEBUG", "Jib reach");
		if ( Math.abs(TWAToMark)< targets.calcJibKiteCrossoverTwa(dampedValues.TWS))
			pointOfSailing = "Jib reach";
		else 
			pointOfSailing = "Shy kite";

		var tgtBTV = targets.calcReachBTV(dampedValues.TWS, dampedValues.TWA );
		//	Pebble.showSimpleNotificationOnPebble("DEBUG", "calcReachBTV");
	

		perfTgtBTV = Math.round(tgtBTV*10)/10;
		perfTgtTWA = Math.round(Math.abs(dampedValues.TWA));
		perfTgtVMG = Math.round(tgtBTV*10)/10;
		var intPerfActualVMG = dampedValues.log*Math.cos( presentPosData.wptBearingDegs*Math.PI/180); //wptBearingDegs should be 180.
		perfActualVMG = Math.round(intPerfActualVMG*10)/10;
		var reachPerformance = Math.round(perfActualVMG /tgtBTV * 100); //
		perfPcDisp =pointOfSailing+":"+ Math.abs(reachPerformance)+"%";
	}			
	//NAVIGATION STUFF
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
	// Calc and display current/tide set 
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
		//currentAngleDegsMag += 360 *(currentAngleDegsMag<0?1:(currentAngleDegsMag>360?-1:0)); //yielded silly numbers???!!

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
	 
	 
	 
	 
	var msgObj = {};
	if (watchPhase == "start"){	// display start-line details and solution
		if (startLinePoints.boatLat === undefined) // not till response from startLine HTTP request
			return;	
		 msgObj = calcStartSolution(formattedReportTime);
	}
		
	for (var prevValuesIdx in prevValues) // e previous values
		prevValues[prevValuesIdx] = dampedValues[prevValuesIdx];
	//console.log("window: "+selectedWindow);

	if  (selectedWindow == "performance"){
		/*	GPSTIME,	PERFPCDISP, 	PERFACTUALBTV, 	PERFTGTBTV,	PERFACTUALTWA,	PERFTGTTWA,	PERFACTUALVMG,
	PERFTGTVMG,	TWS,	TWD*/
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
			/*
			"34" : " Speed "+ currentSpeed,//CURRENTSPEED
			"35" : " Dir " + currentAngleDegsMag, //CURRENTDIR
			"36" : " Effect "+ effect, //CURRENTEFFECT
			*/
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
	// always tack these on for the Navigation Menu
	msgObj[ "0"] = formattedReportTime; //GPS Time
	msgObj["12"] =  presentPosData.legIdx+": "+ presentPosData.WptName; //WptName
	msgObj["19"] =  presentPosData.nextLegName; //next leg name NEXTLEGNAME


	//Pebble.showSimpleNotificationOnPebble("DEBUG", "sendAppMessage");
 	Pebble.sendAppMessage(msgObj, function(e) { //Success callback
			lastPolledTimeStamp = Date.now();	//managing the polling process
			 //onsole.log("NavDatSend OK");
			pollComplete = true;
  			},
  		function(e) { //Fail callback
   			//Pebble.showSimpleNotificationOnPebble("Nack Message",  e.error.message);
			//console.log("Nack Message");
  		}
	);	
	
//Pebble.showSimpleNotificationOnPebble("JS ERROR",  "LINE 439");

} //dispData(JSONcombinedData)



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
 * 	.time: seconds to lay-line
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

var courses; // the BIG clubs/series/...object
/*
* reads the course with pebbleGetCourses and
* sends it as text as appMessage #37
*/
function load_data(){
	readCookies(); // from tactician web server (phone) with php
	readPolars(); //this can be done before watch is ready
 
	print_division();
	get_selected_series();
	
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
					 upload_division(readCoursesRequest.responseText);
		//console.log(readCoursesRequest.responseText);
					testHttpFlags(2);
				}
				else
			Pebble.showSimpleNotificationOnPebble("HTTP Fail(2)", "Check that your web server is running"); 	
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
function get_selected_series(){ //read selected series
	var url = WEB_HOST + "pebbleGetSelectedSeries.php"; 
	var http = new XMLHttpRequest(); 
	http.open("GET", url, true);	
	http.send(null);
	http.onreadystatechange = function () {
		  if (http.readyState == 4 ){
			   	if(http.status == 200){ // or 404 not found	
					var selectedSeries = JSON.parse(http.responseText); 
					//console.log("get_selected_series\n"+ http.responseText); return;
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
function populateDivsFromSeries(selectedSeries) { //modelled on getSeriesFromSelect
	LOCAL_MAG_VAR = selectedSeries.clubMagVar;
	var courseDivsList = "";
	var courseDivCount = 0;
	for (var courseIdx in selectedSeries.courses){
		var thisCourse = selectedSeries.courses[courseIdx];
		courseDivCount ++;
		courseDivsList += thisCourse.number +" "+ thisCourse.wind +"|"+
		courseIdx+":";  // | delimited within : delimited		
	}
	uploadDivs(courseDivCount,courseDivsList );
}
function uploadDivs(courseDivCount,courseDivsList ){
	//Pebble.showSimpleNotificationOnPebble("courseDivCount",courseDivCount); 
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

function  readCookies(){ //cookies established in Pebble Configuration/Settings
	var url = WEB_HOST + "pebbleGetCookies.php"; 
	var get_cookiesRequest = new XMLHttpRequest(); 
	get_cookiesRequest.open("GET", url, true);	
	get_cookiesRequest.send(null);
	get_cookiesRequest.onreadystatechange = function () {
		  if (get_cookiesRequest.readyState == 4 ){
			   	if(get_cookiesRequest.status == 200){ // or 404 not found	
					//Pebble.showSimpleNotificationOnPebble("get_cookiesRequest", get_cookiesRequest.responseText);				
					settings = JSON.parse(get_cookiesRequest.responseText);
					 testHttpFlags(9);
				}
			  else
				   Pebble.showSimpleNotificationOnPebble("HTTP Fail(9)", "Check that your web server is running"); 
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
function testHttpFlags(flag){
	var mask=Math.pow(2,(flag-1));
	httpFlags = httpFlags | mask;
	if (httpFlags==511){
		httpFlags=0; //ready for the configuration
		if (settings.clubIdx === undefined)
			settings.clubIdx=0;

		if (settings.seriesIdx === undefined)
			settings.seriesIdx = 0;
		if (settings.divIdx === undefined)
			settings.divIdx = 0;
		
		//LOCAL_MAG_VAR = 2.5; //Number(courses.clubs[settings.clubIdx].magVar);
		if (settings.yachtLength === undefined)
			settings.yachtLength = 12;
		YACHT_LENGTH  = settings.yachtLength; 
		if (settings.gpsBehindBow === undefined)
			settings.gpsBehindBow = 8;
		GPS_BEHIND_BOW= settings.gpsBehindBow; 
		if (settings.perfStyle === undefined)
			settings.perfStyle = 2;
		STYLE = settings.perfStyle;
		flagDataLoaded();

	}
		//else 
		//console.log('testHttpFlag: '  + flag + ":" +httpFlags);
		//Pebble.showSimpleNotificationOnPebble("Server progress:","Flag: "+flag + "flags: "+httpFlags); 
}
function flagDataLoaded( ){
	Pebble.sendAppMessage({ 
		"44": "0", //	COURSEDIVSCOUNT, // 42 number of course divisions in this series
		 }, function(e) { //Success callback
			 		commsTimer(); //start the timer once all the data is loaded
				  //Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
  						},
			function(e) { //Fail callback
				//console.log('sendAppMessage courseDivCount:'+courseDivCount + " courseDivsList: "+ courseDivsList);
				//Pebble.showSimpleNotificationOnPebble("Upload (8) failed, retrying: ","current course menu"); 						
				setTimeout(function(){flagDataLoaded();},1000);
				}
	);	
}	
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
	

