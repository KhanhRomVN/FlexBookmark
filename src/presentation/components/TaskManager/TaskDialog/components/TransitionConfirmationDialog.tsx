import React, { useState } from "react";
import { TransitionConfirmationProps } from "../../../../types/task";
import { AlertCircle, ChevronRight } from "lucide-react";

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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertCircle
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirm Status Change
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Moving from{" "}
            <span className="font-medium capitalize text-blue-600 dark:text-blue-400">
              {transition.from.replace("-", " ")}
            </span>{" "}
            to{" "}
            <span className="font-medium capitalize text-green-600 dark:text-green-400">
              {transition.to.replace("-", " ")}
            </span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {transition.scenarios.map(
            (
              scenario: {
                title:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
                options: any[];
              },
              index: React.Key | null | undefined
            ) => (
              <div key={index} className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {scenario.title}
                </h4>
                <div className="space-y-2">
                  {scenario.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
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
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedOptions)}
              disabled={
                Object.keys(selectedOptions).length !==
                transition.scenarios.length
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitionConfirmationDialog;
