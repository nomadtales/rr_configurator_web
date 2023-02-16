const GUI_VERSION = "V1.0.1"
console.log("VERSION: " + GUI_VERSION);
let serialOptions = { baudRate: 115200 };
let serial;
let receivedData;
let currentByte;
let device;
let selectedInputIndex = 0;

const PRINT_INCOMING_MESSAGES = false;
const PRINT_OUTGOING_MESSAGES = false;

const HANDSHAKE_TIMEOUT = 250;

const OUTGOING_REQUEST_HEADER = 36; // '$'
const INCOMING_RESPONSE_HEADER = 37; // '#'

const OUTGOING_HANDSHAKE_REQUEST = 72; // 'H'

const INCOMING_HANDSHAKE_RESPONSE = 72; //new Uint8Array([72, 101, 108, 108, 111, 32, 121, 111, 117, 114, 115, 101, 108, 102, 33, 13, 10]);

const OUTGOING_CONFIG_REQUEST = 100;
const INCOMING_CONFIG_RESPONSE = 101;

const OUTGOING_INPUT_CONFIG_REQUEST = 102;
const INCOMING_INPUT_CONFIG_RESPONSE = 103;

const OUTGOING_INPUT_CONFIG_REQUEST_ALL = 104;
const INCOMING_INPUT_CONFIG_RESPONSE_ALL = 105;

const OUTGOING_INPUT_CONFIG_UPDATE = 106
const INCOMING_INPUT_CONFIG_UPDATE_RESPONSE = 107

const OUTGOING_REQUEST_DELETE_INPUT_UPDATE = 108
const INCOMING_RESPONSE_DELETE_INPUT_UPDATE = 109

const OUTGOING_REQUEST_INPUT_VALUES = 110
const INCOMING_RESPONSE_INPUT_VALUES = 111

const OUTGOING_REQUEST_SAVE_TO_FLASH = 112
const INCOMING_RESPONSE_SAVE_TO_FLASH = 113

const OUTGOING_REQUEST_MACRO_CONFIG = 114;
const INCOMING_RESPONSE_MACRO_CONFIG = 115;

const OUTGOING_REQUEST_MACRO_BINDING_UPDATE = 116;
const INCOMING_RESPONSE_MACRO_BINDING_UPDATE = 117;

const OUTGOING_REQUEST_MACRO_NAME_UPDATE = 118;
const INCOMING_RESPONSE_MACRO_NAME_UPDATE = 119;

const OUTGOING_REQUEST_MACRO_CONFIG_UPDATE = 120;
const INCOMING_RESPONSE_MACRO_CONFIG_UPDATE = 121;

let macroBindingRowsHolder;
let macroBindingRowPrototype;

window.onload = function() {
    // Store macro rows for instantiating later.
    macroBindingRowsHolder = document.getElementById("macroBindingRows");
    macroBindingRowPrototype = document.getElementById("macroBindingRows").querySelector('.bindingRow');
    macroBindingRowPrototype.remove();

};

function CodeToString(code) {
    switch (code) {
        case INCOMING_HANDSHAKE_RESPONSE:
            return "INCOMING_HANDSHAKE_RESPONSE";
        case INCOMING_CONFIG_RESPONSE:
            return "INCOMING_CONFIG_RESPONSE";
        case INCOMING_INPUT_CONFIG_RESPONSE:
            return "INCOMING_INPUT_CONFIG_RESPONSE";
        case INCOMING_INPUT_CONFIG_RESPONSE_ALL:
            return "INCOMING_INPUT_CONFIG_RESPONSE_ALL";
        case INCOMING_INPUT_CONFIG_UPDATE_RESPONSE:
            return "INCOMING_INPUT_CONFIG_UPDATE_RESPONSE";
        case INCOMING_RESPONSE_DELETE_INPUT_UPDATE:
            return "INCOMING_RESPONSE_DELETE_INPUT_UPDATE";
        case INCOMING_RESPONSE_INPUT_VALUES:
            return "INCOMING_RESPONSE_INPUT_VALUES";
        case INCOMING_RESPONSE_SAVE_TO_FLASH:
            return "INCOMING_RESPONSE_SAVE_TO_FLASH";
        case INCOMING_RESPONSE_MACRO_CONFIG:
            return "INCOMING_RESPONSE_MACRO_CONFIG";
        case INCOMING_RESPONSE_MACRO_CONFIG_UPDATE:
            return "INCOMING_RESPONSE_MACRO_CONFIG_UPDATE";
        case INCOMING_RESPONSE_MACRO_NAME_UPDATE:
            return "INCOMING_RESPONSE_MACRO_NAME_UPDATE";





        default:
            return "UNKNOWN HEADER";
    }
}

