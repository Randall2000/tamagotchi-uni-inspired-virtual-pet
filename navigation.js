export const menus = {
  main: [{ label: '照顧', menu: 'care' }, { label: '互動', menu: 'interact' }, { label: '狀態', screen: 'status' }, { label: '設定', menu: 'settings' }],
  care: [{ label: '餵食', action: 'feed' }, { label: '玩耍', action: 'play' }, { label: '休息', action: 'rest' }],
  interact: [{ label: '洗臉', action: 'groom' }, { label: '伸懶腰', action: 'stretch' }, { label: '摸摸', action: 'pet' }, { label: '看窗外', action: 'window' }],
  settings: [{ label: '儲存進度', action: 'save' }, { label: '重新開始', screen: 'confirm' }],
};
export class Navigation {
  constructor() { this.screen = 'room'; this.stack = []; this.cursor = 0; }
  enter(screen) { this.stack.push({ screen: this.screen, cursor: this.cursor }); this.screen = screen; this.cursor = 0; }
  home() { this.screen = 'room'; this.stack = []; this.cursor = 0; }
  key(key) {
    if (key === 'c') {
      const parent = this.stack.pop();
      if (parent) Object.assign(this, parent); else this.home();
      return null;
    }
    if (this.screen === 'room') { if (key === 'a' || key === 'b') this.enter('main'); return null; }
    const items = this.screen === 'confirm' ? [{ action: 'cancel' }, { action: 'reset' }] : menus[this.screen];
    if (!items) return null;
    if (key === 'a') this.cursor = (this.cursor + 1) % items.length;
    if (key !== 'b') return null;
    const item = items[this.cursor];
    if (item.menu || item.screen) { this.enter(item.menu || item.screen); return null; }
    if (item.action === 'cancel') { this.key('c'); return null; }
    const action = item.action;
    this.home();
    return action;
  }
}
