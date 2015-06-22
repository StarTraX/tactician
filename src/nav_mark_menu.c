#include <pebble.h>
#include "nav_mark_menu.h"
#include "dashboard.h" 
	
static int num_a_items =0;
static Window *window;
static	SimpleMenuSection menu_sections[1];
static SimpleMenuLayer *menu_layer;
static SimpleMenuItem menu_items[3];
static void window_load(Window *window);
static void window_unload(Window *window);	
static void menu_select_callback(int index, void *ctx);
void manual_start();
void next_mark();
void prev_mark();
void back_to_main_menu();

 void show_nav_mark_menu(){
 	window = window_create();
  	window_set_window_handlers(window, (WindowHandlers) {
    	.load = window_load,
    	.unload = window_unload,

  });
	window_stack_push(window, true /* Animated */);
}

static void window_load(Window *window) {
  num_a_items = 0;

  // This is an example of how you'd set a simple menu item
 menu_items[num_a_items++] = (SimpleMenuItem){
      .title = "Back one mark",
	 .subtitle = "Move back one mark",
    .callback = menu_select_callback,
  };
  // The menu items appear in the order saved in the menu items array

  menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Manual Start",
	.subtitle = "Start navigating.",
     .callback = menu_select_callback,
  };

  menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Fwd one mark ",
    .subtitle = "Move forward one mark",
    .callback = menu_select_callback,
  };
  menu_sections[0] = (SimpleMenuSection){
	.title = "Mark menu",
    .num_items = num_a_items,
    .items = menu_items,
  };
   Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);  
	menu_layer = simple_menu_layer_create(bounds, window, menu_sections, 1, NULL);
   layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));
}
static void window_unload(Window *window) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(window);
  	simple_menu_layer_destroy(menu_layer);
}

static void menu_select_callback(int index, void *ctx) {	
	if(index==0)
		prev_mark();		
	if(index==1)
		manual_start();
	if(index==2)
		next_mark();
}

void manual_start(){ 
 	send_to_phone( TupletInteger(102, 0)); // 0: manual start
	back_to_main_menu();
}
void prev_mark(){	
	send_to_phone( TupletInteger(102, -1)); // -1:previous mark
	back_to_main_menu();
}
void next_mark(){
	send_to_phone( TupletInteger(102, 1)); // 1: next mark
	back_to_main_menu();
}
void back_to_main_menu(){
	//APP_LOG(APP_LOG_LEVEL_INFO, "Closing this window ");
	window_stack_pop(true); //this window
	//APP_LOG(APP_LOG_LEVEL_INFO, "Closing prev window  ");
	//window_stack_pop(true); // prev window (next-mark or next-leg)
	//APP_LOG(APP_LOG_LEVEL_INFO, "Closing navigation menu ");
	//window_stack_pop(true); // navigation menu	
}