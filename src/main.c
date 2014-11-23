#include <pebble.h>
	#include "main_menu.h"
	#include "dashboard.h"
	#include "aSplash.h"
extern char ** ans;	
	/* window structure */

void init(){
	//APP_LOG(APP_LOG_LEVEL_DEBUG, "Calling atest");

	//atest();
	//show_main_menu();

	
}
int main(void) {
	dashboard_init();
	show_splash();
  app_event_loop();
}
