import * as chrono from 'chrono-node';

export function extractDateRangeFromMessage(message) {
  const parsed = chrono.parse(message);
  if (parsed.length > 0) {
    const { start, end } = parsed[0];
    return {
      from: start ? start.date().toISOString().slice(0, 10) : null,
      to: end ? end.date().toISOString().slice(0, 10) : null
    };
  }
  return null;
}