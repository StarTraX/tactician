#include <pebble.h>
#include "nav_course_div_menu.h"
#include "dashboard.h"
 static Window *window;
 SimpleMenuLayer *menu_layer;
 SimpleMenuSection menu_sections[1];
 static SimpleMenuItem * menu_items;
static int num_a_items = 0;
char ** dispCourseDiv;
char* new_str;
char* newDivString;
char * divsOption;
static NumberWindow * degrees_window;
static void show_heading_select();
static int selectedIndex;
int isBrgMark = 0; // context variable: 0 = no, 1 = yes
static const int disp_width = 20;// no of chars in lisplay

static void window_unload(Window *window) {
 	free(new_str);	
	free(newDivString);	 	
	free(dispCourseDiv[0]);	
	free(dispCourseDiv);
	simple_menu_layer_destroy(menu_layer);
	free(menu_items); 
	window_destroy(window);
}

static void select_callback(int index, void *context) {	
	int * pointerToValue = (int*) context;
	if(* pointerToValue == 0){
		send_to_phone( TupletInteger(101, index)); //index maps to courseIdx!
		vibes_short_pulse();
		window_stack_pop(true); //close this window (course menu)
	}
}
//http://stackoverflow.com/questions/22289532/pebble-c-tupletcstring-compile-error
#define MyTupletCString(_key, _cstring) ((const Tuplet) { .type = TUPLE_CSTRING, .key = _key, .cstring = { .data = _cstring, .length = strlen(_cstring) + 1 }})
void headingSelected(NumberWindow *window,  void * context){;
	static char msg[20];
	snprintf(msg, 20,  "%d;%d",selectedIndex,(int) number_window_get_value(window));
    send_to_phone( MyTupletCString(105, msg)); //index maps to courseIdx!
	vibes_short_pulse();
	number_window_destroy(degrees_window);
	window_stack_pop(true); //close this window (number window)
	window_stack_pop(true); //close this window (course menu)

}
static void select_callbackWithDist(int index, void *ctx) {	
	selectedIndex = index; 
	degrees_window = number_window_create("Degrees",(NumberWindowCallbacks){.selected=headingSelected},NULL);
	number_window_set_max(degrees_window,355);
 	number_window_set_min(degrees_window,0);
	number_window_set_step_size(degrees_window,5);
	number_window_set_value(degrees_window, 45);
	window_stack_push(number_window_get_window(degrees_window),true);
}

static void window_load(Window *window) {
	num_a_items =0; 
	dispCourseDiv = malloc(sizeof(char *)*courseDivsCount); // number div wind;
	dispCourseDiv[0] = malloc(courseDivsCount * disp_width * sizeof(char));	 

	for (int i =0; i < courseDivsCount; i++ ){	  //required to be 
	 	dispCourseDiv[i] = dispCourseDiv[0] + i * (disp_width);
	}

	//char * courseDivWindToken = malloc(20); ; // contains pre-formatted course number & wind 
	char * distToken =  malloc(4); // used for 04 course distance

	//divsOption  = mstrtok (new_str, ":");  // split by ";"" for courses (divs) and "|" for internal fields
	int p = 0;// current pointer along courseDivsText 
	while (p < courseDivsSize){
		strcpy(dispCourseDiv[num_a_items], (courseDivsByteArray +p)); //first null-terminated string
		//APP_LOG(APP_LOG_LEVEL_DEBUG, "TEST NULL STRING DELIMITER. dispCourseDiv[num_a_items]: %s ", dispCourseDiv[num_a_items]);
		p += strlen(dispCourseDiv[num_a_items]) +1 ; // first null

		strcpy(distToken, (courseDivsByteArray + p )); //first null-terminated string
		//APP_LOG(APP_LOG_LEVEL_DEBUG, "TEST NULL STRING DELIMITER. distToken: %s ", distToken);
		p += strlen(distToken) +1 ;	
		//APP_LOG(APP_LOG_LEVEL_DEBUG,"dispCourseDiv[num_a_items]: %s,num_a_items: %d heap_bytes_free: %d ", 
		//		dispCourseDiv[num_a_items], num_a_items, heap_bytes_free());
		if ( strcmp(distToken, "1")==0){ // found 1 in distToken
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
		//APP_LOG(APP_LOG_LEVEL_DEBUG,"title: %s",menu_items[num_a_items].title);
		num_a_items++ ;
	}
	menu_sections[0] = (SimpleMenuSection){
	  	.title = "Courses Menu",
    	.num_items = num_a_items,
    	.items = menu_items,
	};	


  	Layer *window_layer = window_get_root_layer(window);
 	GRect bounds = layer_get_frame(window_layer);
	menu_layer = simple_menu_layer_create(bounds, window, menu_sections, 1, (void*) &isBrgMark);	
	layer_add_child(window_layer, simple_menu_layer_get_layer(menu_layer));

}
 

void show_nav_divs_menu(){
	menu_items = malloc(sizeof(SimpleMenuItem)*courseDivsCount );
	dispCourseDiv = malloc(sizeof(char *)*courseDivsCount); // number div wind;
	dispCourseDiv[0] = malloc(courseDivsCount * disp_width * sizeof(char));	 
	newDivString = malloc(sizeof(char)* disp_width);
	window = window_create();
  	window_set_window_handlers(window, (WindowHandlers) {
    	.load = window_load,
    	.unload = window_unload,
  	});
	 // APP_LOG(APP_LOG_LEVEL_INFO, "handlers created");
	window_stack_push(window, true /* Animated */);
}
