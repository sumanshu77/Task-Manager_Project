const AppDataSource = require('../data-source');
const WFH = require('../entities/WFH');

exports.getAllWFH = async (req, res) => {
  try {
    const wfhRepo = AppDataSource.getRepository(WFH);
    const rows = await wfhRepo.find({ order: { appliedAt: 'DESC' } });
    const formatted = rows.map(r => ({
      id: r.id,
      userId: r.userId,
      startDate: r.startDate instanceof Date ? r.startDate.toISOString().split('T')[0] : r.startDate,
      endDate: r.endDate instanceof Date ? r.endDate.toISOString().split('T')[0] : r.endDate,
      hoursPerDay: r.hoursPerDay || null,
      workLocation: r.workLocation || null,
      status: r.status,
      appliedAt: r.appliedAt instanceof Date ? r.appliedAt.toISOString() : r.appliedAt,
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching WFH requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserWFH = async (req, res) => {
  try {
    const userId = req.user.id;
    const wfhRepo = AppDataSource.getRepository(WFH);
    const rows = await wfhRepo.find({ where: { userId }, order: { appliedAt: 'DESC' } });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user WFH:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createWFH = async (req, res) => {
  try {
    const userId = req.user.id;
    const wfhRepo = AppDataSource.getRepository(WFH);
    const { startDate, endDate, hoursPerDay, workLocation } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate are required' });

    const rec = wfhRepo.create({ userId, startDate, endDate, hoursPerDay: hoursPerDay || null, workLocation: workLocation || null, status: 'pending' });
    await wfhRepo.save(rec);
    const out = {
      id: rec.id,
      userId: rec.userId,
      startDate: rec.startDate instanceof Date ? rec.startDate.toISOString().split('T')[0] : rec.startDate,
      endDate: rec.endDate instanceof Date ? rec.endDate.toISOString().split('T')[0] : rec.endDate,
      hoursPerDay: rec.hoursPerDay || null,
      workLocation: rec.workLocation || null,
      status: rec.status,
      appliedAt: rec.appliedAt instanceof Date ? rec.appliedAt.toISOString() : rec.appliedAt,
    };
    res.status(201).json(out);
  } catch (err) {
    console.error('Error creating WFH:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body; // approved/rejected
    const wfhRepo = AppDataSource.getRepository(WFH);
    const rec = await wfhRepo.findOneBy({ id });
    if (!rec) return res.status(404).json({ message: 'WFH request not found' });
    rec.status = status;
    await wfhRepo.save(rec);
    // create notification for user
    try {
      const Notification = require('../entities/Notification');
      const notifRepo = AppDataSource.getRepository(Notification);
      const msg = `Your WFH request (${rec.startDate} → ${rec.endDate}) has been ${status}.`;
      const note = notifRepo.create({ userId: rec.userId, message: msg, data: JSON.stringify({ type: 'wfh', id: rec.id }), read: false });
      await notifRepo.save(note);
    } catch (nerr) {
      console.warn('Failed to create notification:', nerr.message || nerr);
    }

    res.json(rec);
  } catch (err) {
    console.error('Error updating WFH status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
