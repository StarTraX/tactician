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
void nav_divs_menu_window_unload(Window *mWindow) {// Deinitialize resources on window unload that were initialized on window load
  simple_menu_layer_destroy(menu_layer);
	window_destroy(mWindow);
	free(menu_items);
}
static void nav_divs_select_callback(int index, void *ctx) {	
 	send_to_phone( TupletInteger(101, index)); //index maps to courseIdx!
	vibes_short_pulse();
	window_stack_pop(true); //close this window (course menu)
	window_stack_pop(true); //close prev window current Course)
	window_stack_pop(true); //close  navigation menu

}
static void nav_divs_menu_window_load(Window *m_window) {
	char  Msg[100];
	//snprintf(Msg, 100,  "Heap free: %d", heap_bytes_free());
 	//APP_LOG(APP_LOG_LEVEL_INFO, Msg);
	num_a_items =0; 
	char* new_str = malloc(sizeof(char)*1000); //because mstrtok alters its subject 
	strcpy(new_str,courseDivsText);
	//snprintf(Msg, 100,  "course divs count : %d", courseDivsCount);
	//APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	menu_items = malloc(sizeof(SimpleMenuItem)*courseDivsCount );
	int disp_width = 20;// no of chars in lisplay
	char* newDivString = malloc(sizeof(char)* disp_width);
	
	dispCourseDiv = malloc(sizeof(char *)*courseDivsCount); // number div wind;
	dispCourseDiv[0] = malloc(courseDivsCount * disp_width * sizeof(char));	 
	for (int i =0; i < courseDivsCount; i++ ){	  
	  	dispCourseDiv[i] = dispCourseDiv[0] + i * (disp_width);
	}
	char * courseDivToken ;
	char * divsOption  = mstrtok (new_str, ":");  // split by ";"" for divs and "|" for internal fields
	while (divsOption != NULL){	
		strcpy(newDivString,divsOption);
		courseDivToken = m2strtok (newDivString, "|");  // split by  "|" for internal Number Wind, | courseIdx
		//courseIdx = m2strtok (NULL, "|"); // second strtok2 yeilds courseIdx
		snprintf(dispCourseDiv[num_a_items], disp_width,  "%s", courseDivToken);
		//APP_LOG(APP_LOG_LEVEL_DEBUG, dispCourseDiv[num_a_items]);

		menu_items[num_a_items] = (SimpleMenuItem){			
			.title = dispCourseDiv[num_a_items],												
    		.subtitle = "Select this  ",
    		.callback = nav_divs_select_callback,
		};
		divsOption = mstrtok(NULL, ":");
		num_a_items++;
	}
	//snprintf(Msg, 100,  "Free new_str %d",(int) new_str);
	// APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	free(new_str);
	//snprintf(Msg, 100,  "Free divsOption %d",(int) divsOption);
	// APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	free(divsOption);
	//snprintf(Msg, 100,  "Free newDivString %d",(int) newDivString);
	// APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	free(newDivString);	
	//snprintf(Msg, 100,  "Free (dispCourseDiv[0] %d",(int) dispCourseDiv[5]);
	// APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	free(dispCourseDiv[0]);
	//free(dispCourseDiv[1]);  Nope, won't work
	//snprintf(Msg, 100,  "Free (dispCourseDiv %d",(int) dispCourseDiv);
	// APP_LOG(APP_LOG_LEVEL_DEBUG, Msg);
	free(dispCourseDiv);
	//free(courseDivToken);	
   // Bind the menu items to the corresponding menu sections
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

  // Setup the window handlers
  window_set_window_handlers(mWindow, (WindowHandlers) {
    .load = nav_divs_menu_window_load,
    .unload = nav_divs_menu_window_unload,
  });
		 window_stack_push(mWindow, true /* Animated */);
}
