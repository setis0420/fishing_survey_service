from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from pathlib import Path
import shutil
import tempfile
import uuid
import os
from database import get_db, init_db, load_csv_to_db, insert_sample_voyages

# 업로드 디렉토리 설정
UPLOAD_DIR = Path(__file__).parent / "uploads"
PHOTO_DIR = UPLOAD_DIR / "photos"
FILE_DIR = UPLOAD_DIR / "files"

# 디렉토리 생성
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
FILE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="어선조업분석 플랫폼 API",
    description="어업 피해 조사를 위한 어선 항적 조회 플랫폼",
    version="1.0.1"
)

# CORS 설정 (React 프론트엔드 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== 데이터 모델 ====================

class VesselRegistry(BaseModel):
    """전국어선정보 (CSV 기반)"""
    id: int
    vessel_name: str
    tonnage: Optional[float] = None
    length: Optional[float] = None
    engine_type: Optional[str] = None
    engine_count: Optional[int] = None
    engine_power_ps: Optional[float] = None
    engine_power_kw: Optional[float] = None
    hull_material: Optional[str] = None
    registration_no: Optional[str] = None
    build_date: Optional[str] = None
    port: Optional[str] = None
    business_type: Optional[str] = None
    equipment_name: Optional[str] = None
    equipment_power: Optional[str] = None
    mmsi: Optional[str] = None
    license_local: Optional[str] = None
    license_start_local: Optional[str] = None
    license_end_local: Optional[str] = None
    license_province: Optional[str] = None
    license_start_province: Optional[str] = None
    license_end_province: Optional[str] = None
    group_name: Optional[str] = None


class VesselRegistryUpdate(BaseModel):
    """어선 정보 수정용"""
    vessel_name: Optional[str] = None
    tonnage: Optional[float] = None
    length: Optional[float] = None
    engine_type: Optional[str] = None
    engine_count: Optional[int] = None
    engine_power_ps: Optional[float] = None
    engine_power_kw: Optional[float] = None
    hull_material: Optional[str] = None
    port: Optional[str] = None
    business_type: Optional[str] = None
    mmsi: Optional[str] = None
    license_local: Optional[str] = None
    license_start_local: Optional[str] = None
    license_end_local: Optional[str] = None
    group_name: Optional[str] = None


class VesselInfo(BaseModel):
    """어선 기본 정보 (간략)"""
    mmsi: str
    vessel_name: str
    call_sign: Optional[str] = None
    vessel_type: str
    tonnage: float
    owner: str
    port: str


class TrackPoint(BaseModel):
    """항적 포인트"""
    timestamp: datetime
    latitude: float
    longitude: float
    speed: float
    course: float


class VoyageData(BaseModel):
    """항차 데이터"""
    id: str
    mmsi: str
    year: int
    voyage_no: int
    vessel_name: str
    departure_port: str
    departure_date: datetime
    arrival_port: Optional[str] = None
    arrival_date: Optional[datetime] = None
    fishing_area: str
    track_points: List[TrackPoint] = []
    catch_amount: float = 0
    fish_species: str = ""
    status: str = "조업중"


class VoyageUpdate(BaseModel):
    """항차 정보 수정용"""
    arrival_port: Optional[str] = None
    arrival_date: Optional[datetime] = None
    fishing_area: Optional[str] = None
    catch_amount: Optional[float] = None
    fish_species: Optional[str] = None
    status: Optional[str] = None


class AuctionData(BaseModel):
    """위판 데이터"""
    id: str
    voyage_id: str
    auction_date: datetime
    auction_port: str
    fish_species: str
    quantity: float
    unit_price: float
    total_price: float
    buyer: Optional[str] = None


class AuctionCreate(BaseModel):
    """위판 정보 입력용"""
    voyage_id: str
    auction_date: datetime
    auction_port: str
    fish_species: str
    quantity: float
    unit_price: float
    buyer: Optional[str] = None


