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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Ship,
  Calendar,
  Plus,
  Trash2,
  Store,
  Fish,
  Banknote,
  Calculator,
  Receipt,
  FileText,
  Navigation,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import {
  getVesselRegistry,
  getVoyages,
  getAuctions,
  createAuction,
  deleteAuction,
  type VesselRegistry,
  type VoyageData,
  type AuctionData,
  type AuctionCreate,
} from '@/lib/api'

export default function AuctionEntry() {
  const [vessels, setVessels] = useState<VesselRegistry[]>([])
  const [voyages, setVoyages] = useState<VoyageData[]>([])
  const [auctions, setAuctions] = useState<AuctionData[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselRegistry | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedVoyage, setSelectedVoyage] = useState<VoyageData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // 연도 목록 (현재 연도부터 5년 전까지)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // 선택된 연도의 항차만 필터링
  const filteredVoyages = selectedYear
    ? voyages.filter(v => v.year === selectedYear)
    : voyages

  const [auctionForm, setAuctionForm] = useState<Omit<AuctionCreate, 'voyage_id'>>({
    auction_date: new Date().toISOString().slice(0, 16),
    auction_port: '',
    fish_species: '',
    quantity: 0,
    unit_price: 0,
    buyer: '',
  })

  // 어선 검색
  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await getVesselRegistry({ search: searchTerm, page_size: 50 })
      setVessels(res.data)
      setSelectedVessel(null)
      setSelectedYear(null)
      setVoyages([])
      setSelectedVoyage(null)
      setAuctions([])
    } catch (error) {
      console.error('검색 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 어선 선택
  const handleSelectVessel = async (vessel: VesselRegistry) => {
    setSelectedVessel(vessel)
    setSelectedYear(currentYear) // 기본 현재 연도 선택
    setSelectedVoyage(null)
    setAuctions([])

    if (vessel.mmsi) {
      setLoading(true)
      try {
        const res = await getVoyages({ mmsi: vessel.mmsi })
        setVoyages(res.data)
      } catch (error) {
        console.error('항차 조회 실패:', error)
        setVoyages([])
      } finally {
        setLoading(false)
      }
    } else {
      setVoyages([])
    }
  }

  // 연도 선택
  const handleSelectYear = (year: number) => {
    setSelectedYear(year)
    setSelectedVoyage(null)
    setAuctions([])
  }

  // 항차 선택
  const handleSelectVoyage = async (voyage: VoyageData) => {
    setSelectedVoyage(voyage)
    setLoading(true)
    try {
      const res = await getAuctions(voyage.id)
      setAuctions(res.data)
    } catch (error) {
      console.error('위판 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setAuctionForm({
      auction_date: new Date().toISOString().slice(0, 16),
      auction_port: selectedVessel?.port || '',
      fish_species: '',
      quantity: 0,
      unit_price: 0,
      buyer: '',
    })
    setAddDialogOpen(true)
  }

  const handleAddAuction = async () => {
    if (!selectedVoyage) return
    setLoading(true)
    try {
      await createAuction({
        voyage_id: selectedVoyage.id,
        ...auctionForm,
      })
      const res = await getAuctions(selectedVoyage.id)
      setAuctions(res.data)
      setAddDialogOpen(false)
    } catch (error) {
      console.error('등록 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      await deleteAuction(auctionId)
      if (selectedVoyage) {
        const res = await getAuctions(selectedVoyage.id)
        setAuctions(res.data)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드: 최근 등록된 어선 몇 개 표시
  useEffect(() => {
    getVesselRegistry({ page_size: 20 }).then(res => setVessels(res.data))
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  const totalQuantity = auctions.reduce((sum, a) => sum + a.quantity, 0)
  const totalAmount = auctions.reduce((sum, a) => sum + a.total_price, 0)

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">위판 정보 입력</h2>
          <p className="text-sm text-muted-foreground">어선 선택 → 연도 선택 → 항차 선택 → 위판 정보 입력</p>
        </div>
      </div>

      {/* 선택 단계 표시 */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          selectedVessel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Ship className="h-3.5 w-3.5" />
          <span>1. 어선</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          selectedYear ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Calendar className="h-3.5 w-3.5" />
          <span>2. 연도</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          selectedVoyage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Navigation className="h-3.5 w-3.5" />
          <span>3. 항차</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          selectedVoyage ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
        }`}>
          <Receipt className="h-3.5 w-3.5" />
          <span>4. 위판 입력</span>
        </div>
      </div>

      {/* 검색 카드 */}
      <Card className="card-hover shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="선명, MMSI, 등록번호로 검색..."
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
              <CardTitle className="text-base">어선 선택</CardTitle>
            </div>
            <CardDescription>{vessels.length}척</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
              {vessels.map((vessel) => (
                <div
                  key={vessel.id}
                  onClick={() => handleSelectVessel(vessel)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVessel?.id === vessel.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{vessel.vessel_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {vessel.mmsi && (
                      <span className="text-xs font-mono text-muted-foreground">{vessel.mmsi}</span>
                    )}
                    {vessel.port && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {vessel.port}
                      </span>
                    )}
                  </div>
                  {vessel.business_type && (
                    <div className="text-xs text-muted-foreground mt-0.5">{vessel.business_type}</div>
                  )}
                </div>
              ))}
              {vessels.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  어선을 검색해주세요
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 연도 & 항차 선택 */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">연도 / 항차 선택</CardTitle>
            </div>
            <CardDescription>
              {selectedVessel ? selectedVessel.vessel_name : '어선을 먼저 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedVessel ? (
              <div className="space-y-4">
                {/* 연도 선택 */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">연도 선택</Label>
                  <Select
                    value={selectedYear?.toString() || ''}
                    onValueChange={(v) => handleSelectYear(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="연도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 항차 목록 */}
                {selectedYear && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      항차 선택 ({filteredVoyages.length}건)
                    </Label>
                    <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                      {filteredVoyages.map((voyage) => (
                        <div
                          key={voyage.id}
                          onClick={() => handleSelectVoyage(voyage)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedVoyage?.id === voyage.id
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-medium">
                              {voyage.year}-{String(voyage.voyage_no).padStart(3, '0')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              voyage.status === '완료'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {voyage.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {voyage.departure_port} → {voyage.arrival_port || '미정'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {voyage.fishing_area}
                          </div>
                        </div>
                      ))}
                      {filteredVoyages.length === 0 && (
                        <p className="text-muted-foreground text-center py-6 text-sm">
                          {selectedYear}년 항차 기록이 없습니다
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Ship className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">어선을 먼저 선택해주세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 위판 내역 */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">위판 내역</CardTitle>
                {selectedVoyage && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {selectedVoyage.id}
                  </span>
                )}
              </div>
              {selectedVoyage && (
                <Button onClick={openAddDialog} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  위판 등록
                </Button>
              )}
            </div>
            {selectedVoyage && (
              <CardDescription>
                {selectedVoyage.departure_port} 출항 → {selectedVoyage.arrival_port || '미정'} |
                어종: {selectedVoyage.fish_species || '-'}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedVoyage ? (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-xs">위판일시</TableHead>
                        <TableHead className="font-semibold text-xs">
                          <div className="flex items-center gap-1">
                            <Store className="h-3 w-3" /> 위판장
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-xs">
                          <div className="flex items-center gap-1">
                            <Fish className="h-3 w-3" /> 어종
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-xs text-right">수량</TableHead>
                        <TableHead className="font-semibold text-xs text-right">단가</TableHead>
                        <TableHead className="font-semibold text-xs text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Banknote className="h-3 w-3" /> 금액
                          </div>
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((auction) => (
                        <TableRow key={auction.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm">{formatDate(auction.auction_date)}</TableCell>
                          <TableCell className="text-sm">{auction.auction_port}</TableCell>
                          <TableCell className="text-sm font-medium">{auction.fish_species}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{auction.quantity.toLocaleString()} kg</TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatCurrency(auction.unit_price)}</TableCell>
                          <TableCell className="text-sm text-right font-mono font-semibold text-primary">
                            {formatCurrency(auction.total_price)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAuction(auction.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {auctions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">등록된 위판 내역이 없습니다</p>
                            <p className="text-xs mt-1">위판 등록 버튼을 클릭하여 추가하세요</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 합계 */}
                {auctions.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        합계 ({auctions.length}건)
                      </div>
                      <div className="flex gap-8">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">총 수량</div>
                          <div className="text-lg font-bold">{totalQuantity.toLocaleString()} kg</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">총 금액</div>
                          <div className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">위판 정보 입력 대기 중</p>
                <p className="text-xs mt-1">어선 → 연도 → 항차를 순서대로 선택해주세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 위판 등록 다이얼로그 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              위판 정보 등록
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{selectedVessel?.vessel_name}</span>
              {' | '}
              <span className="font-mono">{selectedVoyage?.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auction_date">위판일시</Label>
                <Input
                  id="auction_date"
                  type="datetime-local"
                  value={auctionForm.auction_date}
                  onChange={(e) => setAuctionForm({ ...auctionForm, auction_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auction_port">위판장</Label>
                <Input
                  id="auction_port"
                  placeholder="예: 부산공동어시장"
                  value={auctionForm.auction_port}
                  onChange={(e) => setAuctionForm({ ...auctionForm, auction_port: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fish_species">어종</Label>
              <Input
                id="fish_species"
                placeholder="예: 오징어"
                value={auctionForm.fish_species}
                onChange={(e) => setAuctionForm({ ...auctionForm, fish_species: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">수량 (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={auctionForm.quantity || ''}
                  onChange={(e) => setAuctionForm({ ...auctionForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price">단가 (원/kg)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={auctionForm.unit_price || ''}
                  onChange={(e) => setAuctionForm({ ...auctionForm, unit_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer">구매자 (선택)</Label>
              <Input
                id="buyer"
                placeholder="예: 수협"
                value={auctionForm.buyer}
                onChange={(e) => setAuctionForm({ ...auctionForm, buyer: e.target.value })}
              />
            </div>
            {/* 예상 금액 미리보기 */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  예상 금액
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(auctionForm.quantity * auctionForm.unit_price)}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>취소</Button>
            <Button
              onClick={handleAddAuction}
              disabled={loading || !auctionForm.auction_port || !auctionForm.fish_species}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
