import React, { useRef, memo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGesture } from '@use-gesture/react';
import PostDataProvider, { usePostData } from './ViewPost/PostDataProvider';
import PostRealtime from './ViewPost/PostRealtime';
import PostAnnotations from './ViewPost/PostAnnotations';
import PostContentDisplay from './ViewPost/PostContentDisplay';
import PostHeader from './ViewPost/PostHeader';
import PostActions from './ViewPost/PostActions';
import PostStatusIndicator from './ViewPost/PostStatusIndicator';
import PostFooter from './ViewPost/PostFooter';
import ExpiredPost from './common/ExpiredPost';

const ViewPostContent = memo(() => {
    const { post, loading, error, isDeleted } = usePostData();
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const postContentRef = useRef(null);
    const cardRef = useRef(null);
    const pageRef = useRef(null);
    
    // State for drag visual feedback
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showArrow, setShowArrow] = useState(false);

    // Prevent body overflow during drag
    useEffect(() => {
        if (isDragging && window.innerWidth <= 768) {
            document.body.style.overflowX = 'hidden';
        } else {
            document.body.style.overflowX = '';
        }
        
        return () => {
            document.body.style.overflowX = '';
        };
    }, [isDragging]);

    // Simplified gesture handling with visual feedback - now on full page
    const bind = useGesture(
        {
            onDragStart: ({ event }) => {
                // Only on mobile resolution
                if (window.innerWidth > 768) return;
                
                // Don't trigger if drag started in navbar area (top 52px)
                if (event.clientY < 52) return;
                
                setIsDragging(true);
            },
            onDrag: ({ movement: [mx], direction: [dx], distance, velocity, cancel, event }) => {
                // Only on mobile resolution
                if (window.innerWidth > 768) return;
                
                // Don't process if drag started in navbar area
                if (!isDragging) return;
                
                // Update visual feedback - move the card with the drag
                // Apply some resistance so it doesn't move 1:1 with finger
                const resistance = 0.4;
                const offset = Math.max(0, mx * resistance); // Only positive (right) movement
                setDragOffset(offset);
                
                // Show arrow when user has dragged significantly (50% of threshold)
                setShowArrow(mx > 60); // Show arrow at 60px instead of full threshold
                
                // Left to right swipe: INCREASED thresholds by 50%
                // Old: mx > 80 && (velocity[0] > 0.3 || mx > 120)
                // New: mx > 120 && (velocity[0] > 0.3 || mx > 180)
                if (mx > 120 && (velocity[0] > 0.3 || mx > 180)) {
                    cancel();
                    navigate('/');
                }
            },
            onDragEnd: ({ movement: [mx], velocity }) => {
                // Reset visual feedback
                setIsDragging(false);
                setDragOffset(0);
                setShowArrow(false);
                
                // Only on mobile resolution
                if (window.innerWidth > 768) return;
                
                // Also check on drag end for slower swipes - INCREASED threshold by 50%
                // Old: mx > 100
                // New: mx > 150
                if (mx > 150) {
                    navigate('/');
                }
            }
        },
        {
            drag: {
                axis: 'x', // Only horizontal dragging
                threshold: 10,
                filterTaps: true,
                preventWindowScrollY: false
            }
        }
    );

    // Set up annotations with refs
    const {
        isShortPost,
        isAnnotating,
        annotationsComponent,
        isDrawing,
        onToggleDrawing,
        drawingDisabled,
        handleAnnotationReceived
    } = PostAnnotations({ slug, postContentRef, cardRef });

    // Set up real-time updates
    const { activeViewers } = PostRealtime({ slug, onAnnotationReceived: handleAnnotationReceived });

    if (loading) {
        return (
            <div className="card" style={{
                minHeight: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '8px', height: '8px', background: '#ddd', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (isDeleted) {
        return <ExpiredPost />;
    }

    if (error) {
        return (
            <div className="card">
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/" className="home-link">Go Home</Link>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="card" style={{
                minHeight: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '8px', height: '8px', background: '#ddd', borderRadius: '50%' }}></div>
            </div>
        );
    }

    return (
        <div 
            ref={pageRef}
            className="view-post-container"
            style={{ 
                position: 'relative', 
                overflowX: 'hidden',
                overflowY: window.innerWidth <= 768 ? 'auto' : 'visible',
                height: window.innerWidth <= 768 ? 'calc(100vh - 52px)' : 'auto',
                paddingTop: window.innerWidth <= 768 ? '0' : '52px',
                marginTop: window.innerWidth <= 768 ? '0' : '-52px'
            }}
            {...bind()}
        >
            {/* Left arrow indicator */}
            {showArrow && window.innerWidth <= 768 && (
                <div style={{
                    position: 'fixed',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '2rem',
                    color: '#333',
                    opacity: Math.min(1, dragOffset / 50),
                    transition: 'opacity 0.1s ease',
                    zIndex: 1000,
                    pointerEvents: 'none'
                }}>
                    ←
                </div>
            )}
            
            <div 
                ref={cardRef} 
                className="card post-card" 
                style={{ 
                    touchAction: 'pan-y',
                    transform: window.innerWidth <= 768 ? `translateX(${dragOffset}px)` : 'none',
                    opacity: window.innerWidth <= 768 && isDragging ? Math.max(0.7, 1 - (dragOffset / 300)) : 1,
                    transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
                    position: 'relative',
                    zIndex: 1,
                    marginTop: window.innerWidth <= 768 ? '1rem' : '52px'
                }}
            >
                <PostHeader activeViewers={activeViewers} />
                
                <PostContentDisplay 
                    postContentRef={postContentRef}
                    isShortPost={isShortPost}
                    isAnnotating={isAnnotating}
                />
                
                {annotationsComponent}
                
                <PostActions 
                    isDrawing={isDrawing}
                    onToggleDrawing={onToggleDrawing}
                    drawingDisabled={drawingDisabled}
                    slug={slug}
                />
                
                <PostFooter 
                    createdAt={post.createdAt}
                    slug={slug}
                />

                <PostStatusIndicator />
            </div>
        </div>
    );
});

const ViewPost = memo(() => {
    const { slug } = useParams();

    return (
        <PostDataProvider slug={slug}>
            <ViewPostContent />
        </PostDataProvider>
    );
});

ViewPost.displayName = 'ViewPost';
ViewPostContent.displayName = 'ViewPostContent';

export default ViewPost; 