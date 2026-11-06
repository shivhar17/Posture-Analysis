import React, { useState, useEffect } from "react"
import { 
  History, Camera, Video, Download, Eye, RefreshCw, 
  Calendar, CheckCircle2, AlertTriangle, AlertOctagon, Search 
} from "lucide-react"
import { fetchAnalysisHistory, getReportDownloadUrl } from "../services/api"

export default function HistoryPage({ onSelectAnalysis }) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAnalysisHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === "all" || item.input_type === filterType
    const matchesSearch = 
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Analysis History & Archived Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review past postural assessments, track score trajectories, and re-download official PDF records.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            All Analyses ({history.length})
          </button>
          <button
            onClick={() => setFilterType("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "image" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Images
          </button>
          <button
            onClick={() => setFilterType("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "video" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videos
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search posture or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* History Table / Cards */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading analysis records...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Posture Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't performed any image or video posture analyses yet. Upload an image or video to generate your first audit report.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Detected Posture</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistory.map((item) => {
                  const isGood = item.status === "Good"
                  const isWarn = item.status === "Warning"

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{item.created_at}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {item.input_type === "image" ? (
                            <>
                              <Camera className="w-3.5 h-3.5 text-teal-600" />
                              Image
                            </>
                          ) : (
                            <>
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                              Video
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{item.category}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.summary}</p>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-base font-black ${
                            isGood ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-rose-600"
                          }`}
                        >
                          {item.score}
                        </span>
                        <span className="text-slate-400 font-bold text-[10px]"> / 100</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isGood
                              ? "bg-emerald-100 text-emerald-800"
                              : isWarn
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isGood ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <AlertOctagon className="w-3 h-3" />
                          )}
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={getReportDownloadUrl(item.id)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedRecord.id}</span>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedRecord.category}</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">Date</p>
                <p className="font-bold text-slate-800">{selectedRecord.created_at}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">Posture Score</p>
                <p className="text-lg font-black text-teal-700">{selectedRecord.score} / 100</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">Assessment Summary:</p>
              <p>{selectedRecord.summary}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              <a
                href={getReportDownloadUrl(selectedRecord.id)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
