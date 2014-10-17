#include <pebble.h>
#include "dashboard.h"

TextLayer *perfPcDisp, *gpsTime;

char ** mAns;
int mLoopCounter=0;

//static int dispCounter=0;
 static void in_received_handler(DictionaryIterator *iter, void *context) {
	 //snprintf(mAns[GPSTIME], 20, "DashBd: %d", ++dispCounter);
	 //text_layer_set_text(perfPcDisp,"Dashboard" );
	 Tuple *dataReceived =dict_read_first(iter);
	 while (dataReceived != NULL){
		 if( text_layer_get_layer(displayFields[dataReceived->key] ) != NULL ){ //check if the window hosting the text has been created
			// if(window_is_loaded(layer_get_window(text_layer_get_layer(displayFields[dataReceived->key] )))) {//and the window is loaded				 
				snprintf(mAns[dataReceived->key], 20,  " %s", dataReceived->value->cstring);
				text_layer_set_text(displayFields[dataReceived->key],(mAns[dataReceived->key] ));		
			//}
		 }
		 dataReceived = dict_read_next(iter);
	 }
}
struct APP_MSG {
	char msg[50];
	int msg_count ; 
};
struct  APP_MSG * APP_MSGS;

char *translate_error(AppMessageResult result) {
	
  switch (result) {
    case APP_MSG_OK: return "APP_MSG_OK";
    case APP_MSG_SEND_TIMEOUT: return "SEND_TIMEOUT";
    case APP_MSG_SEND_REJECTED: return "SEND_REJECTED";
    case APP_MSG_NOT_CONNECTED: return "_NOT_CONNECTED";
    case APP_MSG_APP_NOT_RUNNING: return "APP_NOT_RUNNING";
    case APP_MSG_INVALID_ARGS: return "INVALID_ARGS";
    case APP_MSG_BUSY: return "BUSY";
    case APP_MSG_BUFFER_OVERFLOW: return "BUFFER_OVERFLOW";
    case APP_MSG_ALREADY_RELEASED: return "ALREADY_RELEASED";
    case APP_MSG_CALLBACK_ALREADY_REGISTERED: return "CALLBACK_ALREADY_REGISTERED";
    case APP_MSG_CALLBACK_NOT_REGISTERED: return "CALLBACK_NOT_REGISTERED";
    case APP_MSG_OUT_OF_MEMORY: return "OUT_OF_MEMORY";
    case APP_MSG_CLOSED: return "CLOSED";
    case APP_MSG_INTERNAL_ERROR: return "INTERNAL_ERROR";
    default: return "UNKNOWN ERROR";
  }
}
void in_dropped_handler(AppMessageResult reason, void *context) {
	//if (reason ==APP_MSG_BUSY||reason ==APP_MSG_BUFFER_OVERFLOW  ){
	 // snprintf(mAns[PERFPCDISP], 20, "%d /n %s",dispCounter++, translate_error(reason));
    // text_layer_set_text(displayFields[PERFPCDISP], mAns[PERFPCDISP] );
 }


void build_app_msgs(){
/*    strcpy((APP_MSGS+ APP_MSG_OK)->msg, "APP_MSG_OK");

//    strcpy((APP_MSGS+ APP_MSG_SEND_TIMEOUT)->msg,"APP_MSG_SEND_TIMEOUT");
    strcpy((APP_MSGS+ APP_MSG_SEND_REJECTED)->msg,"APP_MSG_SEND_REJECTED");
   strcpy((APP_MSGS+ APP_MSG_NOT_CONNECTED)->msg,"APP_MSG_NOT_CONNECTED");
    strcpy((APP_MSGS+ APP_MSG_APP_NOT_RUNNING)->msg,"APP_MSG_APP_NOT_RUNNING");
    strcpy((APP_MSGS+ APP_MSG_INVALID_ARGS)->msg,"APP_MSG_INVALID_ARGS");
  */
	strcpy((APP_MSGS+ APP_MSG_BUSY)->msg,"BUSY");
	    (APP_MSGS+ APP_MSG_BUSY)->msg_count = 0;
	strcpy((APP_MSGS+ APP_MSG_BUFFER_OVERFLOW)->msg,"BUFFER_OVERFLOW");
	(APP_MSGS+ APP_MSG_BUFFER_OVERFLOW)->msg_count = 0;
	/*
    strcpy((APP_MSGS+ APP_MSG_ALREADY_RELEASED)->msg,"_ALREADY_RELEASED");
    strcpy((APP_MSGS+ APP_MSG_CALLBACK_ALREADY_REGISTERED)->msg,"CALLBACK_ALREADY_REGISTERED");
    strcpy((APP_MSGS+ APP_MSG_CALLBACK_NOT_REGISTERED)->msg,"CALLBACK_NOT_REGISTERED");
    strcpy((APP_MSGS+ APP_MSG_OUT_OF_MEMORY)->msg,"OUT_OF_MEMORY");
    strcpy((APP_MSGS+ APP_MSG_CLOSED)->msg,"CLOSED");
    strcpy((APP_MSGS+ APP_MSG_INTERNAL_ERROR)->msg,"INTERNAL_ERROR");

    (APP_MSGS+ APP_MSG_OK)->msg_count = 0;
    (APP_MSGS+ APP_MSG_SEND_TIMEOUT)->msg_count = 0;
    (APP_MSGS+ APP_MSG_SEND_REJECTED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_NOT_CONNECTED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_APP_NOT_RUNNING)->msg_count = 0;
    (APP_MSGS+ APP_MSG_INVALID_ARGS)->msg_count = 0;

    (APP_MSGS+ APP_MSG_BUFFER_OVERFLOW)->msg_count = 0;
    (APP_MSGS+ APP_MSG_ALREADY_RELEASED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_CALLBACK_ALREADY_REGISTERED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_CALLBACK_NOT_REGISTERED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_OUT_OF_MEMORY)->msg_count = 0;
    (APP_MSGS+ APP_MSG_CLOSED)->msg_count = 0;
    (APP_MSGS+ APP_MSG_INTERNAL_ERROR)->msg_count = 0;
*/
}

 void dashboard_init(){
	APP_MSGS = malloc(sizeof(struct APP_MSG )*512); // store msgs and frq
	s_res_gothic_28 = fonts_get_system_font(FONT_KEY_GOTHIC_28);	

	//build_app_msgs();
	 mAns=malloc(numberOfDisplays * sizeof(char *));
	 mAns[0] = malloc(numberOfDisplays * DISP_WIDTH * sizeof(char));
	 
	 for (int i =0; i<numberOfDisplays; i++ ){	  
	  	mAns[i] = mAns[0] + i * DISP_WIDTH;

     }
	 //gpsTime = text_layer_create(GRect(0, 0, 144, 40)); //
	 //perfPcDisp = text_layer_create(GRect(0, 40, 144, 40)); //
	// perfActualBtv = text_layer_create(GRect(0, 80, 144, 40)); //
	// perfActualTWA = text_layer_create(GRect(0, 120, 144, 40)); //
	 
 	app_message_register_inbox_received(in_received_handler);
   app_message_register_inbox_dropped(in_dropped_handler);
	 
	const uint32_t inbound_size = 1024;
	const uint32_t outbound_size = 1024;
   app_message_open(inbound_size, outbound_size);
}