var waitingOnHandshake = false;
let waitStart

var queuedMessages = [];
var lastSent;
var serialBusy = false;
var serialWaitingOn = 0; // INCOMING_RESPONSE_*
var sendAttempts = 0;

var isConnected = false;


function setup() {
    SetErrorText("");
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
    serial.open(serialOptions);

    // Add in a lil <p> element to provide messages. This is optional
    //pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");

    device = new Device();

    setInterval(Update, 50);
    LockControls(true);
}

async function disconnect() {
    console.log("DISCONNECT");
    await serial.close();
    //serial = null
    device = null;
    document.getElementById("pageConnect").hidden = false;
    document.getElementById("pageDeviceDetails").hidden = true;
    document.getElementById("pageInput").hidden = true;
    document.getElementById("pageMacros").hidden = true;
    isConnected = false;
    serialWaitingOn = 0;
    queuedMessages = [];
    LockControls(false);
}

function commitChanges() {
    SendRequestSaveToFlash();
    LockControls(true);
}

function Update() {

    if (typeof serial == 'undefined') {} else {
        if (serial.isOpen()) {
            //console.log(serial);

            //console.log(serialWaitingOn);
            if (serialWaitingOn != 0) {
                //console.log(serialWaitingOn);
                var timeDiff = new Date() - waitStart;
                if (timeDiff > HANDSHAKE_TIMEOUT) {
                    console.log("Timed out waiting on " + CodeToString(serialWaitingOn));
                    SendRequest(lastSent, serialWaitingOn); // ReSend
                }
            } else {
                if (queuedMessages.length > 0) {
                    message = queuedMessages.shift();
                    SendRequest(message[0], message[1]);
                } else if (device.inputs.length > 0) {
                    SendRequestInputValues();
                }
            }
        }
    }

    // if (waitingOnHandshake) {
    //     now = new Date();
    //     var timeDiff = now - waitStart; //in ms
    //     if (timeDiff > HANDSHAKE_TIMEOUT) {
    //         console.log("failed handshake");
    //         waitingOnHandshake = false;
    //         SetErrorText("Error: Handshake Failed. Did you flash the firmware yet?");

    //         disconnect();
    //     }
    // }
}

function SetErrorText(text) {
    document.getElementById("errorText").innerText = text
}

function Test() {}

function AddMacroBindingRow(idx) {
    var row = macroBindingRowPrototype.cloneNode(true);
    row.setAttribute("idx", idx);
    macroBindingRowsHolder.appendChild(row);
    return row;
}

function ClearMacroBindingRows() {
    let rowToDelete = document.getElementById("macroBindingRows").querySelector('.bindingRow');
    while (rowToDelete != null) {
        rowToDelete.remove();
        rowToDelete = document.getElementById("macroBindingRows").querySelector('.bindingRow');
    }
}

function onComboMacroInputChange(id) {
    macroBindingIdx = id.parentElement.parentElement.getAttribute("idx");
    console.log(macroBindingIdx);
}

