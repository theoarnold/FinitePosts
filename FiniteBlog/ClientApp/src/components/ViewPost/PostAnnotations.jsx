import React, { useState, useEffect, useRef, useCallback } from 'react';
import fingerprintService from '../../services/fingerprint';
import signalRService from '../../services/signalRService';
import TextAnnotationCanvas from './DrawingCanvas';
import ReceivedAnnotations from './ReceivedDrawings';
import { usePostData } from './PostDataProvider';

const PostAnnotations = ({ slug, postContentRef, cardRef }) => {
    const { post, isDeleted } = usePostData();
    const [receivedAnnotations, setReceivedAnnotations] = useState([]);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isShortPost, setIsShortPost] = useState(false);

    const annotationCanvasRef = useRef(null);
    const fadeInTimeoutRef = useRef(null);

    // Check if post content is short (1 line or less)
    useEffect(() => {
        if (post?.content && postContentRef.current) {
            // Simple heuristic: posts with 80 characters or less are likely 1 line
            // Also check actual rendered height vs line height
            const contentLength = post.content.trim().length;
            const isShortByLength = contentLength <= 80;
            
            // Measure actual rendered height
            const element = postContentRef.current;
            const lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 24;
            const elementHeight = element.offsetHeight;
            const isShortByHeight = elementHeight <= lineHeight * 1.2; // Allow for some margin
            
            setIsShortPost(isShortByLength || isShortByHeight);
        }
    }, [post?.content, postContentRef]);

    // Handle annotation fade-in based on scroll position
    useEffect(() => {
        if (!post?.content || !postContentRef.current) return;

        const checkScrollPosition = () => {
            const element = postContentRef.current;
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Check if bottom of post content is visible
            return rect.bottom <= windowHeight + 20; // 20px tolerance
        };

        const handleScroll = () => {
            if (hasScrolledToBottom) return;
            
            if (checkScrollPosition()) {
                setHasScrolledToBottom(true);
                setShowAnnotations(true);
            }
        };

        // Check initial position
        const isInitiallyAtBottom = checkScrollPosition();
        
        if (isInitiallyAtBottom) {
            // If already at bottom, wait 10 seconds then fade in
            fadeInTimeoutRef.current = setTimeout(() => {
                setShowAnnotations(true);
            }, 10000);
        } else {
            // Add scroll listener to detect when user reaches bottom
            window.addEventListener('scroll', handleScroll);
        }

        setHasScrolledToBottom(isInitiallyAtBottom);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (fadeInTimeoutRef.current) {
                clearTimeout(fadeInTimeoutRef.current);
            }
        };
    }, [post?.content, hasScrolledToBottom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (fadeInTimeoutRef.current) {
                clearTimeout(fadeInTimeoutRef.current);
            }
        };
    }, []);

    // Load existing annotations from post data
    useEffect(() => {
        if (post?.drawings && post.drawings.length > 0) {
            const annotations = post.drawings.map(drawing => ({
                text: drawing.text,
                positionX: drawing.positionX,
                positionY: drawing.positionY,
                createdAt: drawing.createdAt,
                deviceFingerprint: drawing.createdByFingerprint
            }));
            setReceivedAnnotations(annotations);
        }
    }, [post?.drawings]);

    // Handle new annotation received from SignalR
    const handleAnnotationReceived = useCallback((annotation) => {
        // Remove any existing annotation from this user, then add the new one
        setReceivedAnnotations(prev => {
            const filteredAnnotations = prev.filter(existingAnnotation => 
                existingAnnotation.deviceFingerprint !== annotation.deviceFingerprint
            );
            return [...filteredAnnotations, annotation];
        });
    }, []);

    // Annotation handlers
    const handleToggleAnnotating = () => {
        if (!showAnnotations) return; // Don't allow annotation creation before they're revealed
        setIsAnnotating(!isAnnotating);
    };

    const handleAnnotationChange = async (annotationData) => {
        if (annotationData) {
            try {
                // Get device fingerprint for user identification
                const deviceFingerprint = await fingerprintService.getFingerprint();
                
                // Remove any existing annotation from this user
                setReceivedAnnotations(prev => 
                    prev.filter(annotation => annotation.deviceFingerprint !== deviceFingerprint)
                );
                
                // Add the new annotation to our own display immediately
                const annotation = {
                    text: annotationData.text,
                    positionX: annotationData.positionX,
                    positionY: annotationData.positionY,
                    createdAt: Date.now(),
                    deviceFingerprint: deviceFingerprint
                };
                setReceivedAnnotations(prev => [...prev, annotation]);
                
                // Send to other viewers via SignalR
                await signalRService.sendTextAnnotation(slug, annotationData.text, annotationData.positionX, annotationData.positionY);
                
                // Clear the canvas and reset state
                if (annotationCanvasRef.current) {
                    annotationCanvasRef.current.clear();
                }
                setIsAnnotating(false);
            } catch (error) {
                console.error('Error sending annotation:', error);
            }
        }
    };

    const handleCancelAnnotation = () => {
        if (annotationCanvasRef.current) {
            annotationCanvasRef.current.clear();
        }
        setIsAnnotating(false);
    };

    // Handle escape key to cancel annotation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isAnnotating) {
                handleCancelAnnotation();
            }
        };

        if (isAnnotating) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isAnnotating]);

    return {
        // State for parent component
        isShortPost,
        isAnnotating,
        
        // Annotation components to render
        annotationsComponent: (
            <>
                {/* Received annotations display - always visible, covers entire card */}
                <ReceivedAnnotations 
                    annotations={receivedAnnotations}
                    targetElementRef={cardRef}
                    showAnnotations={showAnnotations}
                />
                
                {/* Text Annotation Canvas for creating new annotations, covers entire card */}
                {isAnnotating && showAnnotations && (
                    <TextAnnotationCanvas 
                        ref={annotationCanvasRef}
                        isVisible={isAnnotating}
                        onAnnotationChange={handleAnnotationChange}
                        targetElementRef={cardRef}
                    />
                )}
            </>
        ),
        
        // Draw button state
        isDrawing: isAnnotating,
        onToggleDrawing: handleToggleAnnotating,
        drawingDisabled: isDeleted || !showAnnotations,
        
        // Callback for SignalR
        handleAnnotationReceived
    };
};

export default PostAnnotations; 