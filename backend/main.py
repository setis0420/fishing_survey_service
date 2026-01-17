from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(
    title="어선조업분석 플랫폼 API",
    description="어업 피해 조사를 위한 어선 항적 조회 플랫폼",
    version="1.0.0"
)

# CORS 설정 (React 프론트엔드 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== 데이터 모델 ====================

class VesselInfo(BaseModel):
    """어선 기본 정보"""
    mmsi: str
    vessel_name: str
    call_sign: Optional[str] = None
    vessel_type: str
    tonnage: float
    owner: str
    port: str  # 선적항


class TrackPoint(BaseModel):
    """항적 포인트"""
    timestamp: datetime
    latitude: float
    longitude: float
    speed: float  # 속력 (knots)
    course: float  # 침로 (도)


class VoyageData(BaseModel):
    """항차 데이터 (mmsi-연도-항차)"""
    id: str  # mmsi-year-voyage_no 형식
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
    catch_amount: float = 0  # 어획량 (kg)
    fish_species: str = ""  # 어종
    status: str = "조업중"  # 조업중, 입항, 완료


class AuctionData(BaseModel):
    """위판 데이터"""
    id: str
    voyage_id: str  # 연결된 항차 ID
    auction_date: datetime
    auction_port: str  # 위판장
    fish_species: str  # 어종
    quantity: float  # 수량 (kg)
    unit_price: float  # 단가 (원/kg)
    total_price: float  # 총액
    buyer: Optional[str] = None  # 구매자


class VoyageUpdate(BaseModel):
    """항차 정보 수정용"""
    arrival_port: Optional[str] = None
    arrival_date: Optional[datetime] = None
    fishing_area: Optional[str] = None
    catch_amount: Optional[float] = None
    fish_species: Optional[str] = None
    status: Optional[str] = None


class AuctionCreate(BaseModel):
    """위판 정보 입력용"""
    voyage_id: str
    auction_date: datetime
    auction_port: str
    fish_species: str
    quantity: float
    unit_price: float
    buyer: Optional[str] = None


# ==================== 샘플 데이터 ====================

vessels_db = {
    "440001234": VesselInfo(
        mmsi="440001234",
        vessel_name="해양호",
        call_sign="DSAB1",
        vessel_type="연안어선",
        tonnage=15.5,
        owner="김철수",
        port="부산"
    ),
    "440005678": VesselInfo(
        mmsi="440005678",
        vessel_name="동해호",
        call_sign="DSAB2",
        vessel_type="근해어선",
        tonnage=45.0,
        owner="이영희",
        port="포항"
    ),
    "440009012": VesselInfo(
        mmsi="440009012",
        vessel_name="서해호",
        call_sign="DSAB3",
        vessel_type="연안어선",
        tonnage=12.3,
        owner="박민수",
        port="인천"
    ),
}

voyages_db = {
    "440001234-2025-001": VoyageData(
        id="440001234-2025-001",
        mmsi="440001234",
        year=2025,
        voyage_no=1,
        vessel_name="해양호",
        departure_port="부산",
        departure_date=datetime(2025, 1, 10, 6, 0),
        arrival_port="부산",
        arrival_date=datetime(2025, 1, 12, 18, 0),
        fishing_area="동해 남부",
        track_points=[
            TrackPoint(timestamp=datetime(2025, 1, 10, 6, 0), latitude=35.1796, longitude=129.0756, speed=8.5, course=90),
            TrackPoint(timestamp=datetime(2025, 1, 10, 12, 0), latitude=35.2500, longitude=129.5000, speed=5.0, course=45),
            TrackPoint(timestamp=datetime(2025, 1, 11, 6, 0), latitude=35.3000, longitude=129.8000, speed=2.0, course=180),
            TrackPoint(timestamp=datetime(2025, 1, 12, 12, 0), latitude=35.2000, longitude=129.3000, speed=10.0, course=270),
        ],
        catch_amount=850.5,
        fish_species="오징어, 고등어",
        status="완료"
    ),
    "440001234-2025-002": VoyageData(
        id="440001234-2025-002",
        mmsi="440001234",
        year=2025,
        voyage_no=2,
        vessel_name="해양호",
        departure_port="부산",
        departure_date=datetime(2025, 1, 15, 5, 30),
        fishing_area="동해 중부",
        track_points=[
            TrackPoint(timestamp=datetime(2025, 1, 15, 5, 30), latitude=35.1796, longitude=129.0756, speed=9.0, course=80),
            TrackPoint(timestamp=datetime(2025, 1, 15, 14, 0), latitude=35.5000, longitude=129.6000, speed=3.0, course=120),
        ],
        catch_amount=320.0,
        fish_species="오징어",
        status="조업중"
    ),
    "440005678-2025-001": VoyageData(
        id="440005678-2025-001",
        mmsi="440005678",
        year=2025,
        voyage_no=1,
        vessel_name="동해호",
        departure_port="포항",
        departure_date=datetime(2025, 1, 8, 4, 0),
        arrival_port="포항",
        arrival_date=datetime(2025, 1, 14, 16, 0),
        fishing_area="울릉도 근해",
        track_points=[
            TrackPoint(timestamp=datetime(2025, 1, 8, 4, 0), latitude=36.0190, longitude=129.3435, speed=10.0, course=60),
            TrackPoint(timestamp=datetime(2025, 1, 9, 12, 0), latitude=37.0000, longitude=130.5000, speed=4.0, course=90),
            TrackPoint(timestamp=datetime(2025, 1, 12, 8, 0), latitude=37.5000, longitude=131.0000, speed=2.5, course=200),
        ],
        catch_amount=2150.0,
        fish_species="명태, 대구",
        status="완료"
    ),
}

