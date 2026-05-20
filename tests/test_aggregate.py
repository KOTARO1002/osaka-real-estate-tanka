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
