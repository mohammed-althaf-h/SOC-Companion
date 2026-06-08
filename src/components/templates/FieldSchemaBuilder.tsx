import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, Settings2, X } from 'lucide-react'
import type { FieldDefinition, FieldType } from '@/types'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'ip', label: 'IP Address' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
  { value: 'datetime', label: 'Date/Time' },
]

interface SortableFieldItemProps {
  field: FieldDefinition
  onUpdate: (updated: FieldDefinition) => void
  onDelete: () => void
}

function SortableFieldItem({ field, onUpdate, onDelete }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border ${isDragging ? 'border-primary' : 'border-surface-border'} rounded-lg mb-2`}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary text-muted-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder="Field Label (e.g. Source IP)"
            className="bg-transparent border-b border-transparent hover:border-surface-border focus:border-primary focus:outline-none px-1 py-1"
          />
          <select
            value={field.type}
            onChange={(e) => onUpdate({ ...field, type: e.target.value as FieldType })}
            className="bg-transparent text-sm focus:outline-none"
          >
            {FIELD_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`p-1.5 rounded hover:bg-surface-elevated transition-colors ${expanded ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 border-t border-surface-border bg-surface-elevated/30 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">Field ID (Variable Name)</label>
            <input
              type="text"
              value={field.id}
              onChange={(e) => onUpdate({ ...field, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              className="w-full bg-background border border-surface-border rounded px-2 py-1 focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">Used in templates as {'{{'}{field.id}{'}}'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
              className="w-full bg-background border border-surface-border rounded px-2 py-1 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
                className="rounded border-surface-border bg-background"
              />
              Required
            </label>
            {['text', 'textarea', 'ip', 'url', 'email'].includes(field.type) && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.defang || false}
                  onChange={(e) => onUpdate({ ...field, defang: e.target.checked })}
                  className="rounded border-surface-border bg-background"
                />
                Auto-defang (e.g. 1.1.1[.]1)
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.monospace || false}
                onChange={(e) => onUpdate({ ...field, monospace: e.target.checked })}
                className="rounded border-surface-border bg-background"
              />
              Monospace Font
            </label>
          </div>

          {(field.type === 'select' || field.type === 'multiselect') && (
            <div className="col-span-2 space-y-1 mt-2">
              <label className="text-muted-foreground text-xs">Options (comma-separated)</label>
              <input
                type="text"
                value={field.options?.join(', ') || ''}
                onChange={(e) => onUpdate({ ...field, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full bg-background border border-surface-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FieldSchemaBuilderProps {
  fields: FieldDefinition[]
  onChange: (fields: FieldDefinition[]) => void
}

export default function FieldSchemaBuilder({ fields, onChange }: FieldSchemaBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      onChange(arrayMove(fields, oldIndex, newIndex))
    }
  }

  const addField = () => {
    const newId = `field_${Math.random().toString(36).substr(2, 9)}`
    onChange([
      ...fields,
      {
        id: newId,
        label: 'New Field',
        type: 'text',
        required: false
      }
    ])
  }

  const updateField = (id: string, updated: FieldDefinition) => {
    onChange(fields.map(f => f.id === id ? updated : f))
  }

  const deleteField = (id: string) => {
    onChange(fields.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Fields Schema</h3>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-2 text-sm bg-surface-elevated hover:bg-primary/20 text-primary px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                onUpdate={(updated) => updateField(field.id, updated)}
                onDelete={() => deleteField(field.id)}
              />
            ))}
            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-surface-border rounded-lg">
                No fields defined. Add a field to start building your schema.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
