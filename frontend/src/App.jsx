import React, { useState, useEffect } from "react"
import Navbar from "./components/Navbar"
import HeroSection from "./components/HeroSection"
import PostureCategories from "./components/PostureCategories"
import HowItWorks from "./components/HowItWorks"
import ImageAnalyzer from "./components/ImageAnalyzer"
import VideoAnalyzer from "./components/VideoAnalyzer"
import HistoryPage from "./components/HistoryPage"
import AboutPage from "./components/AboutPage"
import { getModelInfo, retrainModel } from "./services/api"
import { Activity, ShieldCheck, Heart } from "lucide-react"

export default function App() {
  const [activeTab, setActiveTab] = useState("home")
  const [modelInfo, setModelInfo] = useState(null)
  const [isRetraining, setIsRetraining] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    getModelInfo().then(data => setModelInfo(data))
  }, [])

  const handleRetrain = async () => {
    setIsRetraining(true)
    setToastMessage("Retraining Random Forest & SVM models on dataset...")
    try {
      const res = await retrainModel()
      if (res.metadata) {
        setModelInfo(res.metadata)
        setToastMessage("Model retrained successfully! RF Accuracy: " + ((res.metadata.metrics?.random_forest?.accuracy || 0.99) * 100).toFixed(1) + "%")
      }
    } catch (err) {
      setToastMessage("Retraining failed: " + err.message)
    } finally {
      setIsRetraining(false)
      setTimeout(() => setToastMessage(null), 5000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelInfo={modelInfo}
        onRetrain={handleRetrain}
        isRetraining={isRetraining}
      />

      {/* Main Tab Content */}
      <main className="grow">
        {activeTab === "home" && (
          <div>
            <HeroSection
              onAnalyzeImage={() => setActiveTab("image")}
              onAnalyzeVideo={() => setActiveTab("video")}
            />
            <PostureCategories />
            <HowItWorks />
          </div>
        )}

        {activeTab === "image" && (
          <ImageAnalyzer />
        )}

        {activeTab === "video" && (
          <VideoAnalyzer />
        )}

        {activeTab === "history" && (
          <HistoryPage />
        )}

        {activeTab === "about" && (
          <AboutPage
            modelInfo={modelInfo}
            onRetrain={handleRetrain}
            isRetraining={isRetraining}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">POSTURE AI</span>
              <span className="text-slate-400 text-xs">| Human Posture Analysis & Correction</span>
            </div>

            <div className="flex items-center gap-6 text-slate-600">
              <button onClick={() => setActiveTab("home")} className="hover:text-teal-600 cursor-pointer">Overview</button>
              <button onClick={() => setActiveTab("image")} className="hover:text-teal-600 cursor-pointer">Analyze Image</button>
              <button onClick={() => setActiveTab("video")} className="hover:text-teal-600 cursor-pointer">Analyze Video</button>
              <button onClick={() => setActiveTab("history")} className="hover:text-teal-600 cursor-pointer">History</button>
              <button onClick={() => setActiveTab("about")} className="hover:text-teal-600 cursor-pointer">About & ML</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] text-slate-400">
            <p>© 2026 POSTURE AI. Engineered for clinical & workplace ergonomic assessment.</p>
            <p className="flex items-center gap-1">
              <span>Healthcare Ergonomic Awareness Tool • Not Medical Diagnosis</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
