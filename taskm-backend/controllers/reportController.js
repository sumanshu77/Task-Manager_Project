const AppDataSource = require('../data-source');

exports.tasksReport = async (req, res) => {
  try {
    // tasks by status
    const tasksByStatus = await AppDataSource.query("SELECT status, COUNT(*)::int AS count FROM tasks GROUP BY status ORDER BY count DESC");
    // tasks by assignee
    const tasksByAssignee = await AppDataSource.query("SELECT assignee_name AS name, COUNT(*)::int AS count FROM tasks GROUP BY assignee_name ORDER BY count DESC");
    res.json({ tasksByStatus, tasksByAssignee });
  } catch (err) {
    console.error('Error generating tasks report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.attendanceReport = async (req, res) => {
  try {
    // counts of present/absent for last 30 days
    const attendanceCounts = await AppDataSource.query(`SELECT status, COUNT(*)::int AS count FROM attendance WHERE date >= CURRENT_DATE - 30 GROUP BY status`);
    res.json({ attendanceCounts });
  } catch (err) {
    console.error('Error generating attendance report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leavesReport = async (req, res) => {
  try {
    const leavesByType = await AppDataSource.query("SELECT type, COUNT(*)::int AS count FROM leave_requests GROUP BY type ORDER BY count DESC");
    const leavesByStatus = await AppDataSource.query("SELECT status, COUNT(*)::int AS count FROM leave_requests GROUP BY status ORDER BY count DESC");
    res.json({ leavesByType, leavesByStatus });
  } catch (err) {
    console.error('Error generating leaves report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.wfhReport = async (req, res) => {
  try {
    const wfhByStatus = await AppDataSource.query("SELECT status, COUNT(*)::int AS count FROM wfh_requests GROUP BY status ORDER BY count DESC");
    res.json({ wfhByStatus });
  } catch (err) {
    console.error('Error generating wfh report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.usersReport = async (req, res) => {
  try {
    const rows = await AppDataSource.query(`
      SELECT u.id, u.name, u.email,
        COALESCE(t.tasks_count,0) as tasks_count,
        COALESCE(l.leaves_count,0) as leaves_count,
        COALESCE(w.wfh_count,0) as wfh_count,
        COALESCE(a.present_count,0) as present_count
      FROM users u
      LEFT JOIN (
        SELECT assignee_id, COUNT(*) as tasks_count FROM tasks GROUP BY assignee_id
      ) t ON t.assignee_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as leaves_count FROM leave_requests GROUP BY user_id
      ) l ON l.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as wfh_count FROM wfh_requests GROUP BY user_id
      ) w ON w.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as present_count FROM attendance WHERE date >= CURRENT_DATE - 30 AND status = 'present' GROUP BY user_id
      ) a ON a.user_id = u.id
      ORDER BY u.name
    `);

    res.json({ users: rows });
  } catch (err) {
    console.error('Error generating users report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
