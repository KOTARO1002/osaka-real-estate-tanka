import argparse
import json
import os
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
        API_KEY = os.environ.get("MLIT_API_KEY", "")
    if not API_KEY:
        sys.exit(
            "ERROR: APIキーが取得できません。"
            "ローカルでは local_config.py に API_KEY を設定するか、"
            "環境変数 MLIT_API_KEY をセットしてください。"
        )

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
