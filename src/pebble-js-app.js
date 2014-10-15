/* jshint -W099 */ //remove warning about mixed spaces and tabs???
Pebble.addEventListener("ready",
  function(e) {
	  //Pebble.showSimpleNotificationOnPebble("DEBUG","eventListener");
	   readPolars(); //this can be done befoew watch is ready
	  //readNavData();
	 
 
  }// eventListener callback
); //addEventListener
var WEB_HOST = "http://192.168.0.6:8080/dev/";
var polars;

//var WEB_HOST = "http://192.168.43.1:8080/dev/"

var readPolarsRequest = new XMLHttpRequest(); //for read Polars data
var polars = [];
var targetTWS = [];
var polarAngles = [];
var targetUpwindTWAs, targetUpwindSpeeds, targetDownwindTWAs,targetDownwindSpeeds, targetMinTwaForKite;

function readPolars(){
	//Pebble.showSimpleNotificationOnPebble("DEBUG","HERE");
	var url = WEB_HOST + "pebbleGetPolars.php"; // gets polars in a json string
	readPolarsRequest.open("GET", url, true);
	readPolarsRequest.send(null);
	readPolarsRequest.onreadystatechange = function () {
		  if (readPolarsRequest.readyState == 4 ){
			   	if(readPolarsRequest.status == 200){ // or 404 not found
				   	var mData = readPolarsRequest.responseText;
				   	if (mData.length >0){
						var polarArray = JSON.parse(readPolarsRequest.responseText);
						for (var colIdx=1; colIdx < polarArray[0].length; colIdx ++ ) // top row from second column has TWS
							targetTWS[colIdx -1] = polarArray[0][colIdx];
						for (var rowIdx=1; rowIdx <polarArray.length; rowIdx ++ ) // left hand column has polar angles
							polarAngles[rowIdx -1] = polarArray[rowIdx][0];
						for ( rowIdx = 1; rowIdx < polarArray.length; rowIdx++){ // set up central polars array
							polars[rowIdx-1] = [];
							for ( colIdx = 1; colIdx < polarArray[0].length; colIdx++)
								polars[rowIdx -1][colIdx-1] = polarArray[rowIdx][colIdx];
						}
						targetUpwindTWAs = polars[0];
	 					targetUpwindSpeeds = polars[1];
	 					targetDownwindTWAs = polars[2];
	 					targetDownwindSpeeds = polars[3];
	 					targetMinTwaForKite = polars[4];
						
					}// length > 0						
				}//status == 200
			  	else 
				  Pebble.showSimpleNotificationOnPebble("readNavDataRequest.status",readPolarsRequest.status);
			} //readyState == 4

		   }; //onreadystatechange 		
}
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
var upwindTarget, downwindTarget;
commsTimer(); //start the timer
function commsTimer(){
	var commsTimerTimeStamp = Date.now();
		if (commsTimerTimeStamp - lastPolledTimeStamp > 3000 || pollComplete == true){
			lastPolledTimeStamp = commsTimerTimeStamp;
			readNavData();
		}		
	setTimeout("commsTimer()",500); 
}
var pollComplete;
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

function dispData(JSONcombinedData){
	//Pebble.showSimpleNotificationOnPebble("dispData received", JSONcombinedData);
	navDataCount = 0;
	navDataFlag = false; // no longer waiting for response

	var combinedData =JSON.parse(JSONcombinedData); 
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "HERE");
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
	
	//Pebble.showSimpleNotificationOnPebble("DEBUG","HERE");

	//PERFORMANCE stuff.
	upwindTarget = calcTargets(); // use Target TWA and BTC for lay-line calc
	downwindTarget = calcDownwindTargets(); //DOWNwind targets
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
		if ( Math.abs(TWAToMark)< calcJibKiteCrossoverTwa())
			pointOfSailing = "Jib reach";
		else 
			pointOfSailing = "Shy kite";

		var tgtBTV = calcReachBTV(dampedValues.TWS, dampedValues.TWA );
		//	Pebble.showSimpleNotificationOnPebble("DEBUG", "calcReachBTV");
	

		perfTgtBTV = Math.round(tgtBTV*10)/10;
		perfTgtTWA = Math.round(Math.abs(dampedValues.TWA));
		perfTgtVMG = Math.round(tgtBTV*10)/10;
		var intPerfActualVMG = dampedValues.log*Math.cos( presentPosData.wptBearingDegs*Math.PI/180); //wptBearingDegs should be 180.
		perfActualVMG = Math.round(intPerfActualVMG*10)/10;
		var reachPerformance = Math.round(perfActualVMG /tgtBTV * 100); //

		perfPcDisp =pointOfSailing+":"+ 
			Math.abs(reachPerformance)+"%";
	}
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "sendAppMessage");
 	Pebble.sendAppMessage({ "0":  formattedReportTime, //GPS Time
						   "1": "Log "+ dampedValues.log, //perfActualBtv
						   "2": "Act TWA "+Math.abs(dampedValues.TWA), //perfActualTWA					  
						   "3": "TWS " + dampedValues.TWS , //TWS
						   "4": "TWD "+  dampedValues.TWD,
						   "5": "Tgt BTV " + perfTgtBTV,
						   "6": "TgT TWA " + perfTgtTWA,
						   "7": "TgT VMG " + perfTgtVMG,
						   "8": "Act VMG " + perfActualVMG,
						   "9": perfPcDisp					   						   
						  }, function(e) { //Success callback
		lastPolledTimeStamp = Date.now();	//managing the polling process
		pollComplete = true;
  			},
  		function(e) { //Fail callback
   			Pebble.showSimpleNotificationOnPebble("Nack Message",  e.error.message);
  		}
	);	

	for (var idx in prevValues) // update previous values
		prevValues[idx] = dampedValues[idx];

}

