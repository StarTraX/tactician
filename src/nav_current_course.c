#include <pebble.h>
#include "nav_current_course.h"
#include "dashboard.h"
#include "nav_course_div_menu.h"

static Window *s_window;
	TextLayer * text_layer;
	ScrollLayer *scroll_layer;
	TextLayer * page_heading;

void current_course_config_provider() {
   window_single_click_subscribe(BUTTON_ID_SELECT, show_nav_divs_menu);
}
static void initialise_nav_course_ui(void) {
  	s_window = window_create();	rowIndex=0;
	rowSpace = 32;
 	window_set_fullscreen(s_window, true);	
	

	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
	text_layer_set_text(page_heading, "--NAV-COURSE--");
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
	layer_add_child(window_get_root_layer(s_window), text_layer_get_layer(page_heading));
	
	int vert_scroll_text_padding = 4;
	GRect bounds = GRect(0,rowSpace,144, 168); //full height
	//GRect bounds = layer_get_frame(window_get_root_layer(s_window));
	GRect max_text_bounds = GRect(0, 0,bounds.size.h, 2000); //
  	scroll_layer = scroll_layer_create(bounds);  // bounds is shorter than max_text_bounds, so causes scrolling
  	scroll_layer_set_click_config_onto_window(scroll_layer, s_window);
	
	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider = &current_course_config_provider	
	});
	
	text_layer = text_layer_create(max_text_bounds); //GPS Time
	text_layer_set_text(text_layer,currentCourseText); //currentCourseText is created in dashboard.c 
  	text_layer_set_font( text_layer, s_res_gothic_28);
	GSize max_size = text_layer_get_content_size(text_layer);
 	text_layer_set_size(text_layer, max_size);
	scroll_layer_set_content_size(scroll_layer,  GSize(bounds.size.w, max_size.h + vert_scroll_text_padding)); // size of the surface that scrolls???
  	scroll_layer_add_child(scroll_layer, (Layer *)text_layer);

 	layer_add_child(window_get_root_layer(s_window), scroll_layer_get_layer(scroll_layer));
}
static void handle_nav_window_appear(Window* window) {
	//APP_LOG(APP_LOG_LEVEL_DEBUG, "nav course appear");
}
static void handle_nav_window_unload(Window* window) {
  	window_stack_remove(s_window, true);
	text_layer_destroy(text_layer);
		text_layer_destroy(page_heading);
	scroll_layer_destroy(scroll_layer);
  	window_destroy(s_window);
}

void show_nav_course(void) {
  initialise_nav_course_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
	  .unload = handle_nav_window_unload,
	  .appear = handle_nav_window_appear
  });
  window_stack_push(s_window, true);
}







