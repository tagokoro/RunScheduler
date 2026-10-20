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

## 認証とセキュリティ

Google OAuth / OmniAuthで本人確認し、認証セッションをPostgreSQLの`login_sessions`で管理します。
RailsのDBセッションストアはOAuthの一時データもまとめて保存できますが、このアプリではユーザー・期限・失効を明示的に扱える専用テーブルを採用しました。
Cookieには256ビットのランダムトークン、DBにはそのSHA-256ハッシュだけを保存します。

1. フロントエンドがCookie付きで`GET /csrf`を呼び、RailsのCSRFトークンを取得します。応答は`Cache-Control: no-store`です。
2. `authenticity_token`付きのフォームを`POST /auth/google_oauth2`へ送信します。GETによるOAuth開始は無効です。
3. OmniAuthがGoogleのコールバックで`state`を検証し、ログイン成功時にOAuth用セッションをリセットして新しい認証セッションを発行します。同じブラウザの旧認証セッションは失効します。
4. 保護APIはリクエストごとにDBで期限と失効状態を確認します。有効期限は発行から30日間で、未認証・改ざん・期限切れ・失効済みのCookieは401になります。
5. POST/PATCH/DELETEは`GET /csrf`で取得した`X-CSRF-Token`が必要です。Originが付いている場合はバックエンド自身または明示したフロントエンドのOriginだけを許可し、不正なトークンやOriginは403になります。
6. `DELETE /logout`は対象セッションをDBで失効させ、Cookieを削除します。保存済みCookieを再送しても認証できません。他端末のセッションは維持されます。

`_oauth_session`のCookieStoreはOAuthの`state`とCSRFトークン専用です（有効期限30分）。認証用Cookieは開発で`_run_session`、本番で`__Host-run_session`です。
どちらも`HttpOnly`、`Path=/`、Domain指定なしで、本番は`Secure`を付けます。
移行前の`_app_session`と`session[:user_id]`は認証に使わないため、既存ユーザーには再ログインが必要です。

### 本番設定と移行

- 先に`cd backend && bundle exec rails db:migrate`を実行し、backendとfrontendの変更を同時に反映してください。
- `FRONTEND_URL`は実際のHTTPSフロントエンドURLに設定してください。追加の許可先は`ADDITIONAL_FRONTEND_ORIGINS`へカンマ区切りで完全なOriginを指定します。Vercelプレビューのワイルドカードや、本番でのlocalhostの自動許可はありません。
- 別サイト構成（例：Vercelと別ドメインのAPI）では`SESSION_SAME_SITE=none`を設定します。本番の既定値も`none`です。同じサイトのHTTPSサブドメイン構成では`SESSION_SAME_SITE=lax`にできます。開発用`.env.example`の`lax`を別サイトの本番環境へそのままコピーしないでください。
- Cookie認証APIと`/csrf`へのブラウザ通信には`credentials: "include"`が必要です。ブラウザが第三者Cookieを拒否する場合は、同じサイトのドメインまたはリバースプロキシで運用してください。
- SSRからAPIへCookieを転送する場合は、フロントエンド側にもCookieが届く同一ホスト構成が必要です。別サイト構成の認証CookieはAPIホスト専用なので、SSRでは取得できません。
- 期限切れ・失効済みレコードは認証には使われません。DB肥大化を避けるため、運用時に`LoginSession.where("expires_at <= ? OR revoked_at IS NOT NULL", Time.current).delete_all`で定期削除できます。
- デプロイ後は実際のHTTPSドメインでログイン、プロフィール更新、ログアウトとCookieの再送拒否を確認してください。ローカルのRSpecはGoogleとの実通信やブラウザの第三者Cookie制限までは検証しません。

設計の参考：[Rails Security Guide](https://guides.rubyonrails.org/security.html)、[OmniAuth Rails CSRF Protection](https://github.com/cookpad/omniauth-rails_csrf_protection)。

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
