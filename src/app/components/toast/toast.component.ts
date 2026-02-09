import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" [class]="'toast-' + type()">
      <div class="toast-icon">
        @switch (type()) {
          @case ('success') { ✓ }
          @case ('error') { ✕ }
          @case ('warning') { ⚠ }
          @case ('info') { ℹ }
        }
      </div>
      <div class="toast-content">
        <div class="toast-title">{{ title() }}</div>
        @if (message()) {
          <div class="toast-message">{{ message() }}</div>
        }
      </div>
      <button class="toast-close" (click)="close.emit()">✕</button>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border: 1px solid var(--glass-border);
      animation: slideIn 0.3s ease;
      min-width: 320px;
      max-width: 480px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .toast-success {
      background: rgba(52, 199, 89, 0.9);
    }

    .toast-error {
      background: rgba(255, 69, 58, 0.9);
    }

    .toast-warning {
      background: rgba(255, 159, 10, 0.9);
    }

    .toast-info {
      background: rgba(0, 122, 255, 0.9);
    }

    .toast-icon {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }

    .toast-content {
      flex: 1;
      color: #fff;
    }

    .toast-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 13px;
      opacity: 0.9;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .toast-close:hover {
      opacity: 1;
    }
  `]
})
export class ToastComponent {
  type = input<ToastType>('info');
  title = input.required<string>();
  message = input<string>();
  close = output<void>();
}
