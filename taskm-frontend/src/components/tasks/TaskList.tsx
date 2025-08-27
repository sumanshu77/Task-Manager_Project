import React, { useState } from 'react';
import { useTasks } from '../../contexts/useTasks';
import { useAuth } from '../../contexts/useAuth';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { TaskFilters } from './TaskFilters';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Search, Filter } from 'lucide-react';
import { Task } from '../../contexts/TaskContext';

export const TaskList: React.FC = () => {
  const { state, reorderTasks } = useTasks();
  const { state: authState } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Build list of assignees for admin filter (populated inline in JSX)

  // Filter tasks based on search and filters
  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || String(task.assigneeId) === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Group tasks by status
  const taskColumns = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = state.tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    // Update task status based on column
    const newStatus = over.id as 'todo' | 'in-progress' | 'completed';
    if (activeTask.status !== newStatus) {
      const updatedTask = { ...activeTask, status: newStatus };
      const updatedTasks = state.tasks.map(task =>
        task.id === activeTask.id ? updatedTask : task
      );
      reorderTasks(updatedTasks);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-orange-50 border-orange-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getColumnTitle = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track your tasks efficiently</p>
        </div>
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {authState.user?.role === 'admin' && (
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2 border rounded-lg mr-3">
                <option value="all">All users</option>
                {Array.from(new Map(state.tasks.map(t => [t.assigneeId, t.assigneeName]))).map(([id, name]) => (
                  <option key={id} value={String(id)}>{name || `User ${id}`}</option>
                ))}
              </select>
            )}
            <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              showFilters 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          </div>
        </div>

        {showFilters && (
          <TaskFilters
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
          />
        )}
      </div>

      {/* Task Board */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(taskColumns).map(([status, tasks]) => (
            <div key={status} className={`rounded-xl border-2 border-dashed p-4 ${getColumnColor(status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {getColumnTitle(status)}
                </h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                  {tasks.length}
                </span>
              </div>
              
              <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => handleEditTask(task)}
                      isAdmin={authState.user?.role === 'admin'}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
      />
    </div>
  );
};