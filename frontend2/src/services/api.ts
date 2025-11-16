/**
 * F1 Change Detection API Service
 * Connects to FastAPI backend running on ngrok
 */

const API_BASE_URL = 'https://giovanna-unpredatory-ronin.ngrok-free.dev';

export interface PipelineResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobResult {
  job_id: string;
  status: 'queued' | 'processing' | 'complete' | 'completed' | 'failed';
  progress?: string;
  results?: {
    job_id: string;
    num_changes: number;
    classified_changes_url?: string;
    changes: Array<{
      id: number;
      bbox: number[];
      part: string;
      confidence: number;
    }>;
  };
  image_urls?: {
    baseline: string;
    current: string;
    combined: string;
  };
  error?: string;
}

export interface ImageData {
  beforeImage: string; // base64
  afterImage: string; // base64
  beforeImageAnnotated?: string; // base64
  afterImageAnnotated?: string; // base64
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true' // Skip ngrok warning page
      }
    });
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Start full pipeline with two images
 */
export async function startPipeline(
  baselineFile: File,
  currentFile: File
): Promise<PipelineResponse> {
  const formData = new FormData();
  formData.append('baseline', baselineFile);
  formData.append('current', currentFile);

  const response = await fetch(`${API_BASE_URL}/pipeline`, {
    method: 'POST',
    body: formData,
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  if (!response.ok) {
    throw new Error(`Pipeline failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get job status and results
 */
export async function getJobResults(jobId: string): Promise<JobResult> {
  const response = await fetch(`${API_BASE_URL}/results/${jobId}`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll job until completion or failure
 * @param jobId Job ID to poll
 * @param onProgress Callback for progress updates
 * @param pollInterval Polling interval in ms (default: 2000)
 */
export async function pollJobUntilComplete(
  jobId: string,
  onProgress?: (progress: string, status: string) => void,
  pollInterval: number = 2000
): Promise<JobResult> {
  console.log(`🔄 Starting polling for job_id: ${jobId}`);
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const result = await getJobResults(jobId);
        console.log(`📊 Poll response - Status: ${result.status}, Progress: ${result.progress || 'N/A'}`);

        // Update progress callback
        if (onProgress) {
          onProgress(result.progress || 'Processing...', result.status);
        }

        // Check if completed (backend returns "completed" not "complete")
        if (result.status === 'complete' || result.status === 'completed') {
          console.log(`✅ Pipeline COMPLETED for job_id: ${jobId}`);
          console.log(`📦 Results:`, result.results);
          console.log(`🖼️ Image URLs:`, result.image_urls);
          clearInterval(interval);
          resolve(result);
        } else if (result.status === 'failed') {
          console.error(`❌ Pipeline FAILED for job_id: ${jobId}`, result.error);
          clearInterval(interval);
          reject(new Error(result.error || 'Pipeline failed'));
        }
      } catch (error) {
        console.error(`⚠️ Polling error for job_id: ${jobId}`, error);
        clearInterval(interval);
        reject(error);
      }
    }, pollInterval);
  });
}

/**
 * Simplified polling function for frontend
 */
export async function pollResults(
  jobId: string,
  onProgress?: (progress: string) => void
): Promise<JobResult> {
  return pollJobUntilComplete(jobId, (progress, _status) => {
    if (onProgress) {
      onProgress(progress);
    }
  });
}

/**
 * Alias for startPipeline (used by UploadAnalyzePage)
 */
export async function uploadPipeline(
  baselineFile: File,
  currentFile: File
): Promise<PipelineResponse> {
  return startPipeline(baselineFile, currentFile);
}

/**
 * Get annotated image as blob URL
 */
export async function getAnnotatedImage(
  jobId: string,
  imageType: 'baseline' | 'current' | 'combined'
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/images/${jobId}/${imageType}`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get ${imageType} image: ${response.statusText}`);
  }

  // Convert response to blob and create object URL
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get all three annotated images from completed job
 */
export async function getAnnotatedImages(jobId: string): Promise<ImageData> {
  const result = await getJobResults(jobId);
  
  if (result.status !== 'complete' && result.status !== 'completed') {
    throw new Error('Job not completed yet');
  }

  // Fetch all three images in parallel
  const [baselineUrl, currentUrl] = await Promise.all([
    getAnnotatedImage(jobId, 'baseline'),
    getAnnotatedImage(jobId, 'current')
  ]);

  return {
    beforeImage: baselineUrl,
    afterImage: currentUrl,
    beforeImageAnnotated: baselineUrl,
    afterImageAnnotated: currentUrl
  };
}

/**
 * Convert File to base64 for preview
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
