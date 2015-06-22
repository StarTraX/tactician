#include <pebble.h>
#include "wind_dir.h"
#include "dashboard.h"
static Window *s_window;

#define PI 3.14159265358979323846
#define RADIUS 72
//static int imageDataLength;

static void canvas_update_proc(Layer *this_layer, GContext *ctx) {
		graphics_context_set_fill_color(ctx, GColorBlack);

		int rowIdx, colIdx;

		//for ( colIdx =0; colIdx<144; colIdx++){ //top and bottom
		//	graphics_draw_pixel(ctx, GPoint(colIdx,0)) ;
		//	graphics_draw_pixel(ctx, GPoint(colIdx,143)) ;
		//}	
		GPoint A, B;
		GPoint centre = {71, 71};
		for (double angleDegs = 0; angleDegs<180; angleDegs+= 11.25){
			double angleMils= TRIG_MAX_ANGLE*angleDegs/180;
			//double oppAngleMils= TRIG_MAX_ANGLE*(-180-angleDegs)/180;
			A.x = centre.x + RADIUS* sin_lookup(angleMils)/ TRIG_MAX_RATIO;
			A.y = centre.y - RADIUS* cos_lookup(angleMils)/ TRIG_MAX_RATIO;
			B.x = centre.x - RADIUS* sin_lookup(angleMils)/ TRIG_MAX_RATIO;
			B.y = centre.y + RADIUS* cos_lookup(angleMils)/ TRIG_MAX_RATIO;
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
	/* --------------- display the wind image -------*/
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
static void set_text_layer( int dispIdx ){
	displayFields[dispIdx] = text_layer_create(GRect(0, 0, 144, 24)); //GPS Time
  	text_layer_set_font( displayFields[dispIdx], dispHdgFont1	);
  	layer_add_child(window_get_root_layer(s_window), (Layer *)displayFields[dispIdx]);
}

static void window_load(Window *window) {
//  Layer *window_layer = window_get_root_layer(window);
  s_canvas_layer = layer_create(GRect(0, 24, 144,144));
  layer_add_child(window_get_root_layer(window), s_canvas_layer);
  layer_set_update_proc(s_canvas_layer, canvas_update_proc);
//	for (int i = 0; i <SPEEDHDGCOUNT; i++){
		set_text_layer(GPSTIME);
//	}

}
static void window_unload(Window *window) {
	layer_destroy(s_canvas_layer);
	text_layer_destroy(displayFields[GPSTIME]);
  	window_stack_remove(s_window, true);
  	window_destroy(s_window);
	s_canvas_layer= NULL;
	s_window = NULL;
}
void disp_wind(void) {
	send_to_phone(TupletCString(100, "wind"));
	 s_window = window_create();
	 window_set_window_handlers(s_window, (WindowHandlers) {
		.load = window_load,
		.unload = window_unload,

	  });
	  window_stack_push(s_window, true);
	}


