const http = require("http");
const express = require("express");
const socketio = require("socket.io");
require("./db/mongoose");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const cors = require("cors");

app.io = io;
app.pussy = "pussy";
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

/*app.use(async (req, res, next) => {
  if (req.user) {
    const tasks = await req.user
      .populate({
        path: "tasks",
        options: {
          sort: "-updatedAt"
        }
      })
      .execPopulate();
    req.app.io.to(`${req.user.email}`).emit("tasks", req.user.tasks);
  }

  next();
});*/

io.on("connection", socket => {
  app.socket = socket;
  app.id = socket.id;
  socket.on("login", async email => {
    app.socket = socket;
    await socket.join(email);
  });
});

server.listen(port, () => {
  console.log("server is up and running on port " + port);
});
