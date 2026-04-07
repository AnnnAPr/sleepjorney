import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      play: 'Play',
      stop: 'Stop',
      unlock: 'Unlock Premium',
      timer: 'Timer',
      custom: 'Custom (min)',
      selected: 'Selected Queue'
    }
  },
  es: {
    translation: {
      play: 'Reproducir',
      stop: 'Detener',
      unlock: 'Desbloquear Premium',
      timer: 'Temporizador',
      custom: 'Personalizado (min)',
      selected: 'Cola seleccionada'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;