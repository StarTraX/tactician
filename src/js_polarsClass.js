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
	