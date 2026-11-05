// Bottom-bar shortcuts: the four care actions run on B directly, with no option layer.
export const quickActions = Object.freeze([
  { label: '餐食', action: 'feed' },
  { label: '清潔', action: 'clean' },
  { label: '玩耍', action: 'play' },
  { label: '摸摸', action: 'pet' },
  { label: '狀態', screen: 'status' },
  { label: '選單', screen: 'main' },
]);

// The menu is a single level of actions; only settings opens a further list.
export const menus = {
  main: [
    { label: '睡覺', action: 'rest', hint: '精力 +18 · 進入睡眠' },
    { label: '點心', action: 'snack', hint: '心情 +6 · 飽足 +4' },
    { label: '洗臉', action: 'groom', hint: '清潔 +10' },
    { label: '伸懶腰', action: 'stretch', hint: '放鬆一下' },
    { label: '看窗外', action: 'window', hint: '一起看看風景' },
    { label: '設定', menu: 'settings' },
  ],
  settings: [
    { label: '儲存進度', action: 'save' },
    { label: '重新開始', screen: 'confirm' },
  ],
};

export class Navigation {
  constructor() {
    this.screen = 'room';
    this.stack = [];
    this.cursor = 0;
    this.quickCursor = 0;
  }

  enter(screen) {
    this.stack.push({ screen: this.screen, cursor: this.cursor });
    this.screen = screen;
    this.cursor = 0;
  }

  home() {
    this.screen = 'room';
    this.stack = [];
    this.cursor = 0;
  }

  back() {
    const parent = this.stack.pop();
    if (parent) {
      this.screen = parent.screen;
      this.cursor = parent.cursor;
    } else {
      this.home();
    }
  }

  // The on-screen list is display-only. Only the device's A/B/C input invokes commands.
  choose() {
    const items = this.screen === 'confirm'
      ? [{ action: 'cancel' }, { action: 'reset' }]
      : menus[this.screen];
    if (!items) return null;
    const item = items[this.cursor];
    if (!item) return null;
    if (item.menu || item.screen) {
      this.enter(item.menu || item.screen);
      return null;
    }
    if (item.action === 'cancel') {
      this.back();
      return null;
    }
    return item.action;
  }

  key(key) {
    if (key === 'c') {
      this.back();
      return null;
    }
    if (this.screen === 'room') {
      if (key === 'a') {
        this.quickCursor = (this.quickCursor + 1) % quickActions.length;
      } else if (key === 'b') {
        const item = quickActions[this.quickCursor];
        if (item.screen) {
          this.enter(item.screen);
        } else {
          return item.action;
        }
      }
      return null;
    }
    const items = this.screen === 'confirm'
      ? [{ action: 'cancel' }, { action: 'reset' }]
      : menus[this.screen];
    if (!items) return null;
    if (key === 'a') this.cursor = (this.cursor + 1) % items.length;
    if (key === 'b') return this.choose();
    return null;
  }
}
