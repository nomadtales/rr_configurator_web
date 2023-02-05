class Pin {
    constructor(gpio = 0, input = 0, output = 0, note = "") {
        this.gpio = gpio;
        this.input = input;
        this.output = output;
        this.note = note;
    }
}


// Target Microcontroller Definitions
function GetDeviceTarget(microcontrollerIdx) {
    for (var i = 0; i < MICROCONTROLLERS.length; i++) {
        if (MICROCONTROLLERS[i].index == microcontrollerIdx) {
            return MICROCONTROLLERS[i];
        }
    }
    return null;
}


const targetESP32 = {
    index: 0,
    microcontrollerName: "ESP32",
    pins: [],
    INPUT: 1,
    INPUT_PULLUP: 5,
    INPUT_PULLDOWN: 9,
    OUTPUT: 3,
    PWM_MAX: 4095
};

const targetRP2040 = {
    index: 3,
    microcontrollerName: "RP2040",
    pins: [],
    INPUT: 0,
    INPUT_PULLUP: 2,
    INPUT_PULLDOWN: 3,
    OUTPUT: 1,
    PWM_MAX: 1023
};

targetESP32.pins.push(new Pin(0, 0, 0, "Flashing Enable Pin, must be LOW to enter flashing mode"));
targetESP32.pins.push(new Pin(1, 0, 0, "Debug output"));
targetESP32.pins.push(new Pin(2, 1, 1, "Must be floating or LOW to enter flashing mode"))
targetESP32.pins.push(new Pin(3, 0, 0, "HIGH at boot"))
targetESP32.pins.push(new Pin(4, 1, 1))
targetESP32.pins.push(new Pin(5, 1, 1, "Outputs PWM signal at boot, must be HIGH during boot"))
targetESP32.pins.push(new Pin(6, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(7, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(8, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(9, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(10, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(11, 0, 0, "Connected to integrated SPI flash"))
targetESP32.pins.push(new Pin(12, 1, 1, "Must be LOW during boot"))
targetESP32.pins.push(new Pin(13, 1, 1))
targetESP32.pins.push(new Pin(14, 1, 1, "Outputs PWM signal at boot"))
targetESP32.pins.push(new Pin(15, 1, 1, "Outputs PWM signal at boot, must be HIGH during boot"))
targetESP32.pins.push(new Pin(16, 1, 1))
targetESP32.pins.push(new Pin(17, 1, 1))
targetESP32.pins.push(new Pin(18, 1, 1))
targetESP32.pins.push(new Pin(19, 1, 1))
targetESP32.pins.push(new Pin(21, 1, 1))
targetESP32.pins.push(new Pin(22, 1, 1))
targetESP32.pins.push(new Pin(23, 1, 1))
targetESP32.pins.push(new Pin(25, 1, 1))
targetESP32.pins.push(new Pin(26, 1, 1))
targetESP32.pins.push(new Pin(27, 1, 1))
targetESP32.pins.push(new Pin(32, 1, 1))
targetESP32.pins.push(new Pin(33, 1, 1))
targetESP32.pins.push(new Pin(34, 1, 0, "Input only"))
targetESP32.pins.push(new Pin(35, 1, 0, "Input only"))
targetESP32.pins.push(new Pin(36, 1, 0, "Input only"))
targetESP32.pins.push(new Pin(39, 1, 0, "Input only"))

for (var i = 0; i < 22; i++) {
    targetRP2040.pins.push(new Pin(i, 1, 1))
}
targetRP2040.pins.push(new Pin(26, 1, 1))
targetRP2040.pins.push(new Pin(27, 1, 1))
targetRP2040.pins.push(new Pin(28, 1, 1))



const MICROCONTROLLERS = [targetESP32, targetRP2040];



DIGITAL = 0
ANALOG = 1
const analogModes = ["DIGITAL", "ANALOG"]

// PinModes as defined by ESP32 
INPUT = 1
INPUT_PULLUP = 5
INPUT_PULLDOWN = 9
OUTPUT = 3

// function GetPinMode(esp32val) {
//     if (esp32val == INPUT) {
//         return pinModes[0];
//     } else if (esp32val == INPUT_PULLUP) {
//         return pinModes[1];
//     } else if (esp32val == INPUT_PULLDOWN) {
//         return pinModes[2];
//     } else if (esp32val == OUTPUT) {
//         return pinModes[3];
//     } else {
//         return "UNKNOWN";
//     }
// }

const pinModes = ["INPUT", "INPUT_PULLUP", "INPUT_PULLDOWN", "OUTPUT"];
const pinModeInt = [INPUT, INPUT_PULLUP, INPUT_PULLDOWN, OUTPUT];


// HID Input Types
GAMEPAD_BUTTON = 1 // 1-128
GAMEPAD_AXIS = 2 // 0-7  x, y, z, rZ, rX, rY, slider1, slider2
GAMEPAD_HAT = 3 // 3 hats, 8 directions each, assignedInput = dir + hatIdx*9
GAMEPAD_SPECIAL = 4

inputTypes = ["NONE", "BUTTON", "AXIS", "HAT"]

inputsGamepadButtons = ["NONE"]
for (var i = 1; i < 129; i++) {
    inputsGamepadButtons.push("Button " + i.toString())
}
inputsGamepadAxes = ["X Axis", "Y Axis", "Z Axis", "rX Axis", "rY Axis", "rZ Axis", "Slider 1", "Slider 2"];
inputsGamepadHatDirections = ["NONE", "N", "NE", "E", "SE", "S", "SW", "W", "NW"];
inputsGamepadHats = []
for (var i = 1; i < 5; i++) {
    for (var h = 0; h < inputsGamepadHatDirections.length; h++) {

        inputsGamepadHats.push("Hat " + i.toString() + " " + inputsGamepadHatDirections[h])
    }
}

// Takes string ("BUTTON", "AXIS") etc and returns list of applicable assignments
function GetAssignmentList(inputType) {
    // var indexOf = 0;
    // for (var i = 0; i < inputTypes.length; i++) {
    //     if (inputTypes[i] == inputType) {
    //         indexOf = i;
    //     }
    // }
    indexOf = inputType;

    if (indexOf == GAMEPAD_BUTTON) {
        return inputsGamepadButtons
    } else if (indexOf == GAMEPAD_AXIS) {
        return inputsGamepadAxes
    } else if (indexOf == GAMEPAD_HAT) {
        return inputsGamepadHats
    } else {
        return ["NONE"]
    }
}