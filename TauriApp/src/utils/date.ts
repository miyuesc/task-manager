export const getLocalDateISOString = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

export const getRelativeDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return getLocalDateISOString(d);
};
