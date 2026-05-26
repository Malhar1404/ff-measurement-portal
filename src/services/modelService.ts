import apiClient from '../config/axiosConfig';
import {
  AddCommentRequest,
  AddCommentResponse,
  ApiModelDetail,
  FetchAllModelsResponse,
  UpdateJsonUrlRequest,
  UpdateJsonUrlResponse,
  UpdateStatusRequest,
  UpdateStatusResponse,
} from '../types/api';

// Backend API wrappers. Keep the old static helpers commented out below for quick fallback.

export async function fetchAllModelDetails(): Promise<ApiModelDetail[]> {
  const response = await apiClient.get<FetchAllModelsResponse>('api/model-details');
  return response.data.model_details;
}

export async function updateModelStatus(
  payload: UpdateStatusRequest,
): Promise<UpdateStatusResponse> {
  const response = await apiClient.put<UpdateStatusResponse>(
    'api/update-status',
    payload,
  );
  return response.data;
}

export async function getModelStatus(modelId: string) {
  const response = await apiClient.get<UpdateStatusResponse>(
    `api/model-status/${modelId}`,
  );
  return response.data;
}

export async function updateLandmarkJson(
  payload: UpdateJsonUrlRequest,
): Promise<UpdateJsonUrlResponse> {
  const response = await apiClient.put<UpdateJsonUrlResponse>(
    'api/update-json-url',
    payload,
  );
  return response.data;
}

export async function addComment(payload: AddCommentRequest): Promise<AddCommentResponse> {
  const response = await apiClient.post<AddCommentResponse>('api/add-comment', payload);
  return response.data;
}

/*
Static frontend-only fallback kept for reference:

const buildStaticModels = (): ApiModelDetail[] => { ... };
let staticModels: ApiModelDetail[] = buildStaticModels();
export async function fetchAllModelDetails(): Promise<ApiModelDetail[]> { return staticModels; }
export async function updateModelStatus(...) { ... }
export async function updateLandmarkJson(...) { ... }
export async function addComment(...) { ... }
*/
