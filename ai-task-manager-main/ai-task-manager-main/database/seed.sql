-- ============================================
-- AI Task Manager - Seed Data
-- Sample data for testing
-- ============================================

USE taskdb;

-- ============================================
-- Insert Sample Users
-- Note: Password is 'password123' hashed with bcrypt
-- You should generate real hashes using bcrypt
-- ============================================

-- Password hash for 'password123' (10 rounds)
-- In production, generate using: bcrypt.hash('password123', 10)
SET @password_hash = '$2b$10$rKzIqJ9GzE8V8XvJxHxLSejYQ0hVV5F5fZxLGxNjxFqVQ5xVvxLGm';

INSERT INTO users (name, email, password) VALUES
('John Doe', 'john@example.com', @password_hash),
('Jane Smith', 'jane@example.com', @password_hash),
('Bob Wilson', 'bob@example.com', @password_hash),
('Alice Johnson', 'alice@example.com', @password_hash);

-- ============================================
-- Insert Sample Categories
-- ============================================

INSERT INTO categories (user_id, name, color) VALUES
-- John's categories
(1, 'Work', '#3B82F6'),
(1, 'Personal', '#10B981'),
(1, 'Shopping', '#F59E0B'),
(1, 'Health', '#EF4444'),

-- Jane's categories
(2, 'Project A', '#8B5CF6'),
(2, 'Project B', '#EC4899'),
(2, 'Learning', '#06B6D4'),

-- Bob's categories
(3, 'Home', '#14B8A6'),
(3, 'Office', '#6366F1');

-- ============================================
-- Insert Sample Tasks
-- ============================================

-- John's tasks
INSERT INTO tasks (user_id, title, description, completed, priority, due_date, category) VALUES
(1, 'Complete project proposal', 'Write and submit the Q4 project proposal document', FALSE, 'high', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Work'),
(1, 'Team meeting preparation', 'Prepare slides for Monday team meeting', FALSE, 'medium', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Work'),
(1, 'Code review', 'Review pull requests from team members', TRUE, 'medium', CURDATE(), 'Work'),
(1, 'Buy groceries', 'Milk, bread, eggs, vegetables', FALSE, 'low', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Shopping'),
(1, 'Gym workout', 'Chest and triceps day', FALSE, 'medium', CURDATE(), 'Health'),
(1, 'Read documentation', 'Study React 19 new features', FALSE, 'low', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Personal'),
(1, 'Fix login bug', 'Debug the authentication issue reported by users', TRUE, 'high', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Work'),
(1, 'Update resume', 'Add recent projects and skills', FALSE, 'medium', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Personal');

-- Jane's tasks
INSERT INTO tasks (user_id, title, description, completed, priority, due_date, category) VALUES
(2, 'Client presentation', 'Prepare demo for client meeting', FALSE, 'high', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Project A'),
(2, 'Database optimization', 'Optimize slow queries in production database', FALSE, 'high', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Project B'),
(2, 'Learn TypeScript', 'Complete TypeScript course on Udemy', FALSE, 'medium', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Learning'),
(2, 'Write unit tests', 'Add tests for authentication module', TRUE, 'medium', CURDATE(), 'Project A'),
(2, 'Deploy to staging', 'Deploy latest changes to staging environment', TRUE, 'high', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Project B'),
(2, 'Update documentation', 'Document new API endpoints', FALSE, 'low', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Project A');

-- Bob's tasks
INSERT INTO tasks (user_id, title, description, completed, priority, due_date, category) VALUES
(3, 'Fix kitchen sink', 'Call plumber or try DIY fix', FALSE, 'high', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Home'),
(3, 'Quarterly report', 'Prepare Q3 financial report', FALSE, 'high', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Office'),
(3, 'Paint living room', 'Buy paint and complete living room painting', FALSE, 'low', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Home'),
(3, 'Budget planning', 'Plan budget for next quarter', TRUE, 'medium', CURDATE(), 'Office');

-- Alice's tasks (fewer tasks)
INSERT INTO tasks (user_id, title, description, completed, priority, due_date, category) VALUES
(4, 'Morning jog', 'Run 5km in the park', TRUE, 'medium', CURDATE(), NULL),
(4, 'Call mom', 'Weekly check-in call with mom', FALSE, 'high', CURDATE(), NULL),
(4, 'Learn Spanish', 'Practice Spanish on Duolingo', FALSE, 'low', DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL);

-- ============================================
-- Insert Sample Activity Logs
-- ============================================

INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES
(1, 'TASK_COMPLETED', 'task', 3, JSON_OBJECT('title', 'Code review')),
(1, 'TASK_COMPLETED', 'task', 7, JSON_OBJECT('title', 'Fix login bug')),
(2, 'TASK_COMPLETED', 'task', 4, JSON_OBJECT('title', 'Write unit tests')),
(2, 'TASK_COMPLETED', 'task', 5, JSON_OBJECT('title', 'Deploy to staging')),
(3, 'TASK_COMPLETED', 'task', 4, JSON_OBJECT('title', 'Budget planning')),
(4, 'TASK_COMPLETED', 'task', 1, JSON_OBJECT('title', 'Morning jog'));

-- ============================================
-- Verification Queries
-- ============================================

-- Count users
SELECT COUNT(*) AS total_users FROM users;

-- Count tasks
SELECT COUNT(*) AS total_tasks FROM tasks;

-- Count completed tasks
SELECT COUNT(*) AS completed_tasks FROM tasks WHERE completed = TRUE;

-- Tasks by user
SELECT 
    u.name,
    COUNT(t.id) AS task_count,
    SUM(CASE WHEN t.completed THEN 1 ELSE 0 END) AS completed_count
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.name;

-- Upcoming tasks (next 7 days)
SELECT 
    u.name AS user_name,
    t.title,
    t.priority,
    t.due_date,
    DATEDIFF(t.due_date, CURDATE()) AS days_until_due
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.completed = FALSE
  AND t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY t.due_date ASC;

-- Overdue tasks
SELECT 
    u.name AS user_name,
    t.title,
    t.priority,
    t.due_date,
    DATEDIFF(CURDATE(), t.due_date) AS days_overdue
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.completed = FALSE
  AND t.due_date < CURDATE()
ORDER BY t.due_date ASC;

-- ============================================
-- End of Seed Data
-- ============================================