# Running Scheduler

Running Scheduler は、マラソンに向けて練習する人のための練習管理アプリです。目標レースに合わせて予定を作成し、実際に走った距離・時間・振り返りを記録できます。

## 主な機能

- Googleログイン
- ランナープロフィールの登録・編集
- 普段の練習スケジュール（曜日別の利用可能時間）の保存
- AIによる7日間の提案・確認後の保存
- 今日のトレーニング確認
- 今日・過去の練習実績（距離・時間・振り返り）の登録・編集、完了取消・削除
- カレンダー形式でのスケジュール確認
- Googleカレンダーへの予定追加
- 走行距離・走行時間・実施回数の統計表示

## 使い始める手順

1. Googleでログインし、ホームの「目標・プロフィールを登録」へ進みます。
2. 年齢・体重・目標レース・目標タイム・大会日を登録します。タイムは `4:30:00`（時:分:秒）の形式で入力し、ベストタイムは未計測なら空欄にできます。API/DBでは従来どおり秒で保持します。
3. プロフィールの「普段の練習スケジュール」で7曜日の利用可能な上限時間（分）を設定します。「未設定」と「休み」は別です。30・45・60・90分または「その他」から選びます。その他は1〜1440分の整数です。
4. ホームの「1週間の予定を提案」で、日本時間の今日から7日間を確認し、「提案を作成」を押します。日数や曜日の入力は不要です。
5. 各日の利用可能時間とメニュー、新規・既存予定を置換・実績ありで保持の区別を確認し、「この内容で保存」を押します。保存前なら再提案・キャンセルができ、DBは変わりません。時間をすべて使う必要はなく、休養も提案に含みます。
6. 練習後はホームまたは「予定・記録」のカレンダーから対象日を選び、「実績を記録」で実際の距離・時間・振り返りを保存します。未来日の完了はできません。完了済みの実績も編集・取消できます。
7. 「振り返り」で日・週・月ごとの実績を確認します。未実施の予定と休養日は実施回数に含みません。

予定・実施日の判定は日本時間（Asia/Tokyo）に統一しています。

予定と実績は別の値です。確認後の保存は対象日の未実施予定を置き換えますが、完了済み・実績入力済み・振り返り入力済みの日を保持し、対象期間外の予定も残します。生成された情報を実績として扱いません。旧データで実績が未入力の完了記録だけは、従来の予定距離・時間を集計に使います。カードにその旨を表示し、実績を編集できます。

未ログイン時には利用案内を表示します。通信失敗は未登録・空の予定と区別し、「再試行する」を表示します。プロフィール未登録時は予定生成より先に登録を案内します。

### 週次提案フロー（#35の後続PR）

PR #35は未マージのため、その最新版をベースにしています。今回の差分は#35の上に重ねたブランチです。#35を先にレビュー・マージし、このPRのベースをmainへ変更して今回の差分だけを反映してください。本番へのマージ・デプロイは実施していません。

