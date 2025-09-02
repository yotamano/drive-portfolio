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

export type LayoutType = 'A' | 'B' | 'C' | 'D';

export interface MediaLayout {
  layout: LayoutType;
  media: MediaFile[];
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
  mediaLayouts?: MediaLayout[];
};

export interface PortfolioData {
  root: ContentItem;
  lastFetch: string;
}

export type PortfolioItem = ContentItem;

export interface ZoomProject {
  id: string;
  l1: string;
  l2: string;
  l3: {
    problem: string;
    solution: string;
    result: string;
  };
  year: string;
  medium: string;
  role:string;
}

export interface ZoomContent {
  siteHeader: string;
  projects: ZoomProject[];
} 