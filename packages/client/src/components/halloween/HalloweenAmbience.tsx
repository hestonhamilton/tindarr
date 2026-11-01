import React from 'react';

const BATS = [
  { top: 5, size: 19, duration: 19, delay: -4, opacity: .7 },
  { top: 11, size: 24, duration: 25, delay: -19, opacity: .6 },
  { top: 17, size: 15, duration: 14, delay: -9, opacity: .8 },
  { top: 22, size: 21, duration: 28, delay: -14, opacity: .55 },
  { top: 28, size: 17, duration: 22, delay: -3, opacity: .7 },
  { top: 33, size: 23, duration: 17, delay: -12, opacity: .65 },
  { top: 38, size: 16, duration: 24, delay: -20, opacity: .75 },
];

export const BatIcon: React.FC = () => <svg viewBox='0 0 40 20' aria-hidden='true'><path d='M20 5c-2-4-4-3-5 0C10 2 6 2 1 4c2 2 3 4 2 7 5-1 8 1 11 5l6-3 6 3c3-4 6-6 11-5-1-3 0-5 2-7-5-2-9-2-14 1-1-3-3-4-5 0Z' fill='currentColor'/></svg>;

const HalloweenAmbience: React.FC = () => (
  <div className='halloweenAmbience' data-testid='halloween-ambience' aria-hidden='true'>
    <svg className='batSymbols' aria-hidden='true'><symbol id='halloween-bat' viewBox='0 0 40 20'><path d='M20 5c-2-4-4-3-5 0C10 2 6 2 1 4c2 2 3 4 2 7 5-1 8 1 11 5l6-3 6 3c3-4 6-6 11-5-1-3 0-5 2-7-5-2-9-2-14 1-1-3-3-4-5 0Z' fill='currentColor'/></symbol></svg>
    {BATS.map((bat, i) => <span className='ambientBat' key={i} style={{ top: `${bat.top}%`, width: bat.size, opacity: bat.opacity, animationDuration: `${bat.duration}s`, animationDelay: `${bat.delay}s` }}><svg viewBox='0 0 40 20'><use href='#halloween-bat' /></svg></span>)}
    <span className='fogBand fogOne' /><span className='fogBand fogTwo' />
  </div>
);

export default HalloweenAmbience;
