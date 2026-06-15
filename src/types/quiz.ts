export interface QuizAnswer {
  id?: number;
  answer: string;
  is_right: boolean;
}

export interface QuizQuestion {
  id?: number;
  question: string;
  quiz_question_type_id: number; // 1=MCQ, 2=Essay, 3=File Upload
  points?: number;
  answers: QuizAnswer[];
}

export interface QuizConfiguration {
  heading: string;
  description?: string;
  time_limit_minutes: number | null; // null = unlimited
  unlimited_time: boolean;
  group_mode: boolean;
  only_leader_submit: boolean;
  passing_score_percent: number;
  max_attempts: number | null;
}

export interface Quiz {
  id: number;
  heading: string;
  description?: string;
  time_limit_minutes: number | null;
  unlimited_time: boolean;
  group_mode: boolean;
  only_leader_submit: boolean;
  passing_score_percent: number;
  max_attempts: number | null;
  total_questions: number;
  total_points: number;
  created_at: string;
  status: 'draft' | 'active' | 'archived';
  invitations_count?: number;
  submissions_count?: number;
}

export interface QuizInvitation {
  id: number;
  email: string;
  token: string;
  status: string;
  created_at: string;
}

export interface StudentResult {
  student_id: number;
  student_name: string;
  student_email: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  attempt_number: number;
}