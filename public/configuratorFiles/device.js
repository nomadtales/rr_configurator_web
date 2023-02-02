class Device {

    constructor() {
        this.deviceName = "unknown device";
        this.firmwareVersion = 0;
        this.microcontroller = 0;

        this.deviceBlueprint;
        this.inputs = [];
        this.inputCount = 3;
        this.inputsLocked = true;

        this.macros = [];

        // var newInput = new DeviceInput();
        // //newInput.SetFromConfigPacket(data);
        // this.inputs.push(newInput);

    }

    GetBlueprintInputList() {
        var inputPins = []
        for (var i = 0; i < this.deviceBlueprint.pins.length; i++) {
            if (this.deviceBlueprint.pins[i].input == 1) {
                inputPins.push(this.deviceBlueprint.pins[i].gpio);
            }
        }
        return inputPins;
    }

    GetDeviceName() {
        return this.deviceName;
    }

    GetDeviceType() {
        return this.deviceBlueprint.microcontrollerName;
    }

    GetFirmwareVersion() {
        return this.firmwareVersion;
    }

    GetInput(idx) {
        return this.inputs[idx];
    }

    SetFromConfigPacket(data) {
        this.microcontroller = data[1];
        // this.deviceBlueprint = GetDeviceTarget(this.microcontroller);
        this.firmwareVersion = data[2];
        this.inputCount = data[3];

        console.log(this);
    }

    SetDeviceBlueprint(deviceBlueprint) {
        this.deviceBlueprint = deviceBlueprint;
    }

    AddNewMacro() {
        var newMacro = new Macro();
        this.macros.push(newMacro);
    }

    GetMacro(idx) {
        return this.macros[idx];
    }

    AddInputDefault() {
        var newInput = new DeviceInput();
        this.inputs.push(newInput);
    }

    AddInput(data) {
        console.log("input: " + data);
        var newInput = new DeviceInput();
        newInput.SetFromConfigPacket(data);
        this.inputs.push(newInput);
    }

    DeleteInput(index) {
        this.inputs.splice(index, 1);
        console.log("deleted index");
        console.log(this.inputs);
    }

}


class DeviceInput {
    constructor() {
        this.pin = 2;
        this.pinMode = 1;
        this.isAnalog = 0;
        this.isInverted = 0;
        this.minVal = 0;
        this.midVal = 2048;
        this.maxVal = 4096;
        this.deadZone = 512;
        this.bufferSize = 0;

        this.binding = new Binding();

    }

    GetPin() {
        return this.pin;
    }

    SetPin(val) {
        this.pin = val;
    }

    GetPinMode() {
        return this.pinMode;
    }

    SetPinMode(val) {
        this.pinMode = val;
    }

    GetIsAnalog() {
        return this.isAnalog;
    }

    SetIsAnalog(val) {
        this.isAnalog = val;
    }

    GetIsInverted() {
        return this.isInverted;
    }

    SetIsInverted(val) {
        this.isInverted = val;
    }

    GetMinVal() {
        return this.minVal;
    }

    SetMinVal(val) {
        this.minVal = val;
    }

    GetMidVal() {
        return this.midVal;
    }

    SetMidVal(val) {
        this.midVal = val;
    }

    GetMaxVal() {
        return this.maxVal;
    }

    SetMaxVal(val) {
        this.maxVal = val;
    }

    GetDeadZone() {
        return this.deadZone;
    }

    SetDeadZone(val) {
        this.deadZone = val;
    }

    GetBufferSize() {
        return this.bufferSize;
    }

    SetBufferSize(val) {
        this.bufferSize = val;
    }

    GetBindingType() {
        return this.binding.GetBindingType()
    }

    SetBindingType(val) {
        this.binding.SetBindingType(val);
    }

    GetAssignedInput() {
        return this.binding.GetAssignedInput();
    }

    SetAssignedInput(val) {
        this.binding.SetAssignedInput(val);
    }

    SetFromConfigPacket(data) {
        this.pin = data[0]
        this.pinMode = data[1]
        this.isAnalog = data[2]
        this.isInverted = data[3]
        this.minVal = data[4] << 8
        this.minVal += data[5]
        this.midVal = data[6] << 8
        this.midVal += data[7]
        this.maxVal = data[8] << 8
        this.maxVal += data[9]
        this.deadZone = data[10] << 8
        this.deadZone += data[11]
        this.bufferSize = data[12]

        this.binding.SetFromConfigPacket(data);
    }

    ToIntArray() {
        var bytes = [];
        bytes.push(this.pin);
        bytes.push(this.pinMode);
        bytes.push(this.isAnalog);
        bytes.push(this.isInverted);

        bytes.push((this.minVal >> 8)); // highbyte
        bytes.push(this.minVal & 0xff); // lowbyte

        bytes.push((this.midVal >> 8));
        bytes.push(this.midVal & 0xff);

        bytes.push((this.maxVal >> 8));
        bytes.push(this.maxVal & 0xff);

        bytes.push((this.deadZone >> 8));
        bytes.push(this.deadZone & 0xff);

        bytes.push(this.bufferSize);

        var binding = this.binding.ToIntArray();
        for (var i = 0; i < this.binding.ToIntArray().length; i++) {
            bytes.push(binding[i]);
        }

        return bytes;
    }
}

class Macro {
    constructor() {
        this.macroName = "New Macro";
        this.bindings = []

        this.AddBinding();
    }

    AddBinding() {
        var newBinding = new Binding();
        this.bindings.push(newBinding);
    }

    GetBinding(idx) {
        return this.bindings[idx];
    }
}


class Binding {
    constructor() {
        this.deviceType = 1; //constant.GAMEPAD
        this.inputType = 1; //constant.GAMEPAD_BUTTON
        this.assignedInput = 0;
        this.value = 0;
        this.state = 0; //constant.BUTTON_UP
        this.trigger = 4;
    }

    GetBindingType() {
        return this.inputType;
    }

    SetBindingType(val) {
        this.inputType = val;
    }

    GetAssignedInput() {
        return this.assignedInput;
    }

    SetAssignedInput(val) {
        this.assignedInput = val;
    }

    SetFromConfigPacket(data) {
        this.deviceType = data[13]
        this.inputType = data[14]
        console.log("INPUT TYPE: " + this.inputType);
        this.assignedInput = data[15]
        this.value = data[16] << 8
        this.value += data[17]
        this.state = data[18]
        this.trigger = data[19]
    }

    ToIntArray() {
        var bytes = [];
        bytes.push(this.deviceType);
        bytes.push(this.inputType);
        bytes.push(this.assignedInput);
        bytes.push(this.state);
        bytes.push(this.trigger);
        return bytes
    }
}