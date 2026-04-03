import React from 'react';
import { Paper, Stack, Typography, TextField, MenuItem, Pagination, useMediaQuery, useTheme } from '@mui/material';

const DataTableFooter = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [5, 10, 25, 50, 100],
    itemLabel = "items",
    sx = {}
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    return (
        <Paper sx={{
            mt: 3,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            bgcolor: 'white',
            border: '1px solid #f1f5f9',
            ...sx
        }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Showing <strong>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> to <strong>{Math.min(indexOfLastItem, totalItems)}</strong> of <strong>{totalItems}</strong> {itemLabel}
                </Typography>

                {!isMobile && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
                        <TextField
                            select
                            size="small"
                            value={itemsPerPage}
                            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2, height: 32 },
                                '& .MuiSelect-select': { py: 0.5, fontSize: '0.85rem', minWidth: 40 }
                            }}
                        >
                            {rowsPerPageOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                )}
            </Stack>

            <Pagination
                count={totalPages}
                page={currentPage}
                onChange={onPageChange}
                color="primary"
                shape="rounded"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
                sx={{
                    '& .MuiPaginationItem-root': {
                        fontWeight: 700,
                        borderRadius: 1.5,
                        '&.Mui-selected': {
                            bgcolor: '#cc3d3e',
                            color: 'white',
                            '&:hover': { bgcolor: '#b91c1c' }
                        }
                    }
                }}
            />
        </Paper>
    );
};

export default DataTableFooter;
