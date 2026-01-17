import sqlite3
import csv
import os
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent / "fishing.db"
CSV_PATH = Path(__file__).parent.parent / "전국어선정보.csv"


@contextmanager
def get_db():
    """데이터베이스 연결 컨텍스트 매니저"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """데이터베이스 초기화 및 테이블 생성"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 어선 정보 테이블 (전국어선정보.csv 기반)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vessel_registry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vessel_name TEXT NOT NULL,
                tonnage REAL,
                length REAL,
                engine_type TEXT,
                engine_count INTEGER,
                engine_power_ps REAL,
                engine_power_kw REAL,
                hull_material TEXT,
                registration_no TEXT UNIQUE,
                build_date TEXT,
                port TEXT,
                business_type TEXT,
                equipment_name TEXT,
                equipment_power TEXT,
                mmsi TEXT,
                license_local TEXT,
                license_start_local TEXT,
                license_end_local TEXT,
                license_province TEXT,
                license_start_province TEXT,
                license_end_province TEXT,
                group_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # group_name 컬럼이 없으면 추가 (기존 DB 마이그레이션)
        cursor.execute("PRAGMA table_info(vessel_registry)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'group_name' not in columns:
            cursor.execute("ALTER TABLE vessel_registry ADD COLUMN group_name TEXT")

        # 항차 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voyages (
                id TEXT PRIMARY KEY,
                mmsi TEXT NOT NULL,
                year INTEGER NOT NULL,
                voyage_no INTEGER NOT NULL,
                vessel_name TEXT NOT NULL,
                departure_port TEXT,
                departure_date TIMESTAMP,
                arrival_port TEXT,
                arrival_date TIMESTAMP,
                fishing_area TEXT,
                catch_amount REAL DEFAULT 0,
                fish_species TEXT,
                status TEXT DEFAULT '조업중',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 항적 포인트 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS track_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voyage_id TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                speed REAL,
                course REAL,
                FOREIGN KEY (voyage_id) REFERENCES voyages(id)
            )
        """)

        # 위판 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auctions (
                id TEXT PRIMARY KEY,
                voyage_id TEXT NOT NULL,
                auction_date TIMESTAMP NOT NULL,
                auction_port TEXT NOT NULL,
                fish_species TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                buyer TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (voyage_id) REFERENCES voyages(id)
            )
        """)

        # 어선 메모 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vessel_memos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vessel_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vessel_id) REFERENCES vessel_registry(id)
            )
        """)

        # 어선 사진 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vessel_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vessel_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                is_primary INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vessel_id) REFERENCES vessel_registry(id)
            )
        """)

        # 어선 관련 파일 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vessel_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vessel_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vessel_id) REFERENCES vessel_registry(id)
            )
        """)

        # 인덱스 생성
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_mmsi ON vessel_registry(mmsi)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_name ON vessel_registry(vessel_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_port ON vessel_registry(port)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_registration ON vessel_registry(registration_no)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_voyages_mmsi ON voyages(mmsi)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_auctions_voyage ON auctions(voyage_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_memos_vessel ON vessel_memos(vessel_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_photos_vessel ON vessel_photos(vessel_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vessel_files_vessel ON vessel_files(vessel_id)")

        conn.commit()


def load_csv_to_db(csv_path=None, force=False):
    """CSV 파일에서 어선 정보를 DB로 로드

    Args:
        csv_path: CSV 파일 경로 (None이면 기본 경로 사용)
        force: True이면 기존 데이터 삭제 후 다시 로드

    Returns:
        dict: {'success': bool, 'message': str, 'count': int}
    """
    target_path = Path(csv_path) if csv_path else CSV_PATH

    if not target_path.exists():
        return {'success': False, 'message': f'CSV 파일을 찾을 수 없습니다: {target_path}', 'count': 0}

    with get_db() as conn:
        cursor = conn.cursor()

        # 기존 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM vessel_registry")
        count = cursor.fetchone()[0]

        if count > 0 and not force:
            return {'success': True, 'message': f'이미 {count}개의 어선 정보가 등록되어 있습니다.', 'count': count}

        if force and count > 0:
            cursor.execute("DELETE FROM vessel_registry")
            conn.commit()
            print(f"기존 {count}개 데이터 삭제됨")

        # CSV 파일 읽기 (UTF-8-BOM 처리)
        with open(target_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            insert_count = 0
            for row in reader:
                try:
                    # 숫자 변환 함수
                    def to_float(val):
                        if not val or val == '-' or val.strip() == '':
                            return None
                        try:
                            return float(val.replace(',', ''))
                        except:
                            return None

                    def to_int(val):
                        if not val or val == '-' or val.strip() == '':
                            return None
                        try:
                            return int(float(val))
                        except:
                            return None

                    def to_str(val):
                        if not val or val == '-':
                            return None
                        return val.strip() if val else None

                    cursor.execute("""
                        INSERT INTO vessel_registry (
                            vessel_name, tonnage, length, engine_type, engine_count,
                            engine_power_ps, engine_power_kw, hull_material, registration_no,
                            build_date, port, business_type, equipment_name, equipment_power,
                            mmsi, license_local, license_start_local, license_end_local,
                            license_province, license_start_province, license_end_province
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        to_str(row.get('선명')),
                        to_float(row.get('톤수')),
                        to_float(row.get('길이')),
                        to_str(row.get('엔진종류')),
                        to_int(row.get('엔진갯수')),
                        to_float(row.get('엔진출력PS')),
                        to_float(row.get('엔진출력KW')),
                        to_str(row.get('선질')),
                        to_str(row.get('등록번호')),
                        to_str(row.get('건조일시')),
                        to_str(row.get('선적지')),
                        to_str(row.get('업종')),
                        to_str(row.get('장비명')),
                        to_str(row.get('출력')),
                        to_str(row.get('MMSI')),
                        to_str(row.get('어업인허가(시군구)')),
                        to_str(row.get('허가시작일(시군구)')),
                        to_str(row.get('허가종료일(시군구)')),
                        to_str(row.get('어업인허가(시도)')),
                        to_str(row.get('허가시작일(시도)')),
                        to_str(row.get('허가종료일(시도)'))
                    ))
                    insert_count += 1
                except Exception as e:
                    print(f"행 삽입 오류: {e}")
                    continue

            conn.commit()
            print(f"{insert_count}개의 어선 정보가 등록되었습니다.")
            return {'success': True, 'message': f'{insert_count}개의 어선 정보가 등록되었습니다.', 'count': insert_count}

    return {'success': False, 'message': '알 수 없는 오류', 'count': 0}


