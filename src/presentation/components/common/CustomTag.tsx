// src/renderer/src/components/common/CustomTag.tsx
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Plus, X, Check } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

interface CustomTagProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  maxTags?: number
  allowDuplicates?: boolean
  onSave?: (tags: string[]) => void
  showSaveButton?: boolean
}

// Curated beautiful hex colors for tags
const TAG_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint Green
  '#FFEAA7', // Light Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Gold
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Peach
  '#82E0AA', // Light Green
  '#F1948A', // Light Pink
  '#85929E', // Blue Gray
  '#D7BDE2', // Lavender
  '#A9DFBF', // Pale Green
  '#F9E79F', // Pale Yellow
  '#AED6F1', // Pale Blue
  '#F5B7B1', // Pale Pink
  '#D5A6BD' // Dusty Pink
]

// Function to get consistent color for a tag
const getTagColor = (tag: string): string => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % TAG_COLORS.length
  return TAG_COLORS[index]
}

// Function to determine if text should be dark or light based on background
const getTextColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#374151' : '#FFFFFF' // Dark gray or white
}

const CustomTag: React.FC<CustomTagProps> = ({
  tags,
  onTagsChange,
  className,
  disabled = false,
  placeholder = 'Enter tag name...',
  maxTags,
  allowDuplicates = false,
  onSave,
  showSaveButton = false
}) => {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')

  const canAddMore = !maxTags || tags.length < maxTags

  const handleAddTag = () => {
    const trimmedValue = newTagValue.trim()
    if (trimmedValue && (allowDuplicates || !tags.includes(trimmedValue))) {
      const updatedTags = [...tags, trimmedValue]
      onTagsChange(updatedTags)
      setNewTagValue('')
      setShowAddTag(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove)
    onTagsChange(updatedTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setShowAddTag(false)
      setNewTagValue('')
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(tags)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tags Container */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Existing Tags */}
        {tags.length > 0 &&
          tags.map((tag, index) => {
            const bgColor = getTagColor(tag)
            const textColor = getTextColor(bgColor)

            return (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => !disabled && setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
              >
                <div
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-default"
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    borderColor: bgColor
                  }}
                >
                  {tag}

                  {/* Delete Button - appears on hover */}
                  {!disabled && hoveredTag === tag && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    >
                      <X className="h-2.5 w-2.5" style={{ color: textColor }} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

        {/* Add Tag Button/Input */}
        {!disabled && canAddMore && (
          <>
            {!showAddTag ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTag(true)}
                className="border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[120px]"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={
                      !newTagValue.trim() || (!allowDuplicates && tags.includes(newTagValue.trim()))
                    }
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddTag(false)
                      setNewTagValue('')
                    }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* No tags message */}
        {tags.length === 0 && !showAddTag && (
          <span className="text-sm text-gray-500 dark:text-gray-400 italic">No tags assigned</span>
        )}

        {/* Save Button */}
        {showSaveButton && onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-sm ml-2"
          >
            <Check className="h-4 w-4 mr-1" />
            Save Tags
          </Button>
        )}
      </div>

      {/* Helper Text */}
      {showAddTag && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press Enter to add tag, Escape to cancel
        </p>
      )}

      {/* Tag Limits */}
      {maxTags && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {tags.length} / {maxTags} tags
          {!canAddMore && ' (maximum reached)'}
        </p>
      )}
    </div>
  )
}

export default CustomTag
