#include <pebble.h>
#include "finish_time.h"
#include "dashboard.h"

static Window *window;

static void window_load(Window *window) {
	displayFields[FINISHTIMEMSG] = text_layer_create(GRect(0, 0, 144, 168)); //FINISHTIMEMSG
  	text_layer_set_font( displayFields[FINISHTIMEMSG], displayFont1);
 	layer_add_child(window_get_root_layer(window), text_layer_get_layer( displayFields[FINISHTIMEMSG]));	

}
static void window_unload(Window* window) {
	setCurrentWindow("none");

	text_layer_destroy(displayFields[FINISHTIMEMSG]);
	displayFields[FINISHTIMEMSG] = NULL;

 	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(){
	text_layer_set_text(displayFields[FINISHTIMEMSG], refreshingMsg);
	setCurrentWindow("none"); // Logger will send finish time immediately, once
}
void show_finish_time(void) {
 	window = window_create();
 
  window_set_window_handlers(window, (WindowHandlers) {
	.load = window_load,
    .unload = window_unload,
	.appear = window_appear,
  });
  window_stack_push(window, true);

}