function calcTargets(){ //return TWA (Rads) and BTV (m/s) for current dampedValues.TWS and STYLE
	var target = {};
	for (var tgtIdx = 0; tgtIdx < targetTWS.length; tgtIdx++ ){ // find the tacking speed and angle for this TWS. Assumes TWS between 0 and 35, reasonable?
		if ( dampedValues.TWS <= targetTWS [tgtIdx]){
			var mRange = targetTWS[tgtIdx] - targetTWS[tgtIdx -1]; // dist min to max of current wind range
			var mScale = (dampedValues.TWS -targetTWS[tgtIdx -1])/mRange; //ratio of where current  wind speed lies in the range
			target.TWA = Number(targetUpwindTWAs[tgtIdx -1]) + mScale * (targetUpwindTWAs[tgtIdx] -targetUpwindTWAs[tgtIdx -1]); //degrees
			target.TWAt = target.TWA*Math.PI/180; //assume linear range	Radians		
			target.BTV = (Number(targetUpwindSpeeds[tgtIdx -1]) + mScale * (targetUpwindSpeeds[tgtIdx] -targetUpwindSpeeds[tgtIdx -1]) ); //Knots
			target.VMG = target.BTV*Math.cos(target.TWAt); // knots
			//target.BTV *= styleRates[STYLE]/100; // moderate beat speed according to STYLE
			target.BTVt = knotsToMps*target.BTV*styleRates[STYLE]/100; // m/s
			break;} }
	return target;
}
/*
 * return downwind targets for current TWS
 * used in calculating NEXT LEG apparent wind speed.
 */
function calcDownwindTargets(){ 
	var target = {};
	for (var tgtIdx = 0; tgtIdx < targetTWS.length; tgtIdx++ ){ // find the tacking speed and angle for this TWS. Assumes TWS between 0 and 35, reasonable?
		if ( dampedValues.TWS <= targetTWS [tgtIdx]){
			var mRange = targetTWS[tgtIdx] - targetTWS[tgtIdx -1]; // dist min to max of current wind range
			var mScale = (dampedValues.TWS -targetTWS[tgtIdx -1])/mRange; //ratio of where current  wind speed lies in the range
			target.TWA = Number(targetDownwindTWAs[tgtIdx -1]) + mScale * (targetDownwindTWAs[tgtIdx] -targetDownwindTWAs[tgtIdx -1]); //degrees
			target.TWAt = target.TWA*Math.PI/180; //assume linear range	Radians		
			target.BTV = (Number(targetDownwindSpeeds[tgtIdx -1]) + mScale * (targetDownwindSpeeds[tgtIdx] -targetDownwindSpeeds[tgtIdx -1]) ); //Knots
			target.BTVt = knotsToMps*target.BTV*styleRates[STYLE]/100; // m/s
			//target.BTV *= styleRates[STYLE]/100; // moderate beat speed according to STYLE
			target.VMG = target.BTV*Math.cos(target.TWA*Math.PI/180); // knots
			break;} }
	return target;
}
/**
 * returns the crossover TWA (degrees)
 * where a kite performs better than a jib in the current TWS.
 * Interpolation: TWS < min, use min, TWS > max, use max
 */
function calcJibKiteCrossoverTwa(){
	//Pebble.showSimpleNotificationOnPebble("targetTWS.length", targetTWS.length);
	for (var tgtIdx = 1; tgtIdx < targetTWS.length; tgtIdx++ ){ // do't interpolate 
		if ( dampedValues.TWS <= targetTWS [tgtIdx])		
			return targetMinTwaForKite[tgtIdx] ;
	}			
	return targetMinTwaForKite[tgtIdx -1] ; // over maximum listed
}
/*
 * calcReach TWS:kts/m/s, TWA degrees
 * returns the BTV for that TWS and TWA - weighted average point of "the square"
 * Used to plan 1. the reach leg of the start and 
 * 2. the next leg if a reach
 * Assumes that Beating TWA <TWA < Running TWA 
 */
function calcReachBTV(TWS, TWA ){
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "In calcReachBTV");
	TWA = Math.abs(TWA); // remove -ve TWA
	TWA -= 180*(TWA> 180?1:0); // 0<=x<=180
	var windAngleIdx, s, t;
	for (var twsIdx = 1; twsIdx < targetTWS.length; twsIdx++ ){ //bounds of TWS
		if ( TWS <= targetTWS [twsIdx]){ // this is the next higher wind speed
			var windRange = targetTWS [twsIdx] - targetTWS [twsIdx-1]; // the scale
			s = (TWS - targetTWS [twsIdx-1])/windRange; //
			for (windAngleIdx = 7; windAngleIdx < polarAngles.length; windAngleIdx ++){ // start search at 2nd row of reaching polars
				if (TWA <=polarAngles[windAngleIdx ] ) {
					var angleRange =polarAngles[windAngleIdx] - polarAngles[windAngleIdx -1];
					t = (TWA - polarAngles[windAngleIdx -1 ])/angleRange; //
					break; // found next higher reaching angle
				} //if
			} //for
			break; // found next higher TWS to use	
		} //if		
	} //for	 
	if (windAngleIdx == polarAngles.length){ //wind angle is greater than max dowunind polar, so use max value
		windAngleIdx --;
	}
	var a = Number(polars[windAngleIdx-1][twsIdx-1]); 
	var b = Number(polars[windAngleIdx-1][twsIdx]); 
	var c = Number(polars[windAngleIdx][twsIdx -1]); 
	var d = Number(polars[windAngleIdx][twsIdx]); 
	var ab = a + (b -a)*s;
	var cd = c + (d -c)*s;
	return ab + (cd- ab)*t;	 //knots
	
}