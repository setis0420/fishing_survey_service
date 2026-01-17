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
  Calendar,
  Plus,
  Trash2,
  Store,
  Fish,
  Banknote,
  Calculator,
  Receipt,
  FileText,
} from 'lucide-react'
import {
  getVessels,
  getVoyages,
  getAuctions,
  createAuction,
  deleteAuction,
  type VesselInfo,
  type VoyageData,
  type AuctionData,
  type AuctionCreate,
} from '@/lib/api'

export default function AuctionEntry() {
  const [vessels, setVessels] = useState<VesselInfo[]>([])
  const [voyages, setVoyages] = useState<VoyageData[]>([])
  const [auctions, setAuctions] = useState<AuctionData[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselInfo | null>(null)
  const [selectedVoyage, setSelectedVoyage] = useState<VoyageData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const [auctionForm, setAuctionForm] = useState<Omit<AuctionCreate, 'voyage_id'>>({
    auction_date: new Date().toISOString().slice(0, 16),
    auction_port: '',
    fish_species: '',
    quantity: 0,
    unit_price: 0,
    buyer: '',
  })

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await getVessels(searchTerm)
      setVessels(res.data)
      setSelectedVessel(null)
      setVoyages([])
      setSelectedVoyage(null)
      setAuctions([])
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
      setAuctions([])
    } catch (error) {
      console.error('항차 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

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
      auction_port: '',
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

  useEffect(() => {
    getVessels().then(res => setVessels(res.data))
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
          <p className="text-sm text-muted-foreground">어선을 검색하여 항차별 위판 정보를 등록합니다</p>
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
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">어선</CardTitle>
            </div>
            <CardDescription>{vessels.length}척</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[350px] overflow-auto pr-1">
              {vessels.map((vessel) => (
                <div
                  key={vessel.mmsi}
                  onClick={() => handleSelectVessel(vessel)}
                  className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVessel?.mmsi === vessel.mmsi
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{vessel.vessel_name}</div>
                  <div className="text-xs text-muted-foreground">{vessel.mmsi}</div>
                </div>
              ))}
              {vessels.length === 0 && (
                <p className="text-muted-foreground text-center py-6 text-xs">검색 필요</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 항차 목록 */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">항차</CardTitle>
            </div>
            <CardDescription>
              {selectedVessel ? selectedVessel.vessel_name : '선택'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[350px] overflow-auto pr-1">
              {voyages.map((voyage) => (
                <div
                  key={voyage.id}
                  onClick={() => handleSelectVoyage(voyage)}
                  className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVoyage?.id === voyage.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-mono text-xs font-medium">{voyage.id.split('-').slice(1).join('-')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{voyage.fishing_area}</div>
                </div>
              ))}
              {selectedVessel && voyages.length === 0 && (
                <p className="text-muted-foreground text-center py-6 text-xs">없음</p>
              )}
              {!selectedVessel && (
                <p className="text-muted-foreground text-center py-6 text-xs">어선 선택</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 위판 내역 */}
        <Card className="lg:col-span-8 shadow-sm">
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
                        <TableHead className="w-16"></TableHead>
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
                        합계
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
                <p className="text-sm">항차를 선택하면 위판 내역이 표시됩니다</p>
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
            <DialogDescription className="font-mono">{selectedVoyage?.id}</DialogDescription>
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
                  value={auctionForm.quantity}
                  onChange={(e) => setAuctionForm({ ...auctionForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price">단가 (원/kg)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={auctionForm.unit_price}
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
