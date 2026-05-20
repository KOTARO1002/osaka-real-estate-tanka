# 大阪府マンション㎡単価インタラクティブWebサイト 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 大阪府72市区町村の過去5年〜最新のマンション成約㎡単価を可視化するインタラクティブWebサイトを構築しGitHub Pagesで公開する

**Architecture:** Pythonで国土交通省APIからデータ取得→集計→単一JSON出力。素のHTML/JS+Plotly.jsでフロントエンドを構成し、GitHub Pagesで配信。ビルドステップなし、依存最小。

**Tech Stack:** Python 3.9+, requests, pytest, Plotly.js (CDN), HTML/CSS/JS

---

## ファイル構造

```
平米単価出力アプリ/                                  (=リポジトリルート)
├─ scripts/
│  ├─ __init__.py
│  ├─ cities.py             # 大阪府72市区町村のコード・名前
│  ├─ config.py             # 定数（築年数bin、面積帯bin、対象期間など）
│  ├─ api_client.py         # MLIT API クライアント（リトライ含む）
│  ├─ aggregate.py          # 集計ロジック（pure functions）
│  ├─ build_dataset.py      # 全体オーケストレーション
│  └─ run.py                # CLIエントリポイント
├─ tests/
│  ├─ __init__.py
│  ├─ test_aggregate.py
│  ├─ test_api_client.py
│  └─ test_build_dataset.py
├─ docs/                    # GitHub Pages配信ディレクトリ
│  ├─ index.html
│  ├─ app.js
│  ├─ style.css
│  └─ data.json             # スクリプトで生成
├─ specs/
│  └─ 2026-05-18-osaka-real-estate-site-design.md  (作成済み)
├─ plans/
│  └─ 2026-05-18-osaka-real-estate-site.md         (このファイル)
├─ legacy/                  # 既存スクリプトを退避（参考用）
│  ├─ 市区町村毎㎡単価を表にまとめる.py
│  ├─ 駅毎㎡単価を表にまとめる.py
│  └─ 阪和線平米単価表にまとめる.py
├─ local_config.example.py  # APIキーテンプレ（git管理）
├─ local_config.py          # 実APIキー（.gitignore対象。Python標準ライブラリの`secrets`と衝突しない名前）
├─ .gitignore
├─ requirements.txt
├─ requirements-dev.txt
├─ pytest.ini
└─ README.md
```

各ファイルは単一責務。`scripts/aggregate.py` と `scripts/api_client.py` は独立してテスト可能なpure関数 / 副作用関数として明確に分離する。

---

## Task 1: プロジェクト構造の作成と秘匿情報の隔離

**Files:**
- Create: `local_config.py`
- Create: `local_config.example.py`
- Create: `.gitignore`
- Create: `requirements.txt`
- Create: `requirements-dev.txt`
- Create: `pytest.ini`
- Create: `scripts/__init__.py`
- Create: `tests/__init__.py`
- Move: 既存3ファイル → `legacy/` フォルダへ移動し、APIキー部分を削除

- [ ] **Step 1: フォルダ作成**

```bash
cd "/mnt/c/Users/kouma/OneDrive/デスクトップ/作成プログラム/平米単価出力アプリ"
mkdir -p scripts tests docs legacy
```

- [ ] **Step 2: `.gitignore` を作成**

```
# secrets
local_config.py
*.key
.env

# python
__pycache__/
*.pyc
.pytest_cache/
.venv/
venv/

# cache files
*.cache
.cache/

# OS
.DS_Store
Thumbs.db
desktop.ini
```

- [ ] **Step 3: `local_config.example.py` を作成（git管理対象）**

```python
# Copy this file to local_config.py and set your actual API key.
# local_config.py is .gitignored to keep the key out of version control.

API_KEY = "YOUR_API_KEY_HERE"
```

- [ ] **Step 4: `local_config.py` を作成（既存ファイルからAPIキーを移植）**

```python
API_KEY = "e3391951a76a49d4baddfb8630d0821f"
```

- [ ] **Step 5: `requirements.txt` を作成**

```
requests>=2.31.0
```

- [ ] **Step 6: `requirements-dev.txt` を作成**

```
-r requirements.txt
pytest>=7.4.0
```

- [ ] **Step 7: `pytest.ini` を作成**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
```

- [ ] **Step 8: `scripts/__init__.py` を空ファイルで作成**

```python
```

- [ ] **Step 9: `tests/__init__.py` を空ファイルで作成**

```python
```

- [ ] **Step 10: 既存3ファイルを `legacy/` へ移動**

```bash
mv "市区町村毎㎡単価を表にまとめる.py" legacy/
mv "駅毎㎡単価を表にまとめる.py" legacy/
mv "阪和線平米単価表にまとめる.py" legacy/
```

- [ ] **Step 11: legacy/ 内3ファイルからAPIキーを削除**

各ファイル内の `API_KEY = 'e3391951a76a49d4baddfb8630d0821f'` または `api_key = 'e3391951a76a49d4baddfb8630d0821f'` を以下に置換:

```python
API_KEY = ''  # see secrets.py
```

```python
api_key = ''  # see secrets.py
```

検索コマンド:

```bash
grep -rn "e3391951a76a49d4baddfb8630d0821f" legacy/
```

すべて空文字に置き換えてから再度grepして残っていないことを確認。

- [ ] **Step 12: Python仮想環境を構築し依存をインストール**

```bash
cd "/mnt/c/Users/kouma/OneDrive/デスクトップ/作成プログラム/平米単価出力アプリ"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

期待出力: `Successfully installed requests-... pytest-...`

- [ ] **Step 13: pytestが起動できることを確認**

```bash
source .venv/bin/activate
pytest --version
```

期待: バージョン番号が表示される

---

## Task 2: 市区町村データモジュール

**Files:**
- Create: `scripts/cities.py`

- [ ] **Step 1: `scripts/cities.py` を作成**

