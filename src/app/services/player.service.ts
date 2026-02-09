import { Injectable, signal } from '@angular/core';
import { Channel } from '../models/channel.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  currentChannel = signal<Channel | null>(null);
  isPlaying = signal(false);
  volume = signal(50);
  error = signal<string | null>(null);
  streamHealth = signal<'good' | 'poor' | 'offline'>('good');
  reconnectAttempts = signal(0);
  private reconnectTimeout?: number;
  
  // Constants
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_BASE_DELAY = 2000;
  private readonly RECONNECT_MAX_DELAY = 8000;
  
  // Stream metrics
  bitrate = signal<number>(0); // kbps
  droppedFrames = signal<number>(0);
  bufferHealth = signal<number>(100); // percentage
  fps = signal<number>(0);
  
  // Custom headers
  customHeaders = signal<{ userAgent?: string; referer?: string }>({});

  constructor() {
    this.loadVolume();
  }

  private loadVolume(): void {
    const saved = localStorage.getItem('player_volume');
    if (saved) {
      this.volume.set(parseInt(saved, 10));
    }
  }

  async playChannel(channel: Channel): Promise<void> {
    try {
      this.error.set(null);
      this.reconnectAttempts.set(0);
      this.streamHealth.set('good');
      
      // Clear any pending reconnect
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      
      // Set channel
      this.currentChannel.set(channel);
      this.isPlaying.set(true);
      
    } catch (err) {
      this.error.set(err as string);
      console.error('Failed to play stream:', err);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    const attempts = this.reconnectAttempts();
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(attempts + 1);
      this.streamHealth.set('poor');
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, attempts), this.RECONNECT_MAX_DELAY);
      
      this.error.set(`Reconnecting in ${delay / 1000}s... (${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      this.reconnectTimeout = window.setTimeout(() => {
        const channel = this.currentChannel();
        if (channel) {
          this.playChannel(channel);
        }
      }, delay);
    } else {
      this.streamHealth.set('offline');
      this.error.set('Stream unavailable. Try another channel or check your connection.');
      this.reconnectAttempts.set(0);
    }
  }

  onStreamError(): void {
    this.attemptReconnect();
  }

  async stop(): Promise<void> {
    try {
      // Clear any pending reconnect
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      
      this.isPlaying.set(false);
      this.currentChannel.set(null);
      this.error.set(null);
      this.reconnectAttempts.set(0);
      this.streamHealth.set('good');
    } catch (err) {
      console.error('Failed to stop stream:', err);
    }
  }

  setVolume(volume: number): void {
    const newVolume = Math.max(0, Math.min(100, volume));
    this.volume.set(newVolume);
    localStorage.setItem('player_volume', newVolume.toString());
  }
}
