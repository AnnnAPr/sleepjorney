import { useState } from 'react';
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

const TIMER_OPTIONS = [15, 30, 60, 120];

const App = () => {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<AudioItem[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timer = useTimer(() => {
    audioPlayer.reset();
    setIsPlaying(false);
  });

  const toggleItem = (item: AudioItem): void => {
    if (item.premium && !isPremium) {
      alert(t('unlock'));
      return;
    }

    setSelected((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const newSelected = exists
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item];

      // Sync player queue if playing
      if (isPlaying) {
        audioPlayer.setQueue(newSelected);
        if (newSelected.length === 0) {
          audioPlayer.stop();
          timer.stop();
          setIsPlaying(false);
        }
      }

      return newSelected;
    });
  };

  const removeFromQueue = (id: string): void => {
    setSelected((prev) => {
      const newSelected = prev.filter((i) => i.id !== id);

      if (isPlaying) {
        audioPlayer.reset();
        audioPlayer.setQueue(newSelected);
        if (newSelected.length > 0) {
          audioPlayer.play();
        } else {
          timer.stop();
          setIsPlaying(false);
        }
      }

      return newSelected;
    });
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelected((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newSelected = arrayMove(items, oldIndex, newIndex);

      if (isPlaying) {
        audioPlayer.reset();
        audioPlayer.setQueue(newSelected);
        audioPlayer.play();
        // Timer remains unchanged as per discussion
      }

      return newSelected;
    });
  };

  const togglePlayback = (): void => {
    if (selected.length === 0) return;

    if (isPlaying) {
      audioPlayer.stop();
      timer.stop();
      setIsPlaying(false);
    } else {
      audioPlayer.setQueue(selected);
      audioPlayer.play();

      const minutes = activeTimer ?? customMinutes;

      if (minutes > 0) {
        timer.start(minutes);
      }

      setIsPlaying(true);
    }
  };

  return (
    <div className="container">
      <h1>SleepJorney</h1>

      <h2>{t('timer')}</h2>

      {TIMER_OPTIONS.map((value) => (
        <button
          key={value}
          className={`button ${activeTimer === value ? 'active' : ''}`}
          onClick={() => {
            setActiveTimer(value);
            setCustomMinutes(0);
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
          setCustomMinutes(Number(e.target.value));
          setActiveTimer(null);
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
        {AUDIO_ITEMS.map((item) => (
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