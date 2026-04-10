export type AudioType = 'sound' | 'music';

export type AudioItem = {
  id: string;
  title: string;
  src: string;
  type: AudioType;
  premium: boolean;
  volume?: number;
  isCustom?: boolean;
  mimeType?: string;
};