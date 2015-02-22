#include <pebble.h>
	#include "main_menu.h"
	#include "dashboard.h"
	#include "aSplash.h"
//extern char ** ans;	

int main(void) {
	//atest();
	dashboard_init();
	show_splash(false);
  app_event_loop();
}
