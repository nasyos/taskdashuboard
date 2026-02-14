# Vercelデプロイガイド

## 手順1: Vercelにログイン

1. https://vercel.com にアクセス
2. 「Sign Up」または「Log In」をクリック
3. GitHubアカウントで認証

## 手順2: 新しいプロジェクトを作成

1. ダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションで
3. `nasyos/taskdashuboard` を検索または選択
4. 「Import」ボタンをクリック

## 手順3: プロジェクト設定

### Framework Preset
- 自動的に「Next.js」が選択されます（そのままでOK）

### Root Directory
- そのまま `.` で問題ありません

### Build and Output Settings
- デフォルト設定のままでOK
  - Build Command: `next build`
  - Output Directory: `.next`
  - Install Command: `npm install`

## 手順4: 環境変数の設定（重要！）

「Environment Variables」セクションで以下を追加：

### 変数1: Supabase URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: あなたのSupabase Project URL
  - 例: `https://xxxxxxxxxxxxx.supabase.co`
- **Environment**: Production, Preview, Development すべてにチェック

### 変数2: Supabase Anon Key
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: あなたのSupabase Anon Key
  - 例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: Production, Preview, Development すべてにチェック

### 環境変数の取得方法

Supabaseダッシュボードで：
1. プロジェクトを選択
2. 左サイドバー「Settings」→「API」をクリック
3. 「Project URL」と「anon public」をコピー

## 手順5: デプロイ実行

1. 環境変数を設定したら「Deploy」ボタンをクリック
2. デプロイが開始されます（約2-3分）
3. ビルドログを確認できます

## 手順6: デプロイ完了

デプロイが成功すると：
- ✅ 緑色の「Ready」ステータスが表示
- 🔗 本番URLが発行されます
  - 例: `https://taskdashuboard.vercel.app`
  - または `https://taskdashuboard-xxxx.vercel.app`

## 手順7: 動作確認

1. 発行されたURLをクリック
2. プロジェクト追加が動作することを確認
3. タスク追加が動作することを確認
4. データがSupabaseに保存されることを確認

## トラブルシューティング

### ビルドエラーが発生した場合

**エラー: "Environment variables are missing"**
- 環境変数が正しく設定されているか確認
- 変数名のスペルミスがないか確認

**エラー: "Build failed"**
- ローカルで `npm run build` を実行して確認
- package.jsonの依存関係を確認

### デプロイ後にデータが表示されない場合

1. Vercelダッシュボードで「Settings」→「Environment Variables」を確認
2. 環境変数が正しく設定されているか確認
3. ブラウザの開発者ツールでコンソールエラーを確認

### 環境変数を後から追加/変更する場合

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 変数を追加または編集
4. 「Deployments」→最新のデプロイの「...」→「Redeploy」で再デプロイ

## 自動デプロイ

GitHubリポジトリにプッシュすると、自動的にVercelがデプロイします：
- `main`ブランチへのプッシュ → 本番環境に自動デプロイ
- 他のブランチ → プレビュー環境に自動デプロイ

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」
2. 「Add」をクリック
3. ドメイン名を入力
4. DNS設定を行う
