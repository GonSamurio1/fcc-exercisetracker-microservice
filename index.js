const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Middlewares para procesar body de formularios y peticiones JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Bases de datos en memoria
const users = [];
const exercises = {}; // Formato: { userId: [ { description, duration, date }, ... ] }

// Helper para generar IDs sencillos (16 caracteres hexadecimales)
const generateId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

// 1. POST /api/users - Crear usuario
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const _id = generateId();
  const newUser = { username, _id };

  users.push(newUser);
  exercises[_id] = [];

  res.json(newUser);
});

// 2. GET /api/users - Obtener todos los usuarios
app.get("/api/users", (req, res) => {
  res.json(users);
});

// 3. POST /api/users/:_id/exercises - Cargar un ejercicio para un usuario
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let dateObj;

  if (req.body.date) {
    dateObj = new Date(req.body.date);
  } else {
    dateObj = new Date();
  }

  // Si la fecha enviada es inválida, se usa la fecha actual
  if (dateObj.toString() === "Invalid Date") {
    dateObj = new Date();
  }

  const dateString = dateObj.toDateString();

  const newExercise = {
    description,
    duration,
    date: dateString,
    rawDate: dateObj.getTime()
  };

  if (!exercises[userId]) {
    exercises[userId] = [];
  }
  exercises[userId].push(newExercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: dateString,
    duration: duration,
    description: description
  });
});

// 4. GET /api/users/:_id/logs - Obtener el historial de ejercicios con filtros (from, to, limit)
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  let userLog = exercises[userId] || [];

  const { from, to, limit } = req.query;

  // Filtrado por fecha 'from'
  if (from) {
    const fromDate = new Date(from.replace(/-/g, '/')).getTime();
    userLog = userLog.filter(e => e.rawDate >= fromDate);
  }

  // Filtrado por fecha 'to'
  if (to) {
    const toDate = new Date(to.replace(/-/g, '/')).getTime();
    userLog = userLog.filter(e => e.rawDate <= toDate);
  }

  // Filtrado por 'limit'
  if (limit) {
    userLog = userLog.slice(0, parseInt(limit));
  }

  // Formatear los registros para omitir propiedades internas
  const logToReturn = userLog.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: logToReturn.length,
    log: logToReturn
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
