#include <pebble.h>
#include "aSplash.h"
#include "dashboard.h"
#include "main_menu.h"
static Window *window;

// This is a scroll layer
 static BitmapLayer *bitmap_layer;
GBitmap* mBitmap;

void close_splash_window_handler(ClickRecognizerRef recognizer, void *context){
	//show_main_menu();
  	//window_destroy(window);
	//gbitmap_destroy(mBitmap);
	//window_stack_remove(window, true);

}
void BitmapLayerCallbacks() {
	window_single_click_subscribe(BUTTON_ID_SELECT, close_splash_window_handler);
}
void handle_splash_window_appear(Window* window) {
text_layer_set_text(displayFields[FLAGDATALOADED],mAns[FLAGDATALOADED] );
}


static void initialise_splash_ui(void) {
	window = window_create();
	window_set_fullscreen(window, true);	
	mBitmap = gbitmap_create_with_resource(RESOURCE_ID_APP_IMAGE);
	bitmap_layer = bitmap_layer_create(GRect(0, 0, 144,168));
	bitmap_layer_set_bitmap	(bitmap_layer, mBitmap );
    window_set_click_config_provider(window, BitmapLayerCallbacks);
    layer_add_child(window_get_root_layer(window), bitmap_layer_get_layer(bitmap_layer));	
	
	displayFields[FLAGDATALOADED] =  text_layer_create(GRect(0, 104, 144, 30));  //Status "Loading"/"Bye""
	text_layer_set_text(displayFields[FLAGDATALOADED],mAns[FLAGDATALOADED] );	
	text_layer_set_font( displayFields[FLAGDATALOADED], s_res_gothic_28);
	layer_add_child(window_get_root_layer(window), (Layer *)displayFields[FLAGDATALOADED]);

}
static void handle_splash_window_unload(Window* window) {
	gbitmap_destroy(mBitmap);
  	window_stack_remove(window, true);
  	window_destroy(window);
}

void show_splash(void) {
  initialise_splash_ui();
  window_set_window_handlers(window, (WindowHandlers) {
    .unload = handle_splash_window_unload,
	.appear = handle_splash_window_appear,
  });
  window_stack_push(window, true);
}


