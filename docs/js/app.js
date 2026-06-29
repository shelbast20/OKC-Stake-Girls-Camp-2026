const STORAGE_KEY = 'walk-with-me-progress';
const STATIONS = [
  {
    id: 1,
    title: 'Station One: Welcome',
    audio: './assets/audio/station-1.mp3',
    reflection: 'Begin with calm, steady breaths. Let this moment feel holy and simple.'
  },
  {
    id: 2,
    title: 'Station Two: Stillness',
    audio: './assets/audio/station-2.mp3',
    reflection: 'Listen for a quiet voice and let it settle your heart.'
  },
  {
    id: 3,
    title: 'Station Three: Gratitude',
    audio: './assets/audio/station-3.mp3',
    reflection: 'Name one blessing and carry it with you.'
  },
  {
    id: 4,
    title: 'Station Four: Courage',
    audio: './assets/audio/station-4.mp3',
    reflection: 'Remember that peace can stand alongside courage.'
  },
  {
    id: 5,
    title: 'Station Five: Trust',
    audio: './assets/audio/station-5.mp3',
    reflection: 'Trust the path, even when it is not fully visible.'
  },
  {
    id: 6,
    title: 'Station Six: Hope',
    audio: './assets/audio/station-6.mp3',
    reflection: 'Let hope grow gently inside you as you walk.'
  },
  {
    id: 7,
    title: 'Station Seven: Service',
    audio: './assets/audio/station-7.mp3',
    reflection: 'Think of someone you can love and serve today.'
  },
  {
    id: 8,
    title: 'Station Eight: Light',
    audio: './assets/audio/station-8.mp3',
    reflection: 'Carry light into the places that feel dim.'
  },
  {
    id: 9,
    title: 'Station Nine: Promise',
    audio: './assets/audio/station-9.mp3',
    reflection: 'Close with gratitude and a sense of peace.'
  }
];

const state = {
  currentStationIndex: 0,
  completed: [],
  readyForCamp: false,
  downloadCount: 0
};

const elements = {
  beginButton: document.getElementById('beginButton'),
  walkSection: document.getElementById('walkSection'),
  stationTitle: document.getElementById('stationTitle'),
  stationStatus: document.getElementById('stationStatus'),
  reflectionText: document.getElementById('reflectionText'),
  progressText: document.getElementById('progressText'),
  completedList: document.getElementById('completedList'),
  playButton: document.getElementById('playButton'),
  nextButton: document.getElementById('nextButton'),
  audio: document.getElementById('stationAudio'),
  downloadStatus: document.getElementById('downloadStatus'),
  readyBadge: document.getElementById('readyBadge')
};

function loadProgress() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    state.currentStationIndex = parsed.currentStationIndex ?? 0;
    state.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
    state.readyForCamp = Boolean(parsed.readyForCamp);
  } catch (error) {
    console.warn('Unable to read saved progress.', error);
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentStationIndex: state.currentStationIndex,
    completed: state.completed,
    readyForCamp: state.readyForCamp
  }));
}

function updateProgressUI() {
  const completedCount = state.completed.length;
  elements.progressText.textContent = `${completedCount} of ${STATIONS.length} stations completed`;
  elements.completedList.innerHTML = '';
  state.completed.forEach((stationId) => {
    const station = STATIONS.find((item) => item.id === stationId);
    if (!station) return;
    const item = document.createElement('li');
    item.textContent = station.title;
    elements.completedList.appendChild(item);
  });
}

function showStation(index) {
  if (index < 0 || index >= STATIONS.length) return;
  const station = STATIONS[index];
  elements.stationTitle.textContent = station.title;
  elements.reflectionText.textContent = station.reflection;
  elements.audio.src = station.audio;
  elements.audio.load();
  elements.stationStatus.textContent = state.completed.includes(station.id)
    ? 'Completed and ready to revisit.'
    : 'Tap play to begin.';
  elements.playButton.textContent = 'Play';
  updateProgressUI();
}

function goToNextStation() {
  if (state.currentStationIndex < STATIONS.length - 1) {
    state.currentStationIndex += 1;
    saveProgress();
    showStation(state.currentStationIndex);
  } else {
    state.currentStationIndex = STATIONS.length - 1;
    saveProgress();
    elements.stationStatus.textContent = 'You completed the full walk.';
  }
}

async function cacheAudioAssets() {
  if (!('caches' in window) || !navigator.onLine) {
    elements.downloadStatus.textContent = 'Offline mode ready. Cached audio will be used when available.';
    return;
  }

  const cache = await caches.open('walk-with-me-assets-v1');
  let completed = 0;

  for (const station of STATIONS) {
    try {
      const response = await fetch(station.audio, { cache: 'reload' });
      if (response.ok) {
        await cache.put(station.audio, response.clone());
        completed += 1;
        state.downloadCount = completed;
        elements.downloadStatus.textContent = `Downloading audio ${completed} of ${STATIONS.length}...`;
      }
    } catch (error) {
      console.warn('Could not cache station audio.', error);
    }
  }

  state.readyForCamp = completed === STATIONS.length;
  saveProgress();
  if (state.readyForCamp) {
    elements.downloadStatus.textContent = 'All audio is ready.';
    elements.readyBadge.hidden = false;
    elements.readyBadge.textContent = 'Ready for Camp';
  } else {
    elements.downloadStatus.textContent = `Downloaded ${completed} of ${STATIONS.length}. Try again when online.`;
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    console.warn('Service worker registration failed.', error);
  }
}

function attachEvents() {
  elements.beginButton.addEventListener('click', () => {
    elements.walkSection.hidden = false;
    elements.walkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showStation(state.currentStationIndex);
  });

  elements.playButton.addEventListener('click', async () => {
    try {
      await elements.audio.play();
      elements.playButton.textContent = 'Playing';
      elements.stationStatus.textContent = 'Listening now.';
    } catch (error) {
      elements.stationStatus.textContent = 'Tap again to start audio.';
    }
  });

  elements.nextButton.addEventListener('click', () => {
    const station = STATIONS[state.currentStationIndex];
    if (!state.completed.includes(station.id)) {
      state.completed.push(station.id);
    }
    saveProgress();
    updateProgressUI();
    goToNextStation();
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  loadProgress();
  attachEvents();
  updateProgressUI();
  if (state.readyForCamp) {
    elements.downloadStatus.textContent = 'All audio is ready.';
    elements.readyBadge.hidden = false;
    elements.readyBadge.textContent = 'Ready for Camp';
  } else {
    elements.readyBadge.hidden = true;
  }
  await registerServiceWorker();
  await cacheAudioAssets();
  if (state.currentStationIndex >= 0) {
    showStation(state.currentStationIndex);
  }
});
