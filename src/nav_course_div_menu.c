#include <pebble.h>
#include "nav_course_div_menu.h"
#include "dashboard.h"
#include "mstrtok.h"
#include "m2strtok.h"
 Window *mWindow;
 SimpleMenuLayer *menu_layer;
 SimpleMenuSection menu_sections[1];
 SimpleMenuItem * menu_items;
static int num_a_items = 0;
char ** dispCourseDiv;
char* new_str;
char* newDivString;
char * divsOption;
static void window_unload(Window *mWindow) {// Deinitialize resources on window unload that were initialized on window load
  simple_menu_layer_destroy(menu_layer);
	window_destroy(mWindow);
	free(menu_items);
		free(new_str);
	free(divsOption);
	free(newDivString);	
	free(dispCourseDiv[0]);
	free(dispCourseDiv);
}
static void select_callback(int index, void *ctx) {	
 	send_to_phone( TupletInteger(101, index)); //index maps to courseIdx!
	vibes_short_pulse();
	window_stack_pop(true); //close this window (course menu)
	window_stack_pop(true); //close prev window current Course)
	window_stack_pop(true); //close  navigation menu

}
static void window_load(Window *m_window) {
	char  Msg[100];
	num_a_items =0; 
	new_str = malloc(sizeof(char)*1000); //because mstrtok alters its subject 
	strcpy(new_str,courseDivsText);
	menu_items = malloc(sizeof(SimpleMenuItem)*courseDivsCount );
	int disp_width = 20;// no of chars in lisplay
	newDivString = malloc(sizeof(char)* disp_width);
	
	dispCourseDiv = malloc(sizeof(char *)*courseDivsCount); // number div wind;
	dispCourseDiv[0] = malloc(courseDivsCount * disp_width * sizeof(char));	 
	for (int i =0; i < courseDivsCount; i++ ){	  
	  	dispCourseDiv[i] = dispCourseDiv[0] + i * (disp_width);
	}
	char * courseDivToken ;

	divsOption  = mstrtok (new_str, ":");  // split by ";"" for divs and "|" for internal fields
	while (divsOption != NULL){	
		strcpy(newDivString,divsOption);
		courseDivToken = m2strtok (newDivString, "|");  // split by  "|" for internal Number Wind, | courseIdx
		snprintf(dispCourseDiv[num_a_items], disp_width,  "%s", courseDivToken);
		menu_items[num_a_items] = (SimpleMenuItem){			
			.title = dispCourseDiv[num_a_items],												
    		.subtitle = "Select this  ",
    		.callback = select_callback,
		};
		divsOption = mstrtok(NULL, ":");
		num_a_items++;
	}




  	menu_sections[0] = (SimpleMenuSection){
	  	.title = "Nav Divs Menu",
    	.num_items = num_a_items,
    	.items = menu_items,
	};

   	Layer *window_layer = window_get_root_layer(mWindow);
  	GRect bounds = layer_get_frame(window_layer);
	menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, NULL);
  	layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));
}
 void show_nav_divs_menu(){
 mWindow = window_create();
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
		 window_stack_push(mWindow, true /* Animated */);
}
