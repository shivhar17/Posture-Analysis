import React from "react"
import { Camera, Video, ShieldCheck, Zap, Activity, Eye, FileText, ArrowRight } from "lucide-react"

export default function HeroSection({ onAnalyzeImage, onAnalyzeVideo }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/50 border-b border-slate-200">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
              Next-Gen Computer Vision & Machine Learning
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Understand Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Posture.</span><br />
              Improve Your <span className="text-teal-700">Health.</span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Clinical-grade posture analysis powered by MediaPipe Pose and Random Forest Machine Learning.
              Detect subtle musculoskeletal imbalances from photos and videos across <span className="font-semibold text-slate-800">standing, sitting, bending, and lifting</span> body positions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onAnalyzeImage}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Analyze Image</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
              </button>

              <button
                onClick={onAnalyzeVideo}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-teal-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Video className="w-5 h-5 text-teal-600" />
                <span>Analyze Video</span>
              </button>
            </div>

            {/* Metric pill tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">Pose Landmarks</p>
                <p className="text-lg font-extrabold text-slate-900">33 Points</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">Categories</p>
                <p className="text-lg font-extrabold text-teal-700">7 Postures</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">Scoring Engine</p>
                <p className="text-lg font-extrabold text-slate-900">0 - 100 RULA</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">Output Reports</p>
                <p className="text-lg font-extrabold text-teal-700">Instant PDF</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Graphic */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 p-5 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono text-slate-500 ml-2">posture_stream.live</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-teal-100 text-teal-800">
                  REAL-TIME CV
                </span>
              </div>

              {/* Graphical Body Silhouette Wireframe */}
              <div className="relative h-64 my-4 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                
                {/* SVG Skeleton Simulation */}
                <svg className="w-48 h-full" viewBox="0 0 200 280">
                  {/* Bone lines */}
                  <line x1="100" y1="45" x2="100" y2="75" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
                  <line x1="70" y1="85" x2="130" y2="85" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
                  <line x1="100" y1="85" x2="100" y2="160" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                  <line x1="75" y1="160" x2="125" y2="160" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Left Arm */}
                  <line x1="70" y1="85" x2="50" y2="130" stroke="#14b8a6" strokeWidth="3" />
                  <line x1="50" y1="130" x2="45" y2="175" stroke="#14b8a6" strokeWidth="3" />
                  {/* Right Arm */}
                  <line x1="130" y1="85" x2="150" y2="130" stroke="#14b8a6" strokeWidth="3" />
                  <line x1="150" y1="130" x2="155" y2="175" stroke="#14b8a6" strokeWidth="3" />
                  
                  {/* Legs */}
                  <line x1="75" y1="160" x2="70" y2="215" stroke="#14b8a6" strokeWidth="4" />
                  <line x1="70" y1="215" x2="68" y2="265" stroke="#14b8a6" strokeWidth="4" />
                  <line x1="125" y1="160" x2="130" y2="215" stroke="#14b8a6" strokeWidth="4" />
                  <line x1="130" y1="215" x2="132" y2="265" stroke="#14b8a6" strokeWidth="4" />
                  
                  {/* Glowing Landmark Points */}
                  <circle cx="100" cy="40" r="18" fill="none" stroke="#22c55e" strokeWidth="3" />
                  <circle cx="100" cy="40" r="6" fill="#22c55e" />
                  <circle cx="70" cy="85" r="5" fill="#22c55e" />
                  <circle cx="130" cy="85" r="5" fill="#22c55e" />
                  <circle cx="50" cy="130" r="4" fill="#38bdf8" />
                  <circle cx="150" cy="130" r="4" fill="#38bdf8" />
                  <circle cx="75" cy="160" r="5" fill="#22c55e" />
                  <circle cx="125" cy="160" r="5" fill="#22c55e" />
                  <circle cx="70" cy="215" r="5" fill="#22c55e" />
                  <circle cx="130" cy="215" r="5" fill="#22c55e" />
                  <circle cx="68" cy="265" r="4" fill="#38bdf8" />
                  <circle cx="132" cy="265" r="4" fill="#38bdf8" />
                </svg>

                {/* Real-time Angle Annotation Overlays */}
                <div className="absolute top-5 right-4 bg-slate-800/90 border border-slate-700 rounded-lg p-2 text-right">
                  <p className="text-[10px] text-slate-400 font-medium">CVA Angle</p>
                  <p className="text-xs font-bold text-emerald-400">56.2° (Normal)</p>
                </div>
                <div className="absolute bottom-6 left-4 bg-slate-800/90 border border-slate-700 rounded-lg p-2">
                  <p className="text-[10px] text-slate-400 font-medium">Spine Alignment</p>
                  <p className="text-xs font-bold text-teal-400">1.8° Vertical</p>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-700">Posture Score: 94 / 100</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Optimal Alignment
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
