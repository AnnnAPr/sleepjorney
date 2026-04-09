import type { AudioItem } from '../types/audio';

class AudioPlayer {
  private activeAudios: Map<string, HTMLAudioElement> = new Map();
  private userVolumes: Map<string, number> = new Map();
  private isPlaying = false;
  private globalVolume = 1.0;

  // Syncs the active audios with the provided list (the "Queue" is a "Mixer")
  syncTracks(tracks: AudioItem[]): void {
    const newIds = new Set(tracks.map(t => t.id));
    
    // Stop and remove tracks that were deleted from the mix
    for (const [id, audio] of this.activeAudios.entries()) {
      if (!newIds.has(id)) {
        audio.pause();
        audio.src = '';
        this.activeAudios.delete(id);
      }
    }

    // Add new tracks
    for (const track of tracks) {
      if (!this.activeAudios.has(track.id)) {
        const audio = new Audio(track.src);
        audio.loop = true; // Everything loops infinitely!
        
        // Default volumes based on type
        let defaultVol = track.type === 'music' ? 0.35 : 1.0;
        if (track.volume !== undefined) defaultVol = track.volume;
        
        // Save user preference immediately if they haven't touched the slider yet
        if (!this.userVolumes.has(track.id)) {
           this.userVolumes.set(track.id, defaultVol);
        }
        
        audio.volume = this.userVolumes.get(track.id)! * this.globalVolume;
        this.activeAudios.set(track.id, audio);
        
        // If the player is already running, instantly start the new track too
        if (this.isPlaying) {
          audio.play().catch(e => console.error('AudioPlayer play failed', e));
        }
      }
    }

    this.updateMediaSession(tracks);
  }

  setTrackVolume(id: string, volume: number): void {
    this.userVolumes.set(id, volume);
    const audio = this.activeAudios.get(id);
    if (audio) {
      audio.volume = volume * this.globalVolume;
    }
  }

  getTrackVolume(id: string, defaultType: string): number {
    if (this.userVolumes.has(id)) return this.userVolumes.get(id)!;
    return defaultType === 'music' ? 0.35 : 1.0;
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    for (const [id, audio] of this.activeAudios.entries()) {
       const userVol = this.userVolumes.get(id) ?? 1.0;
       audio.volume = userVol * this.globalVolume;
    }
  }

  play(): void {
    if (this.activeAudios.size === 0) return;
    this.isPlaying = true;
    for (const audio of this.activeAudios.values()) {
      audio.play().catch(e => console.error('AudioPlayer resume failed', e));
    }
  }

  /** Play a single track (non-looping). Calls onEnded when the track finishes. */
  playSingle(track: AudioItem, onEnded: () => void): void {
    // Stop everything currently playing
    for (const [, audio] of this.activeAudios.entries()) {
      audio.pause();
      audio.src = '';
    }
    this.activeAudios.clear();

    const audio = new Audio(track.src);
    audio.loop = false;

    let defaultVol = track.type === 'music' ? 0.35 : 1.0;
    if (track.volume !== undefined) defaultVol = track.volume;
    if (!this.userVolumes.has(track.id)) {
      this.userVolumes.set(track.id, defaultVol);
    }
    audio.volume = this.userVolumes.get(track.id)! * this.globalVolume;

    audio.addEventListener('ended', onEnded, { once: true });

    this.activeAudios.set(track.id, audio);
    this.isPlaying = true;
    audio.play().catch(e => console.error('AudioPlayer playSingle failed', e));

    this.updateMediaSession([track]);
  }

  stop(): void {
    this.isPlaying = false;
    for (const audio of this.activeAudios.values()) {
      audio.pause();
    }
  }

  reset(): void {
    this.stop();
    this.activeAudios.clear();
    this.globalVolume = 1.0;
  }
  
  private updateMediaSession(tracks: AudioItem[]) {
    // Native lock-screen controls for Android/iOS WebViews automatically!
    if ('mediaSession' in navigator) {
      const titles = tracks.map(t => t.title).join(', ');
      navigator.mediaSession.metadata = new MediaMetadata({
        title: titles.length > 0 ? titles : 'SleepJorney Mix',
        artist: 'SleepJorney App',
        artwork: [
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' } 
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        this.play();
        window.dispatchEvent(new Event('app_play'));
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.stop();
        window.dispatchEvent(new Event('app_pause'));
      });
    }
  }
}

export const audioPlayer = new AudioPlayer();