import { Injectable, signal, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

export interface EpgProgram {
  channelId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
}

export interface EpgData {
  [channelId: string]: EpgProgram[];
}

@Injectable({
  providedIn: 'root'
})
export class EpgService implements OnDestroy {
  private epgData = signal<EpgData>({});
  private lastUpdate = signal<number>(0);
  private updateSubscription?: Subscription;
  private readonly CACHE_KEY = 'epg_cache';
  private readonly UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly HOURS_AHEAD = 8;

  constructor() {
    this.loadFromCache();
    this.startAutoUpdate();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Convert date strings back to Date objects
        const epgData: EpgData = {};
        for (const [channelId, programs] of Object.entries(data.epg)) {
          epgData[channelId] = (programs as any[]).map(p => ({
            ...p,
            start: new Date(p.start),
            end: new Date(p.end)
          }));
        }
        this.epgData.set(epgData);
        this.lastUpdate.set(data.timestamp);
      }
    } catch (err) {
      console.error('Failed to load EPG cache:', err);
    }
  }

  private saveToCache(): void {
    try {
      const data = {
        epg: this.epgData(),
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save EPG cache:', err);
    }
  }

  private startAutoUpdate(): void {
    // Update every hour using RxJS interval (properly cleaned up)
    this.updateSubscription = interval(this.UPDATE_INTERVAL).subscribe(() => {
      const now = Date.now();
      if (now - this.lastUpdate() > this.UPDATE_INTERVAL) {
        this.lastUpdate.set(now);
        this.saveToCache();
      }
    });
  }

  async loadEpgFromUrl(url: string, visibleChannelIds: string[]): Promise<void> {
    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const epgData: EpgData = {};
      const now = new Date();
      const maxTime = new Date(now.getTime() + this.HOURS_AHEAD * 60 * 60 * 1000);

      // Parse only for visible channels
      for (const channelId of visibleChannelIds) {
        const programs: EpgProgram[] = [];
        
        const programElements = xmlDoc.querySelectorAll(`programme[channel="${channelId}"]`);
        
        for (const prog of Array.from(programElements)) {
          const startStr = prog.getAttribute('start');
          const endStr = prog.getAttribute('stop');
          
          if (!startStr || !endStr) continue;
          
          const start = this.parseXmltvTime(startStr);
          const end = this.parseXmltvTime(endStr);
          
          // Only include programs within next 8 hours
          if (start > maxTime) break;
          if (end < now) continue;
          
          const titleEl = prog.querySelector('title');
          const descEl = prog.querySelector('desc');
          const categoryEl = prog.querySelector('category');
          
          programs.push({
            channelId,
            title: titleEl?.textContent || 'Unknown',
            description: descEl?.textContent,
            start,
            end,
            category: categoryEl?.textContent
          });
        }
        
        if (programs.length > 0) {
          epgData[channelId] = programs;
        }
      }
      
      this.epgData.set(epgData);
      this.lastUpdate.set(Date.now());
      this.saveToCache();
      
      console.log(`Loaded EPG for ${Object.keys(epgData).length} channels`);
    } catch (err) {
      console.error('Failed to load EPG:', err);
    }
  }

  private parseXmltvTime(timeStr: string): Date {
    // XMLTV format: YYYYMMDDHHmmss +TZOFFSET
    // Example: 20240208120000 +0000
    const year = parseInt(timeStr.substring(0, 4));
    const month = parseInt(timeStr.substring(4, 6)) - 1;
    const day = parseInt(timeStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(8, 10));
    const minute = parseInt(timeStr.substring(10, 12));
    const second = parseInt(timeStr.substring(12, 14));
    
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  getCurrentProgram(channelId: string): EpgProgram | null {
    const programs = this.epgData()[channelId];
    if (!programs) return null;
    
    const now = new Date();
    return programs.find(p => p.start <= now && p.end > now) || null;
  }

  getNextProgram(channelId: string): EpgProgram | null {
    const programs = this.epgData()[channelId];
    if (!programs) return null;
    
    const now = new Date();
    return programs.find(p => p.start > now) || null;
  }

  getPrograms(channelId: string): EpgProgram[] {
    return this.epgData()[channelId] || [];
  }

  clearCache(): void {
    this.epgData.set({});
    this.lastUpdate.set(0);
    localStorage.removeItem(this.CACHE_KEY);
  }

  destroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }
}
