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
static void nav_menu_select_callback(int index, void *ctx) {	
	if(index==0){
		APP_LOG(APP_LOG_LEVEL_INFO, "Next Mark");
		show_nav_next_mark();		
	}
	if(index==1)
		show_nav_next_leg();
	if(index==2)
		show_navigation(); //speed & heading
	if(index==3)
		show_nav_course(); //current course
		
  //layer_mark_dirty(simple_menu_layer_get_layer(nav_menu_layer));
}

// This initializes the menu upon window load
static void nav_menu_window_load(Window *mWindow) {
  num_a_items = 0;

  // This is an example of how you'd set a simple menu item
 nav_menu_items[num_a_items++] = (SimpleMenuItem){
      .title = "Next Mark",
	// .subtitle = mAns[WPTNAME],
    .callback = nav_menu_select_callback,
  };
  // The menu items appear in the order saved in the menu items array
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
 

  // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Navigation Menu",
    .num_items = 4,
    .items = nav_menu_items,
  };
   Layer *window_layer = window_get_root_layer(mWindow);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  
	nav_menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, NULL);

  // Add it to the window for display
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
}

 void show_nav_menu(){
 mWindow = window_create();

  // Setup the window handlers
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = nav_menu_window_load,
    .unload = nav_menu_window_unload,
	.appear = nav_menu_window_appear,
  });
		 window_stack_push(mWindow, true /* Animated */);
}


