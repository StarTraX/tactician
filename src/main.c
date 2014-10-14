#include <pebble.h>
	#include <main_menu.h>
	#include "dashboard.h"
extern char ** ans;	
	/* window structure */

void init(){
	dashboard_init();
	show_main_menu();
}
int main(void) {
	init();
  app_event_loop();
}
