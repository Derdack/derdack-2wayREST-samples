# derdack-2wayREST-samples

2-way REST in Enterprise Alert 9 provides the ability to call back external APIs or webhooks when an alert in EA changes state or is e.g. annonated.
In these cases event objects are sent to a nodejs JavaScript file which
converts them to a 3rd party system understandable format and send them to the remote system via HTTPS.

## How it works
The 2-way REST script for outbound REST communication is created automatically when you enable 2-way REST on the particular REST API event source Enterprise Alert.
The script itself implements some interface functions which are called by Enterprise Alert when certain events occur on the platform or the user changes the event source configuration.
All methods are explained more in detail in the below table.
## Interface functions
These are methods in the script file that are called by Enterprise Alert.

| **Method** | **Argument** | **Description** |  
|:---------------|:-----:|:--------------------------|
| ```onConfigureApp()``` ||Is called by EnterpriseAlert when the user configures the 2-way REST source and passes condiguration data to the script.|
| | appContext | Contains script runtime and configuration information. Key information is the entered callback URL in the portal, that points to the 3rd party system.<br>On the other hand, it contains callback methods that can be used from the script to interact with the Enterprise Alert platform.<br>The full JSON model is documented below.|
| ```onSubscriptionEvent()``` ||Is called by EnterpriseAlert when when an alert, which came in through this same REST event source was triggered by a policy, was acknowledged, closed or annotated, etc. |
| | event | Contains event details, e.g. the name of the user who has acknowledged the alert.<br>The full JSON model is documented below.|
| ```onGetAppConfig()``` |-|Reserved for later use.|



## Interface function arguments (JSON models)
These are JSON objects that are passed to the various script interface functions as previously documented.

### appContext
It contains script runtime and configuration information. Key data is the entered callback URL that points to the 3rd party system. 

