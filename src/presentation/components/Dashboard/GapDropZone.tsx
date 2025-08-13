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

  const borderClass =
    position === "left"
      ? "border-l-2 border-blue-500"
      : "border-r-2 border-blue-500";

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "1rem",
        [position]: "-0.5rem",
      }}
      className={isOver ? `${borderClass} bg-blue-200/20 z-20` : ""}
    />
  );
};

export default GapDropZone;
