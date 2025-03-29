import React, { useState, useCallback, memo } from 'react';
import PostForm from './PostForm';
import ViewLimitSlider from './ViewLimitSlider';
import './CreatePostForm.css';

// Memoized ViewLimitSlider component
const MemoizedViewLimitSlider = memo(ViewLimitSlider);

// Memoized PostForm component
const MemoizedPostForm = memo(PostForm);

const CreatePostForm = ({ onSubmit, isSubmitting, error }) => {
    const [content, setContent] = useState('');
    const [viewLimit, setViewLimit] = useState(50);
    const [selectedFile, setSelectedFile] = useState(null);

    // Memoize callback functions to prevent recreation on each render
    const handleFormSubmit = useCallback(() => {
        onSubmit({
            content: content.trim(),
            viewLimit: viewLimit,
            file: selectedFile
        });
    }, [content, viewLimit, selectedFile, onSubmit]);

    const handleContentChange = useCallback((newContent) => {
        setContent(newContent);
    }, []);

    const handleViewLimitChange = useCallback((newLimit) => {
        setViewLimit(newLimit);
    }, []);

    const handleFileAttach = useCallback((file) => {
        setSelectedFile(file);
    }, []);

    return (
        <div className="card">
            <MemoizedViewLimitSlider
                value={viewLimit}
                onChange={handleViewLimitChange}
            />

            {error && <div className="error-message">{error}</div>}

            <MemoizedPostForm
                content={content}
                onContentChange={handleContentChange}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                viewLimit={viewLimit}
                onFileAttach={handleFileAttach}
            />
        </div>
    );
};

export default CreatePostForm;