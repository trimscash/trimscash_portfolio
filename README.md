# trimscash portfolio

trimscash のポートフォリオサイト。[trims.cash](https://trims.cash) で公開中。

## 技術スタック

- [Astro](https://astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)
- GitHub Pages (自動デプロイ)

## プロジェクト構成

```
/
├── public/               # 静的ファイル（画像、SVGアイコンなど）
│   └── contents/works/  # 作品画像
├── src/
│   ├── components/       # Astroコンポーネント
│   ├── contents/         # コンテンツ（Markdown/JSON）
│   ├── pages/            # ページ（index.astro, 404.astro）
│   ├── styles/           # グローバルCSS
│   └── types.ts          # TypeScript型定義
└── package.json
```

## コマンド

| コマンド          | 説明                                      |
| :---------------- | :---------------------------------------- |
| `npm install`     | 依存パッケージのインストール              |
| `npm run dev`     | ローカル開発サーバー起動 (localhost:4321) |
| `npm run build`   | 本番ビルド (`./dist/`)                    |
| `npm run preview` | ビルド結果のプレビュー                    |
| `npm run lint`    | ESLintによる静的解析                      |
| `npm run format`  | Prettierによるコード整形                  |
