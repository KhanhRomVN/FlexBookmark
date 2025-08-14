import React from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  position: "left" | "right";
}

const DropZone: React.FC<DropZoneProps> = ({ id, position }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { active } = useDndContext();

  // Single thin drop stripe; only this narrow area is interactive
  return (
    <div
      ref={setNodeRef}
      className={`absolute ${
        position === "right" ? "right-0" : "left-0"
      } top-0 w-px h-full z-50 pointer-events-auto transition-all duration-200 ${
        active
          ? isOver
            ? "bg-primary opacity-100 scale-y-110"
            : "bg-gray-300 opacity-50"
          : "opacity-0"
      }`}
    />
  );
};

export default DropZone;
