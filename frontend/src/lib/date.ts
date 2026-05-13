export const formatDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const formatJapaneseDate = (dateString: string) => {
  const date = parseDateString(dateString);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export const formatCalendarDateString = (date: Date) =>
  formatDateString(date).replaceAll("-", "");

export const addDaysToDateString = (dateString: string, days: number) => {
  const date = parseDateString(dateString);

  date.setDate(date.getDate() + days);

  return date;
};
