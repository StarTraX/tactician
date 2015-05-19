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
			console.log("|"+ msgObj[51]+"|"+msgObj[52] +"|"+ msgObj[53]+"|"+msgObj[54]);

	}
	return msgObj;
} //calcSolution