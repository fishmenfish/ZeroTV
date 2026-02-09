import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({
  providedIn: 'root'
})
export class LogoCacheService {
  private cache = new Map<string, string>();
  private pendingRequests = new Map<string, Promise<string | null>>();
  private failed = new Set<string>();

  async getCachedLogo(url: string): Promise<string | null> {
    // Return cached result
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Skip if already failed
    if (this.failed.has(url)) {
      return null;
    }

    // Return existing promise if already loading (fixes race condition)
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)!;
    }

    // Start new request
    const promise = this.fetchLogo(url);
    this.pendingRequests.set(url, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(url);
      return result;
    } catch (err) {
      this.pendingRequests.delete(url);
      throw err;
    }
  }

  private async fetchLogo(url: string): Promise<string | null> {
    try {
      const cachedUrl = await invoke<string>('cache_logo', { url });
      this.cache.set(url, cachedUrl);
      return cachedUrl;
    } catch (err) {
      console.error('Failed to cache logo:', err);
      this.failed.add(url);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.failed.clear();
  }
}
