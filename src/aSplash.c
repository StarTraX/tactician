#include <pebble.h>
#include "aSplash.h"
#include <dashboard.h>
Window *window;

// This is a scroll layer
static BitmapLayer *bitmap_layer;
GBitmap* mBitmap;
bool mReady = false;
static void window_load(Window* window) ;
static void window_unload(Window* window);
static void window_appear(Window* window);
//void reopen_main_menu(ClickRecognizerRef recognizer, void *context);
//void BitmapLayerCallbacks() ;
//void close_splash_window(ClickRecognizerRef recognizer, void *context);

void show_splash(bool ready) {
	mReady = ready;
	window = window_create();
	//window_set_fullscreen(window, true);	
  	window_set_window_handlers(window, (WindowHandlers) {
	  	.load = window_load,
    	.unload =window_unload,
		.appear = window_appear,
  });
  window_stack_push(window, true);
}
 void window_load(Window* window) {
//printf("window_load entered FRee: %d ", heap_bytes_free());
	mBitmap = gbitmap_create_with_resource(RESOURCE_ID_APP_IMAGE);
	bitmap_layer = bitmap_layer_create(GRect(0, 0, 144,168));
	bitmap_layer_set_bitmap	(bitmap_layer, mBitmap );
    //window_set_click_config_provider(window, BitmapLayerCallbacks);
    layer_add_child(window_get_root_layer(window), bitmap_layer_get_layer(bitmap_layer));		
	displayFields[FLAGDATALOADED] =  text_layer_create(GRect(0, 104, 144, 30));  //Status "Loading"/"Bye""	
	text_layer_set_font( displayFields[FLAGDATALOADED], displayFont1);
	layer_add_child(window_get_root_layer(window), (Layer *)displayFields[FLAGDATALOADED]);
printf("window_load exited Free: %d", heap_bytes_free());
}
 void window_unload(Window* window) {
	//	snprintf(Msg, 100,  "Heap free: %d ", heap_bytes_free());
	APP_LOG(APP_LOG_LEVEL_DEBUG,"splash window_unload");
 	gbitmap_destroy(mBitmap);
	bitmap_layer_destroy(bitmap_layer);
  	window_stack_remove(window, true);
  	window_destroy(window);
}
static void window_appear(Window* window) {
	text_layer_set_text(displayFields[FLAGDATALOADED],splashScreenMessage);
}

