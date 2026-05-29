// ─────────────────────────────────────────────────────────────────────────────
// API Response Types  (matches backend API_DOCUMENTATION.md)
// ─────────────────────────────────────────────────────────────────────────────

export type ModelStatus = "not_checked" | "approved" | "pending";
export type ModelCategory = "adult" | "kid";

export type ApiImage = {
  image_id: string;
  model_id: string;
  image_url: string;
};

export type ApiComment = {
  comment_id: string;
  model_id: string;
  comment: string;
  created_at: string;
};

export type ApiModelDetail = {
  model_id: string;
  model_name: string;
  model_glb_url: string;
  landmarks_url: string | null;
  original_landmarks_url: string | null;
  category: ModelCategory;
  status: ModelStatus;
  created_at: string;
  updated_at: string | null;
  images: ApiImage[];
  comments: ApiComment[];
};

export type FetchAllModelsResponse = {
  success: boolean;
  status: number;
  model_details: ApiModelDetail[];
};

// ─── Update-status request/response ──────────────────────────────────────────
export type UpdateStatusRequest = {
  model_id: string;
  status: ModelStatus;
};

export type UpdateStatusResponse = {
  success: boolean;
  message: string;
  status: ModelStatus;
};

// ─── Update-json-url request/response ────────────────────────────────────────
export type UpdateJsonUrlRequest = {
  model_id: string;
  json_data: Record<string, Record<string, any>>;
  original_json_data?: Record<string, Record<string, any>>;
};

export type UpdateJsonUrlResponse = {
  success: boolean;
  json_url: string;
  original_json_url?: string;
};

export type AddCommentResponse = {
  comment_id: string;
  created_at: string;
  model_id: string;
  comment: string;
};
export type AddCommentRequest = {
  model_id: string;
  comment: string;
};
export type ResetLandmarkResponse = {
  success: boolean;
  message?: string;
};
