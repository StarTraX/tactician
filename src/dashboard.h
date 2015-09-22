#pragma once
#include "pebble.h"
#define DISP_WIDTH 20 //width of each display
void dashboard_init();
enum  { //incoming message  keys
	GPSTIME, //gpsTime (0)
	PERFACTUALBTV, //perfActualBtv, (1)
	PERFACTUALTWA, //perfActualTWA, (2)
	TWS,
	TWD,
	PERFTGTBTV,
	PERFTGTTWA,
	PERFTGTVMG,
	PERFACTUALVMG, //8
	PERFPCDISP,
	SOG, //NAVIGATION
	COG, //COG(M)
	WPTNAME, //12
	WPTDISPDIST, //13
	BRGCLOCK, //14 Brg Clock
	BRGDEGS, //15 Brg Degs
	WPTVMG, //16 VMG to next mark
	WPTBRGMAG, // 17 WPT Mag bearing
	NEXTLEGDESC, //18 Kite Reach Port
	NEXTLEGNAME, //19 Next leg mark name
	NEXTLEGHDG, //20
	NEXTLEGTWA, //21
	NEXTLEGTWSE, //22
	NEXTLEGAWA, //23
	NEXTLEGAWS, //24	
	TEMP, //25
	DEPTH, //26
	WPTETI, //27
	WPTETA, //28
	LAYLINEHDG, //29
	LAYLINETIME, //30
	LAYLINEDIST, //31
	COMPASS, //32
	CURRENTHDG, //33
	CURRENTSPEED, //34
	CURRENTDIR, //35
	CURRENTEFFECT, //36
	COURSE, //37 formatted text of the marks of the course
	SERIESNAME, //38 name of the race series
	COURSENAME, //39 name of the course
	SERIESLIST, //40 delimited list of series names 
	SERIESCOUNT, //41 count of number of series in this club
	COURSEDIVSCOUNT, // 42 number of course divisions in this series
	COURSEDIVS, //43 the | and : separated list of divs
	FLAGDATALOADED, //44 when data loaded, start the watchapp
	LINELENGTH, //45 start line length
	LINEBIAS, //46 Start line bias (degs)
	PREFEND, //"47" : "Pref " + prefEnd, //PREFEND
	PREFDIST,  //"48" : "Pref " + prefDist, //PREFDIST
	LINETIME, // "49" : "Time " + Math.round(pin.r/reachSpeedKts/knotsToMps), // LINETIME
	LINESPEED, //"50" : "At "	+ Math.round(reachSpeedKts*10)/10, // LINESPEED			
	VTIMER , //51 START SOLUTION time report
	SOLUTIONSTATUS, //52 description
	SOLUTIONTIME, //53 SOLUTIONTIME time to line  or time to tack
	SOLUTIONPOS, //54 "Line dist: " +lineDist
	ALERTTIMER, //55 no message received since...
	ROLE, //56 user's role: "admin" or "crew"
	WINDDIR, //57 wind direction image
	WINDDIRRECENT, //58 // recent wind dir image
	WINDDIRMEAN, //59 // wind dir mean numberOfDisplays
	WINDDIREVEN, // 60 recent TWD 10-min history odd bytes (0,2,4..
	WINDIRODD, // 61 recent TWD 10-min history even bytes (1,3,5
	FINISHTIMEMSG, //62 Ping finish line message: time lat/lon
	WINDSETTWD, //63 - TWDS for manual wind set menu
	WINDSETTWS, //64 - TWS for manual wind set menu
	HASBOATINTERFACE, //65 set if we receive $II msgs
	numberOfDisplays, //count of the number of displays	
} ;
char * courseName, * seriesName;
int intRole;  // 0: admin, not 0: crew
char * wptName, * nextLegName;
char * adminRole; // = "admin";
TextLayer * displayFields[numberOfDisplays];
char * currentCourseText;
char * courseDivsByteArray;
int courseDivsSize; // size of 
char * seriesList;
char * splashScreenMessage,  * refreshingMsg;
GFont displayFont1, dispHdgFont1;
TextLayer * page_heading;
int rowIndex;
int rowSpace;
int seriesCount; //count of number of series in Club
int courseDivsCount ; //count of course divs in this series
void send_to_phone();
time_t msgReceivedTimestamp;
char * windImageData;
int windImageDataSize;
Layer *s_canvas_layer; // wind window
// wind_recent history  
char * twdWindDirImageRecentBitArray;
int imageDataSize;
int * start;
int * histDataSize;
void setCurrentWindow( char *);
char * oddImageData;
char * evenImageData;
SimpleMenuLayer *nav_menu_layer;
int  *windSetTwd;
int  *windSetTws;
bool hasBoatInterface;


