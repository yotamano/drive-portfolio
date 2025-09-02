import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioItem, ZoomProject, MediaFile } from '../types';
import { StreamedText, Shimmer } from './animations';

const renderMedia = (media: MediaFile, index: number) => {
  const isVideo = media.mimeType.startsWith('video/');
  if (isVideo) {
    return (
      <motion.video
        key={media.id}
        src={media.webViewLink}
        className="case-video"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          delay: 0.4 + (index * 0.1),
          ease: 'easeOut'
        }}
        style={{ cursor: 'pointer' }}
        playsInline
        muted
        loop
        autoPlay
        onClick={(e) => {
          const video = e.currentTarget;
          video.muted = !video.muted;
        }}
      />
    );
  }
  return (
    <motion.img
      key={media.id}
      src={media.webViewLink}
      alt={media.name}
      className="case-image"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.4 + (index * 0.1),
        ease: 'easeOut'
      }}
    />
  );
};

interface ProjectProps {
  project: PortfolioItem;
  zoomProject?: ZoomProject;
  isExpanded: boolean;
  isHovered: boolean;
  showL2: boolean;
  onProjectClick: (projectId: string) => void;
  onProjectHoverStart: (projectId: string) => void;
  onProjectHoverEnd: () => void;
  listIndex?: number;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
  hasBeenAnimated?: boolean;
}

const Project: React.FC<ProjectProps> = ({
  project,
  zoomProject,
  isExpanded,
  isHovered,
  showL2,
  onProjectClick,
  onProjectHoverStart,
  onProjectHoverEnd,
  listIndex = 0,
  shouldAnimate = false,
  onAnimationComplete,
  hasBeenAnimated = false
}) => {
  const heroImage = project.mediaFiles?.find(media => media.mimeType.startsWith('image/'));
  const imageWidth = heroImage?.width || 16;
  const imageHeight = heroImage?.height || 9;
  const aspectRatio = (imageHeight / imageWidth) * 100;

  const metadataParts = [zoomProject?.year, zoomProject?.medium, zoomProject?.role].filter(Boolean);
  const metadataText = metadataParts.join(' • ');

  const titleClassName = `transition-colors duration-300 ${isExpanded ? 'text-text-primary' : (isHovered ? 'text-text-primary' : 'text-text-secondary')}`;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [project.name]);

  return (
    <div
      ref={containerRef}
      className="project-container"
      onMouseEnter={() => onProjectHoverStart(project.id)}
      onMouseLeave={onProjectHoverEnd}
    >
      {/* L1 & L2 Content */}
      <div className="project-row content-padding" onClick={() => onProjectClick(project.id)}>
        <AnimatePresence initial={false} mode="wait">
          {isExpanded ? (
            <motion.div
              key="l3-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-title-style">{project.name}</h1>
              {metadataText && <p className="text-paragraph-style text-text-secondary">{metadataText}</p>}
            </motion.div>
          ) : (
            <motion.div
              key="l1-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-paragraph-style">
                <span className={titleClassName}>{project.name}</span>
                {metadataText && <span className="text-text-secondary ml-2">{`(${metadataText})`}</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* L2 Description (animates height) */}
      <AnimatePresence>
        {showL2 && !isExpanded && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: '150px', opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
            className="content-padding"
          >
            <StreamedText
              key={`l2-desc-${project.id}`}
              className="text-paragraph-style"
              text={zoomProject?.l2 || 'Interactive experience built with modern web technologies'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* L2 Image (absolutely positioned, fades in) */}
      <AnimatePresence>
        {showL2 && !isExpanded && heroImage && (
          <div className="hover-image-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="w-48">
                <Shimmer>
                  <div
                    className="project-card-image"
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: `${aspectRatio}%`, // Maintain aspect ratio
                    }}
                  >
                    <img
                      src={heroImage.webViewLink}
                      alt={project.name}
                      className="hero-image"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  </div>
                </Shimmer>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* L3: Full Case Study */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="full-case"
          >
            <div className="case-content">
              {zoomProject?.l3 ? (
                <div className="case-text content-padding">
                  <StreamedText key={`l3-problem-${project.id}`} className="text-paragraph-style" text={zoomProject.l3.problem} />
                  <StreamedText key={`l3-solution-${project.id}`} className="text-paragraph-style" text={zoomProject.l3.solution} />
                  <StreamedText key={`l3-result-${project.id}`} className="text-paragraph-style" text={zoomProject.l3.result} />
                </div>
              ) : project.content ? (
                <div className="case-text content-padding">
                  {project.content.split('\n\n').map((paragraph, index) => (
                    <StreamedText key={`l3-p-${index}-${project.id}`} className="text-paragraph-style" text={paragraph} />
                  ))}
                </div>
              ) : null}

              {project.mediaLayouts && project.mediaLayouts.length > 0 && (
                <motion.div
                  className="case-media-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {project.mediaLayouts.map((layoutGroup, groupIndex) => {
                    const { layout, media } = layoutGroup;
                    switch (layout) {
                      case 'A':
                        return (
                          <div key={groupIndex} className="layout-a">
                            {media.map(renderMedia)}
                          </div>
                        );
                      case 'B':
                        return (
                          <div key={groupIndex} className="layout-b black-container">
                            {media.map(renderMedia)}
                          </div>
                        );
                      case 'C':
                        return (
                          <div key={groupIndex} className="layout-c black-container">
                            {media.map(renderMedia)}
                          </div>
                        );
                      case 'D':
                        return (
                          <div key={groupIndex} className="layout-d black-container">
                            {media.map(renderMedia)}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Project;
