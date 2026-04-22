CREATE DATABASE IF NOT EXISTS taskdb;
USE taskdb;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed),
    INDEX idx_due_date (due_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Task Categories Table (Optional)
-- ============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Refresh Tokens Table (for authentication)
-- ============================================
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Activity Log Table (Optional - for analytics)
-- ============================================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Views for Analytics
-- ============================================

-- View: Task completion statistics by user
CREATE OR REPLACE VIEW task_stats AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.completed = TRUE THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN t.completed = FALSE THEN 1 ELSE 0 END) AS pending_tasks,
    SUM(CASE WHEN t.due_date < CURDATE() AND t.completed = FALSE THEN 1 ELSE 0 END) AS overdue_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.name;

-- View: Tasks by category
CREATE OR REPLACE VIEW tasks_by_category AS
SELECT 
    t.user_id,
    t.category,
    COUNT(*) AS task_count,
    SUM(CASE WHEN t.completed = TRUE THEN 1 ELSE 0 END) AS completed_count
FROM tasks t
WHERE t.category IS NOT NULL
GROUP BY t.user_id, t.category;

-- ============================================
-- Stored Procedures (Optional)
-- ============================================

DELIMITER //

-- Procedure: Get user dashboard stats
CREATE PROCEDURE GetUserDashboardStats(IN p_user_id INT)
BEGIN
    SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND completed = FALSE THEN 1 ELSE 0 END) AS overdue_tasks,
        SUM(CASE WHEN due_date = CURDATE() AND completed = FALSE THEN 1 ELSE 0 END) AS due_today
    FROM tasks
    WHERE user_id = p_user_id;
END //

-- Procedure: Archive old completed tasks
CREATE PROCEDURE ArchiveOldTasks(IN days_old INT)
BEGIN
    -- This would move old tasks to an archive table
    -- For now, just delete tasks completed more than X days ago
    DELETE FROM tasks 
    WHERE completed = TRUE 
    AND updated_at < DATE_SUB(NOW(), INTERVAL days_old DAY);
    
    SELECT ROW_COUNT() AS archived_count;
END //

DELIMITER ;

-- ============================================
-- Sample Indexes for Performance
-- ============================================

-- Composite index for common queries
CREATE INDEX idx_user_completed_created ON tasks(user_id, completed, created_at);

-- Full-text search index on task title and description
-- (Only if you need search functionality)
-- ALTER TABLE tasks ADD FULLTEXT INDEX ft_title_description (title, description);

-- ============================================
-- Triggers (Optional - for automatic logging)
-- ============================================

DELIMITER //

CREATE TRIGGER after_task_insert
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'TASK_CREATED', 'task', NEW.id, JSON_OBJECT('title', NEW.title));
END //

CREATE TRIGGER after_task_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF OLD.completed = FALSE AND NEW.completed = TRUE THEN
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
        VALUES (NEW.user_id, 'TASK_COMPLETED', 'task', NEW.id, JSON_OBJECT('title', NEW.title));
    END IF;
END //

DELIMITER ;

-- ============================================
-- Grant Permissions (adjust as needed)
-- ============================================

-- Example: Create a specific database user (uncomment if needed)
-- CREATE USER IF NOT EXISTS 'taskapp'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON taskdb.* TO 'taskapp'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- Verification Queries
-- ============================================

-- Show all tables
SHOW TABLES;

-- Describe tables structure
DESCRIBE users;
DESCRIBE tasks;
DESCRIBE categories;

-- Show indexes
SHOW INDEX FROM tasks;

-- ============================================
-- End of Schema
-- ============================================