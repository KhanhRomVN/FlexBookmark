import React from "react";
import type {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  DifficultyLevel,
} from "../types/types";

interface HabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitFormData: HabitFormData) => Promise<void>;
  editingHabit?: Habit | null;
  loading?: boolean;
  formData: HabitFormData;
  onFormChange: (formData: HabitFormData) => void;
}

const HabitDialog: React.FC<HabitDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingHabit,
  loading = false,
  formData,
  onFormChange,
}) => {
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return;
    await onSubmit(formData);
  };

  const updateFormData = (updates: Partial<HabitFormData>) => {
    onFormChange({ ...formData, ...updates });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-dialog-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h3 className="text-xl font-semibold text-text-primary">
            {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-sidebar-itemHover rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <section>
              <h4 className="text-base font-medium text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Thông tin cơ bản
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tên thói quen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary placeholder:text-text-secondary"
                    placeholder="Vd: Uống 2 lít nước mỗi ngày"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary placeholder:text-text-secondary resize-none"
                    rows={3}
                    placeholder="Mô tả chi tiết về thói quen này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Loại thói quen
                  </label>
                  <select
                    value={formData.habitType}
                    onChange={(e) =>
                      updateFormData({ habitType: e.target.value as HabitType })
                    }
                    className="w-full px-4 py-3 bg-dropdown-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary"
                  >
                    <option value="good">
                      ✅ Thói quen tốt (muốn duy trì)
                    </option>
                    <option value="bad">⛔ Thói quen xấu (muốn hạn chế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Mức độ khó
                  </label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) =>
                      updateFormData({
                        difficultyLevel: parseInt(
                          e.target.value
                        ) as DifficultyLevel,
                      })
                    }
                    className="w-full px-4 py-3 bg-dropdown-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary"
                  >
                    <option value={1}>⭐ Mức 1 - Rất dễ</option>
                    <option value={2}>⭐⭐ Mức 2 - Dễ</option>
                    <option value={3}>⭐⭐⭐ Mức 3 - Trung bình</option>
                    <option value={4}>⭐⭐⭐⭐ Mức 4 - Khó</option>
                    <option value={5}>⭐⭐⭐⭐⭐ Mức 5 - Rất khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      updateFormData({
                        category: e.target.value as HabitCategory,
                      })
                    }
                    className="w-full px-4 py-3 bg-dropdown-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary"
                  >
                    <option value="health">🏥 Sức khỏe</option>
                    <option value="fitness">💪 Thể dục</option>
                    <option value="productivity">⚡ Năng suất</option>
                    <option value="mindfulness">🧘 Thiền định</option>
                    <option value="learning">📚 Học tập</option>
                    <option value="social">👥 Xã hội</option>
                    <option value="finance">💰 Tài chính</option>
                    <option value="creativity">🎨 Sáng tạo</option>
                    <option value="other">📌 Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {formData.habitType === "good"
                      ? "🎯 Mục tiêu hàng ngày"
                      : "🚫 Giới hạn tối đa"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={
                        formData.habitType === "good"
                          ? formData.goal || ""
                          : formData.limit || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseInt(e.target.value)
                          : undefined;
                        if (formData.habitType === "good") {
                          updateFormData({ goal: value });
                        } else {
                          updateFormData({ limit: value });
                        }
                      }}
                      className="w-full px-4 py-3 bg-input-background border border-border-default rounded-xl 
                               focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                               text-text-primary placeholder:text-text-secondary pr-20"
                      placeholder={
                        formData.habitType === "good" ? "Vd: 2" : "Vd: 1"
                      }
                    />
                    {formData.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                        {formData.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Advanced Options Section */}
            <section className="border-t border-border-default pt-6">
              <h4 className="text-base font-medium text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Tùy chọn nâng cao
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Đơn vị đo
                  </label>
                  <input
                    type="text"
                    value={formData.unit || ""}
                    onChange={(e) => updateFormData({ unit: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary placeholder:text-text-secondary"
                    placeholder="Vd: ly, phút, trang..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Thời gian thực hiện
                  </label>
                  <input
                    type="time"
                    value={formData.startTime || ""}
                    onChange={(e) =>
                      updateFormData({ startTime: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border-default rounded-xl 
                             focus:ring-2 focus:ring-primary/20 focus:border-border-focus transition-colors
                             text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Màu sắc đại diện
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={formData.colorCode}
                        onChange={(e) =>
                          updateFormData({ colorCode: e.target.value })
                        }
                        className="w-12 h-12 border-2 border-border-default rounded-xl cursor-pointer 
                                 hover:border-border-hover transition-colors"
                      />
                      <div
                        className="absolute inset-1 rounded-lg"
                        style={{ backgroundColor: formData.colorCode }}
                      ></div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {formData.colorCode}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Chọn màu yêu thích
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-default bg-card-background/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-itemHover 
                     transition-colors rounded-xl font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name?.trim()}
            className="px-6 py-2.5 bg-button-bg hover:bg-button-bgHover disabled:bg-text-secondary/20 
                     text-button-bgText rounded-xl font-medium transition-colors 
                     disabled:cursor-not-allowed disabled:text-text-secondary
                     flex items-center gap-2 min-w-[140px] justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  ></circle>
                  <path
                    fill="currentColor"
                    strokeWidth="4"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    className="opacity-75"
                  ></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                {editingHabit ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Cập nhật thói quen
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tạo thói quen
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitDialog;
