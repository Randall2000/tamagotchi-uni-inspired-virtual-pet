#![cfg_attr(not(feature = "std"), no_std)]

//! Hardware-independent pet state and command rules.
//! Keep GPIO, display drivers, clocks, storage, and random-number sources out of this crate.

pub const MIN_NEED: u8 = 0;
pub const MAX_NEED: u8 = 100;
pub const INITIAL_FOOD: u8 = 3;
pub const GROWING_BOND: u8 = 10;
pub const ADULT_BOND: u8 = 30;

/// Initial values follow PRD v1.1. Action deltas below are balance placeholders until reviewed.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Needs {
    pub satiety: u8,
    pub happiness: u8,
    pub hygiene: u8,
    pub energy: u8,
    pub health: u8,
}

impl Needs {
    pub const INITIAL: Self = Self {
        satiety: 70,
        happiness: 70,
        hygiene: 80,
        energy: 80,
        health: 100,
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
    /// Permanent relationship points. Need decay and elapsed time never lower bond.
    pub bond: u8,
    pub stage: GrowthStage,
    pub food: u8,
    pub coins: u16,
    pub last_simulated_at_ms: u64,
}

impl PetState {
    pub const fn new(now_ms: u64) -> Self {
        Self {
            needs: Needs::INITIAL,
            bond: 0,
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
    Pet,
    Rest,
    ViewStatus,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EventKind {
    PetFed,
    PetPlayed,
    PetCleaned,
    PetPetted,
    PetRested,
    StatusViewed,
    ActionRejected,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VisualEvent {
    PetEat,
    PetPlay,
    PetClean,
    PetHappy,
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
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GameEvent {
    pub kind: EventKind,
    pub visual: VisualEvent,
    pub rejection: Option<RejectReason>,
    pub changes: NeedChanges,
    /// Positive bond delta, deliberately separate from decaying needs.
    pub bond_change: i8,
}

impl GameEvent {
    const fn new(kind: EventKind, visual: VisualEvent) -> Self {
        Self {
            kind,
            visual,
            rejection: None,
            bond_change: 0,
            changes: NeedChanges {
                satiety: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
                health: 0,
            },
        }
    }

    const fn rejected(reason: RejectReason) -> Self {
        Self {
            kind: EventKind::ActionRejected,
            visual: VisualEvent::PetIdle,
            rejection: Some(reason),
            bond_change: 0,
            changes: NeedChanges {
                satiety: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
                health: 0,
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
            increase_bond(state, &mut event, 1);
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
            increase_bond(state, &mut event, 2);
            event
        }
        GameCommand::Clean => {
            let mut event = GameEvent::new(EventKind::PetCleaned, VisualEvent::PetClean);
            event.changes.hygiene = change(&mut state.needs.hygiene, 20);
            event.changes.happiness = change(&mut state.needs.happiness, 1);
            increase_bond(state, &mut event, 1);
            event
        }
        GameCommand::Pet => {
            let mut event = GameEvent::new(EventKind::PetPetted, VisualEvent::PetHappy);
            event.changes.happiness = change(&mut state.needs.happiness, 8);
            increase_bond(state, &mut event, 2);
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

fn increase_bond(state: &mut PetState, event: &mut GameEvent, amount: u8) {
    let before = state.bond;
    state.bond = state.bond.saturating_add(amount).min(MAX_NEED);
    event.bond_change = (state.bond - before) as i8;
    let reached = if state.bond >= ADULT_BOND {
        GrowthStage::Adult
    } else if state.bond >= GROWING_BOND {
        GrowthStage::Growing
    } else {
        GrowthStage::Child
    };
    let current_rank = match state.stage {
        GrowthStage::Child => 0,
        GrowthStage::Growing => 1,
        GrowthStage::Adult => 2,
    };
    let reached_rank = match reached {
        GrowthStage::Child => 0,
        GrowthStage::Growing => 1,
        GrowthStage::Adult => 2,
    };
    if reached_rank > current_rank {
        state.stage = reached;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bond_alone_advances_growth_and_never_reverses() {
        let mut state = PetState::new(0);
        for _ in 0..9 {
            update(&mut state, GameCommand::Clean);
        }
        assert_eq!(state.stage, GrowthStage::Child);
        update(&mut state, GameCommand::Clean);
        assert_eq!(state.bond, GROWING_BOND);
        assert_eq!(state.stage, GrowthStage::Growing);

        for _ in 0..19 {
            update(&mut state, GameCommand::Clean);
        }
        assert_eq!(state.bond, ADULT_BOND - 1);
        assert_eq!(state.stage, GrowthStage::Growing);
        update(&mut state, GameCommand::Clean);
        assert_eq!(state.bond, ADULT_BOND);
        assert_eq!(state.stage, GrowthStage::Adult);

        state.bond = 0;
        update(&mut state, GameCommand::Rest);
        assert_eq!(state.stage, GrowthStage::Adult);
    }

    #[test]
    fn care_bond_is_separate_from_needs_and_reports_actual_gain() {
        let mut state = PetState::new(0);
        assert_eq!(state.bond, 0);
        let fed = update(&mut state, GameCommand::Feed);
        assert_eq!(fed.bond_change, 1);
        let played = update(&mut state, GameCommand::Play);
        assert_eq!(played.bond_change, 2);
        let pet = update(&mut state, GameCommand::Pet);
        assert_eq!(pet.bond_change, 2);
        let rest = update(&mut state, GameCommand::Rest);
        assert_eq!(rest.bond_change, 0);
        assert_eq!(state.bond, 5);
    }

    #[test]
    fn bond_saturates_and_rejected_actions_do_not_change_growth() {
        let mut state = PetState::new(0);
        state.bond = 99;
        state.stage = GrowthStage::Adult;
        let pet = update(&mut state, GameCommand::Pet);
        assert_eq!(state.bond, MAX_NEED);
        assert_eq!(pet.bond_change, 1);
        assert_eq!(state.stage, GrowthStage::Adult);

        state.food = 0;
        let rejected = update(&mut state, GameCommand::Feed);
        assert_eq!(rejected.bond_change, 0);
        assert_eq!(state.bond, MAX_NEED);
        assert_eq!(state.stage, GrowthStage::Adult);
    }
}
