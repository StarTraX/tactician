#include <pebble.h>
#include "start_solution.h"
#include "start_time_menu.h"
#include "dashboard.h"
#define STARTSOLUTIONCOUNT 4
static Window *window;

 static ScrollLayer *scroll_layer;
static int dispList [STARTSOLUTIONCOUNT] = {
	VTIMER,
	SOLUTIONSTATUS,
	SOLUTIONTIME,
	SOLUTIONPOS
};

char  Msg[100];

static void set_text_layer( int dispIdx ){
		displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, rowSpace)); 
  		text_layer_set_font( displayFields[dispIdx], displayFont1);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}
static void refreshData(Layer *this_layer, GContext *ctx){
	setCurrentWindow("start_solution");
}
static void closeAndNextMenu(){ // to save stack space
	window_stack_pop(false);
	show_start_time_menu();
}
static void config_provider() {
	if (intRole==0){
	   window_single_click_subscribe(BUTTON_ID_SELECT, closeAndNextMenu);
	}
}
static void window_load (Window* window) { 
	rowSpace = 32;
	text_layer_set_text(page_heading, "START TIME & DIST");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
			
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);
	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider = &config_provider,});
	layer_set_update_proc((Layer *) scroll_layer, refreshData);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	rowIndex = 0; // first row for the timer
	for (int i = 0; i< STARTSOLUTIONCOUNT; i++){
		set_text_layer(dispList[i]);
	}
	//text_layer_set_text(displayFields[dispList[1]],"Refreshing..." );	
  layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
}

static void handle_window_unload(Window* window) {	
	setCurrentWindow("none");
	for (int i = 0; i< STARTSOLUTIONCOUNT; i++){
		layer_set_hidden((Layer * ) displayFields[dispList[i]], true);
		text_layer_destroy(displayFields[dispList[i]]);
		displayFields[dispList[i]] = NULL;
			//break;		
	}
	//layer_set_hidden(window_get_root_layer(performance_window), true);
	scroll_layer_destroy(scroll_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(){ 
	text_layer_set_text(displayFields[dispList[0]], refreshingMsg);
	setCurrentWindow("start_solution");
}
void show_start_solution(void) {
   	window = window_create();
	//window_set_fullscreen(window, true);	
  window_set_window_handlers(window, (WindowHandlers) {
	  .load = window_load,
    .unload = handle_window_unload,	 
	  .appear = window_appear,
  });
  window_stack_push(window, true);
}

