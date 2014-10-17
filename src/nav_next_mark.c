#include "nav_next_mark.h"
#include <pebble.h>
#include "dashboard.h"

static Window *s_window;

 static ScrollLayer *scroll_layer;

void set_nav_next_mark_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], s_res_gothic_28);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}
static void initialise_nav_next_mark_ui(void) {
	rowIndex=0;
	rowSpace = 32;
  	s_window = window_create();
  	window_set_fullscreen(s_window, true);	
	TextLayer * page_heading;
	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
	text_layer_set_text(page_heading, "--NAV NEXT MARK--");
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
	layer_add_child(window_get_root_layer(s_window), text_layer_get_layer(page_heading));
					
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, s_window);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	set_nav_next_mark_text_layer(GPSTIME);
	set_nav_next_mark_text_layer(WPTNAME);
	set_nav_next_mark_text_layer(WPTDISPDIST);
	set_nav_next_mark_text_layer(BRGCLOCK);
	set_nav_next_mark_text_layer(BRGDEGS);
	set_nav_next_mark_text_layer(WPTVMG);
	set_nav_next_mark_text_layer(WPTBRGMAG);

  layer_add_child(window_get_root_layer(s_window), scroll_layer_get_layer(scroll_layer));
}
static void handle_nav_window_unload(Window* window) {
  	window_stack_remove(s_window, true);
  	window_destroy(s_window);
}

void show_nav_next_mark(void) {
  initialise_nav_next_mark_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_nav_window_unload,
  });
  window_stack_push(s_window, true);
}

