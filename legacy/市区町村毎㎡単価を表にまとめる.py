import requests
import pandas as pd
import os

# APIキー
API_KEY = ''  # legacy: key removed

# 大阪府の市区町村コードと名前のリスト
city_info = [
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
    {"name": "千早赤阪村", "code": "27383"}
]

# 築年数の範囲
age_ranges = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]

# 専有面積の範囲
area_ranges = [(50, 59), (60, 69), (70, 79), (80, 89), (90, 99), (100, 120)]

# 期間（年、四半期）
year = 2025
quarters = [1, 2, 3, 4]  # 全四半期

# APIからデータを取得する関数
def get_real_estate_data(year, quarter, city_code, api_key):
    url = f'https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?year={year}&quarter={quarter}&city={city_code}&key={api_key}'
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to get real estate data. Status code: {response.status_code}, URL: {url}")
    return response.json()

# データをフィルタリングする関数
def filter_data(data, min_age, max_age, min_area, max_area):
    filtered_data = []
    current_year = 2025

    for item in data:
        try:
            building_year = item.get('BuildingYear', '').strip()
            if building_year and building_year.endswith('年'):
                building_year = int(building_year[:-1])
                age = current_year - building_year
            else:
                age = None  # 築年数が取得できない場合は無視
            area = float(item.get('Area', 0))
            if item.get('PriceCategory') == '成約価格情報' and (age is not None and min_age <= age <= max_age) and min_area <= area <= max_area:
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
def main(api_key, city_info, year, quarters, age_ranges, area_ranges):
    desktop_path = os.path.join(os.path.expanduser("~"), "OneDrive", "デスクトップ", "real_estate_data.xlsx")
    
    with pd.ExcelWriter(desktop_path, engine='xlsxwriter') as writer:
        for city in city_info:
            city_code = city["code"]
            city_name = city["name"]
            all_results = []

            for quarter in quarters:
                try:
                    data = get_real_estate_data(year, quarter, city_code, api_key)
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
                    print(f"Failed to process data for city code {city_code}, quarter {quarter}: {e}")

            if all_results:
                df = pd.DataFrame(all_results)
                df_pivot = df.pivot_table(index=['min_area', 'max_area'], columns=['min_age', 'max_age'], values='average_price_per_sqm', aggfunc='first')
                df_pivot = df_pivot.fillna("データ無し")
                df_pivot.columns = [f"{col[0]}-{col[1]}" for col in df_pivot.columns]  # マルチインデックスを解除
                df_pivot.reset_index(inplace=True)
                df_pivot.to_excel(writer, sheet_name=city_name, index=False)

                workbook = writer.book
                worksheet = writer.sheets[city_name]
                cell_format = workbook.add_format({'font_name': 'Meiryo'})  # 日本語フォントを設定
                for col_num, value in enumerate(df_pivot.columns.values):
                    worksheet.write(0, col_num, value, cell_format)  # ヘッダーに日本語フォントを適用
                for row_num, row_data in enumerate(df_pivot.values):
                    for col_num, cell_data in enumerate(row_data):
                        worksheet.write(row_num + 1, col_num, cell_data, cell_format)  # データセルに日本語フォントを適用
            else:
                print(f"No data available for {city_name}")

    print(f"エクセルファイルはデスクトップに保存されました: {desktop_path}")

if __name__ == '__main__':
    api_key = ''  # legacy: key removed
    year = 2024
    quarters = [1, 2, 3, 4]  # 全四半期
    age_ranges = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]  # 築年数の範囲
    area_ranges = [(50, 60), (60, 70), (70, 80), (80, 90), (90, 100), (100, 120)]  # 専有面積の範囲

    main(api_key, city_info, year, quarters, age_ranges, area_ranges)