```python
CITIES = [
    {"name": "都島区", "code": "27102"},
    {"name": "福島区", "code": "27103"},
    {"name": "此花区", "code": "27104"},
    {"name": "大阪市西区", "code": "27106"},
    {"name": "港区", "code": "27107"},
    {"name": "大正区", "code": "27108"},
    {"name": "天王寺区", "code": "27109"},
    {"name": "浪速区", "code": "27111"},
    {"name": "西淀川区", "code": "27113"},
    {"name": "東淀川区", "code": "27114"},
    {"name": "東成区", "code": "27115"},
    {"name": "生野区", "code": "27116"},
    {"name": "旭区", "code": "27117"},
    {"name": "城東区", "code": "27118"},
    {"name": "阿倍野区", "code": "27119"},
    {"name": "住吉区", "code": "27120"},
    {"name": "東住吉区", "code": "27121"},
    {"name": "西成区", "code": "27122"},
    {"name": "淀川区", "code": "27123"},
    {"name": "鶴見区", "code": "27124"},
    {"name": "住之江区", "code": "27125"},
    {"name": "平野区", "code": "27126"},
    {"name": "大阪市北区", "code": "27127"},
    {"name": "中央区", "code": "27128"},
    {"name": "堺区", "code": "27141"},
    {"name": "中区", "code": "27142"},
    {"name": "東区", "code": "27143"},
    {"name": "堺市西区", "code": "27144"},
    {"name": "南区", "code": "27145"},
    {"name": "堺市北区", "code": "27146"},
    {"name": "美原区", "code": "27147"},
    {"name": "岸和田市", "code": "27202"},
    {"name": "豊中市", "code": "27203"},
    {"name": "池田市", "code": "27204"},
    {"name": "吹田市", "code": "27205"},
    {"name": "泉大津市", "code": "27206"},
    {"name": "高槻市", "code": "27207"},
    {"name": "貝塚市", "code": "27208"},
    {"name": "守口市", "code": "27209"},
    {"name": "枚方市", "code": "27210"},
    {"name": "茨木市", "code": "27211"},
    {"name": "八尾市", "code": "27212"},
    {"name": "泉佐野市", "code": "27213"},
    {"name": "富田林市", "code": "27214"},
    {"name": "寝屋川市", "code": "27215"},
    {"name": "河内長野市", "code": "27216"},
    {"name": "松原市", "code": "27217"},
    {"name": "大東市", "code": "27218"},
    {"name": "和泉市", "code": "27219"},
    {"name": "箕面市", "code": "27220"},
    {"name": "柏原市", "code": "27221"},
    {"name": "羽曳野市", "code": "27222"},
    {"name": "門真市", "code": "27223"},
    {"name": "摂津市", "code": "27224"},
    {"name": "高石市", "code": "27225"},
    {"name": "藤井寺市", "code": "27226"},
    {"name": "東大阪市", "code": "27227"},
    {"name": "泉南市", "code": "27228"},
    {"name": "四條畷市", "code": "27229"},
    {"name": "交野市", "code": "27230"},
    {"name": "大阪狭山市", "code": "27231"},
    {"name": "阪南市", "code": "27232"},
    {"name": "島本町", "code": "27301"},
    {"name": "豊能町", "code": "27321"},
    {"name": "能勢町", "code": "27322"},
    {"name": "忠岡町", "code": "27341"},
    {"name": "熊取町", "code": "27361"},
    {"name": "田尻町", "code": "27362"},
    {"name": "岬町", "code": "27366"},
    {"name": "太子町", "code": "27381"},
    {"name": "河南町", "code": "27382"},
    {"name": "千早赤阪村", "code": "27383"},
]
```

- [ ] **Step 2: 動作確認**

```bash
source .venv/bin/activate
python -c "from scripts.cities import CITIES; print(f'{len(CITIES)} cities loaded'); print(CITIES[0])"
```

期待出力:
```
72 cities loaded
{'name': '都島区', 'code': '27102'}
```

---

## Task 3: 設定モジュール

**Files:**
- Create: `scripts/config.py`

- [ ] **Step 1: `scripts/config.py` を作成**

```python
from datetime import datetime

AGE_BINS = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]

AREA_BINS = [(50, 59), (60, 69), (70, 79), (80, 89), (90, 99), (100, 120)]

START_YEAR = 2021

API_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001"

REQUEST_INTERVAL_SEC = 0.3
MAX_RETRIES = 3
REQUEST_TIMEOUT_SEC = 30

TARGET_TYPE = "中古マンション等"
TARGET_PRICE_CATEGORY = "成約価格情報"


def current_year() -> int:
    return datetime.now().year


def list_year_quarters(start_year: int, end_year: int, end_quarter: int):
    """Return [(year, quarter), ...] from (start_year, Q1) to (end_year, end_quarter)."""
    result = []
    for year in range(start_year, end_year + 1):
        last_q = 4 if year < end_year else end_quarter
        for q in range(1, last_q + 1):
            result.append((year, q))
    return result
```

- [ ] **Step 2: 動作確認**

```bash
source .venv/bin/activate
python -c "from scripts.config import list_year_quarters; print(list_year_quarters(2021, 2022, 2))"
```

期待出力: `[(2021, 1), (2021, 2), (2021, 3), (2021, 4), (2022, 1), (2022, 2)]`

---

## Task 4: 集計関数のテスト（TDD: 築年数パース）

**Files:**
- Create: `tests/test_aggregate.py`
- Create: `scripts/aggregate.py`

- [ ] **Step 1: `tests/test_aggregate.py` に築年数パース関数の失敗テストを書く**

```python
from scripts.aggregate import parse_age


def test_parse_age_normal():
    assert parse_age("1995年", 2026) == 31


def test_parse_age_recent():
    assert parse_age("2024年", 2026) == 2


def test_parse_age_empty_returns_none():
    assert parse_age("", 2026) is None


def test_parse_age_none_returns_none():
    assert parse_age(None, 2026) is None


def test_parse_age_no_kanji_returns_none():
    assert parse_age("1995", 2026) is None


def test_parse_age_invalid_returns_none():
    assert parse_age("不明年", 2026) is None


def test_parse_age_whitespace_handled():
    assert parse_age(" 2020年 ", 2026) == 6
```

- [ ] **Step 2: テスト失敗を確認**

```bash
source .venv/bin/activate
pytest tests/test_aggregate.py::test_parse_age_normal -v
```

