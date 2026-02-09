import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { invoke } from '@tauri-apps/api/core';
import { computed } from '@angular/core';
import { open } from '@tauri-apps/plugin-shell';
import { Channel } from './models/channel.model';
import { StorageService } from './services/storage.service';
import { PlayerService } from './services/player.service';
import { HotkeyService } from './services/hotkey.service';
import { ToastService } from './services/toast.service';
import { EpgService } from './services/epg.service';
import { ChannelListComponent } from './components/channel-list/channel-list.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChannelListComponent, VideoPlayerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  hotkeyHint = signal<string | null>(null);
  private hotkeyTimeout?: number;
  showSettings = signal(false);
  sortBy = signal<'name' | 'group' | 'recent' | 'favorites'>('name');
  viewMode = signal<'list' | 'grid'>('list');
  searchQuery = signal('');
  showPlaylistBrowser = signal(false);
  sidebarCollapsed = signal(false);
  private searchDebounceTimer?: number;
  isDragging = signal(false);
  showOnlineOnly = signal(false);
  channelStatus = signal<Map<string, boolean>>(new Map());
  isCheckingStatus = signal(false);
  currentPlaylistHeaders = signal<{ userAgent?: string; referer?: string }>({});
  showHeadersEditor = signal(false);
  editingPlaylist = signal<any>(null);
  headerUserAgent = signal('');
  headerReferer = signal('');

  constructor(
    public storage: StorageService,
    public playerService: PlayerService,
    private hotkeyService: HotkeyService,
    public toastService: ToastService,
    private epgService: EpgService
  ) {}

  ngOnInit(): void {
    this.setupHotkeys();
    this.autoLoadPlaylist();
  }

  private async autoLoadPlaylist(): Promise<void> {
    const defaultUrl = 'https://iptv-org.github.io/iptv/index.m3u';
    
    this.isLoading.set(true);
    this.toastService.info('Loading', 'Fetching playlist...');

    try {
      const content = await invoke<string>('fetch_playlist', { url: defaultUrl });
      await this.loadChannelsFromContent(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.error.set(message);
      this.toastService.error('Auto-load Failed', 'Use "Load from URL" to try again');
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.hotkeyService.unregister('ArrowUp');
    this.hotkeyService.unregister('ArrowDown');
    this.hotkeyService.unregister(' ');
    this.hotkeyService.unregister('m');
    this.hotkeyService.unregister('M');
    this.hotkeyService.unregister('+');
    this.hotkeyService.unregister('=');
    this.hotkeyService.unregister('-');
    this.hotkeyService.unregister('f');
    this.hotkeyService.unregister('F');
    this.hotkeyService.unregister('Escape');
    for (let i = 1; i <= 9; i++) {
      this.hotkeyService.unregister(i.toString());
    }
    if (this.hotkeyTimeout) clearTimeout(this.hotkeyTimeout);
  }

  private showHotkeyHint(message: string): void {
    this.hotkeyHint.set(message);
    if (this.hotkeyTimeout) clearTimeout(this.hotkeyTimeout);
    this.hotkeyTimeout = window.setTimeout(() => {
      this.hotkeyHint.set(null);
    }, 1500);
  }

  private setupHotkeys(): void {
    this.hotkeyService.register({
      key: 'ArrowUp',
      action: () => {
        this.previousChannel();
        this.showHotkeyHint('Previous Channel');
      }
    });

    this.hotkeyService.register({
      key: 'ArrowDown',
      action: () => {
        this.nextChannel();
        this.showHotkeyHint('Next Channel');
      }
    });

    this.hotkeyService.register({
      key: ' ',
      action: () => {
        this.togglePlayPause();
        this.showHotkeyHint(this.playerService.isPlaying() ? 'Paused' : 'Playing');
      }
    });

    this.hotkeyService.register({
      key: 'm',
      action: () => {
        this.toggleMute();
        this.showHotkeyHint(this.playerService.volume() === 0 ? 'Muted' : 'Unmuted');
      }
    });

    this.hotkeyService.register({
      key: 'M',
      action: () => {
        this.toggleMute();
        this.showHotkeyHint(this.playerService.volume() === 0 ? 'Muted' : 'Unmuted');
      }
    });

    this.hotkeyService.register({
      key: '+',
      action: () => {
        const newVol = Math.min(100, this.playerService.volume() + 10);
        this.playerService.setVolume(newVol);
        this.showHotkeyHint(`Volume ${newVol}%`);
      }
    });

    this.hotkeyService.register({
      key: '=',
      action: () => {
        const newVol = Math.min(100, this.playerService.volume() + 10);
        this.playerService.setVolume(newVol);
        this.showHotkeyHint(`Volume ${newVol}%`);
      }
    });

    this.hotkeyService.register({
      key: '-',
      action: () => {
        const newVol = Math.max(0, this.playerService.volume() - 10);
        this.playerService.setVolume(newVol);
        this.showHotkeyHint(`Volume ${newVol}%`);
      }
    });

    this.hotkeyService.register({
      key: 'f',
      action: () => {
        this.toggleFullscreen();
        this.showHotkeyHint(document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen');
      }
    });

    this.hotkeyService.register({
      key: 'F',
      action: () => {
        this.toggleFullscreen();
        this.showHotkeyHint(document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen');
      }
    });

    this.hotkeyService.register({
      key: 'Escape',
      action: () => {
        this.exitFullscreen();
      }
    });

    // Number keys for quick channel jump
    for (let i = 1; i <= 9; i++) {
      this.hotkeyService.register({
        key: i.toString(),
        action: () => {
          const channels = this.channels();
          if (channels.length >= i) {
            this.onChannelSelected(channels[i - 1]);
            this.showHotkeyHint(`Channel ${i}`);
          }
        }
      });
    }
  }

  private previousChannel(): void {
    const channels = this.channels();
    const current = this.currentChannel();
    if (!current || channels.length === 0) return;

    const currentIndex = channels.findIndex(ch => ch.id === current.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
    this.onChannelSelected(channels[prevIndex]);
  }

  private nextChannel(): void {
    const channels = this.channels();
    const current = this.currentChannel();
    if (!current || channels.length === 0) return;

    const currentIndex = channels.findIndex(ch => ch.id === current.id);
    const nextIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
    this.onChannelSelected(channels[nextIndex]);
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  private togglePlayPause(): void {
    const video = document.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  private savedVolume = 50;

  private toggleMute(): void {
    if (this.playerService.volume() === 0) {
      this.playerService.setVolume(this.savedVolume);
    } else {
      this.savedVolume = this.playerService.volume();
      this.playerService.setVolume(0);
    }
  }

  private async loadChannelsFromContent(content: string): Promise<void> {
    const parsed = await invoke<Channel[]>('parse_m3u', { content });
    
    if (parsed.length === 0) {
      throw new Error('No channels found in playlist');
    }
    
    this.channels.set(parsed);
    this.toastService.success('Playlist Loaded', `${parsed.length} channels loaded`);
    
    const lastChannelId = this.storage.settings().lastChannelId;
    if (lastChannelId) {
      const lastChannel = parsed.find(ch => ch.id === lastChannelId);
      if (lastChannel) {
        this.onChannelSelected(lastChannel);
      }
    }
  }

  async loadPlaylist(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const content = await file.text();
      await this.loadChannelsFromContent(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlist';
      this.error.set(message);
      this.toastService.error('Load Failed', message);
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPlaylistFromUrl(): Promise<void> {
    const url = prompt('Enter M3U playlist URL:');
    if (!url) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const content = await invoke<string>('fetch_playlist', { url });
      await this.loadChannelsFromContent(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.error.set(message);
      this.toastService.error('Load Failed', message);
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onChannelSelected(channel: Channel): void {
    this.currentChannel.set(channel);
    this.storage.saveSettings({ lastChannelId: channel.id });
    this.storage.addToRecentlyWatched(channel.id);
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerService.setVolume(+input.value);
  }

  onUserAgentChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.headerUserAgent.set(input.value);
  }

  onRefererChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.headerReferer.set(input.value);
  }

  async openUrl(url: string): Promise<void> {
    try {
      await open(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
      this.toastService.error('Error', 'Failed to open browser');
    }
  }

  exportSettings(): void {
    const data = this.storage.exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iptv-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.success('Exported', 'Settings exported successfully');
  }

  importSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.storage.importSettings(content);
        this.toastService.success('Imported', 'Settings imported successfully');
        window.location.reload();
      } catch (err) {
        this.toastService.error('Import Failed', 'Invalid settings file');
      }
    };
    reader.readAsText(file);
  }

  async loadPlaylistById(id: string): Promise<void> {
    const playlists = this.storage.getPlaylists();
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    await this.loadPlaylistByUrl(playlist.url, playlist.name);
    
    // Load EPG if available
    if (playlist.epgUrl) {
      this.loadEpgForPlaylist(playlist.epgUrl);
    }
  }

  private async loadPlaylistByUrl(url: string, name?: string): Promise<void> {
    this.isLoading.set(true);
    
    try {
      const content = await invoke<string>('fetch_playlist', { url });
      await this.loadChannelsFromContent(content);
    } catch (err) {
      this.toastService.error('Load Failed', String(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  removePlaylist(id: string): void {
    if (confirm('Remove this playlist?')) {
      this.storage.removePlaylist(id);
      this.toastService.success('Removed', 'Playlist removed');
    }
  }

  updatePlaylistHeaders(id: string, headers: { userAgent?: string; referer?: string }): void {
    this.storage.updatePlaylistHeaders(id, headers);
    this.currentPlaylistHeaders.set(headers);
    this.toastService.success('Updated', 'Custom headers saved');
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as 'name' | 'group' | 'recent' | 'favorites');
  }

  sortedChannels = computed(() => {
    let result = [...this.channels()];
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(ch => 
        ch.name.toLowerCase().includes(query) ||
        (ch.group && ch.group.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    const sortType = this.sortBy();
    
    if (sortType === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'group') {
      result.sort((a, b) => {
        const groupA = a.group || 'Uncategorized';
        const groupB = b.group || 'Uncategorized';
        return groupA.localeCompare(groupB);
      });
    } else if (sortType === 'recent') {
      const recent = this.storage.getRecentlyWatched();
      if (recent.length > 0) {
        result = result.filter(ch => recent.includes(ch.id));
        result.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
      } else {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else if (sortType === 'favorites') {
      const favorites = this.storage.settings().favorites || [];
      if (favorites.length > 0) {
        result = result.filter(ch => favorites.includes(ch.id));
      }
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Debounce search for better performance
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    this.searchDebounceTimer = window.setTimeout(() => {
      this.searchQuery.set(value);
    }, 300);
  }

  async loadPlaylistByCategory(category: string, url: string): Promise<void> {
    this.showPlaylistBrowser.set(false);
    await this.loadPlaylistByUrl(url, category);
    this.storage.savePlaylist(url, category);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
      this.toastService.error('Invalid File', 'Please drop an M3U or M3U8 file');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const content = await file.text();
      await this.loadChannelsFromContent(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlist';
      this.error.set(message);
      this.toastService.error('Load Failed', message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async checkChannelAvailability(channel: Channel): Promise<boolean> {
    try {
      const response = await fetch(channel.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async toggleOnlineFilter(): Promise<void> {
    const newValue = !this.showOnlineOnly();
    this.showOnlineOnly.set(newValue);
    
    if (newValue && this.channelStatus().size === 0) {
      // Check channels in batches
      this.isCheckingStatus.set(true);
      this.toastService.info('Checking', 'Verifying channel availability...');
      
      const channels = this.channels();
      const batchSize = 50;
      const statusMap = new Map<string, boolean>();
      
      for (let i = 0; i < channels.length; i += batchSize) {
        const batch = channels.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(ch => this.checkChannelAvailability(ch))
        );
        
        batch.forEach((ch, idx) => {
          statusMap.set(ch.id, results[idx]);
        });
      }
      
      this.channelStatus.set(statusMap);
      this.isCheckingStatus.set(false);
      
      const onlineCount = Array.from(statusMap.values()).filter(v => v).length;
      this.toastService.success('Complete', `${onlineCount} online channels found`);
    }
  }

  editPlaylistHeaders(playlist: any): void {
    this.editingPlaylist.set(playlist);
    this.headerUserAgent.set(playlist.customHeaders?.userAgent || '');
    this.headerReferer.set(playlist.customHeaders?.referer || '');
    this.showHeadersEditor.set(true);
  }

  saveHeaders(): void {
    const playlist = this.editingPlaylist();
    if (!playlist) return;

    const headers = {
      userAgent: this.headerUserAgent() || undefined,
      referer: this.headerReferer() || undefined
    };

    this.updatePlaylistHeaders(playlist.id, headers);
    this.showHeadersEditor.set(false);
  }

  clearHeaders(): void {
    this.headerUserAgent.set('');
    this.headerReferer.set('');
  }

  private async loadEpgForPlaylist(epgUrl: string): Promise<void> {
    try {
      const visibleChannels = this.sortedChannels()
        .filter(ch => ch.epgId)
        .slice(0, 100) // Only load EPG for first 100 visible channels
        .map(ch => ch.epgId!);
      
      if (visibleChannels.length === 0) {
        console.log('No channels with EPG IDs found');
        return;
      }
      
      this.toastService.info('Loading EPG', 'Fetching program guide...');
      await this.epgService.loadEpgFromUrl(epgUrl, visibleChannels);
      this.toastService.success('EPG Loaded', `Program guide loaded for ${visibleChannels.length} channels`);
    } catch (err) {
      console.error('Failed to load EPG:', err);
      this.toastService.error('EPG Failed', 'Could not load program guide');
    }
  }

  editPlaylistEpg(playlist: any): void {
    const epgUrl = prompt('Enter EPG XML URL (XMLTV format):', playlist.epgUrl || '');
    if (epgUrl === null) return; // User cancelled
    
    this.storage.updatePlaylistEpg(playlist.id, epgUrl || undefined);
    this.toastService.success('EPG Updated', 'EPG URL saved');
    
    // Reload EPG if this is the current playlist
    if (epgUrl) {
      this.loadEpgForPlaylist(epgUrl);
    }
  }
}
