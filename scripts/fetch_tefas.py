"""
tefas-crawler ile yatırım fonu fiyat geçmişini çeker.
Hata durumunda uygulamayı kırmaz — manuel fiyat girişi arayüzü kullanılabilir.

Çalıştırma: python fetch_tefas.py [--incremental]
"""
import sys
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "portfolio.db"


def main():
    try:
        from tefas import Crawler
    except ImportError:
        print("tefas-crawler kurulu değil: pip install tefas-crawler")
        print("Manuel fiyat girişi için Varlıklar sayfasını kullanın.")
        return

    incremental = "--incremental" in sys.argv
    start = (datetime.now() - timedelta(days=14 if incremental else 365 * 10)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    cur = conn.execute("SELECT id, symbol FROM Asset WHERE type = 'FUND'")
    funds = cur.fetchall()

    if not funds:
        print("Veritabanında FUND türünde varlık bulunamadı.")
        conn.close()
        return

    crawler = Crawler()

    for asset_id, symbol in funds:
        try:
            data = crawler.fetch(start=start, end=end, name=symbol, columns=["date", "price"])
            if data is None or data.empty:
                print(f"{symbol}: Veri bulunamadı — manuel fiyat girişi gerekli")
                continue

            import pandas as pd
            data["date"] = pd.to_datetime(data["date"])
            count = 0
            for _, row in data.iterrows():
                iso = row["date"].strftime("%Y-%m-%dT00:00:00.000Z")
                price = float(row["price"])
                conn.execute(
                    """
                    INSERT INTO PriceHistory (assetId, date, priceTry)
                    VALUES (?, ?, ?)
                    ON CONFLICT(assetId, date) DO UPDATE SET priceTry = excluded.priceTry
                    """,
                    (asset_id, iso, str(price)),
                )
                count += 1
            conn.commit()
            print(f"{symbol}: {count} kayıt güncellendi")
        except Exception as e:
            print(f"{symbol}: HATA — {e}")
            print(f"  → Manuel fiyat girişi için Varlıklar sayfasını kullanın.")

    conn.close()


if __name__ == "__main__":
    main()
