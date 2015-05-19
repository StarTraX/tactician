#include <pebble.h>
#include "alert.h"
#include "dashboard.h"
Window *alertWindow;
TextLayer * alert_page_heading; // local to alert.c, not the shared one
//TextLayer * alert_message; 
bool alertWindowIsDisplayed;

static void window_load(Window * window)  {
	alertWindowIsDisplayed = true;
	alert_page_heading = text_layer_create(GRect(0, 0,144, 40));
	text_layer_set_font( alert_page_heading, dispHdgFont1);
	text_layer_set_text(alert_page_heading, " ALERT... NO DATA  ");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(alert_page_heading));

	displayFields[ALERTTIMER] = text_layer_create(GRect(0, 30,144, 120));
  	text_layer_set_font( displayFields[ALERTTIMER], displayFont1);
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(displayFields[ALERTTIMER]));		
}
static void window_unload(Window* window) {
	alertWindowIsDisplayed = false;
	text_layer_destroy(displayFields[ALERTTIMER]);
	text_layer_destroy(alert_page_heading);
	//text_layer_destroy(alert_message);
  	window_stack_remove(alertWindow, true);
  	window_destroy(alertWindow);
}
void show_alert(void) {
	//APP_LOG(APP_LOG_LEVEL_DEBUG," show_alert called");
	vibes_long_pulse();
	alertWindow = window_create();

  	//window_set_fullscreen(alertWindow, true);	
  	window_set_window_handlers(alertWindow, (WindowHandlers) {
		.load = window_load, 
    	.unload = window_unload,
  });
  window_stack_push(alertWindow, true);
}
