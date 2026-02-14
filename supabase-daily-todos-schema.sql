-- 日次ToDoテーブル
CREATE TABLE daily_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_date DATE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_daily_todos_date ON daily_todos(todo_date);

-- Row Level Security (RLS) の有効化
ALTER TABLE daily_todos ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが全データにアクセス可能にするポリシー
CREATE POLICY "Enable all operations for all users" ON daily_todos FOR ALL USING (true) WITH CHECK (true);