期待: `ModuleNotFoundError: No module named 'scripts.aggregate'` または同等のFAIL

- [ ] **Step 3: `scripts/aggregate.py` に最小実装**

```python
from typing import Optional


def parse_age(building_year: Optional[str], current_year: int) -> Optional[int]:
    if building_year is None:
        return None
    s = building_year.strip()
    if not s.endswith("年"):
        return None
    try:
        year = int(s[:-1])
    except ValueError:
        return None
    return current_year - year
```

- [ ] **Step 4: テスト通過を確認**

```bash
pytest tests/test_aggregate.py -v
```

期待: 7 passed

- [ ] **Step 5: コミット**

実際のgit initはTask 16で行うため、ここではコミットしない。Task 16でまとめて初コミットする。

---

## Task 5: 集計関数のテスト（TDD: ビン判定）

**Files:**
- Modify: `tests/test_aggregate.py`
- Modify: `scripts/aggregate.py`

- [ ] **Step 1: `tests/test_aggregate.py` に追記**

```python
from scripts.aggregate import find_bin


AGE_BINS = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]
AREA_BINS = [(50, 59), (60, 69), (70, 79), (80, 89), (90, 99), (100, 120)]


def test_find_bin_lower_edge():
    assert find_bin(0, AGE_BINS) == (0, 9)


def test_find_bin_upper_edge():
    assert find_bin(9, AGE_BINS) == (0, 9)


def test_find_bin_middle():
    assert find_bin(25, AGE_BINS) == (20, 29)


def test_find_bin_out_of_range():
    assert find_bin(50, AGE_BINS) is None


def test_find_bin_none_input():
    assert find_bin(None, AGE_BINS) is None


def test_find_bin_area_top_bucket():
    assert find_bin(120, AREA_BINS) == (100, 120)
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pytest tests/test_aggregate.py::test_find_bin_lower_edge -v
```

期待: `ImportError: cannot import name 'find_bin'`

- [ ] **Step 3: `scripts/aggregate.py` に追記**

```python
from typing import List, Optional, Tuple

Bin = Tuple[int, int]


def find_bin(value: Optional[float], bins: List[Bin]) -> Optional[Bin]:
    if value is None:
        return None
    for low, high in bins:
        if low <= value <= high:
            return (low, high)
    return None
```

- [ ] **Step 4: テスト通過を確認**

```bash
pytest tests/test_aggregate.py -v
```

期待: 13 passed

---

## Task 6: 集計関数のテスト（TDD: aggregate_records）

**Files:**
- Modify: `tests/test_aggregate.py`
- Modify: `scripts/aggregate.py`

- [ ] **Step 1: `tests/test_aggregate.py` に追記**

```python
from scripts.aggregate import aggregate_records


def make_record(price, area, building_year, type_="中古マンション等",
                category="成約価格情報"):
    return {
        "PriceCategory": category,
        "Type": type_,
        "TradePrice": str(price),
        "Area": str(area),
        "BuildingYear": building_year,
    }


def test_aggregate_records_basic():
    records = [
        make_record(60_000_000, 60, "2010年"),
        make_record(70_000_000, 65, "2008年"),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert "10-19" in result
    assert "60-69" in result["10-19"]
    bucket = result["10-19"]["60-69"]
    expected_avg = int(
        ((60_000_000 / 60) + (70_000_000 / 65)) / 2
    )
    assert bucket["avg"] == expected_avg
    assert bucket["n"] == 2


def test_aggregate_records_skips_non_target_type():
    records = [
        make_record(60_000_000, 60, "2010年", type_="宅地(土地)"),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}


def test_aggregate_records_skips_non_target_category():
    records = [
        make_record(60_000_000, 60, "2010年", category="不動産取引価格情報"),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}


def test_aggregate_records_skips_out_of_bins():
    records = [
        make_record(50_000_000, 45, "2010年"),
        make_record(50_000_000, 60, "1960年"),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}


def test_aggregate_records_skips_missing_building_year():
    records = [
        make_record(60_000_000, 60, ""),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}


def test_aggregate_records_skips_invalid_numbers():
    records = [
        make_record("abc", 60, "2010年"),
        make_record(60_000_000, "xyz", "2010年"),
        make_record(0, 60, "2010年"),
    ]
    result = aggregate_records(records, AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}


def test_aggregate_records_empty():
    result = aggregate_records([], AGE_BINS, AREA_BINS, current_year=2026)
    assert result == {}
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pytest tests/test_aggregate.py::test_aggregate_records_basic -v
```

期待: `ImportError: cannot import name 'aggregate_records'`

- [ ] **Step 3: `scripts/aggregate.py` に追記**

```python
from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple


def aggregate_records(
    records: Iterable[dict],
    age_bins: List[Bin],
    area_bins: List[Bin],
    current_year: int,
    target_type: str = "中古マンション等",
    target_category: str = "成約価格情報",
) -> Dict[str, Dict[str, Dict[str, int]]]:
    buckets: Dict[Tuple[Bin, Bin], List[float]] = defaultdict(list)

    for r in records:
        if r.get("PriceCategory") != target_category:
            continue
        if r.get("Type") != target_type:
            continue
        try:
            area = float(r.get("Area", 0))
            price = float(r.get("TradePrice", 0))
        except (ValueError, TypeError):
            continue
        if area <= 0 or price <= 0:
            continue
        age = parse_age(r.get("BuildingYear"), current_year)
        age_bin = find_bin(age, age_bins)
        area_bin = find_bin(area, area_bins)
        if age_bin is None or area_bin is None:
            continue
        buckets[(age_bin, area_bin)].append(price / area)

    result: Dict[str, Dict[str, Dict[str, int]]] = {}
    for (age_bin, area_bin), prices in buckets.items():
        key_age = f"{age_bin[0]}-{age_bin[1]}"
        key_area = f"{area_bin[0]}-{area_bin[1]}"
        result.setdefault(key_age, {})[key_area] = {
            "avg": int(sum(prices) / len(prices)),
            "n": len(prices),
        }
    return result
```

- [ ] **Step 4: テスト通過を確認**