class MemoCreate(BaseModel):
    """메모 생성용"""
    content: str


class MemoUpdate(BaseModel):
    """메모 수정용"""
    content: str


# ==================== 시작 시 DB 초기화 ====================

@app.on_event("startup")
async def startup_event():
    """앱 시작 시 DB 초기화 (테이블만 생성, CSV 자동 로드 안함)"""
    init_db()
    insert_sample_voyages()


# ==================== API 엔드포인트 ====================

@app.get("/")
def read_root():
    return {"message": "어선조업분석 플랫폼 API", "version": "1.0.0"}


# ---------- CSV 업로드 API ----------

@app.post("/api/vessel-registry/upload-csv")
async def upload_vessel_csv(file: UploadFile = File(...), force: bool = False):
    """CSV 파일 업로드하여 어선 정보 DB에 저장

    Args:
        file: CSV 파일
        force: True이면 기존 데이터 삭제 후 다시 로드
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다")

    # 임시 파일로 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = load_csv_to_db(csv_path=tmp_path, force=force)
        return result
    finally:
        # 임시 파일 삭제
        Path(tmp_path).unlink(missing_ok=True)


@app.get("/api/vessel-registry/status")
def get_vessel_registry_status():
    """어선 정보 DB 상태 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM vessel_registry")
        count = cursor.fetchone()[0]
        return {
            "count": count,
            "has_data": count > 0,
            "message": f"{count}개의 어선 정보가 등록되어 있습니다" if count > 0 else "등록된 어선 정보가 없습니다. CSV 파일을 업로드해주세요."
        }


# ---------- 어선 등록 정보 관련 API (전국어선정보) ----------

