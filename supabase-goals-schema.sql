-- Goals テーブル作成
-- 目標管理用テーブル（1年後、半年後、3ヶ月後、1ヶ月後、今週中）

CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('1_year', '6_months', '3_months', '1_month', 'this_week')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カテゴリ検索用インデックス
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- RLS (Row Level Security) ポリシー
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on goals" ON goals
  FOR ALL
  USING (true)
  WITH CHECK (true);
