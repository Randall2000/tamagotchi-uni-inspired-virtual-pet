#![cfg_attr(not(feature = "std"), no_std)]

//! Hardware-independent pet state and command rules.
//! Keep GPIO, display drivers, clocks, storage, and random-number sources out of this crate.

pub const MIN_NEED: u8 = 0;
pub const MAX_NEED: u8 = 100;
pub const INITIAL_FOOD: u8 = 3;

/// Initial values follow PRD v1.1. Action deltas below are balance placeholders until reviewed.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Needs {
    pub satiety: u8,
    pub happiness: u8,
    pub hygiene: u8,
    pub energy: u8,
    pub health: u8,
    pub bond: u8,
}

impl Needs {
    pub const INITIAL: Self = Self {
        satiety: 70,
        happiness: 70,
        hygiene: 80,
        energy: 80,
        health: 100,
        bond: 30,
    };
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GrowthStage {
    Child,
    Growing,
    Adult,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PetState {
    pub needs: Needs,
    pub stage: GrowthStage,
    pub food: u8,
    pub coins: u16,
    pub last_simulated_at_ms: u64,
}

impl PetState {
    pub const fn new(now_ms: u64) -> Self {
        Self {
            needs: Needs::INITIAL,
            stage: GrowthStage::Child,
            food: INITIAL_FOOD,
            coins: 0,
            last_simulated_at_ms: now_ms,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GameCommand {
    Feed,
    Play,
    Clean,
    Rest,
    ViewStatus,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EventKind {
    PetFed,
    PetPlayed,
    PetCleaned,
    PetRested,
    StatusViewed,
    ActionRejected,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VisualEvent {
    PetEat,
    PetPlay,
    PetClean,
    PetSleep,
    PetIdle,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RejectReason {
    NoFood,
    TooTired,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct NeedChanges {
    pub satiety: i8,
    pub happiness: i8,
    pub hygiene: i8,
    pub energy: i8,
    pub health: i8,
    pub bond: i8,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GameEvent {
    pub kind: EventKind,
    pub visual: VisualEvent,
    pub rejection: Option<RejectReason>,
    pub changes: NeedChanges,
}

impl GameEvent {
    const fn new(kind: EventKind, visual: VisualEvent) -> Self {
        Self {
            kind,
            visual,
            rejection: None,
            changes: NeedChanges {
                satiety: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
                health: 0,
                bond: 0,
            },
        }
    }

    const fn rejected(reason: RejectReason) -> Self {
        Self {
            kind: EventKind::ActionRejected,
            visual: VisualEvent::PetIdle,
            rejection: Some(reason),
            changes: NeedChanges {
                satiety: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
                health: 0,
                bond: 0,
            },
        }
    }
}

/// Apply one command to state and return a stable event for UI, audio, logs, and replay.
/// No platform API or dynamic allocation is used here.
pub fn update(state: &mut PetState, command: GameCommand) -> GameEvent {
    match command {
        GameCommand::Feed if state.food == 0 => GameEvent::rejected(RejectReason::NoFood),
        GameCommand::Feed => {
            state.food -= 1;
            let mut event = GameEvent::new(EventKind::PetFed, VisualEvent::PetEat);
            event.changes.satiety = change(&mut state.needs.satiety, 18);
            event.changes.energy = change(&mut state.needs.energy, -2);
            event.changes.bond = change(&mut state.needs.bond, 1);
            event
        }
        GameCommand::Play if state.needs.energy == 0 => {
            GameEvent::rejected(RejectReason::TooTired)
        }
        GameCommand::Play => {
            let mut event = GameEvent::new(EventKind::PetPlayed, VisualEvent::PetPlay);
            event.changes.happiness = change(&mut state.needs.happiness, 12);
            event.changes.energy = change(&mut state.needs.energy, -10);
            event.changes.satiety = change(&mut state.needs.satiety, -4);
            event.changes.bond = change(&mut state.needs.bond, 2);
            event
        }
        GameCommand::Clean => {
            let mut event = GameEvent::new(EventKind::PetCleaned, VisualEvent::PetClean);
            event.changes.hygiene = change(&mut state.needs.hygiene, 20);
            event.changes.happiness = change(&mut state.needs.happiness, 1);
            event
        }
        GameCommand::Rest => {
            let mut event = GameEvent::new(EventKind::PetRested, VisualEvent::PetSleep);
            event.changes.energy = change(&mut state.needs.energy, 18);
            event.changes.satiety = change(&mut state.needs.satiety, -2);
            event
        }
        GameCommand::ViewStatus => GameEvent::new(EventKind::StatusViewed, VisualEvent::PetIdle),
    }
}

fn change(value: &mut u8, delta: i8) -> i8 {
    let before = *value;
    *value = if delta >= 0 {
        value.saturating_add(delta as u8).min(MAX_NEED)
    } else {
        value.saturating_sub(delta.unsigned_abs()).max(MIN_NEED)
    };
    (*value as i16 - before as i16) as i8
}
