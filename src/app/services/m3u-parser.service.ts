import { Injectable } from '@angular/core';
import { Channel } from '../models/channel.model';

@Injectable({
  providedIn: 'root'
})
export class M3uParserService {
  parseM3u(content: string): Channel[] {
    const lines = content.split('\n');
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        currentChannel = this.parseExtInf(line);
      } else if (line && !line.startsWith('#') && currentChannel) {
        currentChannel.url = line;
        currentChannel.id = this.generateId(currentChannel.name || '', line);
        channels.push(currentChannel as Channel);
        currentChannel = null;
      }
    }

    return channels;
  }

  private parseExtInf(line: string): Partial<Channel> {
    const channel: Partial<Channel> = {};
    
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (logoMatch) channel.logo = logoMatch[1];

    const groupMatch = line.match(/group-title="([^"]*)"/);
    if (groupMatch) channel.group = groupMatch[1];

    const epgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (epgIdMatch) channel.epgId = epgIdMatch[1];

    const nameMatch = line.split(',').pop();
    if (nameMatch) channel.name = nameMatch.trim();

    return channel;
  }

  private generateId(name: string, url: string): string {
    const str = name + url;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 16);
  }
}
