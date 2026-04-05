import React from 'react';
import { Box, Tabs, Tab, Paper, Typography, Stack, Button, Chip, TextField, InputAdornment, Grid, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DataTableFooter from './DataTableFooter';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const TableBlock = ({ title, rows, columns }) => {
	return (
		<Paper sx={{ p: 2, width: '100%', border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2, overflow: 'hidden' }}>
			<Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700, color: '#0f172a' }}>{title}</Typography>
			<div style={{ width: '100%' }}>
				<DataGrid
					autoHeight
					rows={rows}
					columns={columns}
					pageSizeOptions={[10, 25, 50]}
					headerHeight={52}
					disableSelectionOnClick
					hideFooter
					getRowId={(r) => r.id || r.Id || r.ID}
					slots={{ toolbar: GridToolbar }}
					slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
					initialState={{
						pagination: { paginationModel: { pageSize: 10, page: 0 } }
					}}
					sx={{
						border: 'none',
						'& .MuiDataGrid-columnHeaders': {
							backgroundColor: '#2C3E50',
							color: '#ffffff',
							borderBottom: '1px solid #e2e8f0'
						},
						'& .MuiDataGrid-columnHeadersInner': {
							backgroundColor: '#2C3E50'
						},
						'& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitleContainer': {
							backgroundColor: '#2C3E50',
							color: '#ffffff'
						},
						'& .MuiDataGrid-columnHeader': {
							color: '#ffffff',
							fontWeight: 800
						},
						'& .MuiDataGrid-columnHeaderTitle': { fontWeight: 800 },
						'& .MuiDataGrid-columnSeparator': { display: 'none' },
						'& .MuiDataGrid-row:hover': { bgcolor: '#f8fafc' },
						'& .MuiDataGrid-cell': { color: '#334155' },
						'& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0' },
						'& .MuiDataGrid-toolbarContainer': { p: 1 }
					}}
				/>
			</div>
		</Paper>
	);
};

const defaultColumns = [
	{ field: 'ref', headerName: 'REF NO', flex: 1, minWidth: 140 },
	{ field: 'customer', headerName: 'CUSTOMER', flex: 1, minWidth: 160 },
	{ field: 'items', headerName: 'ITEMS', width: 100 },
	{ field: 'qty', headerName: 'QTY', width: 100 },
	{ field: 'createdAt', headerName: 'CREATED', flex: 1, minWidth: 140 },
	{
		field: 'status',
		headerName: 'STATUS',
		width: 160,
		renderCell: (params) => {
			const value = String(params.value || '').toLowerCase();
			const palette = value.includes('approved')
				? { bg: alpha('#16a34a', 0.12), color: '#15803d' }
				: value.includes('progress')
				? { bg: alpha('#2563eb', 0.12), color: '#1d4ed8' }
				: { bg: alpha('#f59e0b', 0.12), color: '#b45309' };
			return (
				<Chip
					label={params.value}
					size="small"
					sx={{ bgcolor: palette.bg, color: palette.color, fontWeight: 700 }}
				/>
			);
		}
	}
];

const sample = (status) => Array.from({ length: 12 }).map((_, i) => ({
	id: `${status}-${i + 1}`,
	ref: `PK-${String(1000 + i)}`,
	customer: ['Acme Co.', 'Globex', 'Initech'][i % 3],
	items: (i % 5) + 1,
	qty: (i % 7) + 2,
	createdAt: '2026-04-04',
	status
}));

