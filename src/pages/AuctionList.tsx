import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Ship,
  Receipt,
  Fish,
  Banknote,
  Store,
  Package,
  Calculator,
  ShoppingCart,
  Wallet,
  Download,
  Filter,
  Building2,
  Users,
  Briefcase,
  Clock,
  History,
  FileText,
  Calendar,
  User,
} from 'lucide-react'
import {
  type AuctionData,
  type PrivateSaleData,
  type ExpenseData,
  type ModificationHistory,
  getGroups,
  getOrganizations,
  getBusinessTypes,
  getAuctionHistory,
  getPrivateSaleHistory,
  getExpenseHistory,
} from '@/lib/api'

// API 기본 URL
const API_BASE_URL = '/api'

// 전체 위판 목록 조회
async function getAllAuctions(params?: {
  start_date?: string
  end_date?: string
  fish_species?: string
  vessel_name?: string
  mmsi?: string
}): Promise<{ data: (AuctionData & { vessel_name?: string; mmsi?: string })[] }> {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)
  if (params?.fish_species) searchParams.set('fish_species', params.fish_species)
  if (params?.vessel_name) searchParams.set('vessel_name', params.vessel_name)
  if (params?.mmsi) searchParams.set('mmsi', params.mmsi)
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/auctions/all${query ? `?${query}` : ''}`)
  return res.json()
}

// 전체 사매 목록 조회
async function getAllPrivateSales(params?: {
  start_date?: string
  end_date?: string
  fish_species?: string
  vessel_name?: string
  mmsi?: string
}): Promise<{ data: (PrivateSaleData & { vessel_name?: string; mmsi?: string })[] }> {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)
  if (params?.fish_species) searchParams.set('fish_species', params.fish_species)
  if (params?.vessel_name) searchParams.set('vessel_name', params.vessel_name)
  if (params?.mmsi) searchParams.set('mmsi', params.mmsi)
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/private-sales/all${query ? `?${query}` : ''}`)
  return res.json()
}

// 전체 경비 목록 조회
async function getAllExpenses(params?: {
  start_date?: string
  end_date?: string
  category?: string
  vessel_name?: string
  mmsi?: string
}): Promise<{ data: (ExpenseData & { vessel_name?: string; mmsi?: string })[] }> {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)
  if (params?.category) searchParams.set('category', params.category)
  if (params?.vessel_name) searchParams.set('vessel_name', params.vessel_name)
  if (params?.mmsi) searchParams.set('mmsi', params.mmsi)
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/expenses/all${query ? `?${query}` : ''}`)
  return res.json()
}

// 어선 목록 조회 (필터 적용)
async function getFilteredVessels(params: {
  search?: string
  group_name?: string
  organization?: string
  business_type?: string
}): Promise<{ data: { mmsi: string; vessel_name: string }[] }> {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.group_name && params.group_name !== 'all') searchParams.set('group_name', params.group_name)
  if (params.organization && params.organization !== 'all') searchParams.set('organization', params.organization)
  if (params.business_type && params.business_type !== 'all') searchParams.set('business_type', params.business_type)
  searchParams.set('page_size', '1000')
  const query = searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/vessel-registry?${query}`)
  const result = await res.json()
  return {
    data: result.data
      .filter((v: { mmsi?: string }) => v.mmsi)
      .map((v: { mmsi: string; vessel_name: string }) => ({
        mmsi: v.mmsi,
        vessel_name: v.vessel_name,
      })),
  }
}

