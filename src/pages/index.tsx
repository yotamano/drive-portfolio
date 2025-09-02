import React, { useState, useEffect, useRef } from 'react';
import { PortfolioData, PortfolioItem, ZoomContent } from '../types';
import Project from '../components/Project';
import { Shimmer, StreamedText } from '../components/animations';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage({ portfolioData, zoomContent }: { portfolioData: PortfolioData; zoomContent?: ZoomContent }) {
  const [siteLevel, setSiteLevel] = useState<0 | 1>(0);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [debouncedHoveredProjectId, setDebouncedHoveredProjectId] = useState<string | null>(null);
  const [visibleProjectIndex, setVisibleProjectIndex] = useState<number>(-1);
  const [animatedProjects, setAnimatedProjects] = useState<Set<number>>(new Set());
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Get projects from the portfolio data
  const projects = portfolioData?.root?.children?.filter(item => item.type === 'project') || [];

  // Get zoom content for a project
  const getZoomProjectContent = (projectId: string) => {
    return zoomContent?.projects.find(p => p.id === projectId);
  };

  const handleProjectClick = (projectId: string) => {
    setExpandedProjectId(prev => (prev === projectId ? null : projectId));
  };

  const handleProjectHoverStart = (projectId: string) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    setHoveredProjectId(projectId);
    hoverTimer.current = setTimeout(() => {
      setDebouncedHoveredProjectId(projectId);
    }, 500);
  };

  const handleProjectHoverEnd = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    setHoveredProjectId(null);
    setDebouncedHoveredProjectId(null);
  };

  // Reset and start the sequential animation when entering L1
  useEffect(() => {
    if (siteLevel === 1) {
      setVisibleProjectIndex(-1);
      setAnimatedProjects(new Set());
      // Start the first project after a small delay
      const timer = setTimeout(() => setVisibleProjectIndex(0), 100);
      return () => clearTimeout(timer);
    } else {
      setVisibleProjectIndex(-1);
      setAnimatedProjects(new Set());
    }
  }, [siteLevel]);

  const handleProjectAnimationComplete = (projectIndex: number) => {
    // Mark this project as animated
    setAnimatedProjects(prev => new Set([...Array.from(prev), projectIndex]));
    // Trigger the next project
    if (projectIndex + 1 < projects.length) {
      setVisibleProjectIndex(projectIndex + 1);
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {},
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: {},
    visible: {},
  };

  return (
    <div className={`zoom-container`}>
      {siteLevel > 0 && (
        <div
          className="zoom-background"
          onClick={() => {
            setSiteLevel(0);
            setExpandedProjectId(null);
          }}
        />
      )}

      {/* L0: Site Header */}
      <div
        className={`zoom-level-0 ${siteLevel !== 0 ? 'active' : ''}`}
        onClick={() => setSiteLevel(1)}
      >
        <StreamedText
          text={zoomContent?.siteHeader || "Hi, I'm Yotam — designer working with AI and the web."}
          className="text-paragraph-style"
        />
      </div>

      {/* L1+: Project Index */}
      <AnimatePresence>
        {siteLevel === 1 && (
          <motion.div
            className={`zoom-level-1 active`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="project-index" variants={containerVariants}>
              {projects.map((project, index) => {
                const zoomProject = getZoomProjectContent(project.path);
                const isExpanded = expandedProjectId === project.id;
                const isHovered = hoveredProjectId === project.id;
                const showL2 = debouncedHoveredProjectId === project.id;
                const hasBeenAnimated = animatedProjects.has(index);
                const shouldAnimate = hasBeenAnimated || visibleProjectIndex >= index;
                return (
                  <motion.div 
                    key={project.id} 
                    variants={itemVariants}
                    custom={index}
                  >
                    <Project
                      project={project}
                      zoomProject={zoomProject}
                      isExpanded={isExpanded}
                      isHovered={isHovered}
                      showL2={showL2}
                      onProjectClick={handleProjectClick}
                      onProjectHoverStart={handleProjectHoverStart}
                      onProjectHoverEnd={handleProjectHoverEnd}
                      listIndex={index}
                      shouldAnimate={shouldAnimate}
                      onAnimationComplete={() => handleProjectAnimationComplete(index)}
                      hasBeenAnimated={hasBeenAnimated}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');

  const contentPath = path.join(process.cwd(), 'public', 'content', 'content.json');
  const zoomContentPath = path.join(process.cwd(), 'public', 'content', 'zoom-content.json');
  
  let portfolioData = null;
  let zoomContent = null;
  
  try {
    const contentJson = fs.readFileSync(contentPath, 'utf8');
    portfolioData = JSON.parse(contentJson);
  } catch (error) {
    console.error('Could not read portfolio content.json:', error);
  }

  try {
    const zoomContentJson = fs.readFileSync(zoomContentPath, 'utf8');
    zoomContent = JSON.parse(zoomContentJson);
  } catch (error) {
    console.log('Could not read zoom-content.json (will use fallbacks):', error);
  }

  return {
    props: {
      portfolioData: portfolioData || { root: { id: '', name: '', path: '', type: 'folder' }, lastFetch: '' },
      zoomContent: zoomContent || null,
    },
  };
}