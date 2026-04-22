import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, fetchDashboardStats, setFilters } from '../redux/slices/taskSlice';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Loading from '../components/Loading';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { tasks, stats, loading, filters } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterView, setFilterView] = useState('all'); // all, pending, completed

  useEffect(() => {
    dispatch(fetchTasks(filters));
    dispatch(fetchDashboardStats());
  }, [dispatch, filters]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    dispatch(fetchTasks(filters));
    dispatch(fetchDashboardStats());
  };

  const handleFilterChange = (newFilter) => {
    setFilterView(newFilter);
    if (newFilter === 'all') {
      dispatch(setFilters({ completed: null }));
    } else if (newFilter === 'pending') {
      dispatch(setFilters({ completed: 'false' }));
    } else if (newFilter === 'completed') {
      dispatch(setFilters({ completed: 'true' }));
    }
  };

  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const filteredTasks = tasks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Here's what you have on your plate today</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Tasks</h3>
            <p className="text-3xl font-bold">{stats.overview?.total_tasks || 0}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-1">Completed</h3>
            <p className="text-3xl font-bold">{stats.overview?.completed_tasks || 0}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-1">Pending</h3>
            <p className="text-3xl font-bold">{stats.overview?.pending_tasks || 0}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-1">Overdue</h3>
            <p className="text-3xl font-bold">{stats.overview?.overdue_tasks || 0}</p>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleCreateTask}
          className="btn-primary"
        >
          + Create New Task
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tasks..."
          onChange={handleSearchChange}
          className="input-field flex-1"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'pending', 'completed'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterView === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <Loading message="Loading tasks..." />
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-6">
            {filterView === 'all'
              ? "Get started by creating your first task"
              : `No ${filterView} tasks at the moment`}
          </p>
          {filterView === 'all' && (
            <button onClick={handleCreateTask} className="btn-primary">
              Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
};

export default Dashboard;