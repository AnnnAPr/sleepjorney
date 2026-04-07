import type { AudioItem } from '../types/audio';

class AudioPlayer {
  private queue: AudioItem[] = [];
  private currentIndex = 0;
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  setQueue(queue: AudioItem[]): void {
    this.queue = queue;
  }

  play(): void {
    if (this.queue.length === 0) {
      console.warn('AudioPlayer: Cannot play an empty queue');
      return;
    }

    this.isPlaying = true;

    if (this.audio) {
      console.log('AudioPlayer: Resuming audio');
      this.audio.play().catch(e => console.error('AudioPlayer: Resume failed', e));
      return;
    }

    this.playCurrent();
  }

  private playCurrent(): void {
    if (!this.isPlaying) return;

    const item = this.queue[this.currentIndex];
    console.log('AudioPlayer: Starting playback of', item.title, 'from', item.src);

    this.audio = new Audio(item.src);

    this.audio.onended = () => {
      console.log('AudioPlayer: Sound ended, moving to next');
      this.next();
    };

    this.audio.play()
      .then(() => console.log('AudioPlayer: Playback started successfully'))
      .catch(e => {
        console.error('AudioPlayer: Playback failed for', item.title, e);
        // If it failed, we try to move to next or stop to prevent loops of errors
        if (this.isPlaying) {
           console.log('AudioPlayer: Attempting to skip failed sound');
           this.next();
        }
      });
  }

  private next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.audio = null;
    this.playCurrent();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.audio) {
      console.log('AudioPlayer: Pausing playback');
      this.audio.pause(); // keep position
    }
  }

  reset(): void {
    console.log('AudioPlayer: Resetting player state');
    this.audio?.pause();
    this.audio = null;
    this.currentIndex = 0;
  }
}

export const audioPlayer = new AudioPlayer();