def insert_sample_voyages():
    """샘플 항차 및 위판 데이터 삽입"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 기존 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM voyages")
        if cursor.fetchone()[0] > 0:
            return

        # 샘플 항차 데이터
        voyages = [
            ("440004950-2025-001", "440004950", 2025, 1, "수복호", "속초", "2025-01-10 06:00:00",
             "속초", "2025-01-12 18:00:00", "동해 북부", 850.5, "오징어, 고등어", "완료"),
            ("440004950-2025-002", "440004950", 2025, 2, "수복호", "속초", "2025-01-15 05:30:00",
             None, None, "동해 중부", 320.0, "오징어", "조업중"),
            ("440133600-2025-001", "440133600", 2025, 1, "동산호", "동해", "2025-01-08 04:00:00",
             "동해", "2025-01-14 16:00:00", "울릉도 근해", 2150.0, "명태, 대구", "완료"),
        ]

        for v in voyages:
            cursor.execute("""
                INSERT INTO voyages (id, mmsi, year, voyage_no, vessel_name, departure_port,
                    departure_date, arrival_port, arrival_date, fishing_area, catch_amount,
                    fish_species, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, v)

        # 샘플 위판 데이터
        auctions = [
            ("AUC-2025-001", "440004950-2025-001", "2025-01-13 05:00:00", "속초공동어시장",
             "오징어", 500.0, 15000, 7500000, "수협"),
            ("AUC-2025-002", "440004950-2025-001", "2025-01-13 05:30:00", "속초공동어시장",
             "고등어", 350.5, 8000, 2804000, "수협"),
            ("AUC-2025-003", "440133600-2025-001", "2025-01-15 06:00:00", "동해어시장",
             "명태", 1500.0, 12000, 18000000, "동해수산"),
        ]

        for a in auctions:
            cursor.execute("""
                INSERT INTO auctions (id, voyage_id, auction_date, auction_port,
                    fish_species, quantity, unit_price, total_price, buyer)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, a)

        conn.commit()
        print("샘플 항차 및 위판 데이터가 등록되었습니다.")


if __name__ == "__main__":
    print("데이터베이스 초기화 중...")
    init_db()
    print("CSV 데이터 로딩 중...")
    load_csv_to_db()
    print("샘플 데이터 삽입 중...")
    insert_sample_voyages()
    print("완료!")
