const API_BASE_URL = 'http://localhost:8000/api'

// ==================== 타입 정의 ====================

export interface VesselInfo {
  mmsi: string
  vessel_name: string
  call_sign?: string
  vessel_type: string
  tonnage: number
  owner: string
  port: string
}

export interface TrackPoint {
  timestamp: string
  latitude: number
  longitude: number
  speed: number
  course: number
}

export interface VoyageData {
  id: string  // mmsi-year-voyage_no 형식
  mmsi: string
  year: number
  voyage_no: number
  vessel_name: string
  departure_port: string
  departure_date: string
  arrival_port?: string
  arrival_date?: string
  fishing_area: string
  track_points: TrackPoint[]
  catch_amount: number
  fish_species: string
  status: string
}

export interface AuctionData {
  id: string
  voyage_id: string
  auction_date: string
  auction_port: string
  fish_species: string
  quantity: number
  unit_price: number
  total_price: number
  buyer?: string
}

export interface VoyageUpdate {
  arrival_port?: string
  arrival_date?: string
  fishing_area?: string
  catch_amount?: number
  fish_species?: string
  status?: string
}

export interface AuctionCreate {
  voyage_id: string
  auction_date: string
  auction_port: string
  fish_species: string
  quantity: number
  unit_price: number
  buyer?: string
}

export interface Statistics {
  total_vessels: number
  total_voyages: number
  active_voyages: number
  total_catch_amount: number
  total_auction_amount: number
}

// ==================== API 호출 함수 ====================

// ---------- 어선 API ----------

export async function getVessels(search?: string): Promise<{ data: VesselInfo[]; total: number }> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const query = params.toString()
  const res = await fetch(`${API_BASE_URL}/vessels${query ? `?${query}` : ''}`)
  return res.json()
}

export async function getVessel(mmsi: string): Promise<{ data: VesselInfo }> {
  const res = await fetch(`${API_BASE_URL}/vessels/${mmsi}`)
  return res.json()
}

// ---------- 항차 API ----------

export async function getVoyages(params?: {
  mmsi?: string
  year?: number
  status?: string
}): Promise<{ data: VoyageData[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.mmsi) searchParams.set('mmsi', params.mmsi)
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/voyages${query ? `?${query}` : ''}`)
  return res.json()
}

export async function getVoyage(voyageId: string): Promise<{ data: VoyageData }> {
  const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}`)
  return res.json()
}

export async function updateVoyage(voyageId: string, update: VoyageUpdate): Promise<{ message: string; data: VoyageData }> {
  const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  })
  return res.json()
}

// ---------- 위판 API ----------

export async function getAuctions(voyageId?: string): Promise<{ data: AuctionData[]; total: number }> {
  const query = voyageId ? `?voyage_id=${voyageId}` : ''
  const res = await fetch(`${API_BASE_URL}/auctions${query}`)
  return res.json()
}

export async function createAuction(auction: AuctionCreate): Promise<{ message: string; data: AuctionData }> {
  const res = await fetch(`${API_BASE_URL}/auctions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auction)
  })
  return res.json()
}

export async function deleteAuction(auctionId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, {
    method: 'DELETE'
  })
  return res.json()
}

// ---------- 통계 API ----------

export async function getStatistics(): Promise<Statistics> {
  const res = await fetch(`${API_BASE_URL}/statistics`)
  return res.json()
}
