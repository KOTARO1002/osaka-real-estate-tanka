# 大阪府マンション㎡単価ダッシュボード

国土交通省「不動産情報ライブラリ」APIから取得した大阪府72市区町村のマンション成約データをもとに、過去5年〜最新の㎡単価推移をインタラクティブに確認できるWebサイト。

## デモ

公開URL: https://kotaro1002.github.io/osaka-real-estate-tanka/

## 機能

- **時系列推移**: 市区町村×築年数×面積帯ごとの四半期㎡単価折れ線
- **市区町村比較**: 最新四半期の全72市区町村の㎡単価棒グラフ
- **ヒートマップ**: 選択した市区町村の築年数×面積帯マトリクス
- ホバーで件数表示、サンプル件数5件未満は薄色で警告

## データソース

[国土交通省 不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/) (XIT001 API)
※ 公開には利用規約があります。利用前に必ずご確認ください。

## データ更新手順

1. APIキーを取得し `local_config.py` に設定:

   ```bash
   cp local_config.example.py local_config.py
   # local_config.py を編集して API_KEY = "..." を設定
   ```

2. 仮想環境の構築:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate     # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. データ取得（5〜10分）:

   ```bash
   python -m scripts.run
   ```

   特定の期間や市区町村のみを更新する場合:

   ```bash
   python -m scripts.run --start-year 2024 --cities 27128,27127
   ```

4. ローカル動作確認:

   ```bash
   cd docs && python3 -m http.server 8765
   # http://localhost:8765 を開く
   ```

5. GitHubに push し、Pagesが自動デプロイ:

   ```bash
   git add docs/data.json
   git commit -m "data: update dataset"
   git push
   ```

## 開発

テスト実行:

```bash
pip install -r requirements-dev.txt
pytest
```

## ディレクトリ構成

```
scripts/        # データ取得・集計スクリプト
tests/          # pytestテスト
docs/           # GitHub Pages配信（HTML/JS/CSS/data.json）
legacy/         # 旧スクリプト（参考用）
specs/, plans/  # 設計書・実装プラン
```

## ライセンス

MIT
