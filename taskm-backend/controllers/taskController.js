
const AppDataSource = require('../data-source');
const Task = require('../entities/Task');

exports.getTasks = async (req, res) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const user = req.user || {};
    // If admin, return all tasks; otherwise return tasks assigned to the user
    if (user.role === 'admin') {
      const tasks = await taskRepository.find({ order: { createdAt: 'DESC' } });
      return res.json(tasks);
    }

    const userId = user.id;
    const tasks = await taskRepository.find({ where: { assigneeId: userId }, order: { createdAt: 'DESC' } });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const newTask = taskRepository.create(req.body);
    await taskRepository.save(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const { id } = req.params;
    let task = await taskRepository.findOneBy({ id: parseInt(id) });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    taskRepository.merge(task, req.body);
    const updatedTask = await taskRepository.save(task);
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const { id } = req.params;
    const result = await taskRepository.delete(parseInt(id));
    if (result.affected === 0) return res.status(404).json({ message: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
