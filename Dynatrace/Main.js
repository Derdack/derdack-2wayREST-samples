
var request = require('request');

const Result = require('./Result');
var Logger = require('./Logger');

module.exports = {
    onDispose: async function (callback) {
        callback(null, await onDispose());
    },    
    // Useful to let this app be configured in a UI by the user
    onGetAppConfig: async function (callback) {
        callback(null, await onGetAppConfig());
    },
    // Useful to let this app be configured in a UI by the user
    onConfigureApp: async function (callback, context) {
        callback(null, await onConfigureApp(context));
    },
    // Handle various events from EA related to the team or alerts
    onSubscriptionEvent: async function (callback, event) {
        callback(null, await onSubscriptionEvent(event));
    },
    onGetProcessId: function (callback) {
        callback(null, (() => {
            let process = require('process');
            return process.pid;
        })());
    },
    setLogger: (logger) => {
        Logger = logger;
    }
};




// Context with config and callbacks from EA
var appContext = null;


async function onConfigureApp(context)
{
    let fnName = onConfigureApp.name;
    try
    {
        // Save app context locally here in that script. This is not failure save, of course
        //
        appContext = context;

        // Build callbacks that allow us to send events to EA
        //
        if (appContext.state.callbackSaveState != undefined)
            appContext.state.callbackSaveState = eval(appContext.state.callbackSaveState);
        else
            appContext.state.callbackSaveState = () => {};
        
        if (appContext.runtimeInfo.callbackSetStatusError != undefined)
                appContext.runtimeInfo.callbackSetStatusError = eval(appContext.runtimeInfo.callbackSetStatusError);
        else
            appContext.runtimeInfo.callbackSetStatusError = () => {};


        if (appContext.runtimeInfo.callbackSetStatusOK != undefined)
            appContext.runtimeInfo.callbackSetStatusOK = eval(appContext.runtimeInfo.callbackSetStatusOK);
        else
            appContext.runtimeInfo.callbackSetStatusOK = () => {};

        if (appContext.runtimeInfo.callbackSendMail != undefined)
            appContext.runtimeInfo.callbackSendMail = eval(appContext.runtimeInfo.callbackSendMail);
        else
            appContext.runtimeInfo.callbackSendMail = () => {};

		Logger.writeLog(fnName, `Configured Target Url: ${appContext.config.targetUrl}`);        
        return true;
    }
    catch (error)
    {
        Logger.writeLog(fnName, `Error on handling configuration: ${error.message}`);
        return false;
    }
}

async function onGetAppConfig()
{
    // App could update config with e.g. a current connection status
    //
    return appContext.config;
}


