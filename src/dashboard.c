#include <pebble.h>
#include "dashboard.h"
#include "main_menu.h"
#include  "alert.h"
#define WARNING_TIME 10 // seconds delay before warning data stopped from phone

TextLayer *perfPcDisp, *gpsTime;

char * currentCourseText;
char * courseDivsText; 
char * seriesList;
int mLoopCounter=0;
int seriesCount = 6;
int courseDivsCount = 0;
char Msg[100];
Tuple *dataReceived;
int mcount=0;
long msgReceivedTimestamp =2000000000; 
int intRole; // 0: admin, 1: crew

/* ------------ DECLARATIONS: ------*/
void checkMsgTime(struct tm *tick_time, TimeUnits units_changed);




/* ------------END DECLARATIONS ---*/
static char * currentWindow = "none";

void setCurrentWindow( char *  receivedCurrentWindow){ //send windowName or "none" in between 
	//printf("WATCH setCurrentWindow sent: %s", currentWindow);
	currentWindow = receivedCurrentWindow;
	DictionaryIterator * iter;	
	app_message_outbox_begin(&iter);
	Tuplet tuplet = TupletCString(100, currentWindow);
  	dict_write_tuplet(iter, &tuplet);
  	dict_write_end(iter);
	app_message_outbox_send();
}

void send_to_phone(Tuplet tuplet) { 
	//printf("send_to_phone key %d ", (int) tuplet.key);
	DictionaryIterator * iter;	
	app_message_outbox_begin(&iter);
  	dict_write_tuplet(iter, &tuplet);
  	dict_write_end(iter);
	app_message_outbox_send();
}
void in_dropped_handler(AppMessageResult reason, void *context) {	
	// printf("WATCH in_dropped_handler: %s", translate_error(reason));
 }

