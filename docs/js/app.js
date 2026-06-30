const STORAGE_KEY = 'walk-with-me-progress';
const CACHE_NAME = 'walk-with-me-assets-v2';
const STATIONS = [
  {
    id: 1,
    title: 'Station 1',
    audio: './assets/audio/station-1.mp3',
    reflection: 'Begin with calm, steady breaths. Let this moment feel holy and simple.'
  },
  {
    id: 2,
    title: 'Station 2',
    audio: './assets/audio/station-2.mp3',
    reflection: 'Listen for a quiet voice and let it settle your heart.'
  },
  {
    id: 3,
    title: 'Station 3',
    audio: './assets/audio/station-3.mp3',
    reflection: 'Name one blessing and carry it with you.'
  },
  {
    id: 4,
    title: 'Station 4',
    audio: './assets/audio/station-4.mp3',
    reflection: 'Remember that peace can stand alongside courage.'
  },
  {
    id: 5,
    title: 'Station 5',
    audio: './assets/audio/station-5.mp3',
    reflection: 'Trust the path, even when it is not fully visible.'
  },
  {
    id: 6,
    title: 'Station 6',
    audio: './assets/audio/station-6.mp3',
    reflection: 'Let hope grow gently inside you as you walk.'
  },
  {
    id: 7,
    title: 'Station 7',
    audio: './assets/audio/station-7.mp3',
    reflection: 'Think of someone you can love and serve today.'
  },
  {
    id: 8,
    title: 'Station 8',
    audio: './assets/audio/station-8.mp3',
    reflection: 'Carry light into the places that feel dim.'
  },
  {
    id: 9,
    title: 'Station 9',
    audio: './assets/audio/station-9.mp3',
    reflection: 'Close with gratitude and a sense of peace.'
  }
];

const state = {
  currentStationIndex: 0,
  completed: [],
  readyForCamp: false,
  isDownloading: false,
  downloadedCount: 0,
  totalAssets: 0
};

const elements = {
  downloadButton: document.getElementById('downloadButton'),
  beginJourneyButton: document.getElementById('beginJourneyButton'),
  homeSection: document.getElementById('homeSection'),
  walkSection: document.getElementById('walkSection'),
  homeButton: document.getElementById('homeButton'),
  stationTitle: document.getElementById('stationTitle'),
  stationStatus: document.getElementById('stationStatus'),
  reflectionText: document.getElementById('reflectionText'),
  progressText: document.getElementById('progressText'),
  completedList: document.getElementById('completedList'),
  playButton: document.getElementById('playButton'),
  previousButton: document.getElementById('previousButton'),
  nextButton: document.getElementById('nextButton'),
  audio: document.getElementById('stationAudio'),
  downloadStatus: document.getElementById('downloadStatus'),
  readyBadge: document.getElementById('readyBadge'),
  progressValue: document.getElementById('progressValue'),
  downloadProgress: document.getElementById('downloadProgress')
};

function resolveAssetUrl(assetPath) {
  return new URL(assetPath, window.location.href).href;
}

function getRequiredAssets() {
  return [
    resolveAssetUrl('./'),
    resolveAssetUrl('./index.html'),
    resolveAssetUrl('./offline.html'),
    resolveAssetUrl('./css/styles.css'),
    resolveAssetUrl('./js/app.js'),
    resolveAssetUrl('./manifest.json'),
    resolveAssetUrl('./icons/icon-192.png'),
    resolveAssetUrl('./icons/icon-512.png'),
    ...STATIONS.map((station) => resolveAssetUrl(station.audio))
  ];
}

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

function updateReadyUI() {
  elements.beginJourneyButton.disabled = !state.readyForCamp;
  elements.readyBadge.hidden = !state.readyForCamp;
  if (state.readyForCamp) {
    elements.readyBadge.textContent = '✅ Ready for Camp';
    elements.downloadStatus.innerHTML = 'Everything has been downloaded to this device.<br>No internet connection is required during your faith walk.';
    elements.downloadProgress.value = 100;
    elements.progressValue.textContent = '100%';
  }
}

function updateProgressUI() {
  const completedCount = state.completed.length;
  if (elements.progressText) {
    elements.progressText.textContent = `${completedCount} of ${STATIONS.length} stations completed`;
  }

  if (elements.completedList) {
    elements.completedList.innerHTML = '';
    state.completed.forEach((stationId) => {
      const station = STATIONS.find((item) => item.id === stationId);
      if (!station) return;
      const item = document.createElement('li');
      item.textContent = station.title;
      elements.completedList.appendChild(item);
    });
  }
}