| Object / property | **Description** |  
|:---------------|:--------------------------|
|config.targetUrl|Contains the URL that was entered in the portal for this REST event source as 2-way REST target URL|
|runtimeInfo|Object that contains information about the event source itself as well as callback methods.|
|runtimeInfo.callbackSendMail|Callback method that can be used to send an email notification via Enterprise Alerts email notification channel.|
|runtimeInfo.callbackSetStatusOK|Callback method that can be used to communicate a success status message that is also displayed on the event source tile.|
|runtimeInfo.callbackSetStatusError|Callback method that can be used to communicate an error status message that is also displayed on the event source tile.|
|state|An object that can be used to save data required by this 2-way REST integation persistently (e.g. which is available accross different onSubscriptionEvent notifiations. |
|state.items|A collection in which you can store serializable data which will persists multiple onSubscriptionEvent script invocations.|
|state.callbackSaveState|A callback method that can be used to save state information.|

#### <u>Example JSON model</u>


```json
{
    "config": {
        "targetUrl": "https://mysystem.com/api/update"
    },
    "runtimeInfo": {
        "InstanceId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "ScriptId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "ScriptName": "Docs",
        "SubscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "callbackSendMail": "(scriptMail) => {}",
        "callbackSetStatusOK": "(message) => {}",
        "callbackSetStatusError": "(message) => {}"
    },
    "state": {
        "callbackSaveState": "(state) => {}",
        "items": []
    }
}
```



### event
The event object is passed as argument in the function onSubscriptionEvent(). 
The key objects or properties that are part of of the event are described in the following table. Please find all currently implemented events and the corresponding JSON examples below.

| Object / property | **Description** |  
|:---------------|:--------------------------|
|eventType|Type of the event that is sent to the script. Possible values are:<br>AlertCreated = 200<br>AlertStatusChanged = 201<br>AlertAnnotated = 203|
|eventRaisedUtc|Time in UTC when this alert was created (e.g. by a  policy) in Enterprise Alert.|
|team|Object that contains information about the Team the alert was sent to.|
|user|Object that contains information about the user the alert was sent to or who has updated an alert (Depending on eventTyp and alert.statusCode|
|alert|Object that contains information about the alert itself.|
|statusCode|Number that represents the current status of the alert:<br>Not yet defined = 0<br>Open = 1<br>Acknowledged = 2<br>Closed = 4<br>No response = 8<br>Failed = 16<br>Error = 32
|alert.shortId|Id that people can use to e.g. acknwoeldge the alert via SMS text|
|alert.id|Unique alert id in EnterpriseAlert|
|alert.acknowledgedUserIds|An array that constains all database unique IDs from the users who have acknowledged this alert. Likely to contain more than one element for broadcast alerts with the requirement to respond to the alert.|
|alert.workflow|Defines the alert notification workflow of this alert as it was defined in the corresponding alert policy. Possible values are:<br>None = 0<br>User = 1<br>Team broadcast = 2<br>Team escalation = 3<br>Multi acknowledge = 4<br>Value 2 means that a team was addressed with a broadcast alerting option and any team member can respond to acknowledge the alert. If more than one team member has to respond to acknwoeldge the alert, the value will be 4.<br>User (1) means that the alert was targeted to an individual user instead of a team.
|alert.eventSeverity|Indicates the severity of this alert:<br>Low = 1<br>Major = 2<br>Critical = 3<br>
|alert.parameters|An array that contains event parameter objects with (parameter name and value) of the event that has triggered this alert.
|annotation|An object that is set when the alert was annotated by a user.|

<br><br>

#### <u>Example: Alert was triggered</u>

The below example refers to an event that has triggered a policy and opened an alert because eventType is 200 and alert.statusCode equals 1.
Additionally, the alert has parameters which originated from the incoming event.


```json
{
    "eventType": 200,
    "eventRaisedUtc": "2021-04-27T13:57:04.8033124Z",
    "subscription": {
        "id": "14518853-01eb-449e-9c62-47eee2ed5b90"
    },
    "branch": null,
    "team": {
        "teamname": "Network",
        "id": "138"
    },
    "user": null,
    "alert": {
        "statusCode": 1,
        "eventId": "33520098",
        "shortId": 319,
        "externalEventId": "b8981516-bbf9-40a3-83a6-906ff0d81ca1",
        "acknowledgedUserIds": [],
        "acknowledgedAt": null,
        "category": "Sample",
        "categoryId": "1086",
        "closedAt": null,
        "closedBy": null,
        "createdAt": "2021-04-27T13:57:03",
        "eventSeverity": 2,
        "eventSourceType": 3,
        "lastModified": "2021-04-27T13:57:04.21",
        "parameters": [
            {
                "name": "EAEventIsNew",
                "type": 8,
                "value": "1"
            },
            {
                "name": "Title",
                "type": 8,
                "value": "Slow ping response on www.google.com"
            },
            {
                "name": "Description",
                "type": 8,
                "value": "Pinging www.google.com [172.217.21.36] with 32 bytes of data: Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49Reply from 172.217.21.36: bytes=32 time=25ms TTL=49"
            },
            {
                "name": "Severity",
                "type": 8,
                "value": "High"
            },
            {
                "name": "Gateway",
                "type": 8,
                "value": "192.168.88.88"
            },
            {
                "name": "Impact",
                "type": 8,
                "value": "Critical"
            },
            {
                "name": "NodeID",
                "type": 8,
                "value": "BC898AQ"
            }
        ],
        "statusText": null,
        "statusLastModified": "2021-04-27T13:57:04.21",
        "title": "Sample alert",
        "subscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "text": "Please check",
        "workflow": 3,
        "id": "29646"
    },
    "annotation": null,
    "id": "33520100"
}
```

#### <u>Alert was acknowledged by a user</u>

The eventType of 201 means that the alert status has changed and alert.statusCode of 2 indicates that it was acknowledged.
In addition, the user object contains more information about the user who has acknowledged the alert. The annotation object in this example
is filled as well, because the user has typed in some notes when acknowledging this alert in the mobile app.


```json
{
    "eventType": 201,
    "eventRaisedUtc": "2021-04-27T15:15:06.8821857Z",
    "subscription": {
        "id": "14518853-01eb-449e-9c62-47eee2ed5b90"
    },
    "branch": null,
    "team": {
        "teamname": "Network",
        "id": "138"
    },
    "user": {
        "username": "bormann",
        "displayname": "Rene Bormann",
        "mailaddress": "rbormann@de.derdack.com",
        "id": "2"
    },
    "alert": {
        "statusCode": 2,
        "eventId": "33520441",
        "shortId": 321,
        "externalEventId": "1b82ffdd-bf17-40b0-bb38-258b35078e13",
        "acknowledgedUserIds": [
            "2"
        ],
        "acknowledgedAt": "2021-04-27T15:15:05",
        "category": "Sample",
        "categoryId": "1086",
        "closedAt": null,
        "closedBy": null,
        "createdAt": "2021-04-27T15:14:03",
        "eventSeverity": 2,
        "eventSourceType": 3,
        "lastModified": "2021-04-27T15:15:05.843",
        "parameters": [
            {
                "name": "EAEventIsNew",
                "type": 8,
                "value": "1"
            },
            {
                "name": "Title",
                "type": 8,
                "value": "Slow ping response on www.google.com"
            },
            {
                "name": "Description",
                "type": 8,
                "value": "Pinging www.google.com [172.217.21.36] with 32 bytes of data: Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49Reply from 172.217.21.36: bytes=32 time=25ms TTL=49"
            },
            {
                "name": "Severity",
                "type": 8,
                "value": "High"
            },
            {
                "name": "Gateway",
                "type": 8,
                "value": "192.168.88.88"
            },
            {
                "name": "Impact",
                "type": 8,
                "value": "Critical"
            },
            {
                "name": "NodeID",
                "type": 8,
                "value": "BC898AQ"
            }
        ],
        "statusText": "Ok",
        "statusLastModified": "2021-04-27T15:15:05.843",
        "title": "Sample alert",
        "subscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "text": "Please check",
        "workflow": 3,
        "id": "29648"
    },
    "annotation": {
        "message": "Ok",
        "id": "bf4b5315-edce-4071-8913-deadcf267003"
    },
    "id": "33520459"
}
```

#### <u>Alert was closed by a user</U>

The eventType of 201 means that the alert status has changed and alert.statusCode of 4 indicates that it was closed.
The annotation object is null because the user has not entered a note when closing this alert in the mobile app.

```json
{
    "eventType": 201,
    "eventRaisedUtc": "2021-04-27T15:22:12.9365357Z",
    "subscription": {
        "id": "14518853-01eb-449e-9c62-47eee2ed5b90"
    },
    "branch": null,
    "team": {
        "teamname": "Network",
        "id": "138"
    },
    "user": {
        "username": "bormann",
        "displayname": "Rene Bormann",
        "mailaddress": "rbormann@de.derdack.com",
        "id": "2"
    },
    "alert": {
        "statusCode": 4,
        "eventId": "33520509",
        "shortId": 322,
        "externalEventId": "a55f3c28-29e0-4435-9df7-054654b283cb",
        "acknowledgedUserIds": [
            "2"
        ],
        "acknowledgedAt": "2021-04-27T15:22:01",
        "category": "Sample",
        "categoryId": "1086",
        "closedAt": "2021-04-27T15:22:11",
        "closedBy": "2",
        "createdAt": "2021-04-27T15:21:54",
        "eventSeverity": 2,
        "eventSourceType": 3,
        "lastModified": "2021-04-27T15:22:11.653",
        "parameters": [
            {
                "name": "EAEventIsNew",
                "type": 8,
                "value": "1"
            },
            {
                "name": "Title",
                "type": 8,
                "value": "Slow ping response on www.google.com"
            },
            {
                "name": "Description",
                "type": 8,
                "value": "Pinging www.google.com [172.217.21.36] with 32 bytes of data: Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49Reply from 172.217.21.36: bytes=32 time=25ms TTL=49"
            },
            {
                "name": "Severity",
                "type": 8,
                "value": "High"
            },
            {
                "name": "Gateway",
                "type": 8,
                "value": "192.168.88.88"
            },
            {
                "name": "Impact",
                "type": 8,
                "value": "Critical"
            },
            {
                "name": "NodeID",
                "type": 8,
                "value": "BC898AQ"
            }
        ],
        "statusText": " ",
        "statusLastModified": "2021-04-27T15:22:11.653",
        "title": "Sample alert",
        "subscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "text": "Please check",
        "workflow": 3,
        "id": "29649"
    },
    "annotation": null,
    "id": "33520526"
}
```

#### <u>Alert was annotated by a user</u>

The eventType of 203 indicates that the alert was annotated by the user in the user object. The annotation object contains the annotation itself.

```json
{
    "eventType": 203,
    "eventRaisedUtc": "2021-04-27T15:28:16.5854448Z",
    "subscription": {
        "id": "14518853-01eb-449e-9c62-47eee2ed5b90"
    },
    "branch": null,
    "team": {
        "teamname": "Network",
        "id": "138"
    },
    "user": {
        "username": "bormann",
        "displayname": "Rene Bormann",
        "mailaddress": "rbormann@de.derdack.com",
        "id": "2"
    },
    "alert": {
        "statusCode": 2,
        "eventId": "33520544",
        "shortId": 323,
        "externalEventId": "9d904dc9-06ab-489d-be31-55d2add953df",
        "acknowledgedUserIds": [
            "2"
        ],
        "acknowledgedAt": "2021-04-27T15:26:55",
        "category": "Sample",
        "categoryId": "1086",
        "closedAt": null,
        "closedBy": null,
        "createdAt": "2021-04-27T15:26:37",
        "eventSeverity": 2,
        "eventSourceType": 3,
        "lastModified": "2021-04-27T15:26:55.643",
        "parameters": [
            {
                "name": "EAEventIsNew",
                "type": 8,
                "value": "1"
            },
            {
                "name": "Title",
                "type": 8,
                "value": "Slow ping response on www.google.com"
            },
            {
                "name": "Description",
                "type": 8,
                "value": "Pinging www.google.com [172.217.21.36] with 32 bytes of data: Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49Reply from 172.217.21.36: bytes=32 time=25ms TTL=49"
            },
            {
                "name": "Severity",
                "type": 8,
                "value": "High"
            },
            {
                "name": "Gateway",
                "type": 8,
                "value": "192.168.88.88"
            },
            {
                "name": "Impact",
                "type": 8,
                "value": "Critical"
            },
            {
                "name": "NodeID",
                "type": 8,
                "value": "BC898AQ"
            }
        ],
        "statusText": " ",
        "statusLastModified": "2021-04-27T15:26:55.643",
        "title": "Sample alert",
        "subscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "text": "Please check",
        "workflow": 3,
        "id": "29650"
    },
    "annotation": {
        "message": "OK, I’ll check",
        "id": "60cc48ea-ad3a-43cc-aff0-94ccf2300f45"
    },
    "id": "33520605"
}
```

#### <u>Alert was not handled by a user</u>

The eventType value of 201 indicates that the alert status has changed, alert.statusCode of 8 means no recipient ever responded to the alert.

```json
{
    "eventType": 201,
    "eventRaisedUtc": "2021-04-27T14:07:10.1951756Z",
    "subscription": {
        "id": "14518853-01eb-449e-9c62-47eee2ed5b90"
    },
    "branch": null,
    "team": {
        "teamname": "Network",
        "id": "138"
    },
    "user": null,
    "alert": {
        "statusCode": 8,
        "eventId": "33520098",
        "shortId": 319,
        "externalEventId": "b8981516-bbf9-40a3-83a6-906ff0d81ca1",
        "acknowledgedUserIds": [],
        "acknowledgedAt": null,
        "category": "Sample",
        "categoryId": "1086",
        "closedAt": "2021-04-27T14:07:08",
        "closedBy": null,
        "createdAt": "2021-04-27T13:57:03",
        "eventSeverity": 2,
        "eventSourceType": 3,
        "lastModified": "2021-04-27T14:07:08.373",
        "parameters": [
            {
                "name": "EAEventIsNew",
                "type": 8,
                "value": "1"
            },
            {
                "name": "Title",
                "type": 8,
                "value": "Slow ping response on www.google.com"
            },
            {
                "name": "Description",
                "type": 8,
                "value": "Pinging www.google.com [172.217.21.36] with 32 bytes of data: Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49 Reply from 172.217.21.36: bytes=32 time=25ms TTL=49Reply from 172.217.21.36: bytes=32 time=25ms TTL=49"
            },
            {
                "name": "Severity",
                "type": 8,
                "value": "High"
            },
            {
                "name": "Gateway",
                "type": 8,
                "value": "192.168.88.88"
            },
            {
                "name": "Impact",
                "type": 8,
                "value": "Critical"
            },
            {
                "name": "NodeID",
                "type": 8,
                "value": "BC898AQ"
            }
        ],
        "statusText": null,
        "statusLastModified": "2021-04-27T14:07:08.373",
        "title": "Sample alert",
        "subscriptionId": "14518853-01eb-449e-9c62-47eee2ed5b90",
        "text": "Please check",
        "workflow": 3,
        "id": "29646"
    },
    "annotation": null,
    "id": "33520164"
}
```



## Callback functions
These are functions that can be called by the script to interact with the Enterprise Alert backend platform.

| **Method** | **Argument** | **Description** |  
|:---------------|:-----:|:--------------------------|
| ```callbackSendMail()``` ||Can be used to send an email notification via Enterprise Alert.|
| | scriptMail | Represents the email to be sent. See complete JSON model below.|
| ```callbackSetStatusOK()``` ||Can be used to communicate a success status to Enterprise Alert which is also displayed on the event source tile.|
| | message | The text to be displayed. |
| ```callbackSetStatusError()``` ||Can be used to communicate a success status to Enterprise Alert which is also displayed on the event source tile.|
| | message | The text to be displayed. |


## Callback function agruments (JSON models)
These are argument objects that can be passed to the various callback functions.

#### <u>scriptEmail</u>

| Object / property | **Description** |  
|:---------------|:--------------------------|
|mail|Object that represents the mail to be sent.|
|isPlainMail|Boolean value that indicates if the email should be sent as plain text email or as HTML email. In the latter case it makes sense to pass the HTML representation of the email body in mail.html|

```json

{
	"mail": 
	{
		"to": "status_change@enterprisealert.com",
		"cc": null,
		"subject": "Alert status update event handled.",
		"text": "An alert in Enterprise Alert has changed its status.",
		"html": null
	},
	"isPlainMail": true
}

```


## Sample scripts

#### <u>Dynatrace</u>
Find an example Main.js file implementation for backchannel communication with Dynatrace. It updates problems that were previously sent to Enterprise Alert via the same REST event source.

The script receives onSubscriptionEvent notifications and parses the problem to be updated from the initially received event:

```JavaScript
let pid = "";
for (param of event.alert.parameters) 
{
    if (param.name.toLocaleLowerCase() == "pid")
    {
        pid = param.value;
        break;
    }
}
```

Depending on the eventType and alertStatus it calls various Dynatrace API functions. Each call is authenticated with a previously created API key for Enterprise Alert in Dynatrace.
In this sample, the Dynatrace API key is included in the target system URL as a query parameter but is extracted from there and passed in an HTTP Authorization header as requested by Dynatrace. This is done in the function requestDynatrace which is e.g. called when alert in Enterprise Alert was closed:

```JavaScript
    requestDynatrace(`api/v2/problems/${pid}/close`, 'POST', body);
```