# 本日のToDo機能 セットアップ手順

## Supabaseにテーブルを作成

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com にログイン
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左サイドバーから「SQL Editor」をクリック
   - 「New query」をクリック

3. **SQLを実行**
   - `supabase-daily-todos-schema.sql` ファイルの内容を全てコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック

4. **確認**
   - 左サイドバーの「Table Editor」をクリック
   - `daily_todos` テーブルが作成されていることを確認

## 機能の使い方

### 本日のToDoセクション
- Project Dashboardの上部に表示されます
- 今日の日付のToDoが自動的に表示されます

### 日付の変更
- 左右の矢印ボタンで前後の日付に移動できます
- 「今日に戻る」ボタンで今日の日付に戻れます

### ToDoの追加
1. 「ToDoを追加」ボタンをクリック
2. ToDoを入力
3. Enterキーまたは「追加」ボタンをクリック

### ToDoの完了
- チェックボックスをクリックして完了/未完了を切り替え

### ToDoの削除
- ToDoにマウスを乗せるとゴミ箱アイコンが表示されます
- クリックして削除

### 進捗表示
- 完了したToDoの数と進捗バーが表示されます

## テーブル構造

```sql
daily_todos
├── id (UUID) - 主キー
├── todo_date (DATE) - ToDo の日付
├── title (TEXT) - ToDo のタイトル
├── completed (BOOLEAN) - 完了フラグ
├── created_at (TIMESTAMP) - 作成日時
└── updated_at (TIMESTAMP) - 更新日時
```

## 注意事項

- 個人利用のため、全てのユーザーが全てのデータにアクセスできます
- 認証機能を追加する場合は、RLSポリシーを見直してください
