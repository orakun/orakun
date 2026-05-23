"""
Demo/test verisi üretir. Gerçek API'ye ihtiyaç duymadan uygulamayı test etmek için kullanın.
USD/TRY, EUR/TRY, Gram Altın için 2016-2026 gerçekçi fiyat tahminleri ve TÜFE verileri ekler.

Çalıştırma: python scripts/seed_demo.py

NOT: Gerçek veri için kendi makinenizde 'python scripts/fetch_tcmb.py' çalıştırın.
"""
import sqlite3
import random
from datetime import date, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "portfolio.db"


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def generate_price_series(
    start_date: date,
    end_date: date,
    start_price: float,
    end_price: float,
    volatility: float = 0.012,
) -> list[tuple[str, float]]:
    """Gerçekçi yürüyen rastgele yürüyüş (log-normal) fiyat serisi üretir."""
    prices = []
    current = start_date
    price = start_price
    total_days = (end_date - start_date).days
    log_drift = (end_price / start_price) ** (1 / max(total_days, 1)) - 1

    while current <= end_date:
        if current.weekday() < 5:  # Hafta içi
            prices.append((current.strftime("%Y-%m-%dT00:00:00.000Z"), round(price, 4)))
        noise = random.gauss(log_drift, volatility)
        price = max(price * (1 + noise), 0.01)
        current += timedelta(days=1)

    return prices


# Gerçekçi fiyat aralıkları (yaklaşık tarihsel değerler)
SERIES = [
    # (symbol, display_name, type, start_price, end_price, volatility)
    ("USD",        "ABD Doları",  "CURRENCY", 3.0,     37.5,   0.010),
    ("EUR",        "Euro",        "CURRENCY", 3.3,     40.5,   0.010),
    ("GRAM_ALTIN", "Gram Altın",  "GOLD",     115.0,   3700.0, 0.012),
]

# TÜFE endeksi (2003=100 bazlı, yaklaşık gerçek değerler)
CPI_DATA = {
    # (yıl, ay): endeks değeri
    (2016, 1): 244.0,  (2016, 6): 249.0,  (2016, 12): 255.0,
    (2017, 1): 258.0,  (2017, 6): 267.0,  (2017, 12): 278.0,
    (2018, 1): 283.0,  (2018, 6): 304.0,  (2018, 12): 336.0,
    (2019, 1): 341.0,  (2019, 6): 347.0,  (2019, 12): 357.0,
    (2020, 1): 361.0,  (2020, 6): 370.0,  (2020, 12): 386.0,
    (2021, 1): 392.0,  (2021, 6): 420.0,  (2021, 12): 481.0,
    (2022, 1): 507.0,  (2022, 6): 731.0,  (2022, 12): 870.0,
    (2023, 1): 905.0,  (2023, 6): 1105.0, (2023, 12): 1390.0,
    (2024, 1): 1460.0, (2024, 6): 1720.0, (2024, 12): 1950.0,
    (2025, 1): 1980.0, (2025, 6): 2050.0, (2025, 12): 2100.0,
    (2026, 1): 2120.0, (2026, 5): 2135.0,
}


def interpolate_cpi() -> list[tuple[int, int, float]]:
    """Aylık CPI değerlerini ara enterpolasyon ile doldurur."""
    sorted_keys = sorted(CPI_DATA.keys())
    result = []

    for i, (y1, m1) in enumerate(sorted_keys[:-1]):
        y2, m2 = sorted_keys[i + 1]
        v1 = CPI_DATA[(y1, m1)]
        v2 = CPI_DATA[(y2, m2)]

        # Başlangıç noktasını ekle
        result.append((y1, m1, v1))

        # Aradaki ayları doldur
        cur = date(y1, m1, 1)
        end = date(y2, m2, 1)
        total_months = (y2 - y1) * 12 + (m2 - m1)

        for step in range(1, total_months):
            if cur.month == 12:
                cur = date(cur.year + 1, 1, 1)
            else:
                cur = date(cur.year, cur.month + 1, 1)
            t = step / total_months
            v = lerp(v1, v2, t)
            result.append((cur.year, cur.month, round(v, 2)))

    # Son nokta
    y_last, m_last = sorted_keys[-1]
    result.append((y_last, m_last, CPI_DATA[(y_last, m_last)]))

    # Tekrarları kaldır (aynı yıl-ay birden fazla kez eklenmişse)
    seen = {}
    for y, m, v in result:
        seen[(y, m)] = v
    return [(y, m, v) for (y, m), v in sorted(seen.items())]


def ensure_asset(conn: sqlite3.Connection, symbol: str, display_name: str, asset_type: str) -> int:
    cur = conn.execute("SELECT id FROM Asset WHERE symbol = ?", (symbol,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur = conn.execute(
        "INSERT INTO Asset (symbol, displayName, type) VALUES (?, ?, ?)",
        (symbol, display_name, asset_type),
    )
    conn.commit()
    return cur.lastrowid


def main():
    random.seed(42)  # Tekrarlanabilir sonuçlar için
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    start = date(2016, 1, 1)
    end = date(2026, 5, 23)

    # Fiyat serileri
    total_prices = 0
    for symbol, display_name, asset_type, start_price, end_price, vol in SERIES:
        asset_id = ensure_asset(conn, symbol, display_name, asset_type)
        # Mevcut kayıtları temizle (demo verisi ile üzerine yaz)
        conn.execute("DELETE FROM PriceHistory WHERE assetId = ?", (asset_id,))
        series = generate_price_series(start, end, start_price, end_price, vol)
        conn.executemany(
            "INSERT OR IGNORE INTO PriceHistory (assetId, date, priceTry) VALUES (?, ?, ?)",
            [(asset_id, d, str(p)) for d, p in series],
        )
        total_prices += len(series)
        print(f"{symbol}: {len(series)} fiyat kaydı eklendi (demo)")

    conn.commit()

    # TÜFE (CPI) verileri
    conn.execute("DELETE FROM InflationMonthly")
    cpi_rows = interpolate_cpi()
    conn.executemany(
        "INSERT INTO InflationMonthly (year, month, cpiIndex) VALUES (?, ?, ?)",
        cpi_rows,
    )
    conn.commit()
    print(f"TÜFE: {len(cpi_rows)} aylık kayıt eklendi (demo)")

    print(f"\nToplam {total_prices + len(cpi_rows)} kayıt eklendi.")
    print("Not: Bu demo verisidir. Gerçek veri için kendi makinenizde 'python scripts/fetch_tcmb.py' çalıştırın.")

    conn.close()


if __name__ == "__main__":
    main()
