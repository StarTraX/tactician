#include <pebble.h>
	#include "dashboard.h"
#include "start_menu.h"
#include "start_line.h"
#include "start_ping_menu.h"
#include "start_time_menu.h"
#include "start_solution.h"

	
static int num_a_items =0;
static Window *window;
static	SimpleMenuSection menu_sections[1];
static SimpleMenuLayer *menu_layer;
static SimpleMenuItem menu_items[4];

static void menu_select_callback(int index, void *ctx) {	
	if(index==0)
		show_start_line();	
	else if(index==1)
		show_start_solution();	
	else if(index== 2)
		show_start_ping_menu(); 
	else if(index== 3)
		show_start_time_menu();
}

static void window_load(Window *window) {
  num_a_items = 0;

  // This is an example of how you'd set a simple menu item
  // The menu items appear in the order saved in the menu items array
  menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Start Line",
	.subtitle = "Show the start line details",
     .callback = menu_select_callback,
  };
 menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Time & Distance",
    .subtitle = "Time & Distance",
    .callback = menu_select_callback,
  }; 
	if (intRole==0){ //only available for admin user
		menu_items[num_a_items++] = (SimpleMenuItem){
		  .title = "  PING ",
		 .subtitle = "Ping the line ends",
		.callback = menu_select_callback,
	  };
	 menu_items[num_a_items++] = (SimpleMenuItem){
		.title = "  TIMER ",
		.subtitle = "Start the countdow.",
		.callback = menu_select_callback,
	  };
	}
 
  // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Starting Menu",
    .num_items = 4,
    .items = menu_items,
  };
   Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer); 
	menu_layer = simple_menu_layer_create(bounds, window, menu_sections, 1, NULL);
   layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));
}
static void window_appear(){
}
static void window_unload(Window *window) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(window);
  	simple_menu_layer_destroy(menu_layer);
}

 void show_start_menu(){
 window = window_create();

  // Setup the window handlers
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
	.appear = window_appear,
  });
	window_stack_push(window, true /* Animated */);
}



