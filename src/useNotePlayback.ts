import { useEffect, useRef } from 'react';
import { Note, semitone } from './music';
import { playSemitone } from './sound';

export function useNotePlayback(
  note: Note,
  enabled: boolean,
  sequence: number,
  markCurrentAsPlayed = false
): void {
  const lastPlayed = useRef<number | null>(
    markCurrentAsPlayed ? sequence : null
  );

  useEffect(() => {
    if (!enabled || lastPlayed.current === sequence) return;
    lastPlayed.current = sequence;
    playSemitone(semitone(note));
  }, [enabled, note, sequence]);
}
