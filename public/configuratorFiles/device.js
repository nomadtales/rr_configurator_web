class Device {

    constructor() {
        this.deviceName = "unknown device";
        this.firmwareVersion = 0;
        this.microcontroller = 0;

        this.deviceBlueprint;
        this.inputs = [];
        this.inputsLocked = true;

        this.macros = [];

        this.inputsLoaded = 0;
        this.macrosLoaded = 0;

        // var newInput = new DeviceInput();
        // //newInput.SetFromConfigPacket(data);
        // this.inputs.push(newInput);

    }

    AllInputsLoaded() {
        return this.inputCount == this.inputsLoaded;
    }

    AllMacrosLoaded() {
        return this.macroCount == this.macrosLoaded;
    }

    GetBlueprintInputList() {
        if (this.deviceBlueprint == null) {
            console.log("blueprint not assigned yet");
            return [];
        }
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

        // Can remove this check later, data length of 6 means macro count wasn't put in yet
        if (data.length != 6) {
            this.macroCount = data[4];
        }
        console.log(this);
    }

    SetDeviceBlueprint(deviceBlueprint) {
        this.deviceBlueprint = deviceBlueprint;
    }

    AddNewMacro() {
        var newMacro = new Macro();
        this.macros.push(newMacro);
        newMacro.AddBindingDefault();
    }

    GetMacro(idx) {
        return this.macros[idx];
    }

    AddInputDefault() {
        var newInput = new DeviceInput(this.deviceBlueprint.PWM_MAX);
        this.inputs.push(newInput);
    }

    AddInput(data) {
        console.log("input: " + data);
        console.log(data);
        var newInput = new DeviceInput(this.deviceBlueprint.PWM_MAX);
        newInput.SetFromConfigPacket(data);
        this.inputs.push(newInput);
        this.inputsLoaded += 1;
    }

    DeleteInput(index) {
        this.inputs.splice(index, 1);
        console.log("deleted index");
        console.log(this.inputs);
    }

    // Constant for pinMode is different for 
    // different microcontrollers. Defined
    // in the blueprint.
    GetPinModeInt(idx) {
        //console.log(this.deviceBlueprint);
        switch (idx) {
            case 0:
                return this.deviceBlueprint.INPUT;
            case 1:
                return this.deviceBlueprint.INPUT_PULLUP;
            case 2:
                return this.deviceBlueprint.INPUT_PULLDOWN;
            case 3:
                return this.deviceBlueprint.OUTPUT;
            default:
                return 0;
        }
    }

    // convert(num) {
    //     return num
    //         .toString() // convert number to string
    //         .split('') // convert string to array of characters
    //         .map(Number) // parse characters as numbers
    //         .map(n => (n || 10) + 64) // convert to char code, correcting for J
    //         .map(c => String.fromCharCode(c)) // convert char codes to strings
    //         .join(''); // join values together
    // }

    AddMacroFromConfig(data) {
        this.macrosLoaded += 1;

        var newMacro = new Macro();
        this.macros.push(newMacro)

        var nameLocation = 2;
        var nameArray = data.slice(nameLocation, nameLocation + 16);
        var nameString = "";
        for (var i = 0; i < 16; i++) {
            if (nameArray[i] == '0') {
                break;
            }
            nameString += String.fromCharCode(nameArray[i]);
        }
        console.log("Macro Name: " + nameString);
        newMacro.SetMacroName(nameString);

        var bindingCountLocation = 18;
        var bindingCount = data[bindingCountLocation];
        console.log("binding count: " + bindingCount);

        var startAddress = bindingCountLocation + 1;
        let newBinding;
        for (var b = 0; b < bindingCount; b++) {
            newBinding = new Binding();

            var start = startAddress + (7 * b);
            var end = start + 7;
            var snippedData = data.slice(start, end)
            newBinding.SetFromConfigPacket(snippedData)
            newMacro.AddBinding(newBinding);
        }


    }

}


class DeviceInput {
    constructor(pwm_max) {
        this.pin = 2;
        this.pinMode = 1;
        this.isAnalog = 0;
        this.isInverted = 0;
        this.minVal = 0;
        this.midVal = Math.round(pwm_max / 2);
        this.maxVal = pwm_max;
        this.deadZone = Math.round(pwm_max / 16);
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

        data = data.slice(13);
        console.log(data);
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
        this.macroName = "New Macrow";
        this.bindings = []

        //this.AddBinding();
    }

    SetMacroName(newName) {
        if (newName.length > 16) {
            newName = newName.slice(15);
        } else if (newName.length < 16) {
            while (newName.length < 16) {
                newName = newName + " ";
                //console.log(newName);
            }
        }
        console.log(newName + ": " + newName.length);

        this.macroName = newName;
    }

    GetMacroName() {
        return this.macroName;
    }

    AddBinding(binding) {
        //var newBinding = new Binding();
        this.bindings.push(binding);
    }

    AddBindingDefault() {
        this.bindings.push(new Binding());
    }

    GetBinding(idx) {
        return this.bindings[idx];
    }

    GetBindings() {
        return this.bindings;
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

    GetDeviceType() {
        return this.deviceType;
    }

    SetDeviceType(deviceType) {
        this.deviceType = deviceType;
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

    GetValue() {
        return this.value;
    }

    SetValue(val) {
        this.value = val;
    }

    SetFromConfigPacket(data) {
        //console.log(data);
        this.deviceType = data[0]
        this.inputType = data[1]
        this.assignedInput = data[2];
        this.value = data[3] << 8
        this.value = data[4];
        this.state = data[5];
        this.trigger = data[6];
    }

    SetValue(value) {
        this.value = value;
    }

    GetValue() {
        return this.value;
    }

    SetState(state) {
        this.state = state;
    }

    GetState() {
        return this.state;
    }

    ToIntArray() {
        var bytes = [];
        bytes.push(this.deviceType);
        bytes.push(this.inputType);
        bytes.push(this.assignedInput);
        bytes.push((this.value >> 8));
        bytes.push(this.value & 0xff);
        bytes.push(this.state);
        bytes.push(this.trigger);
        console.log(bytes);
        return bytes
    }
}