let pHtmlMsg;
let serialOptions = { baudRate: 115200 };
let serial;
let receivedData;
let currentByte;
let device;

const OUTGOING_REQUEST_HEADER = 36 // '$'
const OUTGOING_HANDSHAKE_REQUEST = 72 // 'H'

const INCOMING_HANDSHAKE_RESPONSE = new Uint8Array([72, 101, 108, 108, 111, 32, 121, 111, 117, 114, 115, 101, 108, 102, 33, 13, 10]);

const OUTGOING_CONFIG_REQUEST = 100;
const INCOMING_CONFIG_RESPONSE = 101;

const OUTGOING_INPUT_CONFIG_REQUEST = 104;
const INCOMING_INPUT_CONFIG_RESPONSE = 105;


// 
// currentByte = 0;

function setup() {
    //createCanvas(640, 480);
    receivedData = new Uint8Array(256);
    currentByte = 0;
    console.log(receivedData);
    // Setup Web Serial using serial.js
    serial = new Serial();
    serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
    serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
    serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
    serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

    // If we have previously approved ports, attempt to connect with them
    serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

    // Add in a lil <p> element to provide messages. This is optional
    //pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");

    device = new Device();
    console.log(device);
    console.log(targetESP32);
}

// function draw() {
//     background(100);
// }

/**
 * Callback function by serial.js when there is an error on web serial
 * 
 * @param {} eventSender 
 */
function onSerialErrorOccurred(eventSender, error) {
    console.log("onSerialErrorOccurred", error);
    //pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 * 
 * @param {} eventSender 
 */
function onSerialConnectionOpened(eventSender) {
    console.log("onSerialConnectionOpened");
    //pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 * 
 * @param {} eventSender 
 */
function onSerialConnectionClosed(eventSender) {
    console.log("onSerialConnectionClosed");
    //pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 * 
 * @param {*} eventSender 
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
    //console.log("onSerialDataReceived", newData);

    // Collects incoming bytes and sends them to the snipper at EOL
    for (var i = 0; i < newData.length; i++) {
        receivedData[currentByte] = newData[i];

        if (currentByte > 1) {
            if (receivedData[currentByte - 1] == 13 && receivedData[currentByte] == 10) {
                currentByte++;
                OnEOLReached();
            }
        }
        currentByte++;
    }
}

// Snips received data array at EOL
function OnEOLReached() {
    data = new Uint8Array(currentByte);
    for (var i = 0; i < currentByte + 1; i++) {
        data[i] = receivedData[i];
        receivedData[i] = 0;
    }
    currentByte = -1;
    console.log("Received: " + data);
    ParseResponse(data);
}

function SendHandShake() {
    console.log("sending handshake");
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_HANDSHAKE_REQUEST, 13, 10]);
    serial.write(request);
}

function SendDeviceConfigRequest() {
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_CONFIG_REQUEST, 13, 10]);
    serial.write(request);
}

function SendInputConfigRequest() {
    console.log("Sending input config request");
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_INPUT_CONFIG_REQUEST, 13, 10]);
    serial.write(request);
}

function OnHandshakeSuccessful() {

    console.log("Handshake Response Received");
    SendDeviceConfigRequest();
}

function ParseInputConfigResponse(response) {
    var inputCount = response[1];
    if (inputCount == 0) {
        console.log("No inputs")
    } else {
        console.log(inputCount + " inputs");

        for (var i = 0; i < inputCount * 20; i += 20) {
            device.AddInput(response.slice(i + 2, i + 20 + 2));
        }

    }
    console.log(device);
}

function CompareUintArrays(array1, array2) {
    if (array1.length != array2.length) {
        return false;
    }
    for (var i = 0; i < array1.length; i++) {
        if (array1[i] != array2[i]) {
            return false;
        }
    }
    return true;
}

function ParseResponse(response) {


    if (CompareUintArrays(response, INCOMING_HANDSHAKE_RESPONSE)) {
        OnHandshakeSuccessful();
    } else if (response[0] == INCOMING_CONFIG_RESPONSE) {
        console.log("Device Config Received");
        device.SetFromConfigPacket(response);
        device.SetDeviceBlueprint(GetDeviceTarget(device.microcontroller));
        SendInputConfigRequest();

    } else if (response[0] == INCOMING_INPUT_CONFIG_RESPONSE) {
        console.log("Device Input Config Received");
        ParseInputConfigResponse(response);
    }

}