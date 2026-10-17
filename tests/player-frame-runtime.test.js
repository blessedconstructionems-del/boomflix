const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function readConfig() {
  const context = {};
  const source = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  vm.runInNewContext(`${source}; this.__CONFIG = CONFIG;`, context);
  return context.__CONFIG;
}

function readPlayerScript() {
  const html = fs.readFileSync(path.join(root, 'player-frame.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const inline = scripts.find(script => script.includes('AD SHIELD'));
  assert(inline, 'player-frame inline script was not found');
  const start = inline.indexOf('var params = new URLSearchParams');
  assert(start >= 0, 'player-frame runtime entrypoint was not found');
  return inline.slice(start);
}

const CONFIG = readConfig();
const PLAYER_SCRIPT = readPlayerScript();
const LAUNCHER_SCRIPT = fs.readFileSync(path.join(root, 'js/player.js'), 'utf8');

function element(id) {
  const classes = new Set();
  return {
    id,
    innerHTML: '',
    textContent: '',
    children: [],
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    replaceChildren(...children) { this.children = children; },
  };
}

function runPlayer(query, preferredSource) {
  const elements = {
    player: element('player'),
    shield: element('shield'),
    servers: element('servers'),
    sourceStatus: element('sourceStatus'),
  };
  const storage = new Map();
  if (preferredSource) storage.set('emilyflixPreferredSource', preferredSource);
  const timers = new Map();
  let timerId = 0;
  const location = {
    search: query,
    pathname: '/boomflix/player-frame.html',
    href: `https://example.test/boomflix/player-frame.html${query}`,
  };

  const document = {
    getElementById(id) { return elements[id] || null; },
    createElement(tag) {
      assert.equal(tag, 'iframe');
      const listeners = {};
      return {
        id: '',
        src: '',
        attributes: {},
        listeners,
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, callback) { listeners[name] = callback; },
      };
    },
  };
  const window = {
    location,
    addEventListener() {},
  };
  const context = {
    CONFIG,
    URLSearchParams,
    document,
    window,
    navigator: { onLine: true },
    history: {
      replaceState(_state, _title, nextUrl) {
        location.href = `https://example.test${nextUrl}`;
        location.search = nextUrl.includes('?') ? nextUrl.slice(nextUrl.indexOf('?')) : '';
      },
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, value); },
    },
    setTimeout(callback) {
      timerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
    safeHref: location.href,
    allowNavigation: false,
    console,
  };
  vm.createContext(context);
  vm.runInContext(PLAYER_SCRIPT, context);
  return { context, elements, location, storage, timers };
}

function runLauncher(type, preferredSource) {
  const wrapper = element('playerWrapper');
  const context = {
    CONFIG,
    localStorage: {
      getItem(key) { return key === 'emilyflixPreferredSource' ? preferredSource : null; },
    },
    document: {
      getElementById(id) { return id === 'playerWrapper' ? wrapper : null; },
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(`${LAUNCHER_SCRIPT}; this.__PLAYER = Player;`, context);
  const player = context.__PLAYER;
  player.movieId = type === 'tv' ? 4604 : 1957;
  player.mediaType = type;
  player.season = 1;
  player.episode = 11;
  player.loadFallbackEmbed();
  return wrapper.innerHTML;
}

{
  const run = runPlayer('?id=1957&source=vidlink');
  assert.equal(run.context.currentServerIdx, 0);
  assert.equal(run.elements.player.children[0].src, 'https://vidlink.pro/movie/1957');
  assert.equal((run.elements.servers.innerHTML.match(/class="srv-btn/g) || []).length, 5);
  assert.match(run.elements.servers.innerHTML, /Next Source/);
}

{
  const run = runPlayer('?id=4604&type=tv&season=1&episode=11&source=autoembed');
  assert.equal(run.context.currentServerIdx, 1);
  assert.equal(run.elements.player.children[0].src, 'https://autoembed.co/tv/tmdb/4604-1-11');
}

{
  const run = runPlayer('?id=1957&s=99', 'autoembed');
  assert.equal(run.context.currentServerIdx, 1, 'invalid legacy indexes should fall back safely');
}

{
  const missingLegacyParam = runPlayer('?id=1957', 'autoembed');
  assert.equal(missingLegacyParam.context.currentServerIdx, 1, 'missing s should preserve the saved source');

  const emptyLegacyParam = runPlayer('?id=1957&s=', 'autoembed');
  assert.equal(emptyLegacyParam.context.currentServerIdx, 1, 'empty s should preserve the saved source');
}

{
  const run = runPlayer('?id=not-a-number&source=vidlink');
  assert.equal(run.elements.player.children.length, 0);
  assert.match(run.elements.player.innerHTML, /link is invalid/);
}

{
  const run = runPlayer('?id=1957&source=vidlink');
  assert.equal(run.storage.get('emilyflixPreferredSource'), 'vidlink', 'explicit source links should be remembered');
  const firstFrame = run.elements.player.children[0];
  run.context.loadNextServer(true);
  const secondFrame = run.elements.player.children[0];
  assert.equal(run.context.currentServerIdx, 1);
  assert.equal(secondFrame.src, 'https://autoembed.co/movie/tmdb/1957');
  assert.equal(run.storage.get('emilyflixPreferredSource'), 'autoembed');
  assert.match(run.location.href, /source=autoembed/);

  firstFrame.listeners.load();
  assert.match(run.elements.sourceStatus.textContent, /Loading Source 2/);
  secondFrame.listeners.load();
  assert.match(run.elements.sourceStatus.textContent, /Source 2 loaded/);

  run.context.navigator.onLine = false;
  run.context.loadNextServer(true);
  assert.equal(run.context.currentServerIdx, 1);
  assert.match(run.elements.sourceStatus.textContent, /No internet connection/);
}

{
  const movieLauncher = runLauncher('movie', 'autoembed');
  assert.match(movieLauncher, /source=autoembed/);
  assert.match(movieLauncher, /player-frame\.html\?v=4/);

  const tvLauncher = runLauncher('tv', 'vidsrcme');
  assert.match(tvLauncher, /source=vidsrcme/);
  assert.match(tvLauncher, /type=tv&season=1&episode=11/);
}

console.log('player-frame runtime tests passed');