function UpdateInputValues(inputIdx, raw, calibrated) {
    if (inputIdx == selectedInputIndex) {
        document.getElementById("labelRawValue").innerText = raw;
        document.getElementById("progressBarCalibrated").style.animation = false;
        //console.log(calibrated + ", " + Math.round((calibrated / 32767) * 100));

        if (device != null) {
            isAnalog = device.GetInput(inputIdx).GetIsAnalog();
        }

        if (isAnalog == 0) {
            calibrated = calibrated * 32767;
        }

        document.getElementById("progressBarCalibrated").value =
            ((calibrated / 32767) * 100).toFixed(2);
    }
}

function InitializeInputControls() {
    PopulateDeviceInputSelector();
    PopulateDeviceMacroSelector();

    PopulatePinList();
    PopulatePinModeList();
    PopulateIsAnalogList();
    PopulateBindingTypeList();
    PopulateBindingAssignmentList();
    if (device.inputs.length > 0) {
        SetInputControlsFromDevice(0);
    }




    document.getElementById("comboAllInputs").value = 0;
}


function PopulateDeviceInputSelector() {
    inputList = device.inputs;

    if (inputList.length > 0) {
        document.getElementById("currentInputControl").hidden = false;
    } else {
        document.getElementById("currentInputControl").hidden = true;
    }

    // if (inputList.length > 0) {
    //     document.getElementById("pageInput").hidden = false;
    // } else {
    //     document.getElementById("pageInput").hidden = true;
    // }

    selector = document.getElementById("comboAllInputs");
    ClearOptions(selector);

    let bindingType
        // assignmentList = GetAssignmentList(bindingType);
        //console.log("len: " + inputList.length);
    for (var i = 0; i < inputList.length; i++) {
        //console.log("i:" + i);
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

function PopulateDeviceMacroSelector() {
    macroList = device.macros;

    // if (inputList.length > 0) {
    //     document.getElementById("pageInput").hidden = false;
    // } else {
    //     document.getElementById("pageInput").hidden = true;
    // }

    selector = document.getElementById("comboAllMacros");
    ClearOptions(selector);

    for (var i = 0; i < macroList.length; i++) {
        AddNewOption(selector,
            i + " " +
            macroList[i].macroName, i);
    }
    selector.value = 0;
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

    isAnalog = device.GetInput(idx).GetIsAnalog()
    SetComboBoxValue("comboAnalogMode",
        isAnalog);
    HideAnalogControls(isAnalog == 0);

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

function SetMacroControlsFromDevice(idx) {
    console.log(idx);
    macro = device.GetMacro(idx);
    bindings = macro.GetBindings();

    document.querySelector('#inputMacroName').value = macro.GetMacroName().trim();

    ClearMacroBindingRows();
    for (var i = 0; i < bindings.length; i++) {
        var row = AddMacroBindingRow(i);
        var comboDeviceType = row.querySelector("#comboMacroDeviceType");
        comboDeviceType.value = bindings[i].GetDeviceType();

        var comboInputType = row.querySelector("#comboMacroInputType");
        comboInputType.value = bindings[i].GetBindingType();

        var comboAssignedInput = row.querySelector("#comboMacroAssignment");
        ClearOptions(comboAssignedInput);
        options = GetAssignmentList(comboInputType.value);
        for (var o = 0; o < options.length; o++) {
            AddNewOption(comboAssignedInput, options[o], o);
        }
        comboAssignedInput.value = bindings[i].GetAssignedInput();
        //console.log(bindings[i].GetAssignedInput())

        row.querySelector("#comboMacroValue").value = bindings[i].GetValue();
    }
    console.log(macro);
}

function onMacroNameChange(textBox) {
    console.log(textBox.value);
    newMacroName = textBox.value;

    selectedMacroIdx = document.getElementById("comboAllMacros").value;
    device.GetMacro(selectedMacroIdx).SetMacroName(newMacroName);

    SendMacroNameUpdate(selectedMacroIdx);
}

// TODO: Alternate device types not implement yet (keyboard/mouse etc)
function onComboMacroDeviceChange(comboBox) {}

function onComboMacroInputChange(comboBox) {
    newInputTypeIdx = comboBox.value
    bindingIdx = comboBox.parentElement.parentElement.getAttribute("idx");
    selectedMacroIdx = document.getElementById("comboAllMacros").value;
    selectedMacro = device.GetMacro(selectedMacroIdx)
    binding = selectedMacro.GetBinding(bindingIdx);

    // Update AssignedInput combobox to correct Input type options
    var comboAssignedInput = comboBox.parentElement.parentElement.querySelector("#comboMacroAssignment");
    ClearOptions(comboAssignedInput);
    options = GetAssignmentList(comboBox.value);
    for (var o = 0; o < options.length; o++) {
        AddNewOption(comboAssignedInput, options[o], o);
    }
    comboAssignedInput.value = 0; //bindings[i].GetAssignedInput();

    binding.SetBindingType(newInputTypeIdx);
    SendMacroBindingUpdate(selectedMacroIdx, bindingIdx);
}

function onComboMacroAssignmentChange(comboBox) {
    // index.value == new assignment
    newAssignmentIdx = comboBox.value
    bindingIdx = comboBox.parentElement.parentElement.getAttribute("idx");
    selectedMacroIdx = document.getElementById("comboAllMacros").value;
    selectedMacro = device.GetMacro(selectedMacroIdx)
    binding = selectedMacro.GetBinding(bindingIdx);

    binding.SetAssignedInput(parseInt(newAssignmentIdx));
    SendMacroBindingUpdate(selectedMacroIdx, bindingIdx);
}

function onInputMacroValueChange(comboBox) {
    // index.value == new assignment
    try {
        newValue = parseInt(comboBox.value);
    } catch {
        newValue = 0
    }
    bindingIdx = comboBox.parentElement.parentElement.getAttribute("idx");
    selectedMacroIdx = document.getElementById("comboAllMacros").value;
    selectedMacro = device.GetMacro(selectedMacroIdx)
    binding = selectedMacro.GetBinding(bindingIdx);

    if (isNaN(newValue)) {
        newValue = 0;
    } else if (newValue < 0) {
        console.log(newValue + " is less than zero :-(");
        newValue = 0;
        comboBox.value = newValue;
    } else if (newValue > 4095) {
        console.log(newValue + " is more than 4095 :-(");
        newValue = 4095;
        comboBox.value = newValue;
    }
    console.log(newValue);
    comboBox.value = newValue;

    binding.SetValue(newValue);
    SendMacroBindingUpdate(selectedMacroIdx, bindingIdx);
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
        AddNewOption(comboPinMode, pinModeList[i], device.GetPinModeInt(i));
        //console.log(i + " : " + pinModeList[i] + " : " + device.GetPinModeInt(i));
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
    console.log(comboBindingType.selectedIndex);
    if (comboBindingType.selectedIndex == -1) {
        return;
    }
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
    PopulateDeviceInputSelector();

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

    HideAnalogControls(comboPin.value == 0);

    SendDeviceInputUpdate(selectedInputIndex);
}

function HideAnalogControls(doHide) {
    document.getElementById("analogControls").hidden = doHide;
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
    document.getElementById("pageInput").hidden = false;
    document.getElementById("pageMacros").hidden = true;
}

function onSelectedMacroChange() {
    selectedInputIndex = document.getElementById("comboAllMacros").value;
    SetMacroControlsFromDevice(selectedInputIndex);
    // document.getElementById("pageInput").hidden = false;
    // document.getElementById("pageMacros").hidden = true;
}

function onAddInput() {
    LockControls(true);
    device.AddInputDefault();
    PopulateDeviceInputSelector();
    document.getElementById("comboAllInputs").value =
        device.inputs.length - 1;
    document.getElementById("currentInputControl").hidden = false;
    onSelectedInputChange();
    SendDeviceInputUpdate(selectedInputIndex);
}

function onAddMacro() {

    LockControls(true);
    device.AddNewMacro();
    PopulateDeviceMacroSelector();
    document.getElementById("comboAllMacros").value =
        device.macros.length - 1;
    onSelectedMacroChange();
    SendDeviceMacroConfig(selectedInputIndex)
}

function onOpenMacroPage() {
    document.getElementById("pageInput").hidden = true;
    document.getElementById("pageMacros").hidden = false;
}

function onOpenInputPage() {
    document.getElementById("pageInput").hidden = false;
    document.getElementById("pageMacros").hidden = true;
}

function onDeleteInput() {
    device.DeleteInput(selectedInputIndex);
    SendDeleteInputRequest(selectedInputIndex);
    PopulateDeviceInputSelector();

    if (device.inputs.length > 0) {
        document.getElementById("comboAllInputs").value = 0
        onSelectedInputChange();
    } else {
        document.getElementById("currentInputControl").hidden = true;

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

function SendRequest(request, returnCode) {
    waitStart = new Date();
    lastSent = request;

    if (serialWaitingOn != 0) {
        console.warn("TOO BUSY TO SEND " + request);
        console.warn("Waiting on: " + returnCode + ": " + CodeToString(returnCode));
        console.log(queuedMessages);

        if (returnCode != INCOMING_RESPONSE_INPUT_VALUES) {
            if (serialWaitingOn == returnCode) {
                sendAttempts += 1;
                console.log("ATTEMPTS: " + sendAttempts);
                // Send again if same
                serial.write(request);

            } else {
                // Otherwise add to queue
                queuedMessages.push([request, returnCode, 0])
            }

        } else {
            queuedMessages = [];
            serialWaitingOn = 0;
        }
    } else {
        serialWaitingOn = returnCode;
        sendAttempts = 0;
        serial.write(request);
        if (PRINT_OUTGOING_MESSAGES) {
            console.log("SEND: " + request);
        }
    }
}

function SendHandShake() {
    console.log("sending handshake");
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_HANDSHAKE_REQUEST, 13, 10]);
    //waitStart = new Date();
    //waitingOnHandshake = true;
    //serial.write(request);
    SendRequest(request, INCOMING_HANDSHAKE_RESPONSE);
}

function SendDeviceConfigRequest(idx) {
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_CONFIG_REQUEST, 13, 10]);
    SendRequest(request, INCOMING_CONFIG_RESPONSE);
    //serial.write(request);
}

function SendInputConfigRequestAll() {
    console.log("Sending input config request All");
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_INPUT_CONFIG_REQUEST_ALL, 13, 10]);

    SendRequest(request, INCOMING_INPUT_CONFIG_RESPONSE_ALL);
}

