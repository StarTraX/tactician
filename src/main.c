#include <pebble.h>
	#include "main_menu.h"
	#include "dashboard.h"
	#include "aSplash.h"
	#include "pebble_process_info.h"
	extern const PebbleProcessInfo __pbl_app_info;

int main(void) {
	adminRole = "admin";
	APP_LOG(APP_LOG_LEVEL_INFO, "StarTraX Tactician version %d.%d", __pbl_app_info.process_version.major, __pbl_app_info.process_version.minor );
	dashboard_init();
	show_splash(false);
  	app_event_loop();
	APP_LOG(APP_LOG_LEVEL_DEBUG,"main end");
}
