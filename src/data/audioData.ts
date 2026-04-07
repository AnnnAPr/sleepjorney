import type { AudioItem } from '../types/audio';

export const AUDIO_ITEMS: AudioItem[] = [
  // Free sounds
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
    id: 'ambient_free',
    title: 'Ambient',
    src: '/sounds/ambient.mp3',
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
    title: 'Ocean Waves',
    src: '/sounds/ocean.mp3',
    type: 'sound',
    premium: true
  },
  // {
  //   id: 'wind',
  //   title: 'Strong Wind',
  //   src: '/sounds/wind.mp3',
  //   type: 'sound',
  //   premium: true
  // },
  {
    id: 'train',
    title: 'Train Cabin',
    src: '/sounds/train.wav',
    type: 'sound',
    premium: true
  },

  // Paid music
  {
    id: 'deep_drone',
    title: 'Deep Drone',
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
  },
  {
    id: 'space',
    title: 'Space Ambient',
    src: '/sounds/space.mp3',
    type: 'music',
    premium: true
  }
];