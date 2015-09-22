#include <pebble.h>
#include "dashboard.h"
#include "wind_set.h"
static NumberWindow * wind_dir_window;
static NumberWindow * wind_speed_window;

//http://stackoverflow.com/questions/22289532/pebble-c-tupletcstring-compile-error
#define MyTupletCString(_key, _cstring) ((const Tuplet) { .type = TUPLE_CSTRING, .key = _key, .cstring = { .data = _cstring, .length = strlen(_cstring) + 1 }})

static void speedSelected(NumberWindow *window,  void * context){;
	//APP_LOG(APP_LOG_LEVEL_DEBUG,"speedSelected start. Free %d", heap_bytes_free());
	static char msg[20];
	*windSetTws = (int) number_window_get_value(wind_speed_window);
	//APP_LOG(APP_LOG_LEVEL_DEBUG, "Wind Dir: %d, Speed: %d ",  *windSetTwd, *windSetTws);
 	snprintf(msg, 20,  "%d;%d", *windSetTwd, *windSetTws);
  	send_to_phone( MyTupletCString(107, msg)); //index maps to courseIdx!
	vibes_short_pulse();

	number_window_destroy(wind_dir_window);
	number_window_destroy(wind_speed_window);

	window_stack_pop(true); //close this window (Wind_dir window)
	window_stack_pop(true); //close this window (Wind_dir window)
}
static void headingSelected(NumberWindow *window,  void * context){;
	static char msg[20];
	*windSetTwd = (int) number_window_get_value(wind_dir_window);
	vibes_short_pulse();

	wind_speed_window = number_window_create("Wind Speed (kts)",(NumberWindowCallbacks)
		{.selected=speedSelected},NULL);
	number_window_set_max(wind_speed_window,20);
 	number_window_set_min(wind_speed_window,0);
	number_window_set_step_size(wind_speed_window,1);
	number_window_set_value(wind_speed_window,  *windSetTws);
	window_stack_push(number_window_get_window(wind_speed_window),true);
}
void wind_set(void) {
	setCurrentWindow( "none"); // to request TWS/TWD 
	wind_dir_window = number_window_create("Wind Direction(M)",(NumberWindowCallbacks)
		{.selected=headingSelected},NULL);
	number_window_set_max(wind_dir_window,355);
 	number_window_set_min(wind_dir_window,0);
	number_window_set_step_size(wind_dir_window,10);
	number_window_set_value(wind_dir_window,  *windSetTwd);
	window_stack_push(number_window_get_window(wind_dir_window),true);
	}


