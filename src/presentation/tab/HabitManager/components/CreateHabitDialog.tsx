// src/presentation/tab/HabitManager/components/CreateHabitDialog.tsx
import React from "react";
import type {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  DifficultyLevel,
} from "../types/habit";

interface CreateHabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitFormData: HabitFormData) => Promise<void>;
  editingHabit?: Habit | null;
  loading?: boolean;
  formData: HabitFormData;
  onFormChange: (formData: HabitFormData) => void;
}

const CreateHabitDialog: React.FC<CreateHabitDialogProps> = ({
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
        </h3>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên thói quen *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Vd: Uống 2 lít nước mỗi ngày"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  updateFormData({ description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Mô tả chi tiết về thói quen này..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Loại thói quen
              </label>
              <select
                value={formData.habitType}
                onChange={(e) =>
                  updateFormData({ habitType: e.target.value as HabitType })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="good">Thói quen tốt (muốn duy trì)</option>
                <option value="bad">Thói quen xấu (muốn hạn chế)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={1}>Mức 1 - Rất dễ</option>
                <option value={2}>Mức 2 - Dễ</option>
                <option value={3}>Mức 3 - Trung bình</option>
                <option value={4}>Mức 4 - Khó</option>
                <option value={5}>Mức 5 - Rất khó</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  updateFormData({ category: e.target.value as HabitCategory })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

            {/* Goal/Limit based on habit type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.habitType === "good"
                  ? "Mục tiêu hàng ngày"
                  : "Giới hạn tối đa"}
              </label>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={
                  formData.habitType === "good"
                    ? "Vd: 2 (2 lít nước)"
                    : "Vd: 1 (tối đa 1 ly cà phê)"
                }
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-slate-900 mb-4">
              Tùy chọn nâng cao
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn vị đo (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.unit || ""}
                  onChange={(e) => updateFormData({ unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Vd: ly, phút, trang..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Thời gian thực hiện (tùy chọn)
                </label>
                <input
                  type="time"
                  value={formData.startTime || ""}
                  onChange={(e) =>
                    updateFormData({ startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lý do/Động lực (tùy chọn)
                </label>
                <textarea
                  value={formData.whyReason || ""}
                  onChange={(e) =>
                    updateFormData({ whyReason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Tại sao bạn muốn thay đổi thói quen này?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Màu sắc
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) =>
                      updateFormData({ colorCode: e.target.value })
                    }
                    className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">
                    Chọn màu đại diện
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Emoji (tùy chọn)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.emoji || ""}
                  onChange={(e) => updateFormData({ emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="💧"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name?.trim()}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading
              ? "Đang xử lý..."
              : editingHabit
              ? "Cập nhật thói quen"
              : "Tạo thói quen"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateHabitDialog;
