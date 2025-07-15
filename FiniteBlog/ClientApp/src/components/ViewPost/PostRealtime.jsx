import { useEffect, useRef, useState } from 'react';
import signalRService from '../../services/signalRService';
import { usePostData } from './PostDataProvider';

const PostRealtime = ({ slug, onAnnotationReceived }) => {
    const { setCurrentViews, setIsDeleted } = usePostData();
    const [activeViewers, setActiveViewers] = useState(0);
    
    const unsubscribeRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // Setup SignalR subscription
    useEffect(() => {
        if (!slug) return;

        const handleSignalRUpdate = (eventType, data) => {
            if (eventType === 'viewUpdate') {
                if (data.currentViews !== undefined) {
                    setCurrentViews(data.currentViews);
                }
                if (data.activeViewers !== undefined) {
                    setActiveViewers(data.activeViewers);
                }
                if (data.currentViews !== undefined && data.viewLimit !== undefined && data.currentViews >= data.viewLimit) {
                    setIsDeleted(true);
                }
            } else if (eventType === 'viewerCount') {
                if (data.activeViewers !== undefined) {
                    setActiveViewers(data.activeViewers);
                }
            } else if (eventType === 'annotationUpdate') {
                if (data.text && data.positionX !== undefined && data.positionY !== undefined) {
                    const annotation = {
                        text: data.text,
                        positionX: data.positionX,
                        positionY: data.positionY,
                        createdAt: Date.now(),
                        deviceFingerprint: data.deviceFingerprint
                    };
                    
                    onAnnotationReceived?.(annotation);
                }
            }
        };

        // Subscribe immediately for ViewPost (no delay)
        unsubscribeRef.current = signalRService.subscribeImmediate(slug, handleSignalRUpdate);

        // Poll for viewer count every 5 seconds
        pollIntervalRef.current = setInterval(() => {
            signalRService.requestViewerCount(slug);
        }, 5000);

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [slug, setCurrentViews, setIsDeleted, onAnnotationReceived]);

    return { activeViewers };
};

export default PostRealtime; 