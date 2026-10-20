# RunScheduler frontend

TypeScript / Next.jsのフロントエンドです。APIは同一ホストの `/api` を経由します。

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

`http://localhost:3001` で起動します。Railsを `http://localhost:3000` で起動してください。
`NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`、`API_UPSTREAM_ORIGIN=http://localhost:3000` を使います。
`.env` 等に従来のRender直結URLがある場合は、新しい入口へ更新してください。

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:proxy
pnpm build
```

`test:proxy` は模擬RailsとNext.jsを一時ポートで起動し、通信内容・Cookie・SSRを検証します。
本番の環境変数、Google OAuth設定、マイグレーション、反映順は[ルートREADME](../README.md#同一オリジン構成と本番設定)を参照してください。
API入口とrewrite先はビルド時に決まるため、Vercel環境変数の保存後は新コードでの再ビルドが必要です。
