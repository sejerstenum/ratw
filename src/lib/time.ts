export const toDateTimeLocalValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const tzOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
};

export const fromDateTimeLocalValue = (value: string) => {
  if (!value) {
    return value;
  }

  const localDate = new Date(value);
  if (Number.isNaN(localDate.getTime())) {
    return value;
  }

  return localDate.toISOString();
};
