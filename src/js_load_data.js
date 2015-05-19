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
			(thisCourse.divisions[0].hasDistMarks === undefined?"-1":thisCourse.divisions[0].hasDistMarks)+ ":"; // 0 or 1 used for 44 course with 04 mark st 4 Nm from  BJ
		//courseIdx+":";  // | delimited within : delimited		
	}
	//console.log('courseDivsList: '+ courseDivsList);
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
		"44": "0", //	COURSEDIVSCOUNT, // 42 number of course divisions in this series
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
	if (commsTimerTimeStamp - lastPolledTimeStamp > 3000 || pollComplete === true){
			lastPolledTimeStamp = commsTimerTimeStamp;
			readNavData();
		}	
	setTimeout(function(){commsTimer();},1000); 
}

var prevNavData = " ";
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
			   			//console.log(mData);
					//	if (mData !=prevNavData){ //Only send changed data - enables watch to monitor data receipt
							prevNavData = mData;
							dispData(mData);   	
					//	}						
			   	} // if status == 200
		   } // if readyState == 4		
	}; //onreadystatechange 
}

