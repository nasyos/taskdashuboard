# プロジェクト管理ダッシュボード

複数プロジェクトの進捗を一元管理できるタスク管理ツールです。Supabaseをバックエンドとして使用し、複数デバイスやチームメンバーとのデータ共有が可能です。

## 機能

### プロジェクト管理
- プロジェクトごとのタスク管理
- 視覚的な進捗率表示
- ステータス管理（未着手/進行中/完了/保留）
- 優先度設定
- 期限管理とアラート
- タスクごとの詳細情報（要件定義、チェックリスト、メモ）

### 本日のToDo
- 日付ごとのToDo管理
- 日付の前後移動
- ToDo の追加・完了・削除
- 進捗表示

### その他
- Supabaseによるリアルタイムデータ同期
- シンプルで実用的なUI

## 🚀 デプロイまでの完全ガイド

### STEP 1: Supabaseのセットアップ

#### 1-1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

#### 1-2. 新しいプロジェクトの作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：
   - **Name**: `project-dashboard`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)`（日本から近いリージョン）
3. 「Create new project」をクリック
4. プロジェクトの作成を待つ（約2分）

#### 1-3. データベーステーブルの作成

**プロジェクト管理テーブル:**
1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. このプロジェクトの `supabase-schema.sql` ファイルの内容を全てコピー＆ペースト
4. 「Run」ボタンをクリックしてSQLを実行
5. 成功メッセージが表示されることを確認

**本日のToDoテーブル（重要！）:**
1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. このプロジェクトの `supabase-daily-todos-schema.sql` ファイルの内容を全てコピー＆ペースト
4. 「Run」ボタンをクリックしてSQLを実行
5. 成功メッセージが表示されることを確認

#### 1-4. API認証情報の取得

1. 左サイドバーから「Settings」→「API」をクリック
2. 以下の情報をメモ：
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（長い文字列）

### STEP 2: ローカル開発環境のセットアップ

#### 2-1. プロジェクトファイルの準備

```bash
# プロジェクトディレクトリに移動
cd project-dashboard

# 依存関係のインストール
npm install
```

#### 2-2. 環境変数の設定

1. `.env.local.example` をコピーして `.env.local` を作成

```bash
cp .env.local.example .env.local
```

2. `.env.local` を編集して、Supabaseの情報を入力

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**重要**: `xxxxxxxxx` と `eyJ...` の部分をSTEP 1-4で取得した実際の値に置き換えてください。

#### 2-3. ローカルで動作確認

```bash
# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開き、アプリケーションが正常に動作することを確認してください。

### STEP 3: GitHubリポジトリの作成

1. GitHubで新しいリポジトリを作成
   - リポジトリ名: `project-dashboard`（任意）
   - Public または Private を選択
   - **「Initialize this repository」のチェックは外す**

2. ローカルでGitを初期化してプッシュ

```bash
git init
git add .
git commit -m "Initial commit: Supabase integrated project dashboard"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/project-dashboard.git
git push -u origin main
```

### STEP 4: Vercelでデプロイ

#### 4-1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にアクセスしてログイン
2. 「Add New」→「Project」をクリック
3. 先ほど作成したGitHubリポジトリを選択
4. 「Import」をクリック

#### 4-2. 環境変数の設定

1. 「Environment Variables」セクションで以下を追加：

   **Name**: `NEXT_PUBLIC_SUPABASE_URL`  
   **Value**: `https://xxxxxxxxx.supabase.co`（あなたのSupabase URL）

   **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（あなたのanon key）

2. 環境変数を **Production**, **Preview**, **Development** 全てに適用

#### 4-3. デプロイ実行

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待つ（約2-3分）
3. デプロイ成功後、URLが発行されます
   - 例: `https://project-dashboard-xxxxx.vercel.app`

### STEP 5: 動作確認

1. 発行されたURLにアクセス
2. 「新規プロジェクト追加」をクリックしてプロジェクトを作成
3. プロジェクトをクリックして詳細画面を開く
4. タスクを追加してみる
5. 別のブラウザやデバイスで同じURLを開き、データが同期されることを確認

## 🎨 デザインの特徴

- **シンプルなUI**: 実用性を重視したクリーンなデザイン
- **メイリオフォント**: 読みやすい日本語フォント
- **直感的な操作**: 無駄な装飾を排除し、使いやすさを追求

## 📝 今後の機能追加のアイデア

- [ ] ユーザー認証機能（複数ユーザー対応）
- [ ] タスクの担当者割り当て
- [ ] カレンダービュー
- [ ] ガントチャート表示
- [ ] データのエクスポート/インポート
- [ ] 通知機能（期限アラート等）
- [ ] ダッシュボード分析（完了率の推移など）
- [ ] ドラッグ&ドロップによるタスク並び替え

## 🔧 トラブルシューティング

### データが表示されない

1. `.env.local` の環境変数が正しく設定されているか確認
2. SupabaseのSQL Editorでテーブルが作成されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### Vercelでデプロイエラーが出る

1. 環境変数が正しく設定されているか確認
2. `npm run build` がローカルで成功するか確認
3. Vercelのビルドログを確認

### Supabaseの接続エラー

1. Project URLとAnon Keyが正しくコピーされているか確認
2. Supabaseプロジェクトが正常に起動しているか確認（ダッシュボードで確認）
3. Row Level Security (RLS) ポリシーが正しく設定されているか確認

## 🔒 セキュリティに関する注意

現在の実装では、全てのユーザーが全てのデータにアクセスできるようになっています。本番環境で使用する場合は、以下の対応を推奨します：

1. **認証機能の追加**: Supabase Authを使用してユーザー認証を実装
2. **RLSポリシーの見直し**: ユーザーごとにデータを分離
3. **環境変数の保護**: `.env.local` をGitにコミットしない（既に.gitignoreに含まれています）

## 📄 ライセンス

MIT License

## 🙋 サポート

質問や問題がある場合は、GitHubのIssuesで報告してください。
