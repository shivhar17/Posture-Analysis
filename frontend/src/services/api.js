const BASE_URL = import.meta.env.VITE_API_URL || ""

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`)
    return await res.json()
  } catch (err) {
    console.error("Health check error:", err)
    return { status: "offline", error: err.message }
  }
}

export async function getModelInfo() {
  try {
    const res = await fetch(`${BASE_URL}/api/model-info`)
    return await res.json()
  } catch (err) {
    console.error("Model info error:", err)
    return { status: "error", error: err.message }
  }
}

export async function retrainModel() {
  const res = await fetch(`${BASE_URL}/api/train`, {
    method: "POST"
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Training failed with status ${res.status}`)
  }
  return await res.json()
}

export async function analyzeImageFile(file) {
  const formData = new FormData()
  formData.append("file", file)
  
  const res = await fetch(`${BASE_URL}/api/analyze-image`, {
    method: "POST",
    body: formData
  })
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Image analysis failed (status ${res.status})`)
  }
  
  return await res.json()
}

export async function analyzeVideoFile(file) {
  const formData = new FormData()
  formData.append("file", file)
  
  const res = await fetch(`${BASE_URL}/api/analyze-video`, {
    method: "POST",
    body: formData
  })
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Video analysis failed (status ${res.status})`)
  }
  
  return await res.json()
}

export async function fetchAnalysisHistory() {
  const res = await fetch(`${BASE_URL}/api/analysis-history`)
  if (!res.ok) {
    throw new Error(`Failed to load history (status ${res.status})`)
  }
  return await res.json()
}

export async function fetchSampleImages() {
  try {
    const res = await fetch(`${BASE_URL}/api/sample-images`)
    return await res.json()
  } catch (err) {
    console.error("Failed to load samples:", err)
    return []
  }
}

export function getSampleImageUrl(sampleId) {
  return `${BASE_URL}/api/sample-image/${sampleId}`
}

export function getReportDownloadUrl(reportId) {
  return `${BASE_URL}/api/analysis-report/${reportId}`
}
