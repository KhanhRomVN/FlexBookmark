// FlexBookmark/src/presentation/components/TaskAndEvent/DetailPanel.tsx

import React from "react";
import { format, parseISO } from "date-fns";
import { CalendarEvent, Task } from "../../tab/TaskAndEvent";

interface DetailPanelProps {
  item: CalendarEvent | Task;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ item, onClose }) => {
  const isEvent = "start" in item;

  return (
    <div className="h-full bg-white dark:bg-gray-800 p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">{item.title}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isEvent ? (
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-24 text-gray-500 dark:text-gray-400">When</div>
            <div>
              <div className="font-medium">
                {format(parseISO(item.start.toString()), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {format(parseISO(item.start.toString()), "h:mm a")} -{" "}
                {format(parseISO(item.end.toString()), "h:mm a")}
              </div>
            </div>
          </div>

          {item.location && (
            <div className="flex items-start">
              <div className="w-24 text-gray-500 dark:text-gray-400">
                Location
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {item.location}
              </div>
            </div>
          )}

          {item.description && (
            <div className="flex items-start">
              <div className="w-24 text-gray-500 dark:text-gray-400">
                Description
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {item.description}
              </div>
            </div>
          )}

          {item.attendees && item.attendees.length > 0 && (
            <div className="flex items-start">
              <div className="w-24 text-gray-500 dark:text-gray-400">
                Attendees
              </div>
              <div>
                {item.attendees.map((attendee, index) => (
                  <div key={index} className="text-gray-600 dark:text-gray-300">
                    {attendee}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Join Meeting
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                item.completed
                  ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                  : "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
              }`}
            >
              {item.completed ? "Completed" : "Pending"}
            </span>
          </div>

          {item.due && (
            <div className="flex items-start">
              <div className="w-24 text-gray-500 dark:text-gray-400">
                Due Date
              </div>
              <div>
                <div className="font-medium">
                  {format(parseISO(item.due.toString()), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {format(parseISO(item.due.toString()), "h:mm a")}
                </div>
              </div>
            </div>
          )}

          {item.notes && (
            <div className="flex items-start">
              <div className="w-24 text-gray-500 dark:text-gray-400">Notes</div>
              <div className="text-gray-600 dark:text-gray-300">
                {item.notes}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-2">
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              {item.completed ? "Reopen" : "Complete"}
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Edit
            </button>
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
