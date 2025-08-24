import React from "react";
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react";

interface DateTimeValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: "completed" | "overdue" | "cancel") => void;
  validationType: "overdue" | "invalid-range";
  dueDate?: Date | null;
  dueTime?: Date | null;
}

const DateTimeValidationDialog: React.FC<DateTimeValidationDialogProps> = ({
  isOpen,
  onConfirm,
  validationType,
  dueDate,
  dueTime,
}) => {
  if (!isOpen) return null;

  const formatDateTime = (date?: Date | null, time?: Date | null) => {
    if (!date) return "";

    const dateStr = date.toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (time) {
      const timeStr = time.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateStr} lúc ${timeStr}`;
    }

    return dateStr;
  };

  const getDialogContent = () => {
    switch (validationType) {
      case "overdue":
        return {
          title: "Task Đã Quá Hạn",
          description: `Thời gian due date/time bạn đã chọn (${formatDateTime(
            dueDate,
            dueTime
          )}) đã qua. Vui lòng chọn hành động phù hợp:`,
          icon: <AlertTriangle size={24} className="text-amber-500" />,
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          actions: [
            {
              id: "completed",
              label: "Task đã hoàn thành",
              description: "Đánh dấu task là đã hoàn thành (Done)",
              icon: <CheckCircle size={20} className="text-green-500" />,
              color: "bg-green-500 hover:bg-green-600 text-white",
            },
            {
              id: "overdue",
              label: "Task chưa hoàn thành",
              description: "Đánh dấu task là quá hạn (Overdue)",
              icon: <AlertTriangle size={20} className="text-red-500" />,
              color: "bg-red-500 hover:bg-red-600 text-white",
            },
          ],
        };

      case "invalid-range":
        return {
          title: "Thời Gian Không Hợp Lệ",
          description:
            "Due date/time không thể nhỏ hơn start date/time. Vui lòng điều chỉnh lại thời gian.",
          icon: <Clock size={24} className="text-red-500" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          actions: [],
        };

      default:
        return null;
    }
  };

  const content = getDialogContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${content.iconBg}`}>
              {content.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {content.title}
              </h2>
            </div>
          </div>
          <button
            onClick={() => onConfirm("cancel")}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {content.description}
          </p>

          {/* Actions */}
          {content.actions.length > 0 && (
            <div className="space-y-3">
              {content.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() =>
                    onConfirm(action.id as "completed" | "overdue")
                  }
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 text-left group`}
                >
                  <div className="flex-shrink-0">{action.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                      {action.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {validationType === "invalid-range" && (
          <div className="flex justify-end p-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => onConfirm("cancel")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {validationType === "overdue" && (
          <div className="flex justify-end p-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => onConfirm("cancel")}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeValidationDialog;
