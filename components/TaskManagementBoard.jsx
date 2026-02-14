import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, AlertCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TaskManagementBoard = () => {
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
  const [updateTimers, setUpdateTimers] = useState({});

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

  // コンポーネントがアンマウントされる時にすべてのタイマーをクリア
  useEffect(() => {
    return () => {
      Object.values(updateTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [updateTimers]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('Loading projects...');
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading projects:', error);
        alert(`プロジェクトの読み込みエラー: ${error.message}`);
        throw error;
      }

      console.log('Projects loaded:', projectsData);

      const projectsWithTasks = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: true });

          if (tasksError) {
            console.error('Error loading tasks:', tasksError);
          }

          const tasksWithChecklists = await Promise.all(
            (tasksData || []).map(async (task) => {
              const { data: checklistData, error: checklistError } = await supabase
                .from('checklist_items')
                .select('*')
                .eq('task_id', task.id)
                .order('created_at', { ascending: true });

              if (checklistError) {
                console.error('Error loading checklist:', checklistError);
              }

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

      console.log('Projects with tasks:', projectsWithTasks);
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
    if (!newTask.title.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    try {
      console.log('Adding task:', { projectId, newTask });
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

      if (error) {
        console.error('Supabase error:', error);
        alert(`エラーが発生しました: ${error.message}`);
        throw error;
      }

      console.log('Task added successfully:', data);
      await loadProjects();
      setNewTask({ title: '', priority: 'medium', dueDate: '' });
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const addProject = async () => {
    if (!newProject.name.trim()) {
      alert('プロジェクト名を入力してください');
      return;
    }

    try {
      console.log('Adding project:', newProject);
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            color: newProject.color
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert(`エラーが発生しました: ${error.message}`);
        throw error;
      }

      console.log('Project added successfully:', data);
      await loadProjects();
      setNewProject({ name: '', color: '#3b82f6' });
      setIsAddingProject(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const updateTaskStatus = async (projectId, taskId, newStatus) => {
    // immediate=true で即座に保存
    updateTaskDetails(projectId, taskId, 'status', newStatus, true);
  };

  const updateTaskDetails = async (projectId, taskId, field, value, immediate = false) => {
    // DB更新タイマーの管理
    const timerKey = `${taskId}-${field}`;
    
    // 既存のタイマーをキャンセル
    if (updateTimers[timerKey]) {
      clearTimeout(updateTimers[timerKey]);
      setUpdateTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[timerKey];
        return newTimers;
      });
    }

    // まずUIを即座に更新（楽観的更新）
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map(task => 
              task.id === taskId ? { ...task, [field]: value } : task
            )
          };
        }
        return project;
      })
    );

    // 選択中のプロジェクトも更新
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId ? { ...task, [field]: value } : task
        )
      }));
    }

    // DB更新の実行
    const saveToDatabase = async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ [field]: value })
          .eq('id', taskId);

        if (error) throw error;
        
        // 保存成功後、タイマーを削除
        setUpdateTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[timerKey];
          return newTimers;
        });
      } catch (error) {
        console.error('Error updating task:', error);
        alert('保存に失敗しました。もう一度お試しください。');
      }
    };

    if (immediate) {
      // セレクトボックスなどは即座に保存
      await saveToDatabase();
    } else {
      // テキスト入力は1.5秒後に保存（デバウンス）
      const timer = setTimeout(saveToDatabase, 1500);
      setUpdateTimers(prev => ({ ...prev, [timerKey]: timer }));
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
      // データベースに挿入
      const { data, error } = await supabase
        .from('checklist_items')
        .insert([
          {
            task_id: taskId,
            text: text,
            completed: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // UIを即座に更新（楽観的更新）
      const newItem = data || {
        id: Date.now().toString(), // 一時ID
        task_id: taskId,
        text: text,
        completed: false
      };

      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, checklist: [...task.checklist, newItem] }
                  : task
              )
            };
          }
          return project;
        })
      );

      // 選択中のプロジェクトも更新
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => 
            task.id === taskId 
              ? { ...task, checklist: [...task.checklist, newItem] }
              : task
          )
        }));
      }

    } catch (error) {
      console.error('Error adding checklist item:', error);
      alert('チェックリスト項目の追加に失敗しました');
    }
  };

  const toggleChecklistItem = async (projectId, taskId, checklistItemId) => {
    try {
      const task = projects
        .find(p => p.id === projectId)
        ?.tasks.find(t => t.id === taskId);
      const item = task?.checklist.find(i => i.id === checklistItemId);

      if (!item) return;

      const newCompletedState = !item.completed;

      // UIを即座に更新
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(t => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    checklist: t.checklist.map(i => 
                      i.id === checklistItemId 
                        ? { ...i, completed: newCompletedState }
                        : i
                    )
                  };
                }
                return t;
              })
            };
          }
          return project;
        })
      );

      // 選択中のプロジェクトも更新
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                checklist: t.checklist.map(i => 
                  i.id === checklistItemId 
                    ? { ...i, completed: newCompletedState }
                    : i
                )
              };
            }
            return t;
          })
        }));
      }

      // データベースに保存
      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: newCompletedState })
        .eq('id', checklistItemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      alert('チェックリスト項目の更新に失敗しました');
    }
  };

  const deleteChecklistItem = async (projectId, taskId, checklistItemId) => {
    try {
      // UIを即座に更新
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(t => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    checklist: t.checklist.filter(i => i.id !== checklistItemId)
                  };
                }
                return t;
              })
            };
          }
          return project;
        })
      );

      // 選択中のプロジェクトも更新
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                checklist: t.checklist.filter(i => i.id !== checklistItemId)
              };
            }
            return t;
          })
        }));
      }

      // データベースから削除
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', checklistItemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      alert('チェックリスト項目の削除に失敗しました');
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">読込中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style jsx global>{`
        body {
          font-family: 'メイリオ', 'Meiryo', sans-serif;
          background: #f5f5f5;
        }

      `}</style>

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: プロジェクト一覧 */}
          <div className="lg:col-span-1">
            {/* プロジェクト追加ボタン */}
            <div className="mb-4">
              {!isAddingProject ? (
                <button
                  onClick={() => setIsAddingProject(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  新規プロジェクト追加
                </button>
              ) : (
                <div className="bg-white p-4 rounded border border-gray-300 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">プロジェクト名</label>
                      <input
                        type="text"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder="プロジェクト名を入力"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
                      <input
                        type="color"
                        value={newProject.color}
                        onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addProject}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingProject(false);
                          setNewProject({ name: '', color: '#3b82f6' });
                        }}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* プロジェクト一覧 */}
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {projects.map((project, index) => {
                const progress = calculateProgress(project.tasks);
                const notStarted = getStatusCount(project.tasks, 'not-started');
                const inProgress = getStatusCount(project.tasks, 'in-progress');
                const completed = getStatusCount(project.tasks, 'completed');
                const onHold = getStatusCount(project.tasks, 'on-hold');
                const isSelected = selectedProject?.id === project.id;

                return (
                  <div
                    key={project.id}
                    className={`bg-white rounded border p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 shadow-md' 
                        : 'border-gray-300 hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{project.name}</h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`${project.name}を削除しますか?`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>進捗率</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 border border-gray-200">
                        <span className="text-gray-600">未着手</span>
                        <span className="font-semibold text-gray-700">{notStarted}</span>
                      </div>
                      <div className="flex items-center justify-between bg-blue-50 rounded px-2 py-1 border border-blue-200">
                        <span className="text-blue-700">進行中</span>
                        <span className="font-semibold text-blue-800">{inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between bg-green-50 rounded px-2 py-1 border border-green-200">
                        <span className="text-green-700">完了</span>
                        <span className="font-semibold text-green-800">{completed}</span>
                      </div>
                      <div className="flex items-center justify-between bg-yellow-50 rounded px-2 py-1 border border-yellow-200">
                        <span className="text-yellow-700">保留</span>
                        <span className="font-semibold text-yellow-800">{onHold}</span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-gray-200 text-xs text-gray-600">
                      合計 <span className="font-semibold text-gray-800">{project.tasks.length}</span> タスク
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右側: タスク詳細 */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <h2 className="text-2xl font-bold text-gray-800">{selectedProject.name}</h2>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 88px)' }}>
                  {/* フィルター */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-4 py-2 rounded text-sm ${
                        filterStatus === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      すべて
                    </button>
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded text-sm ${
                          filterStatus === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      className="flex items-center gap-2 px-4 py-2 mb-4 text-blue-600 hover:bg-blue-50 rounded border border-blue-300"
                    >
                      <Plus size={18} />
                      タスクを追加
                    </button>
                  ) : (
                    <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-300">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <input
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          className="md:col-span-2 px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          placeholder="タスク名"
                        />
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          className="px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="high">優先度: 高</option>
                          <option value="medium">優先度: 中</option>
                          <option value="low">優先度: 低</option>
                        </select>
                        <input
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          className="px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addTask(selectedProject.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Check size={16} />
                          追加
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTask({ title: '', priority: 'medium', dueDate: '' });
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                        >
                          <X size={16} />
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  {/* タスクリスト */}
                  <div className="space-y-3">
                    {filteredTasks(selectedProject.tasks).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">タスクがありません</p>
                    ) : (
                      filteredTasks(selectedProject.tasks).map((task) => {
                        const isExpanded = expandedTask === task.id;

                        return (
                          <div
                            key={task.id}
                            className="bg-white rounded border border-gray-300 overflow-hidden"
                          >
                            {/* タスクヘッダー */}
                            <div className="flex items-center gap-3 p-4">
                              <button
                                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'title', e.target.value)}
                                    onBlur={() => {}} 
                                    className="font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 px-0 py-0"
                                    style={{ width: `${Math.max(task.title.length * 8, 100)}px` }}
                                  />
                                  <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[task.priority]}`}>
                                    {priorityLabels[task.priority]}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[task.status]}`}>
                                    {statusLabels[task.status]}
                                  </span>
                                </div>
                                {task.due_date && (
                                  <div className={`flex items-center gap-1 text-xs ${
                                    isOverdue(task.due_date) && task.status !== 'completed'
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-600'
                                  }`}>
                                    <Calendar size={12} />
                                    <span>期限: {task.due_date}</span>
                                    {isOverdue(task.due_date) && task.status !== 'completed' && (
                                      <AlertCircle size={12} />
                                    )}
                                  </div>
                                )}
                                {task.checklist.length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    チェックリスト: <span className="font-semibold">{task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span> 完了
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(selectedProject.id, task.id, e.target.value)}
                                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
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
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* 展開された詳細セクション */}
                            {isExpanded && (
                              <div className="bg-gray-50 border-t border-gray-300 p-4 space-y-4">
                                {/* 担当者・優先度・期限日 */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      担当者（任意）
                                    </label>
                                    <input
                                      type="text"
                                      value={task.assignee || ''}
                                      onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'assignee', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                      placeholder="担当者名..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      優先度
                                    </label>
                                    <select
                                      value={task.priority}
                                      onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'priority', e.target.value, true)}
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    >
                                      <option value="low">低</option>
                                      <option value="medium">中</option>
                                      <option value="high">高</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      期限日
                                    </label>
                                    <input
                                      type="date"
                                      value={task.due_date || ''}
                                      onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'due_date', e.target.value, true)}
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </div>

                                {/* 説明 */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    タスクの説明
                                  </label>
                                  <textarea
                                    value={task.description || ''}
                                    onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'description', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                                    rows="3"
                                    placeholder="タスクの詳細な説明を記入..."
                                  />
                                </div>

                                {/* 要件定義 */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    要件定義・仕様
                                  </label>
                                  <textarea
                                    value={task.requirements || ''}
                                    onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'requirements', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                                    rows="6"
                                    placeholder="要件や仕様を記載..."
                                  />
                                </div>

                                {/* チェックリスト */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    チェックリスト
                                  </label>
                                  <div className="space-y-2 mb-3">
                                    {task.checklist.map(item => (
                                      <div key={item.id} className="flex items-center gap-2 group bg-white rounded p-2 border border-gray-300">
                                        <input
                                          type="checkbox"
                                          checked={item.completed}
                                          onChange={() => toggleChecklistItem(selectedProject.id, task.id, item.id)}
                                          className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                          {item.text}
                                        </span>
                                        <button
                                          onClick={() => deleteChecklistItem(selectedProject.id, task.id, item.id)}
                                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newChecklistItem}
                                      onChange={(e) => setNewChecklistItem(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          addChecklistItem(selectedProject.id, task.id, newChecklistItem);
                                          setNewChecklistItem('');
                                        }
                                      }}
                                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                      placeholder="新しいチェック項目を追加..."
                                    />
                                    <button
                                      onClick={() => {
                                        addChecklistItem(selectedProject.id, task.id, newChecklistItem);
                                        setNewChecklistItem('');
                                      }}
                                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                      追加
                                    </button>
                                  </div>
                                </div>

                                {/* メモ・備考 */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    メモ・備考
                                  </label>
                                  <textarea
                                    value={task.notes || ''}
                                    onChange={(e) => updateTaskDetails(selectedProject.id, task.id, 'notes', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
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
              </div>
            ) : (
              <div className="bg-white rounded border border-gray-300 p-12 shadow-sm flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
                <p className="text-gray-400 text-center">
                  プロジェクトを選択してください
                </p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default TaskManagementBoard;