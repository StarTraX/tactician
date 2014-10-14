#pragma once
#define DISP_WIDTH 20 //width of each display
void dashboard_init();
enum  { //to manage the display fields
	GPSTIME, //gpsTime (0)
	PERFACTUALBTV, //perfActualBtv, (1)
	PERFACTUALTWA, //perfActualTWA, (2)
	TWS,
	TWD,
	numberOfDisplays, //count of the number of displays
};
TextLayer * displayFields[100];