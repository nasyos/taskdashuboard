import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const DailyTodo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
  }, [selectedDate]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = formatDate(date);
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const tomorrowStr = formatDate(tomorrow);

    if (dateStr === todayStr) return '今日';
    if (dateStr === yesterdayStr) return '昨日';
    if (dateStr === tomorrowStr) return '明日';

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日 (${weekday})`;
  };

  const loadTodos = async () => {
    try {
      setLoading(true);
      const dateStr = formatDate(selectedDate);
      console.log('Loading todos for date:', dateStr);

      const { data, error } = await supabase
        .from('daily_todos')
        .select('*')
        .eq('todo_date', dateStr)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        alert(`ToDoの読み込みエラー: ${error.message}`);
        throw error;
      }

      console.log('Todos loaded:', data);
      setTodos(data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodoTitle.trim()) {
      alert('ToDoを入力してください');
      return;
    }

    try {
      const dateStr = formatDate(selectedDate);
      console.log('Adding todo:', { date: dateStr, title: newTodoTitle });

      const { data, error } = await supabase
        .from('daily_todos')
        .insert([
          {
            todo_date: dateStr,
            title: newTodoTitle,
            completed: false
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        alert(`ToDoの追加エラー: ${error.message}`);
        throw error;
      }

      console.log('Todo added:', data);
      await loadTodos();
      setNewTodoTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (todo) => {
    try {
      const { error } = await supabase
        .from('daily_todos')
        .update({ completed: !todo.completed })
        .eq('id', todo.id);

      if (error) throw error;
      await loadTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('daily_todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    return formatDate(selectedDate) === formatDate(new Date());
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white rounded border border-gray-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">本日のToDo</h2>
        {!isToday() && (
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            今日に戻る
          </button>
        )}
      </div>

      {/* 日付選択 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-gray-200 rounded"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-600" />
          <span className="font-semibold text-gray-800">
            {formatDisplayDate(selectedDate)}
          </span>
          <span className="text-sm text-gray-500">
            ({formatDate(selectedDate)})
          </span>
        </div>

        <button
          onClick={() => changeDate(1)}
          className="p-2 hover:bg-gray-200 rounded"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 進捗表示 */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>進捗</span>
            <span className="font-semibold">
              {completedCount} / {totalCount} 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ToDo追加 */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 text-blue-600 hover:bg-blue-50 rounded border border-blue-300"
        >
          <Plus size={18} />
          ToDoを追加
        </button>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-300">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTodo();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTodoTitle('');
              }
            }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 mb-2"
            placeholder="ToDoを入力..."
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addTodo}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              追加
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTodoTitle('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-2"
            >
              <X size={16} />
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ToDoリスト */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-gray-500 text-center py-4">読込中...</p>
        ) : todos.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ToDoがありません</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 group"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span
                className={`flex-1 ${
                  todo.completed
                    ? 'line-through text-gray-400'
                    : 'text-gray-800'
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => {
                  if (confirm('このToDoを削除しますか?')) {
                    deleteTodo(todo.id);
                  }
                }}
                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DailyTodo;
