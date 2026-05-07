export interface TargetJob {
  id: number;
  title: string;
  company: string;
  url: string;
  category: 'Automation' | 'AI Engineer' | 'Prompt Engineering';
  star?: boolean;
}

export const TARGET_JOBS: TargetJob[] = [];
