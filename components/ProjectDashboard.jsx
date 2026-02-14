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
    'not-started': 'bg-slate-100 text-slate-700 border-2 border-slate-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
    'completed': 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
    'on-hold': 'bg-amber-100 text-amber-800 border-2 border-amber-300'
  };

  const priorityColors = {
    'high': 'bg-rose-100 text-rose-800 border-2 border-rose-300',
    'medium': 'bg-amber-100 text-amber-800 border-2 border-amber-300',
    'low': 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium tracking-wide">読込中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f1f5f9 100%);
        }
        
        .font-display {
          font-family: 'Playfair Display', serif;
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

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes goldGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }

        .luxury-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
        }

        .luxury-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, #d4af37, #1e40af, #d4af37);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.6;
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(30, 64, 175, 0.15), 0 0 40px rgba(212, 175, 55, 0.1);
        }

        .gold-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(212, 175, 55, 0.3),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        .elegant-border {
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 4px 20px rgba(30, 64, 175, 0.08);
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-12">
        {/* ヘッダー */}
        <div className="mb-12 animate-fadeInUp">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full"></div>
            <div className="h-3 w-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg" style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)' }}></div>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 bg-clip-text text-transparent font-display mb-3 tracking-tight">
            Project Dashboard
          </h1>
          <p className="text-slate-600 text-lg font-light tracking-wide">複数プロジェクトを洗練されたインターフェースで一元管理</p>
        </div>

        {/* プロジェクト追加ボタン */}
        <div className="mb-8 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
          {!isAddingProject ? (
            <button
              onClick={() => setIsAddingProject(true)}
              className="relative group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl font-medium border border-yellow-500/30 overflow-hidden"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              新規プロジェクト追加
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 gold-shimmer"></div>
            </button>
          ) : (
            <div className="luxury-card p-6 rounded-2xl shadow-xl elegant-border">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 tracking-wide">プロジェクト名</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
                    placeholder="プロジェクト名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 tracking-wide">カラー</label>
                  <input
                    type="color"
                    value={newProject.color}
                    onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                    className="h-12 w-24 border-2 border-slate-200 rounded-xl cursor-pointer bg-white"
                  />
                </div>
                <button
                  onClick={addProject}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 flex items-center gap-2 transition-all duration-300 font-medium shadow-lg border border-yellow-500/20"
                >
                  <Check size={18} />
                  追加
                </button>
                <button
                  onClick={() => {
                    setIsAddingProject(false);
                    setNewProject({ name: '', color: '#3b82f6' });
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center gap-2 transition-all duration-300 font-medium border border-slate-300"
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
                className="luxury-card rounded-2xl p-6 cursor-pointer card-hover animate-fadeInUp relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedProject(project)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-bl-full"></div>
                
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full shadow-lg border-2 border-white"
                      style={{ 
                        backgroundColor: project.color,
                        boxShadow: `0 4px 15px ${project.color}60`
                      }}
                    />
                    <h3 className="text-lg font-semibold text-slate-800 tracking-wide font-display">{project.name}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`${project.name}を削除しますか?`)) {
                        deleteProject(project.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-5 relative z-10">
                  <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
                    <span>進捗率</span>
                    <span className="font-bold text-blue-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-3 rounded-full transition-all duration-500 relative"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-5 relative z-10">
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
                    <span className="text-slate-600 font-medium">未着手</span>
                    <span className="font-bold text-slate-700">{notStarted}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-200">
                    <span className="text-blue-700 font-medium">進行中</span>
                    <span className="font-bold text-blue-800">{inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2.5 border border-emerald-200">
                    <span className="text-emerald-700 font-medium">完了</span>
                    <span className="font-bold text-emerald-800">{completed}</span>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-200">
                    <span className="text-amber-700 font-medium">保留</span>
                    <span className="font-bold text-amber-800">{onHold}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-yellow-500/20 text-sm text-slate-600 font-medium relative z-10">
                  合計 <span className="font-bold text-slate-800">{project.tasks.length}</span> タスク
                </div>
              </div>
            );
          })}
        </div>

        {/* プロジェクト詳細 */}
        {selectedProject && (
          <div className="luxury-card rounded-2xl p-8 shadow-2xl elegant-border animate-fadeInUp">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full shadow-lg border-2 border-white"
                  style={{ 
                    backgroundColor: selectedProject.color,
                    boxShadow: `0 4px 20px ${selectedProject.color}60`
                  }}
                />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent font-display">{selectedProject.name}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={28} />
              </button>
            </div>

            {/* フィルター */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg border border-yellow-500/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
                }`}
              >
                すべて
              </button>
              {Object.entries(statusLabels).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg border border-yellow-500/30'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
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
                className="flex items-center gap-2 px-6 py-3 mb-6 text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 font-semibold"
              >
                <Plus size={20} />
                タスクを追加
              </button>
            ) : (
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border-2 border-blue-300 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="md:col-span-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                    placeholder="タスク名"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium"
                  >
                    <option value="high">優先度: 高</option>
                    <option value="medium">優先度: 中</option>
                    <option value="low">優先度: 低</option>
                  </select>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => addTask(selectedProject.id)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 flex items-center gap-2 transition-all duration-300 font-semibold shadow-lg border border-yellow-500/20"
                  >
                    <Check size={18} />
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTask({ title: '', priority: 'medium', dueDate: '' });
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center gap-2 transition-all duration-300 font-semibold border border-slate-300"
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
                      className="bg-white rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      {/* タスクヘッダー */}
                      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-white to-slate-50">
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-semibold text-slate-800 text-lg">{task.title}</h4>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColors[task.status]}`}>
                              {statusLabels[task.status]}
                            </span>
                          </div>
                          {task.due_date && (
                            <div className={`flex items-center gap-2 text-sm ${
                              isOverdue(task.due_date) && task.status !== 'completed'
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-600'
                            }`}>
                              <Calendar size={14} />
                              <span>期限: {task.due_date}</span>
                              {isOverdue(task.due_date) && task.status !== 'completed' && (
                                <AlertCircle size={14} className="ml-1" />
                              )}
                            </div>
                          )}
                          {task.checklist.length > 0 && (
                            <div className="text-sm text-slate-600 mt-2 font-medium">
                              チェックリスト: <span className="font-bold text-blue-700">{task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span> 完了
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(selectedProject.id, task.id, e.target.value)}
                            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold"
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
                            className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* 展開された詳細セクション */}
                      {isExpanded && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-t-2 border-blue-200 p-6 space-y-6">
                          {/* 説明 */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                              タスクの説明
                            </label>
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'description', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-800 placeholder-slate-400"
                              rows="3"
                              placeholder="タスクの詳細な説明を記入..."
                            />
                          </div>

                          {/* 要件定義 */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                              要件定義・仕様
                            </label>
                            <textarea
                              value={task.requirements || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'requirements', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none text-slate-800 placeholder-slate-400"
                              rows="6"
                              placeholder="要件や仕様を記載...&#10;例:&#10;- 機能要件1&#10;- 機能要件2&#10;- 非機能要件"
                            />
                          </div>

                          {/* チェックリスト */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                              チェックリスト
                            </label>
                            <div className="space-y-3 mb-4">
                              {task.checklist.map(item => (
                                <div key={item.id} className="flex items-center gap-3 group bg-white rounded-lg p-3 border-2 border-slate-200 hover:border-blue-300 transition-all">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => toggleChecklistItem(selectedProject.id, task.id, item.id)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 border-slate-300"
                                  />
                                  <span className={`flex-1 ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                                    {item.text}
                                  </span>
                                  <button
                                    onClick={() => deleteChecklistItem(selectedProject.id, task.id, item.id)}
                                    className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
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
                                className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400"
                                placeholder="新しいチェック項目を追加..."
                              />
                              <button
                                onClick={() => {
                                  addChecklistItem(selectedProject.id, task.id, newChecklistItem);
                                  setNewChecklistItem('');
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 text-sm font-semibold transition-all duration-300 border border-yellow-500/20"
                              >
                                追加
                              </button>
                            </div>
                          </div>

                          {/* メモ・備考 */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                              メモ・備考
                            </label>
                            <textarea
                              value={task.notes || ''}
                              onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'notes', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-800 placeholder-slate-400"
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