#include <pebble.h>
#include "aSplash.h"
#include "dashboard.h"
#include "main_menu.h"
static Window *window;

// This is a scroll layer
 static BitmapLayer *bitmap_layer;
GBitmap* mBitmap;
bool mReady = false;

void reopen_main_menu(ClickRecognizerRef recognizer, void *context){
	if (mReady == true ) { // re-open main menu if user has gone too far
		gbitmap_destroy(mBitmap);
		show_main_menu();
	}
}
void close_splash_window(ClickRecognizerRef recognizer, void *context){
	APP_LOG(APP_LOG_LEVEL_INFO, "Back Button");
}


void BitmapLayerCallbacks() {
	window_single_click_subscribe(BUTTON_ID_SELECT, reopen_main_menu);
	window_single_click_subscribe(BUTTON_ID_BACK, close_splash_window);
}
static void window_appear(Window* window) {
	text_layer_set_text(displayFields[FLAGDATALOADED],splashScreenMessage);
}


static void window_load(Window* window) {
	mBitmap = gbitmap_create_with_resource(RESOURCE_ID_APP_IMAGE);
	bitmap_layer = bitmap_layer_create(GRect(0, 0, 144,168));
	bitmap_layer_set_bitmap	(bitmap_layer, mBitmap );
    window_set_click_config_provider(window, BitmapLayerCallbacks);
    layer_add_child(window_get_root_layer(window), bitmap_layer_get_layer(bitmap_layer));	
	
	displayFields[FLAGDATALOADED] =  text_layer_create(GRect(0, 104, 144, 30));  //Status "Loading"/"Bye""	
	text_layer_set_font( displayFields[FLAGDATALOADED], displayFont1);
	layer_add_child(window_get_root_layer(window), (Layer *)displayFields[FLAGDATALOADED]);

}
static void window_unload(Window* window) {
	//	snprintf(Msg, 100,  "Heap free: %d ", heap_bytes_free());
 	gbitmap_destroy(mBitmap);
  	window_stack_remove(window, true);
  	window_destroy(window);
}

void show_splash(bool ready) {
	mReady = ready;
	window = window_create();
	window_set_fullscreen(window, true);	
  	window_set_window_handlers(window, (WindowHandlers) {
	  	.load = window_load,
    	.unload =window_unload,
		.appear = window_appear,
  });
  window_stack_push(window, true);
}


