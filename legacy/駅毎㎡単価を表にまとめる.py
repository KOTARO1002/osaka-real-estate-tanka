import pandas as pd
import os
import requests

# 駅コード（大阪駅）
station_code = "007773"
station_name = "鳳"

# APIからデータを取得する関数
def get_real_estate_data(year, quarter, station_code, api_key):
    url = f'https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?year={year}&quarter={quarter}&station={station_code}&priceClassification=02'
    headers = {
        'Ocp-Apim-Subscription-Key': api_key
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to get real estate data. Status code: {response.status_code}, URL: {url}, Response: {response.text}")
    return response.json()

# データをフィルタリングする関数
def filter_data(data, min_age, max_age, min_area, max_area):
    filtered_data = []
    current_year = 2023

    for item in data:
        try:
            building_year = item.get('BuildingYear', '').strip()
            if building_year and building_year.endswith('年'):
                building_year = int(building_year[:-1])
                age = current_year - building_year
            else:
                age = None  # 築年数が取得できない場合は無視
            area = float(item.get('Area', 0))
            if (age is not None and min_age <= age <= max_age) and min_area <= area <= max_area:
                filtered_data.append(item)
        except ValueError as e:
            print(f"Error processing item: {item}, error: {e}")

    return filtered_data

# 平均平米単価を計算する関数
def calculate_average_price_per_sqm(filtered_data):
    total_price_per_unit = sum(float(item['TradePrice']) / float(item['Area']) for item in filtered_data)
    average_price_per_unit = total_price_per_unit / len(filtered_data)
    return average_price_per_unit

# メイン関数
def main(api_key, station_code, station_name, year, quarters, age_ranges, area_ranges):
    desktop_path = os.path.join(os.path.expanduser("~"), "OneDrive", "デスクトップ", f"real_estate_data_{station_name}.xlsx")

    with pd.ExcelWriter(desktop_path, engine='xlsxwriter') as writer:
        all_results = []

        for quarter in quarters:
            try:
                data = get_real_estate_data(year, quarter, station_code, api_key)
                for min_age, max_age in age_ranges:
                    for min_area, max_area in area_ranges:
                        filtered_data = filter_data(data.get('data', []), min_age, max_age, min_area, max_area)
                        if filtered_data:
                            average_price_per_unit = calculate_average_price_per_sqm(filtered_data)
                            average_price_per_unit = int(average_price_per_unit)  # 小数点以下を切り捨て
                            all_results.append({
                                'min_age': min_age,
                                'max_age': max_age,
                                'min_area': min_area,
                                'max_area': max_area,
                                'average_price_per_sqm': average_price_per_unit
                            })
                        else:
                            all_results.append({
                                'min_age': min_age,
                                'max_age': max_age,
                                'min_area': min_area,
                                'max_area': max_area,
                                'average_price_per_sqm': "データ無し"
                            })
            except Exception as e:
                print(f"Failed to process data for station code {station_code}, quarter {quarter}: {e}")

        if all_results:
            df = pd.DataFrame(all_results)
            df_pivot = df.pivot_table(index=['min_area', 'max_area'], columns=['min_age', 'max_age'], values='average_price_per_sqm', aggfunc='first')
            df_pivot = df_pivot.fillna("データ無し")
            df_pivot.columns = [f"{col[0]}-{col[1]}" for col in df_pivot.columns]  # マルチインデックスを解除
            df_pivot.reset_index(inplace=True)
            df_pivot.to_excel(writer, sheet_name=station_name, index=False)

            workbook = writer.book
            worksheet = writer.sheets[station_name]
            cell_format = workbook.add_format({'font_name': 'Meiryo'})  # 日本語フォントを設定
            for col_num, value in enumerate(df_pivot.columns.values):
                worksheet.write(0, col_num, value, cell_format)  # ヘッダーに日本語フォントを適用
            for row_num, row_data in enumerate(df_pivot.values):
                for col_num, cell_data in enumerate(row_data):
                    worksheet.write(row_num + 1, col_num, cell_data, cell_format)  # データセルに日本語フォントを適用
        else:
            print(f"No data available for {station_name}")

    print(f"エクセルファイルはデスクトップに保存されました: {desktop_path}")

if __name__ == '__main__':
    api_key = ''  # legacy: key removed
    year = 2023
    quarters = [1, 2, 3, 4]  # 全四半期
    age_ranges = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]  # 築年数の範囲
    area_ranges = [(50, 59), (60, 69), (70, 79), (80, 89), (90, 99), (100, 120)]  # 専有面積の範囲

    main(api_key, station_code, station_name, year, quarters, age_ranges, area_ranges)
