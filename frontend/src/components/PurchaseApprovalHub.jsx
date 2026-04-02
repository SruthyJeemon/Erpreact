import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    IconButton,
    Chip,
    alpha,
    useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';

const PurchaseApprovalHub = ({ onSelectRequest, onSelectEdit, pendingCount = 0 }) => {
    const theme = useTheme();

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'transparent', minHeight: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <VerifiedIcon sx={{ color: '#334155', fontSize: 28 }} />
                    <Typography variant="h5" fontWeight={700} color="#0f172a">
                        Purchase Approval Module
                    </Typography>
                </Box>
                <Typography variant="body1" color="#64748b" fontWeight={500}>
                    Manage purchase bill verification and logging verification requests.
                </Typography>
            </Box>

            {/* Hub Cards */}
            <Grid container spacing={3}>
                {/* Approval Requests Card */}
                <Grid item xs={12} md={6}>
                    <Card
                        onClick={onSelectRequest}
                        sx={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                borderColor: '#cbd5e1',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                bgcolor: '#ecfdf5',
                                color: '#10b981',
                                p: 1.5,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2.5
                            }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 32 }} />
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                    <Typography variant="h6" fontWeight={700} color="#1e293b">
                                        Approval Requests
                                    </Typography>
                                    {pendingCount > 0 && (
                                        <Chip
                                            label={`${pendingCount} Pending`}
                                            size="small"
                                            sx={{
                                                bgcolor: '#ef4444',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                height: 20
                                            }}
                                        />
                                    )}
                                </Box>
                                <Typography variant="body2" color="#64748b" fontWeight={500}>
                                    Review and validate new purchase bills submitted by team members.
                                </Typography>
                            </Box>

                            <ArrowForwardIcon sx={{ color: '#cbd5e1', ml: 2 }} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Edit Requests Card */}
                <Grid item xs={12} md={6}>
                    <Card
                        onClick={onSelectEdit}
                        sx={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                borderColor: '#cbd5e1',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                bgcolor: '#eff6ff',
                                color: '#3b82f6',
                                p: 1.5,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2.5
                            }}>
                                <EditNoteIcon sx={{ fontSize: 32 }} />
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 0.5 }}>
                                    Edit Requests
                                </Typography>
                                <Typography variant="body2" color="#64748b" fontWeight={500}>
                                    Handle modification requests for existing purchase bill details.
                                </Typography>
                            </Box>

                            <ArrowForwardIcon sx={{ color: '#cbd5e1', ml: 2 }} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PurchaseApprovalHub;
