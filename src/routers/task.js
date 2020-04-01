const express = require("express");
const Task = require("../models/task");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/tasks", auth, async (req, res, next) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();
    res.status(201).send(task);
    next();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/tasks/share", auth, async (req, res) => {
  const owner = await User.findOne({ email: req.body.email });

  try {
    const task = new Task({
      ...req.body.task,
      sharedBy: req.user.email,
      owner: owner._id
    });
    await task.save();
    res.status(201).send(task);
    await owner
      .populate({
        path: "tasks",
        options: {
          sort: "-updatedAt"
        }
      })
      .execPopulate();
    req.app.io.to(`${owner.email}`).emit("tasks", owner.tasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

/*router.get("/tasks", auth, async (req, res) => {
  try {
    await req.user
      .populate({
        path: "tasks",
        options: {
          sort: "-updatedAt",
          sort: "completed"
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});*/

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res, next) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["completed", "description", "title"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
    next();
  } catch (e) {
    res.status(400).send();
  }
});

router.delete("/tasks/:id", auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
    next();
  } catch (e) {
    res.status(500).send();
  }
});

router.use(async (req, res, next) => {
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
});

/*router.use(async (req, res, next) => {
  console.log(req.user);
  const tasks = await req.user.populate("tasks").execPopulate();
  console.log(req.app.id);
  req.app.io.to(`${req.app.id}`).emit("tasks", tasks);
});*/

module.exports = router;
