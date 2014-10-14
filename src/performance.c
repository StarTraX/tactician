#include "performance.h"
#include <pebble.h>
#include "dashboard.h"

static Window *s_window;
 static GFont s_res_gothic_28;

static void initialise_ui(void) {
  s_window = window_create();
  window_set_fullscreen(s_window, true);	
  s_res_gothic_28 = fonts_get_system_font(FONT_KEY_GOTHIC_28);
  int rowIndex=0;
	int rowSpace = 32;
 // displayFields[PERFPCDISP] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //Performance
 // text_layer_set_font( displayFields[PERFPCDISP], s_res_gothic_28);
 // layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[PERFPCDISP]);

  displayFields[GPSTIME] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //GPS Time
  text_layer_set_font( displayFields[GPSTIME], s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[GPSTIME]);
	
  displayFields[PERFACTUALBTV] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //BTV
  text_layer_set_font( displayFields[PERFACTUALBTV], s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[PERFACTUALBTV]);
	
 displayFields[PERFACTUALTWA] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //Actual TWA
  text_layer_set_font( displayFields[PERFACTUALTWA], s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[PERFACTUALTWA]);
 
  displayFields[TWS] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //Actual TWA
  text_layer_set_font( displayFields[TWS], s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[TWS]);
 
  displayFields[TWD] = text_layer_create(GRect(0, rowSpace*(rowIndex++), 144, 40)); //Actual TWA
  text_layer_set_font( displayFields[TWD], s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[TWD]);
	
}

static void destroy_ui(void) {
  window_destroy(s_window);

 // text_layer_destroy(displayFields[GPSTIME]);
}

static void handle_window_unload(Window* window) {
  destroy_ui();
}

void show_performance(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

void hide_performance(void) {
  window_stack_remove(s_window, true);
}