export default function AuctionList() {
  const [auctions, setAuctions] = useState<(AuctionData & { vessel_name?: string })[]>([])
  const [privateSales, setPrivateSales] = useState<(PrivateSaleData & { vessel_name?: string })[]>([])
  const [expenses, setExpenses] = useState<(ExpenseData & { vessel_name?: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('auction')

  // 필터 옵션
  const [groups, setGroups] = useState<{ group_name: string; count: number }[]>([])
  const [organizations, setOrganizations] = useState<{ organization: string; count: number }[]>([])
  const [businessTypes, setBusinessTypes] = useState<{ business_type: string; count: number }[]>([])

  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedOrganization, setSelectedOrganization] = useState('all')
  const [selectedBusinessType, setSelectedBusinessType] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  // 상세 다이얼로그 상태
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AuctionData | PrivateSaleData | ExpenseData | null>(null)
  const [selectedRecordType, setSelectedRecordType] = useState<'auction' | 'private_sale' | 'expense'>('auction')
  const [modificationHistory, setModificationHistory] = useState<ModificationHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 경비 카테고리 목록
  const expenseCategories = ['유류비', '인건비', '수리비', '어구비', '식비', '기타']

  // 필터 옵션 로드
  useEffect(() => {
    Promise.all([getGroups(), getOrganizations(), getBusinessTypes()]).then(
      ([groupsRes, orgsRes, typesRes]) => {
        setGroups(groupsRes.data)
        setOrganizations(orgsRes.data)
        setBusinessTypes(typesRes.data)
      }
    )
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const hasGroupFilter = selectedGroup !== 'all' || selectedOrganization !== 'all' || selectedBusinessType !== 'all'

      // 그룹/소속/업종 필터가 있는 경우에만 vessel-registry에서 MMSI 목록 조회
      let mmsiList: string[] = []
      if (hasGroupFilter) {
        const vesselsRes = await getFilteredVessels({
          search: searchKeyword || undefined,
          group_name: selectedGroup,
          organization: selectedOrganization,
          business_type: selectedBusinessType,
        })
        mmsiList = vesselsRes.data.map((v) => v.mmsi)
      }

      // 위판/사매/경비 데이터 조회 - vessel_name 파라미터 직접 전달
      const params = {
        vessel_name: searchKeyword || undefined,
      }

      const [auctionsRes, privateSalesRes, expensesRes] = await Promise.all([
        getAllAuctions(params),
        getAllPrivateSales(params),
        getAllExpenses({
          ...params,
          category: categoryFilter || undefined,
        }),
      ])

      let filteredAuctions = auctionsRes.data || []
      let filteredPrivateSales = privateSalesRes.data || []
      let filteredExpenses = expensesRes.data || []

      // 그룹/소속/업종 필터가 있는 경우 MMSI로 추가 필터링
      if (hasGroupFilter) {
        if (mmsiList.length > 0) {
          filteredAuctions = filteredAuctions.filter((a) => {
            const voyageMmsi = a.voyage_id.split('-')[0]
            return mmsiList.includes(voyageMmsi)
          })
          filteredPrivateSales = filteredPrivateSales.filter((s) => {
            const voyageMmsi = s.voyage_id.split('-')[0]
            return mmsiList.includes(voyageMmsi)
          })
          filteredExpenses = filteredExpenses.filter((e) => {
            const voyageMmsi = e.voyage_id.split('-')[0]
            return mmsiList.includes(voyageMmsi)
          })
        } else {
          // 그룹/소속/업종 필터 조건에 맞는 어선이 없음
          filteredAuctions = []
          filteredPrivateSales = []
          filteredExpenses = []
        }
      }

      setAuctions(filteredAuctions)
      setPrivateSales(filteredPrivateSales)
      setExpenses(filteredExpenses)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setAuctions([])
      setPrivateSales([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = () => {
    loadData()
  }

  const handleReset = () => {
    setSearchKeyword('')
    setSelectedGroup('all')
    setSelectedOrganization('all')
    setSelectedBusinessType('all')
    setCategoryFilter('')
    setTimeout(loadData, 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  // 상세 보기 다이얼로그 열기
  const openDetailDialog = async (
    record: AuctionData | PrivateSaleData | ExpenseData,
    type: 'auction' | 'private_sale' | 'expense'
  ) => {
    setSelectedRecord(record)
    setSelectedRecordType(type)
    setDetailDialogOpen(true)
    setHistoryLoading(true)
    setModificationHistory([])

    try {
      let historyRes
      if (type === 'auction') {
        historyRes = await getAuctionHistory(record.id)
      } else if (type === 'private_sale') {
        historyRes = await getPrivateSaleHistory(record.id)
      } else {
        historyRes = await getExpenseHistory(record.id)
      }
      setModificationHistory(historyRes.data || [])
    } catch (error) {
      console.error('이력 조회 실패:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // 필드명 한글 변환
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      auction_date: '위판일시',
      auction_port: '위판장',
      fish_species: '어종',
      quantity: '수량',
      unit_price: '단가',
      buyer: '구매자',
      note: '비고',
      sale_date: '판매일시',
      expense_date: '지출일시',
      category: '카테고리',
      description: '내용',
      amount: '금액',
    }
    return labels[fieldName] || fieldName
  }

  // 통계 계산
  const totalAuctionQuantity = auctions.reduce((sum, a) => sum + a.quantity, 0)
  const totalAuctionAmount = auctions.reduce((sum, a) => sum + a.total_price, 0)
  const totalPrivateSalesQuantity = privateSales.reduce((sum, s) => sum + s.quantity, 0)
  const totalPrivateSalesAmount = privateSales.reduce((sum, s) => sum + s.total_price, 0)
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  // CSV 내보내기
  const exportToCSV = () => {
    let headers: string[] = []
    let rows: (string | number)[][] = []

    if (activeTab === 'auction') {
      headers = ['위판일시', '선박명', '위판장', '어종', '수량(kg)', '단가', '금액', '구매자', '비고']
      rows = auctions.map((a) => [
        a.auction_date,
        a.vessel_name || '-',
        a.auction_port,
        a.fish_species,
        a.quantity,
        a.unit_price,
        a.total_price,
        a.buyer || '-',
        a.note || '-',
      ])
    } else if (activeTab === 'private-sale') {
      headers = ['판매일시', '선박명', '어종', '수량(kg)', '단가', '금액', '구매자', '비고']
      rows = privateSales.map((s) => [
        s.sale_date,
        s.vessel_name || '-',
        s.fish_species,
        s.quantity,
        s.unit_price,
        s.total_price,
        s.buyer || '-',
        s.note || '-',
      ])
    } else {
      headers = ['지출일시', '선박명', '카테고리', '내용', '금액', '비고']
      rows = expenses.map((e) => [
        e.expense_date,
        e.vessel_name || '-',
        e.category,
        e.description || '-',
        e.amount,
        e.note || '-',
      ])
    }

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const tabName = activeTab === 'auction' ? '위판' : activeTab === 'private-sale' ? '사매' : '경비'
    link.download = `${tabName}내역_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">위판 실적 조회</h2>
            <p className="text-sm text-muted-foreground">등록된 위판, 사매, 경비 정보를 조회합니다</p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          CSV 내보내기
        </Button>
      </div>

      {/* 검색 필터 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">검색 필터</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 선박 검색 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Search className="h-3.5 w-3.5" />
                선박 검색
              </Label>
              <Input
                placeholder="선박명 또는 MMSI..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            {/* 그룹 선택 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Users className="h-3.5 w-3.5" />
                그룹
              </Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.group_name} value={g.group_name}>
                      {g.group_name} ({g.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 소속 선택 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Building2 className="h-3.5 w-3.5" />
                소속
              </Label>
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {organizations.map((o) => (
                    <SelectItem key={o.organization} value={o.organization}>
                      {o.organization} ({o.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 업종 선택 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Briefcase className="h-3.5 w-3.5" />
                업종
              </Label>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {businessTypes.map((b) => (
                    <SelectItem key={b.business_type} value={b.business_type}>
                      {b.business_type} ({b.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 검색 버튼 */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {activeTab === 'expense' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">카테고리:</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                검색
              </Button>
              <Button onClick={handleReset} variant="outline">
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 테이블 */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="auction" className="gap-2">
                <Receipt className="h-4 w-4" />
                위판 내역 ({auctions.length})
              </TabsTrigger>
              <TabsTrigger value="private-sale" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                사매 내역 ({privateSales.length})
              </TabsTrigger>
              <TabsTrigger value="expense" className="gap-2">
                <Wallet className="h-4 w-4" />
                경비 내역 ({expenses.length})
              </TabsTrigger>
            </TabsList>

            {/* 위판 내역 탭 */}
            <TabsContent value="auction">
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="font-semibold">위판일시</TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Ship className="h-3.5 w-3.5" /> 선박명
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5" /> 위판장
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Fish className="h-3.5 w-3.5" /> 어종
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-3.5 w-3.5" /> 수량
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-right">단가</TableHead>
                        <TableHead className="font-semibold text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Banknote className="h-3.5 w-3.5" /> 금액
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">구매자</TableHead>
                        <TableHead className="font-semibold">비고</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((auction) => (
                        <TableRow
                          key={auction.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => openDetailDialog(auction, 'auction')}
                        >
                          <TableCell className="text-sm">{formatDate(auction.auction_date)}</TableCell>
                          <TableCell className="text-sm font-medium">{auction.vessel_name || '-'}</TableCell>
                          <TableCell className="text-sm">{auction.auction_port}</TableCell>
                          <TableCell className="text-sm">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              {auction.fish_species}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">
                            {auction.quantity.toLocaleString()} kg
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">
                            {formatCurrency(auction.unit_price)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-semibold text-primary">
                            {formatCurrency(auction.total_price)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{auction.buyer || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={auction.note || ''}>
                            {auction.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {auctions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-16">
                            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">등록된 위판 내역이 없습니다</p>
                            <p className="text-xs mt-1">항적 조회 및 위판정보 입력 메뉴에서 위판 정보를 입력해주세요</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                        <div className="text-lg font-bold">{totalAuctionQuantity.toLocaleString()} kg</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">총 금액</div>
                        <div className="text-lg font-bold text-primary">{formatCurrency(totalAuctionAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 사매 내역 탭 */}
            <TabsContent value="private-sale">
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="font-semibold">판매일시</TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Ship className="h-3.5 w-3.5" /> 선박명
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Fish className="h-3.5 w-3.5" /> 어종
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-right">수량</TableHead>
                        <TableHead className="font-semibold text-right">단가</TableHead>
                        <TableHead className="font-semibold text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Banknote className="h-3.5 w-3.5" /> 금액
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">구매자</TableHead>
                        <TableHead className="font-semibold">비고</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {privateSales.map((sale) => (
                        <TableRow
                          key={sale.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => openDetailDialog(sale, 'private_sale')}
                        >
                          <TableCell className="text-sm">{formatDate(sale.sale_date)}</TableCell>
                          <TableCell className="text-sm font-medium">{sale.vessel_name || '-'}</TableCell>
                          <TableCell className="text-sm">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              {sale.fish_species}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">
                            {sale.quantity.toLocaleString()} kg
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono">
                            {formatCurrency(sale.unit_price)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-semibold text-green-600">
                            {formatCurrency(sale.total_price)}
                          </TableCell>
                          <TableCell className="text-sm">{sale.buyer || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{sale.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {privateSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">등록된 사매 내역이 없습니다</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {privateSales.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl border border-green-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calculator className="h-4 w-4" />
                      합계 ({privateSales.length}건)
                    </div>
                    <div className="flex gap-8">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">총 수량</div>
                        <div className="text-lg font-bold">{totalPrivateSalesQuantity.toLocaleString()} kg</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">총 금액</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(totalPrivateSalesAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 경비 내역 탭 */}
            <TabsContent value="expense">
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="font-semibold">지출일시</TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-1">
                            <Ship className="h-3.5 w-3.5" /> 선박명
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">카테고리</TableHead>
                        <TableHead className="font-semibold">내용</TableHead>
                        <TableHead className="font-semibold text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Banknote className="h-3.5 w-3.5" /> 금액
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">비고</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow
                          key={expense.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => openDetailDialog(expense, 'expense')}
                        >
                          <TableCell className="text-sm">{formatDate(expense.expense_date)}</TableCell>
                          <TableCell className="text-sm font-medium">{expense.vessel_name || '-'}</TableCell>
                          <TableCell className="text-sm">
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{expense.description || '-'}</TableCell>
                          <TableCell className="text-sm text-right font-mono font-semibold text-orange-600">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{expense.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">등록된 경비 내역이 없습니다</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {expenses.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-xl border border-orange-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calculator className="h-4 w-4" />
                      합계 ({expenses.length}건)
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">총 경비</div>
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(totalExpenseAmount)}</div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedRecordType === 'auction' && '위판 상세 정보'}
              {selectedRecordType === 'private_sale' && '사매 상세 정보'}
              {selectedRecordType === 'expense' && '경비 상세 정보'}
            </DialogTitle>
            <DialogDescription>
              ID: <span className="font-mono">{selectedRecord?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6 py-4">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  {selectedRecordType === 'auction' && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">위판일시</div>
                        <div className="text-sm font-medium">{formatDate((selectedRecord as AuctionData).auction_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">위판장</div>
                        <div className="text-sm font-medium">{(selectedRecord as AuctionData).auction_port}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">어종</div>
                        <div className="text-sm font-medium">{(selectedRecord as AuctionData).fish_species}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">수량</div>
                        <div className="text-sm font-medium">{(selectedRecord as AuctionData).quantity.toLocaleString()} kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">단가</div>
                        <div className="text-sm font-medium">{formatCurrency((selectedRecord as AuctionData).unit_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">총액</div>
                        <div className="text-sm font-bold text-primary">{formatCurrency((selectedRecord as AuctionData).total_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">구매자</div>
                        <div className="text-sm font-medium">{(selectedRecord as AuctionData).buyer || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">선박명</div>
                        <div className="text-sm font-medium">{selectedRecord.vessel_name || '-'}</div>
                      </div>
                    </>
                  )}
                  {selectedRecordType === 'private_sale' && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">판매일시</div>
                        <div className="text-sm font-medium">{formatDate((selectedRecord as PrivateSaleData).sale_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">어종</div>
                        <div className="text-sm font-medium">{(selectedRecord as PrivateSaleData).fish_species}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">수량</div>
                        <div className="text-sm font-medium">{(selectedRecord as PrivateSaleData).quantity.toLocaleString()} kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">단가</div>
                        <div className="text-sm font-medium">{formatCurrency((selectedRecord as PrivateSaleData).unit_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">총액</div>
                        <div className="text-sm font-bold text-green-600">{formatCurrency((selectedRecord as PrivateSaleData).total_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">구매자</div>
                        <div className="text-sm font-medium">{(selectedRecord as PrivateSaleData).buyer || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">선박명</div>
                        <div className="text-sm font-medium">{selectedRecord.vessel_name || '-'}</div>
                      </div>
                    </>
                  )}
                  {selectedRecordType === 'expense' && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">지출일시</div>
                        <div className="text-sm font-medium">{formatDate((selectedRecord as ExpenseData).expense_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">카테고리</div>
                        <div className="text-sm font-medium">{(selectedRecord as ExpenseData).category}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">내용</div>
                        <div className="text-sm font-medium">{(selectedRecord as ExpenseData).description || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">금액</div>
                        <div className="text-sm font-bold text-orange-600">{formatCurrency((selectedRecord as ExpenseData).amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">선박명</div>
                        <div className="text-sm font-medium">{selectedRecord.vessel_name || '-'}</div>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">비고</div>
                    <div className="text-sm font-medium">{selectedRecord.note || '-'}</div>
                  </div>
                </div>
              </div>

              {/* 입력/수정 일자 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  입력/수정 일자
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">입력일자</div>
                      <div className="text-sm font-medium">
                        {selectedRecord.created_at ? formatDate(selectedRecord.created_at) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">수정일자</div>
                      <div className="text-sm font-medium">
                        {selectedRecord.updated_at ? formatDate(selectedRecord.updated_at) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수정 이력 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" />
                  수정 이력
                </h4>
                {historyLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">이력 조회 중...</p>
                  </div>
                ) : modificationHistory.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden max-h-[200px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-semibold">수정일시</TableHead>
                          <TableHead className="text-xs font-semibold">필드</TableHead>
                          <TableHead className="text-xs font-semibold">이전 값</TableHead>
                          <TableHead className="text-xs font-semibold">변경 값</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modificationHistory.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs">{formatDate(h.modified_at)}</TableCell>
                            <TableCell className="text-xs font-medium">{getFieldLabel(h.field_name)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate" title={h.old_value || ''}>
                              {h.old_value || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-primary max-w-[100px] truncate" title={h.new_value || ''}>
                              {h.new_value || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">수정 이력이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
