import React, { useState, useEffect, useRef } from 'react';
import { Target, ChevronDown, ChevronUp, Plus, Check, X, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const GOAL_CATEGORIES = [
  { key: '1_year', label: '1年後', color: 'purple' },
  { key: '6_months', label: '半年後', color: 'blue' },
  { key: '3_months', label: '3ヶ月後', color: 'cyan' },
  { key: '1_month', label: '1ヶ月後', color: 'green' },
  { key: 'this_week', label: '今週中', color: 'orange' },
];

const COLOR_MAP = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800',
    dot: 'bg-cyan-500',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
};

const GoalSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [goals, setGoals] = useState({});
  const [addingCategory, setAddingCategory] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableError, setTableError] = useState(false);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadGoals();
    }
  }, [isOpen]);

  useEffect(() => {
    if (addingCategory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingCategory]);

  useEffect(() => {
    if (editingGoal && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingGoal]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message.includes('relation "public.goals" does not exist')) {
          setTableError(true);
          setGoals({});
          return;
        }
        console.error('Goals load error:', error);
        return;
      }

      setTableError(false);
      const grouped = {};
      for (const cat of GOAL_CATEGORIES) {
        grouped[cat.key] = (data || []).filter((g) => g.category === cat.key);
      }
      setGoals(grouped);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (category) => {
    if (!newGoalText.trim()) return;

    try {
      const { error } = await supabase
        .from('goals')
        .insert([{ category, content: newGoalText.trim() }]);

      if (error) {
        if (error.message.includes('relation "public.goals" does not exist')) {
          alert('エラー: goalsテーブルが存在しません。\n\nSupabaseでテーブルを作成してください。\nsupabase-goals-schema.sql を参照してください。');
          return;
        }
        console.error('Goal add error:', error);
        return;
      }

      setNewGoalText('');
      setAddingCategory(null);
      await loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (id) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ content: editText.trim() })
        .eq('id', id);

      if (error) {
        console.error('Goal update error:', error);
        return;
      }

      setEditingGoal(null);
      setEditText('');
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (id) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Goal delete error:', error);
        return;
      }

      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const totalGoals = Object.values(goals).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="bg-white rounded border border-gray-300 shadow-sm">
      {/* トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Target size={22} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">Goal</h2>
          {!isOpen && totalGoals > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {totalGoals}件
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>

      {/* Goal内容 */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-4">
          {tableError ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-sm">
              <p className="font-semibold text-yellow-800 mb-2">テーブルが作成されていません</p>
              <p className="text-yellow-700 mb-3">
                Supabaseで<code className="bg-yellow-100 px-1 rounded">goals</code>テーブルを作成してください。
              </p>
              <details className="text-yellow-700">
                <summary className="cursor-pointer font-semibold mb-2">作成手順を表示</summary>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Supabaseダッシュボードにログイン</li>
                  <li>「SQL Editor」→「New query」をクリック</li>
                  <li><code className="bg-yellow-100 px-1 rounded">supabase-goals-schema.sql</code>の内容をペースト</li>
                  <li>「Run」ボタンをクリック</li>
                </ol>
              </details>
            </div>
          ) : loading ? (
            <p className="text-gray-500 text-center py-4">読込中...</p>
          ) : (
            GOAL_CATEGORIES.map((cat) => {
              const colors = COLOR_MAP[cat.color];
              const categoryGoals = goals[cat.key] || [];

              return (
                <div key={cat.key} className={`rounded border ${colors.border} ${colors.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <h3 className={`font-bold ${colors.text}`}>{cat.label}</h3>
                      {categoryGoals.length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                          {categoryGoals.length}
                        </span>
                      )}
                    </div>
                    {addingCategory !== cat.key && (
                      <button
                        onClick={() => {
                          setAddingCategory(cat.key);
                          setNewGoalText('');
                        }}
                        className={`p-1 rounded hover:bg-white/50 ${colors.text}`}
                        title="目標を追加"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  {/* 目標リスト */}
                  {categoryGoals.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {categoryGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-start gap-2 group bg-white/60 rounded px-3 py-2"
                        >
                          {editingGoal === goal.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') updateGoal(goal.id);
                                  if (e.key === 'Escape') {
                                    setEditingGoal(null);
                                    setEditText('');
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => updateGoal(goal.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGoal(null);
                                  setEditText('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm text-gray-800">{goal.content}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingGoal(goal.id);
                                    setEditText(goal.content);
                                  }}
                                  className="text-gray-400 hover:text-blue-600"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('この目標を削除しますか？')) {
                                      deleteGoal(goal.id);
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 追加フォーム */}
                  {addingCategory === cat.key && (
                    <div className="flex gap-2 mt-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addGoal(cat.key);
                          if (e.key === 'Escape') {
                            setAddingCategory(null);
                            setNewGoalText('');
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder={`${cat.label}の目標を入力...`}
                      />
                      <button
                        onClick={() => addGoal(cat.key)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Check size={14} />
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setAddingCategory(null);
                          setNewGoalText('');
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* 空の場合 */}
                  {categoryGoals.length === 0 && addingCategory !== cat.key && (
                    <p className="text-sm text-gray-400 italic">目標が設定されていません</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GoalSection;
