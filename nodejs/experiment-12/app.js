const express = require('express');
const app = express();
const PORT = 3000;

const seats = {};
const TOTAL_SEATS = 10;
const LOCK_TIMEOUT = 60 * 1000;

for (let i = 1; i <= TOTAL_SEATS; i++) {
    seats[i] = { status: 'available' };
}

app.use(express.json());


app.get('/seats', (req, res) => {
    res.status(200).json(seats);
});


app.post('/lock/:seatId', (req, res) => {
    const { seatId } = req.params;
    const seat = seats[seatId];

    if (!seat) {
        return res.status(404).json({ message: 'Seat not found.' });
    }


    if (seat.status !== 'available') {
        return res.status(409).json({ message: `Seat ${seatId} is not available.` }); // 409 Conflict
    }


    seat.status = 'locked';

    seat.lockTimeoutId = setTimeout(() => {

        if (seats[seatId].status === 'locked' && seats[seatId].lockTimeoutId === seat.lockTimeoutId) {
            seats[seatId].status = 'available';
            delete seats[seatId].lockTimeoutId;
            console.log(`Seat ${seatId} lock expired and has been released.`);
        }
    }, LOCK_TIMEOUT);

    res.status(200).json({ message: `Seat ${seatId} locked successfully. Confirm within 1 minute.` });
});

app.post('/confirm/:seatId', (req, res) => {
    const { seatId } = req.params;
    const seat = seats[seatId];


    if (!seat) {
        return res.status(404).json({ message: 'Seat not found.' });
    }


    if (seat.status !== 'locked') {
        return res.status(400).json({ message: `Seat ${seatId} is not locked and cannot be booked.` });
    }

    clearTimeout(seat.lockTimeoutId);
    delete seat.lockTimeoutId;

    seat.status = 'booked';

    res.status(200).json({ message: `Seat ${seatId} booked successfully!` });
});

app.listen(PORT, () => {
    console.log(`Ticket booking server running on http://localhost:${PORT}`);
});