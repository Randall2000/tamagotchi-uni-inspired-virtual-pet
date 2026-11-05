# Firmware workspace

This Rust workspace starts the hardware-independent core described in the PRD.
It is a development scaffold, not a flashable ESP32 firmware image.

## Crates

- `game-core`: fixed-size pet state, abstract commands, and deterministic state changes. It has no GPIO, display, clock, storage, or board dependencies and can be built without the default `std` feature.
- `game-app`: A/B/C menu state machine that turns physical or simulated keys into core commands.
- `platform-api`: replaceable input, clock, random, storage, display, and audio interfaces. ESP32-C6/S3 and Mac implementations are future adapters.

Requirements source: [`../docs/PRD.md`](../docs/PRD.md), numbers in [`../docs/BALANCE.md`](../docs/BALANCE.md), acceptance in [`../docs/ACCEPTANCE_MAC_HW.md`](../docs/ACCEPTANCE_MAC_HW.md).

## Current boundary

The web demo remains a separate JavaScript application. These crates establish a portable firmware core; they do not yet synchronize browser saves or implement the Mac simulator, button debouncing, persistence encoding, graphics, or a board target. Hardware remains undecided in the PRD (D-01).

`game-core` keeps bond outside decaying needs. Successful care commands raise bond, and crossing 10/30 points advances Child → Growing → Adult permanently; Rest, status checks, and rejected actions do not raise bond. These thresholds and action gains mirror the current Web MVP and remain balance configuration candidates.
