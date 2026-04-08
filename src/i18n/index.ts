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
      selected: 'Selected Queue',
      soundsAndMusic: 'Sounds & Music',
      "Rain": "Rain",
      "White Noise": "White Noise",
      "Fireplace": "Fireplace",
      "Dream": "Dream",
      "Thunderstorm": "Thunderstorm",
      "Forest": "Forest",
      "Ocean": "Ocean",
      "Wind": "Wind",
      "Train": "Train",
      "Deep Sleep": "Deep Sleep",
      "Soft Piano": "Soft Piano",
      "Mur Purr": "Mur Purr",
      translationNote: "Note: Translations are automatically generated and may contain inaccuracies."
    }
  },
  es: {
    translation: {
      play: 'Jugar',
      stop: 'Parar',
      unlock: 'Desbloquear Premium',
      timer: 'Minutero',
      custom: 'Personalizado (min)',
      selected: 'Cola Seleccionada',
      soundsAndMusic: 'Sonidos y Música',
      "Rain": "Lluvia",
      "White Noise": "Ruido Blanco",
      "Fireplace": "Chimenea",
      "Dream": "Soñar",
      "Thunderstorm": "Tormenta",
      "Forest": "Bosque",
      "Ocean": "Océano",
      "Wind": "Viento",
      "Train": "Tren",
      "Deep Sleep": "Sueño Profundo",
      "Soft Piano": "Piano Suave",
      "Mur Purr": "Ronroneo",
      translationNote: "Nota: Las traducciones fueron generadas automáticamente y pueden no ser exactas."
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