import { apiClient } from './client';

export interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
}

export interface SubmitReviewParams {
  bookingId: string;
  rating: number;
  text?: string;
}

export async function submitReview(params: SubmitReviewParams): Promise<{ review: Review }> {
  const response = await apiClient.post('/reviews', params);
  return response.data;
}
