class Device {

    constructor() {
        this.deviceName = "unknown device";
        this.firmwareVersion = 0;
        this.microcontroller = 0;

        this.deviceBlueprint;
        this.inputs = [];
        this.inputCount = 3;
        this.inputsLocked = true;

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

    AddInput(data) {
        console.log("input: " + data);
        var newInput = new DeviceInput();
        newInput.SetFromConfigPacket(data);
        this.inputs.push(newInput);
    }

}


class DeviceInput {
    constructor() {
        this.pin = 0;
        this.pinMode = 0;
        this.isAnalog = 0;
        this.isInverted = 0;
        this.minVal = 0;
        this.midVal = 2048;
        this.maxVal = 4096;
        this.deadZone = 512;
        this.enableFiltering = 0;
        this.bufferSize = 0;

        this.binding = new Binding();

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
    }

    ToIntArray() {
        var bytes = [];
        bytes.push(this.pin);
        bytes.push(this.pinMode);
        bytes.push(this.isAnalog);
        bytes.push(this.isInverted);

        bytes.push((this.minVal >> 8)); // highbyte
        bytes.push(this.minVal & 0xff); // lowbyte

        bytes.push((this.minVal >> 8));
        bytes.push(this.minVal & 0xff);

        bytes.push((this.midVal >> 8));
        bytes.push(this.midVal & 0xff);

        bytes.push((this.maxVal >> 8));
        bytes.push(this.maxVal & 0xff);

        bytes.push(this.bufferSize);

        var binding = this.binding.ToIntArray();
        for (var i = 0; i < this.binding.ToIntArray().length; i++) {
            bytes.push(binding[i]);
        }

        return bytes;
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

    SetConfig(data) {
        this.deviceType = data[13]
        this.inputType = data[14]
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