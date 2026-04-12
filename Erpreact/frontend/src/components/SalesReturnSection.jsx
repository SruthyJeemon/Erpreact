import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    CircularProgress,
    Stack,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

const SalesReturnSection = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [returnData, setReturnData] = useState([]);
    const API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\/$/, '');

    useEffect(() => {
        fetchReturnData();
    }, [tabValue]);

    const fetchReturnData = async () => {
        setLoading(true);
        try {
            // Simplified fetch logic for demonstration
            // In a real scenario, this would call specialized API endpoints
            const response = await fetch(`${API_URL}/api/SalesReturn/getreturns?tab=${tabValue}`);
            const data = await response.json();
            if (data.success) {
                setReturnData(data.list || []);
            } else {
                setReturnData([]);
            }
        } catch (error) {
            console.error('Error fetching sales return data:', error);
            setReturnData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Sales Return
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                >
                    Add Sales Return
                </Button>
            </Stack>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Pending Returns" />
                    <Tab label="Archived Returns" />
                </Tabs>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Return No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Warehouse</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : returnData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No sales return records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returnData.map((row) => (
                                    <TableRow key={row.Id} hover>
                                        <TableCell>{row.Returnno}</TableCell>
                                        <TableCell>{row.Customer}</TableCell>
                                        <TableCell>{row.Date ? new Date(row.Date).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>{row.Warehouse}</TableCell>
                                        <TableCell>
                                            <Chip label={row.Status} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary">
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default SalesReturnSection;
