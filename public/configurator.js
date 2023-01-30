let serialOptions = { baudRate: 115200 };
let serial;
let receivedData;
let currentByte;
let device;
let selectedInputIndex = 0;

const OUTGOING_REQUEST_HEADER = 36 // '$'
const OUTGOING_HANDSHAKE_REQUEST = 72 // 'H'

const INCOMING_HANDSHAKE_RESPONSE = new Uint8Array([72, 101, 108, 108, 111, 32, 121, 111, 117, 114, 115, 101, 108, 102, 33, 13, 10]);

const OUTGOING_CONFIG_REQUEST = 100;
const INCOMING_CONFIG_RESPONSE = 101;

const OUTGOING_INPUT_CONFIG_REQUEST = 104;
const INCOMING_INPUT_CONFIG_RESPONSE = 105;

const OUTGOING_INPUT_CONFIG_UPDATE = 106
const INCOMING_INPUT_CONFIG_UPDATE_RESPONSE = 107

const OUTGOING_REQUEST_DELETE_INPUT_UPDATE = 108
const INCOMING_RESPONSE_DELETE_INPUT_UPDATE = 109

const OUTGOING_REQUEST_INPUT_VALUES = 110
const INCOMING_RESPONSE_INPUT_VALUES = 111

const OUTGOING_REQUEST_SAVE_TO_FLASH = 112
const INCOMING_RESPONSE_SAVE_TO_FLASH = 113


function asdf() {

}
async function clickConnect() {

}

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

    setInterval(Update, 50);
}

function Update() {
    if (typeof serial == 'undefined') {} else {
        if (serial.isOpen()) {
            SendRequestInputValues();
        }
    }
}

function Test() {
    serial.close();
}

function UpdateInputValues(inputIdx, raw, calibrated) {
    if (inputIdx == selectedInputIndex) {
        document.getElementById("labelRawValue").innerText = raw;
        document.getElementById("progressBarCalibrated").style.animation = false;
        //console.log(calibrated + ", " + Math.round((calibrated / 32767) * 100));
        document.getElementById("progressBarCalibrated").value =
            ((calibrated / 32767) * 100).toFixed(2);
    }
}

function InitializeInputControls() {
    PopulateDeviceInputSelector();

    PopulatePinList();
    PopulatePinModeList();
    PopulateIsAnalogList();
    PopulateBindingTypeList();
    PopulateBindingAssignmentList();
    if (device.inputs.length > 0) {
        SetInputControlsFromDevice(0);
    }
}

function PopulateDeviceInputSelector() {
    inputList = device.inputs;

    if (inputList.length > 0) {
        document.getElementById("pageInput").hidden = false;
    } else {
        document.getElementById("pageInput").hidden = true;
    }

    selector = document.getElementById("comboAllInputs");
    ClearOptions(selector);

    let bindingType
        // assignmentList = GetAssignmentList(bindingType);
    console.log("len: " + inputList.length);
    for (var i = 0; i < inputList.length; i++) {
        console.log("i:" + i);
        bindingType = device.GetInput(i).GetBindingType();

        pin = inputList[i].GetPin();

        if (pin.toString().length == 1) {
            pin += "\u2003\u2003"
        } else {
            pin += "\u2002\u2003"
        }

        AddNewOption(selector,
            pin +
            GetAssignmentList(bindingType)[inputList[i].GetAssignedInput()],
            i);

    }
    selector.value = selectedInputIndex;
}

function SetDeviceDescriptionFromDevice() {
    document.getElementById("labelDeviceName").innerText =
        device.GetDeviceName();

    document.getElementById("labelDeviceType").innerText =
        device.GetDeviceType();

    document.getElementById("labelFirmwareVersion").innerText =
        device.GetFirmwareVersion();
}

