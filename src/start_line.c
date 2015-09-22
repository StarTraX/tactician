#include <pebble.h>
#include "start_line.h"
#include "dashboard.h"
#include "start_ping_menu.h"
# define STARTLINECOUNT 7
static Window *s_window;
 static ScrollLayer *scroll_layer;
//ActionBarLayer *action_bar;
static int dispList [STARTLINECOUNT] = {
	GPSTIME,
	LINELENGTH,
	LINEBIAS, 
	PREFEND, 
	PREFDIST,  
	LINETIME, 
	LINESPEED	};

char Msg[60];
void set_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time	
  	text_layer_set_font( displayFields[dispIdx], displayFont1);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}
static void refreshData(Layer *this_layer, GContext *ctx){
	setCurrentWindow("start_line");
}
static void closeAndNextMenu(){ // to save stack space
	window_stack_pop(false);
	show_start_ping_menu();
}
static void config_provider() {
	if (intRole==0){
	   window_single_click_subscribe(BUTTON_ID_SELECT, closeAndNextMenu);
	}
}
static void window_load(Window *window) {
	rowIndex=0;
	rowSpace = 32;
	text_layer_set_text(page_heading, "--START LINE--");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
					
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);
	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider = &config_provider,});
	layer_set_update_proc((Layer *) scroll_layer, refreshData);

  	scroll_layer_set_content_size(scroll_layer, GSize(144,500)); // size of the surface that scrolls???
	for (int i =0; i <STARTLINECOUNT; i++){
		set_text_layer(dispList[i]);
	}

	layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
}
static void window_unload(Window* window) {
	setCurrentWindow("none");
	for (int i =0; i <STARTLINECOUNT; i++){
		text_layer_destroy(displayFields[dispList[i]]);
		displayFields[dispList[i]] = NULL;
	}
	scroll_layer_destroy(scroll_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(){
	text_layer_set_text(displayFields[dispList[1]], refreshingMsg);
	setCurrentWindow("start_line");
}
void show_start_line(void) {
  //initialise_nav_next_mark_ui();
	 s_window = window_create();
  	//window_set_fullscreen(s_window, true);	

  window_set_window_handlers(s_window, (WindowHandlers) {
	  .load = window_load,
    .unload = window_unload,
	  .appear = window_appear,
  });
  window_stack_push(s_window, true);
	//snprintf(Msg, 100,  "window_stack_pushheap free: %d ", heap_bytes_free());
 	//APP_LOG(APP_LOG_LEVEL_INFO, Msg);

}



