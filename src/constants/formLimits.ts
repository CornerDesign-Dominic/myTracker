export const NOTES_MAX_LENGTH = 500;

export const clampNotesLength = (value: string) => value.slice(0, NOTES_MAX_LENGTH);
