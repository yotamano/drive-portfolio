import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ContentItem } from '../types';

type NoteProps = {
  content: ContentItem | null;
  breadcrumb?: string;
};

const Note: React.FC<NoteProps> = ({ content, breadcrumb }) => {
  if (!content) {
    return (
      <div className="note-container">
        <div className="py-8 text-center text-text-secondary">
          Select a note to view
        </div>
      </div>
    );
  }

  const renderMedia = () => {
    if (content.mediaFiles && content.mediaFiles.length > 0) {
      return (
        <div className="mt-6">
          {content.mediaFiles.map(media => (
            <div key={media.id} className="mb-6">
              {media.mimeType.startsWith('image/') ? (
                <img 
                  src={media.thumbnailLink ? media.thumbnailLink.replace('=s220', '=s800') : media.downloadLink || media.webViewLink}
                  alt={media.name}
                  className="w-full rounded-md"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const currentSrc = img.src;
                    
                    // Try fallbacks in order of reliability
                    if (media.thumbnailLink && currentSrc.includes('googleusercontent.com')) {
                      // First fallback: try downloadLink
                      if (media.downloadLink) {
                        img.src = media.downloadLink;
                      } else if (media.webViewLink) {
                        img.src = media.webViewLink;
                      }
                    } else if (currentSrc.includes('export=download') && media.webViewLink) {
                      // Second fallback: try webViewLink
                      img.src = media.webViewLink;
                    } else if (currentSrc.includes('export=view') && media.embedLink) {
                      // Third fallback: try embedLink (though this won't work for img tags)
                      console.warn(`Image failed to load: ${media.name} (${media.id})`);
                      // Could replace with placeholder or error state here
                    }
                  }}
                />
              ) : media.mimeType.startsWith('video/') ? (
                <iframe
                  src={media.embedLink || `https://drive.google.com/file/d/${media.id}/preview`}
                  className="w-full rounded-md"
                  style={{ height: '400px', minHeight: '300px' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={media.name}
                />
              ) : null}
              
              {/* The AI doesn't generate captions yet, but this is here for future use */}
              {/* {media.caption && (
                <p className="text-text-secondary text-sm mt-1">{media.caption}</p>
              )} */}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="note-container">
      {/* Breadcrumb or tag */}
      {breadcrumb && (
        <div className="breadcrumb">
          {breadcrumb}
        </div>
      )}
      
      {/* Title */}
      <h1 className="text-2xl font-medium mb-4">{content.name}</h1>
      
      {/* Content */}
      {content.content && (
        <div className="note-content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {content.content}
          </ReactMarkdown>
        </div>
      )}
      
      {/* Media files */}
      {renderMedia()}
    </div>
  );
};

export default Note; 