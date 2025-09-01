export interface MediaFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  downloadLink?: string;
  embedLink?: string;
  thumbnailLink?: string;
  width?: number;
  height?: number;
  modifiedTime: string;
}

export type ContentItem = {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'project' | 'page';
  children?: ContentItem[];
  content?: string;
  excerpt?: string;
  mediaFiles?: MediaFile[];
  layoutConfig?: {
    groups: Array<{
      images: MediaFile[];
      layout: 'two-column' | 'single-column';
      reason: string;
    }>;
    stats: {
      total: number;
      vertical: number;
      horizontal: number;
      square: number;
    };
  };
};

export interface PortfolioData {
  root: ContentItem;
  lastFetch: string;
} 