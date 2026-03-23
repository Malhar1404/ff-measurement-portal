import { ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const useClick = (options: {
  onSelected?: (
    e: MouseEvent | ThreeEvent<PointerEvent>,
  ) => void | Promise<void>;
  onMoved?: (distance: number) => void | Promise<void>;
  onHoverStateChanged?: (value: boolean) => void | Promise<void>;
  onClick?: (event: MouseEvent | ThreeEvent<PointerEvent>) => void;
  isSelectable?: boolean;
  distanceToAllowClick?: number;
}) => {
  const {
    onSelected,
    isSelectable,
    distanceToAllowClick = 22,
    onHoverStateChanged,
    onMoved,
    onClick,
  } = options;
  const allowClick = useRef(false);
  const hovered = useRef(false);
  const clickStartPoint = useRef(new THREE.Vector2());
  const moveStartPoint = useRef(new THREE.Vector2());

  const resetAllowClick = () => {
    allowClick.current = false;
    clickStartPoint.current = new THREE.Vector2();
  };

  const onPointerMove = (e: MouseEvent | ThreeEvent<PointerEvent>) => {
    if (isSelectable) {
      e.stopPropagation();
      if (onMoved) {
        const moveDist = moveStartPoint.current.distanceTo(
          new THREE.Vector2(e.pageX, e.pageY),
        );
        onMoved(moveDist);
      }
      if (allowClick && clickStartPoint) {
        const dist = clickStartPoint.current.distanceTo(
          new THREE.Vector2(e.pageX, e.pageY),
        );
        if (dist > distanceToAllowClick) {
          resetAllowClick();
        }
      }
    }
  };

  const onPointerDown = (e: MouseEvent | ThreeEvent<PointerEvent>) => {
    if (isSelectable) {
      e.stopPropagation();
      clickStartPoint.current = new THREE.Vector2(e.pageX, e.pageY);
      moveStartPoint.current = new THREE.Vector2(e.pageX, e.pageY);
      allowClick.current = true;
      if (onClick) onClick(e);
    }
  };

  const onPointerUp = (e: MouseEvent | ThreeEvent<PointerEvent>) => {
    if (isSelectable) {
      e.stopPropagation();
      if (allowClick.current) {
        resetAllowClick();
        onSelected?.(e);
      }
    }
  };

  const onPointerOver = (e: MouseEvent | ThreeEvent<PointerEvent>) => {
    if (isSelectable) {
      e.stopPropagation();
      onHoverStateChanged?.(true);
      hovered.current = true;
    }
  };

  const onPointerOut = () => {
    if (isSelectable) {
      resetAllowClick();
      onHoverStateChanged?.(false);
      hovered.current = false;
    }
  };

  return {
    listeners: {
      onPointerDown,
      onPointerMove,
      onPointerOut,
      onPointerOver,
      onPointerUp,
    },
    state: {
      hovered,
    },
  };
};
