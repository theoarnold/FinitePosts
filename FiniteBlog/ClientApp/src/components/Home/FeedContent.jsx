import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedData } from './FeedDataProvider';
import FeedPost from './FeedPost';
import FeedState from './FeedState';

const FeedContent = ({ feedRef, onPostClick }) => {
    const { posts, loading, error, fetchPosts } = useFeedData();
    const navigate = useNavigate();

    const handlePostClick = useCallback((slug) => {
        onPostClick?.(slug);
        navigate(`/${slug}`);
    }, [navigate, onPostClick]);

    // Handle loading, error, and empty states
    if (loading || error || posts.length === 0) {
        return (
            <FeedState 
                loading={loading} 
                error={error} 
                posts={posts} 
                onRetry={() => fetchPosts()} 
            />
        );
    }

    return (
        <div 
            ref={feedRef}
            className="post-feed"
            tabIndex={0}
        >
            {posts.map((post) => (
                <FeedPost
                    key={post.slug}
                    post={post}
                    onPostClick={handlePostClick}
                />
            ))}
        </div>
    );
};

export default FeedContent; 