import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastVariants = {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
};

const ToastItem = ({ id, type, message, onClose }) => {
    useEffect(() => {
        // Auto-dismiss logic
        const timer = setTimeout(() => {
            onClose(id);
        }, 3000);

        // Debug
        // console.log(`[Toast] Mounted: ${message} (${type})`);

        return () => clearTimeout(timer);
    }, [id, onClose, message, type]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} color="#4CAF50" />;
            case 'error': return <XCircle size={20} color="#FF4444" />;
            case 'warning': return <AlertTriangle size={20} color="#FFC107" />;
            default: return <Info size={20} color="#2196F3" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'rgba(76, 175, 80, 0.5)';
            case 'error': return 'rgba(255, 68, 68, 0.5)';
            case 'warning': return 'rgba(255, 193, 7, 0.5)';
            default: return 'rgba(33, 150, 243, 0.5)';
        }
    };

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
                background: 'rgba(13, 13, 15, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${getBorderColor()}`,
                borderLeft: `4px solid ${getBorderColor()}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '300px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                position: 'relative',
                pointerEvents: 'auto',
                zIndex: 2147483647
            }}
        >
            {getIcon()}
            <p style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: '500' }}>{message}</p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    // Safety check for SSR or environments without document
    if (typeof document === 'undefined') return null;

    useEffect(() => {
        if (toasts.length > 0) {
            // console.log(`[ToastContainer] Rendering ${toasts.length} toasts`);
        }
    }, [toasts]);

    return createPortal(
        <div style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 2147483647, // Max safe integer
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            pointerEvents: 'none'
        }}>
            <AnimatePresence mode='popLayout'>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
};

export default ToastContainer;
