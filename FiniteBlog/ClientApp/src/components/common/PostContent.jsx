import React from 'react';
import ReactMarkdown from 'react-markdown';
import ViewCounter from './ViewCounter';
import ShareOptions from './ShareOptions';
import './PostContent.css';

const PostContent = ({ post, slug }) => {
  return (
    <div className="post-content">
      <ViewCounter 
        slug={slug}
        viewLimit={post.viewLimit}
        initialViews={post.currentViews}
      />
      
      <div className="post-body">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      
      <ShareOptions slug={slug} />
    </div>
  );
};

export default PostContent; 