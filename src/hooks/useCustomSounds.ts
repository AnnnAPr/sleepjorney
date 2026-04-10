import { useState, useEffect, useRef, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import type { AudioItem } from '../types/audio';

const STORAGE_KEY = 'custom_sounds_metadata';

// Session cache to store the original File-based Blob URLs for immediate playback.
// This is cleared when the page refreshes, providing a robust fallback to Filesystem resolution.
const sessionCache = new Map<string, string>();

export function useCustomSounds() {
  const [customSounds, setCustomSounds] = useState<AudioItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse custom sounds', e);
      }
    }
    return [];
  });

  const [resolvedSounds, setResolvedSounds] = useState<AudioItem[]>([]);
  const resolvedCache = useRef<Map<string, string>>(new Map()); // id -> blobUrl

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      const platform = Capacitor.getPlatform();
      const newResolved = await Promise.all(customSounds.map(async (sound) => {
        // 1. Check Session Cache (Immediate priority)
        if (sessionCache.has(sound.id)) {
          return { ...sound, src: sessionCache.get(sound.id)! };
        }

        // 2. Check Resolved Cache (Already loaded from filesystem this session)
        if (resolvedCache.current.has(sound.id)) {
          return { ...sound, src: resolvedCache.current.get(sound.id)! };
        }

        // 3. Resolve from Filesystem for Web (Fallback for page refresh)
        if (platform === 'web' && sound.src.includes('file:')) {
          try {
            const filename = sound.src.split('/').pop()!;
            const { data } = await Filesystem.readFile({
              path: filename,
              directory: Directory.Data
            });
            
            // Use stored mimeType or guess as fallback
            const mimeType = sound.mimeType || 'audio/mpeg';
            
            // Robust base64 to Blob conversion
            const byteCharacters = atob(data as string);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            const blobUrl = URL.createObjectURL(blob);
            resolvedCache.current.set(sound.id, blobUrl);
            return { ...sound, src: blobUrl };
          } catch (e) {
            console.error('Failed to resolve web URI for', sound.title, e);
            return sound;
          }
        }
        return sound;
      }));

      if (isMounted) {
        setResolvedSounds(newResolved);

        // Cleanup: Revoke URLs for sounds that are no longer in our customSounds list
        const currentIds = new Set(customSounds.map(s => s.id));
        for (const [id, url] of resolvedCache.current.entries()) {
          // DO NOT revoke if it's in the sessionCache (those are managed separately)
          if (!currentIds.has(id) && !sessionCache.has(id)) {
            URL.revokeObjectURL(url);
            resolvedCache.current.delete(id);
          }
        }
      }
    };

    resolve();
    
    return () => {
      isMounted = false;
    };
  }, [customSounds]);

  // Clean up ALL URLs when the whole component is destroyed
  useEffect(() => {
    const cache = resolvedCache.current;
    return () => {
      cache.forEach(url => URL.revokeObjectURL(url));
      cache.clear();
      // We don't necessarily clear sessionCache here as it's outside the hook's lifecycle,
      // but we could if we wanted to be extremely safe.
    };
  }, []);

  const saveMetadata = useCallback((items: AudioItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setCustomSounds(items);
  }, []);

  const addSoundFromFile = useCallback(async (file: File) => {
    const id = `custom_${Date.now()}`;
    
    // 1. Generate clean title
    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "") 
      .replace(/[_-]/g, " ")     
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
      .join(' ');
    
    // 2. Create immediate session URL
    const sessionUrl = URL.createObjectURL(file);
    sessionCache.set(id, sessionUrl);

    // 3. Read as DataURL to get base64 for persistent storage
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64Data = resultStr.split(',')[1];
          
          // Strict filename sanitization: only alphanumeric and underscores
          // This prevents filesystem errors on some platforms/environments
          const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
          const filename = `${id}_${safeName}`;
          
          const writeResult = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Data,
          });

          const newItem: AudioItem = {
            id,
            title: cleanTitle,
            src: writeResult.uri,
            type: 'sound',
            premium: true,
            isCustom: true,
            mimeType: file.type // Store original MIME type!
          };

          saveMetadata([newItem, ...customSounds]);
          resolve();
        } catch (e) {
          console.error('Filesystem write failed', e);
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }, [customSounds, saveMetadata]);

  const removeSound = useCallback(async (item: AudioItem) => {
    try {
      const original = customSounds.find(s => s.id === item.id);
      if (original) {
        const filename = original.src.split('/').pop()!;
        await Filesystem.deleteFile({
          path: filename,
          directory: Directory.Data
        });
      }
      
      // Clean up session cache if present
      if (sessionCache.has(item.id)) {
        URL.revokeObjectURL(sessionCache.get(item.id)!);
        sessionCache.delete(item.id);
      }
    } catch (e) {
      console.warn('File deletion skipped', e);
    }
    saveMetadata(customSounds.filter(s => s.id !== item.id));
  }, [customSounds, saveMetadata]);

  return { customSounds: resolvedSounds, addSoundFromFile, removeSound };
}
