import React from 'react';
import LottieIcon from './LottieIcon';

const BATS = [
  { top: 4, size: 48, duration: 19, delay: -4 },
  { top: 10, size: 60, duration: 25, delay: -19 },
  { top: 17, size: 38, duration: 14, delay: -9 },
  { top: 25, size: 54, duration: 26, delay: -14 },
  { top: 33, size: 44, duration: 22, delay: -3 },
];

const HalloweenAmbience: React.FC = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return <div className='halloweenAmbience' data-testid='halloween-ambience' aria-hidden='true'>
    {BATS.map((bat, i) => <span className='ambientBat' key={i} style={{ top: `${bat.top}%`, width: bat.size, animationDuration: `${bat.duration}s`, animationDelay: `${bat.delay}s` }}><LottieIcon name='bat' /></span>)}
    <span className='fogBand fogOne' /><span className='fogBand fogTwo' />
  </div>;
};

export default HalloweenAmbience;
