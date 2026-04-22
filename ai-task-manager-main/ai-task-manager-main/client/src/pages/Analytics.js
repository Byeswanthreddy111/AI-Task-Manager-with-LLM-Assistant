import React, { useEffect, useState, useCallback } from 'react';
import api from '../config/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loading from '../components/Loading';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trendRes, scoreRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics/trend?days=${selectedPeriod}`),
        api.get('/analytics/score'),
      ]);
      
      setStats(statsRes.data);
      setTrend(trendRes.data.trend);
      setScore(scoreRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <Loading fullScreen message="Loading analytics..." />;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Prepare data for charts
  const priorityData = stats?.byPriority?.map(item => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: item.count,
  })) || [];

  const categoryData = stats?.byCategory?.map(item => ({
    name: item.category,
    total: item.count,
    completed: item.completed_count,
  })) || [];

  const completionRate = stats?.overview?.completion_rate || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h1>
        <p className="text-gray-600">Track your productivity and task completion</p>
      </div>

      {/* Productivity Score */}
      {score && (
        <div className="card mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90 mb-1">Productivity Score</h3>
              <p className="text-4xl font-bold mb-2">{score.score}/100</p>
              <p className="text-sm opacity-90">Level: {score.level}</p>
            </div>
            <div className="text-6xl">🎯</div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Completion Rate</h3>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-blue-600">{completionRate}%</p>
            <p className="ml-2 text-sm text-gray-500">of all tasks</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Completed</h3>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-green-600">{stats?.overview?.completed_tasks || 0}</p>
            <p className="ml-2 text-sm text-gray-500">tasks done</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Tasks</h3>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-yellow-600">{stats?.overview?.pending_tasks || 0}</p>
            <p className="ml-2 text-sm text-gray-500">to complete</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Priority Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No data available</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No categories found</p>
          )}
        </div>
      </div>

      {/* Completion Trend */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Task Completion Trend</h3>
          <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedPeriod === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
        
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
              <Legend />
              <Line type="monotone" dataKey="tasks_created" stroke="#3B82F6" name="Created" />
              <Line type="monotone" dataKey="tasks_completed" stroke="#10B981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-12">Not enough data yet</p>
        )}
      </div>

      {/* Insights */}
      <div className="mt-8 card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Quick Insights</h3>
        <ul className="space-y-2 text-blue-800">
          {stats?.overview?.overdue_tasks > 0 && (
            <li>• You have {stats.overview.overdue_tasks} overdue task{stats.overview.overdue_tasks > 1 ? 's' : ''}. Consider prioritizing them!</li>
          )}
          {completionRate >= 80 && (
            <li>• Great job! You're maintaining an excellent completion rate of {completionRate}%</li>
          )}
          {completionRate < 50 && (
            <li>• Your completion rate is {completionRate}%. Try breaking tasks into smaller, manageable pieces.</li>
          )}
          {stats?.overview?.due_today > 0 && (
            <li>• You have {stats.overview.due_today} task{stats.overview.due_today > 1 ? 's' : ''} due today. Stay focused!</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Analytics;