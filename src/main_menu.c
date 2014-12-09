#include <pebble.h>
#include <main_menu.h>
#include <performance.h>
#include <navigation_menu.h>
#include <start_menu.h>

#define NUM_MENU_SECTIONS 1
#define NUM_FIRST_MENU_ITEMS 3

static Window *main_menu_window;

static SimpleMenuLayer *simple_menu_layer;

static SimpleMenuSection menu_sections[NUM_MENU_SECTIONS];

static SimpleMenuItem first_menu_items[NUM_FIRST_MENU_ITEMS];

static void menu_select_callback(int index, void *ctx) {

	if(index==0){
		//APP_LOG(APP_LOG_LEVEL_INFO, "Starting");
		show_start_menu();
	}
	if(index==1){
		//APP_LOG(APP_LOG_LEVEL_INFO, "Performance");
		show_performance();
	}
	if(index==2){
		//APP_LOG(APP_LOG_LEVEL_INFO, "Navigation");
		show_nav_menu();
	}
  // Mark the layer to be updated
  //layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
}

static void main_menu_window_load(Window *main_menu_window) {
  int num_a_items = 0;

  // The menu items appear in the order saved in the menu items array
   first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Starting",
    .subtitle = "Start Line, Timer, Plan",
    .callback = menu_select_callback,
  };
 first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Performance",
    // You can also give menu items a subtitle
    .subtitle = "Racing performance",
    .callback = menu_select_callback,
  };
  first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Navigation",
    .subtitle = "Course, marks, position",
    .callback = menu_select_callback,
  };
// Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "StarTraX Tactician",
    .num_items = NUM_FIRST_MENU_ITEMS,
    .items = first_menu_items,
  };
 

  // Now we prepare to initialize the simple menu layer
  // We need the bounds to specify the simple menu layer's viewport size
  // In this case, it'll be the same as the window's
  Layer *window_layer = window_get_root_layer(main_menu_window);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  simple_menu_layer = simple_menu_layer_create(bounds, main_menu_window, menu_sections, NUM_MENU_SECTIONS, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(simple_menu_layer));
}


void main_menu_window_unload(Window *main_menu_window) {// Deinitialize resources on window unload that were initialized on window load
  simple_menu_layer_destroy(simple_menu_layer);
}

char  Msg[100];
void handle_main_menu_appear(){
	snprintf(Msg, 100,  "Heap free: %d ", heap_bytes_free());
 	APP_LOG(APP_LOG_LEVEL_INFO, Msg);
}

 void show_main_menu(){
  main_menu_window = window_create();

  // Setup the window handlers
  window_set_window_handlers(main_menu_window, (WindowHandlers) {
    .load = main_menu_window_load,
    .unload = main_menu_window_unload,
	.appear = handle_main_menu_appear,
  });
		 window_stack_push(main_menu_window, true /* Animated */);
}