function SendInputConfigRequest(idx) {
    console.log("Sending input config request " + idx);
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_INPUT_CONFIG_REQUEST, idx, 13, 10]);

    SendRequest(request, INCOMING_INPUT_CONFIG_RESPONSE);
}

function SendDeviceMacroConfig(index) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_MACRO_CONFIG_UPDATE);
    request.push(index);
    macroName = device.GetMacro(index).GetMacroName();
    for (var i = 0; i < 16; i++) {
        request.push(macroName.codePointAt(i));
    }
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    SendRequest(request, INCOMING_RESPONSE_MACRO_CONFIG_UPDATE);
    LockControls(true);
}

function SendMacroConfigRequest(idx) {
    console.log("Sending macro config request " + idx);
    request = new Uint8Array([OUTGOING_REQUEST_HEADER, OUTGOING_REQUEST_MACRO_CONFIG, idx, 13, 10]);

    SendRequest(request, INCOMING_RESPONSE_MACRO_CONFIG);
}

function SendDeleteInputRequest(index) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_DELETE_INPUT_UPDATE);
    request.push(index);
    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    SendRequest(request, INCOMING_RESPONSE_DELETE_INPUT_UPDATE);
    LockControls(true);
    //serial.write(request);
}

function SendDeviceInputUpdate(index, sendAll = false) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_INPUT_CONFIG_UPDATE);
    request.push(index);
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

