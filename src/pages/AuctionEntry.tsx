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

  // 위판 입력 폼 상태
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

  // 어선 선택 시 항차 목록 조회
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

  // 항차 선택 시 위판 목록 조회
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

  // 위판 등록 다이얼로그 열기
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

  // 위판 등록
  const handleAddAuction = async () => {
    if (!selectedVoyage) return
    setLoading(true)
    try {
      await createAuction({
        voyage_id: selectedVoyage.id,
        ...auctionForm,
      })
      // 목록 갱신
      const res = await getAuctions(selectedVoyage.id)
      setAuctions(res.data)
      setAddDialogOpen(false)
    } catch (error) {
      console.error('등록 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 위판 삭제
  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      await deleteAuction(auctionId)
      // 목록 갱신
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

  // 초기 로드
  useEffect(() => {
    getVessels().then(res => setVessels(res.data))
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  // 총합 계산
  const totalQuantity = auctions.reduce((sum, a) => sum + a.quantity, 0)
  const totalAmount = auctions.reduce((sum, a) => sum + a.total_price, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">위판 정보 입력</h2>
          <p className="text-muted-foreground">어선을 검색하여 항차별 위판 정보를 등록합니다</p>
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

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 어선 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>어선 목록</CardTitle>
            <CardDescription>총 {vessels.length}척</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-auto">
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
              {selectedVessel ? `${selectedVessel.vessel_name}` : '어선 선택'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-auto">
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
                  <div className="font-medium text-sm">{voyage.id}</div>
                  <div className="text-xs opacity-80">
                    {voyage.fishing_area} | {voyage.status}
                  </div>
                </div>
              ))}
              {selectedVessel && voyages.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm">항차 없음</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 위판 목록 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>위판 내역</CardTitle>
                <CardDescription>
                  {selectedVoyage ? selectedVoyage.id : '항차를 선택하세요'}
                </CardDescription>
              </div>
              {selectedVoyage && (
                <Button onClick={openAddDialog}>위판 등록</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedVoyage ? (
              <>
                <div className="max-h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>위판일시</TableHead>
                        <TableHead>위판장</TableHead>
                        <TableHead>어종</TableHead>
                        <TableHead className="text-right">수량(kg)</TableHead>
                        <TableHead className="text-right">단가</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell className="text-sm">{formatDate(auction.auction_date)}</TableCell>
                          <TableCell>{auction.auction_port}</TableCell>
                          <TableCell>{auction.fish_species}</TableCell>
                          <TableCell className="text-right">{auction.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{formatCurrency(auction.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(auction.total_price)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAuction(auction.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              삭제
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {auctions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            등록된 위판 내역이 없습니다
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {auctions.length > 0 && (
                  <div className="mt-4 pt-4 border-t flex justify-end gap-8">
                    <div>
                      <span className="text-muted-foreground">총 수량: </span>
                      <span className="font-bold">{totalQuantity.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">총 금액: </span>
                      <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">항차를 선택하세요</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 위판 등록 다이얼로그 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>위판 정보 등록</DialogTitle>
            <DialogDescription>{selectedVoyage?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">예상 금액</div>
              <div className="text-lg font-bold">
                {formatCurrency(auctionForm.quantity * auctionForm.unit_price)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>취소</Button>
            <Button onClick={handleAddAuction} disabled={loading || !auctionForm.auction_port || !auctionForm.fish_species}>
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
