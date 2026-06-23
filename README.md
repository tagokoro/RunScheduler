# Running Scheduler

Running Scheduler は、ランナーのプロフィールと目標に合わせてトレーニング予定を生成し、日々の練習記録・スケジュール・統計を管理できるWebアプリケーションです。

## 主な機能

- Googleログイン
- ランナープロフィールの登録・編集
- AIによるトレーニング予定の生成
- 今日のトレーニング確認
- トレーニング記録の完了・削除
- カレンダー形式でのスケジュール確認
- Googleカレンダーへの予定追加
- 走行距離・走行時間・実施回数の統計表示

## 技術スタック

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- Recharts
- shadcn/ui

### Backend

- Ruby on Rails API
- PostgreSQL
- RSpec
- Rswag / OpenAPI
- OmniAuth Google OAuth2
- OpenAI API

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/tagokoro/RunScheduler.git
cd RunScheduler
```

### 2. 環境変数を設定

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. バックエンドを起動

```bash
docker compose up
```

Rails API は `http://localhost:3000` で起動します。

### 4. フロントエンドを起動

```bash
cd frontend
pnpm install
pnpm dev
```

フロントエンドは `http://localhost:3001` で起動します。

## 開発用コマンド

### Frontend

```bash
cd frontend
pnpm dev
pnpm lint
pnpm build
```

### Backend

```bash
cd backend
bundle exec rspec
bundle exec rubocop
bundle exec rails db:migrate
```

## APIドキュメント

開発環境でバックエンドを起動後、以下からOpenAPIドキュメントを確認できます。

```text
http://localhost:3000/api-docs
```

## 今後追加したい機能

- トレーニング記録の編集
- 実施後フィードバックの入力
- 目標レースまでの進捗表示
- 週単位の負荷管理
- AIによる振り返りコメント生成
- ランニング計画生成に特化した自作モデルの作成
