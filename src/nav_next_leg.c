#include <pebble.h>
#include "nav_next_leg.h"
#define NEXTLEGCOUNT 7
#include "dashboard.h"
#include "nav_mark_menu.h"
static Window *window;

 static ScrollLayer *scroll_layer;
static int dispList [NEXTLEGCOUNT] = {
	NEXTLEGDESC,
	NEXTLEGNAME,
	NEXTLEGHDG,
	NEXTLEGTWA,
	NEXTLEGTWSE,
	NEXTLEGAWA,
	NEXTLEGAWS	 };
//static ActionBarLayer *action_bar;

/*
static void scroll_up(){
	GPoint scrollPoint = scroll_layer_get_content_offset(scroll_layer);
	if (scrollPoint.y < 0)scrollPoint.y +=30;
	scroll_layer_set_content_offset(scroll_layer,scrollPoint,true);
}
static void scroll_down(){
	GPoint scrollPoint = scroll_layer_get_content_offset(scroll_layer);
	scrollPoint.y -=30;
	scroll_layer_set_content_offset(scroll_layer,scrollPoint,true);
}
*/
static void config_provider() {
	if (intRole==0)
		window_single_click_subscribe(BUTTON_ID_SELECT, show_nav_mark_menu);
	//window_single_click_subscribe(BUTTON_ID_UP, scroll_up);
	//window_single_click_subscribe(BUTTON_ID_DOWN, scroll_down);
}

void set_nav_next_leg_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], displayFont1);
  	scroll_layer_add_child(scroll_layer, (Layer *)displayFields[dispIdx]);
}
static void window_load(Window * window)  {
	rowIndex=0;
	rowSpace = 32;

	text_layer_set_text(page_heading, "--- NEXT LEG  ---");
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(page_heading));
					
 	GRect max_text_bounds = GRect(0, 26, 144, 168); //TODO parameterise scroll-window height
 	scroll_layer = scroll_layer_create(max_text_bounds);  // size of the scroll layer
  	scroll_layer_set_click_config_onto_window(scroll_layer, window);
  	scroll_layer_set_content_size(scroll_layer, GSize(144,400)); // size of the surface that scrolls???
	scroll_layer_set_callbacks(scroll_layer, (ScrollLayerCallbacks){
		.click_config_provider= &config_provider,
	});
	for (int i = 0; i< NEXTLEGCOUNT; i++)
		set_nav_next_leg_text_layer( dispList[i]);	
	text_layer_set_text(displayFields[dispList[1]],"Refreshing..." );	
  layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
		layer_add_child(window_get_root_layer(window), scroll_layer_get_layer(scroll_layer));
	/*
		action_bar = action_bar_layer_create();
 

 	action_bar_layer_add_to_window(action_bar, window);
	action_bar_layer_set_icon(action_bar, BUTTON_ID_SELECT,gbitmap_create_with_resource(RESOURCE_ID_START_ICON));
 	action_bar_layer_set_click_config_provider(action_bar, &config_provider);
	*/

}
static void handle_nav_window_unload(Window* window) {
		for (int i = 0; i< NEXTLEGCOUNT; i++){
			text_layer_destroy(displayFields[dispList[i]]);
			displayFields[dispList[i]] = NULL;
		}												  
	scroll_layer_destroy(scroll_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(){
		 send_to_phone(TupletCString(100, "nav_next_leg"));
		text_layer_set_text(displayFields[dispList[1]], refreshingMsg);
}

void show_nav_next_leg(void) {
	 window = window_create();
  	window_set_fullscreen(window, true);	

  window_set_window_handlers(window, (WindowHandlers) {
	  .load = window_load, 
    .unload = handle_nav_window_unload,
	  .appear = window_appear,
  });
  window_stack_push(window, true);
}





