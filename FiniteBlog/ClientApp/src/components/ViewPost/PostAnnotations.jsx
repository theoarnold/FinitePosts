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
    const [showAnnotations, setShowAnnotations] = useState(true); // Changed to true by default
    const [isShortPost, setIsShortPost] = useState(false);

    const annotationCanvasRef = useRef(null);

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
            // Error sending annotation
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
        drawingDisabled: isDeleted, // Remove showAnnotations check since it's always true now
        
        // Callback for SignalR
        handleAnnotationReceived
    };
};

export default PostAnnotations; 