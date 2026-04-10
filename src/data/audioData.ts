import type { AudioItem } from '../types/audio';

export const AUDIO_ITEMS: AudioItem[] = [
  // Free sounds
  {
    id: 'mur_purr',
    title: 'Mur Purr',
    src: '/sounds/purr.mp3',
    type: 'sound',
    premium: false
  },
  {
    id: 'rain',
    title: 'Rain',
    src: '/sounds/rain.mp3',
    type: 'sound',
    premium: false
  },
  {
    id: 'whitenoise',
    title: 'White Noise',
    src: '/sounds/whitenoise.mp3',
    type: 'sound',
    premium: false
  },
  {
    id: 'fireplace',
    title: 'Fireplace',
    src: '/sounds/fireplace.mp3',
    type: 'sound',
    premium: false
  },

  // Free music
  {
    id: 'dream',
    title: 'Dream',
    src: '/sounds/dream.mp3',
    type: 'music',
    premium: false
  },
  {
    id: 'violin',
    title: 'Violin',
    src: '/sounds/violin.mp3',
    type: 'music',
    premium: false
  },

  // Paid sounds
  {
    id: 'thunderstorm',
    title: 'Thunderstorm',
    src: '/sounds/thunder.mp3',
    type: 'sound',
    premium: true
  },
  {
    id: 'forest',
    title: 'Forest',
    src: '/sounds/forest.mp3',
    type: 'sound',
    premium: true
  },
  {
    id: 'ocean',
    title: 'Ocean',
    src: '/sounds/ocean.mp3',
    type: 'sound',
    premium: true
  },
  {
    id: 'wind',
    title: 'Wind',
    src: '/sounds/wind.mp3',
    type: 'sound',
    premium: true
  },
  {
    id: 'train',
    title: 'Train',
    src: '/sounds/train.wav',
    type: 'sound',
    premium: true
  },

  // Paid music
  {
    id: 'deep_drone',
    title: 'Deep Sleep',
    src: '/sounds/deep.mp3',
    type: 'music',
    premium: true
  },
  {
    id: 'piano',
    title: 'Soft Piano',
    src: '/sounds/piano.mp3',
    type: 'music',
    premium: true
  }
];