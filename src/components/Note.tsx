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
      const images = content.mediaFiles.filter(media => media.mimeType.startsWith('image/'));
      const videos = content.mediaFiles.filter(media => media.mimeType.startsWith('video/'));
      
      // Use pre-computed layout decisions from build time
      const layoutGroups = content.layoutConfig?.groups || [{
        images: images,
        layout: 'single-column' as const,
        reason: 'fallback - no pre-computed layout'
      }];
      
      // Debug logging (can be removed in production)
      console.log('Using pre-computed layout:', {
        totalImages: images.length,
        hasLayoutConfig: !!content.layoutConfig,
        layoutGroups: layoutGroups.map(g => ({
          layout: g.layout,
          imageCount: g.images.length,
          reason: g.reason
        })),
        layoutStats: content.layoutConfig?.stats
      });
      
      return (
        <div className="mt-6">
          {/* Render images using pre-computed layout groups */}
          {layoutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-8">
              {/* Optional: Add a comment about the layout decision */}
              {/* <div className="text-xs text-gray-400 mb-2">Layout: {group.reason}</div> */}
              
              <div className={group.layout === 'two-column' ? "image-grid-2" : ""}>
                {group.images.map(media => {
                  // Construct a Cloudinary URL with transformations
                  const cloudinaryUrl = media.webViewLink?.includes('cloudinary') 
                    ? media.webViewLink.replace('/upload/', '/upload/f_auto,q_auto,w_800/') 
                    : media.webViewLink;

                  return (
                    <div key={media.id} className={group.layout === 'two-column' ? "" : "mb-6"}>
                      <img 
                        src={cloudinaryUrl}
                        alt={media.name}
                        className="w-full rounded-md"
                        // No more onError handler needed!
                      />
                      
                      {/* The AI doesn't generate captions yet, but this is here for future use */}
                      {/* {media.caption && (
                      <p className="text-text-secondary text-sm mt-1">{media.caption}</p>
                    )} */}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Render videos */}
          {videos.map(media => (
            <div key={media.id} className="mb-6 aspect-w-16 aspect-h-9">
              <iframe
                src={media.webViewLink} // This will now be a Cloudinary video URL if it's a video
                className="w-full h-full rounded-md"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={media.name}
              />
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
      
      {/* Content */}
      {content.content && (
        <div className="note-content">
          {/* Title */}
          <h1 className="text-2xl mb-4">{content.name}</h1>
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