- `PATCH /me/profile`・`GET /me/profile` に `weekly_availability` を追加。例: `{"monday":30,"tuesday":0,"wednesday":null}`。キーなし/nullは未設定、0は休み、正の整数は利用可能な上限時間です。既存プロフィールの初期値は `{}` とし、他のプロフィール情報を変更しません。7曜日未設定の場合は登録へ案内します。すべて休みの場合は提案せず、時間の登録を案内します。
- `POST /weekly_plans/propose` は曜日・日数の入力を受けず、保存済みの設定と目標から今日〜6日後の7日分を提案します。日付、各日の上限、メニュー、新規/置換/実績保持を返します。時間超過、休みへの練習割当、日付の欠落・重複などをサーバーで拒否します。準備・整理運動を含めて上限内にするようAIへ指示します。説明文中の運動内容の妥当性まで機械的に保証するものではなく、実サービスでの内容評価は別途行います。
- 直近28日間（今日を含む）の本人の完了記録を参照します。距離・時間は実績値を優先し、旧記録は予定値へフォールバック。日付・種別・距離・時間・振り返りをAIへ渡し、未実施予定・他ユーザー・それ以前の記録は含めません。振り返りは1件2000文字までで、指示ではなく記録データとして扱います。実績がない場合は練習歴や体力を推測せず控えめにするよう指示します。
- 提案はDBへ保存せず、ユーザーと対象期間に結び付いた署名付きトークン（有効1時間）として返します。キャンセルはトークンを画面から破棄するだけです。再読み込み後は再提案してください。API応答の共有キャッシュは禁止したままです。
- `POST /weekly_plans/save` に `proposal_token` を送ると、確認した7日間だけを1トランザクションで保存します。完了・実績・振り返りがある日（完了取消後も含む）は保持します。提案後に実績が登録された場合も保持します。既存記録が時間上限を超えていても、実績を削って合わせる処理はしません。
- 同じ提案を再送しても二重適用しません。通信失敗で保存結果が不明な場合は、同じ提案の「この内容で保存」を再試行してください。保存後に別操作で編集・削除した内容も、再送によって元に戻しません。異なる提案や他の操作との保存競合はユーザー単位のDBロックで検出します。確認後にプロフィールや未実施予定が変わっていた場合は409で全体を取り消し、再提案を求めます。期限切れ・改ざん・別ユーザーのトークンは422、日本時間の日付が変わった未保存の提案は409です。
- 互換性のため旧 `POST /training_records`（生成して直接保存）は残していますが、新しい画面では使用しません。新しい確認フローは上記の2エンドポイントを使います。

追加マイグレーションは `20261022000000_add_weekly_plan_support.rb` です。profilesにjsonbの `weekly_availability`（NOT NULL・default `{}`）、再送の二重適用を防ぐ `training_plan_commits`（user、proposal_idのunique制約、対象期間）を追加します。提案本文やトークン自体はDBへ保存しません。既存データの削除・変換や新しい環境変数は不要です。

反映順は **#35 → このPRのRails/migration → フロント** です。Railsの起動時 `db:prepare` 成功と稼働確認後、同じリリースのフロントを反映します。Vercelの自動反映が先行する場合は本番ビルドを一時待機させ、Rails確認後に解除して対象mainを再ビルドしてください。この作業では本番設定を変更していません。追加カラム・テーブルは残したままアプリを戻せますが、ロールバック後の旧画面は即時保存方式へ戻る点に注意してください。

#### 今回含まないカレンダー調整（別PR）

以下は未実装です。現在のカレンダーからは実績の編集と予定の閲覧ができ、特定日の時間変更・休みへの変更・予定移動・1日だけの再提案はできません。

次のPRでは、日付別の利用可能時間をプロフィールとは別に保存し、その日のみの提案→確認→保存へつなげます。未実施の「予定を調整」と完了済みの「実績を編集」を分離します。移動は移動元・先を同じトランザクションで確認し、移動先に予定・実績があれば409で止め、無断で置換しません。移動先の時間上限も確認し、短縮が必要なら再提案して確認します。これらの変更をプロフィールの普段の設定へ反映しない設計にします。

#### 検証と未確認事項

RSpecは92件・失敗0・既存pending 2件。入力形式・曜日別上限・休養・7日分の日付・提案前後のDB不変・確定・再送・同時保存・競合時の全体ロールバック・実績/振り返り保持・署名/期限/ユーザー分離・CSRF/ログアウト失効・実績を含むAI入力を検証しました。OpenAPI再生成、RuboCop（69ファイル・違反0）、Brakeman（警告0）、型チェック、Lint、フォーマット、フロントの3テスト（プロキシ/SSR・タイム変換・日本時間境界）、本番ビルドも成功しました。

ローカルChromeでは専用一時DBと実Next/Railsを使用し、未設定案内→その他25分/休み/既定時間の登録→7日間提案→再提案→キャンセル→模擬AIエラー→再試行→保存→競合時の拒否まで確認しました。提案・キャンセル・エラー前後で既存記録のハッシュが不変であり、確定後は7件・保存履歴1件で実績4.25km/28分/振り返りが保持されることをDB照合しました。

