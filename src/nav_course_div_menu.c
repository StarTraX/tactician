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
static NumberWindow * degrees_window;
static void show_heading_select();
void headingSelected(NumberWindow *window,void* context);
static int selectedIndex;
int isBrgMark = 0; // context variable: 0 = no, 1 = yes
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
static void select_callback(int index, void *context) {	
	int * pointerToValue = (int*) context;
	if(* pointerToValue == 0){
		 send_to_phone( TupletInteger(101, index)); //index maps to courseIdx!


 	send_to_phone( TupletInteger(101, index)); //index maps to courseIdx!
	vibes_short_pulse();
	window_stack_pop(true); //close this window (course menu)
	window_stack_pop(true); //close prev window current Course)
	window_stack_pop(true); //close  navigation menu
	}
}

static void select_callbackWithDist(int index, void *ctx) {	
	selectedIndex = index; 
	//const char * twdDegs = NULL;
	//static char msg[20];
	//snprintf(msg, 5, "%s",twdDegs );
	//twdDegs = text_layer_get_text(displayFields[TWD]);
 	degrees_window = number_window_create("Degrees",(NumberWindowCallbacks){.selected=headingSelected},NULL);
 	//degrees_window = number_window_create(msg,(NumberWindowCallbacks){.selected=headingSelected},NULL);
	number_window_set_min(degrees_window,0);
	number_window_set_max(degrees_window,355);
	number_window_set_step_size(degrees_window,5);
	number_window_set_value(degrees_window, 45);
	 window_stack_push(number_window_get_window(degrees_window),true);

}


static void window_load(Window *m_window) {

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
	char * courseDivWindToken = NULL ; // contrains pre-formatted course no & wind 
	char * distToken = NULL; // used for 04 course distance

	divsOption  = mstrtok (new_str, ":");  // split by ";"" for courses (divs) and "|" for internal fields
	while (divsOption != NULL){	
		strcpy(newDivString,divsOption);
		courseDivWindToken = m2strtok (newDivString, "|");  // split by  "|" for internal Number Wind, | courseIdx		
		distToken = m2strtok (NULL, "|");  // Gets the next token - 
		snprintf(dispCourseDiv[num_a_items], disp_width,  "%s", courseDivWindToken);
		if ( strcmp(distToken, "1")==0){
			menu_items[num_a_items] = (SimpleMenuItem){			
				.title = dispCourseDiv[num_a_items],												
				.subtitle = "This has dist AND Brg ",
				.callback = select_callbackWithDist,
			};
		}
		else
			menu_items[num_a_items] = (SimpleMenuItem){			
			.title = dispCourseDiv[num_a_items],												
    		.subtitle = "Select this  ",
    		.callback = select_callback,
		};
		divsOption = mstrtok(NULL, ":");
		num_a_items++;
	}


  	menu_sections[0] = (SimpleMenuSection){
	  	.title = "Courses Menu",
    	.num_items = num_a_items,
    	.items = menu_items,
	};

   	Layer *window_layer = window_get_root_layer(mWindow);
  	GRect bounds = layer_get_frame(window_layer);
	menu_layer = simple_menu_layer_create(bounds, mWindow, menu_sections, 1, (void*) &isBrgMark);
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

//http://stackoverflow.com/questions/22289532/pebble-c-tupletcstring-compile-error
#define MyTupletCString(_key, _cstring) ((const Tuplet) { .type = TUPLE_CSTRING, .key = _key, .cstring = { .data = _cstring, .length = strlen(_cstring) + 1 }})
void headingSelected(NumberWindow *window,  void * context){;
	static char msg[20];
	snprintf(msg, 20,  "%d|%d ",selectedIndex,(int) number_window_get_value(window));
 	APP_LOG(APP_LOG_LEVEL_INFO, msg);	
															
    send_to_phone( MyTupletCString(105, msg)); //index maps to courseIdx!
	vibes_short_pulse();
	window_stack_pop(true); //close this window (number window)
	window_stack_pop(true); //close this window (course menu)
	window_stack_pop(true); //close prev window current Course)
	window_stack_pop(true); //close  navigation menu

}