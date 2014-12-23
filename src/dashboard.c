#include <pebble.h>
#include "dashboard.h"
	#include "main_menu.h"

TextLayer *perfPcDisp, *gpsTime;

//char ** mAns;
char * currentCourseText;
char * courseDivsText; 
char * seriesList;
int mLoopCounter=0;
int seriesCount = 6;
int courseDivsCount = 0;
char Msg[100];
Tuple *dataReceived;
int mcount=0;
//static int dispCounter=0;
static bool isEB = false;
 static void in_received_handler(DictionaryIterator *iter, void *context) {
	 //if ( heap_bytes_free()<300){
	 	//snprintf(Msg,60, "Free heap :  %d ",heap_bytes_free());
		//APP_LOG(APP_LOG_LEVEL_DEBUG,Msg);
	 //}

	 dataReceived =dict_read_first(iter);
	 while (dataReceived != NULL){

		 switch( dataReceived->key ) {
			 case COURSE:
			 	currentCourseText = malloc(sizeof(char)*strlen(dataReceived->value->cstring)); //for current course display
				snprintf(currentCourseText, strlen(dataReceived->value->cstring),  " %s", dataReceived->value->cstring);
			 	//APP_LOG(APP_LOG_LEVEL_DEBUG,currentCourseText);
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"COURSE received");
				break;
	 		case SERIESLIST: // long list of | delimited series names
			 	 seriesList= malloc(sizeof(char)*strlen(dataReceived->value->cstring)); //for delimited course list
				snprintf(seriesList, strlen(dataReceived->value->cstring),  "%s", dataReceived->value->cstring);	
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"SERIESLIST received");
			 	break;
			 case SERIESCOUNT: 
			 	seriesCount = dataReceived->value->uint32;
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"COURSE received");
				 break;
			 case COURSEDIVS:
			 	courseDivsText = malloc(sizeof(char)*strlen(dataReceived->value->cstring));
			 	snprintf(courseDivsText, strlen(dataReceived->value->cstring),  "%s", dataReceived->value->cstring);
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"COURSEDIVS received");
			 	break;
			 case COURSEDIVSCOUNT:
			 	courseDivsCount = dataReceived->value->uint32;
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"COURSEDIVSCOUNT received");
			 	break;
			 case FLAGDATALOADED: //special case when data is loaded		 	
			 	splashScreenMessage = "   'bye, thanks.";
			 window_stack_pop(true); //close the splash window
			 	show_main_menu();
			 	//APP_LOG(APP_LOG_LEVEL_INFO,"FLAGDATALOADED received");
			 	break;
			 // the next bunch are required in menus as well as in display windows so...
			 /*
			 case COURSENAME:
			 	courseName = dataReceived->value->cstring;
			 	if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 break;
			 case SERIESNAME:
			 	seriesName = dataReceived->value->cstring;
			 	if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 break;
			 */
			case WPTNAME:
			 	wptName = dataReceived->value->cstring;
			 	if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 break;
			 case NEXTLEGNAME:
			 	nextLegName = dataReceived->value->cstring;
			 	if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 break;
			 
			 default :
			 	if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
					//snprintf(mAns[dataReceived->key], DISP_WIDTH,  " %s", dataReceived->value->cstring);
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }

			 break;
			 /*
			 default :
				 snprintf(mAns[dataReceived->key], DISP_WIDTH,  " %s", dataReceived->value->cstring);
			 	//Layer thisLayer = text_layer_get_layer(displayFields[dataReceived->key] );
				 if( text_layer_get_layer(displayFields[dataReceived->key]) != NULL ){ //check if the window hosting the text has been created
						text_layer_set_text(displayFields[dataReceived->key],mAns[dataReceived->key] );	
				 }
			 	break;
				*/
		 } //switch
		 /* DEBUGGING 
		 if (isEB==true){
			if( strstr (mAns[WPTNAME],"EB")== NULL){ // EB now NOT in mAns[WPTNAME]
				 	snprintf(Msg, 100, "In switch FROM EB : On dataReceived->key %d, msg value :  %s ", 
					 (int) dataReceived->key,
						dataReceived->value->cstring	);
				APP_LOG(APP_LOG_LEVEL_ERROR,Msg);
				 isEB = false;
			}
		 }
		else {
			if( strstr (mAns[WPTNAME],"EB")!= NULL){ // EB now in mAns[WPTNAME]
				snprintf(Msg, 100, "In switch TO EB: On dataReceived->key %d, msg value :  %s ", 
					 (int) dataReceived->key,dataReceived->value->cstring	);
				APP_LOG(APP_LOG_LEVEL_ERROR,Msg);				
				isEB = true;
			 mAns[WPTNAME] = "RESET";
		 }

		}
		*/
		dataReceived = dict_read_next(iter);

	 }// while
	 
	 free(dataReceived);
	// free(currentCourseText);
}

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
void send_to_phone(Tuplet tuple) {
	DictionaryIterator * iter;	
	app_message_outbox_begin(&iter);
  	dict_write_tuplet(iter, &tuple);
  	dict_write_end(iter);
	app_message_outbox_send();
	//int reason = app_message_outbox_send();
	//snprintf(buff, 100, "send_to_phone %s", translate_error(reason));	
	//APP_LOG(APP_LOG_LEVEL_DEBUG,buff);
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
	displayFont1 = fonts_get_system_font(FONT_KEY_GOTHIC_28);	
	dispHdgFont1 = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);	
	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, dispHdgFont1);
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
/*
	 mAns=malloc(numberOfDisplays * sizeof(char *));
	 mAns[0] = malloc(numberOfDisplays * DISP_WIDTH * sizeof(char));	 
	 for (int i =0; i<numberOfDisplays; i++ )	 { 
	  	mAns[i] = mAns[0] + i * DISP_WIDTH;
		// displayFields[i] = displayFields[0] + i;
     }
*/
	 splashScreenMessage = "  Loading..."; //initial splash screen notice. to "Bye" message above 
	 refreshingMsg = "Refreshing...";
	app_message_register_inbox_received(in_received_handler);
	app_message_register_inbox_dropped(in_dropped_handler);
	app_message_register_outbox_failed(outbox_failed_callback);
	app_message_register_outbox_sent(outbox_sent_callback);
	const uint32_t inbound_size = app_message_inbox_size_maximum();
	//const uint32_t outbound_size = app_message_outbox_size_maximum();
	const uint32_t outbound_size =30;
   	app_message_open(inbound_size, outbound_size);

}
