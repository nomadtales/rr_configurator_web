V1.0.1

- Added serial queue and ack requirements to prevent common serial errors
- Fixed serial.isOpen() check, preventing errors when sending requests before opening
- Controls now lock while waiting on serial responses.
- Implemented RP2040 Support

V1.0.0 Initial Release 02-02-2023