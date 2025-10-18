import { useEffect, useMemo, useState } from 'react';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../lib/time';
import { SEGMENT_TYPES, type Segment, type SegmentType } from '../../features/segments/segments.types';

interface SegmentRowProps {
  segment: Segment;
  onUpdate: (id: string, changes: Partial<Segment>) => void;
  onDelete: (id: string) => void;
}

export const SegmentRow = ({ segment, onDelete, onUpdate }: SegmentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState(() => ({
    type: segment.type,
    fromCity: segment.fromCity,
    toCity: segment.toCity,
    depTime: toDateTimeLocalValue(segment.depTime),
    arrTime: toDateTimeLocalValue(segment.arrTime),
    cost: segment.cost?.toString() ?? '',
    currency: segment.currency ?? '',
    notes: segment.notes ?? '',
  }));

  useEffect(() => {
    setFormState({
      type: segment.type,
      fromCity: segment.fromCity,
      toCity: segment.toCity,
      depTime: toDateTimeLocalValue(segment.depTime),
      arrTime: toDateTimeLocalValue(segment.arrTime),
      cost: segment.cost?.toString() ?? '',
      currency: segment.currency ?? '',
      notes: segment.notes ?? '',
    });
  }, [segment]);

  const isValid = useMemo(() => {
    if (!formState.depTime || !formState.arrTime) {
      return false;
    }

    const dep = new Date(formState.depTime);
    const arr = new Date(formState.arrTime);

    return dep.getTime() < arr.getTime();
  }, [formState.arrTime, formState.depTime]);

  const handleChange = (
    field: keyof typeof formState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }

    onUpdate(segment.id, {
      type: formState.type as SegmentType,
      fromCity: formState.fromCity,
      toCity: formState.toCity,
      depTime: fromDateTimeLocalValue(formState.depTime),
      arrTime: fromDateTimeLocalValue(formState.arrTime),
      cost: formState.cost ? Number.parseFloat(formState.cost) : undefined,
      currency: formState.currency || undefined,
      notes: formState.notes || undefined,
    });
    setIsEditing(false);
  };

  return (
    <tr>
      <td>{segment.orderIdx + 1}</td>
      <td>
        {isEditing ? (
          <select
            value={formState.type}
            onChange={(event) => handleChange('type', event.target.value)}
          >
            {SEGMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ) : (
          segment.type
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            value={formState.fromCity}
            onChange={(event) => handleChange('fromCity', event.target.value)}
          />
        ) : (
          segment.fromCity
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            value={formState.toCity}
            onChange={(event) => handleChange('toCity', event.target.value)}
          />
        ) : (
          segment.toCity
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="datetime-local"
            value={formState.depTime}
            onChange={(event) => handleChange('depTime', event.target.value)}
          />
        ) : (
          new Date(segment.depTime).toLocaleString()
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="datetime-local"
            value={formState.arrTime}
            onChange={(event) => handleChange('arrTime', event.target.value)}
          />
        ) : (
          new Date(segment.arrTime).toLocaleString()
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="number"
            value={formState.cost}
            onChange={(event) => handleChange('cost', event.target.value)}
          />
        ) : segment.cost != null ? (
          segment.cost
        ) : (
          '—'
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            value={formState.currency}
            onChange={(event) => handleChange('currency', event.target.value)}
          />
        ) : segment.currency ?? '—'}
      </td>
      <td>
        {isEditing ? (
          <textarea
            value={formState.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
          />
        ) : (
          segment.notes ?? '—'
        )}
      </td>
      <td>
        {isEditing ? (
          <div className="actions">
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" onClick={handleSubmit} disabled={!isValid}>
              Save
            </button>
          </div>
        ) : (
          <div className="actions">
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button type="button" onClick={() => onDelete(segment.id)}>
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
