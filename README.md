# 어선조업분석 플랫폼

어업 피해 조사를 위한 어선 항적 조회 플랫폼

## 주요 기능

### 1. 어선정보 관리 (전국어선정보)
- 전국어선정보 CSV 업로드 및 관리
- 어선 검색 (선명, MMSI, 등록번호)
- 필터링 (선적항, 업종, 그룹)
- 그룹 관리 (피해선박 등 그룹으로 분류)
- 어선별 상세정보 조회/수정
- **메모 기능**: 어선별 메모 작성/수정/삭제
- **사진 관리**:
  - 드래그 앤 드롭 업로드
  - 여러 파일 동시 업로드
  - 대표 사진 설정
  - JPG, PNG, GIF, WEBP 지원
- **파일 관리**:
  - 드래그 앤 드롭 업로드
  - 파일 설명 입력
  - 모든 파일 형식 지원
  - 다운로드 기능
- **목록에서 사진/파일 갯수 표시**

### 2. 항적/어획 조회·수정
- 어선 검색 (MMSI, 어선명)
- 항차별 항적 정보 조회 (위도, 경도, 속력, 침로)
- 어획 정보 확인 및 수정 (어획량, 어종, 조업해역)
- 데이터 형식: `[MMSI]-[연도]-[항차]` (예: 440001234-2025-001)

### 3. 위판 정보 입력
- 항차별 위판 내역 등록/삭제
- 위판장, 어종, 수량, 단가 입력
- 총 수량 및 금액 자동 계산

## 기술 스택

### 프론트엔드
- **Vite** + **React 19** + **TypeScript**
- **React Router** (라우팅)
- **Tailwind CSS v4**
- **shadcn/ui** (UI 컴포넌트)
- **Lucide React** (아이콘)

### 백엔드
- **FastAPI** (Python)
- **SQLite** (데이터베이스)
- **Pydantic** (데이터 검증)

## 프로젝트 구조

```
fishing-platform/
├── src/
│   ├── components/ui/          # shadcn/ui 컴포넌트
│   ├── pages/
│   │   ├── VesselRegistry.tsx  # 어선정보 관리 (메모, 사진, 파일)
│   │   ├── VoyageInquiry.tsx   # 항적/어획 조회·수정
│   │   └── AuctionEntry.tsx    # 위판 정보 입력
│   ├── lib/
│   │   ├── api.ts              # API 호출 함수 및 타입
│   │   └── utils.ts            # 유틸리티
│   ├── App.tsx                 # 메인 앱 (라우팅)
│   └── index.css               # 글로벌 스타일
│
├── backend/
│   ├── main.py                 # FastAPI 서버
│   ├── database.py             # SQLite 데이터베이스 설정
│   ├── fishing.db              # SQLite 데이터베이스 파일
│   ├── uploads/
│   │   ├── photos/             # 어선 사진 저장
│   │   └── files/              # 어선 관련 파일 저장
│   └── requirements.txt        # Python 의존성
│
└── package.json
```

## 실행 방법

### 1. 백엔드 (FastAPI)

```bash
cd backend

# 가상환경 생성 (권장)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

- API 서버: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

### 2. 프론트엔드 (React)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

- 프론트엔드: http://localhost:5173

## API 엔드포인트

### 어선 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/vessels` | 어선 목록 조회 |
| GET | `/api/vessels/{mmsi}` | 특정 어선 정보 조회 |

### 어선정보 관리 API (전국어선정보)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/vessel-registry` | 어선 목록 조회 (페이지네이션, 검색, 필터링, 사진/파일 갯수 포함) |
| POST | `/api/vessel-registry/upload` | CSV 파일 업로드 |
| GET | `/api/vessel-registry/{id}` | 어선 상세 조회 |
| PUT | `/api/vessel-registry/{id}` | 어선 정보 수정 |
| DELETE | `/api/vessel-registry/{id}` | 어선 삭제 |
| GET | `/api/vessel-registry/groups` | 그룹 목록 조회 |
| PUT | `/api/vessel-registry/{id}/group` | 어선 그룹 변경 |

### 어선 메모 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/vessel-registry/{id}/memos` | 어선 메모 목록 조회 |
| POST | `/api/vessel-registry/{id}/memos` | 메모 추가 |
| PUT | `/api/vessel-registry/{id}/memos/{memo_id}` | 메모 수정 |
| DELETE | `/api/vessel-registry/{id}/memos/{memo_id}` | 메모 삭제 |

### 어선 사진 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/vessel-registry/{id}/photos` | 어선 사진 목록 조회 |
| POST | `/api/vessel-registry/{id}/photos` | 사진 업로드 (다중 파일 지원) |
| PUT | `/api/vessel-registry/{id}/photos/{photo_id}/primary` | 대표 사진 설정 |
| DELETE | `/api/vessel-registry/{id}/photos/{photo_id}` | 사진 삭제 |

### 어선 파일 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/vessel-registry/{id}/files` | 어선 파일 목록 조회 |
| POST | `/api/vessel-registry/{id}/files` | 파일 업로드 (설명 포함) |
| GET | `/api/vessel-registry/{id}/files/{file_id}/download` | 파일 다운로드 |
| DELETE | `/api/vessel-registry/{id}/files/{file_id}` | 파일 삭제 |

### 항차 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/voyages` | 항차 목록 조회 |
| GET | `/api/voyages/{voyage_id}` | 항차 상세 조회 (항적 포함) |
| PUT | `/api/voyages/{voyage_id}` | 항차 정보 수정 |

### 위판 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/auctions` | 위판 목록 조회 |
| POST | `/api/auctions` | 위판 정보 등록 |
| DELETE | `/api/auctions/{auction_id}` | 위판 정보 삭제 |

## 데이터 모델

### 항차 데이터 (VoyageData)
```json
{
  "id": "440001234-2025-001",
  "mmsi": "440001234",
  "year": 2025,
  "voyage_no": 1,
  "vessel_name": "해양호",
  "departure_port": "부산",
  "departure_date": "2025-01-10T06:00:00",
  "arrival_port": "부산",
  "arrival_date": "2025-01-12T18:00:00",
  "fishing_area": "동해 남부",
  "track_points": [...],
  "catch_amount": 850.5,
  "fish_species": "오징어, 고등어",
  "status": "완료"
}
```

### 위판 데이터 (AuctionData)
```json
{
  "id": "AUC-2025-001",
  "voyage_id": "440001234-2025-001",
  "auction_date": "2025-01-13T05:00:00",
  "auction_port": "부산공동어시장",
  "fish_species": "오징어",
  "quantity": 500.0,
  "unit_price": 15000,
  "total_price": 7500000,
  "buyer": "수협"
}
```

## 개발 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # 린트 검사
```
