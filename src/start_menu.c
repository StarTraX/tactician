#include <pebble.h>
	#include "dashboard.h"
#include "start_menu.h"
#include "start_line.h"
#include "start_ping_menu.h"
#include "start_time_menu.h"
#include "start_solution.h"
#include "finish_time.h"
	
 int num_a_items =0;
 Window *window;
	SimpleMenuSection menu_sections[1];
 SimpleMenuLayer *menu_layer;
 SimpleMenuItem menu_items[4];

void start_menu_select_callback(int index, void *ctx) {	
	if(index==0)
		show_start_line();	
	else if(index==1)
		show_start_solution();	
	else if(index== 2){
		send_to_phone(TupletCString(103, "FIN")); 
		vibes_short_pulse();
		window_stack_pop(true); //this window
		show_finish_time();
	}
	else if(index== 3){
		send_to_phone(TupletCString(103, "POI")); 
		vibes_short_pulse();

		window_stack_pop(true); //this window
	}
}

void start_menu_window_load(Window *window) {
  num_a_items = 0;

  // This is an example of how you'd set a simple menu item
  // The menu items appear in the order saved in the menu items array
  menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Start Line",
	.subtitle = "Show the start line details",
     .callback = start_menu_select_callback,
  };
 menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Time & Distance",
    .subtitle = "Time & Distance",
    .callback = start_menu_select_callback,
  };
 
	if (intRole==0){ //only available for admin user
		menu_items[num_a_items++] = (SimpleMenuItem){
		  .title = "Ping  FINISH ",
		 .subtitle = "Ping the finish (time&loc'n). ",
		.callback = start_menu_select_callback,
	  };
	 menu_items[num_a_items++] = (SimpleMenuItem){
		.title = "Ping POI --(TBA) ----",
		.subtitle ="Ping a Point of Interest. ",
		.callback = start_menu_select_callback,
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
void start_menu_window_appear(){
}
void start_menu_window_unload(Window *window) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(window);
  	simple_menu_layer_destroy(menu_layer);

}

 void show_start_menu(){
 	window = window_create();
	setCurrentWindow("none");
  // Setup the window handlers
  	window_set_window_handlers(window, (WindowHandlers) {
    	.load = start_menu_window_load,
   	 	.unload = start_menu_window_unload,
		.appear = start_menu_window_appear,
  	});
	window_stack_push(window, true /* Animated */);
}



