#include <pebble.h>
#include "start_time_menu.h"
#include "dashboard.h"
	
static int num_a_items =0;
static Window *window;
static	SimpleMenuSection menu_sections[1];
static SimpleMenuLayer *menu_layer;
static SimpleMenuItem menu_items[3];


static void menu_select_callback(int index, void *ctx) {	
	if(index==0)// 10 mins - 600 sec's
		send_to_phone(TupletCString(104, "600")); 
	else if(index==1)
		send_to_phone(TupletCString(104, "300")); 
	else if(index==2) // 4 mins = 240 sec's
		send_to_phone(TupletCString(104, "240")); 
 
	window_stack_pop(true); //this window
}

static void window_load(Window *window) {
  	num_a_items = 0;
	menu_items[num_a_items++] = (SimpleMenuItem){
      	.title = "---10 TEN mins ---",
	 	.subtitle = "Start 10 minute timer ",
    	.callback = menu_select_callback,
  };
  menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "---5 FIVE mins ---",
	.subtitle = "Start 5 minute timer ",
     .callback = menu_select_callback,
  };
	  menu_items[num_a_items++] = (SimpleMenuItem){
    .title =  "---4 FOUR mins ---",
	.subtitle = "Start 4 minute timer ",
     .callback = menu_select_callback,
  };
	// Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Start Timer Menu",
    .num_items = 3,
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

 void show_start_time_menu(){
   window = window_create();
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
	.appear = window_appear,
  });
	window_stack_push(window, true /* Animated */);
}






