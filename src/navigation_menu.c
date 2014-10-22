#include <pebble.h>
#include "navigation_menu.h"
#include "navigation.h"
#include "nav_next_mark.h"
#include "nav_next_leg.h"
#include "nav_current_course.h"
	

static Window *nav_menu_window;

// This is a simple menu layer
static SimpleMenuLayer *nav_menu_layer;

// A simple menu layer can have multiple sections
static SimpleMenuSection menu_sections[1];

// Each section is composed of a number of menu items
static SimpleMenuItem nav_menu_items[4];

// You can capture when the user selects a menu icon with a menu item select callback
static void nav_menu_select_callback(int index, void *ctx) {	
	if(index==0)
		show_nav_next_mark();
	if(index==1)
		show_nav_next_leg();
	if(index==2)
		show_navigation(); //speed & heading
	if(index==3)
		show_nav_course(); //current course
		
  layer_mark_dirty(simple_menu_layer_get_layer(nav_menu_layer));
}

// This initializes the menu upon window load
static void nav_menu_window_load(Window *nav_menu_window) {
  int num_a_items = 0;

  // This is an example of how you'd set a simple menu item
 nav_menu_items[num_a_items++] = (SimpleMenuItem){
      .title = "Next Mark",
    .callback = nav_menu_select_callback,
  };
  // The menu items appear in the order saved in the menu items array
  nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Next Leg",
    .subtitle = " ",
    .callback = nav_menu_select_callback,
  };
  nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Speed & Heading ",
    .subtitle = " ",
    .callback = nav_menu_select_callback,
  };
 nav_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Current Course ",
    .subtitle = " ",
    .callback = nav_menu_select_callback,
  };
 

  // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Navigation Menu",
    .num_items = 4,
    .items = nav_menu_items,
  };
   Layer *window_layer = window_get_root_layer(nav_menu_window);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  
	nav_menu_layer = simple_menu_layer_create(bounds, nav_menu_window, menu_sections, 1, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(nav_menu_layer));
}

void nav_menu_window_unload(Window *main_menu_window) {// Deinitialize resources on window unload that were initialized on window load
  simple_menu_layer_destroy(nav_menu_layer);
}

 void show_nav_menu(){
 nav_menu_window = window_create();

  // Setup the window handlers
  window_set_window_handlers(nav_menu_window, (WindowHandlers) {
    .load = nav_menu_window_load,
    .unload = nav_menu_window_unload,
  });
		 window_stack_push(nav_menu_window, true /* Animated */);
}


