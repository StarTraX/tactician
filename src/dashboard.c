#include <pebble.h>
#include "dashboard.h"
	#include "main_menu.h"

TextLayer *perfPcDisp, *gpsTime;

char ** mAns;
char * currentCourseText;
char * courseDivsText; 
char * seriesList;
int mLoopCounter=0;
int seriesCount = 6;
int courseDivsCount = 0;
char  Msg[100];
Tuple *dataReceived;

//static int dispCounter=0;
 static void in_received_handler(DictionaryIterator *iter, void *context) {

	snprintf(Msg, 100,  "Heap free: %d", heap_bytes_free());
 	APP_LOG(APP_LOG_LEVEL_INFO, Msg);
	 dataReceived =dict_read_first(iter);
	 while (dataReceived != NULL){
		 switch( dataReceived->key ) {
			 case COURSE:
			 	currentCourseText = malloc(sizeof(char)*strlen(dataReceived->value->cstring)); //for current course display
				snprintf(currentCourseText, strlen(dataReceived->value->cstring),  " %s", dataReceived->value->cstring);
			 	//APP_LOG(APP_LOG_LEVEL_DEBUG,currentCourseText);
				break;
			 case SERIESLIST: // long list of | delimited series names
			 	 seriesList= malloc(sizeof(char)*strlen(dataReceived->value->cstring)); //for delimited course list
				snprintf(seriesList, strlen(dataReceived->value->cstring),  "%s", dataReceived->value->cstring);	
			 	break;
			 case SERIESCOUNT: 
			 	seriesCount = dataReceived->value->uint32;
				 break;
			 case COURSEDIVS:
			 	courseDivsText = malloc(sizeof(char)*strlen(dataReceived->value->cstring));
			 	snprintf(courseDivsText, strlen(dataReceived->value->cstring),  "%s", dataReceived->value->cstring);
			 	break;
			 case COURSEDIVSCOUNT:
			 	courseDivsCount = dataReceived->value->uint32;
			 break;
			 case FLAGDATALOADED: //special case when data is loaded
			 	mAns[FLAGDATALOADED] = "   'bye, thanks.";
			 	show_main_menu();
			 	break;
			 default :
				 snprintf(mAns[dataReceived->key], DISP_WIDTH,  " %s", dataReceived->value->cstring);
				 if( text_layer_get_layer(displayFields[dataReceived->key] ) != NULL ){ //check if the window hosting the text has been created
					// if(window_is_loaded(layer_get_window(text_layer_get_layer(displayFields[dataReceived->key] )))) {//and the window is loaded				 
						//snprintf(mAns[dataReceived->key], 20,  " %s", dataReceived->value->cstring);
						text_layer_set_text(displayFields[dataReceived->key],(mAns[dataReceived->key] ));	
					  //APP_LOG(APP_LOG_LEVEL_DEBUG, mAns[dataReceived->key]);
					//}
				 }
			 	break;
		 } //switch
		 dataReceived = dict_read_next(iter);
	 }
	 free(dataReceived);
}
/*struct APP_MSG {
	char msg[50];
	int msg_count ; 
};
struct  APP_MSG * APP_MSGS;
*/
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
void send_to_phone() {
	//app_comm_set_sniff_interval	(SNIFF_INTERVAL_REDUCED);
	// Byte array + key:
	static const uint32_t SOME_DATA_KEY =100;
	static const uint8_t data[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};

	// CString + key:
	static const uint32_t SOME_STRING_KEY =101;
	static const char *string = "Hello World";

	// Calculate the buffer size that is needed for the final Dictionary:
	const uint8_t key_count = 2;
	const uint32_t size = dict_calc_buffer_size(key_count, sizeof(data),
												strlen(string) + 1);

	// Stack-allocated buffer in which to create the Dictionary:
	uint8_t buffer[size];

	DictionaryIterator * iter;

	//dict_write_begin(&iter, buffer, sizeof(buffer));
	//dict_write_data(&iter, SOME_DATA_KEY, data, sizeof(data));
	//dict_write_cstring(&iter, SOME_STRING_KEY, string);
	//dict_write_end(&iter);
	
	app_message_outbox_begin(&iter);
	Tuplet tuple = TupletInteger(101,999);

  	dict_write_tuplet(iter, &tuple);
  	dict_write_end(iter);
	char  buff[100];
	/*
	Tuple *dataSent =dict_read_first(&iter);
	while (dataSent != NULL){
		 switch( dataSent->key ) {
			 case 101 :
			 snprintf(buff, 101, "dataSent 101: %s", dataSent->value->cstring);
			 APP_LOG(APP_LOG_LEVEL_DEBUG,buff);
		 }
		dataSent = dict_read_next(&iter);
	 }
	*/
	
	
	int reason = app_message_outbox_send();
	 snprintf(buff, 100, "send_to_phone %s", translate_error(reason));	
	APP_LOG(APP_LOG_LEVEL_DEBUG,buff);
}
void in_dropped_handler(AppMessageResult reason, void *context) {
	char  buff[100];
	 snprintf(buff, 100, "in_dropped_handler: %s", translate_error(reason));
	APP_LOG(APP_LOG_LEVEL_DEBUG,buff);
 }
static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context) {
  	char  buff[100];
	 snprintf(buff, 100, "outbox_failed_callback %s", translate_error(reason));	
	APP_LOG(APP_LOG_LEVEL_DEBUG,buff);
		//app_comm_set_sniff_interval	(SNIFF_INTERVAL_NORMAL);

}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox send success!");
	//app_comm_set_sniff_interval	(SNIFF_INTERVAL_NORMAL);

}
 void dashboard_init(){
	//APP_MSGS = malloc(sizeof(struct APP_MSG )*512); // store msgs and frq
	s_res_gothic_28 = fonts_get_system_font(FONT_KEY_GOTHIC_28);	
	//build_app_msgs();
	 mAns=malloc(numberOfDisplays * sizeof(char *));
	 mAns[0] = malloc(numberOfDisplays * DISP_WIDTH * sizeof(char));	 
	 for (int i =0; i<numberOfDisplays; i++ )	  
	  	mAns[i] = mAns[0] + i * DISP_WIDTH;
	 mAns[FLAGDATALOADED] = "  Loading..."; //initial splash screen notice. to "Bye" message above 
	app_message_register_inbox_received(in_received_handler);
	app_message_register_inbox_dropped(in_dropped_handler);
	app_message_register_outbox_failed(outbox_failed_callback);
	app_message_register_outbox_sent(outbox_sent_callback);
	const uint32_t inbound_size = app_message_inbox_size_maximum();
	const uint32_t outbound_size = app_message_outbox_size_maximum();
   	app_message_open(inbound_size, outbound_size);

}
