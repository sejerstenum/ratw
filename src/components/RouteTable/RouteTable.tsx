import type { LegNumber } from '../../features/legs/legs.types';
import type { Segment, SegmentDraft } from '../../features/segments/segments.types';
import type { TeamId } from '../../features/teams/teams.types';
import { NewSegmentRow } from './NewSegmentRow';
import { SegmentRow } from './SegmentRow';

interface RouteTableProps {
  teamId: TeamId;
  leg: LegNumber;
  segments: Segment[];
  onCreate: (draft: SegmentDraft) => void;
  onUpdate: (id: string, changes: Partial<Segment>) => void;
  onDelete: (id: string) => void;
}

export const RouteTable = ({
  leg,
  onCreate,
  onDelete,
  onUpdate,
  segments,
  teamId,
}: RouteTableProps) => {
  const orderedSegments = [...segments].sort((a, b) => a.orderIdx - b.orderIdx);

  return (
    <table className="route-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>From</th>
          <th>To</th>
          <th>Departure</th>
          <th>Arrival</th>
          <th>Cost</th>
          <th>Currency</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orderedSegments.map((segment) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
        <NewSegmentRow teamId={teamId} leg={leg} onCreate={onCreate} />
      </tbody>
    </table>
  );
};
