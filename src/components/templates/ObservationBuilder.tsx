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
import { GripVertical, Trash2, Plus } from 'lucide-react'
import type { ObservationTemplate } from '@/types'

interface SortableObservationItemProps {
  observation: ObservationTemplate
  onUpdate: (updated: ObservationTemplate) => void
  onDelete: () => void
}

function SortableObservationItem({ observation, onUpdate, onDelete }: SortableObservationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: observation.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  // Parse variables from text (e.g. {{source_ip}} -> source_ip)
  const handleChange = (text: string) => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || []
    const variables = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))))
    onUpdate({ ...observation, text, variables })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border ${isDragging ? 'border-primary' : 'border-surface-border'} rounded-lg p-3 mb-2 flex items-start gap-3`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary text-muted-foreground mt-2"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1 space-y-2">
        <textarea
          value={observation.text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter observation template. Use {{variable}} for field insertion."
          className="w-full bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none min-h-[60px]"
        />
        {observation.variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {observation.variables.map(v => (
              <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors mt-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ObservationBuilderProps {
  observations: ObservationTemplate[]
  onChange: (observations: ObservationTemplate[]) => void
}

export default function ObservationBuilder({ observations, onChange }: ObservationBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = observations.findIndex((o) => o.id === active.id)
      const newIndex = observations.findIndex((o) => o.id === over.id)
      onChange(arrayMove(observations, oldIndex, newIndex))
    }
  }

  const addObservation = () => {
    const newId = `obs_${Math.random().toString(36).substr(2, 9)}`
    onChange([
      ...observations,
      {
        id: newId,
        text: '',
        variables: []
      }
    ])
  }

  const updateObservation = (id: string, updated: ObservationTemplate) => {
    onChange(observations.map(o => o.id === id ? updated : o))
  }

  const deleteObservation = (id: string) => {
    onChange(observations.filter(o => o.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Observations Checklist</h3>
          <p className="text-sm text-muted-foreground">Define the standard observations an analyst should make. Use {'{{variable}}'} to embed field values.</p>
        </div>
        <button
          type="button"
          onClick={addObservation}
          className="flex items-center gap-2 text-sm bg-surface-elevated hover:bg-primary/20 text-primary px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Observation
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={observations.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {observations.map((obs) => (
              <SortableObservationItem
                key={obs.id}
                observation={obs}
                onUpdate={(updated) => updateObservation(obs.id, updated)}
                onDelete={() => deleteObservation(obs.id)}
              />
            ))}
            {observations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-surface-border rounded-lg">
                No observations defined.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
