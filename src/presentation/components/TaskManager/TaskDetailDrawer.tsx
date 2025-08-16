import React, { useState, useEffect } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Task, Priority, Status, Subtask, Attachment } from "../../types/task";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newSubtask, setNewSubtask] = useState("");
  const [newAttachment, setNewAttachment] = useState({
    title: "",
    url: "",
    type: "file" as "image" | "video" | "audio" | "file" | "other",
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!editedTask) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev!, [field]: value }));
  };

  const handleSubtaskChange = (
    id: string,
    field: keyof Subtask,
    value: any
  ) => {
    setEditedTask((prev) => ({
      ...prev!,
      subtasks:
        prev!.subtasks?.map((st) =>
          st.id === id ? { ...st, [field]: value } : st
        ) || [],
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
    };
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: [...(prev!.subtasks || []), newSub],
    }));
    setNewSubtask("");
  };

  const handleDeleteSubtask = (id: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter((st) => st.id !== id) || [],
    }));
  };

  const handleAddAttachment = () => {
    if (!newAttachment.url.trim()) return;
    const newAtt: Attachment = {
      id: Date.now().toString(),
      title: newAttachment.title || "Attachment",
      url: newAttachment.url,
      type: newAttachment.type,
    };
    setEditedTask((prev) => ({
      ...prev!,
      attachments: [...(prev!.attachments || []), newAtt],
    }));
    setNewAttachment({ title: "", url: "", type: "file" });
  };

  const handleDeleteAttachment = (id: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      attachments: prev!.attachments?.filter((att) => att.id !== id) || [],
    }));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setEditedTask((prev) => ({
      ...prev!,
      tags: [...(prev!.tags || []), newTag],
    }));
    setNewTag("");
  };

  const handleDeleteTag = (tag: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      tags: prev!.tags?.filter((t) => t !== tag) || [],
    }));
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      direction="right"
      size={600}
      className="p-6 overflow-auto bg-white dark:bg-gray-800"
    >
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Task Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Edit and manage your task
          </p>
        </div>

        <div className="space-y-6 mt-4">
          <div>
            <Label
              htmlFor="title"
              className="block mb-2 font-medium text-gray-900 dark:text-white"
            >
              Title
            </Label>
            <Input
              id="title"
              value={editedTask.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label
              htmlFor="description"
              className="block mb-2 font-medium text-gray-900 dark:text-white"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={editedTask.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
                Status
              </Label>
              <Select
                value={editedTask.status}
                onValueChange={(value) =>
                  handleChange("status", value as Status)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
                Priority
              </Label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) =>
                  handleChange("priority", value as Priority)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
                Start Time
              </Label>
              <DatePicker
                selected={
                  editedTask.startTime ? new Date(editedTask.startTime) : null
                }
                onChange={(date: Date | null) =>
                  handleChange("startTime", date)
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                customInput={<Input />}
                className="w-full"
              />
            </div>
            <div>
              <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
                End Time
              </Label>
              <DatePicker
                selected={
                  editedTask.endTime ? new Date(editedTask.endTime) : null
                }
                onChange={(date: Date | null) => handleChange("endTime", date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                customInput={<Input />}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
              Subtasks
            </Label>
            <div className="space-y-2">
              {editedTask.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) =>
                      handleSubtaskChange(
                        subtask.id,
                        "completed",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <Input
                    value={subtask.title}
                    onChange={(e) =>
                      handleSubtaskChange(subtask.id, "title", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="New subtask"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddSubtask}>Add</Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedTask.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {tag}
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
          </div>

          <div>
            <Label className="block mb-2 font-medium text-gray-900 dark:text-white">
              Attachments
            </Label>
            <div className="space-y-3">
              {editedTask.attachments?.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {att.title || att.url}
                    </a>
                    <span className="text-xs text-gray-500 ml-2">
                      ({att.type})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="space-y-3 mt-4">
                <Input
                  placeholder="Attachment Title"
                  value={newAttachment.title}
                  onChange={(e) =>
                    setNewAttachment((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="URL"
                  value={newAttachment.url}
                  onChange={(e) =>
                    setNewAttachment((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                />
                <Select
                  value={newAttachment.type}
                  onValueChange={(value) =>
                    setNewAttachment((prev) => ({
                      ...prev,
                      type: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAttachment} className="w-full">
                  Add Attachment
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <div>
            {editedTask.id && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(editedTask.id)}
                  className="mr-2"
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onDuplicate(editedTask)}
                  className="mr-2"
                >
                  Duplicate
                </Button>
              </>
            )}
          </div>
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button onClick={() => onSave(editedTask)}>Save</Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default TaskDetailDrawer;
