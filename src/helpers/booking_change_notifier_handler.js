import Class from '../models/class.js';

export async function notifyBookingChange(io, classId) {
  const class_ = await Class.findById(classId).populate('bookings');

  const now = new Date();
  const validBookings = class_.bookings.filter((b) => now < b.timeRange.end);

  const socketPayload = { classId, bookings: validBookings };

  io.to(`class-${classId}`).emit('bookingUpdate', socketPayload);
  io.to('all-classes').emit('bookingUpdate', socketPayload);
}