function SetInputControlsFromDevice(idx) {

    SetComboBoxValue("inputPin", device.GetInput(idx).GetPin());

    SetComboBoxValue("inputPinMode", device.GetInput(idx).GetPinMode());
    //console.log(device.GetInput(idx).GetPinMode());

    SetComboBoxValue("comboAnalogMode",
        device.GetInput(idx).GetIsAnalog());

    bindingType = device.GetInput(idx).GetBindingType()
    SetComboBoxValue("comboBindingType", bindingType);

    PopulateBindingAssignmentList();

    SetComboBoxValue("comboBindingAssignment",
        device.GetInput(idx).GetAssignedInput());

    document.getElementById("checkInverted").checked =
        device.GetInput(idx).GetIsInverted();

    document.getElementById("inputMinVal").value =
        device.GetInput(idx).GetMinVal();

    document.getElementById("inputMidVal").value =
        device.GetInput(idx).GetMidVal();

    document.getElementById("inputMaxVal").value =
        device.GetInput(idx).GetMaxVal();

    document.getElementById("inputDeadZone").value =
        device.GetInput(idx).GetDeadZone();

    document.getElementById("inputFilterSize").value =
        device.GetInput(idx).GetBufferSize();

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
    ClearOptions(comboPinMode);
    for (var i = 0; i < pinModeList.length; i++) {
        AddNewOption(comboPinMode, pinModeList[i], pinModeInt[i]);
    }
    //comboPinMode.value = pinModeList[0];
}

function PopulateIsAnalogList() {
    analogModeList = analogModes;
    comboAnalogMode = document.getElementById("comboAnalogMode");
    ClearOptions(comboAnalogMode);
    for (var i = 0; i < analogModeList.length; i++) {
        AddNewOption(comboAnalogMode, analogModeList[i], i);
    }
    //comboAnalogMode.value = analogModeList[0];
}

function PopulateBindingTypeList() {
    options = inputTypes;
    comboBindingType = document.getElementById("comboBindingType");
    ClearOptions(comboBindingType);
    for (var i = 0; i < options.length; i++) {
        AddNewOption(comboBindingType, options[i], i);
    }
    //comboBindingType.value = options[0];
}

function PopulateBindingAssignmentList() {
    var comboBindingType = document.getElementById("comboBindingType")
    var bindingType = comboBindingType.options[comboBindingType.selectedIndex].value


    options = GetAssignmentList(bindingType);
    comboBindingAssignment = document.getElementById("comboBindingAssignment");
    // console.log(comboBindingAssignment);
    ClearOptions(comboBindingAssignment);
    for (var i = 0; i < options.length; i++) {
        AddNewOption(comboBindingAssignment, options[i], i);
    }
    comboBindingAssignment.value = 0;

}

