/* jshint -W099 */ //remove warning about mixed spaces and tabs???
var WEB_HOST = "http://192.168.0.6:8080/dev/";	
//var WEB_HOST = "http://192.168.43.1:8080/dev/";
//var WEB_HOST = "http://localhost:8080/dev/";
Pebble.addEventListener("showConfiguration",
  function(e) {
	var pebbleConfigURL = WEB_HOST+"pebbleConfig.php";
	Pebble.openURL(pebbleConfigURL);
	}
); //addEventListener showConfiguration
var settings = {};	
Pebble.addEventListener('webviewclosed',
					
  function(e) {
	  console.log('webviewclosed' + e.response);
	  if (e.response != "cancel"){
		settings = e.response; // it's assumed to be a JSON object
		readCookies(); // from tactician web server (phone) with php
	  	readPolars(); //this can be done before watch is ready
	  	read_course();
	  }
    //Pebble.showSimpleNotificationOnPebble('Configuration window returned: ');
  }
);
Pebble.addEventListener("ready",
  function(e) {	 
	  /*DEBUG send to phone*/
	  // Pebble.showSimpleNotificationOnPebble("Data loading","Please wait for \"Data Loaded\". "+
		//								  " If long delay, restart Tactician.");
	  readCookies(); // from tactician web server (phone) with php
	  readPolars(); //this can be done before watch is ready
	  read_course();
	  

  }// eventListener callback
);//addEventListener ready

Pebble.addEventListener("appmessage",
	 function(e) {
		 console.log("Received app message: "+ e.payload["101"]);

		for (var msg in e.payload ){
			console.log("payload: "+msg + ":" + e.payload[msg]);
		}
	 }
);


var httpFlags = 0; //1: polars, 2, division, 4:all course, 8: current course
var polars;

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
					testHttpFlags(1);
				}//status == 200
			  	else 
				  Pebble.showSimpleNotificationOnPebble("HTTP Fail(1)","Check your web server is running");
			} //readyState == 4

		   }; //onreadystatechange 		
}
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
var navDataCount = 0;
//var TWSDataFlag = false; // set while waiting for response
//var TWSDataCount = 0;
//var TWDDataFlag = false; // set while waiting for response
//var TWDDataCount = 0;
//var WIND_CYCLES = 5; //seconds per cycle
//var startTime=0;  //when active, startTime is a  timeStamp (ms since epoch) of the start time

//var styleDescs = [" ","Agressive","Standard","Defensive"];
var styleRates = [0, 90, 83, 75];
var STYLE=2 ; 
var knotsToMps = 0.5144444; // convert knots to metres/sec
var LOCAL_MAG_VAR ;  //set from settings.magVar (cookie)
//var YACHT_LENGTH = 12.4; 
//var GPS_BEHIND_BOW = 6; 

var presentPosData;
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
	setTimeout(function(){commsTimer();},1000); 
}

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
			 // else {
				 // Pebble.showSimpleNotificationOnPebble("readNavDataRequest.status",readNavDataRequest.status);
			//  }
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

