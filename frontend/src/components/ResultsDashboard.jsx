import React from "react"
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, Download, RefreshCw, 
  Sparkles, Compass, ShieldAlert, Dumbbell, Award, ChevronRight 
} from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { getReportDownloadUrl } from "../services/api"

export default function ResultsDashboard({ result, onReset }) {
  if (!result) return null

  const {
    id,
    category,
    confidence,
    score,
    status,
    rating,
    mode,
    angles = {},
    alignments = {},
    concerns = [],
    recommendations = [],
    visibility_warning,
    annotated_image
  } = result

  const isGood = status === "Good"
  const isWarn = status === "Warning"

  const scoreColor = isGood ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-rose-600"
  const scoreBg = isGood ? "bg-emerald-50 border-emerald-200" : isWarn ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"

  // Prepare chart comparison data
  const comparisonData = [
    {
      metric: "CVA (Neck)",
      measured: angles.craniovertebral_angle || 55,
      normal: 55,
      unit: "°"
    },
    {
      metric: "Trunk Tilt",
      measured: angles.trunk_inclination || 4,
      normal: 6,
      unit: "°"
    },
    {
      metric: "Shoulder Tilt",
      measured: angles.shoulder_tilt || 1.5,
      normal: 2,
      unit: "°"
    },
    {
      metric: "Lateral Tilt",
      measured: angles.lateral_tilt || 1,
      normal: 2,
      unit: "°"
    }
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with Posture Category & Score */}
      <div className={`p-6 rounded-3xl border shadow-sm ${scoreBg}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                ID: {id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/90 border border-slate-200 text-slate-700">
                {mode || "Machine Learning Analysis"}
              </span>
              {confidence && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/90 border border-slate-200 text-teal-700">
                  {confidence}% Confidence
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isGood ? (
                <div className="p-2 bg-emerald-500 text-white rounded-2xl shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : isWarn ? (
                <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-2 bg-rose-500 text-white rounded-2xl shadow-sm">
                  <AlertOctagon className="w-8 h-8" />
                </div>
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {category}
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  {rating || "Posture Assessment Complete"}
                </p>
              </div>
            </div>
          </div>

          {/* Score Metric Card */}
          <div className="flex items-center gap-5 bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Posture Score
              </p>
              <div className="flex items-baseline justify-end gap-1">
                <span className={`text-4xl sm:text-5xl font-black tracking-tight ${scoreColor}`}>
                  {score}
                </span>
                <span className="text-base font-bold text-slate-400">/100</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-lg border-current relative">
              <Award className={`w-7 h-7 ${scoreColor}`} />
            </div>
          </div>
        </div>

        {/* Visibility Warning Alert if any */}
        {visibility_warning && (
          <div className="mt-4 p-3 bg-amber-100/80 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{visibility_warning}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Skeleton Visualization & Joint Angles */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Annotated Skeleton Image if available */}
        {annotated_image && (
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  MediaPipe Pose Skeleton
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  Annotated Overlay
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[460px]">
                <img
                  src={annotated_image}
                  alt="Annotated Pose Skeleton"
                  className="w-full h-auto object-contain max-h-[460px]"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-3">
              Green = Ideal alignment, Orange = Moderate fatigue, Red = Musculoskeletal strain
            </p>
          </div>
        )}

        {/* Quantitative Alignment Cards & Chart */}
        <div className={`${annotated_image ? "lg:col-span-7" : "lg:col-span-12"} space-y-5`}>
          
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Body Alignment Diagnostic
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(alignments).map(([key, item]) => {
                const itemGood = item.status === "Good"
                const itemWarn = item.status === "Warning"

                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          itemGood
                            ? "bg-emerald-100 text-emerald-800"
                            : itemWarn
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-900">
                        {item.angle}{item.unit}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Ref: {item.normal_range}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quantitative Angles Bar Chart */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-2">
              Measured vs. Ergonomic Baseline (Degrees)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Comparing your joint angle displacement against clinical reference guidelines.
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="measured" name="Measured Value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="normal" name="Ideal Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Ergonomic Concerns & Corrective Exercises */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Ergonomic Concerns */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Potential Ergonomic Concerns</h3>
              <p className="text-xs text-slate-500">Musculoskeletal stress factors detected</p>
            </div>
          </div>

          <div className="space-y-3">
            {concerns.map((c, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <p className="leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Personalized Corrective Actions</h3>
              <p className="text-xs text-slate-500">Targeted therapeutic stretches & ergonomics</p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100 hover:bg-teal-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    {rec.area}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{rec.purpose}</p>
                <p className="text-[11px] font-semibold text-teal-700 mt-1.5">
                  Protocol: {rec.duration}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Analyze Another Media</span>
        </button>

        {id && (
          <a
            href={getReportDownloadUrl(id)}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Report</span>
          </a>
        )}
      </div>
    </div>
  )
}
