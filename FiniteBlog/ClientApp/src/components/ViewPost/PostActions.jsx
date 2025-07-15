import React, { useState, useEffect } from 'react';
import ShareButton from './ShareButton';
import DrawButton from './DrawButton';
import ShareUrlPopup from '../common/ShareUrlPopup';
import { usePostData } from './PostDataProvider';

const PostActions = ({ isDrawing, onToggleDrawing, drawingDisabled, slug }) => {
    const { post, viewerNumber } = usePostData();
    const [showSharePopup, setShowSharePopup] = useState(false);

    // Auto-show share popup for the first viewer (original creator)
    useEffect(() => {
        if (post && viewerNumber === 1) {
            setShowSharePopup(true);
        }
    }, [post, viewerNumber]);

    return (
        <>
            <div className="buttons-row">
                <ShareButton onShareClick={() => setShowSharePopup(true)} />
                <DrawButton 
                    isDrawing={isDrawing}
                    onToggleDrawing={onToggleDrawing}
                    disabled={drawingDisabled}
                />
            </div>

            <ShareUrlPopup 
                isVisible={showSharePopup}
                onClose={() => setShowSharePopup(false)}
                postSlug={slug}
            />
        </>
    );
};

export default PostActions; 