async function onSubscriptionEvent(event) 
{
    let fnName = onSubscriptionEvent.name;

    try
    {				
		// Get Event ID 
		var eventId = event.alert.externalEventId;
		Logger.writeLog(fnName, "Value EventID: " + eventId);
				
		// Exit if no ZabbixEventID found
		if (eventId == "") {
			return true;
		}

        let pid = "";
        for (param of event.alert.parameters) 
        {
            if (param.name.toLocaleLowerCase() == "pid")
            {
                pid = param.value;
                break;
            }
        }

        if (pid == "")
        {
            Logger.writeLog(fnName, `Problem update in Dynatrace failed. Could not extract Problem internal ID from event parameters. Please make sure to include "PID":"{PID}" in the webhook payload that gets sent from Dynatrace to EnterpriseAlert..`);
            return;
        }


        Logger.writeLog(fnName, `PID: ${pid}`);
		
        // Handle this update
        //

        if (event.eventType === 200 && event.alert.statusCode === 1)
        {            
            // ------------------
            // Alert opened
            // ------------------
			//

            let comment = "Enterprise Alert fired a new alert."
            if (event.team != undefined && event.team != null)
            {
                comment = `Enterprise Alert fired a new alert to team ${event.team.teamname}.`
            }


            let body = {
                message: comment
            }
            
            requestDynatrace(`api/v2/problems/${pid}/comments`, 'POST', body);

        }
        else if (event.eventType === 201 && event.alert.statusCode === 2) {

            Logger.writeLog(fnName, `Alert was acked....`);

            // ------------------
            // Alert acknowledged
            // ------------------


            let comment = "has acknowledged via EnterpriseAlert";
            if (event.annotation != undefined && event.annotation != null && event.annotation.message != undefined && event.annotation.message != null)
            {
                comment += ` - ${event.annotation.message}`;
            }

            let body = {
                message: `${event.user.displayname} (${event.user.username}) ${comment}`
            }

            requestDynatrace(`api/v2/problems/${pid}/comments`, 'POST', body);

        }
        else if (event.eventType === 201 && event.alert.statusCode === 4) {

            Logger.writeLog(fnName, `Alert was resolved...`);

            // -------------------
            // Alert was resolved
            // -------------------

            let comment = "has closed via EnterpriseAlert";
            if (event.annotation != undefined && event.annotation != null && event.annotation.message != undefined && event.annotation.message != null)
            {
                comment += ` - ${event.annotation.message}`;
            }

            let body = {
                message: `${event.user.displayname} (${event.user.username}) ${comment}`
            }
            
            requestDynatrace(`api/v2/problems/${pid}/close`, 'POST', body);

        }
		else if (event.eventType === 203) {

            Logger.writeLog(fnName, `Alert was annotated...`);
						
            // -------------------
            // Alert annotated
            // -------------------

            let body = {
                message: `${event.user.displayname} (${event.user.username}): ${event.annotation.message}`
            }
            
            requestDynatrace(`api/v2/problems/${pid}/comments`, 'POST', body);
        }

        return true;
    }
    catch (error)
    {
        Logger.writeLog(fnName, `Error on handling subscription event: ${error.message}`);
        return false;
    }
    finally
    {
        Logger.writeLog(fnName, 'onSubscriptionEvent end');
    }
}

async function onDispose()
{
    let fnName = onDispose.name;

    try
    {
        Logger.writeLog(fnName, 'onDispose start');
        Logger.writeLog(fnName, 'onDispose end');
    }
    catch(error)
    {
        Logger.writeLog(fnName, `Unexpected error on dispose: ${error.message}`);
    }
}



// Send status update
function requestDynatrace(uriPath, httpMethod, reqBody) {

    let fnName = "requestDynatrace";

    let dynaURL = new URL(appContext.config.targetUrl);
    let apiKey = dynaURL.searchParams.get("apiKey");
    if (apiKey == undefined) {
        Logger.writeLog(fnName, "could not find API in configured REST URL, please enter your Dynatrace API URL in the format https://{yourDynatraceEnvId}.live.dynatrace.com?apiKey={yourCreatedDynatraceAPIKey}");
        return;
    }

    // URL: Remove all parameters
    let keysForDel = [];
    dynaURL.searchParams.forEach((v, k) => {
        keysForDel.push(k);
    });
    keysForDel.forEach(k => {
        dynaURL.searchParams.delete(k);
    });

    // URL: Remove path, if any
    let url = dynaURL.href;
    if (dynaURL.pathname.length > 1)
    {
        url = url.replace(`${dynaURL.pathname}`, "/");
    }

    // URL: Add path for API call
    url = `${url}${uriPath}`    


	Logger.writeLog(fnName, `URL: ${url}`);


	var options = {
        method: httpMethod,
        body: reqBody,
        json: true,
        url: url,
        headers: {
            'Content-Type':'application/json',
            'Authorization': `Api-Token ${apiKey}`
        }
	};

	
	// Acknowledge or close result
	function callbackStatus(error, response, body) {

	    if (response && response.statusCode >= 200 && response.statusCode < 300 && body) {
			console.log("Request to server successful: " + JSON.stringify(body));
		    return;
		}

		if (error) {
			console.log("Error Sending Request to server: " + JSON.stringify(error));		    
			return;
		}
		
		if (body) {
			console.log("Error Sending Request to server: " + JSON.stringify(body));		    
			return;
		}

        console.log("Error Sending Request to server: Unknown");		
	}
    
    // Call the acknowledge or close request
	request(options, callbackStatus);	
}