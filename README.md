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
5. POST/PATCH/DELETEは`GET /csrf`で取得した`X-CSRF-Token`が必要です。Originが付いている場合は明示したフロントエンドのOriginだけを許可し、不正なトークンやOriginは403になります。
6. `DELETE /logout`は対象セッションをDBで失効させ、Cookieを削除します。保存済みCookieを再送しても認証できません。他端末のセッションは維持されます。

`_oauth_session`のCookieStoreはOAuthの`state`とCSRFトークン専用です（有効期限30分）。認証用Cookieは開発で`_run_session`、本番で`__Host-run_session`です。
どちらも`HttpOnly`、`Path=/`、Domain指定なしで、本番は`Secure`を付けます。
移行前の`_app_session`と`session[:user_id]`は認証に使わないため、既存ユーザーには再ログインが必要です。

### 同一オリジン構成と本番設定

ブラウザとSSRは `https://runplan.tagokoro.dev/api` を入口にします。
Next.jsのexternal rewriteが `/api/:path*` を `https://runmodel.onrender.com/:path*` へ転送します。
API入口からRenderへのリダイレクトは行いません。Googleへの認可リダイレクトは通常どおり必要です。
`/api` は外側だけの接頭辞で、Railsのルートは `/csrf`、`/me`、`/auth/google_oauth2/callback` のままです。

| サービス                        | 変数                          | 本番値                                                         |
| ------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| Vercel / run-model / Production | `NEXT_PUBLIC_API_BASE_URL`    | `https://runplan.tagokoro.dev/api`                             |
| Vercel / run-model / Production | `API_UPSTREAM_ORIGIN`         | `https://runmodel.onrender.com`（本番既定値）                  |
| Render / runModel               | `FRONTEND_URL`                | `https://runplan.tagokoro.dev`                                 |
| Render / runModel               | `SESSION_SAME_SITE`           | `lax`（既定値）                                                |
| Render / runModel               | `GOOGLE_OAUTH_CALLBACK_URL`   | `https://runplan.tagokoro.dev/api/auth/google_oauth2/callback` |
| Render / runModel               | `ADDITIONAL_FRONTEND_ORIGINS` | 空。必要時のみ完全なOriginを列挙                               |

既存の `DATABASE_URL`、`RAILS_ENV=production`、`RAILS_MASTER_KEY`、`SECRET_KEY_BASE` は維持してください。
Google client ID/secretは引き続きRails credentialsの `google.client_id` / `google.client_secret` を使います。
Renderの `CLIENT_ID` / `CLIENT_SECRET` だけを書き換えてもこの実装には反映されません。
CloudflareのDNSは設定済みです。追加DNS・Renderカスタムドメインは不要です。

- ブラウザのCookieはrunplanホストに保存され、`Path=/` のためSSRページにも届きます。SSRは `cookies().toString()` を固定のAPI URLへ明示転送します。受信HostからAPI URLを生成しません。
- 認証Cookie `__Host-run_session` とOAuth/CSRF用 `_oauth_session` は本番で `SameSite=Lax; Secure; HttpOnly; Path=/`、Domain指定なしです。DBによる期限・失効確認、OAuth state、CSRF検証を維持します。
- API fetchは `no-store`、Rails応答と `/api` の設定は共有キャッシュ禁止です。VercelやCloudflareにAPIを強制キャッシュするルールを追加しないでください。
- 公開callback URLを明示し、Googleへの認可開始とコード交換で同一値を使います。任意のHost/転送ヘッダー/`redirect_uri`パラメーターによる上書きを許可しません。OAuth失敗は `/api/auth/failure` からフロントへ戻ります。
- プレビューは本番とは別環境です。本番のAPI URLを使うプレビューでは同一オリジン認証・SSRを検証できません。認証確認は本番ドメイン、または独立したRails/Google clientと固定preview URLを持つ環境で実施してください。Originのワイルドカード許可はしません。

### Google OAuthの設定

