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
  status: 'queued' | 'processing' | 'complete' | 'failed';
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
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const result = await getJobResults(jobId);

        // Update progress callback
        if (onProgress) {
          onProgress(result.progress || 'Processing...', result.status);
        }

        // Check if completed
        if (result.status === 'complete') {
          clearInterval(interval);
          resolve(result);
        } else if (result.status === 'failed') {
          clearInterval(interval);
          reject(new Error(result.error || 'Pipeline failed'));
        }
      } catch (error) {
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
 * Get annotated images from completed job
 * Note: This is a helper - backend should return base64 images in results
 */
export async function getAnnotatedImages(jobId: string): Promise<ImageData> {
  // For now, return mock data structure
  // Backend will need to include base64 images in /results endpoint
  const result = await getJobResults(jobId);
  
  if (result.status !== 'complete') {
    throw new Error('Job not completed yet');
  }

  // TODO: Backend should include base64 images in response
  return {
    beforeImage: '', // Will be populated by backend
    afterImage: '',
    beforeImageAnnotated: '', // Annotated version
    afterImageAnnotated: ''
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
