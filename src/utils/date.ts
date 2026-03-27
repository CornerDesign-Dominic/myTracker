const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatLocalDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseLocalDateInput = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = DATE_INPUT_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = parseLocalDateInput(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const isDateInputValid = (value: string) => {
  return parseLocalDateInput(value) !== null;
};
