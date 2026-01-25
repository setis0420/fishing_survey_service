// Vite 프록시를 통해 API 호출 (외부 접속 지원)
const API_BASE_URL = '/api'

// ==================== 타입 정의 ====================

export interface VesselRegistry {
  id: number
  vessel_name: string
  tonnage?: number
  length?: number
  engine_type?: string
  engine_count?: number
  engine_power_ps?: number
  engine_power_kw?: number
  engine_name?: string
  hull_material?: string
  registration_no?: string
  build_date?: string
  port?: string
  business_type?: string
  equipment_name?: string
  equipment_power?: string
  mmsi?: string
  license_local?: string
  license_start_local?: string
  license_end_local?: string
  license_province?: string
  license_start_province?: string
  license_end_province?: string
  group_name?: string
  fishing_hours?: number
  organization?: string
  owner_name?: string
  created_at?: string
  updated_at?: string
  photo_count?: number
  file_count?: number
}

export interface VesselRegistryUpdate {
  vessel_name?: string
  tonnage?: number
  length?: number
  engine_type?: string
  engine_count?: number
  engine_power_ps?: number
  engine_power_kw?: number
  engine_name?: string
  hull_material?: string
  port?: string
  business_type?: string
  mmsi?: string
  license_local?: string
  license_start_local?: string
  license_end_local?: string
  group_name?: string
  fishing_hours?: number
  organization?: string
  owner_name?: string
}

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
  note?: string
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
  note?: string
}

export interface PrivateSaleData {
  id: string
  voyage_id: string
  sale_date: string
  fish_species: string
  quantity: number
  unit_price: number
  total_price: number
  buyer?: string
  note?: string
}

export interface PrivateSaleCreate {
  voyage_id: string
  sale_date: string
  fish_species: string
  quantity: number
  unit_price: number
  buyer?: string
  note?: string
}

export interface ExpenseData {
  id: string
  voyage_id: string
  expense_date: string
  category: string
  description?: string
  amount: number
  note?: string
}

export interface ExpenseCreate {
  voyage_id: string
  expense_date: string
  category: string
  description?: string
  amount: number
  note?: string
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

// ---------- 사매 API ----------

export async function getPrivateSales(voyageId?: string): Promise<{ data: PrivateSaleData[]; total: number }> {
  const query = voyageId ? `?voyage_id=${voyageId}` : ''
  const res = await fetch(`${API_BASE_URL}/private-sales${query}`)
  return res.json()
}

export async function createPrivateSale(sale: PrivateSaleCreate): Promise<{ message: string; data: PrivateSaleData }> {
  const res = await fetch(`${API_BASE_URL}/private-sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale)
  })
  return res.json()
}

export async function deletePrivateSale(saleId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/private-sales/${saleId}`, {
    method: 'DELETE'
  })
  return res.json()
}

// ---------- 경비 API ----------

export async function getExpenses(voyageId?: string): Promise<{ data: ExpenseData[]; total: number }> {
  const query = voyageId ? `?voyage_id=${voyageId}` : ''
  const res = await fetch(`${API_BASE_URL}/expenses${query}`)
  return res.json()
}

export async function createExpense(expense: ExpenseCreate): Promise<{ message: string; data: ExpenseData }> {
  const res = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  })
  return res.json()
}

export async function deleteExpense(expenseId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
    method: 'DELETE'
  })
  return res.json()
}

// ---------- 통계 API ----------

export async function getStatistics(): Promise<Statistics> {
  const res = await fetch(`${API_BASE_URL}/statistics`)
  return res.json()
}

// ---------- 전국어선정보 API ----------

export interface VesselRegistryListResponse {
  data: VesselRegistry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function getVesselRegistry(params?: {
  search?: string
  port?: string
  business_type?: string
  group_name?: string
  organization?: string
  page?: number
  page_size?: number
}): Promise<VesselRegistryListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.port) searchParams.set('port', params.port)
  if (params?.business_type) searchParams.set('business_type', params.business_type)
  if (params?.group_name) searchParams.set('group_name', params.group_name)
  if (params?.organization) searchParams.set('organization', params.organization)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.page_size) searchParams.set('page_size', String(params.page_size))
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/vessel-registry${query ? `?${query}` : ''}`)
  return res.json()
}

export async function getVesselRegistryDetail(vesselId: number): Promise<{ data: VesselRegistry }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}`)
  return res.json()
}

export async function updateVesselRegistry(
  vesselId: number,
  update: VesselRegistryUpdate
): Promise<{ message: string; data: VesselRegistry }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  })
  return res.json()
}

export async function getPorts(): Promise<{ data: { port: string; count: number }[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/ports/list`)
  return res.json()
}

export async function getBusinessTypes(): Promise<{ data: { business_type: string; count: number }[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/business-types/list`)
  return res.json()
}

