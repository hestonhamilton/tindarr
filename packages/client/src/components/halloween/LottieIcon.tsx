import { useEffect, useRef } from 'react';

type Name = 'bat' | 'jack-o-lantern';
type Props = { name: Name; loop?: boolean; className?: string };

// Player and animation files load once per page (Halloween rooms only), so a pumpkin popping in
// on a like starts in step with its glow instead of after a fetch
let player: Promise<typeof import('lottie-web/build/player/lottie_light').default> | undefined;
const animations = new Map<Name, Promise<unknown>>();
const load = (name: Name) => {
  player ??= import('lottie-web/build/player/lottie_light').then((module) => module.default);
  if (!animations.has(name)) animations.set(name, fetch(`/halloween/${name}.json`).then((response) => response.json()));
  return Promise.all([player, animations.get(name)!]);
};
export const preloadHalloweenLottie = () => { void load('bat'); void load('jack-o-lantern'); };

export default function LottieIcon({ name, loop = true, className }: Props) {
  const container = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!container.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    let animation: import('lottie-web').AnimationItem | undefined;
    void load(name).then(([lottie, data]) => {
      if (disposed || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop,
        autoplay: true,
        animationData: structuredClone(data), // lottie mutates the data it's given
      });
      // Whole frames only: the Noto bat is three back-to-back layers (0-19.84, 20-39.84, ...)
      // and lottie's default subframe rendering lands in those gaps, blanking every bat at once
      animation.setSubframe(false);
    });
    return () => { disposed = true; animation?.destroy(); };
  }, [name, loop]);

  return <span className={`lottieIcon ${className ?? ''}`} ref={container} aria-hidden='true' />;
}
