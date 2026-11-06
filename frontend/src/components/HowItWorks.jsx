import React from "react"
import { UploadCloud, Scan, Compass, Award, ArrowRight } from "lucide-react"

const STEPS = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Upload & Preprocessing",
    desc: "Ingests JPG, PNG images or MP4, MOV videos. OpenCV scales, normalizes RGB channels, and adjusts illumination for robust landmark tracking."
  },
  {
    step: "02",
    icon: Scan,
    title: "MediaPipe 3D Pose Estimation",
    desc: "Detects 33 skeletal body landmarks in normalized and metric coordinates. Evaluates confidence thresholds to ensure full anatomical visibility."
  },
  {
    step: "03",
    icon: Compass,
    title: "Biomechanical Angle Extraction",
    desc: "Calculates Craniovertebral Angle (CVA), thoracic trunk inclination, shoulder girdle asymmetry, and hip-knee flexion vectors."
  },
  {
    step: "04",
    icon: Award,
    title: "ML Classification & RULA Scoring",
    desc: "A trained Random Forest model predicts the posture state with high precision, generating a 0-100 score, health concerns, and PDF reports."
  }
]

export default function HowItWorks() {
  return (
    <section className="py-14 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-teal-600 mb-2">
            System Pipeline
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How POSTURE AI Operates
          </h3>
          <p className="mt-2 text-slate-600 text-sm">
            From raw visual pixels to quantitative joint biomechanics and machine learning classification.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 font-mono">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-bold text-teal-700">
                  <span>Step {idx + 1} of 4</span>
                  {idx < 3 && <ArrowRight className="w-3.5 h-3.5 ml-1 hidden lg:block" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
