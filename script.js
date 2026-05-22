// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_KEY = 'c91521deb71cbdf06bd24010b494707c';
const LATENCY_URL = 'https://raw.githubusercontent.com/prattikk69/For-fetching-Data/refs/heads/main/weather.json';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const search       = document.getElementById('searchBar');
const currentCityEl= document.getElementById('currentCityID');
const putResultEl  = document.getElementById('putResultID');
const tempEl       = document.getElementById('tempID');
const maxTempEl    = document.querySelector('.maxTemp');
const minTempEl    = document.querySelector('.minTemp');
const feelsEl      = document.querySelector('.feels');
const greetingEl   = document.getElementById('greeting');
const networkEl    = document.querySelector('.network');
const delayEl      = document.getElementById('networkID');
const aboutMe      = document.querySelector('.aboutMe');
const hideMe       = document.querySelector('.hideMe');
const cross        = hideMe.querySelector('.cross');
const focusBar     = document.querySelector('.focusBar');
const weatherScene = document.getElementById('weatherScene');
const pin          = document.getElementById('pin');

// ─── GREETING ─────────────────────────────────────────────────────────────────
(function setGreeting() {
  const hour = new Date().getHours();
  const greetings = [
    [0, 0,   'Midnight'],
    [1, 2,   'Early Morning'],
    [3, 11,  'Good Morning'],
    [12, 12, 'Good Afternoon'],
    [13, 16, 'Good Afternoon'],
    [17, 20, 'Good Evening'],
    [21, 23, 'Good Night'],
  ];
  const match = greetings.find(([s, e]) => hour >= s && hour <= e);
  greetingEl.textContent = match ? match[2] : 'Hello';
})();

// ─── ABOUT ME PANEL ───────────────────────────────────────────────────────────
aboutMe.addEventListener('click', () => hideMe.classList.toggle('show'));
cross.addEventListener('click', () => hideMe.classList.remove('show'));

// ─── FOCUS BAR ────────────────────────────────────────────────────────────────
focusBar.addEventListener('click', () => search.focus());

// ─── NETWORK LATENCY ──────────────────────────────────────────────────────────
async function checkLatency() {
  const TESTS = 5;
  let total = 0;
  for (let i = 0; i < TESTS; i++) {
    const t0 = performance.now();
    try { await fetch(LATENCY_URL, { cache: 'no-store' }); } catch (_) {}
    total += performance.now() - t0;
  }
  const avg = Math.round(total / TESTS);
  delayEl.textContent = `${avg}ms`;
  networkEl.style.color =
    avg <= 99  ? 'rgb(21, 211, 88)' :
    avg <= 150 ? 'yellow' : 'red';
}

// ─── WEATHER FETCH (shared) ───────────────────────────────────────────────────
async function fetchWeather(params) {
  const query = new URLSearchParams({ appid: API_KEY, units: 'metric', ...params });
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
async function fetchForecast(params) {
  const query = new URLSearchParams({ appid: API_KEY, units: 'metric', cnt: 8, ...params });
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ─── APPLY WEATHER DATA TO UI ────────────────────────────────────────────────
function applyWeatherData(data) {
  const { name, weather, main, sys, dt } = data;
  const condition = weather[0].main;
  const description = weather[0].description;

  currentCityEl.textContent = name;
  putResultEl.textContent = description.charAt(0).toUpperCase() + description.slice(1);
  tempEl.textContent = `${Math.round(main.temp)}°C`;
  maxTempEl.textContent = `${Math.ceil(main.temp_max)}°C`;
  minTempEl.textContent = `${Math.floor(main.temp_min)}°C`;
  feelsEl.textContent = `${Math.round(main.feels_like)}°C`;

  const isDay = dt >= sys.sunrise && dt < sys.sunset;
  applyTheme(isDay, condition);
  applyWeatherScene(condition, isDay);
}
// ─── HOURLY FORECAST ──────────────────────────────────────────────────────────
function applyForecast(data) {
  hourlyStrip.innerHTML = '';
  const now = Date.now() / 1000;
 
  data.list.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'hour-item' + (i === 0 ? ' now' : '');
 
    const dt = item.dt;
    const label = i === 0 ? 'Now' : formatHour(dt);
    const icon  = weatherEmoji(item.weather[0].main);
    const temp  = Math.round(item.main.temp);
 
    el.innerHTML = `
      <span class="hour-time">${label}</span>
      <span class="hour-icon">${icon}</span>
      <span class="hour-temp">${temp}°</span>
    `;
    hourlyStrip.appendChild(el);
  });
}
 
