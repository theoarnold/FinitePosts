import React from 'react';
import { Link } from 'react-router-dom';
import PostStats from './PostStats';
import { usePostData } from './PostDataProvider';

const PostHeader = ({ activeViewers }) => {
    const { post, currentViews, viewerNumber } = usePostData();

    if (!post) return null;

    return (
        <>
            <PostStats 
                viewerNumber={viewerNumber}
                viewLimit={post.viewLimit}
                activeViewers={activeViewers}
                currentViews={currentViews}
            />
            
            <Link to="/" className="home-link">
                &lt; HOME
            </Link>
        </>
    );
};

export default PostHeader; 