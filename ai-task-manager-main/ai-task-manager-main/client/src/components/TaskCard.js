import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleTaskComplete, deleteTask } from '../redux/slices/taskSlice';

const TaskCard = ({ task, onEdit }) => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleTaskComplete(task.id));
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task.id));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !task.completed;
  };

  return (
    <div className={`card hover:shadow-lg transition-shadow ${task.completed ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className="mt-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
          }`}>
            {task.completed && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold mb-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            
            {task.category && (
              <span className="badge bg-purple-100 text-purple-800">
                {task.category}
              </span>
            )}
            
            {task.due_date && (
              <span className={`badge ${
                isOverdue(task.due_date)
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                📅 {formatDate(task.due_date)}
                {isOverdue(task.due_date) && ' (Overdue)'}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(task)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;