/**
 * Design System Animation Tokens
 * 
 * Centralized animation configuration for consistent motion design.
 * Includes durations, easing functions, and common animation patterns.
 */

// Base animation values
const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
};

const easing = {
  // Standard easing curves
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom cubic-bezier curves
  default: 'cubic-bezier(0.16, 1, 0.3, 1)',        // Smooth default
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',           // Sharp transition
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // Smooth transition
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring effect
};

export const animations = {
  duration,
  easing,

  
  // Common animation patterns
  patterns: {
    // Fade animations
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    
    // Scale animations
    scaleIn: {
      from: { 
        opacity: '0',
        transform: 'scale(0.95)',
      },
      to: { 
        opacity: '1',
        transform: 'scale(1)',
      },
    },
    scaleOut: {
      from: { 
        opacity: '1',
        transform: 'scale(1)',
      },
      to: { 
        opacity: '0',
        transform: 'scale(0.95)',
      },
    },
    
    // Slide animations
    slideInUp: {
      from: {
        opacity: '0',
        transform: 'translateY(20px)',
      },
      to: {
        opacity: '1',
        transform: 'translateY(0)',
      },
    },
    slideInDown: {
      from: {
        opacity: '0',
        transform: 'translateY(-20px)',
      },
      to: {
        opacity: '1',
        transform: 'translateY(0)',
      },
    },
    slideInLeft: {
      from: {
        opacity: '0',
        transform: 'translateX(-20px)',
      },
      to: {
        opacity: '1',
        transform: 'translateX(0)',
      },
    },
    slideInRight: {
      from: {
        opacity: '0',
        transform: 'translateX(20px)',
      },
      to: {
        opacity: '1',
        transform: 'translateX(0)',
      },
    },
    
    // Rotation animations
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    
    // Pulse animation
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    
    // Bounce animation
    bounce: {
      '0%, 20%, 53%, 80%, 100%': {
        transform: 'translate3d(0, 0, 0)',
      },
      '40%, 43%': {
        transform: 'translate3d(0, -30px, 0)',
      },
      '70%': {
        transform: 'translate3d(0, -15px, 0)',
      },
      '90%': {
        transform: 'translate3d(0, -4px, 0)',
      },
    },
  },
  
  // Component-specific animations
  components: {
    // Button animations
    button: {
      hover: {
        duration: duration.fast,
        easing: easing.default,
        transform: 'scale(1.02)',
      },
      active: {
        duration: duration.fast,
        easing: easing.default,
        transform: 'scale(0.98)',
      },
      focus: {
        duration: duration.normal,
        easing: easing.default,
      },
    },
    
    // Modal animations
    modal: {
      overlay: {
        enter: {
          duration: duration.normal,
          easing: easing.easeOut,
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        exit: {
          duration: duration.fast,
          easing: easing.easeIn,
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
      },
      content: {
        enter: {
          duration: duration.slow,
          easing: easing.default,
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        exit: {
          duration: duration.normal,
          easing: easing.easeIn,
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
      },
    },
    
    // Card animations
    card: {
      hover: {
        duration: duration.normal,
        easing: easing.default,
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
    },
    
    // Input animations
    input: {
      focus: {
        duration: duration.normal,
        easing: easing.default,
      },
      error: {
        duration: duration.fast,
        easing: easing.bounce,
      },
    },
    
    // Loading animations
    loading: {
      spinner: {
        duration: duration.slowest,
        easing: easing.linear,
        iterationCount: 'infinite',
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      pulse: {
        duration: duration.slower,
        easing: easing.easeInOut,
        iterationCount: 'infinite',
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
    },
  },
  
  // Transition presets
  transitions: {
    // All properties
    all: {
      fast: `all ${duration.fast} ${easing.default}`,
      normal: `all ${duration.normal} ${easing.default}`,
      slow: `all ${duration.slow} ${easing.default}`,
    },
    
    // Specific properties
    opacity: {
      fast: `opacity ${duration.fast} ${easing.default}`,
      normal: `opacity ${duration.normal} ${easing.default}`,
      slow: `opacity ${duration.slow} ${easing.default}`,
    },
    transform: {
      fast: `transform ${duration.fast} ${easing.default}`,
      normal: `transform ${duration.normal} ${easing.default}`,
      slow: `transform ${duration.slow} ${easing.default}`,
    },
    colors: {
      fast: `background-color ${duration.fast} ${easing.default}, border-color ${duration.fast} ${easing.default}, color ${duration.fast} ${easing.default}`,
      normal: `background-color ${duration.normal} ${easing.default}, border-color ${duration.normal} ${easing.default}, color ${duration.normal} ${easing.default}`,
      slow: `background-color ${duration.slow} ${easing.default}, border-color ${duration.slow} ${easing.default}, color ${duration.slow} ${easing.default}`,
    },
  },
} as const;

// Type definitions
export type AnimationTokens = typeof animations;
export type AnimationDuration = keyof typeof animations.duration;
export type AnimationEasing = keyof typeof animations.easing;
export type AnimationPattern = keyof typeof animations.patterns;
export type ComponentAnimation = keyof typeof animations.components;

// Helper functions
export const getDuration = (duration: AnimationDuration): string => {
  return animations.duration[duration];
};

export const getEasing = (easing: AnimationEasing): string => {
  return animations.easing[easing];
};

export const getTransition = (
  property: keyof typeof animations.transitions,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): string => {
  return animations.transitions[property][speed];
};

// CSS custom properties mapping
export const animationVariables = {
  // Durations
  '--animation-duration-instant': animations.duration.instant,
  '--animation-duration-fast': animations.duration.fast,
  '--animation-duration-normal': animations.duration.normal,
  '--animation-duration-slow': animations.duration.slow,
  '--animation-duration-slower': animations.duration.slower,
  '--animation-duration-slowest': animations.duration.slowest,
  
  // Easing
  '--animation-easing-linear': animations.easing.linear,
  '--animation-easing-ease': animations.easing.ease,
  '--animation-easing-ease-in': animations.easing.easeIn,
  '--animation-easing-ease-out': animations.easing.easeOut,
  '--animation-easing-ease-in-out': animations.easing.easeInOut,
  '--animation-easing-default': animations.easing.default,
  '--animation-easing-bounce': animations.easing.bounce,
  '--animation-easing-sharp': animations.easing.sharp,
  '--animation-easing-smooth': animations.easing.smooth,
  '--animation-easing-spring': animations.easing.spring,
  
  // Transitions
  '--transition-all-fast': animations.transitions.all.fast,
  '--transition-all-normal': animations.transitions.all.normal,
  '--transition-all-slow': animations.transitions.all.slow,
  '--transition-opacity-fast': animations.transitions.opacity.fast,
  '--transition-opacity-normal': animations.transitions.opacity.normal,
  '--transition-opacity-slow': animations.transitions.opacity.slow,
  '--transition-transform-fast': animations.transitions.transform.fast,
  '--transition-transform-normal': animations.transitions.transform.normal,
  '--transition-transform-slow': animations.transitions.transform.slow,
  '--transition-colors-fast': animations.transitions.colors.fast,
  '--transition-colors-normal': animations.transitions.colors.normal,
  '--transition-colors-slow': animations.transitions.colors.slow,
} as const;