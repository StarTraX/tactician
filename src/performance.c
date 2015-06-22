#include "performance.h"
#include <pebble.h>
#include "dashboard.h"
#define PERFORMANCECOUNT 10
static Window *window;

 static ScrollLayer *scroll_layer;

static int dispList [PERFORMANCECOUNT] = {
	GPSTIME,
	PERFPCDISP,
	PERFACTUALBTV,
	PERFTGTBTV,
	PERFACTUALTWA,
	PERFTGTTWA,
	PERFACTUALVMG,
	PERFTGTVMG,
	TWS,
	TWD
};
static void window_load(Window* window);
static void window_unload(Window* window);
static void window_appear();
static void set_text_layer( int dispIdx );
char  Msg[100];

void show_performance(void) {
	//APP_LOG(APP_LOG_LEVEL_INFO, "show_performance");
  	window = window_create();
	#ifdef PBL_PLATFORM_APLITE
		window_set_fullscreen(window, true);	
	#endif
	 
 	window_set_window_handlers(window, (WindowHandlers) {
	  	.load = window_load,
    	.unload = window_unload,
		.appear = window_appear,
  });
  window_stack_push(window, true);
}
static void window_load(Window* window) {	
	rowIndex=0;
	rowSpace = 32;
	text_layer_set_text(page_heading, "--PERFORMANCE--");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
			
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	for (int i = 0; i< PERFORMANCECOUNT; i++){
		set_text_layer(dispList[i]);
	}
	//text_layer_set_text(displayFields[dispList[1]],"Refreshing..." );	
  layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
}
static void window_unload(Window* window) {	
	for (int i = 0; i< PERFORMANCECOUNT; i++){
		layer_set_hidden((Layer * ) displayFields[dispList[i]], true);
		text_layer_destroy(displayFields[dispList[i]]);
		displayFields[dispList[i]] = NULL;		
	}
	//layer_set_hidden(window_get_root_layer(performance_window), true);
	//text_layer_destroy(page_heading);	

	scroll_layer_destroy(scroll_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
		//page_heading = NULL;
		scroll_layer = NULL;
		window = NULL;
}
static void window_appear(){
	send_to_phone(TupletCString(100, "performance"));
	text_layer_set_text(displayFields[dispList[1]], refreshingMsg);
}
static void set_text_layer( int dispIdx ){
		displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  		text_layer_set_font( displayFields[dispIdx],displayFont1);

  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}