function dispData(JSONcombinedData){
	//Pebble.showSimpleNotificationOnPebble("dispData received", JSONcombinedData);
	navDataCount = 0;
	navDataFlag = false; // no longer waiting for response

	var combinedData =JSON.parse(JSONcombinedData); 
	//Pebble.showSimpleNotificationOnPebble("DEBUG", "HERE");
	presentPosData =combinedData.presentPosData;
//	var startLinePoints=combinedData.startLinePoints;

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
		for (var twsIdx = 0; twsIdx < targetTWS.length; twsIdx++ ){
			if 	(Math.abs(dampedValues.TWS) <=targetTWS[twsIdx] ){ // find the index for this TWS
				break;}}
		nextLegText = "";
		if (Math.abs(nextLegTWA) <= targetUpwindTWAs[twsIdx] ){ // a work
			nextLegText =  "Beat";
			apparent = calcApparent(dampedValues.TWS,upwindTarget.TWA, upwindTarget.BTV  );
			nextLegAWADisp= Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
		else if (Math.abs(nextLegTWA) <= targetMinTwaForKite[twsIdx]){// jib reach
			BTV = calcReachBTV(dampedValues.TWS, dampedValues.TWA );
			apparent = calcApparent(dampedValues.TWS, nextLegTWA, BTV  );
			nextLegText = "Jib reach-" + (apparent.AWA >0?"Stbd":"Port") ;
			nextLegAWADisp = Math.round(apparent.AWA);
			nextLegAWSDisp = Math.round(apparent.AWS*10)/10;
		}
		else if (Math.abs(nextLegTWA) <= targetDownwindTWAs[twsIdx]) {// kite reach	
			BTV = calcReachBTV(dampedValues.TWS, dampedValues.TWA );
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
				 upwindTarget.TWAt*180/Math.PI,  // -180<TWA<180
				 upwindTarget.BTVt /knotsToMps // knots
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
						   "9": perfPcDisp,
						   "10": "SOG " +  Math.round(dampedValues.SOG*10)/10 ,
						   "11": "COG(M) "+(COGMagDegs<10?"00":(COGMagDegs<100?"0":""))+COGMagDegs,
						   "12" : presentPosData.legIdx+":"+ presentPosData.WptName, //WptName
						   "13" : "Dist" + wptDispDisp, // next mark distance
						   "14" : "Brg Clock " +presentPosData.wptBearingClock ,
						   "15" : "Brg Degs" + presentPosData.wptBearingDegs,  //degrees relative to current heading 
						   "16" : "VMG " + dampedValues.wptVMG ,//wptVMG
						   "17" : "Brg(M) "+ Math.round(dampedValues.wptBrgTrue -LOCAL_MAG_VAR), 
						   "18" : nextLegText, //Next Leg Desc
						   "19" : presentPosData.nextLegName, //next leg name
						   "20": "Hdg(M)" + Math.round(presentPosData.nextLegHDG), //next leg heading
						   "21" : "TWA "+ nextLegTWA, 
						   "22" : "TWS " +  dampedValues.TWS, 
						   "23" : "AWA "+ nextLegAWADisp,
						   "24" : "AWS " +nextLegAWSDisp,
						   "25" : "Temp " + Number(presentPosData.wTemp), //water temp
						   "26" : "Depth(m) " + presentPosData.depthM , //depth metres
						   "27" : "ETI " + wptETI, //formatted eti
						   "28" : "ETA " + formattedWptETA, 
						   "29" : "Lay-line" , //Heading
						   "30" : "   Time "+ layLineTime,
						   "31" : "   Dist " + layLineDist,
						   "32" : "Hdg(M) " +compassDisp,
						   "33" : "Current", //heading
						   "34" : " Speed "+ currentSpeed,
						   "35" : " Dir " + currentAngleDegsMag,
						   "36" : " Effect "+ effect,
						   // #37 used for current course
						   
						   
						  }, function(e) { //Success callback
		lastPolledTimeStamp = Date.now();	//managing the polling process
		pollComplete = true;
  			},
  		function(e) { //Fail callback
   			//Pebble.showSimpleNotificationOnPebble("Nack Message",  e.error.message);
  		}
	);	
	
	for (var prevValuesIdx in prevValues) {// update previous values
		prevValues[prevValuesIdx] = dampedValues[prevValuesIdx];
	}
//Pebble.showSimpleNotificationOnPebble("JS ERROR",  "LINE 439");

} //dispData(JSONcombinedData)

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
var courses; // the BIG clubs/series/...object
/*
* reads the course with pebbleGetCourses and
* sends it as text as appMessage #37
*/
function read_course(){
	print_division();
	get_all_courses();
	
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
function get_all_courses(){
	/*
	* get the whole courses object for this club
	*/
	var url = WEB_HOST + "pebbleGetCourses.php?get_all_courses"; 
	var get_current_courseRequest = new XMLHttpRequest(); 
	get_current_courseRequest.open("GET", url, true);	
	get_current_courseRequest.send(null);
	get_current_courseRequest.onreadystatechange = function () {
		  if (get_current_courseRequest.readyState == 4 ){
			   	if(get_current_courseRequest.status == 200){ // or 404 not found	
					//Pebble.showSimpleNotificationOnPebble("get_all_courses", readCoursesRequest.responseText);
					courses = JSON.parse(get_current_courseRequest.responseText); 
					var currentSeries = courses.clubs[settings.clubIdx].series;
					var mSeriesList = "";
					for (var seriesIdx in currentSeries){
						mSeriesList += currentSeries[seriesIdx].name + "|";
					}	
					seriesIdx = Number(seriesIdx)+1;
					testHttpFlags(3);
					upload_all_courses(mSeriesList,seriesIdx );
					get_current_course();
				}
				else
					Pebble.showSimpleNotificationOnPebble("HTTP Fail(3)", "Check that your web server is running");
		 	}
		};
}
function upload_all_courses(mSeriesList,seriesIdx ){
						Pebble.sendAppMessage({ 
						"40": mSeriesList, //SERIESLIST
						"41": seriesIdx, //SERIESCOUNT force to numeric
						  }, function(e) { //Success callback
							  testHttpFlags(6);
							  //Pebble.showSimpleNotificationOnPebble("get_current_course",get_current_courseRequest.responseText); 							 
  						},
						function(e) { //Fail callback
							//Pebble.showSimpleNotificationOnPebble("Upload (6)failed, retrying: ","get_all_courses"); 
							setTimeout(function(){upload_all_courses(mSeriesList,seriesIdx);},1000);
						}
					);
}
	/*
	* get current course json object: this contains the current course's Series and Course number, mark locations, dist and headings
	* but only send  the  Series and Course number and wind
	*/	
var currentCourse;
function get_current_course(){
	var url = WEB_HOST + "pebbleGetCourses.php?get_current_course"; 
	var get_all_coursesRequest = new XMLHttpRequest(); 
	get_all_coursesRequest.open("GET", url, true);	
	get_all_coursesRequest.send(null);
	get_all_coursesRequest.onreadystatechange = function () {
		  if (get_all_coursesRequest.readyState == 4 ){
			   	if(get_all_coursesRequest.status == 200){ // or 404 not found	
					 currentCourse = JSON.parse(get_all_coursesRequest.responseText);
					//Pebble.showSimpleNotificationOnPebble("CurrentCourse", currentCourse.series);
					upload_current_course();
				}
			  else
				  Pebble.showSimpleNotificationOnPebble("HTTP Fail(4)", "Check that your web server is running"); 
				  setTimeout(function(){get_current_course();},1000);
		 }
	};									  
										  
}
function upload_current_course(){
	Pebble.sendAppMessage({ 
						"38": currentCourse.series, //SERIESNAME
						"39": currentCourse.course +" " + currentCourse.wind +" "+ currentCourse.name ,
						  }, function(e) { //Success callback	
							  testHttpFlags(7);
							  //Pebble.showSimpleNotificationOnPebble("get_current_course",get_current_courseRequest.responseText); 
  						},
						function(e) { //Fail callback
							//Pebble.showSimpleNotificationOnPebble("Upload (7) failed, retrying:","get_current_course"); 						
							setTimeout(function(){upload_current_course();},1000);
						}
					);
					populateDivsFromSeries(); //populate div/course list
					 testHttpFlags(4);
}
/* extract the division/courses for the current series
from the courses object  
*/
function populateDivsFromSeries() { //modelled on getSeriesFromSelect
	
	var thisSeriesObj = courses.clubs[settings.clubIdx].series[currentCourse.seriesIdx].courses; //
	var courseDivsList = "";
	var courseDivCount = 0;
	for (var courseIdx in thisSeriesObj){
		var thisCourse = thisSeriesObj[courseIdx];
		for (var divisionIdx in thisCourse.divisions){
			courseDivCount ++;
			var selectedDivision = thisCourse.divisions[divisionIdx];
			courseDivsList += thisCourse.number+" "+ selectedDivision.name + " "+ thisCourse.wind +"|"+
				courseIdx +"|"+ divisionIdx +":";  // | delimited within : delimited		
		}
	}
	uploadDivs(courseDivCount,courseDivsList );
}
function uploadDivs(courseDivCount,courseDivsList ){
	// Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
	Pebble.sendAppMessage({ 
		"42": courseDivCount, //	COURSEDIVSCOUNT, // 42 number of course divisions in this series
		"43": courseDivsList ,// COURSEDIVS, //43 the | and : separated list of divs
		 }, function(e) { //Success callback
				 testHttpFlags(8);
				  //Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
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
function testHttpFlags(flag){
	var mask=Math.pow(2,(flag-1));
	httpFlags = httpFlags | mask;
	if (httpFlags==511){
		httpFlags=0; //ready for the configuration
		var settingsText  = "Club: ";
		if (settings.clubIdx === undefined)
			settings.clubIdx=0;
		settingsText +=  courses.clubs[settings.clubIdx].name;			
		settingsText  += "\nSeries: ";
		if (settings.seriesIdx === undefined)
			settings.seriesIdx = 0;
		settingsText +=  courses.clubs[settings.clubIdx].series[settings.seriesIdx].name;			
		settingsText  += "\nDivision: ";
		if (settings.divIdx === undefined)
			settings.divIdx = 0;
		if (settings.divIdx !== 0)
			settingsText += courses.clubs[settings.clubIdx]
				.series[settings.seriesIdx]
				.courses[0].divisions[settings.divIdx].name;					
		settingsText  += "\nMag Var'n: ";
		if (settings.magVar === undefined)
			settings.magVar=0;
		settingsText +=  settings.magVar;			
		LOCAL_MAG_VAR = settings.magVar;
		//console.log('testHttpFlags' + flag);
		//Pebble.showSimpleNotificationOnPebble("Data loaded:",settingsText); 
		flagDataLoaded();

	}
	//else 
		//Pebble.showSimpleNotificationOnPebble("Server progress:","Flag: "+flag + "flags: "+httpFlags); 
}
function flagDataLoaded( ){
	// Pebble.showSimpleNotificationOnPebble("courseDivsList",courseDivsList); 
	Pebble.sendAppMessage({ 
		"44": "0", //	COURSEDIVSCOUNT, // 42 number of course divisions in this series
		 }, function(e) { //Success callback
				 //testHttpFlags(8);
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
 