function formatHour(unix) {
  const d = new Date(unix * 1000);
  const h = d.getHours();
  return `${String(h).padStart(2, '0')}:00`;
}
 
function weatherEmoji(condition) {
  const map = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
    Haze: '🌁', Smoke: '🌫️', Dust: '🌪️', Sand: '🌪️', Tornado: '🌪️',
  };
  return map[condition] || '🌤️';
}

// ─── DAY / NIGHT THEME ────────────────────────────────────────────────────────
function applyTheme(isDay, condition) {
  const body = document.body;
  const container = document.querySelector('.container');
  body.style.transition = '.4s';

  const themes = {
    Rain:         { bg: 'linear-gradient(to bottom, #2c3e50, #4a6073)', color: 'white' },
    Drizzle:      { bg: 'linear-gradient(to bottom, #3d5a6e, #5a7a8a)', color: 'white' },
    Thunderstorm: { bg: 'linear-gradient(to bottom, #1a1a2e, #16213e)', color: 'white' },
    Snow:         { bg: 'linear-gradient(to bottom, #a8c0cc, #e8f4f8)', color: '#222' },
    Mist:         { bg: 'linear-gradient(to bottom, #757f9a, #d7dde8)', color: '#222' },
    Fog:          { bg: 'linear-gradient(to bottom, #757f9a, #d7dde8)', color: '#222' },
    Haze:         { bg: 'linear-gradient(to bottom, #c9a96e, #e8d5a3)', color: '#333' },
    Smoke:        { bg: 'linear-gradient(to bottom, #6e6e6e, #aaaaaa)', color: '#222' },
    Dust:         { bg: 'linear-gradient(to bottom, #c8a96e, #e8c97e)', color: '#333' },
    Sand:         { bg: 'linear-gradient(to bottom, #c8a96e, #e8c97e)', color: '#333' },
    Tornado:      { bg: 'linear-gradient(to bottom, #555, #888)', color: 'white' },
  };

  if (themes[condition]) {
    body.style.background = themes[condition].bg;
    container.style.color = themes[condition].color;
  } else if (isDay) {
    body.style.background = 'linear-gradient(to bottom, #87ceeb, #ffffff)';
    container.style.color = 'black';
  } else {
    body.style.background = 'linear-gradient(to bottom, #0d0d1a, #0a0a2e, #0d1b4b)';
    container.style.color = 'white';
  }
}

// ─── WEATHER SCENE ANIMATIONS ─────────────────────────────────────────────────
function applyWeatherScene(condition, isDay) {
  // Clear old scene
  weatherScene.innerHTML = '';
  weatherScene.className = '';

  const makers = {
    Rain:         makeRain,
    Drizzle:      () => makeRain(true),
    Thunderstorm: makeThunderstorm,
    Snow:         makeSnow,
    Clear:        () => isDay ? makeSunny() : makeStarryNight(),
    Clouds:       makeClouds,
    Mist:         makeMist,
    Fog:          makeMist,
    Haze:         makeMist,
    Smoke:        makeMist,
    Dust:         makeDust,
    Sand:         makeDust,
    Tornado:      makeTornado,
  };

  const fn = makers[condition];
  if (fn) fn();
}

function makeRain(light = false) {
  weatherScene.className = 'scene-rain';
  const count = light ? 40 : 100;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.animationDuration = `${light ? 0.9 + Math.random() * 0.6 : 0.5 + Math.random() * 0.4}s`;
    drop.style.opacity = light ? 0.4 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5;
    drop.style.height = `${light ? 10 + Math.random() * 8 : 14 + Math.random() * 10}px`;
    weatherScene.appendChild(drop);
  }
}

function makeThunderstorm() {
  makeRain();
  weatherScene.className = 'scene-thunder';
  const flash = document.createElement('div');
  flash.className = 'lightning-flash';
  weatherScene.appendChild(flash);

  const bolt = document.createElement('div');
  bolt.className = 'lightning-bolt';
  bolt.style.left = `${30 + Math.random() * 40}%`;
  weatherScene.appendChild(bolt);
}

function makeSnow() {
  weatherScene.className = 'scene-snow';
  for (let i = 0; i < 80; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.width = flake.style.height = `${3 + Math.random() * 6}px`;
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.style.animationDuration = `${3 + Math.random() * 4}s`;
    flake.style.opacity = 0.5 + Math.random() * 0.5;
    weatherScene.appendChild(flake);
  }
}

function makeSunny() {
  weatherScene.className = 'scene-sunny';
  const sun = document.createElement('div');
  sun.className = 'sun';
  weatherScene.appendChild(sun);
  for (let i = 0; i < 8; i++) {
    const ray = document.createElement('div');
    ray.className = 'sun-ray';
    ray.style.transform = `rotate(${i * 45}deg)`;
    sun.appendChild(ray);
  }
}

