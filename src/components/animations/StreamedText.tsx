import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StreamedTextProps {
  text: string;
  className?: string;
  delay?: number;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
}

const StreamedText: React.FC<StreamedTextProps> = ({ text, className, delay = 0, shouldAnimate = true, onAnimationComplete }) => {
  const shouldReduceMotion = useReducedMotion();

  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => {
      const word = words[i];
      const delay = i * 0.02 + (word.length * 0.003);
      return {
        opacity: 1,
        transition: {
          delay,
          duration: 0.15,
          ease: "easeOut",
        },
      };
    },
  };
  
  const reducedMotionVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  }

  return (
    <motion.p
      className={`${className} max-w-text`}
      variants={shouldReduceMotion ? reducedMotionVariants : containerVariants}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      onAnimationComplete={onAnimationComplete}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={shouldReduceMotion ? reducedMotionVariants : wordVariants}
          custom={i}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
          aria-hidden="true"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
};

export default StreamedText;
