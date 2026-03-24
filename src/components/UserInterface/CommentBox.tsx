import React, { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Send, Clear } from '@mui/icons-material';

type CommentsBoxProps = {
    onSubmit: (comment: string) => void;
    placeholder?: string;
    defaultValue?: string;
    disabled?: boolean;
};

const CommentsBox: React.FC<CommentsBoxProps> = ({
    onSubmit,
    placeholder = 'Add a comment...',
    defaultValue = '',
    disabled = false,
}) => {
    const [comment, setComment] = useState(defaultValue);

    useEffect(() => {
        setComment(defaultValue);
    }, [defaultValue]);

    const handleSubmit = () => {
        if (!comment.trim()) return;
        onSubmit(comment.trim());
    };

    const handleClear = () => {
        setComment('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1.5,
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#fff',
            }}
        >
            <TextField
                multiline
                minRows={2}
                maxRows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                size="small"
                fullWidth
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.75rem',
                    },
                }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    endIcon={<Send />}
                    onClick={handleSubmit}
                    disabled={disabled || !comment.trim()}
                    sx={{
                        borderRadius: 2,
                        fontSize: '0.7rem',
                        textTransform: 'none',
                    }}
                >
                    Submit
                </Button>

                <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    endIcon={<Clear />}
                    onClick={handleClear}
                    disabled={disabled || !comment}
                    sx={{
                        borderRadius: 2,
                        fontSize: '0.7rem',
                        textTransform: 'none',
                    }}
                >
                    Clear
                </Button>
            </Box>
        </Box>
    );
};

export default CommentsBox;