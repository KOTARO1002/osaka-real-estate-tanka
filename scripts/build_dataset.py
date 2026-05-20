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
