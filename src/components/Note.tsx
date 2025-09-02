import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ContentItem } from '../types';
import { Shimmer, StreamedText } from './animations';

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
                  if (!media.webViewLink?.includes('cloudinary')) {
                    // Fallback for non-cloudinary links or if something is wrong
                    return (
                      <div key={media.id} className={group.layout === 'two-column' ? "" : "mb-6"}>
                        <Shimmer>
                          <img src={media.webViewLink} alt={media.name} className="w-full rounded-md" />
                        </Shimmer>
                      </div>
                    );
                  }

                  // Define the widths for our responsive images
                  const widths = [400, 800, 1200, 1600, 2000];
                  
                  // Generate the srcset string for different resolutions
                  const srcSet = widths.map(width => {
                    const transformedUrl = media.webViewLink.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
                    return `${transformedUrl} ${width}w`;
                  }).join(', ');

                  // Define a fallback src for older browsers
                  const fallbackSrc = media.webViewLink.replace('/upload/', '/upload/f_auto,q_auto,w_800/');

                  // Give the browser hints on how the image is displayed in the layout
                  const sizes = group.layout === 'two-column'
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "100vw";

                  return (
                    <div key={media.id} className={group.layout === 'two-column' ? "" : "mb-6"}>
                      <Shimmer>
                        <img 
                          src={fallbackSrc}
                          srcSet={srcSet}
                          sizes={sizes}
                          alt={media.name}
                          className="w-full rounded-md"
                          loading="lazy" // Lazy load images for better performance
                        />
                      </Shimmer>
                      
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
        <div className="breadcrumb max-w-text">
          {breadcrumb}
        </div>
      )}
      
      {/* Content */}
      {content.content && (
        <div className="note-content">
          {/* Title */}
          <Shimmer>
            <h1 className="text-title-style mb-4 max-w-text">{content.name}</h1>
          </Shimmer>
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({...props}) => {
                const children = React.Children.toArray(props.children);
                const text = children.map(child => (typeof child === 'string' ? child : '')).join('');
                if (text) {
                  return <StreamedText text={text} className="text-paragraph-style" />;
                }
                return <p className="text-paragraph-style">{props.children}</p>;
              }
            }}
          >
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