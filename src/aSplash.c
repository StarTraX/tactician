#include <pebble.h>
#include "aSplash.h"
#include <dashboard.h>
Window *window;

static BitmapLayer *bitmap_layer;
GBitmap* mBitmap;


static void window_load(Window* window) {
	//printf("window_load, Free: %d", heap_bytes_free());
	bitmap_layer = bitmap_layer_create(GRect(0, 0, 144,168));
	bitmap_layer_set_bitmap	(bitmap_layer, mBitmap );
    layer_add_child(window_get_root_layer(window), bitmap_layer_get_layer(bitmap_layer));		
	displayFields[FLAGDATALOADED] =  text_layer_create(GRect(0, 104, 144, 30));  //Status "Loading"/"Bye""	
	text_layer_set_font( displayFields[FLAGDATALOADED], displayFont1);
	layer_add_child(window_get_root_layer(window), (Layer *)displayFields[FLAGDATALOADED]);


}
 static void window_unload(Window* window) {
 	gbitmap_destroy(mBitmap);
	bitmap_layer_destroy(bitmap_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
	//APP_LOG(APP_LOG_LEVEL_DEBUG,"splash window_unload");

}
static void window_appear(Window* window) {
	text_layer_set_text(displayFields[FLAGDATALOADED],splashScreenMessage);
}
void show_splash(bool ready) {


	window = window_create();
#ifdef PBL_PLATFORM_APLITE
	window_set_fullscreen(window, true);
	mBitmap = gbitmap_create_with_resource(RESOURCE_ID_MENU_IMAGE);
#else
	mBitmap = gbitmap_create_with_resource(RESOURCE_ID_APP_IMAGE);
	
#endif
  	window_set_window_handlers(window, (WindowHandlers) {
	  	.load = window_load,
    	.unload =window_unload,
		.appear = window_appear,
  	});
  	window_stack_push(window, true);
}
