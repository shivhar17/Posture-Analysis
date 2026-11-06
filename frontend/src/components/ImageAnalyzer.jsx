import React, { useState, useEffect, useRef } from "react"
import { 
  Camera, UploadCloud, AlertCircle, Loader2, Image as ImageIcon, 
  Sparkles, Check, RefreshCw 
} from "lucide-react"
import { analyzeImageFile, fetchSampleImages, getSampleImageUrl } from "../services/api"
import ResultsDashboard from "./ResultsDashboard"

export default function ImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  
  // Sample presets
  const [sampleImages, setSampleImages] = useState([])
  const [selectedSampleId, setSelectedSampleId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSampleImages().then(samples => {
      if (Array.isArray(samples)) setSampleImages(samples)
    })
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSelectedSampleId(null)
      setErrorMsg(null)
      setAnalysisResult(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      setSelectedSampleId(null)
      setErrorMsg(null)
      setAnalysisResult(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSelectSample = async (sample) => {
    try {
      setIsLoading(true)
      setErrorMsg(null)
      setSelectedSampleId(sample.id)
      
      const imageUrl = getSampleImageUrl(sample.id)
      setPreviewUrl(imageUrl)
      
      // Fetch sample as Blob to analyze
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const sampleFile = new File([blob], `${sample.id}.jpg`, { type: "image/jpeg" })
      setSelectedFile(sampleFile)
    } catch (err) {
      setErrorMsg("Failed to load sample image.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg("Please upload an image or choose a sample test card first.")
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const data = await analyzeImageFile(selectedFile)
      if (data.detected === false) {
        setErrorMsg(data.error || "No human subject detected in image.")
      } else {
        setAnalysisResult(data)
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to analyze image. Please ensure the backend server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    setSelectedSampleId(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Image Analysis Module</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Analyze Human Posture from Photographs
        </h2>
        <p className="mt-2 text-slate-600 text-sm">
          Detect body landmarks, quantify joint angles, and receive ergonomic scores across standing, sitting, bending, and lifting positions.
        </p>
      </div>

      {analysisResult ? (
        <ResultsDashboard result={analysisResult} onReset={handleReset} />
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Preset Samples Selector */}
          {sampleImages.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Quick Test: Built-in Clinical Presets
                </span>
                <span className="text-[11px] text-slate-500">1-Click Test</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sampleImages.map((s) => {
                  const isSelected = selectedSampleId === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSample(s)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-600 shadow-xs ring-2 ring-teal-500/20"
                          : "bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{s.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-teal-800 font-semibold">{s.category}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upload Drop Zone / Preview */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all bg-white ${
              previewUrl
                ? "border-teal-400 bg-teal-50/10"
                : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="image-file-upload"
            />

            {previewUrl ? (
              <div className="space-y-5">
                <div className="relative inline-block mx-auto rounded-2xl overflow-hidden shadow-lg border border-slate-200 max-h-96">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-96 w-auto object-contain mx-auto"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
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
                        <span>Estimating 3D Pose Landmarks...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze Posture Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="image-file-upload"
                className="cursor-pointer block space-y-4 py-8"
              >
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner border border-teal-100">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Click to upload or drag & drop photograph
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, JPEG, PNG, WEBP (Full or upper body view recommended)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Instructions Guide */}
          <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">1. Frame Visibility</p>
              <p>Keep the full torso, shoulders, and head visible for optimal Craniovertebral Angle measurement.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">2. Lighting & Angles</p>
              <p>Natural lighting from side or front enhances joint landmark confidence score.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">3. Any Position</p>
              <p>Supports standing, sitting at a desk, bending down, and lifting heavy loads.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
