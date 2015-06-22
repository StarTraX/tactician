#include <pebble.h>
#include <dashboard.h>
#include <aSplash.h>
#include "pebble_process_info.h"
	extern const PebbleProcessInfo __pbl_app_info;
 
int main(void) {
	adminRole = "admin";
	APP_LOG(APP_LOG_LEVEL_INFO, "StarTraX Tactician version %d.%d", __pbl_app_info.process_version.major, __pbl_app_info.process_version.minor );
	APP_LOG(APP_LOG_LEVEL_INFO, "Main: Heap Used: %d, Free: %d", heap_bytes_used(), heap_bytes_free() );
	dashboard_init();

	show_splash(false);
app_event_loop();
}
