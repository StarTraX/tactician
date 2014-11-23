#include <pebble.h>
#include "nav_series_menu.h"
#include "dashboard.h"
#include "mstrtok.h"

static Window *mWindow;
static SimpleMenuLayer *menu_layer;
static SimpleMenuSection menu_sections[1];
static SimpleMenuItem * menu_items;
int num_a_items = 0;
void nav_series_menu_window_unload(Window *mWindow) {// Deinitialize resources on window unload that were initialized on window load
	window_destroy(mWindow);
  	simple_menu_layer_destroy(menu_layer);
	free(menu_items);
}
// You can capture when the user selects a menu icon with a menu item select callback
static void nav_series_select_callback(int index, void *ctx) {	
	//nav_series_menu_window_unload(mWindow);
	window_stack_remove(mWindow,true);
	if(index==0){
		// close this, and previous two windows
		
	}
}
// This initializes the menu upon window load
static void nav_series_menu_window_load(Window *m_window) {	
	num_a_items =0;
	//char* new_str = malloc(sizeof(char)*strlen(seriesList)); //strlen doesn't work here dunno why.
	char* new_str = malloc(sizeof(char)*1000); //because mstrtok alters its subject 	
	 strcpy(new_str,seriesList);
	char * seriesOption  = mstrtok (new_str, "|"); 
	//seriesCount = 25; //DEBUG
	menu_items = malloc(sizeof(SimpleMenuItem)*seriesCount);
	while (seriesOption != NULL){		
		menu_items[num_a_items++] = (SimpleMenuItem){			
			.title = seriesOption,												
    		.subtitle = "Select this  ",
    		.callback = nav_series_select_callback,
		};
		seriesOption = mstrtok(NULL, "|");
	}

   // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
	  .title = "Nav Series Menu",
    .num_items = num_a_items,
    .items = menu_items,
  };
   Layer *window_layer = window_get_root_layer(mWindow);
  GRect bounds = layer_get_frame(window_layer); 
	menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, NULL);
	layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));
	free(new_str);
	free(seriesOption);
}

	//	show_nav_series_menu();
	//if(index==1)
		//show_nav_courses_menu();


 void show_nav_series_menu(){
 mWindow = window_create();

  // Setup the window handlers
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = nav_series_menu_window_load,
    .unload = nav_series_menu_window_unload,
  });
		 window_stack_push(mWindow, true /* Animated */);
}


