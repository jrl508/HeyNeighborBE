const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./routes/authRoutes')
const app = express();

dotenv.config();

const PORT = process.env.PORT;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
