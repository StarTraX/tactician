#include <pebble.h>
#include "nav_current_course.h"
#include "dashboard.h"
#include "nav_course_div_menu.h"
static Window *window;	
static	ScrollLayer *scroll_layer;

void window_unload(Window* window) {
  	window_stack_remove(window, true);
	text_layer_destroy(displayFields[COURSE]);
	displayFields[COURSE] = NULL;
	scroll_layer_destroy(scroll_layer);
  	window_destroy(window);
}
void closeAndNextMenu(){ // to save stack space
	window_stack_pop(false);
	show_nav_divs_menu();
}
void config_provider() {
	if (intRole==0){
	   window_single_click_subscribe(BUTTON_ID_SELECT, closeAndNextMenu);
	}
}
static void window_appear(Window* window) {
	setCurrentWindow("current_course");
}
void window_load(){
	rowSpace = 32;
 	//window_set_fullscreen(window, true);	
	text_layer_set_text(page_heading, "--- COURSE  ---");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
	GRect bounds = GRect(0,24,144, 168); //full height // y was row_space
 	scroll_layer = scroll_layer_create(bounds);  // bounds is shorter than max_text_bounds, so causes scrolling
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);	
	scroll_layer_set_content_size(scroll_layer,  GSize(144, 1000 )); // size of the surface that scrolls???
 	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider = &config_provider,});

	GRect max_text_bounds = GRect(0, 0,bounds.size.w, 1000); //
	displayFields[COURSE] = text_layer_create(max_text_bounds); 

	text_layer_set_text(displayFields[COURSE],currentCourseText); //currentCourseText is created in dashboard.c 
  	text_layer_set_font( displayFields[COURSE], displayFont1);

 	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[COURSE]);
 	layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
}



void show_nav_course(void) {
   	window = window_create();	rowIndex=0;
  	window_set_window_handlers(window, (WindowHandlers) {
		.load  = window_load,
	  	.unload = window_unload,
	  	.appear = window_appear,
  });
  window_stack_push(window, true);
}
 







