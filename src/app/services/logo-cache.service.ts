import { Injectable, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({
  providedIn: 'root'
})
export class LogoCacheService {
  private cache = new Map<string, string>();
  private loading = new Set<string>();
  private failed = new Set<string>();

  async getCachedLogo(url: string): Promise<string | null> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Skip if already failed
    if (this.failed.has(url)) {
      return null;
    }

    // Skip if already loading
    if (this.loading.has(url)) {
      return null;
    }

    // Start loading
    this.loading.add(url);

    try {
      const cachedUrl = await invoke<string>('cache_logo', { url });
      this.cache.set(url, cachedUrl);
      this.loading.delete(url);
      return cachedUrl;
    } catch (err) {
      console.error('Failed to cache logo:', err);
      this.failed.add(url);
      this.loading.delete(url);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.loading.clear();
    this.failed.clear();
  }
}
