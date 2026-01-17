import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Ship, FileText, Anchor, Waves, Database } from 'lucide-react'
import VoyageInquiry from '@/pages/VoyageInquiry'
import AuctionEntry from '@/pages/AuctionEntry'
import VesselRegistry from '@/pages/VesselRegistry'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* 헤더 */}
        <header className="gradient-ocean text-white shadow-lg">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                <Anchor className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">어선조업분석 플랫폼</h1>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <Waves className="h-3 w-3" />
                  어업 피해 조사를 위한 어선 항적 조회 시스템
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 네비게이션 */}
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex gap-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-4 border-b-3 font-medium transition-all ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                <Ship className="h-5 w-5" />
                <span>항적/어획 조회·수정</span>
              </NavLink>
              <NavLink
                to="/auction"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-4 border-b-3 font-medium transition-all ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                <FileText className="h-5 w-5" />
                <span>위판 정보 입력</span>
              </NavLink>
              <NavLink
                to="/vessel-registry"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-4 border-b-3 font-medium transition-all ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                <Database className="h-5 w-5" />
                <span>어선 정보 관리</span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-6">
          <Routes>
            <Route path="/" element={<VoyageInquiry />} />
            <Route path="/auction" element={<AuctionEntry />} />
            <Route path="/vessel-registry" element={<VesselRegistry />} />
          </Routes>
        </main>

        {/* 푸터 */}
        <footer className="bg-white border-t mt-auto">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4" />
                <span>어선조업분석 플랫폼 v1.0.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  데이터 형식: [MMSI]-[연도]-[항차]
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