```bash
pytest tests/test_aggregate.py -v
```

期待: 20 passed

---

## Task 7: APIクライアントのテスト（TDD: モック使用）

**Files:**
- Create: `tests/test_api_client.py`
- Create: `scripts/api_client.py`

- [ ] **Step 1: `tests/test_api_client.py` を作成**

```python
from unittest.mock import patch, Mock
import pytest
from scripts.api_client import fetch_quarter, APIError


def make_response(status_code=200, json_data=None):
    mock = Mock()
    mock.status_code = status_code
    mock.json.return_value = json_data or {"status": "OK", "data": []}
    mock.raise_for_status = Mock()
    if status_code >= 400:
        mock.raise_for_status.side_effect = Exception(f"HTTP {status_code}")
    return mock


def test_fetch_quarter_success():
    with patch("scripts.api_client.requests.get") as mock_get:
        mock_get.return_value = make_response(json_data={"data": [{"foo": "bar"}]})
        result = fetch_quarter(2024, 1, "27102", "APIKEY")
        assert result == {"data": [{"foo": "bar"}]}
        mock_get.assert_called_once()
        call = mock_get.call_args
        assert "27102" in str(call)
        assert call.kwargs["headers"]["Ocp-Apim-Subscription-Key"] == "APIKEY"


def test_fetch_quarter_retries_on_failure():
    with patch("scripts.api_client.requests.get") as mock_get, \
         patch("scripts.api_client.time.sleep"):
        mock_get.side_effect = [
            make_response(status_code=500),
            make_response(status_code=500),
            make_response(json_data={"data": []}),
        ]
        result = fetch_quarter(2024, 1, "27102", "APIKEY", max_retries=3)
        assert result == {"data": []}
        assert mock_get.call_count == 3


def test_fetch_quarter_raises_after_max_retries():
    with patch("scripts.api_client.requests.get") as mock_get, \
         patch("scripts.api_client.time.sleep"):
        mock_get.return_value = make_response(status_code=500)
        with pytest.raises(APIError):
            fetch_quarter(2024, 1, "27102", "APIKEY", max_retries=2)
        assert mock_get.call_count == 2
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pytest tests/test_api_client.py -v
```

期待: `ModuleNotFoundError: No module named 'scripts.api_client'`

- [ ] **Step 3: `scripts/api_client.py` を作成**

```python
import time
import requests

from scripts.config import (
    API_BASE_URL,
    MAX_RETRIES,
    REQUEST_TIMEOUT_SEC,
)


class APIError(Exception):
    pass


def fetch_quarter(
    year: int,
    quarter: int,
    city_code: str,
    api_key: str,
    max_retries: int = MAX_RETRIES,
    timeout: int = REQUEST_TIMEOUT_SEC,
) -> dict:
    headers = {"Ocp-Apim-Subscription-Key": api_key}
    params = {"year": year, "quarter": quarter, "city": city_code}

    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.get(
                API_BASE_URL, headers=headers, params=params, timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    raise APIError(
        f"Failed to fetch data for city={city_code}, "
        f"year={year}, quarter={quarter} after {max_retries} attempts: {last_error}"
    )
```

- [ ] **Step 4: テスト通過を確認**

```bash
pytest tests/test_api_client.py -v
```

期待: 3 passed

---

## Task 8: データセット構築関数のテスト（TDD）

**Files:**
- Create: `tests/test_build_dataset.py`
- Create: `scripts/build_dataset.py`

- [ ] **Step 1: `tests/test_build_dataset.py` を作成**

```python
from unittest.mock import patch
from scripts.build_dataset import build_dataset

SAMPLE_CITIES = [
    {"name": "都島区", "code": "27102"},
    {"name": "福島区", "code": "27103"},
]


def fake_fetch(year, quarter, city_code, api_key):
    return {
        "data": [
            {
                "PriceCategory": "成約価格情報",
                "Type": "中古マンション等",
                "TradePrice": "60000000",
                "Area": "65",
                "BuildingYear": "2010年",
            }
        ]
    }


def test_build_dataset_structure():
    with patch("scripts.build_dataset.fetch_quarter", side_effect=fake_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1), (2024, 2)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    assert "meta" in result
    assert "cities" in result
    assert "data" in result
    assert result["cities"] == SAMPLE_CITIES
    assert "27102" in result["data"]
    assert "2024Q1" in result["data"]["27102"]
    assert "10-19" in result["data"]["27102"]["2024Q1"]
    assert "60-69" in result["data"]["27102"]["2024Q1"]["10-19"]
    bucket = result["data"]["27102"]["2024Q1"]["10-19"]["60-69"]
    assert bucket["avg"] == int(60_000_000 / 65)
    assert bucket["n"] == 1


def test_build_dataset_meta_fields():
    with patch("scripts.build_dataset.fetch_quarter", side_effect=fake_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    meta = result["meta"]
    assert "generated_at" in meta
    assert meta["year_quarter_range"] == ["2024Q1", "2024Q1"]
    assert meta["age_bins"] == [[0, 9], [10, 19]]
    assert meta["area_bins"] == [[50, 59], [60, 69]]


def test_build_dataset_handles_api_error():
    call_count = {"n": 0}

    def flaky_fetch(year, quarter, city_code, api_key):
        call_count["n"] += 1
        if city_code == "27103":
            from scripts.api_client import APIError
            raise APIError("simulated")
        return fake_fetch(year, quarter, city_code, api_key)

    with patch("scripts.build_dataset.fetch_quarter", side_effect=flaky_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    assert "27102" in result["data"]
    assert "27103" not in result["data"]
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pytest tests/test_build_dataset.py -v
```

期待: `ModuleNotFoundError`

- [ ] **Step 3: `scripts/build_dataset.py` を作成**

