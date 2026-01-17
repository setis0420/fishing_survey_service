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
  Search,
  Ship,
  Navigation,
  MapPin,
  Calendar,
  Fish,
  Edit3,
  Eye,
  Compass,
  Gauge,
  Clock,
  Anchor,
} from 'lucide-react'
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

  const [editForm, setEditForm] = useState({
    fishing_area: '',
    catch_amount: 0,
    fish_species: '',
    status: '',
  })

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

  const handleSaveEdit = async () => {
    if (!selectedVoyage) return
    setLoading(true)
    try {
      const res = await updateVoyage(selectedVoyage.id, editForm)
      setSelectedVoyage(res.data)
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

  useEffect(() => {
    getVessels().then(res => setVessels(res.data))
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '완료':
        return 'status-badge status-complete'
      case '조업중':
        return 'status-badge status-active'
      default:
        return 'status-badge status-pending'
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <Navigation className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">항적 및 어획정보 조회/수정</h2>
          <p className="text-sm text-muted-foreground">어선을 검색하여 항차별 항적과 어획 정보를 확인하고 수정합니다</p>
        </div>
      </div>

      {/* 검색 카드 */}
      <Card className="card-hover shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="MMSI 또는 어선명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 어선 목록 */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">어선 목록</CardTitle>
            </div>
            <CardDescription>총 {vessels.length}척</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[450px] overflow-auto pr-1">
              {vessels.map((vessel) => (
                <div
                  key={vessel.mmsi}
                  onClick={() => handleSelectVessel(vessel)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVessel?.mmsi === vessel.mmsi
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedVessel?.mmsi === vessel.mmsi ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <span className="font-semibold text-sm">{vessel.vessel_name}</span>
                  </div>
                  <div className="mt-1 ml-4 text-xs text-muted-foreground space-y-0.5">
                    <div>MMSI: {vessel.mmsi}</div>
                    <div>{vessel.vessel_type} · {vessel.tonnage}t</div>
                  </div>
                </div>
              ))}
              {vessels.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">어선을 검색해주세요</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 항차 목록 */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">항차 목록</CardTitle>
            </div>
            <CardDescription>
              {selectedVessel ? selectedVessel.vessel_name : '어선을 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[450px] overflow-auto pr-1">
              {voyages.map((voyage) => (
                <div
                  key={voyage.id}
                  onClick={() => handleSelectVoyage(voyage)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVoyage?.id === voyage.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{voyage.id.split('-').slice(1).join('-')}</span>
                    <span className={getStatusStyle(voyage.status)}>{voyage.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {voyage.departure_port} → {voyage.arrival_port || '...'}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Fish className="h-3 w-3" />
                    {voyage.catch_amount.toLocaleString()} kg
                  </div>
                </div>
              ))}
              {selectedVessel && voyages.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">항차 데이터가 없습니다</p>
              )}
              {!selectedVessel && (
                <p className="text-muted-foreground text-center py-8 text-sm">어선을 선택하세요</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 항차 상세 정보 */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">항차 상세 정보</CardTitle>
              </div>
              {selectedVoyage && (
                <span className={getStatusStyle(selectedVoyage.status)}>{selectedVoyage.status}</span>
              )}
            </div>
            <CardDescription>
              {selectedVoyage ? (
                <span className="font-mono">{selectedVoyage.id}</span>
              ) : '항차를 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedVoyage ? (
              <div className="space-y-6">
                {/* 기본 정보 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      출항일시
                    </div>
                    <p className="text-sm font-medium">{formatDate(selectedVoyage.departure_date)}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      입항일시
                    </div>
                    <p className="text-sm font-medium">{formatDate(selectedVoyage.arrival_date)}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Anchor className="h-3 w-3" />
                      출항지
                    </div>
                    <p className="text-sm font-medium">{selectedVoyage.departure_port}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Anchor className="h-3 w-3" />
                      입항지
                    </div>
                    <p className="text-sm font-medium">{selectedVoyage.arrival_port || '-'}</p>
                  </div>
                </div>

                {/* 어획 정보 */}
                <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    어획 정보
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">조업해역</div>
                      <p className="text-sm font-medium mt-0.5">{selectedVoyage.fishing_area}</p>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">어획량</div>
                      <p className="text-lg font-bold text-primary mt-0.5">
                        {selectedVoyage.catch_amount.toLocaleString()} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">어종</div>
                      <p className="text-sm font-medium mt-0.5">{selectedVoyage.fish_species || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex gap-3">
                  <Button onClick={openEditDialog} className="flex-1 gap-2">
                    <Edit3 className="h-4 w-4" />
                    정보 수정
                  </Button>
                  <Button variant="outline" onClick={() => setTrackDialogOpen(true)} className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    항적 보기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Navigation className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">항차를 선택하면 상세 정보가 표시됩니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              항차 정보 수정
            </DialogTitle>
            <DialogDescription className="font-mono">{selectedVoyage?.id}</DialogDescription>
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
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              항적 정보
            </DialogTitle>
            <DialogDescription className="font-mono">{selectedVoyage?.id}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 시각
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> 위도
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> 경도
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> 속력
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3" /> 침로
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedVoyage?.track_points.map((point: TrackPoint, idx: number) => (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="text-sm">{formatDate(point.timestamp)}</TableCell>
                    <TableCell className="font-mono text-sm">{point.latitude.toFixed(4)}°</TableCell>
                    <TableCell className="font-mono text-sm">{point.longitude.toFixed(4)}°</TableCell>
                    <TableCell className="font-mono text-sm">{point.speed} kn</TableCell>
                    <TableCell className="font-mono text-sm">{point.course}°</TableCell>
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