この検証のGoogle本人確認・OpenAI外部応答は模擬です。実Googleとのログイン、実OpenAIの生成内容・待ち時間・負荷、今回のコードの本番動作は未確認です。本番反映は行っていません。

### 練習管理フロー改善の反映手順

このブランチには `20261021000000_add_actuals_to_training_records.rb` が含まれます。`actual_distance_km`（decimal）と `actual_duration_minutes`（integer）のnullableカラムを追加します。既存データの変更・削除や新しい環境変数は不要です。

1. ローカル/CIでRSpec・OpenAPI整合性・RuboCop・Brakeman、フロントの型・Lint・フォーマット・プロキシ/SSR統合テスト・本番ビルドを確認します。
2. Renderへbackendを反映し、起動時の `db:prepare` で追加マイグレーションが成功してからPumaが起動することを確認します。既存の `PATCH { completed: true }` も引き続き使用できます。
3. Vercelへfrontendを反映します。初回の同一オリジン移行は完了済みで、通常の自動デプロイ設定を維持します。backendとfrontendの反映が前後する短い時間は、新しい実績登録の利用を避けてください。
4. テストアカウントでプロフィール登録→予定生成→実績保存→日/週/月集計→実績編集/取消を確認します。再生成で実績が消えないこと、認証・CSRF拒否・ログアウト後の失効も確認します。

APIの追加項目は `PATCH /training_records/:id` の `actual_distance_km`（0〜999.99km）、`actual_duration_minutes`（1〜1440の整数）、`feedback`（最大2000文字）です。応答のrecordにも実績カラムを返します。詳細はOpenAPIを参照してください。

ローカルブラウザ検証では一時DBを使い、Google認証とOpenAIの外部応答のみを模擬します。実際のAI応答品質や、この改善ブランチの本番動作確認とは区別します。

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

1. フロントエンドがCookie付きで`GET /csrf`を呼び、RailsのCSRFトークンを取得します。応答は`Cache-Control: private, no-store`です。
2. `authenticity_token`付きのフォームを`POST /auth/google_oauth2`へ送信します。GETによるOAuth開始は無効です。
3. OmniAuthがGoogleのコールバックで`state`を検証し、ログイン成功時にOAuth用セッションをリセットして新しい認証セッションを発行します。同じブラウザの旧認証セッションは失効します。
4. 保護APIはリクエストごとにDBで期限と失効状態を確認します。有効期限は発行から30日間で、未認証・改ざん・期限切れ・失効済みのCookieは401になります。
5. POST/PATCH/DELETEは`GET /csrf`で取得した`X-CSRF-Token`が必要です。Originが付いている場合は明示したフロントエンドのOriginだけを許可し、不正なトークンやOriginは403になります。
6. `DELETE /logout`は対象セッションをDBで失効させ、Cookieを削除します。成功後はフロントをトップへページ全体で再読み込みし、表示中のユーザーデータとクライアントのルーターキャッシュを破棄します。保存済みCookieを再送しても認証できません。他端末のセッションは維持されます。

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

- ブラウザのAPI通信は同一オリジンの `/api` 経由に限定し、RailsのCORSミドルウェアは使用しません。プロキシが転送するOriginは引き続きCSRF対策として検証します。RenderへのクロスオリジンFetchはサポートしません。
- ブラウザのFetchは既定の `credentials: "same-origin"` を使うため、同一オリジンの `/api` へのCookie送信に `include` の指定は不要です。
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

