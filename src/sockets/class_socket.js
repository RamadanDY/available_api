import Class from '../models/class.js';
import { isValidObjectId } from 'mongoose';

export default function init(io) {
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('subscribe', () => {
      socket.join('all-classes');
    });

    socket.on('subscribeToClass', async (classId) => {
      if (!isValidObjectId(classId)) {
        socket.emit('error', {
          type: 'InvalidID',
          message: `The provided ID "${classId}" is not a valid MongoDB ObjectId.`,
        });
        return;
      }
      try {
        const class_ = await Class.findById(classId);
        if (class_) {
          console.log(`Client subscribed to class ${classId}`);
          socket.join(`class-${classId}`);

          // Emit a success message
          socket.emit('subscribed', {
            classId,
            message: `Successfully subscribed to class ${classId}`,
          });
        } else {
          socket.emit('error', {
            type: 'ClassNotFound',
            message: `Class with ID "${classId}" does not exist.`,
          });
        }
      } catch (error) {
        console.error('Error while subscribing to class:', error);
        socket.emit('error', {
          type: 'InternalError',
          message: 'An error occurred while processing your request.',
        });
      }
    });

    socket.on('unsubscribeFromClass', (classId) => {
      console.log(`Client unsubscribed from class ${classId}`);
      socket.leave(`class-${classId}`);
      socket.emit('unsubscribed', {
        classId,
        message: `Successfully unsubscribed from class ${classId}`,
      });
    });

    socket.on('unsubscribe', () => {
      socket.leave('all-classes');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
