/** How a logger is shown: its own full screen (setup), or a tab inside the check-in sheet. */
export type LoggerMode = 'screen' | 'onboarding' | 'tab';

export interface LoggerProps {
  mode?: LoggerMode;
  /** Tab mode: called after saving (Flow passes whether she is bleeding). */
  onSaved?: (info?: { bleeding?: boolean }) => void;
}
