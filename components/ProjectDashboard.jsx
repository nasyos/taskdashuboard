'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, AlertCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '' });
  const [newProject, setNewProject] = useState({ name: '', color: '#3b82f6' });
  const [expandedTask, setExpandedTask] = useState(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const statusLabels = {
    'not-started': '未着手',
    'in-progress': '進行中',
    'completed': '完了',
    'on-hold': '保留'
  };

  const priorityLabels = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };

  const statusColors = {
    'not-started': 'bg-slate-100 text-slate-700 border border-slate-300',
    'in-progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    'completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'on-hold': 'bg-amber-50 text-amber-700 border border-amber-200'
  };

  const priorityColors = {
    'high': 'bg-rose-50 text-rose-700 border border-rose-200',
    'medium': 'bg-amber-50 text-amber-700 border border-amber-200',
    'low': 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  };

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const projectsWithTasks = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: true });

          const tasksWithChecklists = await Promise.all(
            (tasksData || []).map(async (task) => {
              const { data: checklistData } = await supabase
                .from('checklist_items')
                .select('*')
                .eq('task_id', task.id)
                .order('created_at', { ascending: true });

              return {
                ...task,
                checklist: checklistData || []
              };
            })
          );

          return {
            ...project,
            tasks: tasksWithChecklists
          };
        })
      );

      setProjects(projectsWithTasks);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (tasks) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getStatusCount = (tasks, status) => {
    return tasks.filter(t => t.status === status).length;
  };

  const addTask = async (projectId) => {
    if (!newTask.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            project_id: projectId,
            title: newTask.title,
            priority: newTask.priority,
            due_date: newTask.dueDate || null,
            status: 'not-started',
            description: '',
            requirements: '',
            notes: ''
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await loadProjects();
      setNewTask({ title: '', priority: 'medium', dueDate: '' });
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const addProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            color: newProject.color
          }
        ]);

      if (error) throw error;

      await loadProjects();
      setNewProject({ name: '', color: '#3b82f6' });
      setIsAddingProject(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const updateTaskStatus = async (projectId, taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateTaskDetails = async (projectId, taskId, field, value) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ [field]: value })
        .eq('id', taskId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (projectId, taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadProjects();
      if (expandedTask === taskId) setExpandedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const addChecklistItem = async (projectId, taskId, text) => {
    if (!text.trim()) return;

    try {
      const { error } = await supabase
        .from('checklist_items')
        .insert([
          {
            task_id: taskId,
            text: text,
            completed: false
          }
        ]);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const toggleChecklistItem = async (projectId, taskId, checklistItemId) => {
    try {
      const task = projects
        .find(p => p.id === projectId)
        ?.tasks.find(t => t.id === taskId);
      const item = task?.checklist.find(i => i.id === checklistItemId);

      if (!item) return;

      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: !item.completed })
        .eq('id', checklistItemId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error toggling checklist item:', error);
    }
  };

  const deleteChecklistItem = async (projectId, taskId, checklistItemId) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', checklistItemId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const filteredTasks = (tasks) => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(t => t.status === filterStatus);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-light tracking-wide">読込中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
        }
        
        .font-mono-custom {
          font-family: 'Space Mono', monospace;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }

        .gradient-border {
          position: relative;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(168, 85, 247, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px rgba(34, 211, 238, 0.1);
        }

        .glass-effect {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-12">
        {/* ヘッダー */}
        <div className="mb-12 animate-fadeInUp">
          <div className="flex items-end gap-4 mb-3">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-mono-custom tracking-tight">
              PROJECT
            </h1>
            <div className="h-2 w-2 bg-cyan-400 rounded-full mb-4 animate-pulse"></div>
          </div>
          <p className="text-slate-400 text-lg font-light tracking-wide">複数プロジェクトの進捗を一元管理</p>
        </div>

        {/* プロジェクト追加ボタン */}
        <div className="mb-8 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
          {!isAddingProject ? (
            <button
              onClick={() => setIsAddingProject(true)}
              className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 font-medium"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              新規プロジェクト追加
            </button>
          ) : (
            <div className="glass-effect p-6 rounded-2xl border-2 border-cyan-500/30 shadow-xl">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">プロジェクト名</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all"
                    placeholder="プロジェクト名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">カラー</label>
                  <input
                    type="color"
                    value={newProject.color}
                    onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                    className="h-12 w-24 border border-slate-600 rounded-xl cursor-pointer bg-slate-800"
                  />
                </div>
                <button
                  onClick={addProject}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-400 hover:to-teal-500 flex items-center gap-2 transition-all duration-300 font-medium shadow-lg"
                >
                  <Check size={18} />
                  追加
                </button>
                <button
                  onClick={() => {
                    setIsAddingProject(false);
                    setNewProject({ name: '', color: '#3b82f6' });
                  }}
                  className="px-6 py-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 flex items-center gap-2 transition-all duration-300 font-medium"
                >
                  <X size={18} />
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* プロジェクト概要カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {projects.map((project, index) => {
            const progress = calculateProgress(project.tasks);
            const notStarted = getStatusCount(project.tasks, 'not-started');
            const inProgress = getStatusCount(project.tasks, 'in-progress');
            const completed = getStatusCount(project.tasks, 'completed');
            const onHold = getStatusCount(project.tasks, 'on-hold');

            return (
              <div
                key={project.id}
                className="gradient-border rounded-2xl p-6 cursor-pointer card-hover animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full shadow-lg"
                      style={{ 
                        backgroundColor: project.color,
                        boxShadow: `0 0 20px ${project.color}50`
                      }}
                    />
                    <h3 className="text-lg font-semibold text-slate-100 tracking-wide">{project.name}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`${project.name}を削除しますか?`)) {
                        deleteProject(project.id);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-sm text-slate-400 mb-2 font-light">
                    <span>進捗率</span>
                    <span className="font-semibold text-cyan-400 font-mono-custom">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 shadow-lg"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)`,
                        boxShadow: `0 0 10px ${project.color}80`
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                  <div className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-slate-400 font-light">未着手</span>
                    <span className="font-semibold text-slate-300 font-mono-custom">{notStarted}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-500/20">
                    <span className="text-blue-400 font-light">進行中</span>
                    <span className="font-semibold text-blue-300 font-mono-custom">{inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-500/20">
                    <span className="text-emerald-400 font-light">完了</span>
                    <span className="font-semibold text-emerald-300 font-mono-custom">{completed}</span>
                  </div>
                  <div className="flex items-center justify-between bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-500/20">
                    <span className="text-amber-400 font-light">保留</span>
                    <span className="font-semibold text-amber-300 font-mono-custom">{onHold}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50 text-sm text-slate-500 font-light">
                  合計 <span className="font-semibold text-slate-400 font-mono-custom">{project.tasks.length}</span> タスク
                </div>
              </div>
            );
          })}
        </div>

        {/* プロジェクト詳細 */}
        {selectedProject && (
          <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-slate-700/50 animate-fadeInUp">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-7 h-7 rounded-full shadow-lg"
                  style={{ 
                    backgroundColor: selectedProject.color,
                    boxShadow: `0 0 25px ${selectedProject.color}60`
                  }}
                />
                <h2 className="text-3xl font-bold text-slate-100 tracking-wide">{selectedProject.name}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-2"
              >
                <X size={28} />
              </button>
            </div>

            {/* フィルター */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-5 py-2.5 rounded-xl transition-all duration-300 font-medium ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
                }`}
              >
                すべて
              </button>
              {Object.entries(statusLabels).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-300 font-medium ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* タスク追加 */}
            {!isAddingTask ? (
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 px-5 py-3 mb-6 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50 font-medium"
              >
                <Plus size={20} />
                タスクを追加
              </button>
            ) : (
              <div className="mb-6 p-6 bg-cyan-950/30 rounded-2xl border-2 border-cyan-500/30 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="md:col-span-2 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                    placeholder="タスク名"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100"
                  >
                    <option value="high">優先度: 高</option>
                    <option value="medium">優先度: 中</option>
                    <option value="low">優先度: 低</option>
                  </select>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => addTask(selectedProject.id)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-400 hover:to-teal-500 flex items-center gap-2 transition-all duration-300 font-medium shadow-lg"
                  >
                    <Check size={18} />
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTask({ title: '', priority: 'medium', dueDate: '' });
                    }}
                    className="px-6 py-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 flex items-center gap-2 transition-all duration-300 font-medium"
                  >
                    <X size={18} />
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* タスクリスト */}
            <div className="space-y-4">
              {filteredTasks(selectedProject.tasks).length === 0 ? (
                <p className="text-slate-500 text-center py-12 font-light text-lg">タスクがありません</p>
              ) : (
                filteredTasks(selectedProject.tasks).map((task) => {
                  const isExpanded = expandedTask === task.id;

                  return (
                    <div
                      key={task.id}
                      className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
                    >
                      {/* タスクヘッダー */}
                      <div className="flex items-center gap-4 p-5">
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-semibold text-slate-100 text-lg">{task.title}</h4>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[task.status]}`}>
                              {statusLabels[task.status]}
                            </span>
                          </div>
                          {task.due_date && (
                            <div className={`flex items-center gap-2 text-sm ${
                              isOverdue(task.due_date) && task.status !== 'completed'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}>
                              <Calendar size={14} />
                              <span className="font-light">期限: {task.due_date}</span>
                              {isOverdue(task.due_date) && task.status !== 'completed' && (
                                <AlertCircle size={14} className="ml-1" />
                              )}
                            </div>
                          )}
                          {task.checklist.length > 0 && (
                            <div className="text-sm text-slate-400 mt-2 font-light">
                              チェックリスト: <span className="font-semibold text-cyan-400 font-mono-custom">{task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span> 完了
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(selectedProject.id, task.id, e.target.value)}
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Object.entries(statusLabels).map(([status, label]) => (
                              <option key={status} value={status}>{label}</option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('このタスクを削除しますか?')) {
                                deleteTask(selectedProject.id, task.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* 展開された詳細セクション */}
                      {isExpanded && (
                        <div className="bg-slate-900/60 border-t border-slate-700/50 p-6 space-y-6">
                          {/* 説明 */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3 tracking-wide">
                              タスクの説明
                            </label>
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'description', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-slate-100 placeholder-slate-500 font-light"
                              rows="3"
                              placeholder="タスクの詳細な説明を記入..."
                            />
                          </div>

                          {/* 要件定義 */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3 tracking-wide">
                              要件定義・仕様
                            </label>
                            <textarea
                              value={task.requirements || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'requirements', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono-custom text-sm resize-none text-slate-100 placeholder-slate-500"
                              rows="6"
                              placeholder="要件や仕様を記載...&#10;例:&#10;- 機能要件1&#10;- 機能要件2&#10;- 非機能要件"
                            />
                          </div>

                          {/* チェックリスト */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3 tracking-wide">
                              チェックリスト
                            </label>
                            <div className="space-y-3 mb-4">
                              {task.checklist.map(item => (
                                <div key={item.id} className="flex items-center gap-3 group bg-slate-800/30 rounded-lg p-3 hover:bg-slate-800/50 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => toggleChecklistItem(selectedProject.id, task.id, item.id)}
                                    className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500 bg-slate-700 border-slate-600"
                                  />
                                  <span className={`flex-1 ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'} font-light`}>
                                    {item.text}
                                  </span>
                                  <button
                                    onClick={() => deleteChecklistItem(selectedProject.id, task.id, item.id)}
                                    className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={newChecklistItem}
                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    addChecklistItem(selectedProject.id, task.id, newChecklistItem);
                                    setNewChecklistItem('');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-slate-100 placeholder-slate-500"
                                placeholder="新しいチェック項目を追加..."
                              />
                              <button
                                onClick={() => {
                                  addChecklistItem(selectedProject.id, task.id, newChecklistItem);
                                  setNewChecklistItem('');
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 text-sm font-medium transition-all duration-300"
                              >
                                追加
                              </button>
                            </div>
                          </div>

                          {/* メモ・備考 */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3 tracking-wide">
                              メモ・備考
                            </label>
                            <textarea
                              value={task.notes || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'notes', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-slate-100 placeholder-slate-500 font-light"
                              rows="3"
                              placeholder="メモや備考を記入..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;