@app.get("/api/vessel-registry")
def get_vessel_registry(
    search: Optional[str] = None,
    port: Optional[str] = None,
    business_type: Optional[str] = None,
    group_name: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """전국어선정보 목록 조회 (페이지네이션 지원)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 기본 쿼리
        base_query = "FROM vessel_registry WHERE 1=1"
        params = []

        if search:
            base_query += " AND (vessel_name LIKE ? OR mmsi LIKE ? OR registration_no LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])

        if port and port != 'all':
            base_query += " AND port LIKE ?"
            params.append(f"%{port}%")

        if business_type and business_type != 'all':
            base_query += " AND business_type LIKE ?"
            params.append(f"%{business_type}%")

        if group_name and group_name != 'all':
            base_query += " AND group_name = ?"
            params.append(group_name)

        # 전체 개수
        cursor.execute(f"SELECT COUNT(*) {base_query}", params)
        total = cursor.fetchone()[0]

        # 페이지네이션
        offset = (page - 1) * page_size
        # 조건절에서 테이블명을 별칭으로 변환
        where_clause = base_query.replace('FROM vessel_registry WHERE 1=1', '').replace('vessel_name', 'v.vessel_name').replace('mmsi', 'v.mmsi').replace('registration_no', 'v.registration_no').replace('port', 'v.port').replace('business_type', 'v.business_type').replace('group_name', 'v.group_name')
        cursor.execute(
            f"""SELECT v.*,
                (SELECT COUNT(*) FROM vessel_photos WHERE vessel_id = v.id) as photo_count,
                (SELECT COUNT(*) FROM vessel_files WHERE vessel_id = v.id) as file_count
            FROM vessel_registry v WHERE 1=1 {where_clause}
            ORDER BY v.id LIMIT ? OFFSET ?""",
            params + [page_size, offset]
        )

        rows = cursor.fetchall()
        data = [dict(row) for row in rows]

        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }


@app.get("/api/vessel-registry/ports/list")
def get_ports():
    """선적항(포트) 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT port, COUNT(*) as count
            FROM vessel_registry
            WHERE port IS NOT NULL AND port != ''
            GROUP BY port
            ORDER BY count DESC
            LIMIT 50
        """)
        rows = cursor.fetchall()
        return {"data": [{"port": row["port"], "count": row["count"]} for row in rows]}


@app.get("/api/vessel-registry/business-types/list")
def get_business_types():
    """업종 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT business_type, COUNT(*) as count
            FROM vessel_registry
            WHERE business_type IS NOT NULL AND business_type != ''
            GROUP BY business_type
            ORDER BY count DESC
        """)
        rows = cursor.fetchall()
        return {"data": [{"business_type": row["business_type"], "count": row["count"]} for row in rows]}


@app.get("/api/vessel-registry/groups/list")
def get_groups():
    """그룹 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT group_name, COUNT(*) as count
            FROM vessel_registry
            WHERE group_name IS NOT NULL AND group_name != ''
            GROUP BY group_name
            ORDER BY group_name
        """)
        rows = cursor.fetchall()
        return {"data": [{"group_name": row["group_name"], "count": row["count"]} for row in rows]}


@app.get("/api/vessel-registry/{vessel_id}")
def get_vessel_registry_detail(vessel_id: int):
    """전국어선정보 상세 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vessel_registry WHERE id = ?", (vessel_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="어선 정보를 찾을 수 없습니다")

        return {"data": dict(row)}


@app.put("/api/vessel-registry/{vessel_id}")
def update_vessel_registry(vessel_id: int, update: VesselRegistryUpdate):
    """전국어선정보 수정"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 존재 확인
        cursor.execute("SELECT id FROM vessel_registry WHERE id = ?", (vessel_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="어선 정보를 찾을 수 없습니다")

        # 업데이트할 필드만 추출
        update_data = update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="수정할 내용이 없습니다")

        # UPDATE 쿼리 생성
        set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
        set_clause += ", updated_at = CURRENT_TIMESTAMP"
        values = list(update_data.values()) + [vessel_id]

        cursor.execute(
            f"UPDATE vessel_registry SET {set_clause} WHERE id = ?",
            values
        )
        conn.commit()

        # 수정된 데이터 반환
        cursor.execute("SELECT * FROM vessel_registry WHERE id = ?", (vessel_id,))
        return {"message": "수정되었습니다", "data": dict(cursor.fetchone())}


# ---------- 기존 어선 조회 API (항차용) ----------

@app.get("/api/vessels")
def get_vessels(search: Optional[str] = None):
    """어선 목록 조회 (MMSI가 있는 어선만, 항차 연동용)"""
    with get_db() as conn:
        cursor = conn.cursor()

        query = """
            SELECT DISTINCT mmsi, vessel_name, tonnage, port, business_type
            FROM vessel_registry
            WHERE mmsi IS NOT NULL AND mmsi != ''
        """
        params = []

        if search:
            query += " AND (vessel_name LIKE ? OR mmsi LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])

        query += " ORDER BY vessel_name LIMIT 50"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        data = [{
            "mmsi": row["mmsi"],
            "vessel_name": row["vessel_name"],
            "vessel_type": row["business_type"] or "어선",
            "tonnage": row["tonnage"] or 0,
            "owner": "-",
            "port": row["port"] or "-"
        } for row in rows]

        return {"data": data, "total": len(data)}


@app.get("/api/vessels/{mmsi}")
def get_vessel(mmsi: str):
    """특정 어선 정보 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM vessel_registry WHERE mmsi = ? LIMIT 1
        """, (mmsi,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="어선을 찾을 수 없습니다")

        return {"data": dict(row)}


# ---------- 항차 관련 API ----------

@app.get("/api/voyages")
def get_voyages(mmsi: Optional[str] = None, year: Optional[int] = None, status: Optional[str] = None):
    """항차 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM voyages WHERE 1=1"
        params = []

        if mmsi:
            query += " AND mmsi = ?"
            params.append(mmsi)
        if year:
            query += " AND year = ?"
            params.append(year)
        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY departure_date DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        data = []
        for row in rows:
            d = dict(row)
            d['track_points'] = []  # 목록에서는 항적 제외
            data.append(d)

        return {"data": data, "total": len(data)}


@app.get("/api/voyages/{voyage_id}")
def get_voyage(voyage_id: str):
    """특정 항차 상세 조회"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM voyages WHERE id = ?", (voyage_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="항차를 찾을 수 없습니다")

        data = dict(row)

        # 항적 포인트 조회
        cursor.execute(
            "SELECT * FROM track_points WHERE voyage_id = ? ORDER BY timestamp",
            (voyage_id,)
        )
        data['track_points'] = [dict(tp) for tp in cursor.fetchall()]

        return {"data": data}


@app.put("/api/voyages/{voyage_id}")
def update_voyage(voyage_id: str, update: VoyageUpdate):
    """항차 정보 수정"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM voyages WHERE id = ?", (voyage_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="항차를 찾을 수 없습니다")

        update_data = update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="수정할 내용이 없습니다")

        set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
        set_clause += ", updated_at = CURRENT_TIMESTAMP"
        values = list(update_data.values()) + [voyage_id]

        cursor.execute(f"UPDATE voyages SET {set_clause} WHERE id = ?", values)
        conn.commit()

        cursor.execute("SELECT * FROM voyages WHERE id = ?", (voyage_id,))
        return {"message": "수정되었습니다", "data": dict(cursor.fetchone())}