void in_received_handler(DictionaryIterator *iter, void *context) {
	msgReceivedTimestamp = time(NULL);
	 dataReceived =dict_read_first(iter);
	 while (dataReceived != NULL){
	 	//APP_LOG(APP_LOG_LEVEL_DEBUG,"dataReceived key: %d data: %s", (int) dataReceived->key,dataReceived->value->cstring);
	 
		 switch( dataReceived->key ) {
			 case COURSE: //37, marks of the course with distance & brg
				//APP_LOG(APP_LOG_LEVEL_INFO,"COURSE received");
			 	currentCourseText = realloc(currentCourseText, strlen(dataReceived->value->cstring)); //for current course display
				snprintf(currentCourseText, strlen(dataReceived->value->cstring),  " %s", dataReceived->value->cstring);
				if( displayFields[COURSE] != NULL ){ //to refresh on re-appear
					text_layer_set_text(displayFields[COURSE],currentCourseText);	
					setCurrentWindow("none");
				 }
				break;
	 		case FLAGDATALOADED: //44, from JS to indicate it's ready
				send_to_phone(TupletCString(106, "app_startup_initial"));
				splashScreenMessage = "   'bye, thanks.";
			 	window_stack_pop(true); //close the splash window
			 	show_main_menu();	
				break;
			 case COURSEDIVS: //43  ByteArray of list of courses for selected club, series and division (from Settings)
				courseDivsSize = dataReceived->length;
			 	courseDivsByteArray = realloc(courseDivsText,  courseDivsSize);
				memcpy(courseDivsByteArray, dataReceived->value->data, courseDivsSize) ;

			 	break;
			 case COURSEDIVSCOUNT: //42
			 	courseDivsCount = dataReceived->value->int32;
				send_to_phone(TupletCString(106, "app_startup_final")); // synchronous call workaround app msg doesn't like mixed data and sreings
				//APP_LOG(APP_LOG_LEVEL_INFO,"COURSEDIVSCOUNT: %d", courseDivsCount);
			 	break;

			case WPTNAME:
			 	wptName = dataReceived->value->cstring; //for nav_menu
//APP_LOG(APP_LOG_LEVEL_DEBUG, "WPTNAME: %s", wptName);
			 	if( displayFields[dataReceived->key] != NULL ){ 
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 	break;
			 case NEXTLEGNAME:
			 	nextLegName = dataReceived->value->cstring; //for nav_menu
			 	if( displayFields[dataReceived->key] != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
				if (nav_menu_layer != NULL){
					//APP_LOG(APP_LOG_LEVEL_DEBUG, "wptName received, menu_layer DISPLAYED");
					layer_mark_dirty((Layer *) nav_menu_layer);	
				}

			 	break;
			 case ROLE: // user's role: "admin" "crew" controls access to input functions
			 	intRole = strcmp(dataReceived->value->cstring, adminRole);

				 break;
			 case WINDDIREVEN: //60 // receive  even  bits 0,2,4...
				imageDataSize = (int) dataReceived->length;
				//APP_LOG(APP_LOG_LEVEL_DEBUG,"WATCH received %d EVEN bytes",imageDataSize );
				//memcpy(evenImageData, dataReceived->value->cstring, imageDataSize) ; //Base64 encoded
				memcpy(evenImageData, dataReceived->value->data, imageDataSize) ;
				//for  (int byteIdx=0; byteIdx<4; byteIdx++) 
				//	APP_LOG(APP_LOG_LEVEL_DEBUG,"Byte %d, value: %d ", byteIdx, (int) evenImageData[byteIdx]);
				if (s_canvas_layer!=NULL)
					layer_mark_dirty(s_canvas_layer);		
				break;	

		 	case WINDIRODD: //61: // receive odd  bits
				imageDataSize = (int) dataReceived->length;
				//APP_LOG(APP_LOG_LEVEL_DEBUG, "WATCH received ODD bytes");
				memcpy(oddImageData, dataReceived->value->data, imageDataSize) ;	
				//memcpy(oddImageData, dataReceived->value->cstring, imageDataSize) ;	//Base64 encoded
				//for  (int byteIdx=0; byteIdx<4; byteIdx++) 
				//	APP_LOG(APP_LOG_LEVEL_DEBUG,"Byte %d, value: %d ", byteIdx, (int) oddImageData[byteIdx]);
				if (s_canvas_layer!=NULL)
						layer_mark_dirty(s_canvas_layer);			
				break;	
			case 200: //200 test data from Logger
				//printf("WATCH received data from logger (200): %s", dataReceived->value->cstring);
			 	//splashScreenMessage = dataReceived->value->cstring;
				//text_layer_set_text(displayFields[FLAGDATALOADED],dataReceived->value->cstring );	

				break;
			 default : //where most of the work is done: receives all the data from 
				//APP_LOG(APP_LOG_LEVEL_DEBUG, "received data from logger. Key: %d:Value: %s", 
				//	(int) dataReceived->key, dataReceived->value->cstring);

			 	if( displayFields[dataReceived->key] != NULL ){ //check if the window hosting the text has been created
					text_layer_set_text(displayFields[dataReceived->key],dataReceived->value->cstring );	
				 }
			 	break;
		 } //switch
		dataReceived = dict_read_next(iter);
	 }// while
	 
	 free(dataReceived);
	// free(currentCourseText);
}

void checkMsgTime(struct tm *tick_time, TimeUnits units_changed) {

	int elapsedTime = time(NULL) - msgReceivedTimestamp;
	if(elapsedTime >= WARNING_TIME && strcmp(currentWindow, "none")!=0) {
		snprintf( Msg, 90, "No new data received for %d secs.", elapsedTime);
		if (alertWindowIsDisplayed){	 //check if the window hosting the text has been created	
			text_layer_set_text(displayFields[ALERTTIMER], Msg);	
		}
		else{
			show_alert(); //DEBUG - remove for testing
		}
	}
	else{
		if (alertWindowIsDisplayed){			
			APP_LOG(APP_LOG_LEVEL_DEBUG, "alertWindowIsDisplayed");
			window_stack_remove(alertWindow, true);	
		}
	}
}

 void dashboard_init(){
	displayFont1 = fonts_get_system_font(FONT_KEY_GOTHIC_28);	
	dispHdgFont1 = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);	
	page_heading  = text_layer_create(GRect(0, 0, 144, 26)); 
	text_layer_set_font( page_heading, dispHdgFont1);
	text_layer_set_text_alignment(page_heading,GTextAlignmentCenter);
	splashScreenMessage = "  Loading..."; //initial splash screen notice. to "Bye" message above 
	refreshingMsg = "Refreshing...";

	app_message_register_inbox_received(in_received_handler);
	app_message_register_inbox_dropped(in_dropped_handler);
	//app_message_register_outbox_failed(outbox_failed_callback);

	const uint32_t inbound_size = app_message_inbox_size_maximum();
	const uint32_t outbound_size =30;
   	app_message_open(inbound_size, outbound_size);
    tick_timer_service_subscribe(SECOND_UNIT, checkMsgTime);	 
	currentCourseText = malloc(1); //for current course display
	courseDivsText = malloc(1); 
	windImageData = malloc(1); 
	start = malloc(sizeof(int));
	histDataSize = malloc(sizeof(int));
	//printf("dashboard_init BEFORE imageData malloc: %d, Free %d",heap_bytes_used(), heap_bytes_free());
	evenImageData  = malloc(1296); //0,2,4...
	oddImageData = malloc(1296); //1,3,5

	
}  



void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  	//printf( "WATCH send SUCCESS ");	
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


