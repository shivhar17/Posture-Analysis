import React from "react"
import { CheckCircle2, AlertTriangle, AlertOctagon, ArrowUpRight } from "lucide-react"

const CATEGORIES = [
  {
    title: "Good Posture",
    status: "Optimal",
    color: "emerald",
    angleSummary: "CVA > 50°, Trunk < 10°, Shoulders Level (< 3°)",
    risk: "Minimal musculoskeletal strain. Efficient cardiovascular respiration and optimal disc load distribution.",
    correction: "Maintain regular movement micro-breaks every 45-60 minutes.",
    positions: "Standing / Sitting"
  },
  {
    title: "Slouching / Rounded Back",
    status: "Warning",
    color: "amber",
    angleSummary: "Trunk > 15°, Thoracic Kyphosis, CVA 35° - 45°",
    risk: "Compression of thoracic vertebrae, chronic scapular fatigue, decreased vital lung volume.",
    correction: "Pectoral doorway stretches, prone cobra, and scapular retractions.",
    positions: "Desk / Sitting / Relaxed"
  },
  {
    title: "Forward Head Posture",
    status: "Alert",
    color: "rose",
    angleSummary: "CVA < 45° (Tech Neck), Neck Flexion > 25°",
    risk: "Suboccipital compression, cervicogenic headaches, up to 300% increased cervical shear force.",
    correction: "Deep cervical flexor chin tucks and ergonomic display height elevation.",
    positions: "Screen Viewing / Driving"
  },
  {
    title: "Uneven Shoulder Alignment",
    status: "Warning",
    color: "amber",
    angleSummary: "Shoulder Tilt > 5.5° Horizontal Asymmetry",
    risk: "Unilateral levator scapulae spasm, asymmetrical trapezius recruitment, potential functional scoliosis.",
    correction: "Single-arm overhead stretch, trapezius trigger-point release, and balanced bag carrying.",
    positions: "Standing / Desk Work"
  },
  {
    title: "Left / Right Side Leaning",
    status: "Warning",
    color: "amber",
    angleSummary: "Lateral Trunk Tilt > 6.5° from Vertical",
    risk: "Asymmetric lumbar intervertebral disc wedging, unilateral quadratus lumborum hypertonicity.",
    correction: "Side planks, bilateral weight-bearing awareness, and pelvic level re-education.",
    positions: "Standing / Seated Resting"
  },
  {
    title: "Incorrect Forward Bending",
    status: "Alert",
    color: "rose",
    angleSummary: "Trunk Bend > 35° with Straight Knees (> 160°)",
    risk: "Hazardous lumbar flexion moment (> 3200 N shear), severe risk of posterior disc herniation.",
    correction: "Master the hip-hinge pattern, hamstring mobility, and bend at hips and knees.",
    positions: "Bending / Reaching"
  },
  {
    title: "Incorrect Lifting Posture",
    status: "Alert",
    color: "rose",
    angleSummary: "Spine Flexed with Insufficient Knee Hinge",
    risk: "Acute lumbosacral disc extrusion, excessive erector spinae eccentric loading under heavy weight.",
    correction: "Power squat lifting mechanics, hold objects close to body center of mass.",
    positions: "Lifting / Material Handling"
  }
]

export default function PostureCategories() {
  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">
            Clinical Classifications
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Supported Postural States & Health Impact
          </h3>
          <p className="mt-2 text-slate-600 text-sm">
            POSTURE AI analyzes standing, seated, bending, and lifting positions using biomechanical joint angle boundaries.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat, idx) => {
            const isGood = cat.color === "emerald"
            const isWarn = cat.color === "amber"

            return (
              <div
                key={idx}
                className="bg-slate-50/80 hover:bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                      {cat.positions}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isGood
                          ? "bg-emerald-100 text-emerald-800"
                          : isWarn
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isGood ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5" />
                      )}
                      {cat.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {cat.title}
                  </h4>

                  <div className="mt-2 text-xs font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    <span className="font-semibold text-slate-900">Angles: </span>
                    {cat.angleSummary}
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>
                      <strong className="text-slate-800">Biomechanical Risk:</strong> {cat.risk}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-teal-800 bg-teal-50/60 p-2.5 rounded-xl">
                  <p className="font-semibold flex items-center gap-1">
                    <span>Rx Focus:</span>
                  </p>
                  <p className="text-slate-700 mt-0.5">{cat.correction}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
