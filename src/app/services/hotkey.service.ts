import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface HotkeyAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class HotkeyService {
  private hotkeys: HotkeyAction[] = [];

  constructor() {
    this.initListener();
  }

  private initListener(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(event => {
          const target = event.target as HTMLElement;
          return !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
        })
      )
      .subscribe(event => this.handleKeydown(event));
  }

  register(hotkey: HotkeyAction): void {
    this.hotkeys.push(hotkey);
  }

  unregister(key: string): void {
    this.hotkeys = this.hotkeys.filter(h => h.key !== key);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const hotkey = this.hotkeys.find(h => 
      h.key.toLowerCase() === event.key.toLowerCase() &&
      !!h.ctrl === event.ctrlKey &&
      !!h.shift === event.shiftKey &&
      !!h.alt === event.altKey
    );

    if (hotkey) {
      event.preventDefault();
      hotkey.action();
    }
  }
}
