/* jshint -W099 */ //remove warning about mixed spaces and tabs???
Pebble.addEventListener("ready",
  function(e) {
	 // Pebble.showSimpleNotificationOnPebble("DEBUG","eventListener");
	  readNavData();	  
  }// eventListener callback
); //addEventListener


var yacht = {};
yacht.prevValues = {};
var readNavDataRequest = new XMLHttpRequest(); //for read NavData
var selectCourseRequest = new XMLHttpRequest(); //called to set the race course
var startLineRequest = new XMLHttpRequest(); //called once only Ping Start line button request
var windWebRequest = new XMLHttpRequest(); //called for Read Wind Direction Speed
var refreshCourseRequest = new XMLHttpRequest(); //called at 4 minutes to refresh the course

var compassPoints = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW", "N"];

var loop = true;
var navDataFlag = false; // set while waiting for response
var navDataCount = 0;
var TWSDataFlag = false; // set while waiting for response
var TWSDataCount = 0;
var TWDDataFlag = false; // set while waiting for response
var TWDDataCount = 0;
var WIND_CYCLES = 5; //seconds per cycle
var startTime=0;  //when active, startTime is a  timeStamp (ms since epoch) of the start time

var styleDescs = [" ","Agressive","Standard","Defensive"];
var styleRates = [0, 90, 83, 75];
var STYLE=2 ; 
var knotsToMps = .5144444; // convert knots to metres/sec
var LOCAL_MAG_VAR = 12.5; 
var YACHT_LENGTH = 12.4; 
var GPS_BEHIND_BOW = 6; 

var presentPosData;
//var useGpsLatLon = false ; //true when testing with 
var panelsArray; var currentPanelIdx;
var MIN_ANGLE_FOR_NEXT_MARK = 100; //degrees 
var MIN_ANGLE_FOR_UPWIND = 60; //degrees, used for calc layline upwind
var nmToMetres = 1852;
var loopCounter = 0;
var lastPolledTimeStamp = 0;

var WEB_HOST = "http://192.168.0.6:8080/dev/"
//var WEB_HOST = "http://192.168.43.1:8080/dev/"
commsTimer(); //start the timer
function commsTimer(){
	var commsTimerTimeStamp = Date.now();
		if (commsTimerTimeStamp - lastPolledTimeStamp > 3000 || pollComplete == true){
			lastPolledTimeStamp = commsTimerTimeStamp;
			readNavData()
		}		
	setTimeout("commsTimer()",500); 
}
var pollComplete;
function readNavData(){
	alert("Here");
	pollComplete = false;
	//Pebble.showSimpleNotificationOnPebble("DEBUG","HERE");
	var url = WEB_HOST + "readCombinedData.php?cacheBuster="+new Date().getTime(); // gets location data and start line string
	readNavDataRequest.open("GET", url, true);
	readNavDataRequest.send(null);
	readNavDataRequest.onreadystatechange = function () {
		  if (readNavDataRequest.readyState == 4 ){/* 
		    0      The request is not initialized
			1      The request has been set up
			2      The request has been sent
			3      The request is in process
			4      The request is complete
*/
			   	if(readNavDataRequest.status == 200){ // or 404 not found
				   	var mData = readNavDataRequest.responseText;
				   	if (mData.length >0)
			   			//Pebble.showSimpleNotificationOnPebble("Message",readNavDataRequest.responseText);
						dispData(readNavDataRequest.responseText);   		
			   	} // if status == 200
			  else {
				  Pebble.showSimpleNotificationOnPebble("readNavDataRequest.status",readNavDataRequest.status);
			  }
		   } // if readyState == 4
		
	}; //onreadystatechange 

}
var prevTimeMs = 0;
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
var dampedValues = new loggerDataType;
var prevValues = new loggerDataType;

function dampSpeed(prevVal, thisVal){
	var dampedValue = Number(prevVal) + (thisVal -prevVal)/(damping+1);	
	dampedValue = Math.round(dampedValue * 10)/10 ; // round to one decimal
	if (isNaN(dampedValue)) return thisVal
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
	if (isNaN(dampedValue)) return thisVal
	return dampedValue;
}

function dispData(JSONcombinedData){
	//Pebble.showSimpleNotificationOnPebble("dispData received", JSONcombinedData);
	//Pebble.showSimpleNotificationOnPebble("dispData received", "BEFORE");
	navDataCount = 0;
	navDataFlag = false; // no longer waiting for response

	var combinedData =JSON.parse(JSONcombinedData); 
	//Pebble.showSimpleNotificationOnPebble("dispData received", "HERE");
	presentPosData =combinedData.presentPosData;
	var startLinePoints=combinedData.startLinePoints;

	var reportTime = new Date(Number(presentPosData.timeMs));
	var formattedReportTime = (reportTime.getHours()<10?"0":"")+reportTime.getHours() + ":"+
		(reportTime.getMinutes()<10?"0":"")+reportTime.getMinutes() + ":"+
		(reportTime.getSeconds()<10?"0":"")+reportTime.getSeconds() + " GPS  " ;
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

	//document.getElementById("perfActualBtv").innerText = dampedValues.log;
	//document.getElementById("perfActualTWA").innerText =Math.abs(dampedValues.TWA);
	
	//Pebble.showSimpleNotificationOnPebble("presentPosData.log",prevValues.log);
 	Pebble.sendAppMessage({ "0":  formattedReportTime, //GPS Time
						   "1": "Log "+ dampedValues.log, //perfActualBtv
						   "2": "TWA "+Math.abs(dampedValues.TWA), //perfActualTWA					  
						   "3": "TWS" + dampedValues.TWS , //TWS
						   "4": "TWD"+  dampedValues.TWD 
						  }, function(e) { //Success callback
		lastPolledTimeStamp = Date.now();	//managing the polling process
		pollComplete = true;
  			},
  		function(e) { //Fail callback
   			Pebble.showSimpleNotificationOnPebble("Nack Message",  e.error.message);
  		}
	);	

	for (var idx in prevValues) // update previous values
		prevValues[idx] = dampedValues[idx]

}
