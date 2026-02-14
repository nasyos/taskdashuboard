-- プロジェクトテーブル
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- タスクテーブル
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'on-hold')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- チェックリストアイテムテーブル
CREATE TABLE checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_checklist_items_task_id ON checklist_items(task_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが全データにアクセス可能にするポリシー（本番環境では認証を追加することを推奨）
CREATE POLICY "Enable all operations for all users" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON checklist_items FOR ALL USING (true) WITH CHECK (true);

-- サンプルデータの挿入（オプション）
INSERT INTO projects (name, color) VALUES 
  ('AI Scout Partner', '#3b82f6'),
  ('AI導入コンサルティング', '#10b981'),
  ('DX推進支援', '#f59e0b');
