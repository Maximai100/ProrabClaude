export interface QuoteItem {
  id: number;
  name: string;
  type: 'work' | 'material';
  unit: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  order: number;
  created_at: string;
}

export interface Quote {
  id: number;
  project_id: number; // Added for navigation
  title: string;
  public_id: string;
  notes: string;
  total_amount: string;
  work_amount: string;
  material_amount: string;
  items: QuoteItem[];
  project_title: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: number;
  name: string;
  type: 'work' | 'material';
  unit: string;
  default_price?: string;
  usage_count: number;
  last_used_at: string;
}
