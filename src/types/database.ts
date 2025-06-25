
export interface DatabaseProduct {
  id: string;
  name: string;
  tier: 'Preferred' | 'Standard' | 'Graded' | 'Modified';
  description: string | null;
  benefits: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuestion {
  id: string;
  product_id: string;
  question_text: string;
  question_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: string;
  session_id: string;
  question_id: string;
  response: boolean;
  answered_at: string;
}

export interface QualificationResult {
  id: string;
  session_id: string;
  qualified_product_id: string | null;
  completed_at: string;
}
