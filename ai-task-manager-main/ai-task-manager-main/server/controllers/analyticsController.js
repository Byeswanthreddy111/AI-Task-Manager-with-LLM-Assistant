const { mysqlPool } = require('../config/db');

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Overall stats
    const [stats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(completed) as completed_tasks,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND completed = 0 THEN 1 ELSE 0 END) as overdue_tasks,
        SUM(CASE WHEN due_date = CURDATE() AND completed = 0 THEN 1 ELSE 0 END) as due_today,
        SUM(CASE WHEN due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND completed = 0 THEN 1 ELSE 0 END) as due_this_week
      FROM tasks 
      WHERE user_id = ?`,
      [req.user.id]
    );
    
    // Tasks by priority
    const [priorityStats] = await mysqlPool.query(
      `SELECT 
        priority,
        COUNT(*) as count,
        SUM(completed) as completed_count
      FROM tasks 
      WHERE user_id = ?
      GROUP BY priority`,
      [req.user.id]
    );
    
    // Tasks by category
    const [categoryStats] = await mysqlPool.query(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(completed) as completed_count
      FROM tasks 
      WHERE user_id = ? AND category IS NOT NULL
      GROUP BY category`,
      [req.user.id]
    );
    
    // Completion rate calculation
    const completionRate = stats[0].total_tasks > 0
      ? ((stats[0].completed_tasks / stats[0].total_tasks) * 100).toFixed(1)
      : 0;
    
    res.json({
      overview: {
        ...stats[0],
        completion_rate: parseFloat(completionRate)
      },
      byPriority: priorityStats,
      byCategory: categoryStats
    });
  } catch (error) {
    next(error);
  }
};

// Get task completion trend (last 7, 14, or 30 days)
exports.getCompletionTrend = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const daysInt = parseInt(days);
    
    if (![7, 14, 30].includes(daysInt)) {
      return res.status(400).json({ error: 'Days must be 7, 14, or 30' });
    }
    
    const [trend] = await mysqlPool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as tasks_created,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as tasks_completed
      FROM tasks
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [req.user.id, daysInt]
    );
    
    // Fill in missing dates with zeros
    const filledTrend = [];
    const today = new Date();
    
    for (let i = daysInt - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = trend.find(t => t.date === dateStr);
      filledTrend.push({
        date: dateStr,
        tasks_created: existing ? existing.tasks_created : 0,
        tasks_completed: existing ? existing.tasks_completed : 0
      });
    }
    
    res.json({ trend: filledTrend });
  } catch (error) {
    next(error);
  }
};

// Get activity timeline
exports.getActivityTimeline = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const [activities] = await mysqlPool.query(
      `SELECT 
        action,
        entity_type,
        entity_id,
        details,
        created_at
      FROM activity_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?`,
      [req.user.id, parseInt(limit)]
    );
    
    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

// Get productivity score (0-100)
exports.getProductivityScore = async (req, res, next) => {
  try {
    const [stats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(completed) as completed_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND completed = 0 THEN 1 ELSE 0 END) as overdue_tasks,
        SUM(CASE WHEN completed = 1 AND due_date IS NOT NULL AND updated_at <= due_date THEN 1 ELSE 0 END) as on_time_completions
      FROM tasks 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [req.user.id]
    );
    
    const stat = stats[0];
    
    // Calculate score based on multiple factors
    let score = 50; // Base score
    
    // Completion rate factor (max 30 points)
    if (stat.total_tasks > 0) {
      const completionRate = stat.completed_tasks / stat.total_tasks;
      score += completionRate * 30;
    }
    
    // Overdue penalty (max -20 points)
    if (stat.total_tasks > 0) {
      const overdueRate = stat.overdue_tasks / stat.total_tasks;
      score -= overdueRate * 20;
    }
    
    // On-time completion bonus (max 20 points)
    if (stat.completed_tasks > 0) {
      const onTimeRate = stat.on_time_completions / stat.completed_tasks;
      score += onTimeRate * 20;
    }
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Determine level
    let level = 'Getting Started';
    if (score >= 80) level = 'Excellent';
    else if (score >= 60) level = 'Good';
    else if (score >= 40) level = 'Fair';
    
    res.json({
      score,
      level,
      factors: {
        total_tasks: stat.total_tasks,
        completion_rate: stat.total_tasks > 0 
          ? ((stat.completed_tasks / stat.total_tasks) * 100).toFixed(1) 
          : 0,
        overdue_tasks: stat.overdue_tasks,
        on_time_completions: stat.on_time_completions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get weekly summary
exports.getWeeklySummary = async (req, res, next) => {
  try {
    // Tasks created this week
    const [weeklyStats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as tasks_created,
        SUM(completed) as tasks_completed,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as tasks_pending
      FROM tasks
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [req.user.id]
    );
    
    // Compare with previous week
    const [previousWeekStats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as tasks_created,
        SUM(completed) as tasks_completed
      FROM tasks
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [req.user.id]
    );
    
    // Most productive day
    const [productiveDays] = await mysqlPool.query(
      `SELECT 
        DAYNAME(created_at) as day_name,
        COUNT(*) as task_count,
        SUM(completed) as completed_count
      FROM tasks
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
      ORDER BY completed_count DESC, task_count DESC
      LIMIT 1`,
      [req.user.id]
    );
    
    // Calculate changes
    const createdChange = previousWeekStats[0].tasks_created > 0
      ? (((weeklyStats[0].tasks_created - previousWeekStats[0].tasks_created) / previousWeekStats[0].tasks_created) * 100).toFixed(1)
      : 0;
    
    const completedChange = previousWeekStats[0].tasks_completed > 0
      ? (((weeklyStats[0].tasks_completed - previousWeekStats[0].tasks_completed) / previousWeekStats[0].tasks_completed) * 100).toFixed(1)
      : 0;
    
    res.json({
      current_week: weeklyStats[0],
      previous_week: previousWeekStats[0],
      changes: {
        tasks_created: parseFloat(createdChange),
        tasks_completed: parseFloat(completedChange)
      },
      most_productive_day: productiveDays[0] || null
    });
  } catch (error) {
    next(error);
  }
};

// Get task distribution by time of day
exports.getTasksByTimeOfDay = async (req, res, next) => {
  try {
    const [distribution] = await mysqlPool.query(
      `SELECT 
        CASE
          WHEN HOUR(created_at) BETWEEN 0 AND 5 THEN 'Night (12AM-6AM)'
          WHEN HOUR(created_at) BETWEEN 6 AND 11 THEN 'Morning (6AM-12PM)'
          WHEN HOUR(created_at) BETWEEN 12 AND 17 THEN 'Afternoon (12PM-6PM)'
          ELSE 'Evening (6PM-12AM)'
        END as time_period,
        COUNT(*) as task_count
      FROM tasks
      WHERE user_id = ?
      GROUP BY time_period
      ORDER BY FIELD(time_period, 'Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)')`,
      [req.user.id]
    );
    
    res.json({ distribution });
  } catch (error) {
    next(error);
  }
};

// Export analytics data
exports.exportAnalytics = async (req, res, next) => {
  try {
    // Get all tasks
    const [tasks] = await mysqlPool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Get all activity
    const [activities] = await mysqlPool.query(
      'SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Get stats
    const [stats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(completed) as completed_tasks,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks
      FROM tasks 
      WHERE user_id = ?`,
      [req.user.id]
    );
    
    res.json({
      export_date: new Date().toISOString(),
      statistics: stats[0],
      tasks: tasks,
      activity_log: activities
    });
  } catch (error) {
    next(error);
  }
};