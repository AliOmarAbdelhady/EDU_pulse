"use client";

import { motion } from "framer-motion";

const sideOffsets = {
  bottom: { x: 0, y: -8 },
  top: { x: 0, y: 8 },
  left: { x: 8, y: 0 },
  right: { x: -8, y: 0 },
  "inline-start": { x: 8, y: 0 },
  "inline-end": { x: -8, y: 0 },
};

const popupSpringOpen = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

const popupSpringClose = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

const popupItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  closed: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1 },
  },
};

function buildPopupVariants(side) {
  return {
    open: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        ...popupSpringOpen,
        staggerChildren: 0.04,
        delayChildren: 0.06,
      },
    },
    closed: {
      opacity: 0,
      ...(sideOffsets[side] || { x: 0, y: -8 }),
      scale: 0.95,
      transition: {
        ...popupSpringClose,
        staggerChildren: 0.02,
        staggerDirection: -1,
      },
    },
  };
}

export { motion, sideOffsets, popupSpringOpen, popupSpringClose, popupItemVariants, buildPopupVariants };
