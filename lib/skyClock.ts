/**
 * The sky clock's arithmetic: where the sun (and tonight's moon) stand at a given moment,
 * and how the sky is lit, from the date and the clock alone (offline, no location). The sun
 * is worked out for the Gulf's latitude, as the moon's phase is seen from the Gulf; local
 * solar noon is taken as noon on the phone's clock (corrected for the equation of time and
 * daylight saving), which is within half an hour anywhere its time zone is sensible.
 */
import { SYNODIC_DAYS, moonPhase } from './moonPhase.ts';

const LAT = 25;
const RAD = Math.PI / 180;
const HOUR_MS = 3_600_000;

export type PartOfDay = 'dawn' | 'day' | 'dusk' | 'night';

function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000);
}

/** The sun's declination, degrees. */
function declination(d: Date): number {
  return 23.44 * Math.sin((2 * Math.PI * (284 + dayOfYear(d))) / 365);
}

/** The equation of time, minutes: how far the sundial runs ahead of the clock. */
function equationOfTime(d: Date): number {
  const b = (2 * Math.PI * (dayOfYear(d) - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/** Hours the clock is set forward for daylight saving on this date (0 where there's none). */
function daylightSaving(d: Date): number {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  return (Math.max(jan, jul) - d.getTimezoneOffset()) / 60;
}

/** Local solar noon on this date, in clock hours. */
function solarNoon(d: Date): number {
  return 12 - equationOfTime(d) / 60 + daylightSaving(d);
}

const clockHours = (d: Date) => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

/** The sun's hour angle, degrees: negative in the morning, 0 at noon, positive after. */
function hourAngle(d: Date): number {
  return 15 * (clockHours(d) - solarNoon(d));
}

/** Altitude above the horizon, degrees, for a body at declination `dec` and hour angle `h`. */
function altitude(dec: number, h: number): number {
  return Math.asin(Math.sin(LAT * RAD) * Math.sin(dec * RAD) + Math.cos(LAT * RAD) * Math.cos(dec * RAD) * Math.cos(h * RAD)) / RAD;
}

/** The hour angle at which the sun stands at `alt` degrees on this date (NaN if it never does). */
function hourAngleAt(d: Date, alt: number): number {
  const dec = declination(d);
  const cosH = (Math.sin(alt * RAD) - Math.sin(LAT * RAD) * Math.sin(dec * RAD)) / (Math.cos(LAT * RAD) * Math.cos(dec * RAD));
  return Math.acos(Math.max(-1, Math.min(1, cosH))) / RAD;
}

/** A clock time on `d`'s date from hours after midnight. */
function at(d: Date, hours: number): Date {
  return new Date(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + hours * HOUR_MS);
}

/** Sunrise and sunset on this date (the sun's upper edge on the horizon, with refraction). */
export function sunTimes(d: Date): { sunrise: Date; sunset: Date } {
  const noon = solarNoon(d), h = hourAngleAt(d, -0.833) / 15;
  return { sunrise: at(d, noon - h), sunset: at(d, noon + h) };
}

/** Where the day begins for the sky clock: first light (the sun 12° below), today or, before it, yesterday. */
export function firstLight(now: Date): Date {
  const light = (d: Date) => at(d, solarNoon(d) - hourAngleAt(d, -12) / 15);
  const today = light(now);
  return today.getTime() <= now.getTime() ? today : light(new Date(now.getTime() - 24 * HOUR_MS));
}

export interface SkyState {
  part: PartOfDay;
  /** Opacity of each sky over night's (twilight is dawn's before noon, dusk's after). */
  dawn: number;
  dusk: number;
  day: number;
  /** How dark it is, 0–1: the stars' light. */
  night: number;
  /** The sun and the moon, as fractions of the screen (x across from east, y down); below the hills when down. */
  sun: { x: number; y: number };
  moon: { x: number; y: number };
  /** 0–1: each fades as it goes down behind the hills; the moon fades by day too. */
  sunLight: number;
  moonLight: number;
}

/** The hills' top edge, as a fraction of the screen's height: the horizon. */
export const HORIZON = 0.68;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** A body's place on the screen from its hour angle and altitude: across the sky east to west, up from the hills. */
function place(h: number, alt: number) {
  const wrapped = ((((h + 180) % 360) + 360) % 360) - 180;
  return { x: 0.5 + wrapped / 220, y: HORIZON - (alt / 90) * 0.52 };
}

export function skyAt(d: Date): SkyState {
  const h = hourAngle(d);
  const alt = altitude(declination(d), h);
  const night = clamp((-6 - alt) / 8);
  const day = clamp(alt / 8);
  const twilight = 1 - night;
  const morning = ((((h + 180) % 360) + 360) % 360) - 180 < 0;
  // The moon runs behind the sun by its age: new with it, full opposite.
  const mh = h - (moonPhase(d).age / SYNODIC_DAYS) * 360;
  const malt = altitude(0, mh);
  const part: PartOfDay = day >= 0.5 ? 'day' : night >= 0.5 ? 'night' : morning ? 'dawn' : 'dusk';
  return {
    part,
    dawn: morning ? twilight : 0,
    dusk: morning ? 0 : twilight,
    day,
    night,
    sun: place(h, alt),
    moon: place(mh, malt),
    sunLight: clamp((alt + 3) / 4),
    moonLight: clamp((malt + 3) / 4) * (1 - 0.7 * day),
  };
}

/** The sky sampled at `n` + 1 evenly spaced moments from `from` to `to`: tables for a time-lapse. */
export function skyTimeline(from: Date, to: Date, n = 96): { at: number[]; states: SkyState[] } {
  const at: number[] = [], states: SkyState[] = [];
  for (let i = 0; i <= n; i++) {
    at.push(i / n);
    states.push(skyAt(new Date(from.getTime() + ((to.getTime() - from.getTime()) * i) / n)));
  }
  return { at, states };
}