function showStation(index) {
  if (index < 0 || index >= STATIONS.length) return;
  const station = STATIONS[index];
  if (elements.stationTitle) {
    elements.stationTitle.textContent = station.title;
  }
  if (elements.reflectionText) {
    elements.reflectionText.textContent = station.reflection;
  }
  if (elements.audio) {
    elements.audio.src = resolveAssetUrl(station.audio);
    elements.audio.load();
  }
  if (elements.stationStatus) {
    elements.stationStatus.textContent = state.completed.includes(station.id)
      ? 'Completed and ready to revisit.'
      : 'Tap play to begin.';
  }
  if (elements.playButton) {
    elements.playButton.textContent = 'Play';
  }
  if (elements.previousButton) {
    elements.previousButton.hidden = index <= 0;
  }
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

function goToPreviousStation() {
  if (state.currentStationIndex > 0) {
    state.currentStationIndex -= 1;
    saveProgress();
    showStation(state.currentStationIndex);
  }
}

function showHomeScreen() {
  elements.walkSection.hidden = true;
  elements.homeSection.hidden = false;
  if (!elements.audio.paused) {
    elements.audio.pause();
  }
  elements.homeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function verifyCachedAssets() {
  if (!('caches' in window)) return false;
  const cache = await caches.open(CACHE_NAME);
  const assets = getRequiredAssets();
  const cachedResults = await Promise.all(assets.map((asset) => cache.match(asset)));
  const allCached = cachedResults.every((response) => Boolean(response));
  if (allCached) {
    state.readyForCamp = true;
    saveProgress();
  }
  return allCached;
}

async function downloadForCamp() {
  if (state.isDownloading) return;
  if (!('caches' in window)) {
    elements.downloadStatus.textContent = 'This browser cannot use Cache Storage.';
    return;
  }

  state.isDownloading = true;
  elements.downloadButton.disabled = true;
  elements.beginJourneyButton.disabled = true;
  elements.downloadButton.textContent = 'Downloading...';
  elements.downloadStatus.textContent = 'Preparing your offline camp files...';
  elements.progressValue.textContent = '0%';
  elements.downloadProgress.value = 0;

  const cache = await caches.open(CACHE_NAME);
  const assets = getRequiredAssets();
  state.totalAssets = assets.length;
  let completed = 0;
  const missingAssets = [];

  for (const asset of assets) {
    try {
      const response = await fetch(asset, { cache: 'reload' });
      if (response.ok) {
        await cache.put(asset, response.clone());
        completed += 1;
        state.downloadedCount = completed;
        const percent = Math.round((completed / assets.length) * 100);
        elements.downloadProgress.value = percent;
        elements.progressValue.textContent = `${percent}%`;
        elements.downloadStatus.textContent = `Caching ${asset.split('/').pop() || 'asset'} (${completed}/${assets.length})`;
      } else {
        missingAssets.push(asset);
      }
    } catch (error) {
      missingAssets.push(asset);
    }
  }

  state.readyForCamp = missingAssets.length === 0;
  state.isDownloading = false;
  elements.downloadButton.disabled = false;
  elements.downloadButton.textContent = state.readyForCamp ? 'Download Again' : 'Try Again';
  saveProgress();
  updateReadyUI();

  if (state.readyForCamp) {
    elements.downloadStatus.innerHTML = '✅ Ready for Camp<br>Everything has been downloaded to this device.<br>No internet connection is required during your faith walk.';
    elements.downloadProgress.value = 100;
    elements.progressValue.textContent = '100%';
  } else {
    elements.downloadStatus.innerHTML = `Some files could not be cached. Missing assets:<br>${missingAssets.join('<br>')}`;
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed.', error);
  }
}

function attachEvents() {
  elements.downloadButton.addEventListener('click', () => {
    downloadForCamp();
  });

  elements.beginJourneyButton.addEventListener('click', () => {
    if (!state.readyForCamp) return;
    elements.homeSection.hidden = true;
    elements.walkSection.hidden = false;
    elements.walkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showStation(state.currentStationIndex);
  });

  elements.homeButton.addEventListener('click', () => {
    showHomeScreen();
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

  elements.previousButton.addEventListener('click', () => {
    goToPreviousStation();
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
  elements.beginJourneyButton.disabled = true;
  elements.downloadProgress.value = 0;
  elements.progressValue.textContent = '0%';
  if (state.readyForCamp) {
    updateReadyUI();
  } else {
    elements.readyBadge.hidden = true;
    elements.downloadStatus.textContent = 'Tap download to cache all camp content for offline use.';
  }

  await registerServiceWorker();
  const alreadyCached = await verifyCachedAssets();
  if (alreadyCached) {
    updateReadyUI();
  }

  if (state.currentStationIndex >= 0) {
    showStation(state.currentStationIndex);
  }
});
