import React, { Suspense, useEffect, useState } from 'react';
import {
  DATA_LOADING_ANIMATION,
  EMPTY_LIST_ANIMATION,
  SUCCESS_EXPORT_ANIMATION,
} from './animations';
import { RefreshCw, Search, CheckCircle2 } from '../Icon';

const LazyDotLottieReact = React.lazy(async () => {
  const mod = await import('@lottiefiles/dotlottie-react');
  return { default: mod.DotLottieReact };
});

export type LottieStateType = 'data-loading' | 'empty-list' | 'success-export';

interface LottieStateAnimationProps {
  type: LottieStateType;
  size?: number;
  className?: string;
  altText: string;
}

export const LottieStateAnimation: React.FC<LottieStateAnimationProps> = ({
  type,
  size = 110,
  className = '',
  altText,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const getAnimationData = () => {
    switch (type) {
      case 'data-loading':
        return DATA_LOADING_ANIMATION;
      case 'empty-list':
        return EMPTY_LIST_ANIMATION;
      case 'success-export':
        return SUCCESS_EXPORT_ANIMATION;
      default:
        return DATA_LOADING_ANIMATION;
    }
  };

  const getStaticFallbackIcon = () => {
    switch (type) {
      case 'data-loading':
        return <RefreshCw size={size * 0.4} className="text-[#6A0DAD] opacity-80" />;
      case 'empty-list':
        return <Search size={size * 0.4} className="text-[#2D0652] opacity-60" />;
      case 'success-export':
        return <CheckCircle2 size={size * 0.4} className="text-[#6A0DAD]" />;
    }
  };

  // Se o usuário prefere movimento reduzido, exibe estado estático sem animação
  if (prefersReducedMotion) {
    return (
      <div
        role="img"
        aria-label={altText}
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {getStaticFallbackIcon()}
        <span className="sr-only">{altText}</span>
      </div>
    );
  }

  const animData = getAnimationData();

  return (
    <div
      role="img"
      aria-label={altText}
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            {getStaticFallbackIcon()}
          </div>
        }
      >
        <LazyDotLottieReact
          data={animData}
          loop={type !== 'success-export'}
          autoplay={true}
          style={{ width: size, height: size }}
        />
      </Suspense>
      <span className="sr-only">{altText}</span>
    </div>
  );
};
