#pragma once
#include "pebble.h"
#define DISP_WIDTH 20 //width of each display
void dashboard_init();
enum  { //to manage the display fields
	GPSTIME, //gpsTime (0)
	PERFACTUALBTV, //perfActualBtv, (1)
	PERFACTUALTWA, //perfActualTWA, (2)
	TWS,
	TWD,
	PERFTGTBTV,
	PERFTGTTWA,
	PERFTGTVMG,
	PERFACTUALVMG,
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
	COURSE, //37
filler,

	numberOfDisplays, //count of the number of displays
	
};
TextLayer * displayFields[numberOfDisplays];
char ** mAns;
char * currentCourseText;
GFont s_res_gothic_28;
int rowIndex;
int rowSpace;
