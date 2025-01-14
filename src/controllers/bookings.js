import createHttpError from 'http-errors';
import Class from '../models/class.js';
import Booking from '../models/booking.js';
import { notifyBookingChange } from '../helpers/booking_change_notifier_handler.js';
import {
  forceDateToBeToday,
  isBookingOverlapping,
  isClassAvailable,
  isValidDate,
} from '../utils/booking_utils.js';

export async function bookClass(req, res, next) {
  const { representativeId, classId, timeRange, course, level } = req.body;
  const currentTime = Date.now();

  if (!representativeId || !classId || !timeRange || !timeRange.start) {
    return next(
      createHttpError(
        400,
        'Missing required fields: representativeId, classId, timeRange'
      )
    );
  }
  const startTime = forceDateToBeToday(timeRange.start);
  const endTime = timeRange.end ? forceDateToBeToday(timeRange.end) : null;
  const errors = [];

  if (!isValidDate(startTime)) {
    errors.push('Invalid timeRange.start');
  } else if (startTime.getTime() < currentTime) {
    errors.push('Invalid timeRange.start; cannot be in the past');
  }

  if (endTime) {
    if (!isValidDate(endTime)) {
      errors.push('Invalid timeRange.end');
    } else if (startTime.getTime() >= endTime.getTime()) {
      errors.push('Invalid timeRange; start must be before end');
    } else if (Math.abs(startTime.getTime() - endTime.getTime()) < 1000) {
      errors.push('startTime and endTime cannot be the same');
    }
  }

  if (errors.length > 0) {
    return next(createHttpError(400, errors.join(', ')));
  }

  try {
    const class_ = await Class.findById(classId).populate(
      'bookings',
      'timeRange'
    );
    if (!class_) return next(createHttpError(404, 'Class not found'));

    const isOverlapping = isBookingOverlapping(class_.bookings, {
      timeRange: { start: startTime, end: endTime },
    });

    if (isOverlapping)
      return next(
        createHttpError(400, 'The class is already booked for this time.')
      );

    const booking = new Booking({
      representativeId,
      class: classId,
      timeRange: { start: startTime, end: endTime },
      course,
      level,
    });

    await booking.save();

    const bookings = [...class_.bookings, booking];

    class_.bookings.push(booking._id);
    class_.isAvailable = isClassAvailable(bookings, currentTime);

    await class_.save();
    await notifyBookingChange(req.io, class_._id);
    return res.status(201).json({
      id: booking._id,
      ...booking._doc,
      class: {
        _id: class_._id,
        id: class_._id,
        code: class_.code,
        fullCode: class_.fullCode,
        isAvailable: class_.isAvailable,
      },
    });
  } catch (error) {
    console.trace(error);
    next(error);
  }
}

export async function cancelClass(req, res, next) {
  const { id } = req.params;
  if (!id) return next(createHttpError(400, 'Booking id is required'));

  try {
    const booking = await Booking.findById(id);

    if (!booking) return next(createHttpError(404, 'Booking not found'));

    await Booking.findByIdAndDelete(id);

    const relatedClass = await Class.findById(booking.class).populate(
      'bookings',
      'timeRange'
    );

    if (relatedClass) {
      relatedClass.bookings = relatedClass.bookings.filter(
        (bookingId) => bookingId.toString() !== id.toString()
      );

      relatedClass.isAvailable = isClassAvailable(
        relatedClass.bookings,
        new Date()
      );

      await relatedClass.save();
      await notifyBookingChange(req.io, relatedClass._id);
    }

    res.status(204).send();
  } catch (error) {
    console.trace(error);
    next(error);
  }
}

export async function patchBooking(req, res, next) {
  const { id } = req.params;
  const { timeRange } = req.body;

  if (!id || !timeRange || (!timeRange.start && !timeRange.end)) {
    return next(
      createHttpError(
        400,
        'Booking id and at least one of timeRange.start or timeRange.end are required'
      )
    );
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) return next(createHttpError(404, 'Booking not found'));

    const relatedClass = await Class.findById(booking.class).populate(
      'bookings',
      'timeRange'
    );

    if (!relatedClass)
      return next(createHttpError(404, 'Related class not found'));

    const updatedTimeRange = {
      start: timeRange.start
        ? forceDateToBeToday(timeRange.start)
        : booking.timeRange.start,
      end: timeRange.end
        ? forceDateToBeToday(timeRange.end)
        : booking.timeRange.end,
    };

    if (
      !isValidDate(updatedTimeRange.start) ||
      !isValidDate(updatedTimeRange.end)
    ) {
      return next(createHttpError(400, 'Invalid timeRange values'));
    }

    if (updatedTimeRange.start >= updatedTimeRange.end) {
      return next(
        createHttpError(
          400,
          'timeRange.start must be earlier than timeRange.end'
        )
      );
    }

    // Check for overlaps with other bookings
    const isOverlapping = isBookingOverlapping(
      relatedClass.bookings.filter(
        (booking) => booking._id.toString() !== id.toString()
      ),
      { timeRange: updatedTimeRange }
    );

    if (isOverlapping)
      return next(
        createHttpError(
          400,
          'The updated booking time overlaps with another booking try booking at a different time'
        )
      );

    booking.timeRange = updatedTimeRange;
    await booking.save();

    relatedClass.isAvailable = isClassAvailable(
      relatedClass.bookings,
      new Date()
    );
    await relatedClass.save();

    await notifyBookingChange(req.io, relatedClass._id);

    res.json({
      id: booking._id,
      ...booking._doc,
      class: {
        _id: relatedClass._id,
        id: relatedClass._id,
        code: relatedClass.code,
        fullCode: relatedClass.fullCode,
        isAvailable: relatedClass.isAvailable,
      },
    });
  } catch (error) {
    console.trace(error);
    next(error);
  }
}

export async function getBookingsByRepresentativeId(req, res, next) {
  const { representativeId: id } = req.query;

  if (!id) {
    return next(createHttpError(400, 'Representative id is required'));
  }

  try {
    const bookings = await Booking.find({ representativeId: id }).populate(
      'class',
      'code fullCode isAvailable'
    );

    res.json(bookings);
  } catch (error) {
    console.trace(error);
    next(error);
  }
}
