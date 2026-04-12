import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography, Stack, Button, Chip, TextField, InputAdornment, Grid, Avatar, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
						height: 480,
						width: '100%',
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

/** In dev, same-origin `/api` uses Vite proxy (vite.config.js → localhost:5023). Production uses VITE_API_URL. */
function packingListApiBase() {
	if (import.meta.env.DEV) return '';
	return (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
}

async function fetchPackingListJson(path, queryString) {
	const base = packingListApiBase();
	const url = `${base}/api/PackingList/${path}?${queryString}`;
	const res = await fetch(url);
	const text = await res.text();
	let data = {};
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			const snip = text.replace(/\s+/g, ' ').slice(0, 160);
			throw new Error(`Not JSON (${res.status}): ${snip}`);
		}
	} else if (!res.ok) {
		throw new Error(`Empty response (${res.status} ${res.statusText}). Is the API running on port 5023?`);
	}
	if (!res.ok) {
		const msg = data.message ?? data.title ?? data.error;
		throw new Error(typeof msg === 'string' && msg ? msg : `${res.status} ${res.statusText}`);
	}
	return data;
}

function formatCreatedAt(v) {
	if (v == null || v === '') return '';
	const s = String(v).trim();
	const d = dayjs(s);
	return d.isValid() ? d.format('YYYY-MM-DD') : s;
}

function mapPendingRow(x) {
	const id = String(x.Id ?? x.id ?? '').trim() || `p-${Math.random()}`;
	return {
		id,
		ref: String(x.Billno ?? x.billno ?? x.Salesquoteno ?? x.salesquoteno ?? '').trim(),
		customer: String(x.Customername ?? x.customername ?? '').trim(),
		items: Number(x.ItemsCount ?? x.itemsCount ?? 0),
		qty: Number(x.TotalQty ?? x.totalQty ?? 0),
		createdAt: formatCreatedAt(x.Billdate ?? x.billdate),
		status: 'Pending'
	};
}

function mapProgressRow(x) {
	const id = String(x.Id ?? x.id ?? '').trim() || `g-${Math.random()}`;
	return {
		id,
		ref: String(x.Salesquoteno ?? x.salesquoteno ?? x.Billno ?? x.billno ?? '').trim(),
		customer: String(x.Customerdisplayname ?? x.customerdisplayname ?? '').trim(),
		items: Number(x.ItemsCount ?? x.itemsCount ?? 0),
		qty: Number(x.TotalQty ?? x.totalQty ?? 0),
		createdAt: formatCreatedAt(x.Enterdate ?? x.enterdate),
		status: 'In Progress'
	};
}

function mapApprovedRow(x) {
	const id = String(x.Id ?? x.id ?? '').trim() || `a-${Math.random()}`;
	return {
		id,
		ref: String(x.Salesquoteno ?? x.salesquoteno ?? x.Billno ?? x.billno ?? '').trim(),
		customer: String(x.Customerdisplayname ?? x.customerdisplayname ?? '').trim(),
		items: Number(x.ItemsCount ?? x.itemsCount ?? 0),
		qty: Number(x.TotalQty ?? x.totalQty ?? 0),
		createdAt: formatCreatedAt(x.Enterdate ?? x.enterdate),
		status: 'Approved'
	};
}

