class Device {

    constructor() {
        this.deviceName = "unknown device";
        this.firmwareVersion = 0;
        this.microcontroller = 0;

        this.deviceBlueprint;
        this.inputs = [];
        this.inputCount = 3;
        this.inputsLocked = true;

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
}