# ---------- 위판 관련 API ----------

@app.get("/api/auctions")
def get_auctions(voyage_id: Optional[str] = None):
    """위판 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM auctions"
        params = []

        if voyage_id:
            query += " WHERE voyage_id = ?"
            params.append(voyage_id)

        query += " ORDER BY auction_date DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        return {"data": [dict(row) for row in rows], "total": len(rows)}


@app.post("/api/auctions")
def create_auction(auction: AuctionCreate):
    """위판 정보 등록"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 항차 존재 확인
        cursor.execute("SELECT id FROM voyages WHERE id = ?", (auction.voyage_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="해당 항차를 찾을 수 없습니다")

        # 새 ID 생성
        cursor.execute("SELECT COUNT(*) FROM auctions")
        count = cursor.fetchone()[0] + 1
        new_id = f"AUC-{datetime.now().year}-{count:03d}"

        total_price = auction.quantity * auction.unit_price

        cursor.execute("""
            INSERT INTO auctions (id, voyage_id, auction_date, auction_port,
                fish_species, quantity, unit_price, total_price, buyer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_id, auction.voyage_id, auction.auction_date.isoformat(),
            auction.auction_port, auction.fish_species, auction.quantity,
            auction.unit_price, total_price, auction.buyer
        ))
        conn.commit()

        cursor.execute("SELECT * FROM auctions WHERE id = ?", (new_id,))
        return {"message": "등록되었습니다", "data": dict(cursor.fetchone())}


@app.delete("/api/auctions/{auction_id}")
def delete_auction(auction_id: str):
    """위판 정보 삭제"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM auctions WHERE id = ?", (auction_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="위판 정보를 찾을 수 없습니다")

        cursor.execute("DELETE FROM auctions WHERE id = ?", (auction_id,))
        conn.commit()

        return {"message": "삭제되었습니다"}


# ---------- 통계 API ----------

@app.get("/api/statistics")
def get_statistics():
    """통계 데이터"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM vessel_registry")
        total_vessels = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM voyages")
        total_voyages = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM voyages WHERE status = '조업중'")
        active_voyages = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(catch_amount), 0) FROM voyages")
        total_catch = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(total_price), 0) FROM auctions")
        total_auction = cursor.fetchone()[0]

        return {
            "total_vessels": total_vessels,
            "total_voyages": total_voyages,
            "active_voyages": active_voyages,
            "total_catch_amount": total_catch,
            "total_auction_amount": total_auction,
        }


# ---------- 어선 메모 API ----------

@app.get("/api/vessel-registry/{vessel_id}/memos")
def get_vessel_memos(vessel_id: int):
    """어선 메모 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM vessel_memos WHERE vessel_id = ? ORDER BY created_at DESC",
            (vessel_id,)
        )
        rows = cursor.fetchall()
        return {"data": [dict(row) for row in rows]}


@app.post("/api/vessel-registry/{vessel_id}/memos")
def create_vessel_memo(vessel_id: int, memo: MemoCreate):
    """어선 메모 추가"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 어선 존재 확인
        cursor.execute("SELECT id FROM vessel_registry WHERE id = ?", (vessel_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="어선 정보를 찾을 수 없습니다")

        cursor.execute(
            "INSERT INTO vessel_memos (vessel_id, content) VALUES (?, ?)",
            (vessel_id, memo.content)
        )
        conn.commit()

        memo_id = cursor.lastrowid
        cursor.execute("SELECT * FROM vessel_memos WHERE id = ?", (memo_id,))
        return {"message": "메모가 추가되었습니다", "data": dict(cursor.fetchone())}


@app.put("/api/vessel-registry/{vessel_id}/memos/{memo_id}")
def update_vessel_memo(vessel_id: int, memo_id: int, memo: MemoUpdate):
    """어선 메모 수정"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM vessel_memos WHERE id = ? AND vessel_id = ?",
            (memo_id, vessel_id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다")

        cursor.execute(
            "UPDATE vessel_memos SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (memo.content, memo_id)
        )
        conn.commit()

        cursor.execute("SELECT * FROM vessel_memos WHERE id = ?", (memo_id,))
        return {"message": "메모가 수정되었습니다", "data": dict(cursor.fetchone())}


@app.delete("/api/vessel-registry/{vessel_id}/memos/{memo_id}")
def delete_vessel_memo(vessel_id: int, memo_id: int):
    """어선 메모 삭제"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM vessel_memos WHERE id = ? AND vessel_id = ?",
            (memo_id, vessel_id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다")

        cursor.execute("DELETE FROM vessel_memos WHERE id = ?", (memo_id,))
        conn.commit()

        return {"message": "메모가 삭제되었습니다"}


# ---------- 어선 사진 API ----------

@app.get("/api/vessel-registry/{vessel_id}/photos")
def get_vessel_photos(vessel_id: int):
    """어선 사진 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM vessel_photos WHERE vessel_id = ? ORDER BY is_primary DESC, created_at DESC",
            (vessel_id,)
        )
        rows = cursor.fetchall()
        return {"data": [dict(row) for row in rows]}


@app.post("/api/vessel-registry/{vessel_id}/photos")
async def upload_vessel_photo(
    vessel_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Form(False)
):
    """어선 사진 업로드"""
    # 파일 타입 검증
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP)")

    with get_db() as conn:
        cursor = conn.cursor()

        # 어선 존재 확인
        cursor.execute("SELECT id FROM vessel_registry WHERE id = ?", (vessel_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="어선 정보를 찾을 수 없습니다")

        # 파일 저장
        ext = Path(file.filename).suffix
        filename = f"{vessel_id}_{uuid.uuid4().hex}{ext}"
        file_path = PHOTO_DIR / filename

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        file_size = file_path.stat().st_size

        # 대표 사진 설정 시 기존 대표 해제
        if is_primary:
            cursor.execute(
                "UPDATE vessel_photos SET is_primary = 0 WHERE vessel_id = ?",
                (vessel_id,)
            )

        cursor.execute("""
            INSERT INTO vessel_photos (vessel_id, filename, original_name, file_path, file_size, mime_type, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (vessel_id, filename, file.filename, str(file_path), file_size, file.content_type, 1 if is_primary else 0))
        conn.commit()

        photo_id = cursor.lastrowid
        cursor.execute("SELECT * FROM vessel_photos WHERE id = ?", (photo_id,))
        return {"message": "사진이 업로드되었습니다", "data": dict(cursor.fetchone())}


@app.get("/api/uploads/photos/{filename}")
async def get_photo(filename: str):
    """사진 파일 제공"""
    file_path = PHOTO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    return FileResponse(file_path)


@app.delete("/api/vessel-registry/{vessel_id}/photos/{photo_id}")
def delete_vessel_photo(vessel_id: int, photo_id: int):
    """어선 사진 삭제"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT filename FROM vessel_photos WHERE id = ? AND vessel_id = ?",
            (photo_id, vessel_id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다")

        # 파일 삭제
        file_path = PHOTO_DIR / row["filename"]
        if file_path.exists():
            file_path.unlink()

        cursor.execute("DELETE FROM vessel_photos WHERE id = ?", (photo_id,))
        conn.commit()

        return {"message": "사진이 삭제되었습니다"}


@app.put("/api/vessel-registry/{vessel_id}/photos/{photo_id}/primary")
def set_primary_photo(vessel_id: int, photo_id: int):
    """대표 사진 설정"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM vessel_photos WHERE id = ? AND vessel_id = ?",
            (photo_id, vessel_id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다")

        # 모든 사진 대표 해제 후 선택한 사진 대표 설정
        cursor.execute("UPDATE vessel_photos SET is_primary = 0 WHERE vessel_id = ?", (vessel_id,))
        cursor.execute("UPDATE vessel_photos SET is_primary = 1 WHERE id = ?", (photo_id,))
        conn.commit()

        return {"message": "대표 사진이 설정되었습니다"}


# ---------- 어선 관련 파일 API ----------

@app.get("/api/vessel-registry/{vessel_id}/files")
def get_vessel_files(vessel_id: int):
    """어선 관련 파일 목록 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM vessel_files WHERE vessel_id = ? ORDER BY created_at DESC",
            (vessel_id,)
        )
        rows = cursor.fetchall()
        return {"data": [dict(row) for row in rows]}


@app.post("/api/vessel-registry/{vessel_id}/files")
async def upload_vessel_file(
    vessel_id: int,
    file: UploadFile = File(...),
    description: str = Form("")
):
    """어선 관련 파일 업로드"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 어선 존재 확인
        cursor.execute("SELECT id FROM vessel_registry WHERE id = ?", (vessel_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="어선 정보를 찾을 수 없습니다")

        # 파일 저장
        ext = Path(file.filename).suffix
        filename = f"{vessel_id}_{uuid.uuid4().hex}{ext}"
        file_path = FILE_DIR / filename

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        file_size = file_path.stat().st_size

        cursor.execute("""
            INSERT INTO vessel_files (vessel_id, filename, original_name, file_path, file_size, mime_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (vessel_id, filename, file.filename, str(file_path), file_size, file.content_type, description))
        conn.commit()

        file_id = cursor.lastrowid
        cursor.execute("SELECT * FROM vessel_files WHERE id = ?", (file_id,))
        return {"message": "파일이 업로드되었습니다", "data": dict(cursor.fetchone())}


@app.get("/api/uploads/files/{filename}")
async def get_file(filename: str):
    """파일 다운로드"""
    file_path = FILE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

    # 원본 파일명 조회
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT original_name FROM vessel_files WHERE filename = ?", (filename,))
        row = cursor.fetchone()
        original_name = row["original_name"] if row else filename

    return FileResponse(file_path, filename=original_name)


@app.delete("/api/vessel-registry/{vessel_id}/files/{file_id}")
def delete_vessel_file(vessel_id: int, file_id: int):
    """어선 관련 파일 삭제"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT filename FROM vessel_files WHERE id = ? AND vessel_id = ?",
            (file_id, vessel_id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

        # 파일 삭제
        file_path = FILE_DIR / row["filename"]
        if file_path.exists():
            file_path.unlink()

        cursor.execute("DELETE FROM vessel_files WHERE id = ?", (file_id,))
        conn.commit()

        return {"message": "파일이 삭제되었습니다"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
