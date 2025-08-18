import React, { useState } from "react";
import { TransitionConfirmationProps } from "../../../../types/task";

const TransitionConfirmationDialog: React.FC<TransitionConfirmationProps> = ({
  isOpen,
  transition,
  onConfirm,
  onCancel,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  if (!isOpen || !transition) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🔄 Status Transition Confirmation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Moving from{" "}
            <span className="font-medium capitalize">
              {transition.from.replace("-", " ")}
            </span>{" "}
            to{" "}
            <span className="font-medium capitalize">
              {transition.to.replace("-", " ")}
            </span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {transition.scenarios.map((scenario, index) => (
            <div key={index} className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {scenario.title}
              </h4>
              <div className="space-y-2">
                {scenario.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`scenario-${index}`}
                      value={option.value}
                      onChange={(e) =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [`scenario-${index}`]: e.target.value,
                        }))
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedOptions)}
            disabled={
              Object.keys(selectedOptions).length !==
              transition.scenarios.length
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Transition
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransitionConfirmationDialog;
