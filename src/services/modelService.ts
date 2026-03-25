import apiClient from '../config/axiosConfig';
import {
  ApiModelDetail,
  FetchAllModelsResponse,
  UpdateJsonUrlRequest,
  UpdateJsonUrlResponse,
  UpdateStatusRequest,
  UpdateStatusResponse,
} from '../types/api';

// ─────────────────────────────────────────────────────────────────────────────
// GET /model-details
// Returns all models with nested images + comments
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAllModelDetails(): Promise<ApiModelDetail[]> {
  const response = await apiClient.get<FetchAllModelsResponse>('api/model-details');
  debugger
  return response.data.model_details;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /update-status
// ─────────────────────────────────────────────────────────────────────────────
export async function updateModelStatus(
  payload: UpdateStatusRequest,
): Promise<UpdateStatusResponse> {
  const response = await apiClient.put<UpdateStatusResponse>(
    'api/update-status',
    payload,
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /update-json-url
// Uploads landmark JSON to S3 via backend and updates DB
// ─────────────────────────────────────────────────────────────────────────────
export async function updateLandmarkJson(
  payload: UpdateJsonUrlRequest,
): Promise<UpdateJsonUrlResponse> {
  const response = await apiClient.put<UpdateJsonUrlResponse>(
    'api/update-json-url',
    payload,
  );
  return response.data;
}
