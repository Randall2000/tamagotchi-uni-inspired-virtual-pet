# Firmware workspace

This Rust workspace starts the hardware-independent core described in PRD v1.1.
It is a development scaffold, not a flashable ESP32 firmware image.

## Crates

- `game-core`: fixed-size pet state, abstract commands, and deterministic state changes. It has no GPIO, display, clock, storage, or board dependencies and can be built without the default `std` feature.
- `platform-api`: replaceable input, clock, random, storage, display, and audio interfaces. ESP32-C6/S3 and Mac implementations are future adapters.

## Current boundary

The web demo remains a separate JavaScript application. These crates establish a portable firmware core; they do not yet synchronize browser saves or implement the Mac simulator, button debouncing, persistence encoding, graphics, or a board target. Hardware remains undecided in PRD v1.1.

Action balance changes in `game-core` are provisional implementation values. Initial need values and the six need dimensions follow PRD v1.1.
