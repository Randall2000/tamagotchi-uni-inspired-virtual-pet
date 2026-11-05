export const menus = {
  main: [
    { label: '餵食', action: 'feed' },
    { label: '玩耍', action: 'play' },
    { label: '清潔', action: 'clean' },
    { label: '睡覺', action: 'rest' },
    { label: '其他互動', menu: 'interact' },
    { label: '寵物狀態', screen: 'status' },
    { label: '設定', menu: 'settings' },
  ],
  interact: [
    { label: '摸摸', action: 'pet' },
    { label: '洗臉', action: 'groom' },
    { label: '伸懶腰', action: 'stretch' },
    { label: '看窗外', action: 'window' },
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

  // Both physical B and touch/click select the same item.
  choose(index = this.cursor) {
    const items = this.screen === 'confirm'
      ? [{ action: 'cancel' }, { action: 'reset' }]
      : menus[this.screen];
    if (!items || !Number.isInteger(index) || index < 0 || index >= items.length) return null;
    this.cursor = index;
    const item = items[index];
    if (item.menu || item.screen) {
      this.enter(item.menu || item.screen);
      return null;
    }
    if (item.action === 'cancel') {
      this.back();
      return null;
    }
    const action = item.action;
    this.home();
    return action;
  }

  key(key) {
    if (key === 'c') {
      this.back();
      return null;
    }
    if (this.screen === 'room') {
      if (key === 'a' || key === 'b') this.enter('main');
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
