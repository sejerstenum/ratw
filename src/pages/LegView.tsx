import { useCallback } from 'react';
import { RouteTable } from '../components/RouteTable/RouteTable';
import type { LegNumber } from '../features/legs/legs.types';
import { useSegmentsStore } from '../features/segments/segments.store';
import type { Segment, SegmentDraft } from '../features/segments/segments.types';
import type { TeamId } from '../features/teams/teams.types';
import { shallow } from 'zustand/shallow';

interface LegViewProps {
  teamId: TeamId;
  leg: LegNumber;
}

export const LegView = ({ leg, teamId }: LegViewProps) => {
  const segments = useSegmentsStore(
    useCallback(
      (state) =>
        state.segments.filter(
          (segment) => segment.teamId === teamId && segment.leg === leg,
        ),
      [leg, teamId],
    ),
    shallow,
  );

  const addSegment = useSegmentsStore((state) => state.addSegment);
  const updateSegment = useSegmentsStore((state) => state.updateSegment);
  const deleteSegment = useSegmentsStore((state) => state.deleteSegment);

  const handleCreate = (draft: SegmentDraft) => {
    addSegment(draft);
  };

  const handleUpdate = (id: string, changes: Partial<Segment>) => {
    updateSegment(id, changes);
  };

  const handleDelete = (id: string) => {
    deleteSegment(id);
  };

  return (
    <RouteTable
      teamId={teamId}
      leg={leg}
      segments={segments}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
};
