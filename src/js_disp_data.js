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

function dispData(JSONcombinedData){
		
	//Pebble.showSimpleNotificationOnPebble("dispData received", JSONcombinedData);
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
	var msgObj = {};
	if (watchPhase == "start"){	// display start-line details and solution
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
	// always tack these on for the Navigation Menu
	msgObj[ "0"] = formattedReportTime; //GPS Time
	msgObj["12"] =  presentPosData.legIdx+": "+ presentPosData.WptName; //WptName
	msgObj["19"] =  presentPosData.nextLegName; //next leg name NEXTLEGNAME

	Pebble.sendAppMessage(msgObj, function(e) { //Success callback
			lastPolledTimeStamp = Date.now();	//managing the polling process
			 //onsole.log("NavDatSend OK");
			pollComplete = true;
  			},
  		function(e) { //Fail callback
  		}
	);		
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