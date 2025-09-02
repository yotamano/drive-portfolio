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
      // Flatten the media from mediaLayouts if it exists, otherwise use mediaFiles directly
      const allMedia = content.mediaLayouts 
        ? content.mediaLayouts.flatMap(layout => layout.media)
        : content.mediaFiles;

      return (
        <div className="mt-6">
          {allMedia.map(media => {
            const isVideo = media.mimeType.startsWith('video/');

            if (isVideo) {
              return (
                <div key={media.id} className="mb-6 aspect-w-16 aspect-h-9">
                  <iframe
                    src={media.webViewLink}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={media.name}
                  />
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

            return (
              <div key={media.id} className="mb-6">
                <Shimmer>
                  <img 
                    src={fallbackSrc}
                    srcSet={srcSet}
                    sizes="100vw"
                    alt={media.name}
                    className="w-full"
                    loading="lazy"
                  />
                </Shimmer>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="note-container content-padding">
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