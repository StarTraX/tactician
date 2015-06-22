#include <pebble.h>
#include "navigation_menu.h"
#include "navigation.h"
#include "nav_next_mark.h"
#include "nav_next_leg.h"
#include "nav_current_course.h"
#include "dashboard.h" 
	
static int num_a_items =0;
static Window *mWindow;
static	SimpleMenuSection menu_sections[1];
SimpleMenuLayer *nav_menu_layer;
SimpleMenuItem nav_menu_items[4];
static void nav_menu_window_load(Window *mWindow);
void nav_menu_window_appear();
void nav_menu_window_unload();
static void nav_menu_select_callback(int index, void *ctx);	

 void show_nav_menu(){
	APP_LOG(APP_LOG_LEVEL_DEBUG, "In show_nav_menu free: %d", heap_bytes_free());	 
 mWindow = window_create();
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = nav_menu_window_load,
    .unload = nav_menu_window_unload,
	.appear = nav_menu_window_appear,
  });
		 window_stack_push(mWindow, true /* Animated */);
}
static void nav_menu_window_load(Window *mWindow) {
  	num_a_items = 0;
	nav_menu_items[num_a_items++] = (SimpleMenuItem){
      .title = "Next Mark",
   	.callback = nav_menu_select_callback,
  };
  nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Next Leg",
	// .subtitle = mAns[NEXTLEGNAME],
     .callback = nav_menu_select_callback,
  };
  nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Speed, heading etc. ",
    .subtitle = "Current, water temp, depth ",
    .callback = nav_menu_select_callback,
  };
 nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Course details ",
	 .subtitle = "Club, series,course. ",
    .callback = nav_menu_select_callback,
  };
 
 menu_sections[0] = (SimpleMenuSection){
	  .title = "Course Tracking Menu",
    .num_items = 4,
    .items = nav_menu_items,
  };
   Layer *window_layer = window_get_root_layer(mWindow);
  GRect bounds = layer_get_frame(window_layer); 
	nav_menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, NULL);
   layer_add_child(window_layer, simple_menu_layer_get_layer(nav_menu_layer));
}
void nav_menu_window_appear(){
 	num_a_items = 0;
 	nav_menu_items[num_a_items++].subtitle = wptName;
 	nav_menu_items[num_a_items++].subtitle = nextLegName; 
}
void nav_menu_window_unload(Window *mWindow) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(mWindow);
  	simple_menu_layer_destroy(nav_menu_layer);
	APP_LOG(APP_LOG_LEVEL_DEBUG, "exiting show_nav_menu. Free: %d", heap_bytes_free());	 

}
static void nav_menu_select_callback(int index, void *ctx) {	
	switch (index){
	case 0:
		//APP_LOG(APP_LOG_LEVEL_INFO, "Next Mark");
		show_nav_next_mark();	
		break;
	case 1:
		show_nav_next_leg();
		break;
	case 2 :
		show_navigation(); //speed & heading
		break;
	case 3:
		show_nav_course(); //current course
	}
}