1. [Google Cloud Console](https://console.cloud.google.com/auth/clients)で、このアプリのRails credentialsに対応するOAuthクライアントを選びます。Web applicationのclient IDが一致することを確認してください（秘密鍵をREADME/ログへ出さない）。
2. 「承認済みのリダイレクトURI」に `https://runplan.tagokoro.dev/api/auth/google_oauth2/callback` を追加して保存します。末尾スラッシュを付けません。
3. 開発用には `http://localhost:3001/api/auth/google_oauth2/callback` を登録します。ブラウザのJS OAuthライブラリは使わないため、JS生成元への登録だけでは代用できません。
4. 移行確認が終わるまで従来のRender callback URIを残せます。移行後に不要なURIを削除します。

### 反映順序・マイグレーション

この変更は未マージのPR #33のDBセッション実装を含みます。#33と二重にマージする必要はありません。
環境変数の保存だけでは旧コードにプロキシ・CSRF・DBセッションの機能は追加されません。

1. Googleの新callback URIを追加します。VercelとRenderの自動デプロイ設定を確認し、backend/frontendの切り替え中は短いメンテナンス時間を設けます。
2. Vercelの上記Production変数を保存します。`NEXT_PUBLIC_*` とrewrite先はビルド時に確定するため、新コードでの再ビルドが必要です。旧mainの再デプロイはしません。Render変数は「Save only」で保存しておけます。
3. このPRのコードをmainへ反映し、Renderで `cd backend && bundle exec rails db:migrate` 相当を実行します。追加は `20261019000000_create_login_sessions.rb`（#33由来）です。既存データの削除・変換はありません。RenderのRoot Directoryが `backend` ならコマンドは `bundle exec rails db:migrate` です。
4. DBマイグレーション完了後に新Railsを起動し、Render `/health` を確認します。RenderのFreeプラン等でShell/Pre-deploy commandを使えない場合は、接続可能な管理環境から同じコード・本番DB・Rails鍵を使って実行してください。Dockerfileに自動マイグレーションはありません。
5. 新コードとProduction変数でVercelをビルド・デプロイし、`https://runplan.tagokoro.dev/api/health` がJSONで200になることを確認します。Renderがまだ旧コードならログイン検証へ進みません。
6. 下記の本番検証を行います。既存ユーザーは再ログインが必要です。古いRenderホストのCookieは移行しません。

ロールバックは対応するbackend/frontendを一緒に戻します。新テーブルは残せますが、旧認証へ戻すと#33で解消したCookie再利用の問題も戻るため、原則は修正して前進します。
期限切れ・失効済みレコードは `LoginSession.where("expires_at <= ? OR revoked_at IS NOT NULL", Time.current).delete_all` で定期削除できます。

### 作業時点の反映状況（2026-10-20）

- Vercel: `NEXT_PUBLIC_API_BASE_URL` を新入口へ更新済み。既存のProduction/Preview共通変数の型を維持して更新しました。`API_UPSTREAM_ORIGIN` はProductionに追加済み。設定保存後の本番ビルドは未実施です。
- Render: `FRONTEND_URL` は既に正しい値でした。`SESSION_SAME_SITE=lax` と `GOOGLE_OAUTH_CALLBACK_URL` を追加し、Save onlyで保存済み。新コードのデプロイ・本番マイグレーションは未実施です。
- Google: Rails credentialsのclient IDと一致する `RunScheduler-web-20261018` に本番・開発用の新callback URIを追加し、再表示で保存を確認済み。旧URIは維持しています。Google側の設定伝播には時間がかかる場合があります。
- 稼働コード: Vercel/Renderともmainの `5d54e72`。確認時は新ドメイン `/api/health` が404、Render `/health` が200でした。このPRのマージ・反映後に本番の実ログイン、SSR、更新API、Cookie属性、ログアウト後の再送拒否を検証してください。

### 検証

```bash
cd backend
RAILS_ENV=test bundle exec rails db:prepare
bundle exec rspec
bundle exec rubocop
bundle exec brakeman --no-pager
cd ../frontend
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:proxy
pnpm build
```

`test:proxy` はNextを一時ポートで起動し、模擬RailsとのGET/POST/PATCH/DELETE、本文・クエリ・CSRFヘッダー・複数Set-Cookie・OAuthの302・SSRでのCookie転送を確認します。
RSpecはDBセッション失効、CSRF欠落/不正値/不正Origin、state不正、公開callbackとコード交換のredirect_uri一致、転送Host偽装、キャッシュ禁止を検証します。
模擬GoogleのテストはGoogleとの実ログインを保証しません。

本番ではDevToolsのNetwork/Applicationを使い、以下を確認します。

- `/api/health` が200。`/api/csrf` → `POST /api/auth/google_oauth2` → Google → `/api/auth/google_oauth2/callback` → 新ドメインの順で遷移すること。
- ログイン後の `/api/me` が200。`/profile`・`/profile/edit`・`/schedule`・`/statistics` を直接リロードしてユーザーのデータがSSRされること。
- プロフィールPATCH、予定POST、完了PATCH、削除DELETEが成功すること。API応答は共有キャッシュのHITにならないこと。
- 認証済みCookieでCSRFヘッダーなし/不正値のPOST/PATCH/DELETEは403になること。
- Cookie属性が `SameSite=Lax; Secure; HttpOnly; Path=/`、Domainなしであること。ログアウト前に保存した認証Cookieをログアウト後に再送すると `/api/me` が401になること。Cookie値はチケット・ログ・PRに貼らないでください。

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