export async function getGroups(): Promise<{ data: { group_name: string; count: number }[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/groups/list`)
  return res.json()
}

export async function getOrganizations(): Promise<{ data: { organization: string; count: number }[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/organizations/list`)
  return res.json()
}

export async function getVesselRegistryStatus(): Promise<{ count: number; has_data: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/status`)
  return res.json()
}

export async function uploadVesselCSV(file: File, force: boolean = false): Promise<{ success: boolean; message: string; count: number }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/vessel-registry/upload-csv?force=${force}`, {
    method: 'POST',
    body: formData
  })
  return res.json()
}

// ---------- 어선 메모 API ----------

export interface VesselMemo {
  id: number
  vessel_id: number
  content: string
  created_at: string
  updated_at: string
}

export async function getVesselMemos(vesselId: number): Promise<{ data: VesselMemo[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/memos`)
  return res.json()
}

export async function createVesselMemo(vesselId: number, content: string): Promise<{ message: string; data: VesselMemo }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/memos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return res.json()
}

export async function updateVesselMemo(vesselId: number, memoId: number, content: string): Promise<{ message: string; data: VesselMemo }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/memos/${memoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return res.json()
}

export async function deleteVesselMemo(vesselId: number, memoId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/memos/${memoId}`, {
    method: 'DELETE'
  })
  return res.json()
}

// ---------- 어선 사진 API ----------

export interface VesselPhoto {
  id: number
  vessel_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  is_primary: number
  created_at: string
}

export async function getVesselPhotos(vesselId: number): Promise<{ data: VesselPhoto[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/photos`)
  return res.json()
}

export async function uploadVesselPhoto(vesselId: number, file: File, isPrimary: boolean = false): Promise<{ message: string; data: VesselPhoto }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('is_primary', isPrimary.toString())

  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/photos`, {
    method: 'POST',
    body: formData
  })
  return res.json()
}

export async function deleteVesselPhoto(vesselId: number, photoId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/photos/${photoId}`, {
    method: 'DELETE'
  })
  return res.json()
}

export async function setPrimaryPhoto(vesselId: number, photoId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/photos/${photoId}/primary`, {
    method: 'PUT'
  })
  return res.json()
}

export function getPhotoUrl(filename: string): string {
  return `${API_BASE_URL}/uploads/photos/${filename}`
}

// ---------- 어선 관련 파일 API ----------

export interface VesselFile {
  id: number
  vessel_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  description: string
  created_at: string
}

export async function getVesselFiles(vesselId: number): Promise<{ data: VesselFile[] }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/files`)
  return res.json()
}

export async function uploadVesselFile(vesselId: number, file: File, description: string = ''): Promise<{ message: string; data: VesselFile }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', description)

  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/files`, {
    method: 'POST',
    body: formData
  })
  return res.json()
}

export async function deleteVesselFile(vesselId: number, fileId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/vessel-registry/${vesselId}/files/${fileId}`, {
    method: 'DELETE'
  })
  return res.json()
}

export function getFileDownloadUrl(filename: string): string {
  return `${API_BASE_URL}/uploads/files/${filename}`
}

// ---------- 항적 HTML 파일 API ----------

export interface TrackFile {
  filename: string
  year: number
  month: number
  count: number
}

export interface TrackMonth {
  month: number
  count: number
  filename: string
}

export async function getTrackList(mmsi: string): Promise<{ data: TrackFile[]; years: number[] }> {
  const res = await fetch(`${API_BASE_URL}/tracks/list/${mmsi}`)
  return res.json()
}

export async function getTrackYears(mmsi: string): Promise<{ years: number[] }> {
  const res = await fetch(`${API_BASE_URL}/tracks/years/${mmsi}`)
  return res.json()
}

export async function getTrackMonths(mmsi: string, year: number): Promise<{ months: TrackMonth[] }> {
  const res = await fetch(`${API_BASE_URL}/tracks/months/${mmsi}/${year}`)
  return res.json()
}

export async function getTrackHtml(mmsi: string, filename: string): Promise<{ html: string; filename: string }> {
  const res = await fetch(`${API_BASE_URL}/tracks/html/${mmsi}/${filename}`)
  return res.json()
}

export async function getOrCreateMonthlyVoyage(
  mmsi: string,
  year: number,
  month: number,
  vesselName: string
): Promise<{ data: VoyageData; created: boolean }> {
  const params = new URLSearchParams({
    mmsi,
    year: String(year),
    month: String(month),
    vessel_name: vesselName
  })
  const res = await fetch(`${API_BASE_URL}/voyages/get-or-create-monthly?${params}`, {
    method: 'POST'
  })
  return res.json()
}
