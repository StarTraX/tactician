#include <pebble.h>
#include "alert.h"
#include "dashboard.h"
Window *alertWindow;
static void window_load(Window * window)  {
	text_layer_set_text(page_heading, " ALERT... NO DATA  ");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
	displayFields[ALERTTIMER] = text_layer_create(GRect(0, 50,144, 40)); //GPS Time
  	text_layer_set_font( displayFields[ALERTTIMER], displayFont1);
	text_layer_set_text(displayFields[ALERTTIMER], " STARTING  ");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(displayFields[ALERTTIMER]));
}
static void window_unload(Window* window) {
	text_layer_destroy(displayFields[ALERTTIMER]);
  	window_stack_remove(alertWindow, true);
  	window_destroy(alertWindow);
}
void show_alert(void) {
	APP_LOG(APP_LOG_LEVEL_DEBUG," show_alert called");
	vibes_long_pulse();
	alertWindow = window_create();
  	window_set_fullscreen(alertWindow, true);	
  	window_set_window_handlers(alertWindow, (WindowHandlers) {
		.load = window_load, 
    	.unload = window_unload,
  });
  window_stack_push(alertWindow, true);
}
