#include "performance.h"
#include <pebble.h>
#include "dashboard.h"

static Window *performance_window;

// This is a scroll layer
 static ScrollLayer *scroll_layer;


void set_perf_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], s_res_gothic_28);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}

static void initialise_ui(void) {
  	performance_window = window_create();
	rowIndex=0;
	rowSpace = 32;
  	window_set_fullscreen(performance_window, true);	
	TextLayer * page_heading;
	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
	text_layer_set_text(page_heading, "--PERFORMANCE--");
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
	layer_add_child(window_get_root_layer(performance_window), text_layer_get_layer(page_heading));
					
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, performance_window);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	set_perf_text_layer(GPSTIME);
	set_perf_text_layer(PERFPCDISP);
	set_perf_text_layer(PERFACTUALBTV);
	set_perf_text_layer(PERFTGTBTV);
	set_perf_text_layer(PERFACTUALTWA);
	set_perf_text_layer(PERFTGTTWA);
	set_perf_text_layer(PERFACTUALVMG);
	set_perf_text_layer(PERFTGTVMG);
	set_perf_text_layer(TWS);
	set_perf_text_layer(TWD);

  layer_add_child(window_get_root_layer(performance_window), scroll_layer_get_layer(scroll_layer));
}


static void handle_window_unload(Window* window) {
  	window_stack_remove(performance_window, true);
  	window_destroy(performance_window);
}

void show_performance(void) {
  initialise_ui();
  window_set_window_handlers(performance_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(performance_window, true);
}
