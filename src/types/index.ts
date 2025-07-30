export type MediaFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  downloadLink?: string;
  embedLink?: string;
};

export type ContentItem = {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'project' | 'page';
  children?: ContentItem[];
  content?: string;
  excerpt?: string;
  mediaFiles?: MediaFile[];
};

export type PortfolioData = {
  tree: ContentItem[];
}; 