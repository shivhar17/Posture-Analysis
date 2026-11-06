import React, { useState, useRef } from "react"
import { 
  Video, UploadCloud, AlertCircle, Loader2, Sparkles, 
  Clock, TrendingUp, PieChart as PieIcon, ShieldAlert, Dumbbell, Download, RefreshCw 
} from "lucide-react"
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell 
} from "recharts"
import { analyzeVideoFile, getReportDownloadUrl } from "../services/api"

const PIE_COLORS = ["#0d9488", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]

export default function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setErrorMsg(null)
      setAnalysisResult(null)
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setErrorMsg(null)
      setAnalysisResult(null)
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg("Please upload a video file first.")
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const data = await analyzeVideoFile(selectedFile)
      if (data.detected === false) {
        setErrorMsg(data.error || "No human subject detected in video.")
      } else {
        setAnalysisResult(data)
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to analyze video. Ensure the video codec is supported.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setVideoUrl(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleLoadSampleVideo = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/sample-video")
      const blob = await res.blob()
      const sampleFile = new File([blob], "sample_posture_video.mp4", { type: "video/mp4" })
      setSelectedFile(sampleFile)
      setVideoUrl("/api/sample-video")
    } catch (err) {
      setErrorMsg("Failed to load sample video.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-3">
          <Video className="w-3.5 h-3.5" />
          <span>Video Analysis Module</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Multi-Frame Dynamic Posture Tracking
        </h2>
        <p className="mt-2 text-slate-600 text-sm">
          Ingests MP4, MOV, or AVI video. Processes frames using OpenCV and MediaPipe to detect posture shifts, fatigue progression, and ergonomic stability over time.
        </p>
      </div>

      {analysisResult ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Video Summary Banner */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                    ID: {analysisResult.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                    Temporal Multi-Frame Analysis
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Dominant Posture: {analysisResult.dominant_posture}
                </h3>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  Overall Status: <span className="text-teal-700">{analysisResult.rating}</span>
                </p>
              </div>

              {/* Metrics Pill Grid */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Average Score</p>
                  <p className="text-3xl font-black text-teal-700">{analysisResult.average_score}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Duration</p>
                  <p className="text-2xl font-bold text-slate-900">{analysisResult.duration_sec}s</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Frames Sampled</p>
                  <p className="text-2xl font-bold text-slate-900">{analysisResult.total_frames_analyzed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Temporal Score Timeline Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Posture Assessment Score Timeline
                </h4>
                <p className="text-xs text-slate-500">
                  Track how your posture quality changes over video duration (score 0-100 across seconds)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysisResult.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time_str" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "12px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Posture Score"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ fill: "#0d9488", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trunk_angle"
                    name="Trunk Tilt (°)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Posture Distribution & Category Breakdown */}
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Pie Chart / Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-teal-600" />
                  Posture Time Distribution
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Percentage of frames spent in each posture state
                </p>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysisResult.category_breakdown}
                        dataKey="percentage"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {analysisResult.category_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          color: "#fff",
                          borderRadius: "12px",
                          border: "none",
                          fontSize: "12px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
                {analysisResult.category_breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-800">{item.category}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyframe Snapshots */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h4 className="font-extrabold text-slate-900 text-lg mb-1">
                Annotated Temporal Keyframes
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Visual skeleton overlay samples captured during video analysis
              </p>

              <div className="grid grid-cols-2 gap-3">
                {analysisResult.sample_frames?.map((frame, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950">
                    <img
                      src={frame.image_base64}
                      alt={`Keyframe at ${frame.time_str}`}
                      className="w-full h-36 object-contain"
                    />
                    <div className="p-2 bg-white flex items-center justify-between text-[11px] border-t border-slate-100">
                      <span className="font-bold text-slate-700">{frame.time_str}</span>
                      <span className="font-extrabold text-teal-700">Score: {frame.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Analyze Another Video</span>
            </button>

            {analysisResult.id && (
              <a
                href={getReportDownloadUrl(analysisResult.id)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Video PDF Report</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Quick Demo Video Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Quick Test: Built-in Multi-Posture Video
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                4-second test sequence transitioning from upright standing to slouching and forward bending.
              </p>
            </div>
            <button
              onClick={handleLoadSampleVideo}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
            >
              Load Demo Video
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all bg-white ${
              videoUrl
                ? "border-teal-400 bg-teal-50/10"
                : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileChange}
              className="hidden"
              id="video-file-upload"
            />

            {videoUrl ? (
              <div className="space-y-5">
                <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-h-72 object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-teal-600/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Multi-Frame Video Stream...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze Video Sequence</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="video-file-upload"
                className="cursor-pointer block space-y-4 py-8"
              >
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner border border-teal-100">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Click to upload or drag & drop video file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports MP4, MOV, AVI, WEBM (Standing, bending, lifting or desk work sequence)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Key Guidelines */}
          <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">Multi-Frame Sampling</p>
              <p>Frames are analyzed sequentially to prevent misclassifying transient movements.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">Dynamic Ergonomics</p>
              <p>Detects slouching development, lifting technique faults, and spinal fatigue.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">Instant Reports</p>
              <p>Download comprehensive PDF reports with full timeline graphs and recommendations.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
