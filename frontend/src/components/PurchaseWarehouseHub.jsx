import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Divider,
    Button,
    Stack,
    IconButton,
    alpha,
    useTheme,
    Chip
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PurchaseApprovalSection from './PurchaseApprovalSection';
import PurchaseEditRequestSection from './PurchaseEditRequestSection';
import WarehouseReceiveItems from './WarehouseReceiveItems';

const PurchaseWarehouseHub = ({ pendingBillsCount = 0, editRequestsCount = 0 }) => {
    const theme = useTheme();
    const [mainTab, setMainTab] = useState(0);
    const [approvalSubTab, setApprovalSubTab] = useState(0); // 0: Purchase Bills, 1: Edit Requests

    const handleMainTabChange = (event, newValue) => {
        setMainTab(newValue);
    };

    const handleApprovalSubTabChange = (newValue) => {
        setApprovalSubTab(newValue);
    };

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            bgcolor: '#f8fafc',
            pb: 4
        }}>
            {/* Main Navigation Header */}
            <Box sx={{
                bgcolor: 'white',
                borderBottom: '1px solid #e2e8f0',
                px: { xs: 2, md: 4 },
                pt: 4,
                position: 'relative',
                zIndex: 10
            }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ md: 'center' }}
                    spacing={3}
                    sx={{ mb: 4 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Box sx={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: 'white',
                            p: 2,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px -4px rgba(30, 41, 59, 0.25)'
                        }}>
                            <InventoryIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                                Warehouse Operations
                            </Typography>
                            <Typography variant="body1" color="#64748b" fontWeight={500}>
                                Manage stock receipts and purchase verification workflows
                            </Typography>
                        </Box>
                    </Box>

                    {/* Top Level Segmented-style Tabs */}
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'inline-flex',
                            p: 0.75,
                            bgcolor: '#f1f5f9',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <Button
                            onClick={() => setMainTab(0)}
                            startIcon={<VerifiedIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: '10px',
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                color: mainTab === 0 ? '#1e293b' : '#64748b',
                                bgcolor: mainTab === 0 ? 'white' : 'transparent',
                                boxShadow: mainTab === 0 ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
                                '&:hover': {
                                    bgcolor: mainTab === 0 ? 'white' : alpha('#64748b', 0.05)
                                }
                            }}
                        >
                            Approvals
                        </Button>
                        <Button
                            onClick={() => setMainTab(1)}
                            startIcon={<ReceiptIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: '10px',
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                color: mainTab === 1 ? '#1e293b' : '#64748b',
                                bgcolor: mainTab === 1 ? 'white' : 'transparent',
                                boxShadow: mainTab === 1 ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
                                '&:hover': {
                                    bgcolor: mainTab === 1 ? 'white' : alpha('#64748b', 0.05)
                                }
                            }}
                        >
                            Received Items
                        </Button>
                    </Paper>
                </Stack>
            </Box>

            {/* Sub-Navigation for Approvals */}
            {mainTab === 0 && (
                <Box sx={{
                    px: { xs: 2, md: 4 },
                    py: 3,
                    bgcolor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    position: 'sticky',
                    top: -1,
                    zIndex: 9
                }}>
                    <Paper
                        elevation={0}
                        onClick={() => handleApprovalSubTabChange(0)}
                        sx={{
                            px: 3,
                            py: 2,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            border: '2px solid',
                            borderColor: approvalSubTab === 0 ? '#2563eb' : '#f1f5f9',
                            bgcolor: approvalSubTab === 0 ? alpha('#2563eb', 0.04) : 'white',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                borderColor: approvalSubTab === 0 ? '#2563eb' : '#cbd5e1',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <Box sx={{
                            p: 1.25,
                            borderRadius: '12px',
                            bgcolor: approvalSubTab === 0 ? '#2563eb' : '#f1f5f9',
                            color: approvalSubTab === 0 ? 'white' : '#64748b',
                            display: 'flex'
                        }}>
                            <ReceiptIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color={approvalSubTab === 0 ? '#1e293b' : '#64748b'}>
                                PURCHASE BILLS
                            </Typography>
                            {pendingBillsCount > 0 && (
                                <Chip
                                    label={`${pendingBillsCount} PENDING`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        mt: 0.5,
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        bgcolor: approvalSubTab === 0 ? '#ef4444' : '#fee2e2',
                                        color: 'white',
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            )}
                        </Box>
                    </Paper>

                    <Paper
                        elevation={0}
                        onClick={() => handleApprovalSubTabChange(1)}
                        sx={{
                            px: 3,
                            py: 2,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            border: '2px solid',
                            borderColor: approvalSubTab === 1 ? '#2563eb' : '#f1f5f9',
                            bgcolor: approvalSubTab === 1 ? alpha('#2563eb', 0.04) : 'white',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                borderColor: approvalSubTab === 1 ? '#2563eb' : '#cbd5e1',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <Box sx={{
                            p: 1.25,
                            borderRadius: '12px',
                            bgcolor: approvalSubTab === 1 ? '#3b82f6' : '#f1f5f9',
                            color: approvalSubTab === 1 ? 'white' : '#64748b',
                            display: 'flex'
                        }}>
                            <EditNoteIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color={approvalSubTab === 1 ? '#1e293b' : '#64748b'}>
                                EDIT REQUESTS
                            </Typography>
                            {editRequestsCount > 0 && (
                                <Chip
                                    label={`${editRequestsCount} PENDING`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        mt: 0.5,
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        bgcolor: approvalSubTab === 1 ? '#3b82f6' : '#dbeafe',
                                        color: approvalSubTab === 1 ? 'white' : '#1d4ed8',
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            )}
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Content Display Area */}
            <Box sx={{ mt: mainTab === 0 ? 0 : 4 }}>
                {mainTab === 0 && (
                    <Box sx={{ p: 0 }}>
                        {approvalSubTab === 0 ? (
                            <PurchaseApprovalSection hideHeader={true} />
                        ) : (
                            <PurchaseEditRequestSection hideHeader={true} />
                        )}
                    </Box>
                )}

                {mainTab === 1 && (
                    <Box sx={{ p: 0 }}>
                        <WarehouseReceiveItems hideHeader={true} />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default PurchaseWarehouseHub;
