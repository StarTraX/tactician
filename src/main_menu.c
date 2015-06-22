#include <pebble.h>
#include <main_menu.h>
#include <performance.h>
#include <navigation_menu.h>
#include <start_menu.h>
#include <wind_dir.h>
# include <aSplash.h>


#define NUM_MENU_SECTIONS 1
#define NUM_FIRST_MENU_ITEMS 4

static Window *window;
static SimpleMenuLayer *simple_menu_layer;
static SimpleMenuSection menu_sections[NUM_MENU_SECTIONS];
static SimpleMenuItem first_menu_items[NUM_FIRST_MENU_ITEMS];
char  Msg[100];
static void window_appear();
static void window_load(Window *window);
static void window_unload(Window *window);
static void config_provider();
void close_main_window(ClickRecognizerRef recognizer, void *context);
static void menu_select_callback(int index, void *ctx);

 void show_main_menu(){
  	window = window_create();
  	// Setup the window handlers
  	window_set_window_handlers(window, (WindowHandlers) {
    	.load = window_load,
    	.unload = window_unload,
		.appear = window_appear,
  }); 	
	 window_stack_push(window, true /* Animated */);
}

static void window_appear(){
	//snprintf(Msg, 100,  "Heap free: %d ", heap_bytes_free());
 	APP_LOG(APP_LOG_LEVEL_INFO, "window_appear Heap Used: %d, Free: %d ", heap_bytes_used(), heap_bytes_free());
}
static void window_load(Window *window) {
	window_set_click_config_provider(window, config_provider);
  int num_a_items = 0;
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
    .title = "Course Tracking",
    .subtitle = "Course, marks, position",
    .callback = menu_select_callback,
  }; 
	first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Wind",
    .subtitle = "Wind direction rose",
    .callback = menu_select_callback,
  };
// Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "StarTraX Tactician",
    .num_items = NUM_FIRST_MENU_ITEMS,
    .items = first_menu_items,
  };
 
  GRect bounds = layer_get_frame( window_get_root_layer(window));
 simple_menu_layer = simple_menu_layer_create(bounds, window, menu_sections, NUM_MENU_SECTIONS, NULL);
  layer_add_child(window_get_root_layer(window), simple_menu_layer_get_layer(simple_menu_layer));
		//APP_LOG(APP_LOG_LEVEL_INFO, "window_load: main_menu" );

}
static void window_unload(Window *window) {// Deinitialize resources on window unload that were initialized on window load
	APP_LOG(APP_LOG_LEVEL_INFO, "window_unload: main_menu" );
	simple_menu_layer_destroy(simple_menu_layer);
		//APP_LOG(APP_LOG_LEVEL_INFO, "window_unload: main_menu" );
	window_stack_pop_all(true);

	//window_destroy(window);
	//show_splash(true); //too hard to avoid the double free crash on second exit!
}
static void config_provider(){
		window_single_click_subscribe(BUTTON_ID_BACK, close_main_window);
}
void close_main_window(ClickRecognizerRef recognizer, void *context){
	//APP_LOG(APP_LOG_LEVEL_INFO, "Back Button"); //force a long click to close this window
}
static void menu_select_callback(int index, void *ctx) {
	switch (index){
	case 0:
		APP_LOG(APP_LOG_LEVEL_INFO, "Starting");
		show_start_menu();
		break;	
	case 1:
		APP_LOG(APP_LOG_LEVEL_INFO, "Performance");
		show_performance();
		break;
	case 2:
		APP_LOG(APP_LOG_LEVEL_DEBUG_VERBOSE, "show_nav_menu");
		show_nav_menu();
		break;
	case 3:
		APP_LOG(APP_LOG_LEVEL_DEBUG_VERBOSE, "show_wind");
		disp_wind();
		break;
	}
}
