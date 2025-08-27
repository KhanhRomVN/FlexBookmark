import React, { useRef, useState } from "react";
import {
  Paperclip,
  ChevronDown,
  Trash2,
  Image,
  Video,
  Radio,
  File,
  FileText,
} from "lucide-react";
import { Attachment } from "../../../../types/calendar";

interface AttachmentsSectionProps {
  editedEvent: { attachments?: Attachment[] };
  newAttachment: {
    title: string;
    url: string;
    type: "image" | "video" | "audio" | "file" | "other";
  };
  setNewAttachment: React.Dispatch<
    React.SetStateAction<{
      title: string;
      url: string;
      type: "image" | "video" | "audio" | "file" | "other";
    }>
  >;
  handleAddAttachment: () => void;
  handleDeleteAttachment: (id: string) => void;
}

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case "image":
      return <Image size={16} className="text-emerald-500" />;
    case "video":
      return <Video size={16} className="text-amber-500" />;
    case "audio":
      return <Radio size={16} className="text-indigo-500" />;
    case "file":
      return <File size={16} className="text-blue-500" />;
    default:
      return <FileText size={16} className="text-gray-500" />;
  }
};

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  editedEvent,
  newAttachment,
  setNewAttachment,
  handleAddAttachment,
  handleDeleteAttachment,
}) => {
  const attachmentRef = useRef<HTMLDivElement>(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg text-text-default">Attachments</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editedEvent.attachments?.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border-default"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-lg">
                {getAttachmentIcon(att.type)}
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-default font-medium truncate block hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {att.title || "Attachment"}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {att.url.substring(0, 40)}
                  {att.url.length > 40 ? "..." : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteAttachment(att.id)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4 p-4 rounded-lg border border-border-default">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-2 block font-medium text-text-secondary">
              Title
            </label>
            <input
              placeholder="Attachment name"
              value={newAttachment.title}
              onChange={(e) =>
                setNewAttachment((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default"
            />
          </div>
          <div>
            <label className="text-sm mb-2 block font-medium text-text-secondary">
              Type
            </label>
            <div className="relative" ref={attachmentRef}>
              <button
                className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default"
                onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
              >
                <span className="capitalize flex items-center gap-2">
                  {getAttachmentIcon(newAttachment.type)}
                  {newAttachment.type}
                </span>
                <ChevronDown size={16} />
              </button>
              {showAttachmentOptions && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden">
                  {(["image", "video", "audio", "file", "other"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 capitalize text-gray-700 dark:text-gray-300 transition-colors"
                        onClick={() => {
                          setNewAttachment((prev) => ({ ...prev, type }));
                          setShowAttachmentOptions(false);
                        }}
                      >
                        {getAttachmentIcon(type)}
                        {type}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm mb-2 block font-medium text-text-secondary">
            URL or Link
          </label>
          <input
            placeholder="https://example.com/file.pdf"
            value={newAttachment.url}
            onChange={(e) =>
              setNewAttachment((prev) => ({
                ...prev,
                url: e.target.value,
              }))
            }
            className="w-full bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default"
          />
        </div>

        <button
          onClick={handleAddAttachment}
          className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md font-medium justify-center"
        >
          <Paperclip size={16} />
          Add Attachment
        </button>
      </div>
    </div>
  );
};

export default AttachmentsSection;
