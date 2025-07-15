import React from 'react';
import { usePostData } from './PostDataProvider';

const PostContentDisplay = ({ postContentRef, isShortPost, isAnnotating }) => {
    const { post } = usePostData();

    if (!post) return null;

    return (
        <>
            <div 
                ref={postContentRef}
                className={`post-content post-content-with-annotations ${isAnnotating ? 'post-content-annotation-mode' : ''} ${isShortPost ? 'post-content-large' : ''}`}
            >
                {post.content}
            </div>
            
            {/* Display attached file if it exists */}
            {post.attachedFileUrl && (
                <div className="attached-file">
                    {post.attachedFileContentType?.startsWith('image/') && (
                        <img 
                            src={post.attachedFileUrl} 
                            alt={post.attachedFileName || 'Uploaded image'} 
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                marginTop: '16px',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        />
                    )}
                    {post.attachedFileContentType?.startsWith('audio/') && (
                        <audio 
                            controls 
                            style={{
                                width: '100%',
                                marginTop: '16px'
                            }}
                        >
                            <source src={post.attachedFileUrl} type={post.attachedFileContentType} />
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </div>
            )}
        </>
    );
};

export default PostContentDisplay; 