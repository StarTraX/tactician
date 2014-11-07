#include <pebble.h>
	#include <main_menu.h>
	#include "dashboard.h"
	#include "atest.h"
extern char ** ans;	
	/* window structure */

void init(){
	APP_LOG(APP_LOG_LEVEL_DEBUG, "Calling atest");
	dashboard_init();
	atest();
	show_main_menu();

	
}
int main(void) {
	init();
  app_event_loop();
}