auctions_db = {
    "AUC-2025-001": AuctionData(
        id="AUC-2025-001",
        voyage_id="440001234-2025-001",
        auction_date=datetime(2025, 1, 13, 5, 0),
        auction_port="부산공동어시장",
        fish_species="오징어",
        quantity=500.0,
        unit_price=15000,
        total_price=7500000,
        buyer="수협"
    ),
    "AUC-2025-002": AuctionData(
        id="AUC-2025-002",
        voyage_id="440001234-2025-001",
        auction_date=datetime(2025, 1, 13, 5, 30),
        auction_port="부산공동어시장",
        fish_species="고등어",
        quantity=350.5,
        unit_price=8000,
        total_price=2804000,
        buyer="수협"
    ),
    "AUC-2025-003": AuctionData(
        id="AUC-2025-003",
        voyage_id="440005678-2025-001",
        auction_date=datetime(2025, 1, 15, 6, 0),
        auction_port="포항어시장",
        fish_species="명태",
        quantity=1500.0,
        unit_price=12000,
        total_price=18000000,
        buyer="동해수산"
    ),
}


# ==================== API 엔드포인트 ====================

@app.get("/")
def read_root():
    return {"message": "어선조업분석 플랫폼 API", "version": "1.0.0"}


# ---------- 어선 관련 API ----------

@app.get("/api/vessels")
def get_vessels(search: Optional[str] = None):
    """어선 목록 조회 (MMSI 또는 어선명으로 검색)"""
    vessels = list(vessels_db.values())
    if search:
        search_lower = search.lower()
        vessels = [v for v in vessels if search_lower in v.mmsi.lower() or search_lower in v.vessel_name.lower()]
    return {"data": [v.model_dump() for v in vessels], "total": len(vessels)}


@app.get("/api/vessels/{mmsi}")
def get_vessel(mmsi: str):
    """특정 어선 정보 조회"""
    if mmsi not in vessels_db:
        raise HTTPException(status_code=404, detail="어선을 찾을 수 없습니다")
    return {"data": vessels_db[mmsi].model_dump()}


# ---------- 항차 관련 API ----------

@app.get("/api/voyages")
def get_voyages(mmsi: Optional[str] = None, year: Optional[int] = None, status: Optional[str] = None):
    """항차 목록 조회"""
    voyages = list(voyages_db.values())
    if mmsi:
        voyages = [v for v in voyages if v.mmsi == mmsi]
    if year:
        voyages = [v for v in voyages if v.year == year]
    if status:
        voyages = [v for v in voyages if v.status == status]
    return {"data": [v.model_dump() for v in voyages], "total": len(voyages)}


@app.get("/api/voyages/{voyage_id}")
def get_voyage(voyage_id: str):
    """특정 항차 상세 조회 (항적 포함)"""
    if voyage_id not in voyages_db:
        raise HTTPException(status_code=404, detail="항차를 찾을 수 없습니다")
    return {"data": voyages_db[voyage_id].model_dump()}


@app.put("/api/voyages/{voyage_id}")
def update_voyage(voyage_id: str, update: VoyageUpdate):
    """항차 정보 수정"""
    if voyage_id not in voyages_db:
        raise HTTPException(status_code=404, detail="항차를 찾을 수 없습니다")

    voyage = voyages_db[voyage_id]
    update_data = update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(voyage, field, value)

    return {"message": "수정되었습니다", "data": voyage.model_dump()}


# ---------- 위판 관련 API ----------

@app.get("/api/auctions")
def get_auctions(voyage_id: Optional[str] = None):
    """위판 목록 조회"""
    auctions = list(auctions_db.values())
    if voyage_id:
        auctions = [a for a in auctions if a.voyage_id == voyage_id]
    return {"data": [a.model_dump() for a in auctions], "total": len(auctions)}


@app.post("/api/auctions")
def create_auction(auction: AuctionCreate):
    """위판 정보 등록"""
    if auction.voyage_id not in voyages_db:
        raise HTTPException(status_code=404, detail="해당 항차를 찾을 수 없습니다")

    # 새 ID 생성
    auction_count = len(auctions_db) + 1
    new_id = f"AUC-2025-{auction_count:03d}"

    new_auction = AuctionData(
        id=new_id,
        voyage_id=auction.voyage_id,
        auction_date=auction.auction_date,
        auction_port=auction.auction_port,
        fish_species=auction.fish_species,
        quantity=auction.quantity,
        unit_price=auction.unit_price,
        total_price=auction.quantity * auction.unit_price,
        buyer=auction.buyer
    )

    auctions_db[new_id] = new_auction
    return {"message": "등록되었습니다", "data": new_auction.model_dump()}


@app.delete("/api/auctions/{auction_id}")
def delete_auction(auction_id: str):
    """위판 정보 삭제"""
    if auction_id not in auctions_db:
        raise HTTPException(status_code=404, detail="위판 정보를 찾을 수 없습니다")

    del auctions_db[auction_id]
    return {"message": "삭제되었습니다"}


# ---------- 통계 API ----------

@app.get("/api/statistics")
def get_statistics():
    """통계 데이터"""
    total_catch = sum(v.catch_amount for v in voyages_db.values())
    total_auction = sum(a.total_price for a in auctions_db.values())

    return {
        "total_vessels": len(vessels_db),
        "total_voyages": len(voyages_db),
        "active_voyages": len([v for v in voyages_db.values() if v.status == "조업중"]),
        "total_catch_amount": total_catch,
        "total_auction_amount": total_auction,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
