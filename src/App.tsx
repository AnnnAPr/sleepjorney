import { useState, useEffect, useCallback } from 'react';
import './index.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { AUDIO_ITEMS } from './data/audioData';
import type { AudioItem } from './types/audio';
import { audioPlayer } from './audio/player';
import { useTimer } from './hooks/useTimer';

import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import SortableItem from './components/SortableItem';

const TIMER_OPTIONS = [1, 15, 30, 60, 120];

const App = () => {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<AudioItem[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const onEnd = useCallback(() => {
    console.log('App: Timer ended, stopping playback');
    audioPlayer.reset();
    setIsPlaying(false);
    // Clear timer selection so next Play starts without a timer
    setActiveTimer(null);
    setCustomMinutes(0);
  }, []);

  const timer = useTimer(onEnd);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleItem = (item: AudioItem): void => {
    if (item.premium && !isPremium) {
      alert(t('unlock'));
      return;
    }

    setSelected((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      return exists
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item];
    });
  };

  const removeFromQueue = (id: string): void => {
    setSelected((prev) => prev.filter((i) => i.id !== id));
    
    // If we're playing, we want to immediately skip to the new first sound 
    // or stop if the list is now empty.
    if (isPlaying) {
      const newSelected = selected.filter(i => i.id !== id);
      audioPlayer.reset();
      audioPlayer.setQueue(newSelected);
      if (newSelected.length > 0) {
        audioPlayer.play();
      } else {
        timer.stop();
        setIsPlaying(false);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = selected.findIndex((i) => i.id === active.id);
    const newIndex = selected.findIndex((i) => i.id === over.id);
    const newSelected = arrayMove(selected, oldIndex, newIndex);

    setSelected(newSelected);

    if (isPlaying) {
      audioPlayer.reset();
      audioPlayer.setQueue(newSelected);
      audioPlayer.play();
    }
  };

  // Sync Queue while playing (for toggleItem adding)
  useEffect(() => {
    if (isPlaying) {
      audioPlayer.setQueue(selected);
    }
  }, [selected, isPlaying]);

  const togglePlayback = (): void => {
    if (selected.length === 0) return;

    if (isPlaying) {
      console.log('App: Pausing playback');
      audioPlayer.stop();
      timer.stop();
      setIsPlaying(false);
    } else {
      console.log('App: Resuming or starting playback');
      
      // If we have a paused timer, resume it. 
      // Otherwise start a fresh session.
      if (timer.seconds > 0) {
        audioPlayer.play();
        timer.resume();
      } else {
        audioPlayer.reset();
        audioPlayer.setQueue(selected);
        audioPlayer.play();

        const minutes = activeTimer ?? customMinutes;
        if (minutes > 0) {
          timer.start(minutes);
        }
      }

      setIsPlaying(true);
    }
  };

  return (
    <div className="container">
      <h1>SleepJorney</h1>

      <div className="timer-header">
        <h2>{t('timer')}</h2>
        {timer.seconds > 0 && (
          <span className="timer-countdown">{formatTime(timer.seconds)}</span>
        )}
      </div>

      {TIMER_OPTIONS.map((value) => (
        <button
          key={value}
          className={`button ${activeTimer === value ? 'active' : ''}`}
          onClick={() => {
            setActiveTimer(value);
            setCustomMinutes(0);
            // If playing, immediately switch to the new timer
            if (isPlaying) {
              timer.start(value);
            } else {
              timer.reset(); // Clear any paused state if we pick a new setting
            }
          }}
        >
          {value}
        </button>
      ))}

      <input
        type="number"
        placeholder={t('custom')}
        value={customMinutes || ''}
        onChange={(e) => {
          const val = Number(e.target.value);
          setCustomMinutes(val);
          setActiveTimer(null);
          // If playing, immediately switch to the new timer
          if (isPlaying && val > 0) {
            timer.start(val);
          } else if (!isPlaying) {
            timer.reset();
          }
        }}
      />

      <h2>{t('selected')}</h2>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={selected.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="list">
            {selected.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                title={item.title}
                onRemove={removeFromQueue}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <h2>Sounds & Music</h2>

      <div className="list">
        {AUDIO_ITEMS.filter(item => !selected.find(s => s.id === item.id)).map((item) => (
          <div key={item.id} className="list-item">
            <button className="button" onClick={() => toggleItem(item)}>
              {item.title} {item.premium ? '🔒' : ''}
            </button>
          </div>
        ))}
      </div>



      <br />

      <button
        className={`button ${isPlaying ? 'stop' : 'primary'}`}
        onClick={togglePlayback}
      >
        {isPlaying ? t('stop') : t('play')}
      </button>

      <br /><br />

      {!isPremium && (
        <button className="button" onClick={() => setIsPremium(true)}>
          {t('unlock')}
        </button>
      )}
    </div>
  );
};

export default App;