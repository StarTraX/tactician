#include <pebble.h>
#include "wind_dir.h"
#include "dashboard.h"
static Window *s_window;
static const int RADIUS=72;
static const char twdBackgroundVerticalgGidlinePos[] = // built from pws/dashboard/wind/index.php
		{1,16,0,2,32,0,4,64,0,8,128,0,16,0,2,32,0,4,64,0,8,128,0,16,0,2,32,0,4,64,0,8,128,
		 0,16,0,2,32,0,4,64,0,8,128,0,16,0,1,32,0,4,64,0,8,128,0,0};

static const int actualImageWidth =  452; //(int)(144 * 3.14159); //452
//int actualImageWidthInt =  (int)(144 * 3.14159); //452000 for integer arithmetic
char * twdBackgroundImageBitArray;
static int whichWindow = 0 ; //0=rose, 1=Recent
/*
extern char * windImageData;
extern int windImageDataSize;
extern int imageDataSize;
extern char * twdWindDirImageRecentBitArray;
extern int * start;
extern int * histDataSize;

extern TextLayer * displayFields[];
extern char * oddImageData;
extern char * evenImageData;
extern Layer *s_canvas_layer;

extern GFont displayFont1, dispHdgFont1;
*/
/*
void wind_rose(GContext *ctx) {
		graphics_context_set_fill_color(ctx, GColorBlack);

		int rowIdx, colIdx;

		//for ( colIdx =0; colIdx<144; colIdx++){ //top and bottom
		//	graphics_draw_pixel(ctx, GPoint(colIdx,0)) ;
		//	graphics_draw_pixel(ctx, GPoint(colIdx,143)) ;
		//}	
		GPoint A, B;
		GPoint centre = {71, 71};
		for (int angleDegs = 0; angleDegs<18000; angleDegs+= 1125){ //keep as int ( was 180 and 11.25, mult by 100 to get integers
			//double angleMils= TRIG_MAX_ANGLE*angleDegs/180; // do the math in the call to save double
			A.x = centre.x + RADIUS* sin_lookup(TRIG_MAX_ANGLE*angleDegs/18000)/ TRIG_MAX_RATIO;
			A.y = centre.y - RADIUS* cos_lookup(TRIG_MAX_ANGLE*angleDegs/18000)/ TRIG_MAX_RATIO;
			B.x = centre.x - RADIUS* sin_lookup(TRIG_MAX_ANGLE*angleDegs/18000)/ TRIG_MAX_RATIO;
			B.y = centre.y + RADIUS* cos_lookup(TRIG_MAX_ANGLE*angleDegs/18000)/ TRIG_MAX_RATIO;
			graphics_draw_line(ctx,A, B);
		}
		graphics_context_set_text_color(ctx, GColorBlack);
		GFont ordinalFont = fonts_get_system_font(FONT_KEY_GOTHIC_14);
		graphics_draw_text(ctx, "NE" , ordinalFont, GRect(125,10,20,20) , 
						   GTextOverflowModeWordWrap, 
						   GTextAlignmentLeft, 
						   NULL);
		graphics_draw_text(ctx, "NW" , ordinalFont, GRect(5,10,20,20) , 
						   GTextOverflowModeWordWrap, 
						   GTextAlignmentLeft, 
						   NULL);
		graphics_draw_text(ctx, "SE" , ordinalFont, GRect(125,115,20,20) , 
						   GTextOverflowModeWordWrap, 
						   GTextAlignmentLeft, 
						   NULL);
		graphics_draw_text(ctx, "SW" , ordinalFont, GRect(5,115,20,20) , 
						   GTextOverflowModeWordWrap, 
						   GTextAlignmentLeft, 
						   NULL);
	
		graphics_context_set_fill_color(ctx, GColorWhite);
		graphics_fill_circle( ctx, centre , 5);
	
		graphics_context_set_fill_color(ctx, GColorBlack);
		graphics_draw_circle(ctx, GPoint(71,71), 72);

	// --------------- display the wind image -------
		int ptr=0; // bit location pointer
		for (int idx = 0; idx <windImageDataSize ; idx +=2 ){// step thru every two chars
			ptr += windImageData[idx]; //increment ptr by the number of spaces in the first char of this pair
			//if (windImageData[idx+1]>0) {// more than zero filled pixels
				for (int filledPixelCount = 0 ;filledPixelCount < windImageData[idx+1]; filledPixelCount++ ){		
					rowIdx = ptr /144; // 144 px per row
					colIdx = ptr % 144;
					graphics_draw_pixel(ctx, GPoint(rowIdx,colIdx) );
					ptr++;
				}
			//}
		}		
	}


*/

