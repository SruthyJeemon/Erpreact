import React from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const TableBlock = ({ title, rows, columns }) => {
	return (
		<Paper sx={{ p: 2, width: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 2 }}>
			<Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>{title}</Typography>
			<div style={{ width: '100%' }}>
				<DataGrid
					autoHeight
					rows={rows}
					columns={columns}
					pageSize={10}
					rowsPerPageOptions={[10, 25, 50]}
					disableSelectionOnClick
					getRowId={(r) => r.id || r.Id || r.ID}
				/>
			</div>
		</Paper>
	);
};

const defaultColumns = [
	{ field: 'ref', headerName: 'Ref No', flex: 1, minWidth: 140 },
	{ field: 'customer', headerName: 'Customer', flex: 1, minWidth: 160 },
	{ field: 'items', headerName: 'Items', width: 100 },
	{ field: 'qty', headerName: 'Qty', width: 100 },
	{ field: 'createdAt', headerName: 'Created', flex: 1, minWidth: 140 },
	{ field: 'status', headerName: 'Status', width: 120 }
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

	const pendingRows = React.useMemo(() => sample('Pending'), []);
	const progressRows = React.useMemo(() => sample('In Progress'), []);
	const approvedRows = React.useMemo(() => sample('Approved'), []);

	return (
		<Box sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Paper sx={{ px: 1, bgcolor: '#f8fafc', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					variant="scrollable"
					scrollButtons="auto"
				>
					<Tab label="Pending" />
					<Tab label="In Progress" />
					<Tab label="Approved" />
				</Tabs>
			</Paper>

			{tab === 0 && <TableBlock title="Pending" rows={pendingRows} columns={defaultColumns} />}
			{tab === 1 && <TableBlock title="In Progress" rows={progressRows} columns={defaultColumns} />}
			{tab === 2 && <TableBlock title="Approved" rows={approvedRows} columns={defaultColumns} />}
		</Box>
	);
};

export default PackingListSection;

