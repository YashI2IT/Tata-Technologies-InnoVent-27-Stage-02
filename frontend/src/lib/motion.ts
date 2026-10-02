import { Variants, Transition } from "framer-motion";

// Design Philosophy: Precise, Calm, Responsive, Technical, Controlled, Premium

// Central Motion Tokens
export const TRANSITION_FAST: Transition = { duration: 0.15, ease: [0.22, 1, 0.36, 1] };
export const TRANSITION_STANDARD: Transition = { duration: 0.20, ease: [0.22, 1, 0.36, 1] };
export const TRANSITION_MEDIUM: Transition = { duration: 0.30, ease: [0.22, 1, 0.36, 1] };
export const TRANSITION_EMPHASIS: Transition = { duration: 0.50, ease: [0.22, 1, 0.36, 1] };

// Global Page Transition (opacity 0->1, Y 8px->0)
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: TRANSITION_STANDARD
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: TRANSITION_FAST
  }
};

// Staggered Container (for cards, lists)
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms stagger
      delayChildren: 0.05
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_STANDARD
  }
};

export const staggerItemFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: TRANSITION_STANDARD
  }
};

// Specific component transitions
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: TRANSITION_STANDARD },
  exit: { opacity: 0, scale: 0.98, transition: TRANSITION_FAST }
};

export const slideDownPop: Variants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: TRANSITION_STANDARD },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: TRANSITION_FAST }
};

export const buttonTap = {
  scale: 0.98
};

export const iconButtonTap = {
  scale: 0.97
};
