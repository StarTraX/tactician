#include <pebble.h>
#include "nav_current_course.h"
#include "dashboard.h"
#include "nav_course_div_menu.h"
static Window *s_window;
	TextLayer * text_layer;
	ScrollLayer *scroll_layer;

void current_course_config_provider() {
	static char msg[125] ;
	//snprintf(msg, 125, "ROLE received: %s, Admin user: %s", role, adminRole);
	snprintf(msg, 125, "ROLE received: %d", intRole);
	APP_LOG(APP_LOG_LEVEL_INFO,msg);
	if (intRole==0)
	   window_single_click_subscribe(BUTTON_ID_SELECT, show_nav_divs_menu);
}
static void initialise_nav_course_ui(void) {
  	s_window = window_create();	rowIndex=0;
	rowSpace = 32;
 	//window_set_fullscreen(s_window, true);	
	text_layer_set_text(page_heading, "--- COURSE  ---");
	layer_add_child(window_get_root_layer(s_window), text_layer_get_layer(page_heading));
	GRect bounds = GRect(0,24,144, 168); //full height // y was row_space
 	scroll_layer = scroll_layer_create(bounds);  // bounds is shorter than max_text_bounds, so causes scrolling
  	scroll_layer_set_click_config_onto_window(scroll_layer, s_window);	
	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider = &current_course_config_provider	
	});
	GRect max_text_bounds = GRect(0, 0,bounds.size.h, 2000); //
	text_layer = text_layer_create(max_text_bounds); //GPS Time
}
static void window_appear(Window* window) {
	GRect bounds = GRect(0,rowSpace,144, 168); //full height
	text_layer_set_text(text_layer,currentCourseText); //currentCourseText is created in dashboard.c 
  	text_layer_set_font( text_layer, displayFont1);
	GSize max_size = text_layer_get_content_size(text_layer);
 	text_layer_set_size(text_layer, max_size);
	scroll_layer_set_content_size(scroll_layer,  GSize(bounds.size.w, max_size.h )); // size of the surface that scrolls???
  	scroll_layer_add_child(scroll_layer, (Layer *)text_layer);
 	layer_add_child(window_get_root_layer(s_window), scroll_layer_get_layer(scroll_layer));
}
static void window_unload(Window* window) {
  	window_stack_remove(s_window, true);
	text_layer_destroy(text_layer);
	scroll_layer_destroy(scroll_layer);
  	window_destroy(s_window);
}

void show_nav_course(void) {
  initialise_nav_course_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
	  .unload = window_unload,
	  .appear = window_appear,
  });
  window_stack_push(s_window, true);
}







