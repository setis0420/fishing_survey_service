import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Ship, FileText } from 'lucide-react'
import VoyageInquiry from '@/pages/VoyageInquiry'
import AuctionEntry from '@/pages/AuctionEntry'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* 헤더 */}
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <h1 className="text-2xl font-bold">어선조업분석 플랫폼</h1>
            <p className="text-sm text-muted-foreground">어업 피해 조사를 위한 어선 항적 조회 시스템</p>
          </div>
        </header>

        {/* 네비게이션 */}
        <nav className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Ship className="h-4 w-4" />
                항적/어획 조회·수정
              </NavLink>
              <NavLink
                to="/auction"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <FileText className="h-4 w-4" />
                위판 정보 입력
              </NavLink>
            </div>
          </div>
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="mx-auto max-w-7xl p-4">
          <Routes>
            <Route path="/" element={<VoyageInquiry />} />
            <Route path="/auction" element={<AuctionEntry />} />
          </Routes>
        </main>

        {/* 푸터 */}
        <footer className="border-t bg-card mt-auto">
          <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm text-muted-foreground">
            어선조업분석 플랫폼 v1.0.0 | 데이터 형식: [MMSI]-[연도]-[항차]
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