function makeStarryNight() {
  weatherScene.className = 'scene-night';
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.width = star.style.height = `${1 + Math.random() * 2.5}px`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${2 + Math.random() * 3}s`;
    weatherScene.appendChild(star);
  }
  const moon = document.createElement('div');
  moon.className = 'moon';
  weatherScene.appendChild(moon);
}

function makeClouds() {
  weatherScene.className = 'scene-cloudy';
  const sizes = [
    { w: 160, h: 55, top: '10%', dur: '22s', delay: '0s', opacity: 0.85 },
    { w: 120, h: 40, top: '22%', dur: '30s', delay: '-8s', opacity: 0.7 },
    { w: 200, h: 65, top: '5%',  dur: '18s', delay: '-4s', opacity: 0.9 },
    { w: 90,  h: 30, top: '35%', dur: '35s', delay: '-15s', opacity: 0.6 },
  ];
  sizes.forEach(s => {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.cssText = `width:${s.w}px;height:${s.h}px;top:${s.top};animation-duration:${s.dur};animation-delay:${s.delay};opacity:${s.opacity}`;
    weatherScene.appendChild(cloud);
  });
}

function makeMist() {
  weatherScene.className = 'scene-mist';
  for (let i = 0; i < 5; i++) {
    const layer = document.createElement('div');
    layer.className = 'mist-layer';
    layer.style.top = `${10 + i * 18}%`;
    layer.style.animationDelay = `${i * 1.2}s`;
    layer.style.opacity = 0.15 + i * 0.05;
    weatherScene.appendChild(layer);
  }
}

function makeDust() {
  weatherScene.className = 'scene-dust';
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'dust-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${2 + Math.random() * 4}px`;
    p.style.animationDelay = `${Math.random() * 4}s`;
    p.style.animationDuration = `${3 + Math.random() * 4}s`;
    weatherScene.appendChild(p);
  }
}

function makeTornado() {
  weatherScene.className = 'scene-tornado';
  const t = document.createElement('div');
  t.className = 'tornado';
  weatherScene.appendChild(t);
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div');
    d.className = 'tornado-debris';
    d.style.animationDelay = `${Math.random() * 2}s`;
    d.style.animationDuration = `${1 + Math.random() * 1.5}s`;
    weatherScene.appendChild(d);
  }
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
async function searchData() {
  const city = searchBar.value.trim();
  if (!city) return;
  currentCityEl.textContent = 'Searching…';
  try {
    const [weather, forecast] = await Promise.all([
      fetchWeather({ q: city }),
      fetchForecast({ q: city }),
    ]);
    applyWeatherData(weather);
    applyForecast(forecast);
    checkLatency();
  } catch (err) {
    currentCityEl.textContent = 'City not found';
  }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchData();
});

// ─── GEOLOCATION ──────────────────────────────────────────────────────────────
function getLocationAndWeather() {
  if (!('geolocation' in navigator)) {
    currentCityEl.textContent = 'Geolocation unavailable';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const p = { lat: coords.latitude, lon: coords.longitude };
      try {
        const [weather, forecast] = await Promise.all([
          fetchWeather(p),
          fetchForecast(p),
        ]);
        applyWeatherData(weather);
        applyForecast(forecast);
        checkLatency();
      } catch {
        currentCityEl.textContent = 'Could not load weather';
      }
    },
    () => { currentCityEl.textContent = 'Location denied'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
// ─── OFFLINE HANDLER ──────────────────────────────────────────────────────────
window.addEventListener('offline', () => {
  currentCityEl.textContent = "You're offline";
  putResultEl.textContent = "Offline"
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  getLocationAndWeather();
  checkLatency();
  setTimeout(() => search.focus(), 2500);
});
//----------------------------------------------------------------------\
pin.addEventListener('click', ()=>{
  pin.style.pointerEvents = "none";
  pin.style.userSelect = "none";
  pin.style.opacity = ".3"
  pin.classList.add('spin');
  getLocationAndWeather();
  search.value = "";
  setTimeout(()=>{
    pin.classList.remove('spin');
    pin.style.pointerEvents = "auto";
    pin.style.userSelect = "auto";
    pin.style.opacity = "1"
  },3500);
})
//------------------Input---------------------------------------------
search.addEventListener('click', ()=>{
  if(search.value.length >= 1){
    search.select();
  }
})
focusBar.addEventListener('click', ()=>{
  if(search.value.length >= 1){
    search.select();
  }
})
