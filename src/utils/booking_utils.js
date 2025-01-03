export function isClassAvailable(bookings, currentTime) {
  return bookings.every(
    (booking) =>
      currentTime < booking.timeRange.start ||
      currentTime > booking.timeRange.end
  );
}

export function isBookingOverlapping(bookings, newBooking) {
  if (!bookings || bookings.length === 0) return false;

  // Extract start and end times for newBooking
  const { start: newStart, end: newEnd } = newBooking.timeRange;

  // Sort bookings by start time
  const sortedBookings = bookings.sort(
    (a, b) => new Date(a.timeRange.start) - new Date(b.timeRange.start)
  );

  // Binary search to find the closest relevant booking range
  let low = 0,
    high = sortedBookings.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    const current = sortedBookings[mid];
    const currentStart = new Date(current.timeRange.start);
    const currentEnd = new Date(current.timeRange.end);

    if (newEnd <= currentStart) {
      high = mid - 1;
    } else if (newStart >= currentEnd) {
      low = mid + 1;
    } else {
      return true;
    }
  }

  // If no overlaps were found
  return false;
}

export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export function forceDateToBeToday(inputTime) {
  const today = new Date();
  const inputDate = new Date(inputTime);

  if (!isValidDate(inputDate)) {
    throw new Error('Invalid date provided');
  }

  // Set today's date with HH:MM from inputTime
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    inputDate.getHours(),
    inputDate.getMinutes(),
    0, // Force seconds to 00
    0 // Milliseconds to 00
  );
}
