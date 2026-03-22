# 実装の全体像と課題

## 1. アーキテクチャ概要

### 技術スタック
| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14.1.0 |
| UI | React 18.2.0 |
| スタイリング | Tailwind CSS |
| バックエンド | Supabase (PostgreSQL) |
| アイコン | lucide-react |

### ディレクトリ構成
```
taskdashuboard/
├── pages/
│   ├── _app.js          # アプリラッパー（グローバルCSS読み込み）
│   └── index.js         # メインページ
├── components/
│   ├── DailyTodo.jsx    # 本日のToDo
│   ├── GoalSection.jsx  # 目標セクション
│   └── TaskManagementBoard.jsx  # プロジェクト・タスク管理
├── lib/
│   └── supabaseClient.js  # Supabaseクライアント
└── （SQLスキーマファイル）
```

---

## 2. データフロー

### ページ構成（index.js）
```
Home
├── GoalSection      （目標：1年後/半年後/3ヶ月後...）
├── DailyTodo        （日付別ToDo）
└── TaskManagementBoard  （プロジェクト一覧 + タスク詳細）
```

### Supabaseテーブルとコンポーネントの対応
| テーブル | コンポーネント | 用途 |
|----------|----------------|------|
| `goals` | GoalSection | カテゴリ別目標 |
| `daily_todos` | DailyTodo | 日付別ToDo |
| `projects` | TaskManagementBoard | プロジェクト一覧 |
| `tasks` | TaskManagementBoard | タスク一覧 |
| `checklist_items` | TaskManagementBoard | タスク内チェックリスト |

### データ取得の流れ
- **各コンポーネントが独立してSupabaseに直接アクセス**
- 共通の状態管理（Context/Redux等）はなし
- 各コンポーネント内で `useState` + `useEffect` でデータ取得

---

## 3. コンポーネント別の実装詳細

### 3.1 GoalSection
- **役割**: 1年後/半年後/3ヶ月後/1ヶ月後/今週中の目標を管理
- **データ取得**: `isOpen` かつ `mounted` のとき `loadGoals()` 実行
- **hydration対策**: `mounted` フラグでマウント前は `return null`

### 3.2 DailyTodo
- **役割**: 日付選択付きのToDo管理
- **データ取得**: `mounted` のとき `loadTodos()` 実行（`selectedDate` 変更時も再取得）
- **hydration対策**: `mounted` フラグでマウント前は `return null`

### 3.3 TaskManagementBoard
- **役割**: プロジェクト一覧、タスクのCRUD、チェックリスト
- **データ取得**: マウント時に `loadProjects()` を即実行
  - プロジェクト取得 → 各プロジェクトのタスク取得 → 各タスクのチェックリスト取得（N+1的な構造）
- **hydration対策**: `mounted` フラグ + `if (!mounted) return null`
- **特徴**: 楽観的更新（UI即時反映 + デバウンスでDB保存）

### 3.4 supabaseClient.js
- `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` からクライアント生成
- 未設定時は `console.error` のみで、`createClient(undefined, undefined)` が実行される

---

## 4. 課題一覧

### 【重要】課題1: Supabase接続エラー（Error loading projects / ERR_NAME_NOT_RESOLVED）

**現象**
- 画面表示時に「Error loading projects」が発生
- `net::ERR_NAME_NOT_RESOLVED` でリソース読み込み失敗

**想定原因**
1. **環境変数未設定・誤設定**
   - `.env.local` が存在しない、または `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が不正
   - `supabaseClient.js` で `createClient(undefined, undefined)` となり、不正なURLでリクエストが発生
2. **Supabaseプロジェクト未作成**
   - Supabaseダッシュボードでプロジェクトが作成されていない
3. **ネットワーク・DNS**
   - 社内ネットワークやプロキシでSupabaseドメインがブロックされている

**該当箇所**
- `lib/supabaseClient.js`（環境変数チェックが不十分）
- `components/TaskManagementBoard.jsx` の `loadProjects()`（72–134行目）

---

### 【重要】課題2: TaskManagementBoardのmountedとloadProjectsの実行順序

**現状**
```javascript
useEffect(() => {
  setMounted(true);
  loadProjects();  // マウントと同時に即実行
}, []);
```

**問題点**
- `loadProjects()` がマウント直後に実行されるため、SSR/hydrationのタイミングによっては、クライアント側の準備が整う前にSupabaseを呼び出している可能性がある
- DailyTodo / GoalSection は「`mounted` が true になってからデータ取得」というパターンだが、TaskManagementBoard はそれと異なる

**該当箇所**
- `components/TaskManagementBoard.jsx` 57–61行目

---

### 【中】課題3: supabaseClientのエラーハンドリング不足

**現状**
- 環境変数が未設定でも `createClient()` を実行
- 不正なURLでリクエストが発生し、`ERR_NAME_NOT_RESOLVED` などの不可解なエラーになりやすい

**該当箇所**
- `lib/supabaseClient.js` 6–12行目

---

### 【中】課題4: プロジェクト読み込みのN+1クエリ

**現状**
- プロジェクト一覧取得 → 各プロジェクトごとにタスク取得 → 各タスクごとにチェックリスト取得
- プロジェクト数・タスク数が増えるとリクエスト数が急増

**該当箇所**
- `components/TaskManagementBoard.jsx` 89–125行目

---

### 【低】課題5: エラーメッセージのユーザー向け表示

**現状**
- プロジェクト読み込み失敗時に `alert()` で表示
- テーブル未作成時など、具体的な対処方法が画面に表示されない

**該当箇所**
- `components/TaskManagementBoard.jsx` 80–84行目
- `components/DailyTodo.jsx` / `components/GoalSection.jsx` はテーブル未作成時のUI表示あり

---

## 5. 修正の優先度

| 優先度 | 課題 | 対応方針 |
|--------|------|----------|
| 1 | 課題1: Supabase接続エラー | 環境変数の検証、接続前チェック、エラーメッセージの明確化 |
| 2 | 課題2: TaskManagementBoardのmounted | DailyTodo/GoalSectionと同様に「mounted後にloadProjects」に統一 |
| 3 | 課題3: supabaseClient | 環境変数未設定時はクライアント生成をスキップするか、明示的にエラーを出す |
| 4 | 課題4: N+1クエリ | Supabaseの `select` でリレーションを指定して一括取得（将来対応） |
| 5 | 課題5: エラーメッセージ | テーブル未作成時のUI表示をTaskManagementBoardにも追加（将来対応） |

---

## 6. 画面表示時のエラー発生フロー（推定）

```
1. ページロード（SSR）
   → 各コンポーネントが !mounted のため null を返す（hydration対策済み）

2. クライアント hydration
   → useEffect で setMounted(true) とデータ取得が実行される

3. TaskManagementBoard の loadProjects()
   → supabase.from('projects').select('*') を実行
   → 環境変数不正 or ネットワーク問題
   → ERR_NAME_NOT_RESOLVED / Error loading projects

4. DailyTodo の loadTodos()
   → 同様にSupabaseへアクセス
   → 同じ接続問題が発生する可能性あり

5. React hydrationエラー（#425, #418, #423）
   → DailyTodo / GoalSection の mounted 対応で軽減済み
   → ただし、Supabaseエラーによるレンダリング不整合が残っている可能性
```
