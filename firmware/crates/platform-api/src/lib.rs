#![no_std]

//! Replaceable hardware and host interfaces. Board-specific implementations belong in adapters.

use pocket_pet_game_core::{GameEvent, PetState};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Key {
    A,
    B,
    C,
}

pub trait InputPort {
    type Error;

    fn next_key(&mut self) -> Result<Option<Key>, Self::Error>;
}

pub trait ClockPort {
    fn now_ms(&self) -> u64;
}

pub trait RandomPort {
    fn next_u32(&mut self) -> u32;
}

pub trait StoragePort {
    type Error;

    /// Reads an opaque, versioned snapshot into caller-owned memory.
    fn load(&mut self, output: &mut [u8]) -> Result<Option<usize>, Self::Error>;

    /// Persists an opaque, versioned snapshot supplied by the application layer.
    fn save(&mut self, snapshot: &[u8]) -> Result<(), Self::Error>;
}

pub trait DisplayPort {
    type Error;

    fn present(&mut self, state: &PetState, event: Option<GameEvent>) -> Result<(), Self::Error>;
}

pub trait AudioPort {
    fn play_feedback(&mut self, event: GameEvent);
}
