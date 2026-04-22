const { mysqlPool } = require('../config/db');

// Get all tasks for authenticated user
exports.getTasks = async (req, res, next) => {
  try {
    const { completed, priority, category, search, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.user.id];
    
    // Filters
    if (completed !== undefined) {
      query += ' AND completed = ?';
      params.push(completed === 'true');
    }
    
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Sorting
    const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'title'];
    const allowedOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    const [tasks] = await mysqlPool.query(query, params);
    
    res.json({ 
      tasks,
      count: tasks.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single task by ID
exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [tasks] = await mysqlPool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task: tasks[0] });
  } catch (error) {
    next(error);
  }
};

// Create new task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, due_date, category } = req.body;
    
    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }
    
    // Insert task
    const [result] = await mysqlPool.query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date, category) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title.trim(), description || null, priority || 'medium', due_date || null, category || null]
    );
    
    // Log activity
    await mysqlPool.query(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'TASK_CREATED', 'task', result.insertId, JSON.stringify({ title })]
    );
    
    // Get created task
    const [newTask] = await mysqlPool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Task created successfully',
      task: newTask[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, due_date, category } = req.body;
    
    // Check if task exists and belongs to user
    const [existingTasks] = await mysqlPool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: 'Task title cannot be empty' });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed);
      
      // Log completion
      if (completed && !existingTasks[0].completed) {
        await mysqlPool.query(
          'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'TASK_COMPLETED', 'task', id, JSON.stringify({ title: existingTasks[0].title })]
        );
      }
    }
    
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Priority must be low, medium, or high' });
      }
      updates.push('priority = ?');
      params.push(priority);
    }
    
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date);
    }
    
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(id, req.user.id);
    
    await mysqlPool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    // Get updated task
    const [updatedTask] = await mysqlPool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Task updated successfully',
      task: updatedTask[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if task exists and belongs to user
    const [existingTasks] = await mysqlPool.query(
      'SELECT title FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Delete task
    await mysqlPool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    // Log activity
    await mysqlPool.query(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'TASK_DELETED', 'task', id, JSON.stringify({ title: existingTasks[0].title })]
    );
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle task completion
exports.toggleComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get current task state
    const [tasks] = await mysqlPool.query(
      'SELECT completed, title FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const newCompletedState = !tasks[0].completed;
    
    // Update task
    await mysqlPool.query(
      'UPDATE tasks SET completed = ? WHERE id = ?',
      [newCompletedState, id]
    );
    
    // Log activity
    if (newCompletedState) {
      await mysqlPool.query(
        'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'TASK_COMPLETED', 'task', id, JSON.stringify({ title: tasks[0].title })]
      );
    }
    
    res.json({
      message: `Task marked as ${newCompletedState ? 'completed' : 'pending'}`,
      completed: newCompletedState
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks by category
exports.getTasksByCategory = async (req, res, next) => {
  try {
    const [tasks] = await mysqlPool.query(
      'SELECT category, COUNT(*) as count, SUM(completed) as completed_count FROM tasks WHERE user_id = ? AND category IS NOT NULL GROUP BY category',
      [req.user.id]
    );
    
    res.json({ categories: tasks });
  } catch (error) {
    next(error);
  }
};

// Get upcoming tasks (due in next 7 days)
exports.getUpcomingTasks = async (req, res, next) => {
  try {
    const [tasks] = await mysqlPool.query(
      `SELECT * FROM tasks 
       WHERE user_id = ? 
       AND completed = FALSE 
       AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY due_date ASC`,
      [req.user.id]
    );
    
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// Get overdue tasks
exports.getOverdueTasks = async (req, res, next) => {
  try {
    const [tasks] = await mysqlPool.query(
      `SELECT * FROM tasks 
       WHERE user_id = ? 
       AND completed = FALSE 
       AND due_date < CURDATE()
       ORDER BY due_date ASC`,
      [req.user.id]
    );
    
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};