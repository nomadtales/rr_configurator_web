const SerialEvents = Object.freeze({
    CONNECTION_OPENED: Symbol("New connection opened"),
    CONNECTION_CLOSED: Symbol("Connection closed"),
    DATA_RECEIVED: Symbol("New data received"),
    ERROR_OCCURRED: Symbol("Error occurred"),
});


class Serial {
    constructor() {
        this.serialPort = null;
        this.serialWriter = null;
        this.serialReader = null;

        this.events = new Map();

        this.knownEvents = new Set(
            [SerialEvents.CONNECTION_OPENED,
                SerialEvents.CONNECTION_CLOSED,
                SerialEvents.DATA_RECEIVED,
                SerialEvents.ERROR_OCCURRED
            ]);

        if (navigator.serial) {
            navigator.serial.addEventListener("connect", (event) => {
                console.log("navigator.serial event: connected!");
            });

            navigator.serial.addEventListener("disconnect", (event) => {
                console.log("navigator.serial event: disconnected!");
                this.close();
            });
        }
    }

    async write(data) {
        //console.log("WRITE: " + data);
        this.serialWriter.write(data);
    }

    on(label, callback) {
        if (this.knownEvents.has(label)) {
            if (!this.events.has(label)) {
                this.events.set(label, []);
            }
            this.events.get(label).push(callback);
        } else {
            console.log(`Could not create event subscription for ${label}. Event unknown.`);
        }
    }

    fireEvent(event, data = null) {
        if (this.events.has(event)) {
            for (let callback of this.events.get(event)) {
                callback(this, data);
            }
        }
    }

    async open(serialOptions) {
        this.serialPort = await navigator.serial.requestPort();
        // - Wait for the port to open.
        await this.serialPort.open(serialOptions);

        this.serialWriter = this.serialPort.writable.getWriter();
        this.serialReader = this.serialPort.readable.getReader();

        this.fireEvent(SerialEvents.CONNECTION_OPENED);
        console.log("CONNECTED");
        // Listen to data coming from the serial device.
        while (this.serialPort.readable) {
            const { value, done } = await this.serialReader.read();
            if (done) {
                // Allow the serial port to be closed later.
                this.serialReader.releaseLock();
                break;
            }
            // value is a Uint8Array.
            this.fireEvent(SerialEvents.DATA_RECEIVED, value);
        }
    }

    async close() {

        if (this.serialReader) {
            await this.serialReader.cancel();
            //await inputDone.catch(() => {});
            this.serialReader = null;
            //inputDone = null;
        }

        if (this.serialWriter) {
            await this.serialWriter.close();
            this.serialWriter = null;
        }

        await this.serialPort.close();
        this.serialPort = null;

        this.fireEvent(SerialEvents.CONNECTION_CLOSED);
    }

    isOpen() {
        return this.serialPort && this.serialReader;
    }
}