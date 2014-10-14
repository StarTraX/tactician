#include <pebble.h>
#include <tactician.h>

static Window * window;
int scrolling=1;
int loopCounter=0;
char ** ans = 0;
TextLayer *mExtraTextLayer[NUM_DISP];// We also use a text layer to scroll in the scroll layer

// This is a scroll layer
ScrollLayer *mScrollLayer;
static TextLayer *mTextLayer;// We also use a text layer to scroll in the scroll layer
static InverterLayer *mInverterLayer;// The scroll layer can other things in it such as an invert layer
// Lorum ipsum to have something to scroll
static const int VERT_SCROLL_TEXT_PADDING = 4;

 void handle_tick(struct tm *tick_time, TimeUnits units_changed) {
	 //APP_LOG(APP_LOG_LEVEL_INFO, "Time flies!");
	 loopCounter++;
  for (int i=0; i<NUM_DISP; i++){
		 snprintf(ans[i], 20, "Loop: %d",loopCounter*(i+1));
		 text_layer_set_text(mExtraTextLayer[i], ans[i]);
	 }
	 if(scrolling==1){
		 scroll_layer_set_content_offset	(mScrollLayer,
	     GPoint (0, -(30*loopCounter)%100),
	     false    );
	}
	else{

	 }
}

 void select_click_handler(ClickRecognizerRef recognizer, void *context){
	scrolling *= -1;
}
 void up_click_handler(ClickRecognizerRef recognizer, void *context) {
	if(scrolling==-1)
	scroll_layer_set_content_offset	(mScrollLayer,
			GPoint (0, (30*loopCounter++)%200),
		     false    );
}
 void down_click_handler(ClickRecognizerRef recognizer, void *context) {
	if(scrolling==-1)
	scroll_layer_set_content_offset	(mScrollLayer,
			GPoint (0, -(30*loopCounter--)%200),
		     false    );
}
 void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

// Setup the scroll layer on mWindow load
// We do this here in order to be able to get the max used text size
 void window_load(Window *mWindow) {
  Layer *mWindowLayer = window_get_root_layer(mWindow);
  GRect BOUNDS = layer_get_frame(mWindowLayer);
  GRect MAX_TEXT_BOUNDS = GRect(0, 0, BOUNDS.size.w, 2000);

  // Initialize the scroll layer
  mScrollLayer = scroll_layer_create(BOUNDS);

  // This binds the scroll layer to the mWindow so that up and down map to scrolling
  // You may use scroll_layer_set_callbacks to add or override interactivity
  // Initialize the text layer
  mTextLayer = text_layer_create(MAX_TEXT_BOUNDS);
  for (int i=0; i<NUM_DISP; i++){
    mExtraTextLayer[i] = text_layer_create(GRect(0,i*30,144,140));
    //text_layer_set_text(mExtraTextLayer[i], "Hello Salty Sailor");
    text_layer_set_font(mExtraTextLayer[i], fonts_get_system_font(  FONT_KEY_GOTHIC_28));
    scroll_layer_add_child(mScrollLayer, text_layer_get_layer(mExtraTextLayer[i]));
  }
  // Change the font to a nice readable one
  // This is system font; you can inspect pebble_fonts.h for all system fonts
  // or you can take a look at feature_custom_font to add your own font
//  text_layer_set_font(mTextLayer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));

  // Trim text layer and scroll content to fit text box
  GSize MAX_SIZE = text_layer_get_content_size(mTextLayer);
  text_layer_set_size(mTextLayer, MAX_SIZE);
  scroll_layer_set_content_size(mScrollLayer, GSize(BOUNDS.size.w, MAX_SIZE.h + VERT_SCROLL_TEXT_PADDING+100));

  // Add the layers for display
 // scroll_layer_add_child(mScrollLayer, text_layer_get_layer(mTextLayer));

  // The inverter layer will highlight some text
 // mInverterLayer = inverter_layer_create(GRect(0, 28, BOUNDS.size.w, 28));
 // scroll_layer_add_child(mScrollLayer, inverter_layer_get_layer(mInverterLayer));

  layer_add_child(mWindowLayer, scroll_layer_get_layer(mScrollLayer));
}

 void window_unload(Window *mWindow) {
  inverter_layer_destroy(mInverterLayer);
  text_layer_destroy(mTextLayer);
  scroll_layer_destroy(mScrollLayer);
}
 void window_root_init(){
	window = window_create();
 //window_root_init(windowRoot); // start tthe tactician app here 
  int nColumns=100; // define ans as text array for storing display data for the 
  ans=malloc(NUM_DISP * sizeof(char *));
  ans[0] = malloc(NUM_DISP * nColumns * sizeof(char));
  for (int i =0; i<NUM_DISP; i++ )
	  ans[i] = ans[0] + i * nColumns;
		tick_timer_service_subscribe(SECOND_UNIT, handle_tick); 
	 window_set_click_config_provider(window, click_config_provider); //
	 window_set_window_handlers(window , (WindowHandlers) {
     .load = window_load,
     .unload = window_unload,
   });
  window_stack_push(window, false /* Animated */);
}
