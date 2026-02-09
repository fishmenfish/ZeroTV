import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Channel } from '../../models/channel.model';
import { StorageService } from '../../services/storage.service';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { EpgService } from '../../services/epg.service';
import { LogoCacheService } from '../../services/logo-cache.service';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule, LoadingSkeletonComponent],
  template: `
    <div class="channel-list" [class.grid-view]="viewMode() === 'grid'">
      @if (isLoading()) {
        <div class="loading-container">
          <app-loading-skeleton [items]="8" />
        </div>
      } @else {
        <cdk-virtual-scroll-viewport 
          [itemSize]="viewMode() === 'grid' ? 120 : 72" 
          class="channels-viewport"
        >
          <div 
            *cdkVirtualFor="let channel of channels(); let i = index; trackBy: trackByChannelId"
            class="channel-item"
            [class.active]="channel.id === activeChannelId()"
            (click)="channelSelected.emit(channel)"
          >
            <div class="channel-number">{{ i + 1 }}</div>
            <img 
              *ngIf="channel.logo" 
              [src]="channel.logo" 
              [alt]="channel.name"
              (error)="onImageError($event)"
              (load)="loadLogo($any($event.target), channel.logo)"
              loading="lazy"
            />
            <div class="channel-info">
              <div class="channel-name">{{ channel.name }}</div>
              <div class="channel-group" *ngIf="channel.group">{{ channel.group }}</div>
              @if (channel.epgId) {
                <div class="epg-info">
                  @if (getCurrentProgram(channel.epgId); as current) {
                    <div class="epg-current">
                      <span class="epg-badge">NOW</span>
                      <span class="epg-title">{{ current.title }}</span>
                    </div>
                  }
                  @if (getNextProgram(channel.epgId); as next) {
                    <div class="epg-next">
                      <span class="epg-badge">NEXT</span>
                      <span class="epg-title">{{ next.title }}</span>
                    </div>
                  }
                </div>
              }
            </div>
            <button 
              class="fav-btn"
              (click)="toggleFavorite($event, channel.id)"
              [class.is-favorite]="storage.isFavorite(channel.id)"
            >
              ★
            </button>
          </div>
        </cdk-virtual-scroll-viewport>
      }
    </div>
  `,
  styles: [`
    .channel-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: transparent;
      overflow: hidden;
    }

    .loading-container {
      padding: 16px;
    }

    .channels-viewport {
      flex: 1;
      width: 100%;
      min-height: 0;
    }

    .channels-viewport::ng-deep .cdk-virtual-scroll-content-wrapper {
      width: 100%;
    }

    .channel-list.grid-view .channels-viewport {
      padding: 16px;
    }

    .channel-list.grid-view .channel-item {
      flex-direction: column;
      padding: 16px;
      text-align: center;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      margin-bottom: 12px;
    }

    .channel-list.grid-view .channel-item img {
      width: 64px;
      height: 64px;
      margin-bottom: 12px;
    }

    .channel-list.grid-view .channel-info {
      width: 100%;
    }

    .channel-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .channel-item:hover {
      background: rgba(0, 122, 255, 0.08);
    }

    .channel-item.active {
      background: linear-gradient(90deg, rgba(0, 122, 255, 0.2) 0%, rgba(0, 122, 255, 0.1) 100%);
      border-left: 3px solid var(--accent-color);
      padding-left: 13px;
    }

    .channel-item img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      background: var(--bg-tertiary);
      border-radius: 10px;
      padding: 4px;
    }

    .channel-info {
      flex: 1;
      min-width: 0;
    }

    .channel-name {
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }

    .channel-group {
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      margin-top: 2px;
    }

    .epg-info {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .epg-current, .epg-next {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }

    .epg-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
      letter-spacing: 0.5px;
    }

    .epg-current .epg-badge {
      background: rgba(48, 209, 88, 0.2);
      color: #30d158;
    }

    .epg-next .epg-badge {
      background: rgba(0, 122, 255, 0.2);
      color: #007aff;
    }

    .epg-title {
      color: var(--text-tertiary);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .fav-btn {
      padding: 6px 10px;
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .fav-btn:hover {
      color: #ffd60a;
      transform: scale(1.1);
    }

    .fav-btn.is-favorite {
      color: #ffd60a;
      filter: drop-shadow(0 0 4px rgba(255, 214, 10, 0.5));
    }
  `]
})
export class ChannelListComponent {
  channels = input.required<Channel[]>();
  activeChannelId = input<string>();
  channelSelected = output<Channel>();
  isLoading = input<boolean>(false);
  viewMode = input<'list' | 'grid'>('list');

  constructor(public storage: StorageService, private epgService: EpgService, private logoCache: LogoCacheService) {}

  getCurrentProgram(channelId: string) {
    return this.epgService.getCurrentProgram(channelId);
  }

  getNextProgram(channelId: string) {
    return this.epgService.getNextProgram(channelId);
  }

  async loadLogo(img: HTMLImageElement, url: string): Promise<void> {
    const cachedUrl = await this.logoCache.getCachedLogo(url);
    if (cachedUrl) {
      img.src = cachedUrl;
    }
  }

  toggleFavorite(event: Event, channelId: string): void {
    event.stopPropagation();
    this.storage.toggleFavorite(channelId);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  trackByChannelId(index: number, channel: Channel): string {
    return channel.id;
  }
}
