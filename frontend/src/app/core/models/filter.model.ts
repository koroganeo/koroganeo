export interface FilterState {
  genre: string | null;
  tags: string[];
  creators: string[];
  difficulty: string | null;
  sortBy: 'date' | 'length' | 'title';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_FILTER_STATE: FilterState = {
  genre: null,
  tags: [],
  creators: [],
  difficulty: null,
  sortBy: 'date',
  sortOrder: 'desc',
};
