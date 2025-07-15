import React, { useRef, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    
    const postContentRef = useRef(null);
    const cardRef = useRef(null);

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
        <div ref={cardRef} className="card post-card">
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