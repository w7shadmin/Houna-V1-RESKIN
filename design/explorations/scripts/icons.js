// Stroke icons for the exploration boards (24px grid, drawn inline so they take the text colour).
const P = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"></path>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"></path>',
  close: '<path d="M6 6l12 12M18 6L6 18"></path>',
  back: '<path d="M15 5l-7 7 7 7"></path>',
  backLong: '<path d="M20 12H5M11 6l-6 6 6 6"></path>',
  next: '<path d="M9 5l7 7-7 7"></path>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"></path><path d="M10 21h4"></path>',
  timer: '<circle cx="12" cy="13" r="7.5"></circle><path d="M12 9.5V13l2.5 1.8M10 3h4"></path>',
  sound: '<path d="M5 9.5h3.5L13 6v12l-4.5-3.5H5z"></path><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"></path>',
  chime: '<path d="M12 4v2M7 9a5 5 0 0 1 10 0v4l2 3H5l2-3z"></path><path d="M10.5 19.5a1.8 1.8 0 0 0 3 0"></path>',
  moon: '<path d="M10.38 3.66A8.5 8.5 0 1 0 20.01 14.84A7.4 7.4 0 0 1 10.38 3.66z"></path>',
  sun: '<circle cx="12" cy="12" r="4.4"></circle><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6"></path>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M13.5 6.5l4 4"></path>',
  globe: '<circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"></path>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"></path>',
  screen: '<rect x="7" y="3.5" width="10" height="17" rx="2.5"></rect><path d="M11 17.5h2"></path>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"></path><path d="M5 19l7-7"></path>',
  replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"></path><path d="M4.5 4.5v3.5H8"></path>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
};
/** An inline stroke icon; `fill` icons (play) draw their own fill. */
const icon = (name, size = 22, sw = 1.6, color = 'currentColor') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display: block; flex-shrink: 0">${P[name]}</svg>`;
module.exports = { icon };
