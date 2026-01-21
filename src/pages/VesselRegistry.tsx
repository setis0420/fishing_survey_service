import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  Ship,
  Edit,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Ruler,
  Gauge,
  FileText,
  MapPin,
  Building,
  Calendar,
  Database,
  Image,
  MessageSquare,
  Paperclip,
  Upload,
  Trash2,
  Star,
  Download,
  Plus,
  X,
  Users,
  Clock,
} from 'lucide-react'
import {
  getVesselRegistry,
  getVesselRegistryDetail,
  updateVesselRegistry,
  getPorts,
  getBusinessTypes,
  getGroups,
  getVesselMemos,
  createVesselMemo,
  updateVesselMemo,
  deleteVesselMemo,
  getVesselPhotos,
  uploadVesselPhoto,
  deleteVesselPhoto,
  setPrimaryPhoto,
  getPhotoUrl,
  getVesselFiles,
  uploadVesselFile,
  deleteVesselFile,
  getFileDownloadUrl,
  type VesselRegistry,
  type VesselRegistryUpdate,
  type VesselMemo,
  type VesselPhoto,
  type VesselFile,
} from '@/lib/api'

// VesselRegistry 페이지 컴포넌트
export default function VesselRegistryPage() {
  const [vessels, setVessels] = useState<VesselRegistry[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselRegistry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [portFilter, setPortFilter] = useState('')
  const [businessTypeFilter, setBusinessTypeFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 15

  // 필터 옵션
  const [ports, setPorts] = useState<{ port: string; count: number }[]>([])
  const [businessTypes, setBusinessTypes] = useState<{ business_type: string; count: number }[]>([])
  const [groups, setGroups] = useState<{ group_name: string; count: number }[]>([])

  // 수정 폼
  const [editForm, setEditForm] = useState<VesselRegistryUpdate>({})

  // 메모, 사진, 파일
  const [memos, setMemos] = useState<VesselMemo[]>([])
  const [photos, setPhotos] = useState<VesselPhoto[]>([])
  const [files, setFiles] = useState<VesselFile[]>([])
  const [newMemo, setNewMemo] = useState('')
  const [editingMemo, setEditingMemo] = useState<{ id: number; content: string } | null>(null)
  const [fileDescription, setFileDescription] = useState('')
  const [photoDragActive, setPhotoDragActive] = useState(false)
  const [fileDragActive, setFileDragActive] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const loadFilterOptions = () => {
    getPorts().then(res => setPorts(res.data))
    getBusinessTypes().then(res => setBusinessTypes(res.data))
    getGroups().then(res => setGroups(res.data))
  }

  useEffect(() => {
    // 필터 옵션 로드
    loadFilterOptions()
    // 초기 데이터 로드
    loadVessels()
  }, [])

  const loadVessels = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getVesselRegistry({
        search: searchTerm || undefined,
        port: portFilter || undefined,
        business_type: businessTypeFilter || undefined,
        group_name: groupFilter || undefined,
        page,
        page_size: pageSize,
      })
      setVessels(res.data)
      setTotalPages(res.total_pages)
      setTotalCount(res.total)
      setCurrentPage(page)
    } catch (error) {
      console.error('조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadVessels(1)
  }

  const handlePageChange = (page: number) => {
    loadVessels(page)
  }

  const loadVesselDetails = async (vesselId: number) => {
    const [memosRes, photosRes, filesRes] = await Promise.all([
      getVesselMemos(vesselId),
      getVesselPhotos(vesselId),
      getVesselFiles(vesselId),
    ])
    setMemos(memosRes.data)
    setPhotos(photosRes.data)
    setFiles(filesRes.data)
  }

  const openDetailDialog = async (vessel: VesselRegistry) => {
    setLoading(true)
    try {
      const res = await getVesselRegistryDetail(vessel.id)
      setSelectedVessel(res.data)
      await loadVesselDetails(vessel.id)
      setDetailDialogOpen(true)
    } catch (error) {
      console.error('상세 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (vessel: VesselRegistry) => {
    setSelectedVessel(vessel)
    setEditForm({
      vessel_name: vessel.vessel_name,
      tonnage: vessel.tonnage ?? undefined,
      length: vessel.length ?? undefined,
      engine_type: vessel.engine_type ?? undefined,
      hull_material: vessel.hull_material ?? undefined,
      port: vessel.port ?? undefined,
      business_type: vessel.business_type ?? undefined,
      mmsi: vessel.mmsi ?? undefined,
      group_name: vessel.group_name ?? undefined,
      fishing_hours: vessel.fishing_hours ?? undefined,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedVessel) return
    setLoading(true)
    try {
      await updateVesselRegistry(selectedVessel.id, editForm)
      setEditDialogOpen(false)
      loadVessels(currentPage)
      // 그룹 필터 옵션 새로고침
      loadFilterOptions()
    } catch (error) {
      console.error('수정 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 메모 관련 핸들러
  const handleAddMemo = async () => {
    if (!selectedVessel || !newMemo.trim()) return
    try {
      await createVesselMemo(selectedVessel.id, newMemo)
      setNewMemo('')
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('메모 추가 실패:', error)
    }
  }

  const handleUpdateMemo = async () => {
    if (!selectedVessel || !editingMemo) return
    try {
      await updateVesselMemo(selectedVessel.id, editingMemo.id, editingMemo.content)
      setEditingMemo(null)
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('메모 수정 실패:', error)
    }
  }

  const handleDeleteMemo = async (memoId: number) => {
    if (!selectedVessel || !confirm('메모를 삭제하시겠습니까?')) return
    try {
      await deleteVesselMemo(selectedVessel.id, memoId)
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('메모 삭제 실패:', error)
    }
  }

  // 사진 관련 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedVessel) return
    await uploadPhotos(Array.from(files))
    e.target.value = ''
  }

  const uploadPhotos = async (files: File[]) => {
    if (!selectedVessel) return
    setUploadingPhoto(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // 이미지 파일만 허용
        if (!file.type.startsWith('image/')) continue
        await uploadVesselPhoto(selectedVessel.id, file, photos.length === 0 && i === 0)
      }
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('사진 업로드 실패:', error)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhotoDragActive(true)
  }

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhotoDragActive(false)
  }

  const handlePhotoDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhotoDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      await uploadPhotos(files)
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!selectedVessel || !confirm('사진을 삭제하시겠습니까?')) return
    try {
      await deleteVesselPhoto(selectedVessel.id, photoId)
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('사진 삭제 실패:', error)
    }
  }

  const handleSetPrimaryPhoto = async (photoId: number) => {
    if (!selectedVessel) return
    try {
      await setPrimaryPhoto(selectedVessel.id, photoId)
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('대표 사진 설정 실패:', error)
    }
  }

  // 파일 관련 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedVessel) return
    await uploadFiles(Array.from(files))
    e.target.value = ''
  }

  const uploadFiles = async (files: File[]) => {
    if (!selectedVessel) return
    setUploadingFile(true)
    try {
      for (const file of files) {
        await uploadVesselFile(selectedVessel.id, file, fileDescription)
      }
      setFileDescription('')
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFileDragActive(true)
  }

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFileDragActive(false)
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFileDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!selectedVessel || !confirm('파일을 삭제하시겠습니까?')) return
    try {
      await deleteVesselFile(selectedVessel.id, fileId)
      await loadVesselDetails(selectedVessel.id)
    } catch (error) {
      console.error('파일 삭제 실패:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">어선 정보 조회·수정</h2>
          <p className="text-sm text-muted-foreground">전국어선정보를 조회하고 수정합니다</p>
        </div>
      </div>

      {/* 검색 및 필터 카드 */}
      <Card className="card-hover shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* 검색 */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="선명, MMSI, 등록번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* 선적항 필터 */}
            <Select value={portFilter} onValueChange={setPortFilter}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="선적항" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 선적항</SelectItem>
                {ports.slice(0, 20).map((p) => (
                  <SelectItem key={p.port} value={p.port}>
                    {p.port.slice(0, 20)} ({p.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 업종 필터 */}
            <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="업종" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 업종</SelectItem>
                {businessTypes.slice(0, 20).map((bt) => (
                  <SelectItem key={bt.business_type} value={bt.business_type}>
                    {bt.business_type} ({bt.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 그룹 필터 */}
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[180px]">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="그룹" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 그룹</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.group_name} value={g.group_name}>
                    {g.group_name} ({g.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 테이블 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">어선 목록</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              총 {totalCount.toLocaleString()}척
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs w-[140px]">선명</TableHead>
                  <TableHead className="font-semibold text-xs">등록번호</TableHead>
                  <TableHead className="font-semibold text-xs">MMSI</TableHead>
                  <TableHead className="font-semibold text-xs text-right">톤수</TableHead>
                  <TableHead className="font-semibold text-xs text-right">길이(m)</TableHead>
                  <TableHead className="font-semibold text-xs">선적항</TableHead>
                  <TableHead className="font-semibold text-xs">업종</TableHead>
                  <TableHead className="font-semibold text-xs">그룹</TableHead>
                  <TableHead className="font-semibold text-xs text-right">조업시간</TableHead>
                  <TableHead className="font-semibold text-xs text-center">사진</TableHead>
                  <TableHead className="font-semibold text-xs text-center">파일</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((vessel) => (
                  <TableRow key={vessel.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openDetailDialog(vessel)}>
                    <TableCell className="font-medium">{vessel.vessel_name}</TableCell>
                    <TableCell className="font-mono text-xs">{vessel.registration_no || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{vessel.mmsi || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{vessel.tonnage?.toFixed(2) || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{vessel.length?.toFixed(1) || '-'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">{vessel.port || '-'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{vessel.business_type || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {vessel.group_name ? (
                        <div className="flex flex-wrap gap-1">
                          {vessel.group_name.split(',').map((g, idx) => {
                            const groupName = g.trim()
                            if (!groupName) return null
                            return (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]"
                              >
                                {groupName}
                              </span>
                            )
                          })}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vessel.fishing_hours ? `${vessel.fishing_hours.toFixed(1)}h` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {vessel.photo_count ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <Image className="h-3 w-3" />
                          {vessel.photo_count}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {vessel.file_count ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <Paperclip className="h-3 w-3" />
                          {vessel.file_count}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(vessel)
                        }}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {vessels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                      <Ship className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">검색 결과가 없습니다</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 조회 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              {selectedVessel?.vessel_name} 상세 정보
            </DialogTitle>
            <DialogDescription className="font-mono">
              {selectedVessel?.registration_no}
            </DialogDescription>
          </DialogHeader>

          {selectedVessel && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" className="gap-2">
                  <Anchor className="h-4 w-4" />
                  기본정보
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-2">
                  <Image className="h-4 w-4" />
                  사진 ({photos.length})
                </TabsTrigger>
                <TabsTrigger value="memos" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  메모 ({memos.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  파일 ({files.length})
                </TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="info" className="space-y-4 mt-4">
                {/* 기본 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <Anchor className="h-4 w-4 text-primary" />
                    기본 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">선명</Label>
                      <p className="font-medium">{selectedVessel.vessel_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">등록번호</Label>
                      <p className="font-mono text-sm">{selectedVessel.registration_no || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">MMSI</Label>
                      <p className="font-mono">{selectedVessel.mmsi || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">건조일</Label>
                      <p>{selectedVessel.build_date || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">그룹</Label>
                      {selectedVessel.group_name ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVessel.group_name.split(',').map((g, idx) => {
                            const groupName = g.trim()
                            if (!groupName) return null
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                              >
                                <Users className="h-3 w-3" />
                                {groupName}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">조업시간</Label>
                      <p className="font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {selectedVessel.fishing_hours ? `${selectedVessel.fishing_hours.toFixed(1)} 시간` : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 규격 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-primary" />
                    규격 정보
                  </h4>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">톤수</Label>
                      <p className="font-medium">{selectedVessel.tonnage?.toFixed(2) || '-'} 톤</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">길이</Label>
                      <p className="font-medium">{selectedVessel.length?.toFixed(1) || '-'} m</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">선질</Label>
                      <p>{selectedVessel.hull_material || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 엔진 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4 text-primary" />
                    엔진 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">엔진종류</Label>
                      <p>{selectedVessel.engine_type || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">엔진갯수</Label>
                      <p>{selectedVessel.engine_count || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">출력 (PS)</Label>
                      <p className="font-mono">{selectedVessel.engine_power_ps || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">출력 (KW)</Label>
                      <p className="font-mono">{selectedVessel.engine_power_kw || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 등록 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    등록 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">선적항</Label>
                      <p>{selectedVessel.port || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">업종</Label>
                      <p>{selectedVessel.business_type || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 허가 정보 */}
                {(selectedVessel.license_local || selectedVessel.license_province) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      허가 정보
                    </h4>
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      {selectedVessel.license_local && (
                        <div>
                          <Label className="text-xs text-muted-foreground">시군구 허가</Label>
                          <p className="text-sm">{selectedVessel.license_local}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedVessel.license_start_local} ~ {selectedVessel.license_end_local}
                          </p>
                        </div>
                      )}
                      {selectedVessel.license_province && (
                        <div>
                          <Label className="text-xs text-muted-foreground">시도 허가</Label>
                          <p className="text-sm">{selectedVessel.license_province}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedVessel.license_start_province} ~ {selectedVessel.license_end_province}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 사진 탭 */}
              <TabsContent value="photos" className="mt-4">
                <div className="space-y-4">
                  {/* 사진 업로드 드래그 앤 드롭 영역 */}
                  <label
                    className={`cursor-pointer block border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      photoDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                    } ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragOver={handlePhotoDragOver}
                    onDragLeave={handlePhotoDragLeave}
                    onDrop={handlePhotoDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {uploadingPhoto ? (
                        <>
                          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground">업로드 중...</p>
                        </>
                      ) : (
                        <>
                          <div className={`p-3 rounded-full ${photoDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Image className={`h-6 w-6 ${photoDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {photoDragActive ? '여기에 놓으세요!' : '사진을 드래그하거나 클릭하여 업로드'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, GIF, WEBP 지원 · 여러 파일 선택 가능
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>

                  {/* 사진 목록 */}
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border">
                          <img
                            src={getPhotoUrl(photo.filename)}
                            alt={photo.original_name}
                            className="w-full h-40 object-cover"
                          />
                          {photo.is_primary === 1 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              대표
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {photo.is_primary !== 1 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetPrimaryPhoto(photo.id)}
                                className="gap-1"
                              >
                                <Star className="h-3 w-3" />
                                대표
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              삭제
                            </Button>
                          </div>
                          <div className="p-2 bg-muted/50">
                            <p className="text-xs truncate">{photo.original_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>등록된 사진이 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 메모 탭 */}
              <TabsContent value="memos" className="mt-4">
                <div className="space-y-4">
                  {/* 메모 추가 */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="새 메모를 입력하세요..."
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddMemo} disabled={!newMemo.trim()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      메모 추가
                    </Button>
                  </div>

                  {/* 메모 목록 */}
                  {memos.length > 0 ? (
                    <div className="space-y-3">
                      {memos.map((memo) => (
                        <div key={memo.id} className="p-4 bg-muted/30 rounded-lg">
                          {editingMemo?.id === memo.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingMemo.content}
                                onChange={(e) => setEditingMemo({ ...editingMemo, content: e.target.value })}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleUpdateMemo}>저장</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMemo(null)}>취소</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap">{memo.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(memo.created_at).toLocaleString('ko-KR')}
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingMemo({ id: memo.id, content: memo.content })}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteMemo(memo.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>등록된 메모가 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 파일 탭 */}
              <TabsContent value="files" className="mt-4">
                <div className="space-y-4">
                  {/* 파일 설명 입력 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="파일 설명 입력 (업로드할 파일에 적용됨)"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* 파일 업로드 드래그 앤 드롭 영역 */}
                  <label
                    className={`cursor-pointer block border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      fileDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                    } ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={handleFileDrop}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {uploadingFile ? (
                        <>
                          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground">업로드 중...</p>
                        </>
                      ) : (
                        <>
                          <div className={`p-3 rounded-full ${fileDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Paperclip className={`h-6 w-6 ${fileDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {fileDragActive ? '여기에 놓으세요!' : '파일을 드래그하거나 클릭하여 업로드'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              모든 파일 형식 지원 · 여러 파일 선택 가능
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>

                  {/* 파일 목록 */}
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-muted rounded-lg shrink-0">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{file.original_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <a
                                href={getFileDownloadUrl(file.filename)}
                                download={file.original_name}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFile(file.id)}
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {file.description && (
                            <div className="mt-2 pl-11">
                              <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                                {file.description}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>등록된 파일이 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              닫기
            </Button>
            <Button
              onClick={() => {
                setDetailDialogOpen(false)
                if (selectedVessel) openEditDialog(selectedVessel)
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              어선 정보 수정
            </DialogTitle>
            <DialogDescription>{selectedVessel?.registration_no}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vessel_name">선명</Label>
              <Input
                id="vessel_name"
                value={editForm.vessel_name || ''}
                onChange={(e) => setEditForm({ ...editForm, vessel_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tonnage">톤수</Label>
                <Input
                  id="tonnage"
                  type="number"
                  step="0.01"
                  value={editForm.tonnage || ''}
                  onChange={(e) => setEditForm({ ...editForm, tonnage: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="length">길이 (m)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={editForm.length || ''}
                  onChange={(e) => setEditForm({ ...editForm, length: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="engine_type">엔진종류</Label>
              <Input
                id="engine_type"
                value={editForm.engine_type || ''}
                onChange={(e) => setEditForm({ ...editForm, engine_type: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hull_material">선질</Label>
              <Input
                id="hull_material"
                value={editForm.hull_material || ''}
                onChange={(e) => setEditForm({ ...editForm, hull_material: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="port">선적항</Label>
              <Input
                id="port"
                value={editForm.port || ''}
                onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="business_type">업종</Label>
              <Input
                id="business_type"
                value={editForm.business_type || ''}
                onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mmsi">MMSI</Label>
              <Input
                id="mmsi"
                value={editForm.mmsi || ''}
                onChange={(e) => setEditForm({ ...editForm, mmsi: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="group_name">그룹 (여러 개 선택 가능)</Label>
              {/* 현재 선택된 그룹 태그 표시 */}
              {editForm.group_name && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {editForm.group_name.split(',').map((g, idx) => {
                    const groupName = g.trim()
                    if (!groupName) return null
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {groupName}
                        <button
                          type="button"
                          onClick={() => {
                            const currentGroups = editForm.group_name?.split(',').map(s => s.trim()).filter(Boolean) || []
                            const newGroups = currentGroups.filter((_, i) => i !== idx)
                            setEditForm({ ...editForm, group_name: newGroups.join(', ') || undefined })
                          }}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              {/* 기존 그룹 선택 드롭다운 */}
              <Select
                value=""
                onValueChange={(value) => {
                  if (!value) return
                  const currentGroups = editForm.group_name?.split(',').map(s => s.trim()).filter(Boolean) || []
                  if (!currentGroups.includes(value)) {
                    const newGroups = [...currentGroups, value]
                    setEditForm({ ...editForm, group_name: newGroups.join(', ') })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기존 그룹에서 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.group_name} value={g.group_name}>
                      {g.group_name} ({g.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 새 그룹 입력 */}
              <div className="flex gap-2">
                <Input
                  id="new_group_input"
                  placeholder="새 그룹명 직접 입력..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.currentTarget
                      const newGroup = input.value.trim()
                      if (newGroup) {
                        const currentGroups = editForm.group_name?.split(',').map(s => s.trim()).filter(Boolean) || []
                        if (!currentGroups.includes(newGroup)) {
                          const newGroups = [...currentGroups, newGroup]
                          setEditForm({ ...editForm, group_name: newGroups.join(', ') })
                        }
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('new_group_input') as HTMLInputElement
                    const newGroup = input?.value.trim()
                    if (newGroup) {
                      const currentGroups = editForm.group_name?.split(',').map(s => s.trim()).filter(Boolean) || []
                      if (!currentGroups.includes(newGroup)) {
                        const newGroups = [...currentGroups, newGroup]
                        setEditForm({ ...editForm, group_name: newGroups.join(', ') })
                      }
                      input.value = ''
                    }
                  }}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter 키 또는 + 버튼으로 새 그룹 추가
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fishing_hours">조업시간 (시간)</Label>
              <Input
                id="fishing_hours"
                type="number"
                step="0.1"
                placeholder="예: 120.5"
                value={editForm.fishing_hours || ''}
                onChange={(e) => setEditForm({ ...editForm, fishing_hours: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading} className="gap-2">
              <Edit className="h-4 w-4" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
