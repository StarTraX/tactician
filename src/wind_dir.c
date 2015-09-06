#include <pebble.h>
#include "wind_dir.h"
#include "dashboard.h"
static Window *s_window;

static int whichWindow = 0 ; //0=rose, 1=Recent

static void canvas8_update_proc(Layer *this_layer, GContext *ctx) {
	int rowIdx, colIdx, ptr;
	for (int byteIdx = 0; byteIdx <imageDataSize ; byteIdx ++ ){// imageDataSize is the length of the data (1296 bytes)
		rowIdx = byteIdx/9; // 144 cols, /8 bytes - 18, /2 (odd&even) = 9
		colIdx = byteIdx % 9; 
		char bitMask = 0x1;
		ptr = colIdx*16;
		for (int bitIdx = 0; bitIdx <8; bitIdx++) { // loop around each bit in this byte
			if ((evenImageData[byteIdx] & bitMask) > 0) {
				graphics_draw_pixel(ctx, GPoint(ptr, rowIdx) );
			}
			ptr++;
	
			if ((oddImageData[byteIdx] & bitMask) > 0) {
				graphics_draw_pixel(ctx, GPoint(ptr, rowIdx) );
			}
			bitMask = bitMask*2;
			ptr++;
		}
	}
	if (whichWindow ==0 )
	 	setCurrentWindow( "windRose");
	else	
	 	setCurrentWindow( "windRecent"); 
}
 char base64Decode(char byteValue){
	char decodedByte;
		if (byteValue == 43) decodedByte = 62; // + -> 62
		else if (byteValue == 47) decodedByte = 63; // / -> 63
		else if (byteValue <=57) decodedByte =  byteValue +4; // numerics
		else if (byteValue <=90) decodedByte =  byteValue -65; //uppercase
		else   decodedByte =  byteValue -71; //lower case

	return decodedByte;
}
/* receives Base64-encoded data in sextets, not octet bytes

 */
static void canvas6_update_proc(Layer *this_layer, GContext *ctx) {
	APP_LOG(APP_LOG_LEVEL_DEBUG, "evenImageData  : %s", & evenImageData[0]);
	APP_LOG(APP_LOG_LEVEL_DEBUG, "oddImageData  : %s", & oddImageData[0]);

	int rowIdx, colIdx;
	int ptr = 0 ; // the 
	char bitMask ;
	for (int byteIdx = 0; byteIdx <imageDataSize ; byteIdx ++ ){// imageDataSize is the length of the data (1728 bytes)
		rowIdx = byteIdx/12; //(int) 144 cols, /6 bits/sextet = 24 octects per row, /2 (odd&even) =12
		// the start x-value for this pair of sextets
		colIdx = byteIdx % 12; // 
		ptr = colIdx*12; // x-value for the first bit in this pair of 
		char evenByte = base64Decode(evenImageData[byteIdx]);
		char oddByte  = base64Decode(oddImageData[byteIdx]);


		bitMask = 0x1; // the least significant bit of the byte
	for (int bitIdx = 0; bitIdx <6; bitIdx++) { // loop around each bit in this sextet
			if ((evenByte & bitMask) > 0) 
				graphics_draw_pixel(ctx, GPoint(ptr, rowIdx) );
			ptr++;
			if ((oddByte & bitMask) > 0) 
				graphics_draw_pixel(ctx, GPoint(ptr, rowIdx) );
			bitMask = bitMask*2;
			ptr++;
		}
	}		
	if (whichWindow ==0 )
	 	setCurrentWindow( "windRose");
	else	
	 	setCurrentWindow( "windRecent"); 
}
static void set_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, -5, 144, 24)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], dispHdgFont1	);
  	layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[dispIdx]);
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
	vibes_short_pulse();
	if (whichWindow ==0 ){ // toggle
		whichWindow=1;
	 	setCurrentWindow( "windRecent");
	}	
	else {
		whichWindow=0;
	 	setCurrentWindow( "windRose"); // was windRose
	} 
}
static void click_config_provider(void *context) {  // Register the ClickHandlers to toggle between 
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
 }
static void window_load(Window *window) {
	s_canvas_layer = layer_create(GRect(0, 24, 144,144));
  	layer_add_child(window_get_root_layer(window), s_canvas_layer);
  	layer_set_update_proc(s_canvas_layer, canvas8_update_proc);
	set_text_layer(GPSTIME);
	setCurrentWindow( "windRose");
}

static void window_unload(Window *window) {
	setCurrentWindow( "none");
	layer_destroy(s_canvas_layer);
	s_canvas_layer= NULL;
	text_layer_destroy(displayFields[GPSTIME]);
  	window_stack_remove(s_window, true);
  	window_destroy(s_window);
	s_window = NULL;
}
void disp_wind(void) {
	if (whichWindow ==0 )
		setCurrentWindow( "windRose"); //windRose
	else 
		setCurrentWindow( "windRecent");
	
	s_window = window_create();
	window_set_window_handlers(s_window, (WindowHandlers) {
		.load = window_load,
		.unload = window_unload,

	  });  

	window_set_click_config_provider(s_window, click_config_provider);
#ifdef PBL_PLATFORM_APLITE
	window_set_fullscreen(s_window, true);
#endif
	window_stack_push(s_window, true);
	}


