#include <pebble.h>
#include "dashboard.h"
#define SPEEDHDGCOUNT 11

static Window *s_window;
static ScrollLayer *scroll_layer;

static int dispList[ SPEEDHDGCOUNT] = {
	GPSTIME,
	SOG,
	COG,
	PERFACTUALBTV,
	COMPASS,
	CURRENTHDG ,
	CURRENTSPEED ,
	CURRENTDIR ,
	CURRENTEFFECT  ,
	DEPTH,
	TEMP};

void set_nav_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], displayFont1);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}
static void window_load(Window *window) {
	rowIndex=0;
	rowSpace = 32;
	text_layer_set_text(page_heading, "-- SPEED & HDG --");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
					
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	for (int i = 0; i <SPEEDHDGCOUNT; i++){
		set_nav_text_layer(dispList[i]);
	}
  layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
}
static void handle_nav_window_unload(Window* window) {
	for (int i =0; i <SPEEDHDGCOUNT; i++){
		text_layer_destroy(displayFields[dispList[i]]);
		displayFields[dispList[i]] = NULL;
	}
	//text_layer_destroy(page_heading);
	scroll_layer_destroy(scroll_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(){
	send_to_phone(TupletCString(100, "navigation"));
	text_layer_set_text(displayFields[dispList[1]], refreshingMsg);
}
void show_navigation(void) {
  	s_window = window_create();
  	//window_set_fullscreen(s_window, true);	
  window_set_window_handlers(s_window, (WindowHandlers) {
	  .load = window_load,
    .unload = handle_nav_window_unload,
	  .appear = window_appear,
  });
  window_stack_push(s_window, true);
}