const PackingListSection = () => {
	const [tab, setTab] = React.useState(0);
	const [fromDate, setFromDate] = React.useState(dayjs().subtract(30, 'day'));
	const [toDate, setToDate] = React.useState(dayjs());
	const [searchText, setSearchText] = React.useState('');
	const [rowsPerPage, setRowsPerPage] = React.useState(10);
	const [currentPage, setCurrentPage] = React.useState(1);

	const pendingRows = React.useMemo(() => sample('Pending'), []);
	const progressRows = React.useMemo(() => sample('In Progress'), []);
	const approvedRows = React.useMemo(() => sample('Approved'), []);

	const allTabs = [pendingRows, progressRows, approvedRows];

	const filteredRows = React.useMemo(() => {
		const rows = allTabs[tab] || [];
		return rows.filter(r => {
			const refOk = (r.ref || '').toLowerCase().includes(searchText.toLowerCase());
			const d = dayjs(r.createdAt);
			const dateOk = (!fromDate || d.isAfter(fromDate.subtract(1, 'day'))) && (!toDate || d.isBefore(toDate.add(1, 'day')));
			return refOk && dateOk;
		});
	}, [tab, allTabs, searchText, fromDate, toDate]);

	React.useEffect(() => { setCurrentPage(1); }, [tab, searchText, fromDate, toDate]);

	const startIndex = (currentPage - 1) * rowsPerPage;
	const pageRows = React.useMemo(() => filteredRows.slice(startIndex, startIndex + rowsPerPage), [filteredRows, startIndex, rowsPerPage]);

	return (
		<Box sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
			{/* Header with title and primary action */}
			<Paper sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Packing List</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
					>
						Create Packing List
					</Button>
				</Stack>
			</Paper>

			{/* Stats */}
			<Grid container spacing={2}>
				<Grid item xs={12} sm="auto">
					<Paper sx={{ p: 2.5, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 300 } }}>
						<Avatar sx={{ bgcolor: alpha('#3b82f6', 0.12), color: '#3b82f6', borderRadius: '12px' }}>
							<AccessTimeIcon />
						</Avatar>
						<Box>
							<Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase' }}>Pending</Typography>
							<Typography variant="h5" fontWeight={950}>{pendingRows.length}</Typography>
						</Box>
					</Paper>
				</Grid>
				<Grid item xs={12} sm="auto">
					<Paper sx={{ p: 2.5, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 300 } }}>
						<Avatar sx={{ bgcolor: alpha('#10b981', 0.12), color: '#10b981', borderRadius: '12px' }}>
							<CheckCircleIcon />
						</Avatar>
						<Box>
							<Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase' }}>Approved</Typography>
							<Typography variant="h5" fontWeight={950}>{approvedRows.length}</Typography>
						</Box>
					</Paper>
				</Grid>
			</Grid>

			{/* Tabs filter */}
			<Paper sx={{ px: 1, bgcolor: '#f8fafc', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						'& .MuiTab-root': { textTransform: 'none', fontWeight: 800, minHeight: '52px', color: '#64748b' },
						'& .Mui-selected': { color: '#2563eb !important' },
						'& .MuiTabs-indicator': { bgcolor: '#2563eb' }
					}}
				>
					<Tab label="Pending" />
					<Tab label="In Progress" />
					<Tab label="Approved" />
				</Tabs>
			</Paper>

			{/* Filters row */}
			<Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
					<Typography variant="subtitle1" fontWeight={900}>History</Typography>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<Stack direction="row" spacing={1} alignItems="center">
								<DatePicker
									label="From"
									value={fromDate}
									onChange={(v) => setFromDate(v)}
									slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
								/>
								<Typography variant="body2" color="text.secondary">to</Typography>
								<DatePicker
									label="To"
									value={toDate}
									onChange={(v) => setToDate(v)}
									slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
								/>
							</Stack>
						</LocalizationProvider>
						<TextField
							placeholder="Search reference..."
							size="small"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							InputProps={{
								startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
								sx: { borderRadius: '10px' }
							}}
							sx={{ width: { xs: '100%', sm: 250 } }}
						/>
					</Stack>
				</Stack>
			</Paper>

			{/* Data table */}
			{tab === 0 && <TableBlock title="Pending" rows={pageRows} columns={defaultColumns} />}
			{tab === 1 && <TableBlock title="In Progress" rows={pageRows} columns={defaultColumns} />}
			{tab === 2 && <TableBlock title="Approved" rows={pageRows} columns={defaultColumns} />}

			<DataTableFooter
				totalItems={filteredRows.length}
				itemsPerPage={rowsPerPage}
				currentPage={currentPage}
				onPageChange={(_, p) => setCurrentPage(p)}
				onRowsPerPageChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }}
				itemLabel="movements"
				sx={{ mt: 0, mb: '20px' }}
			/>
		</Box>
	);
};

export default PackingListSection;

