const AppDataSource = require('../data-source');
const Notification = require('../entities/Notification');

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(Notification);
    const rows = await repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    res.json(rows.map(r => ({ id: r.id, message: r.message, data: r.data ? JSON.parse(r.data) : null, read: r.read, createdAt: r.createdAt })));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const repo = AppDataSource.getRepository(Notification);
    const rec = await repo.findOneBy({ id, userId });
    if (!rec) return res.status(404).json({ message: 'Notification not found' });
    rec.read = true;
    await repo.save(rec);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
