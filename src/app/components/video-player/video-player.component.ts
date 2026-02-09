import { Component, effect, input, ElementRef, ViewChild, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import Hls from 'hls.js';
import { Channel } from '../../models/channel.model';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="player-container">
      <div class="player-wrapper" *ngIf="channel(); else noChannel">
        <video 
          #videoElement
          class="video-player"
          controls
          [volume]="playerService.volume() / 100"
        ></video>
        
        @if (showPlayButton()) {
          <div class="play-overlay" (click)="playVideo()">
            <button class="play-button">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        }
        
        <div class="player-info-overlay">
          <div class="channel-name">{{ channel()?.name }}</div>
          <div class="channel-group" *ngIf="channel()?.group">
            {{ channel()?.group }}
          </div>
          <div class="stream-health" [class]="'health-' + playerService.streamHealth()">
            <span class="health-dot"></span>
            {{ playerService.streamHealth() === 'good' ? 'Live' : 
               playerService.streamHealth() === 'poor' ? 'Reconnecting...' : 'Offline' }}
          </div>
          <div class="stream-metrics">
            <div class="metric-item" *ngIf="playerService.bitrate() > 0">
              <span class="metric-label">Bitrate:</span>
              <span class="metric-value">{{ playerService.bitrate() }} kbps</span>
            </div>
            <div class="metric-item" *ngIf="playerService.fps() > 0">
              <span class="metric-label">FPS:</span>
              <span class="metric-value">{{ playerService.fps() }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Buffer:</span>
              <span class="metric-value" [class.metric-warning]="playerService.bufferHealth() < 30">
                {{ playerService.bufferHealth() }}%
              </span>
            </div>
            <div class="metric-item" *ngIf="playerService.droppedFrames() > 0">
              <span class="metric-label">Dropped:</span>
              <span class="metric-value metric-warning">{{ playerService.droppedFrames() }}</span>
            </div>
          </div>
        </div>

        <button class="pip-button" (click)="togglePictureInPicture()" title="Picture-in-Picture">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <rect x="8" y="10" width="8" height="6" rx="1" ry="1"></rect>
          </svg>
        </button>

        <div class="error-message" *ngIf="playerService.error()">
          <strong>Error:</strong> {{ playerService.error() }}
        </div>
      </div>

      <ng-template #noChannel>
        <div class="no-channel">
          <div class="placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <p>Select a channel to start watching</p>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      width: 100%;
      height: 100%;
    }

    .player-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #000;
    }

    .player-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }

    .video-player {
      flex: 1;
      width: 100%;
      height: 100%;
      background: #000;
    }

    .player-info-overlay {
      position: absolute;
      top: 24px;
      left: 24px;
      background: var(--overlay-bg);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      padding: 20px 24px;
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .channel-name {
      color: var(--text-primary);
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .channel-group {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .stream-url {
      color: var(--text-tertiary);
      font-size: 11px;
      font-family: 'SF Mono', 'Menlo', monospace;
      max-width: 450px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stream-health {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }

    .health-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    .health-good .health-dot {
      background: #30d158;
      box-shadow: 0 0 8px rgba(48, 209, 88, 0.6);
    }

    .health-good {
      color: #30d158;
    }

    .health-poor .health-dot {
      background: #ffd60a;
      box-shadow: 0 0 8px rgba(255, 214, 10, 0.6);
    }

    .health-poor {
      color: #ffd60a;
    }

    .health-offline .health-dot {
      background: #ff453a;
      box-shadow: 0 0 8px rgba(255, 69, 58, 0.6);
    }

    .health-offline {
      color: #ff453a;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.9); }
    }

    .stream-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 500;
    }

    .metric-label {
      color: rgba(255, 255, 255, 0.6);
    }

    .metric-value {
      color: #fff;
      font-weight: 600;
    }

    .metric-warning {
      color: #ffd60a !important;
    }

    .pip-button {
      position: absolute;
      bottom: 24px;
      right: 24px;
      padding: 12px;
      background: var(--overlay-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .pip-button:hover {
      background: rgba(0, 122, 255, 0.8);
      border-color: var(--accent-color);
      transform: scale(1.05);
    }

    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      cursor: pointer;
      z-index: 10;
      animation: fadeIn 0.3s ease;
    }

    .play-button {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.9);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 122, 255, 0.4);
    }

    .play-button:hover {
      background: #007aff;
      transform: scale(1.1);
      box-shadow: 0 12px 48px rgba(0, 122, 255, 0.6);
    }

    .play-button svg {
      margin-left: 4px;
    }

    .error-message {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 69, 58, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #fff;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      max-width: 80%;
      text-align: center;
      box-shadow: 0 8px 24px rgba(255, 69, 58, 0.4);
    }

    .no-channel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    }

    .placeholder {
      text-align: center;
      color: var(--text-tertiary);
    }

    .placeholder svg {
      margin-bottom: 20px;
      opacity: 0.3;
      filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
    }

    .placeholder p {
      font-size: 18px;
      margin: 0 0 10px 0;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: -0.3px;
    }

    .placeholder small {
      font-size: 14px;
      color: var(--text-tertiary);
      font-weight: 500;
    }
  `]
})
export class VideoPlayerComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  channel = input<Channel | null>();
  private hls?: Hls;
  showPlayButton = signal(false);
  private metricsInterval?: number;
  private lastDecodedFrames = 0;
  private lastDroppedFrames = 0;

  constructor(public playerService: PlayerService) {
    effect(() => {
      const ch = this.channel();
      
      if (ch) {
        this.showPlayButton.set(false);
        this.loadStream(ch.url);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.hls) {
      this.hls.destroy();
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  private startMetricsTracking(video: HTMLVideoElement): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = window.setInterval(() => {
      // Track bitrate from HLS
      if (this.hls) {
        const level = this.hls.levels[this.hls.currentLevel];
        if (level) {
          this.playerService.bitrate.set(Math.round(level.bitrate / 1000)); // Convert to kbps
        }
      }

      // Track dropped frames and FPS
      const quality = (video as any).getVideoPlaybackQuality?.();
      if (quality) {
        const droppedDelta = quality.droppedVideoFrames - this.lastDroppedFrames;
        const decodedDelta = quality.totalVideoFrames - this.lastDecodedFrames;
        
        this.playerService.droppedFrames.set(quality.droppedVideoFrames);
        this.lastDroppedFrames = quality.droppedVideoFrames;
        this.lastDecodedFrames = quality.totalVideoFrames;

        // Calculate FPS (frames per second over 1 second interval)
        if (decodedDelta > 0) {
          this.playerService.fps.set(decodedDelta);
        }
      }

      // Track buffer health
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const currentTime = video.currentTime;
        const bufferAhead = bufferedEnd - currentTime;
        
        // Buffer health: 100% = 10+ seconds, 0% = 0 seconds
        const bufferPercent = Math.min(100, Math.round((bufferAhead / 10) * 100));
        this.playerService.bufferHealth.set(bufferPercent);

        // Update stream health based on buffer
        if (bufferPercent < 20 && this.playerService.streamHealth() === 'good') {
          this.playerService.streamHealth.set('poor');
        } else if (bufferPercent >= 50 && this.playerService.streamHealth() === 'poor') {
          this.playerService.streamHealth.set('good');
        }
      }
    }, 1000); // Update every second
  }

  private loadStream(url: string): void {
    setTimeout(() => {
      const video = this.videoElement?.nativeElement;
      if (!video) {
        return;
      }

      // Destroy previous HLS instance completely
      if (this.hls) {
        this.hls.destroy();
        this.hls = undefined;
      }

      // Reset video element
      video.pause();
      video.removeAttribute('src');
      video.load();

      // Check if HLS stream
      if (url.includes('.m3u8') || url.includes('m3u')) {
        if (Hls.isSupported()) {
          
          const headers = this.playerService.customHeaders();
          const xhrSetup = (xhr: XMLHttpRequest) => {
            if (headers.referer) {
              xhr.setRequestHeader('Referer', headers.referer);
            }
          };
          
          this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            debug: false,
            xhrSetup: xhrSetup
          });
          
          this.hls.loadSource(url);
          this.hls.attachMedia(video);
          
          this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.playerService.streamHealth.set('good');
            this.playerService.error.set(null);
            this.playerService.reconnectAttempts.set(0);
            this.startMetricsTracking(video);
            video.play().catch(err => {
              console.error('Autoplay blocked:', err);
              this.showPlayButton.set(true);
            });
          });

          // Clear error when HLS successfully recovers from network error
          this.hls.on(Hls.Events.FRAG_LOADED, () => {
            if (this.playerService.streamHealth() === 'poor') {
              this.playerService.streamHealth.set('good');
              this.playerService.error.set(null);
            }
          });

          this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  this.playerService.error.set('Network error - reconnecting...');
                  this.playerService.streamHealth.set('poor');
                  this.playerService.onStreamError();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  this.hls?.recoverMediaError();
                  break;
                default:
                  this.playerService.error.set(`Stream error: ${data.type}`);
                  this.playerService.streamHealth.set('poor');
                  this.playerService.onStreamError();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            this.playerService.error.set(null);
            this.playerService.streamHealth.set('good');
            this.playerService.reconnectAttempts.set(0);
          }, { once: true });
          video.play().catch(err => {
            console.error('Autoplay blocked:', err);
            this.showPlayButton.set(true);
          });
        } else {
          this.playerService.error.set('HLS not supported in this browser');
        }
      } else {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          this.playerService.error.set(null);
          this.playerService.streamHealth.set('good');
          this.playerService.reconnectAttempts.set(0);
        }, { once: true });
        video.play().catch(err => {
          console.error('Autoplay blocked:', err);
          this.showPlayButton.set(true);
        });
      }
    }, 200);
  }

  playVideo(): void {
    const video = this.videoElement?.nativeElement;
    if (video) {
      video.play().then(() => {
        this.showPlayButton.set(false);
        this.playerService.streamHealth.set('good');
        this.playerService.error.set(null);
        this.playerService.reconnectAttempts.set(0);
      }).catch(err => {
        console.error('Play failed:', err);
        this.playerService.error.set('Failed to play stream');
      });
    }
  }

  async togglePictureInPicture(): Promise<void> {
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  }
}
