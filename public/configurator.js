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

const OUTGOING_INPUT_CONFIG_UPDATE = 106
const INCOMING_INPUT_CONFIG_UPDATE_RESPONSE = 107


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


}

function Test() {


    PopulatePinList();
    PopulatePinModeList();
    PopulateIsAnalogList();
    PopulateBindingTypeList();
    PopulateBindingAssignmentList();
    SetInputControlsFromDevice(0);
}

function SetInputControlsFromDevice(idx) {

    SetComboBoxValue("inputPin", device.GetInput(idx).GetPin());

    SetComboBoxValue("inputPinMode",
        GetPinMode(device.GetInput(idx).GetPinMode()));

    SetComboBoxValue("comboAnalogMode",
        analogModes[device.GetInput(idx).GetIsAnalog()]);

    bindingType = inputTypes[device.GetInput(idx).GetBindingType()]
    SetComboBoxValue("comboBindingType", bindingType);

    PopulateBindingAssignmentList();

    SetComboBoxValue("comboBindingAssignment",
        GetAssignmentList(bindingType)[device.GetInput(idx).GetAssignedInput()]);

    document.getElementById("checkInverted").checked =
        device.GetInput(idx).GetIsInverted();




}

function SetComboBoxValue(comboBox, value) {
    box = document.getElementById(comboBox);
    box.value = value;
}

function PopulatePinList() {
    inputList = device.GetBlueprintInputList();
    comboPin = document.getElementById("inputPin");
    ClearOptions(comboPin);
    for (var i = 0; i < inputList.length; i++) {
        AddNewOption(comboPin, inputList[i], inputList[i]);
    }
    comboPin.value = inputList[0];
}

function PopulatePinModeList() {
    pinModeList = pinModes;
    comboPinMode = document.getElementById("inputPinMode");
    //ClearOptions(comboPinMode);
    for (var i = 0; i < pinModeList.length; i++) {
        AddNewOption(comboPinMode, pinModeList[i], pinModeList[i]);
    }
    comboPinMode.value = pinModeList[0];
}

function PopulateIsAnalogList() {
    analogModeList = analogModes;
    comboAnalogMode = document.getElementById("comboAnalogMode");
    //ClearOptions(comboPinMode);
    for (var i = 0; i < analogModeList.length; i++) {
        AddNewOption(comboAnalogMode, analogModeList[i], analogModeList[i]);
    }
    comboAnalogMode.value = analogModeList[0];
}

function PopulateBindingTypeList() {
    options = inputTypes;
    comboBindingType = document.getElementById("comboBindingType");
    ClearOptions(comboBindingType);
    for (var i = 0; i < options.length; i++) {
        AddNewOption(comboBindingType, options[i], options[i]);
    }
    comboBindingType.value = options[0];
}

function PopulateBindingAssignmentList() {
    var comboBindingType = document.getElementById("comboBindingType")
    var bindingType = comboBindingType.options[comboBindingType.selectedIndex].value


    options = GetAssignmentList(bindingType);
    comboBindingAssignment = document.getElementById("comboBindingAssignment");
    console.log(comboBindingAssignment);
    ClearOptions(comboBindingAssignment);
    for (var i = 0; i < options.length; i++) {
        AddNewOption(comboBindingAssignment, options[i], options[i]);
    }
    comboBindingAssignment.value = options[0];
}

function onBindingTypeChange() {
    console.log("ONCHANGE");
    PopulateBindingAssignmentList();
}

function ClearOptions(selectElement) {
    if (selectElement == null) {
        return;
    }
    while (selectElement.options.length > 0) {
        selectElement.options.remove(0);
    }
}

function AddNewOption(selectElement, text, id) {
    var option = document.createElement("option");
    option.text = text;
    option.value = id;
    option.selected = "selected";
    selectElement.add(option);
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
    SendHandShake();
    document.getElementById("pageConnect").hidden = true;
    document.getElementById("pageInput").hidden = false;

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

function SendDeviceUpdate(index, sendAll = false) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_INPUT_CONFIG_UPDATE);
    inputData = device.GetInput(index).ToIntArray()
    for (var i = 0; i < inputData.length; i++) {
        request.push(inputData[i]);
    }
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
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
    //SendDeviceUpdate(0);
    LoadInputFromDevice(0);
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

    } else if (response[0] == INCOMING_INPUT_CONFIG_UPDATE_RESPONSE) {
        console.log("Device Input Update Confirmation Received");
        if (response[2] == 111 && response[3] == 107) {
            console.log("OK");
        }
    }

}

function LoadInputFromDevice(idx) {
    //document.getElementById("inputPin").textContent = "hello";
    //t = document.getElementById("inputPin").options[document.getElementById("select").selectedIndex].text;
    //console.log(t);
    //console.log("inputpin");
    //console.log($('#inputPin'));
}