```python
import time
from datetime import datetime, timezone, timedelta
from typing import List, Tuple

from scripts.aggregate import aggregate_records
from scripts.api_client import fetch_quarter, APIError
from scripts.config import REQUEST_INTERVAL_SEC


def build_dataset(
    cities: list,
    year_quarters: List[Tuple[int, int]],
    age_bins: list,
    area_bins: list,
    api_key: str,
    current_year: int,
) -> dict:
    data: dict = {}
    for city in cities:
        code = city["code"]
        per_quarter: dict = {}
        success = False
        for year, quarter in year_quarters:
            try:
                resp = fetch_quarter(year, quarter, code, api_key)
            except APIError as e:
                print(f"[skip] {code} {year}Q{quarter}: {e}")
                time.sleep(REQUEST_INTERVAL_SEC)
                continue
            records = resp.get("data", [])
            agg = aggregate_records(records, age_bins, area_bins, current_year)
            if agg:
                per_quarter[f"{year}Q{quarter}"] = agg
            success = True
            time.sleep(REQUEST_INTERVAL_SEC)
        if success:
            data[code] = per_quarter

    jst = timezone(timedelta(hours=9))
    return {
        "meta": {
            "generated_at": datetime.now(jst).isoformat(timespec="seconds"),
            "year_quarter_range": [
                f"{year_quarters[0][0]}Q{year_quarters[0][1]}",
                f"{year_quarters[-1][0]}Q{year_quarters[-1][1]}",
            ],
            "age_bins": [list(b) for b in age_bins],
            "area_bins": [list(b) for b in area_bins],
        },
        "cities": cities,
        "data": data,
    }
```

- [ ] **Step 4: テスト通過を確認**

```bash
pytest tests/ -v
```

期待: 23 passed (3 new + 20 from before)

---

## Task 9: CLIエントリポイント（小規模ライブテスト含む）

**Files:**
- Create: `scripts/run.py`

- [ ] **Step 1: `scripts/run.py` を作成**

```python
import argparse
import json
import sys
from pathlib import Path

from scripts.build_dataset import build_dataset
from scripts.cities import CITIES
from scripts.config import (
    AGE_BINS,
    AREA_BINS,
    START_YEAR,
    current_year,
    list_year_quarters,
)


def main():
    parser = argparse.ArgumentParser(description="Build Osaka real estate dataset")
    parser.add_argument(
        "--end-year",
        type=int,
        default=current_year(),
        help="End year (inclusive). Defaults to current year.",
    )
    parser.add_argument(
        "--end-quarter",
        type=int,
        default=4,
        help="End quarter for the end-year (1-4). Defaults to 4.",
    )
    parser.add_argument(
        "--start-year",
        type=int,
        default=START_YEAR,
        help=f"Start year (inclusive). Default: {START_YEAR}",
    )
    parser.add_argument(
        "--cities",
        type=str,
        default="all",
        help="Comma-separated city codes, or 'all' (default).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "docs" / "data.json",
    )
    args = parser.parse_args()

    try:
        from local_config import API_KEY
    except ImportError:
        sys.exit(
            "ERROR: local_config.py が見つかりません。"
            "local_config.example.py をコピーして local_config.py を作成しAPIキーを設定してください。"
        )
    if not API_KEY:
        sys.exit("ERROR: local_config.py の API_KEY が空です。")

    if args.cities == "all":
        cities = CITIES
    else:
        codes = set(args.cities.split(","))
        cities = [c for c in CITIES if c["code"] in codes]
        if not cities:
            sys.exit(f"ERROR: 指定された市区町村コードが見つかりません: {args.cities}")

    year_quarters = list_year_quarters(args.start_year, args.end_year, args.end_quarter)
    print(f"対象市区町村: {len(cities)} / 期間: {year_quarters[0]} 〜 {year_quarters[-1]}")
    print(f"総API呼び出し数（最大）: {len(cities) * len(year_quarters)}")

    dataset = build_dataset(
        cities=cities,
        year_quarters=year_quarters,
        age_bins=AGE_BINS,
        area_bins=AREA_BINS,
        api_key=API_KEY,
        current_year=current_year(),
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, separators=(",", ":"))

    print(f"完了: {args.output}")
    print(f"取得できた市区町村数: {len(dataset['data'])}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 小規模ライブテスト：1市区町村×1四半期**

```bash
source .venv/bin/activate
python -m scripts.run --cities 27102 --start-year 2024 --end-year 2024 --end-quarter 1 --output docs/data_test.json
```

期待:
- エラー無しで完了
- `docs/data_test.json` が生成される
- 「取得できた市区町村数: 1」と表示される

このステップでAPIが期待通り動くかを実地確認する。失敗時はエラーメッセージから原因を切り分け（APIキー誤り、エンドポイント誤り、ヘッダ方式誤り等）。

- [ ] **Step 3: 出力JSONの内容を確認**

```bash
python -c "import json; d = json.load(open('docs/data_test.json', encoding='utf-8')); print(json.dumps(d, ensure_ascii=False, indent=2)[:2000])"
```

期待: meta, cities, data セクションが存在し、`data['27102']['2024Q1']` 配下に集計結果がある

- [ ] **Step 4: テスト用ファイルを削除**

```bash
rm docs/data_test.json
```

---

## Task 10: 本番データ取得（全期間・全市区町村）

**Files:**
- Create/Update: `docs/data.json`

- [ ] **Step 1: 最新のAPI公開四半期を確認**

ユーザに「現在APIから取得可能な最新四半期」を質問する。または以下のコマンドで2026Q1を試して、データが空なら2025Q4に下げる。

```bash
source .venv/bin/activate
python -m scripts.run --cities 27128 --start-year 2026 --end-year 2026 --end-quarter 1 --output /tmp/probe.json
python -c "import json; d=json.load(open('/tmp/probe.json',encoding='utf-8')); print('keys:', list(d['data'].get('27128', {}).keys()))"
```

`keys: ['2026Q1']` のように出れば2026Q1利用可能。空なら `--end-quarter 4 --end-year 2025` を試す。

- [ ] **Step 2: 全期間・全市区町村でデータ取得**

確定した最新四半期を `END_QUARTER` `END_YEAR` として:

```bash
python -m scripts.run --end-year <END_YEAR> --end-quarter <END_QUARTER>
```

所要時間目安: 72市区町村×20四半期×0.3秒 = 約7分。

- [ ] **Step 3: 出力ファイルの妥当性確認**

```bash
ls -lh docs/data.json
python -c "
import json
d = json.load(open('docs/data.json', encoding='utf-8'))
print('cities in data:', len(d['data']))
print('meta:', d['meta'])
sample_city = next(iter(d['data']))
print('sample city:', sample_city, '/ quarters:', list(d['data'][sample_city].keys())[:5], '...')
"
```

期待:
- ファイルサイズ 1-3MB 程度
- cities in data: 60以上（一部市区町村はデータが少ない可能性あり）
- meta の `year_quarter_range` が正しい

---

## Task 11: フロントエンド HTML骨組み

**Files:**
- Create: `docs/index.html`

- [ ] **Step 1: `docs/index.html` を作成**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>大阪府マンション㎡単価ダッシュボード</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" charset="utf-8"></script>
</head>
<body>
  <header>
    <h1>大阪府マンション㎡単価ダッシュボード</h1>
    <p id="meta-info"></p>
  </header>

  <section class="controls">
    <label>市区町村:
      <select id="city-select"></select>
    </label>
    <label>築年数:
      <select id="age-select"></select>
    </label>
    <label>専有面積:
      <select id="area-select"></select>
    </label>
  </section>

  <section class="chart-section">
    <h2>1. 時系列推移</h2>
    <p class="chart-desc">選択した市区町村・築年数・面積帯における㎡単価の四半期推移</p>
    <div id="chart-trend" class="chart"></div>
  </section>

  <section class="chart-section">
    <h2>2. 市区町村比較（最新四半期）</h2>
    <p class="chart-desc">選択した築年数・面積帯における、全市区町村の最新四半期㎡単価</p>
    <div id="chart-compare" class="chart"></div>
  </section>

  <section class="chart-section">
    <h2>3. ヒートマップ（最新四半期）</h2>
    <p class="chart-desc">選択した市区町村の最新四半期、築年数×面積帯マトリクス</p>
    <div id="chart-heatmap" class="chart"></div>
  </section>

  <footer>
    <p>
      データ出典:
      <a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener">
        国土交通省 不動産情報ライブラリ
      </a>
      （XIT001 API）
    </p>
    <p class="note">
      ※ サンプル件数が5件未満の値は信頼性が低い可能性があります。
    </p>
  </footer>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: ローカルサーバで表示確認**

```bash
cd docs
python3 -m http.server 8765
```

ブラウザで http://localhost:8765 を開き、見出しとコントロール枠（空のドロップダウン）が表示されることを確認。`Ctrl+C` でサーバ停止。

---

## Task 12: スタイル

**Files:**
- Create: `docs/style.css`

- [ ] **Step 1: `docs/style.css` を作成**

```css
:root {
  --bg: #f7f8fb;
  --card: #ffffff;
  --text: #222;
  --muted: #666;
  --accent: #2c6cf6;
  --border: #e1e5ee;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, "Hiragino Sans", "Yu Gothic UI", "Meiryo", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
}

