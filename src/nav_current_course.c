#include <pebble.h>
#include "nav_current_course.h"
#include "dashboard.h"

static Window *s_window;
static TextLayer * text_layer;
static ScrollLayer *scroll_layer;
//static char scroll_text[] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam quam tellus, fermentu  m quis vulputate quis, vestibulum interdum sapien. Vestibulum lobortis pellentesque pretium. Quisque ultricies purus e  u orci convallis lacinia. Cras a urna mi. Donec convallis ante id dui dapibus nec ullamcorper erat egestas. Aenean a m  auris a sapien commodo lacinia. Sed posuere mi vel risus congue ornare. Curabitur leo nisi, euismod ut pellentesque se  d, suscipit sit amet lorem. Aliquam eget sem vitae sem aliquam ornare. In sem sapien, imperdiet eget pharetra a, lacin  ia ac justo. Suspendisse at ante nec felis facilisis eleifend.";

static void initialise_nav_course_ui(void) {
  	s_window = window_create();	rowIndex=0;
	rowSpace = 32;
 	window_set_fullscreen(s_window, true);	
	
	TextLayer * page_heading;
	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
	text_layer_set_text(page_heading, "--NAV-COURSE--");
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
	layer_add_child(window_get_root_layer(s_window), text_layer_get_layer(page_heading));

	
	static const int vert_scroll_text_padding = 4;
	GRect bounds = GRect(0,rowSpace,144, 168);

	GRect max_text_bounds = GRect(0, 0,bounds.size.h, 2000); //
  	scroll_layer = scroll_layer_create(bounds);  // bounds is shorter than max_text_bounds, so causes scrolling
  	scroll_layer_set_click_config_onto_window(scroll_layer, s_window);
	text_layer = text_layer_create(max_text_bounds); //GPS Time
	text_layer_set_text(text_layer,currentCourseText);
  	text_layer_set_font( text_layer, s_res_gothic_28);
	GSize max_size = text_layer_get_content_size(text_layer);
 	text_layer_set_size(text_layer, max_size);
	scroll_layer_set_content_size(scroll_layer,  GSize(bounds.size.w, max_size.h + vert_scroll_text_padding)); // size of the surface that scrolls???
  	scroll_layer_add_child(scroll_layer, (Layer *)text_layer);

 	layer_add_child(window_get_root_layer(s_window), scroll_layer_get_layer(scroll_layer));
}
static void handle_nav_window_unload(Window* window) {
  	window_stack_remove(s_window, true);
  	window_destroy(s_window);
}

void show_nav_course(void) {
  initialise_nav_course_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_nav_window_unload,
  });
  window_stack_push(s_window, true);
}







