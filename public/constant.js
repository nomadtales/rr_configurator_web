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
    pins: []
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

const MICROCONTROLLERS = [targetESP32];