header {
  padding: 1.5rem 1rem;
  background: var(--card);
  border-bottom: 1px solid var(--border);
}

header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

#meta-info {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.controls label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: var(--muted);
}

.controls select {
  margin-top: 0.25rem;
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  min-width: 140px;
}

.chart-section {
  padding: 1.25rem 1rem;
  margin: 1rem;
  background: var(--card);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart-section h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.15rem;
}

.chart-desc {
  margin: 0 0 0.75rem 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.chart {
  width: 100%;
  min-height: 400px;
}

footer {
  padding: 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
}

footer .note {
  font-size: 0.8rem;
}

footer a {
  color: var(--accent);
}

@media (max-width: 640px) {
  .controls { flex-direction: column; }
  .controls select { width: 100%; }
  .chart { min-height: 320px; }
}
```

- [ ] **Step 2: ローカルサーバで表示確認**

```bash
cd docs
python3 -m http.server 8765
```

ブラウザで開き、フォントとレイアウトが整っていることを目視確認。

---

## Task 13: JS - データ読み込みとコントロール初期化

**Files:**
- Create: `docs/app.js`

- [ ] **Step 1: `docs/app.js` を作成**

```javascript
"use strict";

const state = {
  dataset: null,
  citySelect: null,
  ageSelect: null,
  areaSelect: null,
};

function ageBinLabel(bin) { return `${bin[0]}-${bin[1]}年`; }
function ageBinKey(bin) { return `${bin[0]}-${bin[1]}`; }
function areaBinLabel(bin) { return `${bin[0]}-${bin[1]}㎡`; }
function areaBinKey(bin) { return `${bin[0]}-${bin[1]}`; }

function populateSelect(selectEl, options) {
  selectEl.innerHTML = "";
  for (const { value, label } of options) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}

function initControls(dataset) {
  const cityOptions = dataset.cities.map(c => ({
    value: c.code, label: c.name,
  }));
  populateSelect(state.citySelect, cityOptions);

  const ageOptions = dataset.meta.age_bins.map(b => ({
    value: ageBinKey(b), label: ageBinLabel(b),
  }));
  populateSelect(state.ageSelect, ageOptions);

  const areaOptions = dataset.meta.area_bins.map(b => ({
    value: areaBinKey(b), label: areaBinLabel(b),
  }));
  populateSelect(state.areaSelect, areaOptions);
}

function renderAll() {
  if (!state.dataset) return;
  // Chart render calls (trend/compare/heatmap) are added in Tasks 14, 15, 16.
}

function onControlChange() {
  renderAll();
}

async function init() {
  state.citySelect = document.getElementById("city-select");
  state.ageSelect = document.getElementById("age-select");
  state.areaSelect = document.getElementById("area-select");

  const metaInfo = document.getElementById("meta-info");
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.dataset = await res.json();
  } catch (e) {
    metaInfo.textContent = `データ読み込みに失敗しました: ${e.message}`;
    return;
  }

  const meta = state.dataset.meta;
  metaInfo.textContent = `期間: ${meta.year_quarter_range[0]} 〜 ${meta.year_quarter_range[1]} / 更新: ${meta.generated_at}`;

  initControls(state.dataset);

  state.citySelect.addEventListener("change", onControlChange);
  state.ageSelect.addEventListener("change", onControlChange);
  state.areaSelect.addEventListener("change", onControlChange);

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
```

- [ ] **Step 2: ローカルサーバで表示確認**

```bash
cd docs
python3 -m http.server 8765
```

確認:
- ドロップダウンに市区町村・築年数・面積帯がそれぞれ表示される
- ヘッダに期間と更新時刻が表示される
- ブラウザコンソールにエラーが無い

---

## Task 14: グラフ1 時系列推移

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: `docs/app.js` の `renderAll()` 上に時系列描画関数を追加**

既存の `renderAll()` の上に以下を挿入:

```javascript
function getSortedQuarters(cityData) {
  return Object.keys(cityData).sort((a, b) => {
    const [ya, qa] = a.split("Q").map(Number);
    const [yb, qb] = b.split("Q").map(Number);
    return ya === yb ? qa - qb : ya - yb;
  });
}

function renderTrend(cityCode, ageKey, areaKey) {
  const cityData = state.dataset.data[cityCode] || {};
  const quarters = getSortedQuarters(cityData);
  const x = [];
  const y = [];
  const n = [];

  for (const yq of quarters) {
    const v = cityData[yq]?.[ageKey]?.[areaKey];
    x.push(yq);
    y.push(v ? v.avg : null);
    n.push(v ? v.n : 0);
  }

  const colors = n.map(c => c < 5 ? "rgba(44,108,246,0.35)" : "rgba(44,108,246,1)");

  const trace = {
    x, y,
    mode: "lines+markers",
    type: "scatter",
    name: "㎡単価",
    line: { color: "#2c6cf6" },
    marker: { color: colors, size: 8 },
    customdata: n,
    hovertemplate:
      "%{x}<br>㎡単価: %{y:,.0f} 円/㎡<br>件数: %{customdata}件<extra></extra>",
    connectgaps: false,
  };

  const layout = {
    margin: { t: 20, l: 70, r: 20, b: 50 },
    xaxis: { title: "四半期" },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f" },
    hovermode: "x unified",
  };

  Plotly.react("chart-trend", [trace], layout, { displayModeBar: false, responsive: true });
}
```

- [ ] **Step 2: `renderAll()` を更新**

```javascript
function renderAll() {
  if (!state.dataset) return;
  const cityCode = state.citySelect.value;
  const ageKey = state.ageSelect.value;
  const areaKey = state.areaSelect.value;
  renderTrend(cityCode, ageKey, areaKey);
}
```

- [ ] **Step 3: ローカルサーバで確認**

```bash
cd docs
python3 -m http.server 8765
```

確認:
- 折れ線グラフが表示される
- ドロップダウン変更でグラフが更新される
- ホバーで件数とㇸ単価が表示される
- サンプル数5未満の点が半透明になっている

---

## Task 15: グラフ2 市区町村比較

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: `renderTrend` の下に追加**

```javascript
function getLatestQuarter() {
  return state.dataset.meta.year_quarter_range[1];
}

function renderCompare(ageKey, areaKey) {
  const latest = getLatestQuarter();
  const rows = [];

  for (const city of state.dataset.cities) {
    const v = state.dataset.data[city.code]?.[latest]?.[ageKey]?.[areaKey];
    if (v) {
      rows.push({ name: city.name, avg: v.avg, n: v.n });
    }
  }
  rows.sort((a, b) => b.avg - a.avg);

  const colors = rows.map(r => r.n < 5 ? "rgba(44,108,246,0.35)" : "rgba(44,108,246,1)");

  const trace = {
    x: rows.map(r => r.name),
    y: rows.map(r => r.avg),
    type: "bar",
    marker: { color: colors },
    customdata: rows.map(r => r.n),
    hovertemplate:
      "%{x}<br>㎡単価: %{y:,.0f} 円/㎡<br>件数: %{customdata}件<extra></extra>",
  };

  const layout = {
    margin: { t: 20, l: 70, r: 20, b: 120 },
    xaxis: { tickangle: -45 },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f" },
    title: { text: `最新四半期: ${latest}`, font: { size: 12 }, x: 0 },
  };

  Plotly.react("chart-compare", [trace], layout, { displayModeBar: false, responsive: true });
}
```

- [ ] **Step 2: `renderAll()` に呼び出しを追加**

```javascript
function renderAll() {
  if (!state.dataset) return;
  const cityCode = state.citySelect.value;
  const ageKey = state.ageSelect.value;
  const areaKey = state.areaSelect.value;
  renderTrend(cityCode, ageKey, areaKey);
  renderCompare(ageKey, areaKey);
}
```

- [ ] **Step 3: ローカルサーバで確認**

棒グラフが値の降順で表示され、市区町村名がX軸に並ぶことを確認。

---

## Task 16: グラフ3 ヒートマップ

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: `renderCompare` の下に追加**

```javascript
function renderHeatmap(cityCode) {
  const latest = getLatestQuarter();
  const ageBins = state.dataset.meta.age_bins;
  const areaBins = state.dataset.meta.area_bins;
  const cityLatest = state.dataset.data[cityCode]?.[latest] || {};

  const x = ageBins.map(b => `${b[0]}-${b[1]}年`);
  const y = areaBins.map(b => `${b[0]}-${b[1]}㎡`);
  const z = [];
  const text = [];

  for (const areaBin of areaBins) {
    const row = [];
    const tRow = [];
    for (const ageBin of ageBins) {
      const v = cityLatest[`${ageBin[0]}-${ageBin[1]}`]?.[`${areaBin[0]}-${areaBin[1]}`];
      if (v) {
        row.push(v.avg);
        tRow.push(`${v.avg.toLocaleString()}<br>(${v.n}件)`);
      } else {
        row.push(null);
        tRow.push("");
      }
    }
    z.push(row);
    text.push(tRow);
  }

  const trace = {
    x, y, z,
    type: "heatmap",
    colorscale: "Viridis",
    hoverongaps: false,
    text,
    texttemplate: "%{text}",
    textfont: { color: "white", size: 11 },
    colorbar: { title: "円/㎡" },
  };

  const cityName = state.dataset.cities.find(c => c.code === cityCode)?.name || cityCode;
  const layout = {
    margin: { t: 30, l: 90, r: 20, b: 60 },
    xaxis: { title: "築年数" },
    yaxis: { title: "専有面積" },
    title: { text: `${cityName} / ${latest}`, font: { size: 12 }, x: 0 },
  };

  Plotly.react("chart-heatmap", [trace], layout, { displayModeBar: false, responsive: true });
}
```

- [ ] **Step 2: `renderAll()` 完全版**

```javascript
function renderAll() {
  if (!state.dataset) return;
  const cityCode = state.citySelect.value;
  const ageKey = state.ageSelect.value;
  const areaKey = state.areaSelect.value;
  renderTrend(cityCode, ageKey, areaKey);
  renderCompare(ageKey, areaKey);
  renderHeatmap(cityCode);
}
```

- [ ] **Step 3: ローカルサーバで確認**

ヒートマップが表示され、ホバーで値と件数が出ることを確認。

- [ ] **Step 4: 全画面の動作確認**

ブラウザで以下を確認:
- 3つのグラフがすべて描画される
- 市区町村変更で時系列＋ヒートマップが更新される
- 築年数/面積帯変更で時系列＋市区町村比較が更新される
- モバイルサイズ（DevToolsで切り替え）でレイアウトが崩れない

---

## Task 17: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md` を作成**

````markdown
# 大阪府マンション㎡単価ダッシュボード

国土交通省「不動産情報ライブラリ」APIから取得した大阪府72市区町村のマンション成約データをもとに、過去5年〜最新の㎡単価推移をインタラクティブに確認できるWebサイト。

## デモ

公開URL: `https://<USERNAME>.github.io/osaka-real-estate-tanka/`

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
````

---

## Task 18: GitHub公開準備（リポジトリ初期化）

**Files:**
- Create: `.git/` (via `git init`)

- [ ] **Step 1: 親リポジトリのworking treeから外す**

現在 `/mnt/c/Users/kouma` がgitリポジトリになっており、このプロジェクトはその中に含まれている。新規GitHubリポジトリとして独立させるため、プロジェクト直下で `git init` する。親リポジトリには本フォルダがコミットされない設計（親の `.gitignore` 確認を含む）。

```bash
cd "/mnt/c/Users/kouma/OneDrive/デスクトップ/作成プログラム/平米単価出力アプリ"
git init -b main
```

期待: `Initialized empty Git repository in .../平米単価出力アプリ/.git/`

- [ ] **Step 2: `.gitignore` が local_config.py を除外していることを確認**

```bash
git check-ignore -v local_config.py
```

期待: `.gitignore:2:local_config.py	local_config.py`

- [ ] **Step 3: ステージング**

```bash
git add scripts/ tests/ docs/index.html docs/app.js docs/style.css docs/data.json
git add legacy/ specs/ plans/
git add local_config.example.py .gitignore requirements.txt requirements-dev.txt pytest.ini README.md
```

- [ ] **Step 4: local_config.py がステージングに含まれていないことを最終確認**

```bash
git status
git diff --cached --name-only | grep "local_config\.py$" && echo "FAIL: local_config.py is staged!" || echo "OK: local_config.py is not in staging"
```

期待: `OK: local_config.py is not in staging`

- [ ] **Step 5: 初回コミット**

```bash
git commit -m "$(cat <<'EOF'
feat: initial release of Osaka real estate price-per-sqm dashboard

- Python data fetcher with retry and aggregation
- Interactive Plotly.js charts: time series, city comparison, heatmap
- Static site for GitHub Pages
EOF
)"
```

期待: 1ファイル目に多数のファイルがコミットされる

---

## Task 19: GitHubリモートリポジトリ作成・push

**Files:** N/A (リモート操作)

- [ ] **Step 1: ユーザにGitHubユーザ名を確認**

ユーザに以下を質問:
- GitHubユーザ名
- 公開時のリポジトリ名（デフォルト `osaka-real-estate-tanka`）

- [ ] **Step 2: `gh` CLI（GitHub CLI）が使えるか確認**

```bash
gh --version
```

ある場合はそのまま `gh auth status` を確認しTaskを続行。
ない場合はユーザにWebでリポジトリを作成してもらい、URLを教えてもらう。

- [ ] **Step 3a: gh CLIある場合 - リポジトリ作成＆push**

```bash
gh repo create <USERNAME>/osaka-real-estate-tanka --public --source . --remote origin --push
```

期待: リポジトリが作成され、mainブランチがpushされる

- [ ] **Step 3b: gh CLIない場合 - 手動remote設定＆push**

ユーザにGitHub上で空リポジトリを作成してもらい、表示されるURLで:

```bash
git remote add origin https://github.com/<USERNAME>/osaka-real-estate-tanka.git
git push -u origin main
```

- [ ] **Step 4: README の `<USERNAME>` 部分を実際のユーザ名に置換**

`README.md` 内の `<USERNAME>` を実際のGitHubユーザ名に置換し、コミット＆push:

```bash
git add README.md
git commit -m "docs: update demo URL in README"
git push
```

---

## Task 20: GitHub Pages 有効化と最終確認

**Files:** N/A (GitHub設定)

- [ ] **Step 1: GitHub Pagesを有効化**

ghで:

```bash
gh api -X POST repos/<USERNAME>/osaka-real-estate-tanka/pages -f source[branch]=main -f source[path]=/docs
```

または GitHub Web UI:
1. リポジトリ → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `/docs`
4. Save

- [ ] **Step 2: デプロイ完了を待つ（1-2分）**

```bash
gh run list --limit 5
```

または Actions タブで `pages-build-deployment` の完了を確認。

- [ ] **Step 3: 公開URLにアクセスして動作確認**

`https://<USERNAME>.github.io/osaka-real-estate-tanka/` にアクセス:
- ヘッダ表示
- ドロップダウン操作可能
- 3つのグラフが描画される
- ホバー操作が動く
- モバイルレイアウトが崩れない（DevToolsで切替）

期待通り表示されれば完了。

- [ ] **Step 4: 完了報告**

ユーザに公開URLを伝え、希望があれば調整（色合い、グラフ種類追加など）を承る。
