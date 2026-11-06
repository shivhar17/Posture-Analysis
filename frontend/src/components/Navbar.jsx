import React from "react"
import { Activity, Camera, Video, History, Info, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"

export default function Navbar({ activeTab, setActiveTab, modelInfo, onRetrain, isRetraining }) {
  const isMl = modelInfo?.status === "trained" || modelInfo?.metrics

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">POSTURE</span>
                <span className="font-black text-xl tracking-tight text-teal-600">AI</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold -mt-1 hidden sm:block">
                Posture Analysis & Correction
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "home"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "image"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Camera className="w-4 h-4" />
              Analyze Image
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "video"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-4 h-4" />
              Analyze Video
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "about"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Info className="w-4 h-4" />
              About & ML
            </button>
          </nav>

          {/* Model Status Badge */}
          <div className="flex items-center gap-2">
            {isMl ? (
              <div 
                title="Active Model: Random Forest Classifier trained with participant split"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">ML Active:</span> Random Forest
                {modelInfo?.metrics?.random_forest?.accuracy && (
                  <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded-md text-[10px]">
                    {(modelInfo.metrics.random_forest.accuracy * 100).toFixed(1)}% Acc
                  </span>
                )}
              </div>
            ) : (
              <div 
                title="Biomechanical rule-based ergonomic baseline"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>DEMO MODE</span>
              </div>
            )}

            <button
              onClick={onRetrain}
              disabled={isRetraining}
              title="Retrain and benchmark ML model"
              className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetraining ? "animate-spin text-teal-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab("home")}
            className={`py-1 ${activeTab === "home" ? "text-teal-600 font-bold" : "text-slate-600"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`py-1 ${activeTab === "image" ? "text-teal-600 font-bold" : "text-slate-600"}`}
          >
            Image
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`py-1 ${activeTab === "video" ? "text-teal-600 font-bold" : "text-slate-600"}`}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-1 ${activeTab === "history" ? "text-teal-600 font-bold" : "text-slate-600"}`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`py-1 ${activeTab === "about" ? "text-teal-600 font-bold" : "text-slate-600"}`}
          >
            About
          </button>
        </div>
      </div>
    </header>
  )
}
