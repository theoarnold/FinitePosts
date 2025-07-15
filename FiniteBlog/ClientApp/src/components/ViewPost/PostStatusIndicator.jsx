import React from 'react';
import { usePostData } from './PostDataProvider';

const PostStatusIndicator = () => {
    const { post, currentViews } = usePostData();

    if (!post) return null;

    return (
        <>
            {currentViews === post.viewLimit - 1 && (
                <p className="final-view-warning">
                    Warning: This is the last view. The post will be deleted after this.
                </p>
            )}
        </>
    );
};

export default PostStatusIndicator; 