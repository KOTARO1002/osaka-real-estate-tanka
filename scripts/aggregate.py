from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple


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


Bin = Tuple[int, int]


def find_bin(value: Optional[float], bins: List[Bin]) -> Optional[Bin]:
    if value is None:
        return None
    for low, high in bins:
        if low <= value <= high:
            return (low, high)
    return None


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
