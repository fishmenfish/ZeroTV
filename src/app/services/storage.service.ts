import { Injectable, signal } from '@angular/core';
import { AppSettings, SavedPlaylist } from '../models/channel.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly SETTINGS_KEY = 'iptv_settings';

  settings = signal<AppSettings>({
    volume: 50,
    windowMaximized: false,
    favorites: [],
    recentlyWatched: []
  });

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    if (stored) {
      this.settings.set(JSON.parse(stored));
    }
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.settings();
    const updated = { ...current, ...settings };
    this.settings.set(updated);
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  toggleFavorite(channelId: string): void {
    const current = this.settings();
    const favorites = current.favorites || [];
    const index = favorites.indexOf(channelId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(channelId);
    }
    
    this.saveSettings({ favorites });
  }

  isFavorite(channelId: string): boolean {
    return this.settings().favorites?.includes(channelId) || false;
  }

  addToRecentlyWatched(channelId: string): void {
    const current = this.settings();
    let recent = [...(current.recentlyWatched || [])];
    
    recent = recent.filter(id => id !== channelId);
    recent.unshift(channelId);
    recent = recent.slice(0, 10);
    
    this.saveSettings({ recentlyWatched: recent });
  }

  getRecentlyWatched(): string[] {
    return this.settings().recentlyWatched || [];
  }

  // Playlist management
  savePlaylist(url: string, name?: string): void {
    const current = this.settings();
    const id = Date.now().toString();
    const playlist: SavedPlaylist = {
      id,
      name: name || new URL(url).hostname,
      url,
      addedAt: Date.now()
    };
    
    const playlists = current.playlists || [];
    playlists.push(playlist);
    this.saveSettings({ playlists, lastPlaylistUrl: url });
  }

  removePlaylist(id: string): void {
    const current = this.settings();
    const playlists = (current.playlists || []).filter(p => p.id !== id);
    this.saveSettings({ playlists });
  }

  updatePlaylistHeaders(id: string, headers: { userAgent?: string; referer?: string }): void {
    const current = this.settings();
    const playlists = current.playlists || [];
    const playlist = playlists.find(p => p.id === id);
    
    if (playlist) {
      playlist.customHeaders = headers;
      this.saveSettings({ playlists });
    }
  }

  updatePlaylistEpg(id: string, epgUrl?: string): void {
    const current = this.settings();
    const playlists = current.playlists || [];
    const playlist = playlists.find(p => p.id === id);
    
    if (playlist) {
      playlist.epgUrl = epgUrl;
      this.saveSettings({ playlists });
    }
  }

  getPlaylists(): SavedPlaylist[] {
    return this.settings().playlists || [];
  }

  // Export/Import settings
  exportSettings(): string {
    const data = {
      settings: this.settings(),
      playerVolume: localStorage.getItem('player_volume')
    };
    return JSON.stringify(data, null, 2);
  }

  importSettings(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.settings) {
        this.settings.set(data.settings);
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
      }
      
      if (data.playerVolume) {
        localStorage.setItem('player_volume', data.playerVolume);
      }
      
      this.loadSettings();
    } catch (err) {
      throw new Error('Invalid settings file');
    }
  }
}
