#include <pebble.h>
#include "nav_courses_menu.h"
#include "dashboard.h"
#include "nav_series_menu.h"
#include "nav_course_div_menu.h"
static Window *mWindow;
static SimpleMenuLayer *menu_layer;
static SimpleMenuSection menu_sections[1];
static SimpleMenuItem menu_items[2];

// You can capture when the user selects a menu icon with a menu item select callback
static void nav_menu_select_callback(int index, void *ctx) {	
	if(index==0)
		show_nav_series_menu();
	if(index==1)
		show_nav_divs_menu();
}

// This initializes the menu upon window load
static void nav_courses_menu_window_load(Window *m_window) {
  int num_a_items = 0;

  // This is an example of how you'd set a simple menu item
	menu_items[num_a_items++] = (SimpleMenuItem){
      .title = mAns[SERIESNAME],
    .subtitle = "Select Series ",
    .callback = nav_menu_select_callback,
  };
  // The menu items appear in the order saved in the menu items array
	 menu_items[num_a_items++] = (SimpleMenuItem){
    .title = mAns[COURSENAME],
    .subtitle = "Select Course",
    .callback = nav_menu_select_callback,
  };
   // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Nav Course Menu",
    .num_items =2,
    .items = menu_items,
  };
   Layer *window_layer = window_get_root_layer(mWindow);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  
	menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));
}

void nav_courses_menu_window_unload(Window *mWindow) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(mWindow);
  simple_menu_layer_destroy(menu_layer);
}

 void show_nav_courses_menu(){
 mWindow = window_create();

  // Setup the window handlers
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = nav_courses_menu_window_load,
    .unload = nav_courses_menu_window_unload,
  });
		 window_stack_push(mWindow, true /* Animated */);
}


	

