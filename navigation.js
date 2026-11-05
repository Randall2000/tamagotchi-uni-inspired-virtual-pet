export const quickActions = Object.freeze([
  { label: '食物', screen: 'food' },
  { label: '清潔', screen: 'care' },
  { label: '玩耍', screen: 'toys' },
  { label: '陪伴', action: 'pet' },
  { label: '狀態', screen: 'status' },
  { label: '選單', screen: 'main' },
]);

export const menus = {
  food: [{ label: '正餐', action: 'feed', hint: '飽足 +12' }, { label: '小點心', action: 'snack', hint: '心情 +6 · 飽足 +4' }],
  care: [{ label: '清潔身體', action: 'clean', hint: '清潔 +20' }, { label: '梳洗小臉', action: 'groom', hint: '清潔 +10' }],
  toys: [{ label: '毛線球', action: 'play', hint: '心情 +14 · 精力 −8' }, { label: '伸懶腰', action: 'stretch', hint: '放鬆一下' }, { label: '看窗外', action: 'window', hint: '一起看看風景' }],
  main: [
    { label: '休息 / 睡覺', action: 'rest' },
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
