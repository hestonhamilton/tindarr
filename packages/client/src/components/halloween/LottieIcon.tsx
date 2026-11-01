import { useEffect, useRef } from 'react';

type Props = { name: 'bat' | 'jack-o-lantern'; loop?: boolean; className?: string };

export default function LottieIcon({ name, loop = true, className }: Props) {
  const container = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!container.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    let animation: import('lottie-web').AnimationItem | undefined;
    void import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (disposed || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop,
        autoplay: true,
        path: `/halloween/${name}.json`,
      });
    });
    return () => { disposed = true; animation?.destroy(); };
  }, [name, loop]);

  return <span className={`lottieIcon ${className ?? ''}`} ref={container} aria-hidden='true' />;
}