/*
void wind_Old_recent_history(GContext *ctx) {

	//printf ("start canvas_update_proc: Free %d", heap_bytes_free() );
	int colIdx; //column
	int rowIdx; //row
	static const int rowMax = 144;
	static const int colMax = 144;

	//------build the cumulative array ---------
	int mSize =*histDataSize; 
	static int mSumArray[2000];
	int runningTotal=0;	
	for (int i=0; i<mSize; i++){
		runningTotal = runningTotal + twdWindDirImageRecentBitArray[i];
		mSumArray[i] = runningTotal; 
	} 
	int prevAddress = 0;
	int windImageStart = *start - 90; //  is 90 degrees left of the MEAN (*start)
	windImageStart +=(windImageStart<0?360:0); //  
	int j = 0; //the start address for the final lookup

	int startPx = (*start -90); // start is the MEAN, so we offset by 90 degrees
	//startPx += 360*(startPx<0?1:0); // ensure 0< x< 360
	startPx *= 1.26 ; // 2*72*3.14159/360;  // convert to px pos on the "wide screen"
	for (rowIdx=0; rowIdx < rowMax-20; rowIdx++){ //row
		for (colIdx=0; colIdx < colMax; colIdx++){ //column 0->144
			int sourceX = startPx + scaleMap[colIdx]; // 
			//printf("HERE  startPx %d scaleMap[colIdx] %d sourceX %d", startPx, scaleMap[colIdx], sourceX);
			sourceX -= actualImageWidth*(sourceX > actualImageWidth?1:0); // fold it back 
			//printf("HERE  sourceX %d", sourceX);
			int bitAddress = rowIdx * actualImageWidth // 452 bits Px per row x 1000 (for integer arithmetic
				 + sourceX; 
			int arrayIdx = (int) bitAddress/8; // it's an 8  byte
			int bitIdx =  bitAddress % 8;
			int pxValue; //gets set to 1 if the source image pixel is set

			if (rowIdx <20){ //print Heading
				//printf ("arrayIdx: %d bitAddress: %d ",arrayIdx, bitAddress);
				pxValue = (1 << bitIdx) & twdBackgroundImageBitArray[arrayIdx] ;
				if (pxValue >0 ) 
					graphics_draw_pixel(ctx, GPoint(colIdx,rowIdx));
			}
			if (rowIdx == 0) { //print vertical grid lines from here down
				pxValue = (1 << bitIdx) & twdBackgroundVerticalgGidlinePos[arrayIdx] ;
				if (pxValue >0 ) {
					graphics_draw_line(ctx, GPoint(colIdx, 20) ,GPoint(colIdx, 144));
				}	
			}
			 // print the wind line from row 20 down
				if (bitAddress > prevAddress)
					j = prevAddress;
				else j = 0;
				prevAddress = j;
				//bool found = false;

				for (int i = 0; i < mSize; i++){
					//printf("i:%d bitAddress: %d " ,i, bitAddress); 
					if (bitAddress < mSumArray[i]){//found the byte
						if ( (i & 1) ==1){// test if the index value is odd
							graphics_draw_pixel(ctx, GPoint((colIdx),rowIdx+20));
							//printf("Found one at i= %d bitAddress %d sumArray[i] = %d ",i, 
							//	bitAddress, mSumArray[i]);
						}
						break;
					} 
				}  //for
		} // colIdx loop
	} //rowIdx loop
	
}
*/
 
static void canvas_update_proc(Layer *this_layer, GContext *ctx) {
	/* --------------- display the RECENT WIND HISTORY ------*/
	int rowIdx, colIdx, ptr;
	for (int byteIdx = 0; byteIdx <imageDataSize ; byteIdx ++ ){// 
		rowIdx = byteIdx/9; // 144 cols, /8 bytes - 18, /2 (odd&even) = 9
		colIdx = byteIdx % 9; 
		char bitMask = 0x1;
		ptr = colIdx*16;
		for (int bitIdx = 0; bitIdx <8; bitIdx++) { // loop around each bit in this byte
			//printf("bitMask 0x %02x", bitMask);
			if ((evenImageData[byteIdx] & bitMask) > 0) {
				//printf("even print at ptr %d", ptr);
				graphics_draw_pixel(ctx, GPoint(ptr, rowIdx) );
			}
			ptr++;
			if ((oddImageData[byteIdx] & bitMask) > 0) {
				//printf("Odd  print at ptr %d", ptr);
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
static void click_config_provider(void *context) {
  // Register the ClickHandlers
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
 }
static void window_load(Window *window) {
	s_canvas_layer = layer_create(GRect(0, 24, 144,144));
  	layer_add_child(window_get_root_layer(window), s_canvas_layer);
  	layer_set_update_proc(s_canvas_layer, canvas_update_proc);
	set_text_layer(GPSTIME);
	setCurrentWindow( "windRose");
}

static void window_unload(Window *window) {
	setCurrentWindow( "none");
	layer_destroy(s_canvas_layer);
	text_layer_destroy(displayFields[GPSTIME]);
  	window_stack_remove(s_window, true);
  	window_destroy(s_window);
	s_canvas_layer= NULL;
	s_window = NULL;
}
void disp_wind(void) {
	if (whichWindow ==0 )
		setCurrentWindow( "windRose"); //windRose
	else 
		setCurrentWindow( "windRecent");
 	/*ResHandle handle = resource_get_handle(RESOURCE_ID_HEADING_BIT_ARRAY); //top 20 rows of the heading image bit array
  	size_t res_size = resource_size(handle);
	twdBackgroundImageBitArray = malloc(res_size);
	resource_load(handle , (uint8_t*) twdBackgroundImageBitArray, res_size);
*/
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


