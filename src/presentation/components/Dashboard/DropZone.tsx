import React from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  position: "before" | "after";
}

const DropZone: React.FC<DropZoneProps> = ({ id, position }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { active } = useDndContext();

  // Subtle line indicator between items during drag; highlights on hover
  return (
    <div
      ref={setNodeRef}
      className={`absolute z-50 inset-y-0 flex items-center pointer-events-none ${
        position === "before" ? "-left-1" : "-right-1"
      }`}
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