function SendMacroNameUpdate(macroIdx) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_MACRO_NAME_UPDATE);
    request.push(parseInt(macroIdx));

    macroName = device.GetMacro(macroIdx).GetMacroName();
    for (var i = 0; i < 16; i++) {
        request.push(macroName.codePointAt(i));
    }

    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    console.log("SENDING:" + request);
    SendRequest(request, INCOMING_RESPONSE_MACRO_NAME_UPDATE);
}

function SendMacroBindingUpdate(macroIdx, bindingIdx) {
    request = []
    request.push(OUTGOING_REQUEST_HEADER);
    request.push(OUTGOING_REQUEST_MACRO_BINDING_UPDATE);
    request.push(macroIdx);
    request.push(bindingIdx);
    bindingData = device.GetMacro(macroIdx).GetBinding(bindingIdx).ToIntArray();
    for (var i = 0; i < bindingData.length; i++) {
        request.push(bindingData[i]);
    }

    request.push(13);
    request.push(10);
    request = new Uint8Array(request);
    console.log("SENDING:" + request);
    SendRequest(request, INCOMING_RESPONSE_MACRO_BINDING_UPDATE);
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
    SendRequest(request, INCOMING_RESPONSE_INPUT_VALUES);

}

function OnHandshakeSuccessful() {

    console.log("Handshake Response Received");
    waitingOnHandshake = false;
    SendDeviceConfigRequest();
}

