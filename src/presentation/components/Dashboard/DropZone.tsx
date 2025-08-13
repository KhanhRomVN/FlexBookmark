import React from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  position: "right";
}

const DropZone: React.FC<DropZoneProps> = ({ id, position }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { active } = useDndContext();

  // Subtle line indicator between items during drag; highlights on hover
  return (
    <div
      ref={setNodeRef}
      className="absolute right-0 top-0 w-1/2 h-full pointer-events-none z-50 flex justify-end"
    >
      <div
        className={`w-px h-full transition-all duration-200 ${
          active
            ? isOver
              ? "bg-primary opacity-100 scale-y-110"
              : "bg-gray-300 opacity-50"
            : "opacity-0"
        }`}
      />
    </div>
  );
};

export default DropZone;
