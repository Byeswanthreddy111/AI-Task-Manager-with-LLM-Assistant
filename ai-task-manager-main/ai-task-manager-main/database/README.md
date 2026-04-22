# Database Documentation

## Overview

This folder contains MySQL database schema, seed data, and documentation for the AI Task Manager application.

## Files

- **schema.sql** - Database schema with tables, indexes, views, and triggers
- **seed.sql** - Sample data for testing and development
- **README.md** - This file

## Database Structure

### Tables

#### 1. users

Stores user account information

- `id` - Primary key
- `name` - User's full name
- `email` - Unique email for login
- `password` - Bcrypt hashed password
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

#### 2. tasks

Stores user tasks

- `id` - Primary key
- `user_id` - Foreign key to users table
- `title` - Task title (required)
- `description` - Detailed description
- `completed` - Boolean completion status
- `priority` - Enum: low, medium, high
- `due_date` - Optional due date
- `category` - Optional category name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### 3. categories

User-defined task categories

- `id` - Primary key
- `user_id` - Foreign key to users table
- `name` - Category name
- `color` - Hex color code for UI
- `created_at` - Creation timestamp

#### 4. refresh_tokens

JWT refresh tokens for authentication

- `id` - Primary key
- `user_id` - Foreign key to users table
- `token` - Refresh token string
- `expires_at` - Expiration timestamp
- `created_at` - Creation timestamp

#### 5. activity_log

Logs user actions for analytics

- `id` - Primary key
- `user_id` - Foreign key to users table
- `action` - Action type (e.g., TASK_CREATED)
- `entity_type` - Type of entity affected
- `entity_id` - ID of affected entity
- `details` - JSON field with additional info
- `created_at` - Action timestamp

### Views

#### task_stats

Aggregated task statistics by user

- total_tasks
- completed_tasks
- pending_tasks
- overdue_tasks

#### tasks_by_category

Task counts grouped by category

### Stored Procedures

#### GetUserDashboardStats(user_id)

Returns dashboard statistics for a specific user

#### ArchiveOldTasks(days_old)

Archives or deletes completed tasks older than specified days

### Triggers

#### after_task_insert

Logs task creation to activity_log

#### after_task_update

Logs task completion to activity_log

## Setup Instructions

### 1. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Run schema
mysql -u root -p < database/schema.sql

# Or in MySQL Workbench:
# File → Open SQL Script → Select schema.sql → Execute
```

### 2. Load Sample Data (Optional)

```bash
# Load seed data
mysql -u root -p taskdb < database/seed.sql

# Or in MySQL Workbench:
# File → Open SQL Script → Select seed.sql → Execute
```

### 3. Verify Setup

```sql
USE taskdb;

-- Show all tables
SHOW TABLES;

-- Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tasks;

-- Test view
SELECT * FROM task_stats;
```

## Sample Login Credentials (from seed.sql)

All sample users have password: `password123`

- john@example.com / password123
- jane@example.com / password123
- bob@example.com / password123
- alice@example.com / password123

**Note:** These are for development only. Change in production!

## Indexes

The schema includes indexes for optimal query performance:

- `idx_email` on users.email (login queries)
- `idx_user_id` on tasks.user_id (user's tasks)
- `idx_completed` on tasks.completed (filtering)
- `idx_due_date` on tasks.due_date (sorting)
- Composite index `idx_user_completed_created` for common queries

## Maintenance

### Backup Database

```bash
# Backup all data
mysqldump -u root -p taskdb > backup_$(date +%Y%m%d).sql

# Backup structure only
mysqldump -u root -p --no-data taskdb > structure.sql
```

### Restore Database

```bash
mysql -u root -p taskdb < backup_20240101.sql
```

### Archive Old Tasks

```sql
-- Archive tasks completed more than 90 days ago
CALL ArchiveOldTasks(90);
```

### Reset Database

```bash
# Drop and recreate (WARNING: deletes all data)
mysql -u root -p -e "DROP DATABASE IF EXISTS taskdb;"
mysql -u root -p < database/schema.sql
mysql -u root -p taskdb < database/seed.sql
```

## Common Queries

### Get User's Pending Tasks

```sql
SELECT * FROM tasks
WHERE user_id = 1 AND completed = FALSE
ORDER BY due_date ASC;
```

### Get Today's Tasks

```sql
SELECT * FROM tasks
WHERE user_id = 1
  AND due_date = CURDATE()
  AND completed = FALSE;
```

### Get Overdue Tasks

```sql
SELECT * FROM tasks
WHERE user_id = 1
  AND due_date < CURDATE()
  AND completed = FALSE;
```

### Task Completion Rate

```sql
SELECT
  user_id,
  COUNT(*) as total,
  SUM(completed) as completed,
  ROUND(SUM(completed) / COUNT(*) * 100, 2) as completion_rate
FROM tasks
GROUP BY user_id;
```

### Recent Activity

```sql
SELECT
  u.name,
  a.action,
  a.details,
  a.created_at
FROM activity_log a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;
```

## Performance Tips

1. **Use Indexes**: Already configured for common queries
2. **Limit Results**: Always use LIMIT in queries returning many rows
3. **Archive Old Data**: Regularly run ArchiveOldTasks procedure
4. **Monitor Slow Queries**: Enable MySQL slow query log
5. **Connection Pooling**: Use connection pools in application code

## Security Notes

1. **Never commit .env** with real passwords
2. **Use strong passwords** in production
3. **Restrict database user permissions** to only what's needed
4. **Regular backups** are essential
5. **Update MySQL** to latest secure version

## Troubleshooting

### Can't connect to database

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials in .env
cat server/.env | grep MYSQL
```

### Permission denied

```sql
-- Grant permissions to user
GRANT ALL PRIVILEGES ON taskdb.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Foreign key constraint fails

```sql
-- Check if parent records exist
SELECT * FROM users WHERE id = 1;

-- Disable foreign key checks temporarily (not recommended)
SET FOREIGN_KEY_CHECKS = 0;
-- Run your query
SET FOREIGN_KEY_CHECKS = 1;
```

## Contact

For database-related questions, refer to the main project README or create an issue on GitHub.