function ParseInputConfigResponse(response) {
    var inputIdx = response[1];
    console.log("received input: " + inputIdx);
    device.AddInput(response.slice(2, 20 + 2));
}

function ParseMacroConfigResponse(response) {
    var macroIdx = response[1];
    console.log("received macro: " + macroIdx);
    console.log(response);
    device.AddMacroFromConfig(response);
}

function ParseInputConfigResponseAll(response) {
    var inputCount = response[1];
    if (inputCount == 0) {
        console.log("No inputs")
    } else {
        console.log(inputCount + " inputs");
        for (var i = 0; i < inputCount * 20; i += 20) {
            device.AddInput(response.slice(i + 2, i + 20 + 2));
        }
    }
    // var macroAddress = inputCount * 20 + 2;
    // var macroCount = response[macroAddress];

    // macroAddress = macroAddress + 1
    // if (macroCount > 0) {
    //     currentMacro = 0;
    //     byteCount = device.AddMacroFromConfig(response, macroAddress);
    // }


    // console.log("bindgin counr: " + bindingCount);
    // for (var i = macroAddress + 1; i < response.length; i++) {
    //     console.log(i + ": " + response[i]);
    // }
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
    if (response[0] == INCOMING_RESPONSE_HEADER) {
        temp = []
        for (var i = 1; i < response.length; i++) {
            temp.push(response[i]);
        }
        response = temp;
    } else {
        console.log("INVALID: " + response);
        return;
    }

    if (PRINT_INCOMING_MESSAGES) {
        console.log("RECV: " + response);
    }

    if (response[0] == INCOMING_RESPONSE_INPUT_VALUES) {
        serialWaitingOn = 0;
        ParseInputValues(response);

    } else if (response[0] == INCOMING_HANDSHAKE_RESPONSE) {
        serialWaitingOn = 0;
        OnHandshakeSuccessful();
        isConnected = true;

    } else if (response[0] == INCOMING_CONFIG_RESPONSE) {
        console.log("Device Config Received");
        serialWaitingOn = 0;
        device.SetFromConfigPacket(response);
        device.SetDeviceBlueprint(GetDeviceTarget(device.microcontroller));
        InitializeInputControls();
        SetDeviceDescriptionFromDevice();

        console.log("Sending input request: " + device.AllInputsLoaded());
        if (!device.AllInputsLoaded()) {
            SendInputConfigRequest(device.inputsLoaded);
        } else {
            if (!device.AllMacrosLoaded()) {
                SendMacroConfigRequest(device.macrosLoaded);
            } else {
                LockControls(false);
            }
        }

    } else if (response[0] == INCOMING_RESPONSE_MACRO_CONFIG) {
        console.log("Device Macro Config Received");
        serialWaitingOn = 0;
        ParseMacroConfigResponse(response);
        if (!device.AllMacrosLoaded()) {
            SendMacroConfigRequest(device.macrosLoaded);
        } else {
            console.log("Received All Input Configs");
            console.log(device);
            InitializeInputControls();
            LockControls(false);
        }
    } else if (response[0] == INCOMING_INPUT_CONFIG_RESPONSE) {
        console.log("Device Input Config Received");
        serialWaitingOn = 0;
        ParseInputConfigResponse(response);
        if (!device.AllInputsLoaded()) {
            SendInputConfigRequest(device.inputsLoaded);
        } else {
            if (!device.AllMacrosLoaded()) {
                SendMacroConfigRequest(device.macrosLoaded);
            } else {
                console.log("Received All Input Configs");
                InitializeInputControls();
                LockControls(false);
            }
        }

    } else if (response[0] == INCOMING_INPUT_CONFIG_RESPONSE_ALL) {
        serialWaitingOn = 0;
        console.log("Device Input Config Received");
        ParseInputConfigResponseAll(response);


    } else if (response[0] == INCOMING_INPUT_CONFIG_UPDATE_RESPONSE) {
        serialWaitingOn = 0;
        console.log("Device Input Update Confirmation Received");
        if (response[2] == 111 && response[3] == 107) {
            console.log("OK");
            //SendRequestSaveToFlash();
        }
        LockControls(false);
    } else if (response[0] == INCOMING_RESPONSE_DELETE_INPUT_UPDATE) {
        serialWaitingOn = 0;
        console.log("Device Input Delete Confirmation Received");
        if (response[2] == 111 && response[3] == 107) {
            console.log("OK");
            //SendRequestSaveToFlash();
        }
        LockControls(false);

    } else if (response[0] == INCOMING_RESPONSE_MACRO_BINDING_UPDATE) {
        console.log("Macro binding update confirmed");
        serialWaitingOn = 0;
        LockControls(false);

    } else if (response[0] == INCOMING_RESPONSE_MACRO_CONFIG_UPDATE) {
        console.log("Add Macro update confirmed");
        serialWaitingOn = 0;
        LockControls(false);

    } else if (response[0] == INCOMING_RESPONSE_MACRO_NAME_UPDATE) {
        console.log("Add Macro name confirmed");
        serialWaitingOn = 0;
        LockControls(false);

    } else if (response[0] == INCOMING_RESPONSE_SAVE_TO_FLASH) {
        console.log("Saved to flash confirmed");
        console.log(response);
        serialWaitingOn = 0;
        LockControls(false);
    }

}


function LockControls(lock) {
    if (lock) {

        document.getElementById("loadingSpinner").hidden = false;
    } else {

        document.getElementById("loadingSpinner").hidden = true;
    }

    // Input selector
    document.getElementById("comboAllInputs").disabled = lock;

    // Input page
    document.getElementById("inputPin").disabled = lock;
    document.getElementById("inputPinMode").disabled = lock;
    document.getElementById("comboAnalogMode").disabled = lock;
    document.getElementById("comboBindingType").disabled = lock;
    document.getElementById("comboBindingAssignment").disabled = lock;
    document.getElementById("checkInverted").disabled = lock;
    document.getElementById("inputMinVal").disabled = lock;
    document.getElementById("inputMidVal").disabled = lock;
    document.getElementById("inputMaxVal").disabled = lock;
    document.getElementById("inputDeadZone").disabled = lock;
    document.getElementById("inputFilterSize").disabled = lock;


    // All buttons
    var elements = document.getElementsByClassName("btn");
    for (var i = 0; i < elements.length; i++) {
        elements[i].disabled = lock;
    }
}