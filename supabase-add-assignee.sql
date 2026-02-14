-- tasksテーブルに担当者カラムを追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
