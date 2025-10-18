import { useMemo, useState } from 'react';
import type { LegNumber } from '../../features/legs/legs.types';
import { SEGMENT_TYPES, type SegmentDraft, type SegmentType } from '../../features/segments/segments.types';
import type { TeamId } from '../../features/teams/teams.types';
import { fromDateTimeLocalValue } from '../../lib/time';

interface NewSegmentRowProps {
  teamId: TeamId;
  leg: LegNumber;
  onCreate: (draft: SegmentDraft) => void;
}

const INITIAL_FORM = {
  type: 'bus' as SegmentType,
  fromCity: '',
  toCity: '',
  depTime: '',
  arrTime: '',
  cost: '',
  currency: '',
  notes: '',
};

export const NewSegmentRow = ({ leg, onCreate, teamId }: NewSegmentRowProps) => {
  const [formState, setFormState] = useState(INITIAL_FORM);

  const isValid = useMemo(() => {
    if (!formState.fromCity || !formState.toCity || !formState.depTime || !formState.arrTime) {
      return false;
    }

    const dep = new Date(formState.depTime);
    const arr = new Date(formState.arrTime);

    return dep.getTime() < arr.getTime();
  }, [formState.arrTime, formState.depTime, formState.fromCity, formState.toCity]);

  const handleChange = (field: keyof typeof formState, value: string) => {
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

    onCreate({
      teamId,
      leg,
      type: formState.type,
      fromCity: formState.fromCity,
      toCity: formState.toCity,
      depTime: fromDateTimeLocalValue(formState.depTime),
      arrTime: fromDateTimeLocalValue(formState.arrTime),
      cost: formState.cost ? Number.parseFloat(formState.cost) : undefined,
      currency: formState.currency || undefined,
      notes: formState.notes || undefined,
    });

    setFormState(INITIAL_FORM);
  };

  return (
    <tr>
      <td colSpan={10}>
        <form onSubmit={handleSubmit} className="new-segment-form">
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
          <input
            type="text"
            placeholder="From"
            value={formState.fromCity}
            onChange={(event) => handleChange('fromCity', event.target.value)}
          />
          <input
            type="text"
            placeholder="To"
            value={formState.toCity}
            onChange={(event) => handleChange('toCity', event.target.value)}
          />
          <input
            type="datetime-local"
            value={formState.depTime}
            onChange={(event) => handleChange('depTime', event.target.value)}
          />
          <input
            type="datetime-local"
            value={formState.arrTime}
            onChange={(event) => handleChange('arrTime', event.target.value)}
          />
          <input
            type="number"
            placeholder="Cost"
            value={formState.cost}
            onChange={(event) => handleChange('cost', event.target.value)}
          />
          <input
            type="text"
            placeholder="Currency"
            value={formState.currency}
            onChange={(event) => handleChange('currency', event.target.value)}
          />
          <input
            type="text"
            placeholder="Notes"
            value={formState.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
          />
          <button type="submit" disabled={!isValid}>
            Add segment
          </button>
        </form>
      </td>
    </tr>
  );
};
