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
	numberOfDisplays, //count of the number of displays
};
TextLayer * displayFields[100];
GFont s_res_gothic_28;
int rowIndex;
int rowSpace;
