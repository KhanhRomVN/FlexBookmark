import React, { useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";

interface GapDropZoneProps {
  id: string;
  index: number;
  onHover: (position: number) => void;
  position: "left" | "right";
}

const GapDropZone: React.FC<GapDropZoneProps> = ({
  id,
  index,
  onHover,
  position,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "gap",
      index,
      position,
    },
  });

  useEffect(() => {
    if (isOver) {
      onHover(index);
    }
  }, [isOver, onHover, index]);

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-y-0 z-20 ${
        position === "left" ? "left-0 w-8" : "right-0 w-8"
      } transition-all duration-200 ${
        isOver
          ? "bg-blue-500/20 border-2 border-blue-500"
          : "hover:bg-blue-500/10"
      }`}
    >
      {isOver && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-1 h-16 bg-blue-500 rounded-full ${
            position === "left" ? "right-1" : "left-1"
          }`}
        />
      )}
    </div>
  );
};

export default GapDropZone;