const PackingListSection = () => {
	const [tab, setTab] = React.useState(0);
	const [fromDate, setFromDate] = React.useState(dayjs().subtract(30, 'day'));
	const [toDate, setToDate] = React.useState(dayjs());
	const [searchText, setSearchText] = React.useState('');
	const [rowsPerPage, setRowsPerPage] = React.useState(10);
	const [currentPage, setCurrentPage] = React.useState(1);
	const [pendingRows, setPendingRows] = React.useState([]);
	const [progressRows, setProgressRows] = React.useState([]);
	const [approvedRows, setApprovedRows] = React.useState([]);
	const [pendingTotal, setPendingTotal] = React.useState(0);
	const [approvedTotal, setApprovedTotal] = React.useState(0);
	const [loadError, setLoadError] = React.useState('');
	/** Archived list is heavy (N+1 SQL per row on server); load after pending/in-progress so Back from entry is fast */
	const [archivedLoading, setArchivedLoading] = React.useState(false);
	const navigate = useNavigate();

	const handleOpenEntry = React.useCallback(
		(row) => {
			const q = new URLSearchParams({
				ref: row.ref || '',
				customer: row.customer || ''
			});
			navigate(`/stock-packinglist/entry/${encodeURIComponent(String(row.id))}?${q.toString()}`);
		},
		[navigate]
	);

	const listColumns = React.useMemo(
		() => [
			...defaultColumns,
			{
				field: 'actions',
				headerName: 'VIEW',
				width: 100,
				sortable: false,
				filterable: false,
				disableColumnMenu: true,
				renderCell: (params) => (
					<Button
						size="small"
						variant="outlined"
						startIcon={<VisibilityIcon fontSize="small" />}
						onClick={() => handleOpenEntry(params.row)}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 0.25, minWidth: 0 }}
					>
						View
					</Button>
				)
			}
		],
		[handleOpenEntry]
	);

	React.useEffect(() => {
		let cancelled = false;
		const user = JSON.parse(localStorage.getItem('user') || '{}');
		const userid = String(user?.Userid || user?.userid || user?.id || user?.Id || '').trim();
		if (!userid) {
			setLoadError('Not logged in');
			return () => {
				cancelled = true;
			};
		}
		const q = `userid=${encodeURIComponent(userid)}`;
		setLoadError('');
		setArchivedLoading(false);
		setApprovedRows([]);
		setApprovedTotal(0);

		Promise.all([fetchPackingListJson('pending', q), fetchPackingListJson('in-progress', q)])
			.then(([p, pr]) => {
				if (cancelled) return;
				const pList = p.list1 ?? p.List1 ?? [];
				const prList = pr.list1 ?? pr.List1 ?? [];
				setPendingRows(Array.isArray(pList) ? pList.map(mapPendingRow) : []);
				setProgressRows(Array.isArray(prList) ? prList.map(mapProgressRow) : []);
				setPendingTotal(typeof p.totalCount === 'number' ? p.totalCount : pList.length);

				setArchivedLoading(true);
				fetchPackingListJson('archived', q)
					.then((a) => {
						if (cancelled) return;
						const aList = a.list1 ?? a.List1 ?? [];
						setApprovedRows(Array.isArray(aList) ? aList.map(mapApprovedRow) : []);
						setApprovedTotal(typeof a.totalCount === 'number' ? a.totalCount : aList.length);
					})
					.catch(() => {
						if (cancelled) return;
						setApprovedRows([]);
						setApprovedTotal(0);
					})
					.finally(() => {
						if (!cancelled) setArchivedLoading(false);
					});
			})
			.catch((e) => {
				if (!cancelled) setLoadError(e?.message || 'Failed to load packing list');
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const allTabs = [pendingRows, progressRows, approvedRows];

	const filteredRows = React.useMemo(() => {
		const rows = allTabs[tab] || [];
		return rows.filter((r) => {
			const refOk = (r.ref || '').toLowerCase().includes(searchText.toLowerCase());
			// Pending (0) and In Progress (1): show all rows — no From/To date filter
			if (tab === 0 || tab === 1) return refOk;
			const d = dayjs(r.createdAt);
			const dateOk =
				(!fromDate || d.isAfter(fromDate.subtract(1, 'day'))) && (!toDate || d.isBefore(toDate.add(1, 'day')));
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
							<Typography variant="h5" fontWeight={950}>{pendingTotal}</Typography>
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
							<Stack direction="row" alignItems="center" spacing={1}>
								{archivedLoading ? (
									<CircularProgress size={22} thickness={5} sx={{ color: '#10b981' }} />
								) : null}
								<Typography variant="h5" fontWeight={950}>
									{archivedLoading ? '…' : approvedTotal}
								</Typography>
							</Stack>
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

			{loadError ? (
				<Typography variant="body2" color="error" sx={{ px: 1 }}>{loadError}</Typography>
			) : null}

			{/* Filters: From/To dates only on Approved; Pending & In Progress show all rows + reference search */}
			<Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
					{tab === 2 ? (
						<Typography variant="subtitle1" fontWeight={900}>
							History
						</Typography>
					) : (
						<Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ alignSelf: { md: 'center' } }}>
							{tab === 0 ? 'All pending records' : 'All in-progress records'} — filter by reference below
						</Typography>
					)}
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
						{tab === 2 ? (
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
									<DatePicker
										label="From"
										value={fromDate}
										onChange={(v) => setFromDate(v)}
										slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
									/>
									<Typography variant="body2" color="text.secondary">
										to
									</Typography>
									<DatePicker
										label="To"
										value={toDate}
										onChange={(v) => setToDate(v)}
										slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
									/>
								</Stack>
							</LocalizationProvider>
						) : null}
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
			{tab === 0 && <TableBlock title="Pending" rows={pageRows} columns={listColumns} />}
			{tab === 1 && <TableBlock title="In Progress" rows={pageRows} columns={listColumns} />}
			{tab === 2 && archivedLoading && approvedRows.length === 0 ? (
				<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
					<CircularProgress size={28} />
					<Typography variant="body2" color="text.secondary">
						Loading approved list… this can take a moment for large history.
					</Typography>
				</Paper>
			) : null}
			{tab === 2 && !(archivedLoading && approvedRows.length === 0) ? (
				<TableBlock title="Approved" rows={pageRows} columns={listColumns} />
			) : null}

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

