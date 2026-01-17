import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getVessels,
  getVoyages,
  getVoyage,
  updateVoyage,
  type VesselInfo,
  type VoyageData,
  type TrackPoint,
} from '@/lib/api'

export default function VoyageInquiry() {
  const [vessels, setVessels] = useState<VesselInfo[]>([])
  const [voyages, setVoyages] = useState<VoyageData[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselInfo | null>(null)
  const [selectedVoyage, setSelectedVoyage] = useState<VoyageData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [trackDialogOpen, setTrackDialogOpen] = useState(false)

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    fishing_area: '',
    catch_amount: 0,
    fish_species: '',
    status: '',
  })

  // 어선 검색
  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await getVessels(searchTerm)
      setVessels(res.data)
      setSelectedVessel(null)
      setVoyages([])
      setSelectedVoyage(null)
    } catch (error) {
      console.error('검색 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 어선 선택 시 항차 목록 조회
  const handleSelectVessel = async (vessel: VesselInfo) => {
    setSelectedVessel(vessel)
    setLoading(true)
    try {
      const res = await getVoyages({ mmsi: vessel.mmsi })
      setVoyages(res.data)
      setSelectedVoyage(null)
    } catch (error) {
      console.error('항차 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 항차 선택 시 상세 조회
  const handleSelectVoyage = async (voyage: VoyageData) => {
    setLoading(true)
    try {
      const res = await getVoyage(voyage.id)
      setSelectedVoyage(res.data)
    } catch (error) {
      console.error('항차 상세 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 수정 다이얼로그 열기
  const openEditDialog = () => {
    if (selectedVoyage) {
      setEditForm({
        fishing_area: selectedVoyage.fishing_area,
        catch_amount: selectedVoyage.catch_amount,
        fish_species: selectedVoyage.fish_species,
        status: selectedVoyage.status,
      })
      setEditDialogOpen(true)
    }
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedVoyage) return
    setLoading(true)
    try {
      const res = await updateVoyage(selectedVoyage.id, editForm)
      setSelectedVoyage(res.data)
      // 항차 목록도 갱신
      if (selectedVessel) {
        const voyagesRes = await getVoyages({ mmsi: selectedVessel.mmsi })
        setVoyages(voyagesRes.data)
      }
      setEditDialogOpen(false)
    } catch (error) {
      console.error('수정 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    getVessels().then(res => setVessels(res.data))
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">항적 및 어획정보 조회/수정</h2>
          <p className="text-muted-foreground">어선을 검색하여 항차별 항적과 어획 정보를 확인하고 수정합니다</p>
        </div>
      </div>

      {/* 검색 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>어선 검색</CardTitle>
          <CardDescription>MMSI 또는 어선명으로 검색하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="MMSI 또는 어선명 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} disabled={loading}>
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 어선 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>어선 목록</CardTitle>
            <CardDescription>총 {vessels.length}척</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {vessels.map((vessel) => (
                <div
                  key={vessel.mmsi}
                  onClick={() => handleSelectVessel(vessel)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVessel?.mmsi === vessel.mmsi
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{vessel.vessel_name}</div>
                  <div className="text-sm opacity-80">MMSI: {vessel.mmsi}</div>
                  <div className="text-sm opacity-80">{vessel.vessel_type} | {vessel.tonnage}t</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 항차 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>항차 목록</CardTitle>
            <CardDescription>
              {selectedVessel ? `${selectedVessel.vessel_name}의 항차` : '어선을 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {voyages.map((voyage) => (
                <div
                  key={voyage.id}
                  onClick={() => handleSelectVoyage(voyage)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVoyage?.id === voyage.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{voyage.id}</div>
                  <div className="text-sm opacity-80">
                    {voyage.departure_port} → {voyage.arrival_port || '조업중'}
                  </div>
                  <div className="text-sm opacity-80">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      voyage.status === '완료' ? 'bg-green-500/20' :
                      voyage.status === '조업중' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                    }`}>
                      {voyage.status}
                    </span>
                  </div>
                </div>
              ))}
              {selectedVessel && voyages.length === 0 && (
                <p className="text-muted-foreground text-center py-4">항차 데이터가 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 항차 상세 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>항차 상세 정보</CardTitle>
            <CardDescription>
              {selectedVoyage ? selectedVoyage.id : '항차를 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedVoyage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">출항일시</Label>
                    <p>{formatDate(selectedVoyage.departure_date)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">입항일시</Label>
                    <p>{formatDate(selectedVoyage.arrival_date)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">출항지</Label>
                    <p>{selectedVoyage.departure_port}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">입항지</Label>
                    <p>{selectedVoyage.arrival_port || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">조업해역</Label>
                    <p>{selectedVoyage.fishing_area}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">상태</Label>
                    <p>{selectedVoyage.status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">어획량</Label>
                    <p>{selectedVoyage.catch_amount.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">어종</Label>
                    <p>{selectedVoyage.fish_species || '-'}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={openEditDialog} className="flex-1">
                    정보 수정
                  </Button>
                  <Button variant="outline" onClick={() => setTrackDialogOpen(true)} className="flex-1">
                    항적 보기
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">항차를 선택하세요</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>항차 정보 수정</DialogTitle>
            <DialogDescription>{selectedVoyage?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fishing_area">조업해역</Label>
              <Input
                id="fishing_area"
                value={editForm.fishing_area}
                onChange={(e) => setEditForm({ ...editForm, fishing_area: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catch_amount">어획량 (kg)</Label>
              <Input
                id="catch_amount"
                type="number"
                value={editForm.catch_amount}
                onChange={(e) => setEditForm({ ...editForm, catch_amount: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fish_species">어종</Label>
              <Input
                id="fish_species"
                value={editForm.fish_species}
                onChange={(e) => setEditForm({ ...editForm, fish_species: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">상태</Label>
              <select
                id="status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="조업중">조업중</option>
                <option value="입항">입항</option>
                <option value="완료">완료</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveEdit} disabled={loading}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 항적 다이얼로그 */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>항적 정보</DialogTitle>
            <DialogDescription>{selectedVoyage?.id}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시각</TableHead>
                  <TableHead>위도</TableHead>
                  <TableHead>경도</TableHead>
                  <TableHead>속력 (kn)</TableHead>
                  <TableHead>침로 (°)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedVoyage?.track_points.map((point: TrackPoint, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(point.timestamp)}</TableCell>
                    <TableCell>{point.latitude.toFixed(4)}</TableCell>
                    <TableCell>{point.longitude.toFixed(4)}</TableCell>
                    <TableCell>{point.speed}</TableCell>
                    <TableCell>{point.course}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setTrackDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
