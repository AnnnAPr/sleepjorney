// import type { AudioItem } from '../types/audio';

// class AudioPlayer {
//   private queue: AudioItem[] = [];
//   private currentIndex = 0;
//   private audio: HTMLAudioElement | null = null;
//   private isPlaying = false;

//   setQueue(queue: AudioItem[]): void {
//     this.queue = queue;
//     this.currentIndex = 0;
//   }

//   play(): void {
//     if (this.queue.length === 0) return;

//     this.isPlaying = true;
//     this.playCurrent();
//   }

//   private playCurrent(): void {
//     if (!this.isPlaying) return;

//     const item = this.queue[this.currentIndex];

//     if (this.audio) {
//       this.audio.pause();
//     }

//     this.audio = new Audio(item.src);
//     this.audio.onended = () => {
//       this.next();
//     };

//     this.audio.play();
//   }

//   private next(): void {
//     this.currentIndex = (this.currentIndex + 1) % this.queue.length;
//     this.playCurrent();
//   }

//   stop(): void {
//     this.isPlaying = false;
//     if (this.audio) {
//       this.audio.pause();
//       this.audio = null;
//     }
//   }
// }

// export const audioPlayer = new AudioPlayer();


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
    if (this.queue.length === 0) return;

    this.isPlaying = true;

    if (this.audio) {
      this.audio.play(); // resume
      return;
    }

    this.playCurrent();
  }

  private playCurrent(): void {
    if (!this.isPlaying) return;

    const item = this.queue[this.currentIndex];

    this.audio = new Audio(item.src);

    this.audio.onended = () => {
      this.next();
    };

    this.audio.play();
  }

  private next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.audio = null;
    this.playCurrent();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause(); // keep position
    }
  }

  reset(): void {
    this.audio?.pause();
    this.audio = null;
    this.currentIndex = 0;
  }
}

export const audioPlayer = new AudioPlayer();