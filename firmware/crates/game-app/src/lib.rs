#![no_std]

//! Button-to-command navigation shared by the desktop simulator and device adapters.

use pocket_pet_game_core::{update, GameCommand, GameEvent, PetState};
use pocket_pet_platform_api::Key;

const MENU: [GameCommand; 6] = [
    GameCommand::Feed,
    GameCommand::Play,
    GameCommand::Clean,
    GameCommand::Pet,
    GameCommand::Rest,
    GameCommand::ViewStatus,
];

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AppEffect {
    MenuOpened { selected: u8 },
    SelectionChanged { selected: u8 },
    CommandCompleted(GameEvent),
    ReturnedToRoom,
    Ignored,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GameApp {
    menu_open: bool,
    selected: u8,
}

impl GameApp {
    pub const fn new() -> Self {
        Self {
            menu_open: false,
            selected: 0,
        }
    }

    pub const fn is_menu_open(&self) -> bool {
        self.menu_open
    }

    pub const fn selected_index(&self) -> u8 {
        self.selected
    }

    /// A opens/advances, B confirms, and C returns. Rendering and input debouncing stay in adapters.
    pub fn on_key(&mut self, key: Key, state: &mut PetState) -> AppEffect {
        match key {
            Key::A if !self.menu_open => {
                self.menu_open = true;
                self.selected = 0;
                AppEffect::MenuOpened {
                    selected: self.selected,
                }
            }
            Key::A => {
                self.selected = (self.selected + 1) % MENU.len() as u8;
                AppEffect::SelectionChanged {
                    selected: self.selected,
                }
            }
            Key::B if self.menu_open => {
                let command = MENU[self.selected as usize];
                self.menu_open = false;
                AppEffect::CommandCompleted(update(state, command))
            }
            Key::B => AppEffect::Ignored,
            Key::C if self.menu_open => {
                self.menu_open = false;
                AppEffect::ReturnedToRoom
            }
            Key::C => AppEffect::Ignored,
        }
    }
}

impl Default for GameApp {
    fn default() -> Self {
        Self::new()
    }
}
