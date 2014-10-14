#include <pebble.h>
#define NUM_DISP 5
#define NUM_WINDOWS 20
extern void handle_tick(struct tm *tick_time, TimeUnits units_changed)  ; // in tactician.c
	struct windowNode{
	  struct windowNode * parentWindow;
	  struct windowNode * firstChildWindow;
	  struct windowNode * prevSiblingWindow;
	  struct windowNode * nextSiblingWindow;
	  Window *mWindow;
	  int id;
		  char name[20];
};
void window_root_init();  //in tactician.c