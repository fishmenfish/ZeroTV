export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  isFavorite?: boolean;
  epgId?: string; // EPG channel ID (tvg-id from M3U)
}

export interface Playlist {
  name: string;
  url?: string;
  channels: Channel[];
}

export interface AppSettings {
  lastChannelId?: string;
  volume: number;
  windowMaximized: boolean;
  favorites: string[];
  recentlyWatched: string[];
  playlists?: SavedPlaylist[];
  lastPlaylistUrl?: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  url: string;
  addedAt: number;
  customHeaders?: PlaylistHeaders;
  epgUrl?: string; // EPG XML URL
}

export interface PlaylistHeaders {
  userAgent?: string;
  referer?: string;
}