function onPinChange() {
    comboPin = document.getElementById("inputPin");
    console.log("Setting Input " +
        selectedInputIndex + " pin to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetPin(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onPinModeChange() {
    comboPin = document.getElementById("inputPinMode");
    console.log("Setting Input " +
        selectedInputIndex + " PinMode to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetPinMode(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onAnalogModeChange() {
    comboPin = document.getElementById("comboAnalogMode");
    console.log("Setting Input " +
        selectedInputIndex + " comboAnalogMode to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetIsAnalog(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onIsInvertedChange() {
    comboPin = document.getElementById("checkInverted");
    console.log("Setting Input " +
        selectedInputIndex + " checkInverted to " +
        comboPin.checked);
    device.GetInput(selectedInputIndex).SetIsInverted(comboPin.checked);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onMinValChange() {
    comboPin = document.getElementById("inputMinVal");
    console.log("Setting Input " +
        selectedInputIndex + " inputMinVal to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetMinVal(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onMidValChange() {
    comboPin = document.getElementById("inputMidVal");
    console.log("Setting Input " +
        selectedInputIndex + " inputMidVal to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetMidVal(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onMaxValChange() {
    comboPin = document.getElementById("inputMaxVal");
    console.log("Setting Input " +
        selectedInputIndex + " inputMaxVal to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetMaxVal(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onDeadZoneChange() {
    comboPin = document.getElementById("inputDeadZone");
    console.log("Setting Input " +
        selectedInputIndex + " inputDeadZone to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetDeadZone(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onBufferSizeChange() {
    comboPin = document.getElementById("inputFilterSize");
    console.log("Setting Input " +
        selectedInputIndex + " inputBufferSize to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetBufferSize(comboPin.value);

    SendDeviceInputUpdate(selectedInputIndex);
}

function onBindingTypeChange() {
    comboPin = document.getElementById("comboBindingType");
    console.log("Setting Input " +
        selectedInputIndex + " comboBindingType to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetBindingType(comboPin.value);

    PopulateBindingAssignmentList();
    PopulateDeviceInputSelector();

    SendDeviceInputUpdate(selectedInputIndex);
}

function onBindingAssignmentChange() {
    comboPin = document.getElementById("comboBindingAssignment");
    console.log("Setting Input " +
        selectedInputIndex + " comboBindingAssignment to " +
        comboPin.value);
    device.GetInput(selectedInputIndex).SetAssignedInput(comboPin.value);
    PopulateDeviceInputSelector();
    console.log("assignemtn changed");

    SendDeviceInputUpdate(selectedInputIndex);
}

function onSelectedInputChange() {
    selectedInputIndex = document.getElementById("comboAllInputs").value;
    SetInputControlsFromDevice(selectedInputIndex);
}

function onAddInput() {
    device.AddInputDefault();
    PopulateDeviceInputSelector();
    document.getElementById("comboAllInputs").value =
        device.inputs.length - 1;
    onSelectedInputChange();
    SendDeviceInputUpdate(selectedInputIndex);
}

function onDeleteInput() {
    device.DeleteInput(selectedInputIndex);
    SendDeleteInputRequest(selectedInputIndex);
    PopulateDeviceInputSelector();

    if (device.inputs.length > 0) {
        document.getElementById("comboAllInputs").value = 0
        onSelectedInputChange();
    } else {

    }
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
    serial.close();
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
    document.getElementById("pageDeviceDetails").hidden = false;

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
    //console.log("Received: " + data);
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

function SendDeleteInputRequest(index) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_DELETE_INPUT_UPDATE);
    request.push(index);
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    serial.write(request);
}

function SendDeviceInputUpdate(index, sendAll = false) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_INPUT_CONFIG_UPDATE);
    request.push(index);
    console.log(request);
    inputData = device.GetInput(index).ToIntArray()
    for (var i = 0; i < inputData.length; i++) {
        request.push(inputData[i]);
    }
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    console.log("SENDING:" + request);
    serial.write(request);
}

function SendRequestSaveToFlash() {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_SAVE_TO_FLASH);
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    console.log("SENDING:" + request);
    serial.write(request);
}

function SendRequestInputValues() {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_INPUT_VALUES);
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    //console.log("SENDING:" + request);
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
    InitializeInputControls();
}

function ParseInputValues(response) {
    //console.log(response);
    var inputCount = response[1]
    for (var i = 0; i < inputCount; i++) {
        rawVal = response[2 + i * 4] << 8
        rawVal += response[3 + i * 4]
        val = response[4 + i * 4] << 8
        val += response[5 + i * 4]
        UpdateInputValues(i, rawVal, val)
    }
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
    if (response[0] == INCOMING_RESPONSE_INPUT_VALUES) {
        ParseInputValues(response);
    } else if (CompareUintArrays(response, INCOMING_HANDSHAKE_RESPONSE)) {
        OnHandshakeSuccessful();
    } else if (response[0] == INCOMING_CONFIG_RESPONSE) {
        console.log("Device Config Received");
        device.SetFromConfigPacket(response);
        device.SetDeviceBlueprint(GetDeviceTarget(device.microcontroller));
        InitializeInputControls();
        SetDeviceDescriptionFromDevice();
        SendInputConfigRequest();

    } else if (response[0] == INCOMING_INPUT_CONFIG_RESPONSE) {
        console.log("Device Input Config Received");
        ParseInputConfigResponse(response);

    } else if (response[0] == INCOMING_INPUT_CONFIG_UPDATE_RESPONSE) {
        console.log("Device Input Update Confirmation Received");
        if (response[2] == 111 && response[3] == 107) {
            console.log("OK");
            SendRequestSaveToFlash();
        }
    } else if (response[0] == INCOMING_RESPONSE_DELETE_INPUT_UPDATE) {
        console.log("Device Input Delete Confirmation Received");
        if (response[2] == 111 && response[3] == 107) {
            console.log("OK");
            SendRequestSaveToFlash();
        }
    } else if (response[0] == INCOMING_RESPONSE_SAVE_TO_FLASH) {
        console.log("Saved to flash confirmed");
    }

}