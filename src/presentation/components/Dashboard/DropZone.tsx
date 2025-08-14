import React from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";

interface DropZoneIntegratedProps {
  id: string;
  targetId: string;
}

const DropZoneIntegrated: React.FC<DropZoneIntegratedProps> = ({
  id,
  targetId,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { active } = useDndContext();
  const [isHovering, setIsHovering] = React.useState(false);

  // Mouse events for better hover detection
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const isActive = !!active;
  const showHover = isActive && (isOver || isHovering);

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isActive ? "mx-2" : "mx-0 w-0 overflow-hidden"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`transition-all duration-200 ${
          showHover
            ? "w-1 h-16 bg-blue-500 shadow-lg rounded-sm"
            : isActive
            ? "w-1 h-14 bg-gray-300 opacity-50"
            : "w-0 h-0"
        }`}
      />
    </div>
  );
};

export default DropZoneIntegrated;