1. Googleの新callback URIと環境変数を確認します。初回切り替え中は短いメンテナンス時間を設けます。Vercelの本番ビルドは下記のIgnored Build Stepで一時待機させ、Renderより先に切り替わらないようにします（設定保存済み）。Previewは通常どおりビルドします。
2. このPRをmainへマージします。RenderはOn Commitでデプロイします。Root Directoryは `backend`、Docker Commandは `./bin/docker-entrypoint ./bin/rails server -b 0.0.0.0` です。Dockerfileの既定CMDも同じに揃えているため、手動のコマンド上書きがなくても同じ起動順になります。`rails server`単独に上書きするとDB準備を迂回するため、この起動経路を維持してください。
3. 起動時に `bin/docker-entrypoint` が `./bin/rails db:prepare` を実行します。DBが既存なら未適用マイグレーションを適用し、新規ならスキーマを準備します。成功してから `exec` でRailsを起動します。失敗時はスクリプトが終了し、Railsはリクエストを受け付けません。FreeプランでのShellや有料のPre-deploy commandは不要です。
4. Renderの稼働コミットが対象のmainコミットであること、DB準備が成功してからPumaが起動したことをログで確認し、Render `/health` の200を確認します。追加マイグレーションは `20261019000000_create_login_sessions.rb`（#33由来）です。既存データの削除・変換はありません。起動失敗時はログを確認して修正・再デプロイし、Vercelの待機を解除しません。
5. 新Railsの反映後、VercelのIgnored Build Stepを元の既定設定へ戻し、対象のmainコミットをProductionへ手動デプロイします。`NEXT_PUBLIC_*` とrewrite先はビルド時に確定するため、保存済みProduction変数を使って新コードを再ビルドします。旧mainの再デプロイはしません。
6. `https://runplan.tagokoro.dev/api/health` の200と、下記の本番検証を確認します。既存ユーザーは再ログインが必要です。古いRenderホストのCookieは移行しません。

初回切り替え用のVercel設定（Project: `run-model` / Scope: `tagokoros-projects`）:

```sh
if [ "$VERCEL_ENV" = "production" ]; then exit 0; else exit 1; fi
```

Ignored Build Stepでは終了コード0がビルドのスキップ、1がビルドの継続です。この設定中はmainへのpushでVercel本番が更新されません。元の `commandForIgnoringBuildStep` は `null` でした。新Rails確認後は、認証済みVercel CLIで次のように解除できます。

```bash
cat > /tmp/runplan-restore-build.json <<'JSON'
{"commandForIgnoringBuildStep":null}
JSON
vercel api /v9/projects/run-model --scope tagokoros-projects \
  -X PATCH --input /tmp/runplan-restore-build.json --silent
```

設定の解除だけでは、すでにスキップされたコミットのデプロイは開始しません。解除後に対象mainコミットのProductionデプロイを実行してください。

ロールバックは対応するbackend/frontendを一緒に戻します。新テーブルは残せますが、旧認証へ戻すと#33で解消したCookie再利用の問題も戻るため、原則は修正して前進します。
期限切れ・失効済みレコードは `LoginSession.where("expires_at <= ? OR revoked_at IS NOT NULL", Time.current).delete_all` で定期削除できます。

### 作業時点の反映状況（2026-10-20）

- Vercel: `NEXT_PUBLIC_API_BASE_URL` を新入口へ更新済み。既存のProduction/Preview共通変数の型を維持して更新しました。`API_UPSTREAM_ORIGIN` はProductionに追加済み。設定保存後の本番ビルドは未実施です。初回切り替え用にProductionだけをスキップするIgnored Build Stepを設定済み（従来値null）。新Rails確認後に上記手順で解除します。
- Render: `FRONTEND_URL` は既に正しい値でした。`SESSION_SAME_SITE=lax` と `GOOGLE_OAUTH_CALLBACK_URL` を追加し、Save onlyで保存済み。新コードのデプロイ・本番マイグレーションは未実施です。Docker Commandが起動時db:prepareを通る設定であることも確認済みです。
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

起動順は `spec/deployment/docker_entrypoint_spec.rb` でDB準備成功後の起動、失敗時の起動中断、管理コマンドでDB準備を行わないことを検証します。ローカルの実Railsと一時DBでも、未適用のlogin_sessionsマイグレーションがPumaの待受開始前に完了すること、再起動の冪等性、DB接続失敗時に待受しないことを確認済みです。
ログアウトはChromeで模擬Googleログイン→認証付き予定画面→SignOutを操作し、トップへページ全体が再読み込みされ、個人データが消えることを確認済みです。

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

- メニュー自体の編集・日付変更
- 目標レースまでの進捗表示
- 週単位の負荷管理
- AIによる振り返りコメント生成
- ランニング計画生成に特化した自作モデルの作成
