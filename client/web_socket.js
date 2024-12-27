import { io } from 'socket.io-client';

const socket = io('http://localhost:3030');

// Confirm connection
socket.on('connect', () => {
  console.log('Connected to the server with socket ID:', socket.id);

  // Subscribe to a class after connecting
  socket.emit('subscribeToClass', '675c11942e2269f55555f319');
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});

socket.on('error', (error) => {
  console.error(`Error received: ${error.type} - ${error.message}`);
});

socket.on('subscribed', (data) => {
  console.log(data.message);
});

socket.on('unsubscribed', (data) => {
  console.log(data.message);
});

// Listen for booking updates
socket.on('bookingUpdate', (data) => {
  console.log('Booking update received:', data);
});

// Unsubscribe after 10 minutes
setTimeout(() => {
  socket.emit('unsubscribeFromClass', '675c11942e2269f55555f319');
  console.log('Unsubscribed from class');
  process.exit();
}, 600000);
